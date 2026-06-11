import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { DispatchDto, DispatchStatusDto } from "./schemas/zod-validation"
import { VehiculesService } from "../vehicules/vehicules.service"
import { RabbitMQService } from "../rabbitMQ/rabbitMQ.service"

@Injectable()
export class DispatchService {
    constructor(
        private prisma: PrismaService,
        private vehiculeService: VehiculesService,
        private rabbitMQService: RabbitMQService) { }

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

        await this.prisma.$transaction(async (tx) => {
            const assignment = await tx.assignment.create({
                data: {
                    incidentId: data.incidentId,
                    vehiculeId: data.vehiculeId
                }
            })
            await tx.incident.update({
                where: {
                    id: data.incidentId
                },
                data: {
                    status: "IN_PROGRESS"
                }
            })
            await tx.vehicule.update({
                where: {
                    id: data.vehiculeId
                },
                data: {
                    status: "DISPATCHED"
                }
            })
            await this.rabbitMQService.publishDispatch({
                assignmentId: assignment.id,
                incidentId: assignment.incidentId,
                vehiculeId: assignment.vehiculeId
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
        await this.prisma.$transaction(async (tx) => {
            await tx.assignment.update({
                where: {
                    id: data.assignmentId
                },
                data: {
                    status: "ACCEPTED",
                    acceptedAt: new Date()
                }
            })
            await tx.vehicule.update({
                where: {
                    id: data.vehiculeId
                },
                data: {
                    status: "EN_ROUTE"
                }
            })
            return {
                message: "Despacho aceito com sucesso"
            }
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
        await this.prisma.$transaction(async (tx) => {
            await tx.assignment.update({
                where: {
                    id: data.assignmentId
                },
                data: {
                    status: "EN_ROUTE",
                    arrivedAt: new Date()
                }
            })
            await tx.vehicule.update({
                where: {
                    id: data.vehiculeId
                },
                data: {
                    status: "EN_ROUTE"
                }
            })
            return {
                message: "Rota iniciada com sucesso"
            }
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
        await this.prisma.$transaction(async (tx) => {
            await tx.assignment.update({
                where: {
                    id: data.assignmentId
                },
                data: {
                    status: "ARRIVED",
                    arrivedAt: new Date()
                }
            })
            await tx.vehicule.update({
                where: {
                    id: data.vehiculeId
                },
                data: {
                    status: "AT_INCIDENT"
                }
            })
            return {
                message: "Chegada ao local realizada com sucesso"
            }
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
        await this.prisma.$transaction(async (tx) => {
            await tx.assignment.update({
                where: {
                    id: data.assignmentId
                },
                data: {
                    status: "COMPLETED",
                    completedAt: new Date()
                }
            })
            await tx.vehicule.update({
                where: {
                    id: data.vehiculeId
                },
                data: {
                    status: "AVAILABLE"
                }
            })
            const activeAssignments = await tx.assignment.count({
                where: {
                    incidentId: verifyAssignment.incidentId,
                    status: {
                        in: [
                            "ASSIGNED",
                            "ACCEPTED",
                            "EN_ROUTE",
                            "ARRIVED",
                        ],
                    },
                },
            })
            if (activeAssignments === 0) {
                await tx.incident.update({
                    where: {
                        id: data.incidentId
                    },
                    data: {
                        status: "RESOLVED"
                    }
                })
            }
            return {
                message: "Despacho concluído com sucesso"
            }
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