import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { ConfigService } from '@nestjs/config';

import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { DashboardService } from '@/dashboard/dashboard.service';
import { AppConfig } from '@/config/configuration';

import {
  JOB_REFRESH_ADMIN_DASHBOARD,
  JOB_REFRESH_AGENT_DASHBOARD,
  QUEUE_DASHBOARD,
} from '../jobs.constants';

@Processor(QUEUE_DASHBOARD)
export class DashboardProcessor {
  private readonly logger = new Logger(DashboardProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly dashboardService: DashboardService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  @Process(JOB_REFRESH_ADMIN_DASHBOARD)
  async refreshAdmin() {
    this.logger.log('Refreshing admin dashboard cache');

    const farms = await this.prisma.farm.findMany({
      where: {
        isActive: true,
        users: { some: { role: Role.ADMIN, isActive: true } },
      },
    });

    const ttl = this.config.get('cache.ttlDashboard', { infer: true });
    let refreshed = 0;

    for (const farm of farms) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        const fakeAdminCtx = { farmId: farm.id } as any;
        const data =
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
          await this.dashboardService.buildAdminDashboard(fakeAdminCtx);
        await this.cache.set(
          this.cache.dashboardKey(`admin:${farm.id}`),
          data,
          ttl,
        );
        refreshed++;
      } catch (err) {
        this.logger.warn(
          `Failed to refresh admin dashboard for farm ${farm.id}: ${err}`,
        );
      }
    }

    this.logger.log(
      `Admin dashboard caches refreshed: ${refreshed}/${farms.length} farms`,
    );
    return { refreshed, total: farms.length };
  }

  @Process(JOB_REFRESH_AGENT_DASHBOARD)
  async refreshAgentDashboards() {
    this.logger.log('Refreshing agent dashboard caches');

    const agents = await this.prisma.user.findMany({
      where: {
        role: Role.AGENT,
        isActive: true,
        farmId: { not: null },
        assignedFields: { some: { isArchived: false } },
      },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
        farmId: true,
      },
    });

    const ttl = this.config.get('cache.ttlDashboard', { infer: true });
    let refreshed = 0;

    for (const agent of agents) {
      try {
        const data = await this.dashboardService.buildAgentDashboard({
          ...agent,
          farmId: agent.farmId!,
        });
        await this.cache.set(
          this.cache.dashboardKey(`agent:${agent.id}`),
          data,
          ttl,
        );
        refreshed++;
      } catch (err) {
        // Don't fail the whole job if one agent's dashboard errors
        this.logger.warn(
          `Failed to refresh dashboard for agent ${agent.id}: ${err}`,
        );
      }
    }

    this.logger.log(
      `Agent dashboard caches refreshed: ${refreshed}/${agents.length}`,
    );
    return { refreshed, total: agents.length };
  }
}
