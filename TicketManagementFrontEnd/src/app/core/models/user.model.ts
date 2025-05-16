import { UserRole } from '../constants/roles';

export interface User {
  id: string;
  email: string;
  name: string;
  lastName: string;
  roles: string[];
}

export interface AuthResponse {
  token: string;
  refreshToken?: string;
  expiresIn: number;
  user: User;
}
