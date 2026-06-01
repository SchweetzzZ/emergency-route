import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
// import { AuthModule } from './modules/auth/auth.module';
import { IncidentsModule } from './modules/incidents/incidents.module';
import { PrismaModule } from './modules/prisma/prisma.module';

@Module({
  imports: [IncidentsModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }                                                                          
