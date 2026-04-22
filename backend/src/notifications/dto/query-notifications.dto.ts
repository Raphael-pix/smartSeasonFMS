import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional, IsNumber } from 'class-validator';

export class QueryNotificationsDto {
  @ApiPropertyOptional({
    example: false,
    description: 'If true, only return unread notifications',
  })
  @IsOptional()
  @IsBoolean()
  unreadOnly?: boolean;

  @ApiPropertyOptional({
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsNumber()
  page?: number;

  @ApiPropertyOptional({
    example: 20,
    default: 20,
  })
  @IsOptional()
  @IsNumber()
  limit?: number;
}
