import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import type { Job } from 'bull';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { FieldsService } from '@/fields/fields.service';
import { NotificationsService } from '@/notifications/notifications.service';
import { AppConfig } from '@/config/configuration';

import {
  JOB_RECOMPUTE_ALL_STATUSES,
  JOB_RECOMPUTE_FIELD_STATUS,
  QUEUE_FIELD_STATUS,
} from '../jobs.constants';
import { FieldStatus } from '@/fields/types/field-status.types';

@Processor(QUEUE_FIELD_STATUS)
export class FieldStatusProcessor {
  private readonly logger = new Logger(FieldStatusProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly fieldsService: FieldsService,
    private readonly notificationsService: NotificationsService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Process(JOB_RECOMPUTE_ALL_STATUSES)
  async recomputeAll() {
    this.logger.log('Starting: recompute all field statuses');

    const fields = await this.prisma.field.findMany({
      where: { isArchived: false },
      select: {
        id: true,
        currentStage: true,
        lastUpdatedAt: true,
        plantingDate: true,
        name: true,
        cropType: true,
        agentId: true,
        farmId: true,
      },
    });

    const ttl = this.config.get('cache.ttlFieldStatus', { infer: true });
    let warmed = 0;
    let atRiskCount = 0;

    for (const field of fields) {
      const status = this.fieldsService.computeStatus(field);
      const key = this.cache.fieldStatusKey(field.id);
      await this.cache.set(key, status, ttl);
      warmed++;

      if (status === FieldStatus.AT_RISK) {
        await this.handleAtRiskTransition(field);
        atRiskCount++;
      }
    }

    this.logger.log(
      `Completed: warmed status cache for ${warmed} fields (${atRiskCount} at risk)`,
    );
    return { warmed, atRiskCount };
  }

  @Process(JOB_RECOMPUTE_FIELD_STATUS)
  async recomputeOne(job: Job<{ fieldId: string }>) {
    const { fieldId } = job.data;

    const field = await this.prisma.field.findUnique({
      where: { id: fieldId },
      select: {
        id: true,
        currentStage: true,
        lastUpdatedAt: true,
        plantingDate: true,
        name: true,
        cropType: true,
        agentId: true,
        farmId: true,
      },
    });

    if (!field) {
      this.logger.warn(`Field ${fieldId} not found during status recompute`);
      return;
    }

    const status = this.fieldsService.computeStatus(field);
    const ttl = this.config.get('cache.ttlFieldStatus', { infer: true });
    await this.cache.set(this.cache.fieldStatusKey(fieldId), status, ttl);
    if (status === FieldStatus.AT_RISK) {
      await this.handleAtRiskTransition(field);
    }

    this.logger.debug(`Recomputed status for field ${fieldId}: ${status}`);
    return { fieldId, status };
  }

  private async handleAtRiskTransition(field: {
    id: string;
    farmId: string;
    name: string;
    cropType: string;
    agentId: string | null;
  }): Promise<void> {
    try {
      const hasRecent =
        await this.notificationsService.hasRecentAtRiskNotification(
          field.id,
          field.farmId,
          24,
        );

      if (hasRecent) {
        this.logger.debug(
          `[fieldId=${field.id}] Already notified in last 24 hours; skipping`,
        );
        return;
      }

      await this.notificationsService.notifyFieldAtRisk(
        field.id,
        {
          name: field.name,
          cropType: field.cropType,
          agentId: field.agentId,
        },
        field.farmId,
      );

      this.logger.debug(`[fieldId=${field.id}] Created AT_RISK notification`);
    } catch (err) {
      this.logger.error(
        `[fieldId=${field.id}] Failed to create AT_RISK notification: ${err}`,
      );
    }
  }
}
