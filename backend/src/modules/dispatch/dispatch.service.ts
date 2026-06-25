import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { DispatchDto, DispatchStatusDto } from "./schemas/zod-validation"
import { VehiculesService } from "../vehicules/vehicules.service"
import { RabbitMQService } from "../rabbitMQ/rabbitMQ.service"
import { KafkaService } from "../kafka/kafka.service"

@Injectable()
export class DispatchService {
    constructor(
        private prisma: PrismaService,
        private vehiculeService: VehiculesService,
        private rabbitMQService: RabbitMQService,
        private kafkaService: KafkaService
    ) { }

    async listAssignments() {
        return this.prisma.assignment.findMany({
            include: {
                incident: true,
                vehicule: true,
            },
            orderBy: { assignedAt: "desc" },
        })
    }

    async getAssignmentById(id: string) {
        const assignment = await this.prisma.assignment.findUnique({
            where: { id },
            include: {
                incident: true,
                vehicule: true,
            },
        })
        if (!assignment) throw new NotFoundException("Despacho não encontrado")
        return assignment
    }

    async dispatchIncident(data: DispatchDto) {
        const verifyIncident = await this.prisma.incident.findUnique({
            where: { id: data.incidentId }
        })
        if (!verifyIncident) {
            throw new NotFoundException("Incidente não encontrado")
        }
        if (verifyIncident.status !== "PENDING") {
            throw new BadRequestException("Incidente não está pendente")
        }

        const vehicle = await this.prisma.vehicule.findUnique({
            where: { id: data.vehiculeId }
        })
        if (!vehicle) {
            throw new NotFoundException("Veículo não encontrado")
        }
        if (vehicle.status !== "AVAILABLE") {
            throw new BadRequestException("Veículo não está disponível")
        }

        return this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.create({
                data: {
                    incidentId: data.incidentId,
                    vehiculeId: data.vehiculeId
                },
                include: { incident: true, vehicule: true }
            })
            await tx.incident.update({
                where: { id: data.incidentId },
                data: { status: "IN_PROGRESS" }
            })
            await tx.vehicule.update({
                where: { id: data.vehiculeId },
                data: { status: "DISPATCHED" }
            })
            await this.rabbitMQService.publishDispatch({
                assignmentId: assignment.id,
                incidentId: assignment.incidentId,
                vehiculeId: assignment.vehiculeId
            })
            await this.kafkaService.publishAuditEvent("DISPATCH_ASSIGNED", {
                assignmentId: assignment.id,
                incidentId: assignment.incidentId,
                vehiculeId: assignment.vehiculeId,
                timestamp: new Date()
            })
            return assignment
        })
    }

    async acceptDispatch(data: DispatchStatusDto) {
        const verifyAssignmet = await this.prisma.assignment.findUnique({
            where: { id: data.assignmentId }
        })
        if (!verifyAssignmet) {
            throw new NotFoundException("Despacho não encontrado")
        }
        if (verifyAssignmet.status !== "ASSIGNED") {
            throw new BadRequestException("Despacho não está pendente")
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.assignment.update({
                where: { id: data.assignmentId },
                data: { status: "ACCEPTED", acceptedAt: new Date() },
                include: { incident: true, vehicule: true }
            })
            await tx.vehicule.update({
                where: { id: data.vehiculeId },
                data: { status: "EN_ROUTE" }
            })
            await this.kafkaService.publishAuditEvent("DISPATCH_ACCEPTED", {
                assignmentId: data.assignmentId,
                vehiculeId: data.vehiculeId,
                incidentId: verifyAssignmet.incidentId,
                timestamp: new Date()
            })
            return updated
        })
    }

    async startRoute(data: DispatchStatusDto) {
        const verifyAssignment = await this.prisma.assignment.findUnique({
            where: { id: data.assignmentId }
        })
        if (!verifyAssignment) {
            throw new NotFoundException("Despacho não encontrado")
        }
        if (verifyAssignment.status !== "ACCEPTED") {
            throw new BadRequestException("Despacho não está aceito")
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.assignment.update({
                where: { id: data.assignmentId },
                data: { status: "EN_ROUTE" },
                include: { incident: true, vehicule: true }
            })
            await tx.vehicule.update({
                where: { id: data.vehiculeId },
                data: { status: "EN_ROUTE" }
            })
            await this.kafkaService.publishAuditEvent("EN_ROUTE", {
                assignmentId: data.assignmentId,
                vehiculeId: data.vehiculeId,
                incidentId: verifyAssignment.incidentId,
                timestamp: new Date()
            })
            return updated
        })
    }

    async arrivedAtScene(data: DispatchStatusDto) {
        const verifyAssignment = await this.prisma.assignment.findUnique({
            where: { id: data.assignmentId }
        })
        if (!verifyAssignment) {
            throw new NotFoundException("Despacho não encontrado")
        }
        if (verifyAssignment.status !== "EN_ROUTE") {
            throw new BadRequestException("Despacho não está em rota")
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.assignment.update({
                where: { id: data.assignmentId },
                data: { status: "ARRIVED", arrivedAt: new Date() },
                include: { incident: true, vehicule: true }
            })
            await tx.vehicule.update({
                where: { id: data.vehiculeId },
                data: { status: "AT_INCIDENT" }
            })
            await this.kafkaService.publishAuditEvent("ARRIVED_AT_SCENE", {
                assignmentId: data.assignmentId,
                vehiculeId: data.vehiculeId,
                incidentId: verifyAssignment.incidentId,
                timestamp: new Date()
            })
            return updated
        })
    }

    async completedDispatch(data: DispatchStatusDto) {
        const verifyAssignment = await this.prisma.assignment.findUnique({
            where: { id: data.assignmentId }
        })
        if (!verifyAssignment) {
            throw new NotFoundException("Despacho não encontrado")
        }
        if (verifyAssignment.status !== "ARRIVED") {
            throw new BadRequestException("Despacho não está no local")
        }
        return this.prisma.$transaction(async (tx) => {
            const updated = await tx.assignment.update({
                where: { id: data.assignmentId },
                data: { status: "COMPLETED", completedAt: new Date() },
                include: { incident: true, vehicule: true }
            })
            await tx.vehicule.update({
                where: { id: data.vehiculeId },
                data: { status: "AVAILABLE" }
            })
            const activeAssignments = await tx.assignment.count({
                where: {
                    incidentId: verifyAssignment.incidentId,
                    status: { in: ["ASSIGNED", "ACCEPTED", "EN_ROUTE", "ARRIVED"] },
                },
            })
            if (activeAssignments === 0) {
                await tx.incident.update({
                    where: { id: verifyAssignment.incidentId },
                    data: { status: "RESOLVED" }
                })
            }
            await this.kafkaService.publishAuditEvent("DISPATCH_COMPLETED", {
                assignmentId: data.assignmentId,
                vehiculeId: data.vehiculeId,
                incidentId: verifyAssignment.incidentId,
                timestamp: new Date()
            })
            return updated
        })
    }
    async autoDispatch(incidentId: string) {
        const nearestVehicules = await this.vehiculeService.findNearestVehicule(incidentId)

        if (!nearestVehicules) {
            throw new NotFoundException("Nenhum veículo disponível encontrado")
        }
        const nearestVehicule = nearestVehicules[0]

        return this.dispatchIncident({
            incidentId,
            vehiculeId: nearestVehicule.id
        })
    }
}