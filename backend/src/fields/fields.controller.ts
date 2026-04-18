// src/fields/fields.controller.ts
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
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from 'generated/prisma/enums';

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { Roles } from '@/auth/decorators/roles.decorator';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { FieldsService } from './fields.service';
import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryFieldsDto } from './dto/query-field.dto';

@ApiTags('Fields')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'fields', version: '1' })
export class FieldsController {
  constructor(private readonly fieldsService: FieldsService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new field [Admin]' })
  create(@Body() dto: CreateFieldDto, @CurrentUser() user: JwtUser) {
    return this.fieldsService.create(dto, user);
  }

  @Get()
  @ApiOperation({
    summary: 'List fields — Admins see all, Agents see assigned only',
  })
  findAll(@Query() query: QueryFieldsDto, @CurrentUser() user: JwtUser) {
    return this.fieldsService.findAll(query, user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a single field by ID' })
  @ApiParam({ name: 'id', type: String })
  findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.fieldsService.findOne(id, user);
  }

  @Patch(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Update field details [Admin]' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateFieldDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.fieldsService.update(id, dto, user);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Archive (soft-delete) a field [Admin]' })
  archive(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.fieldsService.archive(id, user);
  }
}
