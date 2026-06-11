import { Module } from "@nestjs/common";
import { RabbitMQService } from "./rabbitMQ.service";

@Module({
    exports: [RabbitMQService],
    providers: [RabbitMQService]
})
export class RabbitMQModule { }