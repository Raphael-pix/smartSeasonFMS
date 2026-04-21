import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { Reflector } from '@nestjs/core';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { PrismaService } from '@/prisma/prisma.service';
import { UserRequest } from '../types/request-user.type';
import { ALLOW_WITHOUT_FARM_KEY } from '../decorators/allowed-without-farm.decorator';

@Injectable()
export class AppAuthGuard extends AuthGuard('supabase') {
  constructor(
    private prisma: PrismaService,
    private readonly reflector: Reflector,
  ) {
    super();
  }

  async canActivate(context: ExecutionContext) {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const canActivate = await super.canActivate(context);
    if (!canActivate) return false;

    const request: UserRequest = context.switchToHttp().getRequest();
    const user = request.user;

    const dbUser = await this.prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        role: true,
        fullName: true,
        isActive: true,
        farmId: true,
      },
    });

    if (!dbUser) {
      throw new UnauthorizedException('User profile not found');
    }

    if (!dbUser.isActive) {
      throw new ForbiddenException('Account is deactivated');
    }

    const allowWithoutFarm = this.reflector.getAllAndOverride<boolean>(
      ALLOW_WITHOUT_FARM_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!dbUser.farmId && !allowWithoutFarm) {
      throw new ForbiddenException(
        'You must create or join a farm before continuing.',
      );
    }

    request.user = {
      ...dbUser,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      farmId: dbUser.farmId!,
    };
    return true;
  }
}
