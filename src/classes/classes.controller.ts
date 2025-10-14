import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request } from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

@Controller('classes')
@UseGuards(JwtAuthGuard)
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  create(@Body() createClassDto: CreateClassDto, @Request() req: AuthenticatedRequest) {
    return this.classesService.create(createClassDto, req.user.id);
  }

  @Get()
  findAll(@Request() req: AuthenticatedRequest) {
    // For teachers, show only their classes. For students, show all available classes.
    const teacherId = req.user.role === 'TEACHER' ? req.user.id : undefined;
    return this.classesService.findAll(teacherId);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.findOne(id, req.user.id);
  }

  @Get(':id/details')
  getClassDetails(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.getClassDetails(id, req.user.id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateClassDto: UpdateClassDto, @Request() req: AuthenticatedRequest) {
    return this.classesService.update(id, updateClassDto, req.user.id);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Request() req: AuthenticatedRequest) {
    return this.classesService.remove(id, req.user.id);
  }
}
