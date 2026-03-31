import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

export class JwtGuard implements CanActivate {
  private jwt = new JwtService({ secret: process.env.JWT_SECRET });

  canActivate(ctx: ExecutionContext): boolean {
    const req = ctx.switchToHttp().getRequest();
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : '';
    if (!token) throw new UnauthorizedException('Missing token');

    req.user = this.jwt.verify(token);
    return true;
  }
}

export const getUserId = (req: any): string => req?.user?.sub;
export const ensureRole = (req: any, role: string) => {
  if (!req.user.roles.includes(role)) {
    throw new ForbiddenException(`Only ${role} can access this resource.`);
  }
};
