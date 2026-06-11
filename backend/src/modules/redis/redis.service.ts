import { Injectable } from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import { Redis } from "ioredis";

@Injectable()
export class RedisService {
    private redis: Redis;

    constructor() {
        this.redis = new Redis({
            host: "localhost",
            port: 6379,
        });
    }

    getClient() {
        return this.redis;
    }

    async getPendingAcidents() {
        const resultPending = await this.redis.zrevrange(
            "pendding_incidents",
            0,
            9,
        );
        return resultPending
    }
}