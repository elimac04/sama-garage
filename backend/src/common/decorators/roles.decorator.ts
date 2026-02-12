import { SetMetadata } from '@nestjs/common';

export enum UserRole {
  ADMIN_GARAGE = 'admin_garage',
  MECHANIC = 'mechanic',
  CASHIER = 'cashier',
  SUPER_ADMIN = 'super_admin', // Pour la V2
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
