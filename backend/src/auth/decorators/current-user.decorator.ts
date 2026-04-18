import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { JwtUser, UserRequest } from '../types/request-user.type';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): JwtUser => {
    const request: UserRequest = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
