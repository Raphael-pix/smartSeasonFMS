import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { FarmsService } from './farms.service';
import { CreateFarmDto } from './dto/create-farm.dto';
import { JoinFarmDto } from './dto/join-farm.dto';
import { AllowWithoutFarm } from '@/auth/decorators/allowed-without-farm.decorator';

@ApiTags('Farms')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'farms', version: '1' })
export class FarmsController {
  constructor(private readonly farmsService: FarmsService) {}

  @Post()
  @AllowWithoutFarm()
  @ApiOperation({
    summary: 'Create a new farm (onboarding — become its first admin)',
  })
  create(@Body() dto: CreateFarmDto, @CurrentUser() user: JwtUser) {
    return this.farmsService.create(dto, user);
  }

  @Post('join')
  @AllowWithoutFarm()
  @ApiOperation({ summary: 'Join an existing farm using an invite code' })
  join(@Body() dto: JoinFarmDto, @CurrentUser() user: JwtUser) {
    return this.farmsService.join(dto, user);
  }

  @Get('mine')
  @ApiOperation({ summary: 'Get your farm details and member list' })
  getMyFarm(@CurrentUser() user: JwtUser) {
    return this.farmsService.getMyFarm(user);
  }

  @Patch('mine')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update farm details [Admin]' })
  update(
    @Body() dto: Partial<{ name: string; description: string; county: string }>,
    @CurrentUser() user: JwtUser,
  ) {
    return this.farmsService.update(dto, user);
  }

  @Post('mine/invite-code')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Regenerate farm invite code [Admin]' })
  regenerateInviteCode(@CurrentUser() user: JwtUser) {
    return this.farmsService.regenerateInviteCode(user);
  }

  @Delete('mine/members/:memberId')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a member from the farm [Admin]' })
  removeMember(
    @Param('memberId', ParseUUIDPipe) memberId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.farmsService.removeMember(memberId, user);
  }
}
