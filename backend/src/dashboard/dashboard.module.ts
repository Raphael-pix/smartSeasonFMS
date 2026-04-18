import { Module } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { DashboardController } from './dashboard.controller';
import { FieldsModule } from '@/fields/fields.module';
import { UpdatesModule } from '@/updates/updates.module';

@Module({
  imports: [FieldsModule, UpdatesModule],
  controllers: [DashboardController],
  providers: [DashboardService],
  exports: [DashboardService],
})
export class DashboardModule {}
