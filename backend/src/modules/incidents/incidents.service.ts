import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateIncidentDto, UpdateIncidentDto } from "./schemas/incident-zod";
import { RedisService } from "../redis/redis.service";

@Injectable()
export class IncidentsService {
    constructor(
        private prisma: PrismaService,
        private redisService: RedisService
    ) { }

    async createIncident(data: CreateIncidentDto) {
        const result = await this.prisma.incident.create({
            data,
        })
        await this.redisService.getClient().zadd("pendding_incidents", result.priority, result.id)
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

    async getPriorityIncidents() {
        const resultPeding = await this.redisService.getPendingAcidents();
        return resultPeding
    }

}