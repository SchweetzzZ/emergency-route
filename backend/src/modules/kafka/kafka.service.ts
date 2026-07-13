import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { Kafka, Producer, logLevel } from "kafkajs";
import { TrackingInputDTO } from "../tracking/schemas/zod-validation";

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
    private readonly kafka: Kafka;
    private readonly producer: Producer;

    constructor() {
        this.kafka = new Kafka({
            clientId: "emergency-route-api",
            brokers: [process.env.KAFKA_BROKER || "localhost:9092"],
            logLevel: logLevel.WARN,
            retry: {
                initialRetryTime: 300,
                retries: 10,
                factor: 2,
                maxRetryTime: 30000,
            },
            requestTimeout: 30000,
        });
        this.producer = this.kafka.producer();
    }

    async onModuleInit() {
        await this.producer.connect();
        console.log("Kafka Producer conectado com sucesso.");
    }

    async onModuleDestroy() {
        await this.producer.disconnect();
    }

    async publishAuditEvent(eventType: string, payload: unknown) {
        await this.producer.send({
            topic: "audit-events",
            acks: -1,
            messages: [{ value: JSON.stringify({ eventType, payload }) }],
        });
    }

    async publishLocation(data: TrackingInputDTO) {
        await this.producer.send({
            topic: "location-updates",
            acks: -1,
            messages: [{
                key: data.vehiculeId,
                value: JSON.stringify(data),
            }],
        });
    }
}
