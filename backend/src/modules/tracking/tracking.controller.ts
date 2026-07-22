import { Controller, Get, Param, Post, Query, UseGuards } from "@nestjs/common";
import { ApiTags, ApiOperation, ApiParam, ApiQuery, ApiResponse } from "@nestjs/swagger";
import { TrackingService } from "./tracking.service";
import { JwtAuthGuard } from "../common/guards/jwt-auth.guard";
import { RoleGuard } from "../common/guards/role.guard";
import { Roles } from "../common/decorators/role.decoration";
import { Role } from "../common/enums/roles.enum";

@ApiTags("Rastreamento e Telemetria (GPS)")
@Controller("tracking")
@UseGuards(JwtAuthGuard, RoleGuard)
export class TrackingController {
    constructor(private readonly trackingService: TrackingService) { }

    @Post("device-token/:vehiculeId")
    @Roles(Role.ADMIN)
    @ApiOperation({ summary: "Gerar token JWT de dispositivo para GPS embarcado" })
    @ApiParam({ name: "vehiculeId", description: "UUID do veículo" })
    async createDeviceToken(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.createDeviceToken(vehiculeId);
    }

    @Get("history/:vehiculeId")
    @ApiOperation({ summary: "Histórico recente de localizações do veículo (do Redis)" })
    @ApiParam({ name: "vehiculeId", description: "UUID do veículo" })
    async getHistory(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getHistory(vehiculeId);
    }

    @Get("current/:vehiculeId")
    @ApiOperation({ summary: "Localização atual em tempo real do veículo" })
    @ApiParam({ name: "vehiculeId", description: "UUID do veículo" })
    async getCurrentLocation(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getCurrentLocation(vehiculeId);
    }

    @Get("stats/:vehiculeId")
    @ApiOperation({ summary: "Estatísticas de telemetria do veículo (velocidade média, total de pontos)" })
    @ApiParam({ name: "vehiculeId", description: "UUID do veículo" })
    async getStats(@Param("vehiculeId") vehiculeId: string) {
        return this.trackingService.getStats(vehiculeId);
    }

    @Get("telemetry/:vehiculeId")
    @ApiOperation({ summary: "Histórico de telemetria detalhado (Prisma)" })
    @ApiParam({ name: "vehiculeId", description: "UUID do veículo" })
    @ApiQuery({ name: "hours", required: false, description: "Quantidade de horas para trás (padrão: 2)", example: "2" })
    async getTelemetryHistory(@Param("vehiculeId") vehiculeId: string, @Query("hours") hours?: string) {
        const parsedHours = hours ? Number.parseInt(hours, 10) : 2;
        return this.trackingService.getTelemetryHistory(vehiculeId, Number.isNaN(parsedHours) ? 2 : parsedHours);
    }
}
