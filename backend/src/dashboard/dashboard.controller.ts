import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { DashboardService } from './dashboard.service';

@ApiTags('Dashboard')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'dashboard', version: '1' })
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('admin')
  @Roles(Role.ADMIN)
  @ApiOperation({
    summary: 'Admin dashboard — full system overview [Admin]',
    description:
      'Returns total fields, status breakdown, at-risk fields, recent updates, ' +
      'and stage distribution. Response is cached in Redis (TTL: 2 min).',
  })
  getAdminDashboard() {
    return this.dashboardService.getAdminDashboard();
  }

  @Get('agent')
  @ApiOperation({
    summary: 'Agent dashboard — personal field overview',
    description:
      'Returns assigned fields with computed status, recent activity, ' +
      'and fields requiring attention. Cached per agent in Redis.',
  })
  getAgentDashboard(@CurrentUser() user: JwtUser) {
    return this.dashboardService.getAgentDashboard(user);
  }
}
