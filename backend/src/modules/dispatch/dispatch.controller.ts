import { Controller, Post, Get, Param, Body, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger";
import { DispatchService } from "./dispatch.service";
import { ZodBody } from "../common/decorators/zod.decorator";
import { DispatchSchema, DispatchStatusSchema } from "./schemas/zod-validation";
import type { DispatchDto, DispatchStatusDto } from "./schemas/zod-validation";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../common/guards/permissions.guard";
import { RoleGuard } from "../common/guards/role.guard";

@ApiTags("Despacho e Atribuições")
@Controller("dispatch")
export class DispatchController {
    constructor(private readonly dispatchService: DispatchService) { }

    @Post("/auto")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Despacho Automático", description: "Encontra e atribui o veículo mais próximo automaticamente ao incidente." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                incidentId: { type: "string", example: "uuid-do-incidente-aqui" },
            },
            required: ["incidentId"],
        },
    })
    async autoDispatch(@Body() body: { incidentId: string }) {
        return this.dispatchService.autoDispatch(body.incidentId)
    }

    @Post("/accept")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Aceitar despacho (Equipe)", description: "Marca a atribuição como aceita pela equipe do veículo." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                assignmentId: { type: "string", example: "uuid-da-atribuicao" },
            },
            required: ["assignmentId"],
        },
    })
    async acceptDispatch(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.acceptDispatch(data)
        return result
    }

    @Post("/start-route")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Iniciar rota em direção ao incidente" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                assignmentId: { type: "string", example: "uuid-da-atribuicao" },
            },
            required: ["assignmentId"],
        },
    })
    async startRoute(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.startRoute(data)
        return result
    }

    @Post("/arrived")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Confirmar chegada no local do incidente" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                assignmentId: { type: "string", example: "uuid-da-atribuicao" },
            },
            required: ["assignmentId"],
        },
    })
    async arrivedAtScene(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.arrivedAtScene(data)
        return result
    }

    @Post("/completed")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Concluir atendimento do incidente" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                assignmentId: { type: "string", example: "uuid-da-atribuicao" },
            },
            required: ["assignmentId"],
        },
    })
    async completedDispatch(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.completedDispatch(data)
        return result
    }

    @Get()
    @ApiOperation({ summary: "Listar todos os despachos / atribuições" })
    async listAssignments() {
        return this.dispatchService.listAssignments()
    }

    @Get(":id")
    @ApiOperation({ summary: "Buscar despacho por ID" })
    @ApiParam({ name: "id", description: "UUID da atribuição/despacho" })
    async getAssignmentById(@Param("id") id: string) {
        return this.dispatchService.getAssignmentById(id)
    }

    @Post()
    @ApiOperation({ summary: "Despacho manual de veículo para incidente" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                incidentId: { type: "string", example: "uuid-do-incidente" },
                vehiculeId: { type: "string", example: "uuid-do-veiculo" },
            },
            required: ["incidentId", "vehiculeId"],
        },
    })
    async createDispatch(@ZodBody(DispatchSchema) data: DispatchDto) {
        const result = await this.dispatchService.dispatchIncident(data)
        return result
    }
}