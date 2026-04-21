import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CropStage, Role } from 'generated/prisma/enums';
import dayjs from 'dayjs';

import { PrismaService } from '@/prisma/prisma.service';
import { CacheService } from '@/cache/cache.service';
import { UserService } from '@/user/user.service';
import { AppConfig } from '@/config/configuration';
import { JwtUser } from '@/auth/types/request-user.type';

import { CreateFieldDto } from './dto/create-field.dto';
import { UpdateFieldDto } from './dto/update-field.dto';
import { QueryFieldsDto } from './dto/query-field.dto';
import { FieldStatus } from './types/field-status.types';
import { Prisma } from 'generated/prisma/client';

const FIELD_LIST_SELECT = {
  id: true,
  name: true,
  cropType: true,
  plantingDate: true,
  currentStage: true,
  coverImageUrl: true,
  areaSize: true,
  lastUpdatedAt: true,
  isArchived: true,
  createdAt: true,
  agent: { select: { id: true, fullName: true, email: true } },
  location: {
    select: { id: true, county: true, subCounty: true, ward: true },
  },
} satisfies Prisma.FieldSelect;

const FIELD_DETAIL_SELECT = {
  ...FIELD_LIST_SELECT,
  description: true,
  updatedAt: true,
  updatedBy: { select: { id: true, fullName: true } },
  location: {
    select: {
      id: true,
      county: true,
      subCounty: true,
      ward: true,
      latitude: true,
      longitude: true,
    },
  },
  _count: { select: { updates: true, images: true } },
} satisfies Prisma.FieldSelect;

@Injectable()
export class FieldsService {
  private readonly logger = new Logger(FieldsService.name);
  private readonly atRiskThresholdDays: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: CacheService,
    private readonly userService: UserService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {
    this.atRiskThresholdDays = this.config.get(
      'fieldStatus.atRiskThresholdDays',
      { infer: true },
    );
  }

  computeStatus(field: {
    currentStage: CropStage;
    lastUpdatedAt: Date | null;
    plantingDate: Date;
  }): FieldStatus {
    if (field.currentStage === CropStage.HARVESTED) {
      return FieldStatus.COMPLETED;
    }

    const referenceDate = field.lastUpdatedAt ?? field.plantingDate;
    const daysSinceUpdate = dayjs().diff(dayjs(referenceDate), 'day');

    if (daysSinceUpdate > this.atRiskThresholdDays) {
      return FieldStatus.AT_RISK;
    }

    return FieldStatus.ACTIVE;
  }

  async computeStatusCached(
    fieldId: string,
    field: Parameters<FieldsService['computeStatus']>[0],
  ): Promise<FieldStatus> {
    const cacheKey = this.cache.fieldStatusKey(fieldId);
    const cached = await this.cache.get<FieldStatus>(cacheKey);
    if (cached) return cached;

    const status = this.computeStatus(field);
    await this.cache.set(
      cacheKey,
      status,
      this.config.get('cache.ttlFieldStatus', { infer: true }),
    );
    return status;
  }

  async create(dto: CreateFieldDto, user: JwtUser) {
    if (dto.agentId) {
      await this.userService.validateAgent(dto.agentId, user.farmId);
    }

    const field = await this.prisma.$transaction(async (prisma) => {
      const location = await prisma.location.create({
        data: {
          county: dto.location.county,
          subCounty: dto.location.subCounty ?? null,
          ward: dto.location.ward ?? null,
          latitude: dto.location.latitude ?? null,
          longitude: dto.location.longitude ?? null,
        },
      });

      const field = await prisma.field.create({
        data: {
          name: dto.name,
          cropType: dto.cropType,
          plantingDate: new Date(dto.plantingDate),
          currentStage: dto.currentStage ?? CropStage.PLANTED,
          description: dto.description,
          areaSize: dto.areaSize,
          farmId: user.farmId,
          agentId: dto.agentId ?? null,
          updatedById: user.id,
          locationId: location.id,
        },
        select: FIELD_DETAIL_SELECT,
      });

      return field;
    });

    await this.cache.invalidateFieldLists();
    return this.attachStatus(field);
  }

  async findAll(query: QueryFieldsDto, user: JwtUser) {
    const { stage, county, includeArchived, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;
    const isAdmin = user.role === Role.ADMIN;

    const where: Prisma.FieldWhereInput = {
      farmId: user.farmId,
      ...(!isAdmin && { agentId: user.id }),
      ...(!includeArchived && { isArchived: false }),
      ...(stage && { currentStage: stage }),
      ...(county && {
        location: { county: { contains: county, mode: 'insensitive' } },
      }),
    };

    const [fields, total] = await this.prisma.$transaction([
      this.prisma.field.findMany({
        where,
        select: FIELD_LIST_SELECT,
        skip,
        take: limit,
        orderBy: [{ lastUpdatedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.field.count({ where }),
    ]);

    const data = await Promise.all(fields.map((f) => this.attachStatus(f)));

    const filtered = query.status
      ? data.filter((f) => f.status === query.status)
      : data;

    return {
      data: filtered,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string, user: JwtUser) {
    const field = await this.prisma.field.findUnique({
      where: { id, farmId: user.farmId },
      select: FIELD_DETAIL_SELECT,
    });

    if (!field) throw new NotFoundException(`Field ${id} not found`);

    if (user.role === Role.AGENT && field.agent?.id !== user.id) {
      throw new ForbiddenException('You are not assigned to this field');
    }

    return this.attachStatus(field);
  }

  async update(id: string, dto: UpdateFieldDto, user: JwtUser) {
    await this.findOne(id, user);

    if (dto.agentId) {
      await this.userService.validateAgent(dto.agentId, user.farmId);
    }

    const updated = await this.prisma.field.update({
      where: { id },
      data: {
        ...(dto.name !== undefined && { name: dto.name }),
        ...(dto.cropType !== undefined && { cropType: dto.cropType }),
        ...(dto.currentStage !== undefined && {
          currentStage: dto.currentStage,
        }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.areaSize !== undefined && { areaSize: dto.areaSize }),
        ...(dto.agentId !== undefined && { agentId: dto.agentId }),
        updatedById: user.id,
      },
      select: FIELD_DETAIL_SELECT,
    });

    await this.cache.invalidateOnFieldUpdate(id);
    return this.attachStatus(updated);
  }

  async archive(id: string, user: JwtUser) {
    await this.findOne(id, user);

    const archived = await this.prisma.field.update({
      where: { id },
      data: { isArchived: true, updatedById: user.id },
      select: FIELD_DETAIL_SELECT,
    });
    await this.cache.invalidateOnFieldUpdate(id);
    return this.attachStatus(archived);
  }

  async unarchive(id: string, user: JwtUser) {
    await this.findOne(id, user);

    const archived = await this.prisma.field.update({
      where: { id },
      data: { isArchived: false, updatedById: user.id },
      select: FIELD_DETAIL_SELECT,
    });
    await this.cache.invalidateOnFieldUpdate(id);
    return this.attachStatus(archived);
  }

  async syncLastUpdatedAt(
    fieldId: string,
    observedAt: Date,
    agentId: string,
  ): Promise<void> {
    await this.prisma.field.updateMany({
      where: {
        id: fieldId,
        OR: [{ lastUpdatedAt: null }, { lastUpdatedAt: { lt: observedAt } }],
      },
      data: {
        lastUpdatedAt: observedAt,
        updatedById: agentId,
      },
    });
  }

  async countByStatus(farmId: string): Promise<Record<FieldStatus, number>> {
    const fields = await this.prisma.field.findMany({
      where: { farmId, isArchived: false },
      select: {
        id: true,
        currentStage: true,
        lastUpdatedAt: true,
        plantingDate: true,
      },
    });

    const counts: Record<FieldStatus, number> = {
      [FieldStatus.ACTIVE]: 0,
      [FieldStatus.AT_RISK]: 0,
      [FieldStatus.COMPLETED]: 0,
    };

    for (const field of fields) {
      const status = this.computeStatus(field);
      counts[status]++;
    }

    return counts;
  }

  private async attachStatus<
    T extends {
      id: string;
      currentStage: CropStage;
      lastUpdatedAt: Date | null;
      plantingDate: Date;
    },
  >(field: T): Promise<T & { status: FieldStatus }> {
    const status = await this.computeStatusCached(field.id, field);
    return { ...field, status };
  }
}
