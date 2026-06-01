import { Controller, Post, Body, Put, Param, Delete, Get } from "@nestjs/common"
import { VehiculesService } from "./vehicules.service"
import type { CreateVehiculeDto, UpdateVehiculeDto } from "./schema/vehicule-zod"

@Controller("/vehicules")
export class VehiculesController {
    constructor(private readonly vehiculeService: VehiculesService) { }

    @Post()
    async createVehicule(@Body() data: CreateVehiculeDto) {
        return this.vehiculeService.createVehicule(data)
    }
    @Put("/:id")
    async updateVehicule(@Body() data: UpdateVehiculeDto, @Param("id") id: string) {
        return this.vehiculeService.updateVehicule(id, data)
    }
    @Delete("/:id")
    async deleteVehicule(@Param("id") id: string) {
        return this.vehiculeService.deleteVehicule(id)
    }
    @Get()
    async listVehicules() {
        return this.vehiculeService.listVehicules()
    }
    @Get("/:id")
    async getVehiculeById(@Param("id") id: string) {
        const result = await this.vehiculeService.getVehiculeById(id)
        if (!result) {
            return { message: "Vehicule not found" }
        }
        return result
    }
}