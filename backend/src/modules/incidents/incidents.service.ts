import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIncidentDto, UpdateIncidentDto } from "./schemas/incident-zod";

@Injectable()
export class IncidentsService {
    constructor(private prisma: PrismaService) { }

    async createIncident(data: CreateIncidentDto) {
        const result = await this.prisma.incident.create({
            data,
        })
        return result
    }
    async updatedIncident(data: UpdateIncidentDto, id: string) {
        const result = await this.prisma.incident.update({
            where: {
                id
            },
            data,
        })
        return result
    }
    async deleteIncident(id: string) {
        const result = await this.prisma.incident.delete({
            where: {
                id
            }
        })
        return result
    }
    async getIncidentById(id: string) {
        const result = await this.prisma.incident.findUnique({
            where: {
                id
            }
        })
        return result
    }
    async getAllIncident() {
        const result = await this.prisma.incident.findMany()
        return result
    }
}