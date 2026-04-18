import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';
import { CropStage } from 'generated/prisma/enums';

export class CreateLocationDto {
  @ApiProperty({ example: 'Nakuru' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  county: string;

  @ApiPropertyOptional({ example: 'Naivasha' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  subCounty?: string;

  @ApiPropertyOptional({ example: 'Mirera' })
  @IsOptional()
  @IsString()
  @MaxLength(100)
  ward?: string;

  @ApiPropertyOptional({ example: -0.7286 })
  @IsOptional()
  @IsNumber()
  latitude?: number;

  @ApiPropertyOptional({ example: 36.4298 })
  @IsOptional()
  @IsNumber()
  longitude?: number;
}

export class CreateFieldDto {
  @ApiProperty({ example: 'Kiptoo North Plot' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiProperty({ example: 'Maize' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  cropType: string;

  @ApiProperty({ example: '2025-03-15' })
  @IsDateString()
  plantingDate: string;

  @ApiPropertyOptional({ enum: CropStage, default: CropStage.PLANTED })
  @IsOptional()
  @IsEnum(CropStage)
  currentStage?: CropStage;

  @ApiPropertyOptional({ example: 'Sandy loam soil near riverbank' })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({ example: 2.5, description: 'Area in hectares' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  areaSize?: number;

  @ApiPropertyOptional({ description: 'UUID of the agent to assign' })
  @IsOptional()
  @IsUUID()
  agentId?: string;

  @ApiProperty({ type: CreateLocationDto })
  location: CreateLocationDto;
}
