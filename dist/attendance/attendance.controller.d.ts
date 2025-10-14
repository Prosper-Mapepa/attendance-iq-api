import { AttendanceService } from './attendance.service';
import { AntiProxyService } from './anti-proxy.service';
import { PrismaService } from '../common/prisma/prisma.service';
import { MarkAttendanceDto } from './dto/mark-attendance.dto';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class AttendanceController {
    private readonly attendanceService;
    private readonly antiProxyService;
    private readonly prisma;
    constructor(attendanceService: AttendanceService, antiProxyService: AntiProxyService, prisma: PrismaService);
    getAttendanceRecords(req: AuthenticatedRequest): Promise<({
        session: {
            class: {
                name: string;
                id: string;
                subject: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            classId: string;
            otp: string;
            validUntil: Date;
        };
    } & {
        id: string;
        latitude: number | null;
        longitude: number | null;
        sessionId: string;
        studentId: string;
        timestamp: Date;
        location: string | null;
        deviceFingerprint: string | null;
        userAgent: string | null;
        screenResolution: string | null;
        riskScore: number | null;
        isNewDevice: boolean;
    })[]>;
    markAttendance(markAttendanceDto: MarkAttendanceDto, req: AuthenticatedRequest): Promise<{
        message: string;
        data: {
            session: {
                class: {
                    name: string;
                    id: string;
                    subject: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                classId: string;
                otp: string;
                validUntil: Date;
            };
        } & {
            id: string;
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        };
    }>;
    getSessionAttendance(sessionId: string, req: AuthenticatedRequest): Promise<{
        session: {
            id: string;
            otp: string;
            validUntil: Date;
            createdAt: Date;
            class: {
                id: string;
                name: string;
                subject: string;
            };
        };
        attendanceRecords: ({
            student: {
                name: string;
                email: string;
                id: string;
            };
        } & {
            id: string;
            latitude: number | null;
            longitude: number | null;
            sessionId: string;
            studentId: string;
            timestamp: Date;
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        })[];
        summary: {
            totalAttended: number;
            sessionCreated: Date;
            sessionValidUntil: Date;
        };
    }>;
    getFlaggedStudents(classId: string, req: AuthenticatedRequest): Promise<any[]>;
}
export {};
