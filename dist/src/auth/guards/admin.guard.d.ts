import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtAuthGuard } from './jwt-auth.guard';
export declare class AdminGuard extends JwtAuthGuard implements CanActivate {
    canActivate(context: ExecutionContext): Promise<boolean>;
}
