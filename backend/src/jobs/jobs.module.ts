import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';

import { FieldsModule } from '@/fields/fields.module';
import { DashboardModule } from '@/dashboard/dashboard.module';

import { QUEUE_FIELD_STATUS, QUEUE_DASHBOARD } from './jobs.constants';
import { JobsScheduler } from './jobs.scheduler';
import { FieldStatusProcessor } from './processors/field-status.processor';
import { DashboardProcessor } from './processors/dashboard.processor';

@Module({
  imports: [
    BullModule.registerQueue(
      { name: QUEUE_FIELD_STATUS },
      { name: QUEUE_DASHBOARD },
    ),
    FieldsModule,
    DashboardModule,
  ],
  providers: [JobsScheduler, FieldStatusProcessor, DashboardProcessor],
})
export class JobsModule {}
