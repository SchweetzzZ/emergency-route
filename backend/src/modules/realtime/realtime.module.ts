import { Module, forwardRef } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { RealtimeService } from "./realtime.service";
import { KafkaModule } from "../kafka/kafka.module";

@Module({
    imports: [
        JwtModule.register({
            secret: process.env.JWT_SECRET || process.env.jwtSecret || "secret",
            signOptions: { expiresIn: "1d" },
        }),
        forwardRef(() => KafkaModule),
    ],
    providers: [RealtimeService],
    exports: [RealtimeService],
})
export class RealtimeModule { }
