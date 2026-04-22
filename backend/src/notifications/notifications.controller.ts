import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { NotificationsService } from './notifications.service';
import { QueryNotificationsDto } from './dto/query-notifications.dto';

@ApiTags('Notifications')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard)
@Controller({ path: 'notifications', version: '1' })
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({
    summary: 'List your notifications (farm-scoped)',
    description: 'Returns paginated list of notifications for the current user',
  })
  list(@Query() query: QueryNotificationsDto, @CurrentUser() user: JwtUser) {
    return this.notificationsService.list(query, user);
  }

  @Get('unread-count')
  @ApiOperation({
    summary: 'Get count of unread notifications',
    description: 'Used to show badge count in UI',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { unreadCount: 3 },
    },
  })
  async getUnreadCount(@CurrentUser() user: JwtUser) {
    const unreadCount = await this.notificationsService.getUnreadCount(user);
    return { unreadCount };
  }

  @Patch(':id/read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark a notification as read',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: {
        id: 'uuid-here',
        type: 'FIELD_AT_RISK',
        title: '⚠️ Kiptoo North Plot requires attention',
        isRead: true,
        readAt: '2025-04-22T10:35:00Z',
      },
    },
  })
  markAsRead(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.notificationsService.markAsRead(id, user);
  }

  @Patch('read/all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Mark all unread notifications as read',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { message: 'Marked 3 notifications as read' },
    },
  })
  markAllAsRead(@CurrentUser() user: JwtUser) {
    return this.notificationsService.markAllAsRead(user);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a notification',
  })
  @ApiResponse({
    status: 200,
    schema: {
      example: { message: 'Notification deleted' },
    },
  })
  delete(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: JwtUser) {
    return this.notificationsService.delete(id, user);
  }
}
