import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Kafka, Consumer, Admin, logLevel } from "kafkajs";
import { PrismaService } from "../prisma/prisma.service";
import { TrackingInputDTO } from "../tracking/schemas/zod-validation";
import { RealtimeService } from "../realtime/realtime.service";
import { KafkaService } from "./kafka.service";

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
    private readonly kafka: Kafka;
    private readonly consumer: Consumer;
    private readonly admin: Admin;

    constructor(
        private readonly prisma: PrismaService,
        private readonly realtimeService: RealtimeService,
        private readonly kafkaService: KafkaService,
    ) {
        this.kafka = new Kafka({
            clientId: "emergency-route-api-consumer",
            brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
            logLevel: logLevel.WARN,
        });
        this.consumer = this.kafka.consumer({ groupId: "tracking-consumer" });
        this.admin = this.kafka.admin();
    }

    async onModuleInit() {
        await this.admin.connect();
        await this.admin.createTopics({
            waitForLeaders: true,
            topics: [
                { topic: "audit-events", numPartitions: 1, replicationFactor: 1 },
                { topic: "location-updates", numPartitions: 1, replicationFactor: 1 },
            ],
        });
        await this.admin.disconnect();

        await this.consumer.connect();
        await this.consumer.subscribe({ topic: "audit-events", fromBeginning: true });
        await this.consumer.subscribe({ topic: "location-updates", fromBeginning: false });

        await this.consumer.run({
            eachMessage: async ({ topic, message }) => {
                if (!message.value) return;

                const content = JSON.parse(message.value.toString());

                if (topic === "audit-events") {
                    await this.handleAudit(content);
                    return;
                }

                if (topic === "location-updates") {
                    await this.handleLocation(content as TrackingInputDTO);
                }
            },
        });
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    private async handleAudit(content: { eventType: string; payload: unknown }) {
        await this.prisma.auditlog.create({
            data: { eventType: content.eventType, payload: content.payload as object },
        });
    }

    private async handleLocation(data: TrackingInputDTO) {
        const duplicate = await this.prisma.telemetry.findUnique({
            where: { clientEventId: data.eventId },
            select: { id: true },
        });

        if (duplicate) return;

        const capturedAt = new Date(data.capturedAt);
        const before = await this.prisma.vehicule.findUnique({
            where: { id: data.vehiculeId },
            select: { id: true, trackingEnable: true, lastSeen: true },
        });

        if (!before) return;

        await this.prisma.telemetry.create({
            data: {
                clientEventId: data.eventId,
                vehiculeId: data.vehiculeId,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed ?? null,
                accuracy: data.accuracy ?? null,
                heading: data.heading ?? null,
                capturedAt,
            },
        });

        if (before.lastSeen && capturedAt < before.lastSeen) return;

        const vehicule = await this.prisma.vehicule.update({
            where: { id: data.vehiculeId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                trackingEnable: true,
                lastSeen: capturedAt,
            },
        });

        if (!before.trackingEnable) {
            await this.kafkaService.publishAuditEvent("TRACKING_STARTED", {
                vehiculeId: vehicule.id,
            });
        }

        this.realtimeService.emitVehiculeLocationUpdate(
            vehicule.id,
            data.latitude,
            data.longitude,
            data.speed ?? null,
            data.heading ?? null,
            data.accuracy ?? null,
            capturedAt.toISOString(),
        );
    }
}
