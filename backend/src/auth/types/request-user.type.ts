import { Role } from 'generated/prisma/enums';

export interface JwtUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  fullName: string | null;
}

export interface UserRequest extends Request {
  user: JwtUser;
}

export interface JwtPayload {
  sub: string;
  email: string;
  role: Role;
  isActive: boolean;
  fullName: string | null;
  aud?: string;
}
