import { Controller, Post, Body, Put, Param, Delete, Get, UseGuards } from "@nestjs/common"
import { VehiculesService } from "./vehicules.service"
import type { CreateVehiculeDto, UpdateVehiculeDto } from "./schema/vehicule-zod"
import { createVehiculeSchema, updateVehiculeSchema } from "./schema/vehicule-zod"
import { ZodBody } from "../common/decorators/zod.decorator"
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard"
import { PermissionGuard } from "../common/guards/permissions.guard"
import { Permissions } from "../common/decorators/permission.decorator"
import { PERMISSIONS } from "../common/enums/permissions.enum"

@Controller("vehicules")
@UseGuards(JwtAuthGuard, PermissionGuard)
export class VehiculesController {
    constructor(private readonly vehiculeService: VehiculesService) { }

    @Post()
    @Permissions(PERMISSIONS.vehicule.create)
    async createVehicule(@ZodBody(createVehiculeSchema) data: CreateVehiculeDto) {
        return this.vehiculeService.createVehicule(data)
    }

    @Put(":id")
    @Permissions(PERMISSIONS.vehicule.update)
    async updateVehicule(@ZodBody(updateVehiculeSchema) data: UpdateVehiculeDto, @Param("id") id: string) {
        return this.vehiculeService.updateVehicule(id, data)
    }

    @Delete(":id")
    @Permissions(PERMISSIONS.vehicule.delete)
    async deleteVehicule(@Param("id") id: string) {
        return this.vehiculeService.deleteVehicule(id)
    }

    @Get()
    @Permissions(PERMISSIONS.vehicule.read)
    async listVehicules() {
        return this.vehiculeService.listVehicules()
    }

    @Get(":id")
    @Permissions(PERMISSIONS.vehicule.read)
    async getVehiculeById(@Param("id") id: string) {
        const result = await this.vehiculeService.getVehiculeById(id)
        if (!result) {
            return { message: "Vehicule not found" }
        }
        return result
    }
}