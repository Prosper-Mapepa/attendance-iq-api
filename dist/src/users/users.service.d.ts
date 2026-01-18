import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOneWithPassword(id: string): Promise<{
        id: string;
        email: string;
        name: string;
        passwordHash: string;
    }>;
    findByEmail(email: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByQRCode(qrCode: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByResetToken(resetToken: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateResetToken(userId: string, resetToken: string, resetTokenExpiry: Date): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePassword(userId: string, passwordHash: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmailVerificationToken(userId: string, pendingEmail: string | null, verificationToken: string | null, verificationExpiry: Date | null): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmailVerificationToken(token: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        passwordHash: string;
        role: import("@prisma/client").$Enums.UserRole;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    verifyAndUpdateEmail(userId: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        id: string;
        email: string;
        qrCode: string;
        name: string;
        role: import("@prisma/client").$Enums.UserRole;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
