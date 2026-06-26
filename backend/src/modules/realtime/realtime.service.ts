import {
    WebSocketGateway, WebSocketServer, OnGatewayInit, SubscribeMessage, OnGatewayConnection,
    OnGatewayDisconnect, MessageBody, WsException,
    ConnectedSocket,
} from "@nestjs/websockets";
import { Server, Socket } from "socket.io"
import { JwtService } from "@nestjs/jwt";
import { KafkaService } from "../kafka/kafka.service";
import { success } from "zod";

@WebSocketGateway({
    cors: {
        origin: "*"
    },
    namespace: "realtime"
})

@WebSocketGateway()
export class RealtimeService implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server
    constructor(private readonly jwtService: JwtService,
        private readonly kafkaService: KafkaService
    ) { }

    handleConnection(client: Socket) {
        try {
            const token = client.handshake.auth?.token ||
                client.handshake.headers?.authorization
            client.handshake.query?.token

            if (token) {
                const secret = process.env.JWT_SECRET || process.env.jwtSecret || 'secret';
                const payload = this.jwtService.verify(token, { secret })
                client.data.user = payload
                console.log(`Cliente autenticado conectado: ${payload.email} (Socket ID: ${client.id})`);
            } else {
                console.log(`Cliente anônimo conectado (Socket ID: ${client.id})`);
            }
        }
        catch (error) {
            throw new WsException("Falha na autenticação do Socket")
        }
    }

    handleDisconnect(client: Socket) {
        console.log(`Cliente desconectado: ${client.id}`)
    }


    @SubscribeMessage("vehicule_join")
    handleVehiculeJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { vehiculeId: string }) {
        const room = `vehicule:${payload.vehiculeId}`
        client.join(room)

        console.log(`Cliente ${client.id} entrou na sala ${room}`)

        return { event: "joined!", room }
    }

    @SubscribeMessage("vehicule_leave")
    handleVehiculeLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { vehiculeId: string }) {
        const room = `vehicule:${payload.vehiculeId}`
        client.leave(room)

        console.log(`Cliente ${client.id} saiu da sala ${room}`)

        return { event: "left!", room }
    }

    @SubscribeMessage("incident_join")
    handleIncidentJoin(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { incidentId: string }) {
        const room = `incident:${payload.incidentId}`
        client.join(room)

        console.log(`Cliente ${client.id} entrou na sala ${room}`)

        return { event: "joined!", room }
    }

    @SubscribeMessage("incident_leave")
    handleIncidentLeave(
        @ConnectedSocket() client: Socket,
        @MessageBody() payload: { incidentId: string }) {
        const room = `incident:${payload.incidentId}`
        client.leave(room)

        console.log(`Cliente ${client.id} saiu da sala ${room}`)

        return { event: "left!", room }
    }
    //Metodo experimental para o socket ser o principal provedor
    @SubscribeMessage("tracking_localization")
    async handleTrackingLocalization(
        @MessageBody() payload: {
            vehiculeId: string;
            latitude: number;
            longitude: number;
            speed?: number;
            accuracy?: number;
            heading?: number;
        },
    ) {
        await this.kafkaService.publishLocation(payload)
        return { success: true }

    }

    emitVehiculeLocationUpdate(
        vehiculeId: string,
        latitude: number,
        longitude: number,
        speed: number | null = null,
        heading: number | null = null,
        accuracy: number | null = null,
    ) {
        this.server.to(`vehicule:${vehiculeId}`).emit('vehicule.location.updated', {
            vehiculeId,
            latitude,
            longitude,
            speed,
            heading,
            accuracy,
            timestamp: new Date().toISOString(),
        })
    }

    notifyDispatchAssigned(vehiculeId: string, payload: unknown) {
        this.server.to(`vehicule:${vehiculeId}`).emit(`dispatch_assigned`, payload)
    }
}