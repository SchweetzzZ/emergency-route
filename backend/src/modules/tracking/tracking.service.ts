import { Injectable, NotFoundException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class TrackingService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly jwtService: JwtService,
    ) { }

    async createDeviceToken(vehiculeId: string) {
        const vehicule = await this.prisma.vehicule.findUnique({
            where: { id: vehiculeId },
            select: { id: true, name: true },
        });

        if (!vehicule) {
            throw new NotFoundException("Veículo não encontrado");
        }

        const token = await this.jwtService.signAsync(
            { type: "tracking-device", vehiculeId: vehicule.id },
            { expiresIn: "12h" },
        );

        return { vehiculeId: vehicule.id, vehiculeName: vehicule.name, token, expiresIn: "12h" };
    }

    async getHistory(vehiculeId: string) {
        return this.prisma.telemetry.findMany({
            where: { vehiculeId },
            orderBy: { capturedAt: "asc" },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                speed: true,
                heading: true,
                accuracy: true,
                capturedAt: true,
                createdAt: true,
            },
        });
    }

    async getCurrentLocation(vehiculeId: string) {
        return this.prisma.vehicule.findUnique({
            where: { id: vehiculeId },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                lastSeen: true,
                trackingEnable: true,
            },
        });
    }

    async getTelemetryHistory(vehiculeId: string, hours = 2) {
        const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000);

        return this.prisma.telemetry.findMany({
            where: { vehiculeId, capturedAt: { gte: fromDate } },
            orderBy: { capturedAt: "asc" },
        });
    }

    async getStats(vehiculeId: string) {
        const telemetry = await this.prisma.telemetry.findMany({
            where: { vehiculeId },
            orderBy: { capturedAt: "asc" },
            select: { speed: true, capturedAt: true },
        });

        if (telemetry.length === 0) {
            return {
                totalLocations: 0,
                firstSignal: null,
                lastSignal: null,
                averageSpeedKmh: 0,
                maxSpeedKmh: 0,
            };
        }

        const speeds = telemetry
            .filter((item) => item.speed !== null)
            .map((item) => (item.speed as number) * 3.6);

        return {
            totalLocations: telemetry.length,
            firstSignal: telemetry[0].capturedAt,
            lastSignal: telemetry[telemetry.length - 1].capturedAt,
            averageSpeedKmh: speeds.length > 0
                ? Math.round((speeds.reduce((a, b) => a + b, 0) / speeds.length) * 10) / 10
                : 0,
            maxSpeedKmh: speeds.length > 0 ? Math.round(Math.max(...speeds) * 10) / 10 : 0,
        };
    }
}
