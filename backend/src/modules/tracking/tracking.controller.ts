import { Body, Controller, Get, Param, Post, Query } from "@nestjs/common";
import { TrackingService } from "./tracking.service";
import { TrackingSchema } from "./schemas/zod-validation";
import type { TrackingInputDTO } from "./schemas/zod-validation";
import { ZodBody } from "../common/decorators/zod.decorator";

@Controller('tracking')
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Post()
    async updateLocation(@ZodBody(TrackingSchema) data: TrackingInputDTO) {
        return this.trackingService.handleLocation(data)
    }
    @Get("history/:vehiculeId")
    async getHistory(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getHistory(vehiculeId)
    }
    @Get("current/:vehiculeId")
    async getCurrentLocation(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getCurrentLocation(vehiculeId)
    }
    @Get("stats/:vehiculeId")
    async getStats(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getStats(vehiculeId);
    }

    // GET /tracking/telemetry/:vehiculeId?hours=2
    @Get("telemetry/:vehiculeId")
    async getTelemetryHistory(
        @Param("vehiculeId") vehiculeId: string,
        @Query("hours") hours?: string,
    ) {
        const h = hours ? parseInt(hours, 10) : 2;
        return this.trackingService.getTelemetryHistory(vehiculeId, h);
    }
}
