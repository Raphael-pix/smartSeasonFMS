import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';

import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { FieldsService } from '@/fields/fields.service';
import { JwtUser } from '@/auth/types/request-user.type';

import { CreateUpdateDto } from './dto/create-update.dto';
import { QueryUpdatesDto } from './dto/query-updates.dto';

const UPDATE_SELECT = {
  id: true,
  fieldId: true,
  stage: true,
  notes: true,
  imageUrl: true,
  observedAt: true,
  createdAt: true,
  agent: { select: { id: true, fullName: true, email: true } },
} as const;

@Injectable()
export class UpdatesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly fieldsService: FieldsService,
    private readonly cache: CacheService,
  ) {}

  async create(fieldId: string, dto: CreateUpdateDto, user: JwtUser) {
    const field = await this.fieldsService.findOne(fieldId, user);

    if (user.role === Role.AGENT && field.agent?.id !== user.id) {
      throw new ForbiddenException('You are not assigned to this field');
    }

    const observedAt = dto.observedAt ? new Date(dto.observedAt) : new Date();

    const update = await this.prisma.fieldUpdate.create({
      data: {
        fieldId,
        agentId: user.id,
        stage: dto.stage,
        notes: dto.notes,
        imageUrl: dto.imageUrl,
        observedAt,
      },
      select: UPDATE_SELECT,
    });

    await Promise.all([
      this.prisma.field.update({
        where: { id: fieldId },
        data: { currentStage: dto.stage },
      }),
      this.fieldsService.syncLastUpdatedAt(fieldId, observedAt, user.id),
    ]);

    await this.cache.invalidateOnFieldUpdate(fieldId);

    return update;
  }

  async findByField(fieldId: string, query: QueryUpdatesDto, user: JwtUser) {
    await this.fieldsService.findOne(fieldId, user);

    const { stage, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where = {
      fieldId,
      ...(stage && { stage }),
    };

    const [updates, total] = await this.prisma.$transaction([
      this.prisma.fieldUpdate.findMany({
        where,
        select: UPDATE_SELECT,
        skip,
        take: limit,
        orderBy: { observedAt: 'desc' },
      }),
      this.prisma.fieldUpdate.count({ where }),
    ]);

    return {
      data: updates,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findOne(updateId: string, user: JwtUser) {
    const update = await this.prisma.fieldUpdate.findUnique({
      where: { id: updateId },
      select: { ...UPDATE_SELECT, fieldId: true },
    });

    if (!update) throw new NotFoundException(`Update ${updateId} not found`);

    await this.fieldsService.findOne(update.fieldId, user);

    return update;
  }

  async findRecent(limit = 10) {
    return this.prisma.fieldUpdate.findMany({
      take: limit,
      orderBy: { observedAt: 'desc' },
      select: {
        ...UPDATE_SELECT,
        field: { select: { id: true, name: true, cropType: true } },
      },
    });
  }
}
