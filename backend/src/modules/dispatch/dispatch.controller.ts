import { Controller, Post, Get, Param, Body } from "@nestjs/common";
import { DispatchService } from "./dispatch.service";
import { ZodBody } from "../common/decorators/zod.decorator";
import { DispatchSchema, DispatchStatusSchema } from "./schemas/zod-validation";
import type { DispatchDto, DispatchStatusDto } from "./schemas/zod-validation";

@Controller("dispatch")
export class DispatchController {
    constructor(private readonly dispatchService: DispatchService) { }

    @Get()
    async listAssignments() {
        return this.dispatchService.listAssignments()
    }

    @Get(":id")
    async getAssignmentById(@Param("id") id: string) {
        return this.dispatchService.getAssignmentById(id)
    }

    @Post()
    async createDispatch(@ZodBody(DispatchSchema) data: DispatchDto) {
        const result = await this.dispatchService.dispatchIncident(data)
        return result
    }

    @Post("/auto")
    async autoDispatch(@Body() body: { incidentId: string }) {
        return this.dispatchService.autoDispatch(body.incidentId)
    }

    @Post("/accept")
    async acceptDispatch(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.acceptDispatch(data)
        return result
    }

    @Post("/start-route")
    async startRoute(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.startRoute(data)
        return result
    }

    @Post("/arrived")
    async arrivedAtScene(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.arrivedAtScene(data)
        return result
    }

    @Post("/completed")
    async completedDispatch(@ZodBody(DispatchStatusSchema) data: DispatchStatusDto) {
        const result = await this.dispatchService.completedDispatch(data)
        return result
    }
}