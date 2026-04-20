import {
  IsBoolean,
  IsOptional,
  IsString,
  IsUUID,
  MinLength,
} from 'class-validator';

export class ConfirmUploadDto {
  @IsUUID()
  fieldId: string;

  @IsString()
  @MinLength(5)
  path: string;

  @IsOptional()
  @IsString()
  caption?: string;

  @IsOptional()
  @IsBoolean()
  setCover?: boolean;
}
