import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { CreateVehiculeDto, UpdateVehiculeDto } from "./schema/vehicule-zod";

@Injectable()
export class VehiculesService {
    constructor(private prisma: PrismaService) { }

    async createVehicule(data: CreateVehiculeDto) {
        const createdVehicule = await this.prisma.vehicule.create({
            data
        })
        return createdVehicule
    }

    async updateVehicule(id: string, data: UpdateVehiculeDto) {
        const updatedVehicule = await this.prisma.vehicule.update({
            where: {
                id
            },
            data
        })
        return updatedVehicule
    }

    async deleteVehicule(id: string) {
        const deletedVehicule = await this.prisma.vehicule.delete({
            where: {
                id
            }
        })
        return deletedVehicule
    }

    async listVehicules() {
        const vehicules = await this.prisma.vehicule.findMany()
        return vehicules
    }

    async getVehiculeById(id: string) {
        const vehicule = await this.prisma.vehicule.findUnique({
            where: {
                id
            }
        })
        return vehicule
    }
}