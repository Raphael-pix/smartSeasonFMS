import { IsBoolean, IsOptional, IsString, MinLength } from 'class-validator';

export class ConfirmUploadDto {
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
