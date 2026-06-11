import { Injectable, OnModuleInit } from "@nestjs/common";
import * as amqp from "amqplib"

@Injectable()
export class RabbitMQService implements OnModuleInit {
    private channel: amqp.Channel

    async onModuleInit() {
        const connection = await amqp.connect("amqp://localhost:5672")
        this.channel = await connection.createChannel()

        await this.channel.assertQueue("dispatch_queue",
            {
                durable: true
            }
        )
        console.log("rabbitMQ conectado")
    }

    async getChannel() {
        return this.channel
    }

    async publishDispatch(payload: {
        assignmentId: string,
        incidentId: string,
        vehiculeId: string,
    }) {
        this.channel.sendToQueue("dispatch_queue", Buffer.from(JSON.stringify(payload)),
            {
                persistent: true
            })
    }
}