"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceController = void 0;
const common_1 = require("@nestjs/common");
const attendance_service_1 = require("./attendance.service");
const anti_proxy_service_1 = require("./anti-proxy.service");
const prisma_service_1 = require("../common/prisma/prisma.service");
const mark_attendance_dto_1 = require("./dto/mark-attendance.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let AttendanceController = class AttendanceController {
    constructor(attendanceService, antiProxyService, prisma) {
        this.attendanceService = attendanceService;
        this.antiProxyService = antiProxyService;
        this.prisma = prisma;
    }
    async getAttendanceRecords(req) {
        return this.attendanceService.getAttendanceRecords(req.user.id);
    }
    async markAttendance(markAttendanceDto, req) {
        return this.attendanceService.markAttendance(markAttendanceDto, req.user.id);
    }
    async getSessionAttendance(sessionId, req) {
        return this.attendanceService.getSessionAttendance(sessionId, req.user.id);
    }
    async getFlaggedStudents(classId, req) {
        if (req.user.role !== 'TEACHER') {
            throw new Error('Only teachers can view flagged students');
        }
        const instructorClasses = await this.prisma.class.findMany({
            where: {
                teacherId: req.user.id,
            },
            select: {
                id: true,
                name: true,
            },
        });
        if (instructorClasses.length === 0) {
            return [];
        }
        const instructorClassIds = instructorClasses.map(cls => cls.id);
        if (classId && classId !== 'all') {
            if (!instructorClassIds.includes(classId)) {
                throw new Error('Class not found or access denied');
            }
            return this.antiProxyService.getFlaggedStudentsByClasses([classId]);
        }
        return this.antiProxyService.getFlaggedStudentsByClasses(instructorClassIds);
    }
};
exports.AttendanceController = AttendanceController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getAttendanceRecords", null);
__decorate([
    (0, common_1.Post)('mark'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [mark_attendance_dto_1.MarkAttendanceDto, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "markAttendance", null);
__decorate([
    (0, common_1.Get)('session/:sessionId'),
    __param(0, (0, common_1.Param)('sessionId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getSessionAttendance", null);
__decorate([
    (0, common_1.Get)('flagged-students/:classId?'),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AttendanceController.prototype, "getFlaggedStudents", null);
exports.AttendanceController = AttendanceController = __decorate([
    (0, common_1.Controller)('attendance'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [attendance_service_1.AttendanceService,
        anti_proxy_service_1.AntiProxyService,
        prisma_service_1.PrismaService])
], AttendanceController);
//# sourceMappingURL=attendance.controller.js.map