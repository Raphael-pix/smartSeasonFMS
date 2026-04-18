// src/users/users.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  ParseUUIDPipe,
  Query,
  UseGuards,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { UserService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@ApiTags('Users')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'users', version: '1' })
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users [Admin]' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'page', type: Number, required: false, example: 1 })
  @ApiQuery({ name: 'limit', type: Number, required: false, example: 20 })
  findAll(
    @Query('role') role?: Role,
    @Query('page') page = 1,
    @Query('limit') limit = 20,
  ) {
    return this.userService.findAll({ role, page: +page, limit: +limit });
  }

  @Get('agents')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all active agents [Admin]' })
  findAgents() {
    return this.userService.findAllAgents();
  }

  @Get('me')
  @ApiOperation({ summary: 'Get own profile' })
  getMe(@CurrentUser() user: JwtUser) {
    return this.userService.findById(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only view your own profile');
    }
    return this.userService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user' })
  @HttpCode(HttpStatus.OK)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: JwtUser,
  ) {
    if (user.role !== Role.ADMIN && user.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }
    if (user.role !== Role.ADMIN) {
      delete dto.role;
      delete dto.isActive;
    }

    return this.userService.update(id, dto);
  }
}
