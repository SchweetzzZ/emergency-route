import {
    ConnectedSocket,
    MessageBody,
    OnGatewayConnection,
    OnGatewayDisconnect,
    SubscribeMessage,
    WebSocketGateway,
    WebSocketServer,
    WsException,
} from "@nestjs/websockets";
import { JwtService } from "@nestjs/jwt";
import { Server, Socket } from "socket.io";
import { KafkaService } from "../kafka/kafka.service";
import { TrackingInputDTO, TrackingSchema } from "../tracking/schemas/zod-validation";

type TrackerSocketData = {
    type: "tracking-device";
    vehiculeId: string;
};

type DashboardSocketData = {
    type: "user";
    userId: string;
    email: string;
    role: string;
};

@WebSocketGateway({
    namespace: "/realtime",
    cors: { origin: "*" },
    transports: ["websocket"],
})
export class RealtimeService implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(
        private readonly jwtService: JwtService,
        private readonly kafkaService: KafkaService,
    ) { }

    handleConnection(client: Socket) {
        try {
            const suppliedToken = client.handshake.auth?.token || client.handshake.headers.authorization;
            const rawToken = typeof suppliedToken === "string"
                ? suppliedToken.replace(/^Bearer\s+/i, "").trim()
                : undefined;

            if (!rawToken) {
                client.emit("requires_auth", "Autenticação JWT necessária");
                client.disconnect(true);
                return;
            }

            const payload = this.jwtService.verify(rawToken, {
                secret: process.env.JWT_SECRET || process.env.jwtSecret || "secret",
            });

            if (payload.type === "tracking-device" && typeof payload.vehiculeId === "string") {
                client.data.auth = {
                    type: "tracking-device",
                    vehiculeId: payload.vehiculeId,
                } satisfies TrackerSocketData;
                return;
            }

            client.data.auth = {
                type: "user",
                userId: payload.sub,
                email: payload.email,
                role: payload.role,
            } satisfies DashboardSocketData;
        } catch {
            client.emit("requires_auth", "Token JWT inválido ou expirado");
            client.disconnect(true);
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Socket desconectado: ${client.id}`);
    }

    @SubscribeMessage("vehicule_join")
    handleVehiculeJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { vehiculeId: string },
    ) {
        const auth = client.data.auth as TrackerSocketData | DashboardSocketData | undefined;

        if (!auth || auth.type !== "user") {
            throw new WsException("Apenas operadores podem acompanhar viaturas.");
        }

        client.join(`vehicule:${payload.vehiculeId}`);
    }

    @SubscribeMessage("vehicule_leave")
    handleVehiculeLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { vehiculeId: string },
    ) {
        client.leave(`vehicule:${payload.vehiculeId}`);
    }

    @SubscribeMessage("incident_join")
    handleIncidentJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { incidentId: string },
    ) {
        client.join(`incident:${payload.incidentId}`);
    }

    @SubscribeMessage("incident_leave")
    handleIncidentLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { incidentId: string },
    ) {
        client.leave(`incident:${payload.incidentId}`);
    }

    @SubscribeMessage("location.update")
    async handleLocationUpdate(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: unknown,
    ) {
        const auth = client.data.auth as TrackerSocketData | DashboardSocketData | undefined;

        if (!auth || (auth.type === "user" && auth.role !== "ADMIN")) {
            throw new WsException("Socket não autorizado para enviar localização.");
        }

        const parsed = TrackingSchema.safeParse(payload);

        if (!parsed.success) {
            throw new WsException({
                message: "Payload de localização inválido.",
                issues: parsed.error.issues,
            });
        }

        const data: TrackingInputDTO = parsed.data;

        if (auth.type === "tracking-device" && data.vehiculeId !== auth.vehiculeId) {
            throw new WsException("Este dispositivo não pode atualizar outra viatura.");
        }

        await this.kafkaService.publishLocation(data);

        client.emit("location.accepted", {
            eventId: data.eventId,
            acceptedAt: new Date().toISOString(),
        });
    }

    // Development-only route simulator used by the admin dashboard.
    @SubscribeMessage("location.simulate")
    async handleSimulatedLocation(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: unknown,
    ) {
        const auth = client.data.auth as TrackerSocketData | DashboardSocketData | undefined;

        if (!auth || auth.type !== "user" || auth.role !== "ADMIN") {
            throw new WsException("Apenas administradores podem simular telemetria.");
        }

        const parsed = TrackingSchema.safeParse(payload);

        if (!parsed.success) {
            throw new WsException("Payload de simulação inválido.");
        }

        await this.kafkaService.publishLocation(parsed.data);
    }

    emitVehiculeLocationUpdate(
        vehiculeId: string,
        latitude: number,
        longitude: number,
        speed: number | null,
        heading: number | null,
        accuracy: number | null,
        capturedAt: string,
    ) {
        this.server.to(`vehicule:${vehiculeId}`).emit("vehicule.location.updated", {
            vehiculeId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
            capturedAt,
        });
    }

    notifyDispatchAssigned(vehiculeId: string, payload: unknown) {
        this.server.to(`vehicule:${vehiculeId}`).emit("dispatch_assigned", payload);
    }
}
