import { Controller, Get } from "@nestjs/common";
import { RedisService } from "./redis.service";

@Controller("redis")
export class RedisController {
    constructor(
        private readonly redisService: RedisService
    ) { }

    @Get("")
    async getRedisClient() {
        return this.redisService.getClient();
    }

    @Get("/pending")
    async getPendingIncidents() {
        return this.redisService.getPendingAcidents();
    }
}