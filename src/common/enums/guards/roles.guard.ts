import { CanActivate, ExecutionContext, ForbiddenException } from "@nestjs/common";
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../Decorators/roles.decorator';
import { Role } from '../role.enum';

export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requestRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requestRoles) return true;
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    if (!user) throw new ForbiddenException('Access denied');
    const hasRole = requestRoles.includes(user.role);
    if (!hasRole) throw new ForbiddenException('Insufficient permissions');
    return true;
  }
}