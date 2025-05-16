export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  USER = 'USER',
  CLIENT = 'CLIENT',
  CHEF_PROJET = 'CHEF_PROJET',
  COLLABORATEUR = 'COLLABORATEUR',
}

export const ROLE_ROUTES = {
  [UserRole.ADMIN]: '/admin/dashboard',
  [UserRole.MANAGER]: '/manager',
  [UserRole.USER]: '/user',
  [UserRole.CLIENT]: '/user',
  [UserRole.CHEF_PROJET]: '/chef-projet',
  [UserRole.COLLABORATEUR]: '/collaborateur',
} as const;

export const ROLE_PERMISSIONS = {
  [UserRole.ADMIN]: ['read', 'write', 'delete', 'manage_users', 'manage_roles'],
  [UserRole.MANAGER]: ['read', 'write', 'manage_team'],
  [UserRole.USER]: ['read', 'write_own'],
  [UserRole.CLIENT]: ['read', 'create_ticket'],
  [UserRole.CHEF_PROJET]: ['read', 'write', 'manage_project'],
  [UserRole.COLLABORATEUR]: ['read', 'write', 'resolve_ticket'],
} as const;
