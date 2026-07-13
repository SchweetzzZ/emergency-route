import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { KafkaService } from "../kafka/kafka.service";
import { Cron } from "@nestjs/schedule";

@Injectable()
export class TrackingScheduler {
    constructor(
        private readonly prisma: PrismaService,
        private readonly kafkaService: KafkaService,
    ) { }

    @Cron("0 * * * * *")
    async disableInactiveVehicles() {
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);

        // Busca os veículos antes de desativar para auditar cada um
        const inactiveVehicules = await this.prisma.vehicule.findMany({
            where: {
                trackingEnable: true,
                lastSeen: { lt: fiveMinutesAgo },
            },
            select: { id: true },
        });

        for (const vehicule of inactiveVehicules) {
            await this.kafkaService.publishAuditEvent("TRACKING_SIGNAL_LOST", {
                vehiculeId: vehicule.id,
            });
        }

        await this.prisma.vehicule.updateMany({
            where: {
                trackingEnable: true,
                lastSeen: { lt: fiveMinutesAgo },
            },
            data: { trackingEnable: false },
        });
    }
}
