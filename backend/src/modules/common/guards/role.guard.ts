import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Role } from "../enums/roles.enum";
import { ROLES_KEY } from "../decorators/role.decoration"

@Injectable()
export class RoleGuard implements CanActivate {
    constructor(private reflector: Reflector) { }
    canActivate(context: ExecutionContext): boolean {
        const requiredRoles = this.reflector.getAllAndOverride<Role[]>(
            ROLES_KEY,
            [context.getHandler(), context.getClass()]
        )

        const { user } = context.switchToHttp().getRequest()

        if (!user) throw new UnauthorizedException("User not found")

        if (user.role === Role.ADMIN) return true

        if (!requiredRoles || requiredRoles.length === 0) return true

        const userRole = user.role
        const adminRole = user.permissions?.admin

        return requiredRoles.includes(userRole) || adminRole
    }
}