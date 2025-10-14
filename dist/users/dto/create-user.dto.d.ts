export declare enum UserRole {
    TEACHER = "TEACHER",
    STUDENT = "STUDENT"
}
export declare class CreateUserDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
    qrCode?: string;
}
