import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class JoinFarmDto {
  @ApiProperty({
    example: 'KIPTOO-X7K2',
    description: 'The invite code provided by the farm admin',
  })
  @IsString()
  @IsNotEmpty()
  @Length(4, 30)
  inviteCode: string;
}
