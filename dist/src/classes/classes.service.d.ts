import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createClassDto: CreateClassDto, teacherId: string): Promise<{
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
    findAll(teacherId?: string): Promise<({
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
    findOne(id: string, teacherId?: string): Promise<{
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
    update(id: string, updateClassDto: UpdateClassDto, teacherId: string): Promise<{
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
    remove(id: string, teacherId: string): Promise<{
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
    getClassDetails(id: string, teacherId: string): Promise<{
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
}
