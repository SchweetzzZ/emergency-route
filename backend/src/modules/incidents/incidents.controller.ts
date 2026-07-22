import { Controller, Post, Put, Delete, Get, Body, Param, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger";
import type { CreateIncidentDto, UpdateIncidentDto } from "./schemas/incident-zod";
import { IncidentsService } from "./incidents.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { PermissionGuard } from "../common/guards/permissions.guard";
import { RoleGuard } from "../common/guards/role.guard";

@ApiTags("Incidentes")
@Controller("incidents")
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Criar novo incidente", description: "Registra uma nova ocorrência no sistema de emergência." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["ACCIDENT", "FIRE", "MEDICAL"], example: "ACCIDENT" },
                location: { type: "string", example: "Av. Paulista, 1000 - São Paulo" },
                description: { type: "string", example: "Colisão frontal entre dois veículos" },
                status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "RESOLVED"], example: "PENDING" },
                latitude: { type: "number", example: -23.561684 },
                longitude: { type: "number", example: -46.655981 },
                priority: { type: "number", example: 80 },
            },
            required: ["type", "location", "description", "status", "latitude", "longitude"],
        },
    })
    @ApiResponse({ status: 201, description: "Incidente criado com sucesso." })
    async createIncident(@Body() data: CreateIncidentDto) {
        return this.incidentsService.createIncident(data);
    }

    @Put(":id")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Atualizar incidente por ID" })
    @ApiParam({ name: "id", description: "UUID do incidente" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                type: { type: "string", enum: ["ACCIDENT", "FIRE", "MEDICAL"], example: "ACCIDENT" },
                location: { type: "string", example: "Av. Paulista, 1000 - São Paulo" },
                description: { type: "string", example: "Vítimas atendidas, aguardando guincho" },
                status: { type: "string", enum: ["PENDING", "IN_PROGRESS", "RESOLVED"], example: "IN_PROGRESS" },
                latitude: { type: "number", example: -23.561684 },
                longitude: { type: "number", example: -46.655981 },
                priority: { type: "number", example: 90 },
            },
        },
    })
    async updatedIncident(@Body() data: UpdateIncidentDto, @Param("id") id: string) {
        return this.incidentsService.updatedIncident(data, id);
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Excluir incidente por ID" })
    @ApiParam({ name: "id", description: "UUID do incidente" })
    async deleteIncident(@Param("id") id: string) {
        return this.incidentsService.deleteIncident(id);
    }

    @Get()
    @ApiOperation({ summary: "Listar todos os incidentes" })
    async getAllIncident() {
        return this.incidentsService.getAllIncident();
    }

    @Get("priority")
    @ApiOperation({ summary: "Listar incidentes prioritários (do Redis cache)" })
    async getPriorityIncidents() {
        return this.incidentsService.getPriorityIncidents();
    }

    @Get(":id")
    @ApiOperation({ summary: "Buscar incidente por ID" })
    @ApiParam({ name: "id", description: "UUID do incidente" })
    async getIncidentById(@Param("id") id: string) {
        return this.incidentsService.getIncidentById(id);
    }
}