export declare enum UserRole {
    TEACHER = "TEACHER",
    STUDENT = "STUDENT",
    ADMIN = "ADMIN"
}
export declare class RegisterDto {
    name: string;
    email: string;
    password: string;
    role: UserRole;
}
