import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  async check() {
    const db = await this.checkDb();

    return {
      status: db ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: db ? 'up' : 'down',
      },
    };
  }

  private async checkDb(): Promise<boolean> {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return true;
    } catch {
      return false;
    }
  }
}
