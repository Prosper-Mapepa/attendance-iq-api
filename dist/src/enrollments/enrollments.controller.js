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
exports.EnrollmentsController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const enrollments_service_1 = require("./enrollments.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let EnrollmentsController = class EnrollmentsController {
    constructor(enrollmentsService) {
        this.enrollmentsService = enrollmentsService;
    }
    async getAvailableClasses(req) {
        return this.enrollmentsService.getAvailableClasses(req.user.id);
    }
    async getStudentEnrollments(req) {
        return this.enrollmentsService.getStudentEnrollments(req.user.id);
    }
    async enrollInClass(classId, req) {
        return this.enrollmentsService.enrollInClass(req.user.id, classId);
    }
    async unenrollFromClass(classId, req) {
        return this.enrollmentsService.unenrollFromClass(req.user.id, classId);
    }
};
exports.EnrollmentsController = EnrollmentsController;
__decorate([
    (0, common_1.Get)('available'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available classes for enrollment' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Available classes retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EnrollmentsController.prototype, "getAvailableClasses", null);
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get student enrollments' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Enrollments retrieved' }),
    __param(0, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EnrollmentsController.prototype, "getStudentEnrollments", null);
__decorate([
    (0, common_1.Post)(':classId'),
    (0, swagger_1.ApiOperation)({ summary: 'Enroll in a class' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Successfully enrolled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Class not found' }),
    (0, swagger_1.ApiResponse)({ status: 409, description: 'Already enrolled' }),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EnrollmentsController.prototype, "enrollInClass", null);
__decorate([
    (0, common_1.Delete)(':classId'),
    (0, swagger_1.ApiOperation)({ summary: 'Unenroll from a class' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Successfully unenrolled' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Enrollment not found' }),
    __param(0, (0, common_1.Param)('classId')),
    __param(1, (0, common_1.Request)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], EnrollmentsController.prototype, "unenrollFromClass", null);
exports.EnrollmentsController = EnrollmentsController = __decorate([
    (0, swagger_1.ApiTags)('Enrollments'),
    (0, common_1.Controller)('enrollments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [enrollments_service_1.EnrollmentsService])
], EnrollmentsController);
//# sourceMappingURL=enrollments.controller.js.map