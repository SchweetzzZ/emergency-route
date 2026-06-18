import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { Permission } from "../enums/permissions.enum";
import { Role } from "../enums/roles.enum";
import { PERMISSION_KEY } from "../decorators/permission.decorator";

@Injectable()

export class PermissionGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext) {
        const requiredPermissions = this.reflector.getAllAndOverride<Permission[]>(
            PERMISSION_KEY,
            [context.getHandler(), context.getClass()]
        )
        const { user } = context.switchToHttp().getRequest()

        if (!user) throw new UnauthorizedException("User not found")

        if (user.role === Role.ADMIN) return true

        if (!requiredPermissions || requiredPermissions.length === 0) return true

        return requiredPermissions.every(permission => user.permissions.includes(permission))
    }
}