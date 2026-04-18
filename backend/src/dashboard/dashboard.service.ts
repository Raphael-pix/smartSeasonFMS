import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CropStage, Role } from 'generated/prisma/enums';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { FieldsService } from '@/fields/fields.service';
import { UpdatesService } from '@/updates/updates.service';
import { AppConfig } from '@/config/configuration';
import { JwtUser } from '@/auth/types/request-user.type';
import { FieldStatus } from '@/fields/types/field-status.types';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly fieldsService: FieldsService,
    private readonly updatesService: UpdatesService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async getAdminDashboard() {
    const cacheKey = this.cache.dashboardKey('admin');
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug('Admin dashboard served from cache');
      return cached;
    }

    const data = await this.buildAdminDashboard();

    await this.cache.set(
      cacheKey,
      data,
      this.config.get('cache.ttlDashboard', { infer: true }),
    );

    return data;
  }

  async buildAdminDashboard() {
    const [
      totalFields,
      statusCounts,
      recentUpdates,
      atRiskFields,
      stageBreakdown,
      activeAgents,
    ] = await Promise.all([
      this.prisma.field.count({ where: { isArchived: false } }),

      this.fieldsService.countByStatus(),

      this.updatesService.findRecent(10),

      this.getAtRiskFields(),

      this.getStageBreakdown(),

      this.prisma.user.count({
        where: {
          role: Role.AGENT,
          isActive: true,
          assignedFields: { some: { isArchived: false } },
        },
      }),
    ]);

    return {
      summary: {
        totalFields,
        activeAgents,
        byStatus: statusCounts,
        byStage: stageBreakdown,
      },
      atRiskFields,
      recentUpdates,
      generatedAt: new Date().toISOString(),
    };
  }

  async getAgentDashboard(user: JwtUser) {
    const cacheKey = this.cache.dashboardKey(`agent:${user.id}`);
    const cached = await this.cache.get(cacheKey);
    if (cached) {
      this.logger.debug(`Agent dashboard for ${user.id} served from cache`);
      return cached;
    }

    const data = await this.buildAgentDashboard(user);

    await this.cache.set(
      cacheKey,
      data,
      this.config.get('cache.ttlDashboard', { infer: true }),
    );

    return data;
  }

  async buildAgentDashboard(user: JwtUser) {
    const agentId = user.id;
    // const atRiskThreshold = this.config.get('fieldStatus.atRiskThresholdDays', {
    //   infer: true,
    // });

    const [assignedFields, recentUpdates] = await Promise.all([
      this.prisma.field.findMany({
        where: { agentId, isArchived: false },
        select: {
          id: true,
          name: true,
          cropType: true,
          currentStage: true,
          lastUpdatedAt: true,
          plantingDate: true,
          coverImageUrl: true,
          location: {
            select: { county: true, subCounty: true },
          },
        },
        orderBy: { lastUpdatedAt: 'desc' },
      }),

      this.prisma.fieldUpdate.findMany({
        where: { agentId },
        take: 5,
        orderBy: { observedAt: 'desc' },
        select: {
          id: true,
          stage: true,
          notes: true,
          observedAt: true,
          field: { select: { id: true, name: true } },
        },
      }),
    ]);

    const fieldsWithStatus = assignedFields.map((f) => ({
      ...f,
      status: this.fieldsService.computeStatus(f),
    }));

    const statusCounts = fieldsWithStatus.reduce(
      (acc, f) => {
        acc[f.status] = (acc[f.status] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const attention = fieldsWithStatus
      .filter((f) => f.status === FieldStatus.AT_RISK)
      .slice(0, 5);

    return {
      summary: {
        totalAssigned: assignedFields.length,
        byStatus: statusCounts,
      },
      attentionRequired: attention,
      assignedFields: fieldsWithStatus,
      recentActivity: recentUpdates,
      generatedAt: new Date().toISOString(),
    };
  }

  private async getAtRiskFields() {
    const threshold = this.config.get('fieldStatus.atRiskThresholdDays', {
      infer: true,
    });
    const cutoff = dayjs().subtract(threshold, 'day').toDate();

    return this.prisma.field.findMany({
      where: {
        isArchived: false,
        currentStage: { not: CropStage.HARVESTED },
        OR: [{ lastUpdatedAt: null }, { lastUpdatedAt: { lt: cutoff } }],
      },
      select: {
        id: true,
        name: true,
        cropType: true,
        currentStage: true,
        lastUpdatedAt: true,
        plantingDate: true,
        agent: { select: { id: true, fullName: true, email: true } },
        location: { select: { county: true, subCounty: true } },
      },
      orderBy: { lastUpdatedAt: 'asc' },
      take: 20,
    });
  }

  private async getStageBreakdown(): Promise<Record<CropStage, number>> {
    const counts = await this.prisma.field.groupBy({
      by: ['currentStage'],
      where: { isArchived: false },
      _count: { id: true },
    });

    const result = Object.values(CropStage).reduce(
      (acc, stage) => {
        acc[stage] = 0;
        return acc;
      },
      {} as Record<CropStage, number>,
    );

    for (const row of counts) {
      result[row.currentStage] = row._count.id;
    }

    return result;
  }
}
