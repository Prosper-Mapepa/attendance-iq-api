import { Module } from '@nestjs/common';
import { AttendanceController } from './attendance.controller';
import { AttendanceService } from './attendance.service';
import { AntiProxyService } from './anti-proxy.service';
import { UsersModule } from '../users/users.module';
import { SessionsModule } from '../sessions/sessions.module';
import { PrismaModule } from '../common/prisma/prisma.module';

@Module({
  imports: [UsersModule, SessionsModule, PrismaModule],
  controllers: [AttendanceController],
  providers: [AttendanceService, AntiProxyService],
  exports: [AttendanceService, AntiProxyService],
})
export class AttendanceModule {}

