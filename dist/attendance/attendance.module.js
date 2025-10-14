"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttendanceModule = void 0;
const common_1 = require("@nestjs/common");
const attendance_controller_1 = require("./attendance.controller");
const attendance_service_1 = require("./attendance.service");
const anti_proxy_service_1 = require("./anti-proxy.service");
const users_module_1 = require("../users/users.module");
const sessions_module_1 = require("../sessions/sessions.module");
const prisma_module_1 = require("../common/prisma/prisma.module");
let AttendanceModule = class AttendanceModule {
};
exports.AttendanceModule = AttendanceModule;
exports.AttendanceModule = AttendanceModule = __decorate([
    (0, common_1.Module)({
        imports: [users_module_1.UsersModule, sessions_module_1.SessionsModule, prisma_module_1.PrismaModule],
        controllers: [attendance_controller_1.AttendanceController],
        providers: [attendance_service_1.AttendanceService, anti_proxy_service_1.AntiProxyService],
        exports: [attendance_service_1.AttendanceService, anti_proxy_service_1.AntiProxyService],
    })
], AttendanceModule);
//# sourceMappingURL=attendance.module.js.map