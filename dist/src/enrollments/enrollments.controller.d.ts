import { EnrollmentsService } from './enrollments.service';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class EnrollmentsController {
    private readonly enrollmentsService;
    constructor(enrollmentsService: EnrollmentsService);
    getAvailableClasses(req: AuthenticatedRequest): Promise<({
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
    getStudentEnrollments(req: AuthenticatedRequest): Promise<({
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
    enrollInClass(classId: string, req: AuthenticatedRequest): Promise<{
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
    unenrollFromClass(classId: string, req: AuthenticatedRequest): Promise<{
        message: string;
    }>;
}
export {};
