import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { Role } from 'generated/prisma/enums';
import { UpdateUserDto } from './dto/update-user.dto';
import { PrismaService } from '@/prisma/prisma.service';

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
  constructor(private readonly prisma: PrismaService) {}
  async findAll(params: { role?: Role; page: number; limit: number }) {
    const { role, page, limit } = params;
    const skip = (page - 1) * limit;

    const where = { ...(role ? { role } : {}) };

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

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: USER_SELECT,
    });

    if (!user) throw new NotFoundException(`User ${id} not found`);
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findById(id);

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

  async deactivate(id: string) {
    await this.findById(id);

    return this.prisma.user.update({
      where: { id },
      data: { isActive: false },
      select: USER_SELECT,
    });
  }

  async findAllAgents() {
    return this.prisma.user.findMany({
      where: { role: Role.AGENT, isActive: true },
      select: { id: true, fullName: true, email: true },
      orderBy: { fullName: 'asc' },
    });
  }

  async validateAgent(agentId: string): Promise<void> {
    const agent = await this.prisma.user.findUnique({
      where: { id: agentId },
      select: { id: true, role: true, isActive: true },
    });

    if (!agent) throw new NotFoundException(`Agent ${agentId} not found`);
    if (agent.role !== Role.AGENT)
      throw new ConflictException(`User ${agentId} is not an AGENT`);
    if (!agent.isActive)
      throw new ConflictException(`Agent ${agentId} is deactivated`);
  }
}
