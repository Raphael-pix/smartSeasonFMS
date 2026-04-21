import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateFarmDto {
  @ApiProperty({ example: 'Kiptoo Family Farm' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @ApiPropertyOptional({
    example: 'Specialising in maize and beans, Nakuru County',
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  description?: string;
}
