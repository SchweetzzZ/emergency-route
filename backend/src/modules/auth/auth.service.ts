import { Injectable, UnauthorizedException } from "@nestjs/common"
import type { RegisterDto, LoginDto } from "./schemas/auth-zod"
import { PrismaService } from "../prisma/prisma.service"
import bcrypt from "bcrypt"
import { JwtService } from "@nestjs/jwt"
import { PERMISSIONS } from "../common/enums/permissions.enum"
import { Role } from "../common/enums/roles.enum"

@Injectable()
export class AuthService {
    constructor(private readonly prisma: PrismaService,
        private readonly jwtService: JwtService
    ) { }

    async validateUser(data: LoginDto) {
        const user = await this.prisma.user.findFirst({
            where: { email: data.email }
        })

        if (!user) throw new UnauthorizedException("User not found")

        const isvalidate = await bcrypt.compare(data.password, user.password)

        if (!isvalidate) throw new UnauthorizedException("Invalid password")

        return user
    }

    async register(data: RegisterDto) {
        const hashPass = await bcrypt.hash(data.password, 10)

        const user = await this.prisma.user.create({
            data: {
                ...data,
                password: hashPass
            }
        })
        return user
    }

    async signIn(data: LoginDto) {
        const user = await this.validateUser(data)

        const payload = {
            email: data.email,
            sub: user.id,
            role: user.role,
            permissions: this.getPermissionsByRole(user.role as Role)
        }
        return {
            access_token: this.jwtService.sign(payload)
        }
    }

    private getPermissionsByRole(role: Role): string[] {
        if (role === Role.ADMIN) {
            return Object.values(PERMISSIONS).flatMap(category => Object.values(category))
        }
        return [PERMISSIONS.incident.read, PERMISSIONS.vehicule.read]
    }
}