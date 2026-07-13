import { Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { TrackingController } from "./tracking.controller";
import { TrackingService } from "./tracking.service";
import { PrismaModule } from "../prisma/prisma.module";
import { TrackingScheduler } from "./tracking.scheduler";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
    imports: [
        PrismaModule,
        KafkaModule,
        JwtModule.register({
            secret: process.env.JWT_SECRET || process.env.jwtSecret || "secret",
        }),
    ],
    controllers: [TrackingController],
    providers: [TrackingService, TrackingScheduler],
    exports: [TrackingService],
})
export class TrackingModule { }
