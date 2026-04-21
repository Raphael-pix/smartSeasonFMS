import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';

import { PrismaService } from '@/prisma/prisma.service';
import { JwtUser } from '@/auth/types/request-user.type';
import { CreateFarmDto } from './dto/create-farm.dto';
import { JoinFarmDto } from './dto/join-farm.dto';

const FARM_SELECT = {
  id: true,
  name: true,
  slug: true,
  description: true,
  isActive: true,
  createdAt: true,
  _count: { select: { users: true, fields: true } },
} as const;

@Injectable()
export class FarmsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateFarmDto, JwtUser: JwtUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: JwtUser.id },
      select: { farmId: true },
    });

    if (existingUser?.farmId) {
      throw new ConflictException(
        'You already belong to a farm. A user can only be in one farm.',
      );
    }

    const slug = this.generateSlug(dto.name);
    const inviteCode = this.generateInviteCode();

    const farm = await this.prisma.farm.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description,
        inviteCode,
      },
      select: FARM_SELECT,
    });

    await this.prisma.user.update({
      where: { id: JwtUser.id },
      data: { farmId: farm.id, role: Role.ADMIN },
    });

    return {
      ...farm,
      inviteCode,
      message: 'Farm created. Share the invite code with your agents.',
    };
  }

  async join(dto: JoinFarmDto, JwtUser: JwtUser) {
    const existingUser = await this.prisma.user.findUnique({
      where: { id: JwtUser.id },
      select: { farmId: true },
    });

    if (existingUser?.farmId) {
      throw new ConflictException('You already belong to a farm.');
    }

    const farm = await this.prisma.farm.findUnique({
      where: { inviteCode: dto.inviteCode },
      select: { id: true, name: true, slug: true, isActive: true },
    });

    if (!farm) {
      throw new NotFoundException('Invalid invite code');
    }

    if (!farm.isActive) {
      throw new BadRequestException('This farm is no longer active');
    }

    await this.prisma.user.update({
      where: { id: JwtUser.id },
      data: { farmId: farm.id },
    });

    return {
      message: `You have joined ${farm.name}`,
      farm: { id: farm.id, name: farm.name, slug: farm.slug },
    };
  }

  async getMyFarm(JwtUser: JwtUser) {
    const farm = await this.prisma.farm.findUnique({
      where: { id: JwtUser.farmId },
      select: {
        ...FARM_SELECT,
        users: {
          where: { isActive: true },
          select: {
            id: true,
            fullName: true,
            email: true,
            role: true,
            createdAt: true,
          },
          orderBy: { role: 'asc' },
        },
      },
    });

    if (!farm) throw new NotFoundException('Farm not found');
    return farm;
  }

  async update(
    dto: Partial<{ name: string; description: string; county: string }>,
    JwtUser: JwtUser,
  ) {
    return this.prisma.farm.update({
      where: { id: JwtUser.farmId },
      data: {
        ...(dto.name && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.county !== undefined && { county: dto.county }),
      },
      select: FARM_SELECT,
    });
  }

  async regenerateInviteCode(JwtUser: JwtUser) {
    const newCode = this.generateInviteCode();

    await this.prisma.farm.update({
      where: { id: JwtUser.farmId },
      data: { inviteCode: newCode },
    });

    return {
      inviteCode: newCode,
      message: 'Invite code regenerated. The old code is now invalid.',
    };
  }

  async removeMember(memberId: string, JwtUser: JwtUser) {
    if (memberId === JwtUser.id) {
      throw new BadRequestException('You cannot remove yourself from the farm');
    }

    const member = await this.prisma.user.findFirst({
      where: { id: memberId, farmId: JwtUser.farmId },
      select: { id: true, fullName: true, email: true },
    });

    if (!member) {
      throw new NotFoundException('Member not found within your farm');
    }

    await this.prisma.$transaction([
      this.prisma.field.updateMany({
        where: { agentId: memberId, farmId: JwtUser.farmId },
        data: { agentId: null },
      }),
      this.prisma.user.update({
        where: { id: memberId },
        data: { farmId: null, isActive: false },
      }),
    ]);

    return { message: `${member.fullName ?? member.email} removed from farm` };
  }

  async validateSameFarm(userId: string, farmId: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, farmId, isActive: true },
      select: { id: true },
    });

    if (!user) {
      throw new BadRequestException(
        `User ${userId} does not belong to this farm`,
      );
    }
  }

  private generateSlug(name: string): string {
    return (
      name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60) +
      '-' +
      Math.random().toString(36).slice(2, 7)
    );
  }

  private generateInviteCode(): string {
    const seg = () => Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${seg()}-${seg()}-${seg()}`;
  }
}
