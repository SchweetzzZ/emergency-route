import { Injectable, OnModuleInit, OnModuleDestroy } from "@nestjs/common";
import { Kafka, Consumer, logLevel } from "kafkajs";
import { PrismaService } from "../prisma/prisma.service";
import { TrackingInputDTO } from "../tracking/schemas/zod-validation";
import { RealtimeService } from "../realtime/realtime.service";
import { KafkaService } from "./kafka.service";

@Injectable()
export class KafkaConsumer implements OnModuleInit, OnModuleDestroy {
    private kafka: Kafka;
    private consumer: Consumer;

    constructor(
        private readonly prisma: PrismaService,
        private readonly realtimeService: RealtimeService,
        private readonly kafkaService: KafkaService,
    ) {
        this.kafka = new Kafka({
            clientId: 'emergence-route-api-consumer',
            brokers: [process.env.KAFKA_BROKER || 'localhost:9092'],
            logLevel: logLevel.WARN,
            retry: {
                initialRetryTime: 300,
                retries: 10,
                factor: 2,
                maxRetryTime: 30000,
            },
            requestTimeout: 30000,
        });
        this.consumer = this.kafka.consumer({ groupId: 'audit-group' });
    }

    async onModuleInit() {
        try {
            await this.consumer.connect();
            await this.consumer.subscribe({ topic: 'audit-events', fromBeginning: true });
            await this.consumer.subscribe({ topic: 'location-updates', fromBeginning: false });

            await this.consumer.run({
                eachMessage: async ({ topic, message }) => {
                    if (!message.value) return;

                    const content = JSON.parse(message.value.toString());

                    switch (topic) {
                        case "audit-events": await this.handleAudit(content);
                            break;

                        case 'location-updates': await this.handleLocation(content as TrackingInputDTO);
                            break;
                    }
                },
            });
            console.log("Kafka Consumer conectado e escutando 'audit-events'.");
        } catch (error: any) {
            console.error("Aviso: Erro ao conectar Kafka Consumer.", error.message);
        }
    }

    async onModuleDestroy() {
        await this.consumer.disconnect();
    }

    async handleAudit(content: { eventType: string, payload: any }) {
        await this.prisma.auditlog.create({
            data: {
                eventType: content.eventType,
                payload: content.payload,
            }
        });
        console.log(`[kafka consumer] audit log created: ${content.eventType}`);
    }

    async handleLocation(data: TrackingInputDTO) {
        const before = await this.prisma.vehicule.findUnique({
            where: { id: data.vehiculeId },
            select: { trackingEnable: true },
        });

        const vehicule = await this.prisma.vehicule.update({
            where: { id: data.vehiculeId },
            data: {
                latitude: data.latitude,
                longitude: data.longitude,
                trackingEnable: true,
                lastSeen: new Date(),
            },
        });

        if (!before?.trackingEnable) {
            await this.kafkaService.publishAuditEvent("TRACKING_STARTED", {
                vehiculeId: vehicule.id,
            });
        }


        await this.prisma.telemetry.create({
            data: {
                vehiculeId: vehicule.id,
                latitude: data.latitude,
                longitude: data.longitude,
                speed: data.speed ?? null,  // m/s vindo do browser
                accuracy: data.accuracy ?? null,  // precisão do GPS em metros
                heading: data.heading ?? null,  // direção em graus
            },
        });

        this.realtimeService.emitVehiculeLocationUpdate(
            vehicule.id,
            vehicule.latitude,
            vehicule.longitude,
            data.speed ?? null,
            data.heading ?? null,
            data.accuracy ?? null,
        );

        return vehicule;
    }
}
