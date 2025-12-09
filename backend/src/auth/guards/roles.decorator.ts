// src/common/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

// KEY được sử dụng để lưu metadata trong NestJS
export const ROLES_KEY = 'roles';

/**
 * Decorator để chỉ định các vai trò được phép truy cập một route.
 * @param roles Mảng các UserRole được phép (ví dụ: [UserRole.ADMIN, UserRole.BRANCH_MANAGER])
 */
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);