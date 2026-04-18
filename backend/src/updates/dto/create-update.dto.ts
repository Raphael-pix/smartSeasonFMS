import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsEnum,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
} from 'class-validator';
import { CropStage } from 'generated/prisma/enums';

export class CreateUpdateDto {
  @ApiProperty({ enum: CropStage })
  @IsEnum(CropStage)
  stage: CropStage;

  @ApiPropertyOptional({
    example:
      'Crops showing good germination. Slight pest activity on eastern edge.',
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @ApiPropertyOptional({
    description:
      'ISO 8601 timestamp of when the observation was made. ' +
      'Used for offline submissions — may differ from server receipt time. ' +
      'Defaults to now() if omitted.',
    example: '2025-04-01T09:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  observedAt?: string;

  @ApiPropertyOptional({
    description:
      'Supabase Storage public URL of an uploaded image. ' +
      'Upload the image first via POST /images/upload, then include the URL here.',
  })
  @IsOptional()
  @IsUrl()
  imageUrl?: string;
}
