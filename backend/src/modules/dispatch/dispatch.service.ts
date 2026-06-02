import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common"
import { PrismaService } from "../prisma/prisma.service"
import { AssignVehiculeDto, UpdateAssignmentStatusDto } from "./schemas/zod-validation"

@Injectable()
export class DispatchService {
    constructor(private prisma: PrismaService) { }

    async dispatchIncident(data: AssignVehiculeDto) {
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
            await tx.assignment.create({
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
            return {
                message: "Incidente despachado com sucesso"
            }
        })
    }

    async dispatchIncidentUpdate(data: UpdateAssignmentStatusDto, id: string) {
        const result = await this.prisma.assignment.update({
            where: {
                id
            },
            data: {}
        })
        return result
    }

    async dispatchIncidentDelete(id: string) {
        const result = await this.prisma.assignment.delete({
            where: {
                id
            }
        })
        return result
    }

    async dispatchIncidentGetById(id: string) {
        const result = await this.prisma.assignment.findUnique({
            where: {
                id
            }
        })
        return result
    }

    async dispatchIncidentGetAll() {
        const result = await this.prisma.assignment.findMany()
        return result
    }
}