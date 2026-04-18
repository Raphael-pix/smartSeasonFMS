import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CropStage } from 'generated/prisma/enums';

export class UpdateFieldDto {
  @ApiPropertyOptional({ example: 'Kiptoo South Plot' })
  @IsOptional()
  @IsString()
  @MaxLength(150)
  name?: string;

  @ApiPropertyOptional({ example: 'Beans' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  cropType?: string;

  @ApiPropertyOptional({ enum: CropStage })
  @IsOptional()
  @IsEnum(CropStage)
  currentStage?: CropStage;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSize?: number;

  @ApiPropertyOptional({
    description: 'UUID of agent to assign (null to unassign)',
  })
  @IsOptional()
  @IsUUID()
  agentId?: string;
}
