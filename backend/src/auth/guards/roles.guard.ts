// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        // 1. Lấy metadata (các vai trò được phép) từ decorator @Roles()
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(), // Lấy từ method
            context.getClass(),   // Lấy từ controller
        ]);

        // Nếu không có decorator @Roles, cho phép truy cập (chỉ cần JWT Auth)
        if (!requiredRoles) {
            return true;
        }

        // 2. Lấy thông tin User (đã được JWT Guard đưa vào req.user)
        // Tùy thuộc vào môi trường (HTTP/GraphQL), dùng context.switchToHttp().getRequest()
        const { user } = context.switchToHttp().getRequest();

        // 3. Kiểm tra xem vai trò của User có nằm trong danh sách được phép không
        // user.role là String, requiredRoles là UserRole Enum (nhưng dùng String ở đây OK)
        const hasRole = requiredRoles.some((role) => user.role === role);

        // Nếu có vai trò phù hợp, trả về true
        return hasRole;
    }
}