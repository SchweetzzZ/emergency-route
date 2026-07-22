import { Controller, Get, Post, Res } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBody, ApiResponse } from "@nestjs/swagger"
import { AuthService } from "./auth.service"
import type { RegisterDto, LoginDto } from "./schemas/auth-zod"
import { registerSchema, loginSchema } from "./schemas/auth-zod"
import { ZodBody } from "../common/decorators/zod.decorator"
import express from 'express'

@ApiTags("Autenticação")
@Controller("auth")
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Post("register")
    @ApiOperation({ summary: "Registrar um novo usuário", description: "Cria uma nova conta de usuário no sistema." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                name: { type: "string", example: "João Silva" },
                email: { type: "string", example: "joao@email.com" },
                password: { type: "string", example: "senha123" },
                phone: { type: "string", example: "11999998888" },
            },
            required: ["name", "email", "password", "phone"],
        },
    })
    @ApiResponse({ status: 201, description: "Usuário registrado com sucesso." })
    async register(@ZodBody(registerSchema) data: RegisterDto) {
        return this.authService.register(data)
    }

    @Post("login")
    @ApiOperation({ summary: "Autenticar usuário", description: "Realiza o login e define o cookie HTTP-only com JWT." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                email: { type: "string", example: "joao@email.com" },
                password: { type: "string", example: "senha123" },
            },
            required: ["email", "password"],
        },
    })
    @ApiResponse({ status: 200, description: "Login efetuado com sucesso." })
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

    @Get('test')
    @ApiOperation({ summary: "Rota de teste de Auth" })
    async test() {
        return "test"
    }
}
