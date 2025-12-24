import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class ClassesController {
    private readonly classesService;
    constructor(classesService: ClassesService);
    create(createClassDto: CreateClassDto, req: AuthenticatedRequest): Promise<{
        teacher: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    }>;
    findAll(req: AuthenticatedRequest): Promise<({
        teacher: {
            name: string;
            email: string;
            id: string;
        };
        sessions: {
            id: string;
            createdAt: Date;
            otp: string;
            validUntil: Date;
        }[];
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    })[]>;
    findOne(id: string, req: AuthenticatedRequest): Promise<{
        teacher: {
            name: string;
            email: string;
            id: string;
        };
        sessions: {
            id: string;
            createdAt: Date;
            otp: string;
            validUntil: Date;
        }[];
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    }>;
    getClassDetails(id: string, req: AuthenticatedRequest): Promise<{
        class: {
            teacher: {
                name: string;
                email: string;
                id: string;
            };
        } & {
            name: string;
            description: string | null;
            id: string;
            createdAt: Date;
            updatedAt: Date;
            subject: string | null;
            schedule: string | null;
            latitude: number | null;
            longitude: number | null;
            locationRadius: number | null;
            teacherId: string;
        };
        statistics: {
            totalSessions: number;
            totalAttendanceRecords: number;
            totalEnrolledStudents: number;
            averageAttendancePerSession: number;
        };
        recentSessions: {
            id: string;
            otp: string;
            createdAt: Date;
            validUntil: Date;
            attendanceCount: number;
        }[];
        enrolledStudents: {
            name: string;
            email: string;
            id: string;
        }[];
        studentAttendanceStats: {
            student: {
                name: string;
                email: string;
                id: string;
            };
            totalAttendance: number;
            attendanceRate: number;
            lastAttendance: Date;
        }[];
        recentAttendanceRecords: ({
            session: {
                id: string;
                createdAt: Date;
                otp: string;
                validUntil: Date;
            };
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
            clockInTime: Date | null;
            clockOutTime: Date | null;
            status: import("@prisma/client").$Enums.AttendanceStatus;
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        })[];
    }>;
    update(id: string, updateClassDto: UpdateClassDto, req: AuthenticatedRequest): Promise<{
        teacher: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    }>;
    remove(id: string, req: AuthenticatedRequest): Promise<{
        teacher: {
            name: string;
            email: string;
            id: string;
        };
    } & {
        name: string;
        description: string | null;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    }>;
}
export {};
