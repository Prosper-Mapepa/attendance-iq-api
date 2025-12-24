import { PrismaService } from '../common/prisma/prisma.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
export declare class SessionsService {
    private prisma;
    constructor(prisma: PrismaService);
    findAll(teacherId: string): Promise<({
        class: {
            name: string;
            id: string;
            subject: string;
            schedule: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        classId: string;
        otp: string;
        validUntil: Date;
        clockInDeadline: Date;
        classDuration: number;
    })[]>;
    create(createSessionDto: CreateSessionDto, teacherId: string): Promise<{
        class: {
            name: string;
            id: string;
            subject: string;
            schedule: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        classId: string;
        otp: string;
        validUntil: Date;
        clockInDeadline: Date;
        classDuration: number;
    }>;
    validateOtp(validateOtpDto: ValidateOtpDto): Promise<{
        valid: boolean;
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
            clockInDeadline: Date;
            classDuration: number;
        };
    }>;
}
