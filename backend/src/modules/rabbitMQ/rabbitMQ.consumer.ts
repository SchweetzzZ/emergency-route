import { Injectable, OnModuleInit } from "@nestjs/common";
import * as amqp from "amqplib"
import { RealtimeService } from "../realtime/realtime.service";

@Injectable()
export class RabbitMQConsumer implements OnModuleInit {
    constructor(private readonly realtimeService: RealtimeService) { }

    async onModuleInit() {
        const rabbitmqUrl = process.env.RABBITMQ_URL || "amqp://localhost:5672"
        const maxRetries = 10;

        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const connection = await amqp.connect(rabbitmqUrl)
                const chanel = await connection.createChannel()

                await chanel.assertQueue("dispatch_queue", {
                    durable: true,
                })

                chanel.consume(
                    "dispatch_queue",
                    async (message) => {
                        if (!message) return
                        const content = JSON.parse(message.content.toString());

                        console.log("Mensagem recebida", content)

                        await this.realtimeService.notifyDispatchAssigned(
                            content.vehiculeId,
                            content
                        )
                        chanel.ack(message)
                    }
                )
                console.log("RabbitMQ Consumer conectado")
                return;
            } catch (err) {
                console.log(`RabbitMQ Consumer tentativa ${attempt}/${maxRetries} falhou, tentando novamente em ${attempt * 2}s...`);
                if (attempt === maxRetries) {
                    console.error("RabbitMQ Consumer indisponível. Fila não será consumida.");
                    return;
                }
                await new Promise((r) => setTimeout(r, attempt * 2000));
            }
        }
    }
}