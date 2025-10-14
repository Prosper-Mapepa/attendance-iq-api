import { PrismaService } from '../common/prisma/prisma.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
export declare class ClassesService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createClassDto: CreateClassDto, teacherId: string): Promise<{
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
    findAll(teacherId?: string): Promise<({
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
    findOne(id: string, teacherId?: string): Promise<{
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
    update(id: string, updateClassDto: UpdateClassDto, teacherId: string): Promise<{
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
    remove(id: string, teacherId: string): Promise<{
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
    getClassDetails(id: string, teacherId: string): Promise<{
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
            location: string | null;
            deviceFingerprint: string | null;
            userAgent: string | null;
            screenResolution: string | null;
            riskScore: number | null;
            isNewDevice: boolean;
        })[];
    }>;
}
