import { InjectQueue } from '@nestjs/bull';
import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import type { Queue } from 'bull';

import {
  JOB_RECOMPUTE_ALL_STATUSES,
  JOB_REFRESH_ADMIN_DASHBOARD,
  JOB_REFRESH_AGENT_DASHBOARD,
  QUEUE_DASHBOARD,
  QUEUE_FIELD_STATUS,
} from './jobs.constants';

@Injectable()
export class JobsScheduler implements OnApplicationBootstrap {
  private readonly logger = new Logger(JobsScheduler.name);

  constructor(
    @InjectQueue(QUEUE_FIELD_STATUS)
    private readonly fieldStatusQueue: Queue,

    @InjectQueue(QUEUE_DASHBOARD)
    private readonly dashboardQueue: Queue,
  ) {}

  async onApplicationBootstrap() {
    await this.scheduleFieldStatusRecompute();
    await this.scheduleDashboardRefresh();
    this.logger.log('✅ Background jobs scheduled');
  }

  private async scheduleFieldStatusRecompute() {
    await this.fieldStatusQueue.add(
      JOB_RECOMPUTE_ALL_STATUSES,
      {},
      {
        repeat: { cron: '*/10 * * * *' },
        jobId: JOB_RECOMPUTE_ALL_STATUSES,
        removeOnComplete: true,
      },
    );
    this.logger.debug('Scheduled: recompute-all-statuses (every 10 min)');
  }

  private async scheduleDashboardRefresh() {
    await this.dashboardQueue.add(
      JOB_REFRESH_ADMIN_DASHBOARD,
      {},
      {
        repeat: { cron: '*/5 * * * *' },
        jobId: JOB_REFRESH_ADMIN_DASHBOARD,
        removeOnComplete: true,
      },
    );

    await this.dashboardQueue.add(
      JOB_REFRESH_AGENT_DASHBOARD,
      {},
      {
        repeat: { cron: '*/5 * * * *' },
        jobId: JOB_REFRESH_AGENT_DASHBOARD,
        removeOnComplete: true,
      },
    );
    this.logger.debug('Scheduled: dashboard refresh (every 5 min)');
  }
}
