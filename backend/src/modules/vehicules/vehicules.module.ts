import { Module } from "@nestjs/common";
import { VehiculesController } from "./vehicules.controller";
import { VehiculesService } from "./vehicules.service";
import { PrismaModule } from "../prisma/prisma.module";

@Module({
    imports: [PrismaModule],
    controllers: [VehiculesController],
    providers: [VehiculesService],
    exports: [VehiculesService],
})
export class VehiculesModule { }
