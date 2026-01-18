import { SessionsService } from './sessions.service';
import { CreateSessionDto } from './dto/create-session.dto';
import { ValidateOtpDto } from './dto/validate-otp.dto';
interface AuthenticatedRequest extends Request {
    user: {
        id: string;
        email: string;
        role: string;
    };
}
export declare class SessionsController {
    private readonly sessionsService;
    constructor(sessionsService: SessionsService);
    findAll(req: AuthenticatedRequest): Promise<({
        class: {
            id: string;
            name: string;
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
    create(createSessionDto: CreateSessionDto, req: AuthenticatedRequest): Promise<{
        class: {
            id: string;
            name: string;
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
                id: string;
                name: string;
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
export {};
