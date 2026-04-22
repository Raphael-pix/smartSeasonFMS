import { NotificationType } from 'generated/prisma/enums';
import { IsEnum, IsString, IsOptional, IsObject } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import type { FieldAtRiskMetadata } from '../types';

export class CreateNotificationDto {
  @ApiProperty({
    enum: NotificationType,
    example: NotificationType.FIELD_AT_RISK,
  })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({
    example: '⚠️ Kiptoo North Plot requires attention',
  })
  @IsString()
  title: string;

  @ApiProperty({
    example: 'Maize field has not been updated in 7 days',
  })
  @IsString()
  message: string;

  @ApiPropertyOptional({
    example: {
      fieldId: 'uuid-here',
      fieldName: 'Kiptoo North Plot',
      cropType: 'Maize',
      agentId: 'agent-uuid',
    },
    description: 'Additional context for the notification',
  })
  @IsOptional()
  @IsObject()
  metadata?: FieldAtRiskMetadata;
}
