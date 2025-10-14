import { Controller, Post, Body, Get, UseGuards, Request } from '@nestjs/common';
import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('sessions')
@UseGuards(JwtAuthGuard)
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    return this.sessionsService.findAll(req.user.id);
  }

  @Post()
  create(@Body() createSessionDto: CreateSessionDto, @Request() req: AuthenticatedRequest) {
    return this.sessionsService.create(createSessionDto, req.user.id);
  }

  @Post('validate-otp')
  validateOtp(@Body() validateOtpDto: ValidateOtpDto) {
    return this.sessionsService.validateOtp(validateOtpDto);
  }
}
