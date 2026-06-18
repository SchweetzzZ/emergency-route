import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth/auth.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { VehiculesModule } from './modules/vehicules/vehicules.module';
import { PrismaModule } from './modules/prisma/prisma.module';
import { DispatchModule } from './modules/dispatch/dispatch.module';
import { RabbitMQModule } from './modules/rabbitMQ/rabbitMQ.module';
import { RedisModule } from './modules/redis/redis.module';
import { RealtimeModule } from './modules/realtime/realtime.module';
import { KafkaModule } from './modules/kafka/kafka.module';
import { TrackingModule } from './modules/tracking/tracking.module';
import { HealthModule } from './modules/health/health.module';

@Module({
  imports: [
    // Serve arquivos estáticos da pasta /public — ex: http://localhost:3000/tracking-client.html
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'public'),
      exclude: ['/api/(.*)', '/tracking/(.*)', '/auth/(.*)', '/health'],
    }),
    ScheduleModule.forRoot(),
    AuthModule,
    IncidentsModule,
    VehiculesModule,
    PrismaModule,
    DispatchModule,
    RabbitMQModule,
    RedisModule,
    RealtimeModule,
    KafkaModule,
    TrackingModule,
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }
