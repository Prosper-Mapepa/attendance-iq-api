import { PrismaService } from '../common/prisma/prisma.service';
interface DeviceFingerprint {
    deviceModel?: string;
    osVersion?: string;
    userAgent?: string;
    screenResolution?: string;
    timezone?: string;
    language?: string;
    batteryLevel?: number;
    isCharging?: boolean;
    networkSSID?: string;
}
interface SuspiciousAttemptResult {
    attemptCount: number;
    reasons: string[];
}
export declare class AntiProxyService {
    private prisma;
    private smsVerifications;
    private suspiciousAttempts;
    constructor(prisma: PrismaService);
    private extractAttemptCountFromNotes;
    generateDeviceFingerprint(deviceData: DeviceFingerprint): string;
    validateDeviceFingerprint(userId: string, deviceFingerprint: string): Promise<{
        isValid: boolean;
        isNewDevice: boolean;
        riskScore: number;
    }>;
    generateSMSVerification(studentId: string, sessionId: string, phoneNumber?: string): Promise<{
        code: string;
        expiresIn: number;
    }>;
    verifySMSCode(studentId: string, sessionId: string, providedCode: string): Promise<{
        isValid: boolean;
        attemptsRemaining: number;
    }>;
    detectSuspiciousActivity(studentId: string): Promise<{
        isSuspicious: boolean;
        reasons: string[];
        riskLevel: 'low' | 'medium' | 'high';
    }>;
    generatePhotoChallenge(): {
        gesture: string;
        instruction: string;
        expiresIn: number;
    };
    validatePhotoChallenge(studentId: string, gesture: string, photoData: string): Promise<{
        isValid: boolean;
        confidence: number;
    }>;
    trackSuspiciousAttempt(studentId: string, sessionId: string, riskScore: number, deviceFingerprint?: string): Promise<SuspiciousAttemptResult>;
    flagStudentForInstructor(studentId: string, classId: string, reasons: string[], riskScore: number, attemptCount?: number): Promise<void>;
    getFlaggedStudents(classId?: string): Promise<any[]>;
    getFlaggedStudentsByClasses(classIds: string[]): Promise<any[]>;
}
export {};
