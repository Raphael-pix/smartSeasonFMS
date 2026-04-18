// src/updates/updates.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
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

import { AppAuthGuard } from '@/auth/guards/auth.guard';
import { RolesGuard } from '@/auth/guards/roles.guard';
import { CurrentUser } from '@/auth/decorators/current-user.decorator';
import type { JwtUser } from '@/auth/types/request-user.type';

import { UpdatesService } from './updates.service';
import { CreateUpdateDto } from './dto/create-update.dto';
import { QueryUpdatesDto } from './dto/query-updates.dto';

@ApiTags('Updates')
@ApiBearerAuth('supabase-jwt')
@UseGuards(AppAuthGuard, RolesGuard)
@Controller({ path: 'fields/:fieldId/updates', version: '1' })
export class UpdatesController {
  constructor(private readonly updatesService: UpdatesService) {}

  @Post()
  @ApiOperation({
    summary: 'Submit a field update (supports offline observedAt timestamp)',
  })
  @ApiParam({ name: 'fieldId', type: String })
  create(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Body() dto: CreateUpdateDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.updatesService.create(fieldId, dto, user);
  }

  @Get()
  @ApiOperation({ summary: 'List updates for a field (chronological)' })
  @ApiParam({ name: 'fieldId', type: String })
  findAll(
    @Param('fieldId', ParseUUIDPipe) fieldId: string,
    @Query() query: QueryUpdatesDto,
    @CurrentUser() user: JwtUser,
  ) {
    return this.updatesService.findByField(fieldId, query, user);
  }

  @Get(':updateId')
  @ApiOperation({ summary: 'Get a single update by ID' })
  @ApiParam({ name: 'fieldId', type: String })
  @ApiParam({ name: 'updateId', type: String })
  findOne(
    @Param('updateId', ParseUUIDPipe) updateId: string,
    @CurrentUser() user: JwtUser,
  ) {
    return this.updatesService.findOne(updateId, user);
  }
}
