import { Injectable } from "@nestjs/common";
import { PrismaService } from "./../prisma/prisma.service";
import { KafkaService } from "../kafka/kafka.service";
import { TrackingInputDTO } from "./schemas/zod-validation";

@Injectable()
export class TrackingService {
    constructor(private readonly prisma: PrismaService,
        private kafkaService: KafkaService
    ) { }

    async handleLocation(data: TrackingInputDTO) {
        const result = await this.kafkaService.publishLocation(data)
        return result
    }

    // Histórico completo de posições (tabela Telemetry)
    async getHistory(vehiculeId: string) {
        return this.prisma.telemetry.findMany({
            where: { vehiculeId },
            orderBy: { createdAt: 'asc' },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                speed: true,
                heading: true,
                accuracy: true,
                createdAt: true,
            }
        })
    }

    async getCurrentLocation(vehiculeId: string) {
        const result = await this.prisma.vehicule.findUnique({
            where: {
                id: vehiculeId
            },
            select: {
                id: true,
                latitude: true,
                longitude: true,
                lastSeen: true,
                trackingEnable: true
            }
        })
        return result
    }

    async getTelemetryHistory(vehiculeId: string, hours: number = 2) {
        const fromDate = new Date(Date.now() - hours * 60 * 60 * 1000)

        return this.prisma.telemetry.findMany({
            where: {
                vehiculeId,
                createdAt: {
                    gte: fromDate
                }
            },
            orderBy: {
                createdAt: "asc"
            }
        })
    }

    async getStats(vehiculeId: string) {
        const telemetry = await this.prisma.telemetry.findMany({
            where: { vehiculeId },
            orderBy: { createdAt: "asc" },
            select: { speed: true, createdAt: true },
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

        // A Geolocation API retorna speed em m/s — convertemos para km/h
        const MS_TO_KMH = 3.6;
        const speeds = telemetry
            .filter(t => t.speed !== null)
            .map(t => (t.speed as number) * MS_TO_KMH);

        const averageSpeedKmh =
            speeds.length > 0
                ? speeds.reduce((a, b) => a + b, 0) / speeds.length
                : 0;

        const maxSpeedKmh = speeds.length > 0 ? Math.max(...speeds) : 0;

        return {
            totalLocations: telemetry.length,
            firstSignal: telemetry[0].createdAt,
            lastSignal: telemetry[telemetry.length - 1].createdAt,
            averageSpeedKmh: Math.round(averageSpeedKmh * 10) / 10,
            maxSpeedKmh: Math.round(maxSpeedKmh * 10) / 10,
        };
    }
}