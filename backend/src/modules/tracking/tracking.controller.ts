import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { TrackingService } from "./tracking.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { Roles } from "../common/decorators/role.decoration";
import { Role } from "../common/enums/roles.enum";

@Controller("tracking")
@UseGuards(JwtAuthGuard, RoleGuard)
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Post("device-token/:vehiculeId")
    @Roles(Role.ADMIN)
    async createDeviceToken(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.createDeviceToken(vehiculeId);
    }

    @Get("history/:vehiculeId")
    async getHistory(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getHistory(vehiculeId);
    }

    @Get("current/:vehiculeId")
    async getCurrentLocation(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getCurrentLocation(vehiculeId);
    }

    @Get("stats/:vehiculeId")
    async getStats(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getStats(vehiculeId);
    }

    @Get("telemetry/:vehiculeId")
    async getTelemetryHistory(@Param("vehiculeId") vehiculeId: string, @Query("hours") hours?: string) {
        const parsedHours = hours ? Number.parseInt(hours, 10) : 2;
        return this.trackingService.getTelemetryHistory(vehiculeId, Number.isNaN(parsedHours) ? 2 : parsedHours);
    }
}
