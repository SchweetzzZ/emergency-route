import { Module, forwardRef } from "@nestjs/common";
import { KafkaService } from "./kafka.service";
import { KafkaConsumer } from "./kafka.consumer";
import { PrismaModule } from "../prisma/prisma.module";
import { RealtimeModule } from "../realtime/realtime.module";

@Module({
    imports: [PrismaModule, forwardRef(() => RealtimeModule)],
    providers: [KafkaService, KafkaConsumer],
    exports: [KafkaService]
})
export class KafkaModule { }
