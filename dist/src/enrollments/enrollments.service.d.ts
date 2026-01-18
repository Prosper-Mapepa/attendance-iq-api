import { PrismaService } from '../common/prisma/prisma.service';
export declare class EnrollmentsService {
    private prisma;
    constructor(prisma: PrismaService);
    enrollInClass(studentId: string, classId: string): Promise<{
        class: {
            teacher: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            subject: string | null;
            schedule: string | null;
            latitude: number | null;
            longitude: number | null;
            locationRadius: number | null;
            teacherId: string;
        };
    } & {
        id: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    }>;
    getStudentEnrollments(studentId: string): Promise<({
        class: {
            teacher: {
                id: string;
                email: string;
                name: string;
            };
        } & {
            id: string;
            name: string;
            createdAt: Date;
            updatedAt: Date;
            description: string | null;
            subject: string | null;
            schedule: string | null;
            latitude: number | null;
            longitude: number | null;
            locationRadius: number | null;
            teacherId: string;
        };
    } & {
        id: string;
        classId: string;
        studentId: string;
        enrolledAt: Date;
    })[]>;
    unenrollFromClass(studentId: string, classId: string): Promise<{
        message: string;
    }>;
    getAvailableClasses(studentId: string): Promise<({
        teacher: {
            id: string;
            email: string;
            name: string;
        };
    } & {
        id: string;
        name: string;
        createdAt: Date;
        updatedAt: Date;
        description: string | null;
        subject: string | null;
        schedule: string | null;
        latitude: number | null;
        longitude: number | null;
        locationRadius: number | null;
        teacherId: string;
    })[]>;
}
