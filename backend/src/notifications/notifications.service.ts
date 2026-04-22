import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { NotificationType } from 'generated/prisma/enums';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { QueryNotificationsDto } from './dto/query-notifications.dto';
import { Prisma } from 'generated/prisma/client';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/config/configuration';

const NOTIFICATION_SELECT = {
  id: true,
  userId: true,
  type: true,
  title: true,
  message: true,
  metadata: true,
  isRead: true,
  readAt: true,
  createdAt: true,
} as const;

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async create(
    dto: CreateNotificationDto,
    farmId: string,
    userIds: string[],
  ): Promise<void> {
    if (userIds.length === 0) {
      this.logger.warn(
        `[farmId=${farmId}] No recipients for notification type=${dto.type}`,
      );
      return;
    }

    try {
      await this.prisma.notification.createMany({
        data: userIds.map((userId) => ({
          userId,
          farmId,
          fieldId: dto.metadata?.fieldId,
          type: dto.type,
          title: dto.title,
          message: dto.message,
          metadata: dto.metadata ? this.toJson(dto.metadata) : undefined,
        })),
        skipDuplicates: true,
      });

      this.logger.debug(
        `[farmId=${farmId}] Created ${dto.type} notification for ${userIds.length} users`,
      );
    } catch (err) {
      this.logger.error(
        `[farmId=${farmId}] Failed to create notification: ${err}`,
      );
    }
  }

  async notifyFieldAtRisk(
    fieldId: string,
    field: {
      name: string;
      cropType: string;
      agentId: string | null;
    },
    farmId: string,
  ): Promise<void> {
    const adminIds = await this.prisma.user.findMany({
      where: {
        farmId,
        role: 'ADMIN',
        isActive: true,
      },
      select: { id: true },
    });

    const recipientIds = adminIds.map((admin) => admin.id);

    if (field.agentId) {
      const agent = await this.prisma.user.findFirst({
        where: { id: field.agentId, farmId, isActive: true },
        select: { id: true },
      });
      if (agent && !recipientIds.includes(agent.id)) {
        recipientIds.push(agent.id);
      }
    }

    const title = `⚠️ ${field.name} requires attention`;
    const message = `${field.cropType} field has not been updated in ${this.config.get('fieldStatus.atRiskThresholdDays', { infer: true })} days`;

    await this.create(
      {
        type: NotificationType.FIELD_AT_RISK,
        title,
        message,
        metadata: {
          fieldId,
          fieldName: field.name,
          cropType: field.cropType,
          agentId: field.agentId,
        },
      },
      farmId,
      recipientIds,
    );
  }

  async list(query: QueryNotificationsDto, user: JwtUser) {
    const { unreadOnly = false, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.NotificationWhereInput = {
      userId: user.id,
      farmId: user.farmId,
      ...(unreadOnly && { isRead: false }),
    };

    const [notifications, total] = await this.prisma.$transaction([
      this.prisma.notification.findMany({
        where,
        select: NOTIFICATION_SELECT,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      data: notifications,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        unreadCount: unreadOnly
          ? notifications.length
          : await this.getUnreadCount(user),
      },
    };
  }

  async getUnreadCount(user: JwtUser): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId: user.id,
        farmId: user.farmId,
        isRead: false,
      },
    });
  }

  async markAsRead(id: string, user: JwtUser) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id, farmId: user.farmId },
      select: { id: true, isRead: true },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
      select: NOTIFICATION_SELECT,
    });
  }

  async markAllAsRead(user: JwtUser) {
    const result = await this.prisma.notification.updateMany({
      where: {
        userId: user.id,
        farmId: user.farmId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });

    return { message: `Marked ${result.count} notifications as read` };
  }

  async delete(id: string, user: JwtUser) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId: user.id, farmId: user.farmId },
    });

    if (!notification) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    await this.prisma.notification.delete({ where: { id } });

    return { message: 'Notification deleted' };
  }

  async hasRecentAtRiskNotification(
    fieldId: string,
    farmId: string,
    hoursThreshold = 24,
  ): Promise<boolean> {
    const recent = await this.prisma.notification.findFirst({
      where: {
        farmId,
        fieldId,
        type: NotificationType.FIELD_AT_RISK,
        createdAt: {
          gte: dayjs().subtract(hoursThreshold, 'hour').toDate(),
        },
      },
    });

    return !!recent;
  }

  private toJson(value: unknown): Prisma.InputJsonValue {
    return value as Prisma.InputJsonValue;
  }
}
