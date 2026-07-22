import { Controller, Post, Body, Put, Param, Delete, Get, UseGuards } from "@nestjs/common"
import { ApiTags, ApiOperation, ApiBody, ApiParam, ApiResponse } from "@nestjs/swagger"
import { VehiculesService } from "./vehicules.service"
import type { CreateVehiculeDto, UpdateVehiculeDto } from "./schema/vehicule-zod"
import { createVehiculeSchema, updateVehiculeSchema } from "./schema/vehicule-zod"
import { ZodBody } from "../common/decorators/zod.decorator"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard"
import { PermissionGuard } from "../common/guards/permissions.guard"
import { Permissions } from "../common/decorators/permission.decorator"
import { PERMISSIONS } from "../common/enums/permissions.enum"
import { RoleGuard } from "../common/guards/role.guard"

@ApiTags("Veículos de Emergência")
@Controller("vehicules")
export class VehiculesController {
    constructor(private readonly vehiculeService: VehiculesService) { }

    @Post()
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Cadastrar novo veículo", description: "Cadastra uma nova viatura ou ambulância no sistema." })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                name: { type: "string", example: "Ambulância Alfa 01" },
                plate: { type: "string", example: "ABC-1234" },
                type: { type: "string", enum: ["AMBULANCE", "FIRE_TRUCK", "POLICE_CAR", "TOW_TRUCK"], example: "AMBULANCE" },
                status: { type: "string", enum: ["AVAILABLE", "DISPATCHED", "BUSY", "OFFLINE", "EN_ROUTE", "AT_INCIDENT"], example: "AVAILABLE" },
                latitude: { type: "number", example: -23.55052 },
                longitude: { type: "number", example: -46.633308 },
            },
            required: ["name", "plate", "type", "status", "latitude", "longitude"],
        },
    })
    @ApiResponse({ status: 201, description: "Veículo cadastrado com sucesso." })
    async createVehicule(@ZodBody(createVehiculeSchema) data: CreateVehiculeDto) {
        return this.vehiculeService.createVehicule(data)
    }

    @Put(":id")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Atualizar veículo por ID" })
    @ApiParam({ name: "id", description: "UUID do veículo" })
    @ApiBody({
        schema: {
            type: "object",
            properties: {
                name: { type: "string", example: "Ambulância Alfa 01 - Atualizada" },
                plate: { type: "string", example: "ABC-1234" },
                type: { type: "string", enum: ["AMBULANCE", "FIRE_TRUCK", "POLICE_CAR", "TOW_TRUCK"], example: "AMBULANCE" },
                status: { type: "string", enum: ["AVAILABLE", "DISPATCHED", "BUSY", "OFFLINE", "EN_ROUTE", "AT_INCIDENT"], example: "EN_ROUTE" },
                latitude: { type: "number", example: -23.555000 },
                longitude: { type: "number", example: -46.635000 },
            },
        },
    })
    async updateVehicule(@ZodBody(updateVehiculeSchema) data: UpdateVehiculeDto, @Param("id") id: string) {
        return this.vehiculeService.updateVehicule(id, data)
    }

    @Delete(":id")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Excluir veículo por ID" })
    @ApiParam({ name: "id", description: "UUID do veículo" })
    async deleteVehicule(@Param("id") id: string) {
        return this.vehiculeService.deleteVehicule(id)
    }

    @Get()
    @ApiOperation({ summary: "Listar todos os veículos" })
    async listVehicules() {
        return this.vehiculeService.listVehicules()
    }

    @Get("online")
    @UseGuards(JwtAuthGuard, PermissionGuard, RoleGuard)
    @ApiOperation({ summary: "Listar veículos online (ativos recentemente no Redis)" })
    async getOnlineVehicules() {
        return this.vehiculeService.getOnlineVehicules()
    }

    @Get("nearest/:incidentId")
    @ApiOperation({ summary: "Encontrar o veículo mais próximo de um incidente" })
    @ApiParam({ name: "incidentId", description: "UUID do incidente para calcular proximidade" })
    async findNearestVehicule(@Param("incidentId") incidentId: string) {
        return this.vehiculeService.findNearestVehicule(incidentId)
    }

    @Get(":id")
    @ApiOperation({ summary: "Buscar veículo por ID" })
    @ApiParam({ name: "id", description: "UUID do veículo" })
    async getVehiculeById(@Param("id") id: string) {
        const result = await this.vehiculeService.getVehiculeById(id)
        if (!result) {
            return { message: "Vehicule not found" }
        }
        return result
    }
}