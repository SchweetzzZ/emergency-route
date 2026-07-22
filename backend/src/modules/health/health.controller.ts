import { Controller, Get } from "@nestjs/common";
import { ApiTags, ApiOperation } from "@nestjs/swagger";
import { HealthService } from "./health.service";

@ApiTags("Saúde do Sistema")
@Controller("health")
export class HealthController {
    constructor(private readonly healthService: HealthService) {}

    @Get()
    @ApiOperation({ summary: "Verificar a saúde da API e do banco Postgres" })
    async check() {
        return this.healthService.check();
    }
}
