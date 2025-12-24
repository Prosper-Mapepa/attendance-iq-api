import { PrismaService } from '../common/prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
export declare class UsersService {
    private prisma;
    constructor(prisma: PrismaService);
    create(createUserDto: CreateUserDto): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findAll(): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }[]>;
    findOne(id: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findOneWithPassword(id: string): Promise<{
        name: string;
        email: string;
        id: string;
        passwordHash: string;
    }>;
    findByEmail(email: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByQRCode(qrCode: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByResetToken(resetToken: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateResetToken(userId: string, resetToken: string, resetTokenExpiry: Date): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updatePassword(userId: string, passwordHash: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    updateEmailVerificationToken(userId: string, pendingEmail: string | null, verificationToken: string | null, verificationExpiry: Date | null): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    findByEmailVerificationToken(token: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        passwordHash: string;
        resetToken: string | null;
        resetTokenExpiry: Date | null;
        pendingEmail: string | null;
        emailVerificationToken: string | null;
        emailVerificationExpiry: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    verifyAndUpdateEmail(userId: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    update(id: string, updateUserDto: UpdateUserDto): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
    remove(id: string): Promise<{
        name: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        qrCode: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
}
