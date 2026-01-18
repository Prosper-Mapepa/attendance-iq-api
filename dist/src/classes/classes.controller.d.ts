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
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        name: string;
        subject: string | null;
        schedule: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
    }>;
    findAll(req: AuthenticatedRequest): Promise<({
        teacher: {
            id: string;
            name: string;
            email: string;
        };
        sessions: {
            id: string;
            createdAt: Date;
            otp: string;
            validUntil: Date;
        }[];
    } & {
        id: string;
        name: string;
        subject: string | null;
        schedule: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
    })[]>;
    findOne(id: string, req: AuthenticatedRequest): Promise<{
        teacher: {
            id: string;
            name: string;
            email: string;
        };
        sessions: {
            id: string;
            createdAt: Date;
            otp: string;
            validUntil: Date;
        }[];
    } & {
        id: string;
        name: string;
        subject: string | null;
        schedule: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
    }>;
    getClassDetails(id: string, req: AuthenticatedRequest): Promise<{
        class: {
            teacher: {
                id: string;
                name: string;
                email: string;
            };
        } & {
            id: string;
            name: string;
            subject: string | null;
            schedule: string | null;
            description: string | null;
            latitude: number | null;
            longitude: number | null;
            locationRadius: number | null;
            createdAt: Date;
            updatedAt: Date;
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
            id: string;
            name: string;
            email: string;
        }[];
        studentAttendanceStats: {
            student: {
                id: string;
                name: string;
                email: string;
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
                id: string;
                name: string;
                email: string;
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
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        name: string;
        subject: string | null;
        schedule: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
    }>;
    remove(id: string, req: AuthenticatedRequest): Promise<{
        teacher: {
            id: string;
            name: string;
            email: string;
        };
    } & {
        id: string;
        name: string;
        subject: string | null;
        schedule: string | null;
        description: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
    }>;
}
export {};
