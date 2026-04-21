import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Role } from 'generated/prisma/enums';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from '@/config/configuration';
import { JwtUser } from '@/auth/types/request-user.type';

const USER_SELECT = {
  id: true,
  email: true,
  role: true,
  fullName: true,
  phone: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class UserService {
  private readonly supabase: SupabaseClient;
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    this.supabase = createClient(
      this.config.get('supabase.url', { infer: true }),
      this.config.get('supabase.serviceRoleKey', { infer: true }),
    );
  }
  async findAll(params: {
    role?: Role;
    page: number;
    limit: number;
    requestingUser: JwtUser;
  }) {
    const { role, page, limit, requestingUser } = params;
    const skip = (page - 1) * limit;

    const where = { farmId: requestingUser.farmId, ...(role ? { role } : {}) };

    const [users, total] = await this.prisma.$transaction(async (prisma) => {
      const users = await prisma.user.findMany({
        where,
        select: USER_SELECT,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      });
      const total = await prisma.user.count({ where });
      return [users, total];
    });

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async findById(id: string, requestingUser: JwtUser) {
    const user = await this.prisma.user.findUnique({
      where: { id, farmId: requestingUser.id },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto, requestingUser: JwtUser) {
    await this.findById(id, requestingUser);

    return this.prisma.user.update({
      where: { id },
      data: {
        ...(dto.fullName !== undefined && { fullName: dto.fullName }),
        ...(dto.phone !== undefined && { phone: dto.phone }),
        ...(dto.role !== undefined && { role: dto.role }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
      select: USER_SELECT,
    });
  }

  async deactivate(id: string, requestingUser: JwtUser) {
    await this.findById(id, requestingUser);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  async inviteUser(email: string) {
    const { data, error } = await this.supabase.auth.admin.inviteUserByEmail(
      email,
      {
        redirectTo: `${this.config.get('frontend.url', { infer: true })}auth/complete-profile`,
      },
    );

    if (error) throw error;

    return data;
  }

  async findAllAgents(requestingUser: JwtUser) {
    return this.prisma.user.findMany({
      where: {
        role: Role.AGENT,
        isActive: true,
        farmId: requestingUser.farmId,
      },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async validateAgent(agentId: string, farmId: string): Promise<void> {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId, farmId, isActive: true },
      select: { id: true, role: true, isActive: true },
    });

    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    if (agent.role !== Role.AGENT)
      throw new ConflictException(`User ${agentId} is not an AGENT`);
  }
}
