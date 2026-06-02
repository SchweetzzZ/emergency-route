import { Controller, Post, Res } from "@nestjs/common"
import { AuthService } from "./auth.service"
import type { RegisterDto, LoginDto } from "./schemas/auth-zod"
import { registerSchema, loginSchema } from "./schemas/auth-zod"
import { ZodBody } from "../common/decorators/zod.decorator"
import express from 'express'

@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    async register(@ZodBody(registerSchema) data: RegisterDto) {
        return this.authService.register(data)
    }

    @Post("login")
    async login(@ZodBody(loginSchema) data: LoginDto, @Res({ passthrough: true }) res: express.Response) {
        const result = await this.authService.signIn(data)

        res.cookie("access_token", result.access_token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
            maxAge: 1000 * 60 * 60 * 24, // 1 day
        })

        return result
    }
}
