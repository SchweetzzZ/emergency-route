import { Controller, Post, Put, Delete, Get, Body, Param } from "@nestjs/common";
import type { CreateIncidentDto, UpdateIncidentDto } from "./schemas/incident-zod";
import { IncidentsService } from "./incidents.service";

@Controller("incidents")
export class IncidentsController {
    constructor(private readonly incidentsService: IncidentsService) { }

    @Get()
    async getAllIncident() {
        return this.incidentsService.getAllIncident();
    }

    @Get("priority")
    async getPriorityIncidents() {
        return this.incidentsService.getPriorityIncidents();
    }

    @Get(":id")
    async getIncidentById(@Param("id") id: string) {
        return this.incidentsService.getIncidentById(id);
    }

    @Post()
    async createIncident(@Body() data: CreateIncidentDto) {
        return this.incidentsService.createIncident(data);
    }

    @Put(":id")
    async updatedIncident(@Body() data: UpdateIncidentDto, @Param("id") id: string) {
        return this.incidentsService.updatedIncident(data, id);
    }

    @Delete(":id")
    async deleteIncident(@Param("id") id: string) {
        return this.incidentsService.deleteIncident(id);
    }
}