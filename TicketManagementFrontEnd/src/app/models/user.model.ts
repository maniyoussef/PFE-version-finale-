import { Company } from '../services/company.service';
import { Project } from './project.model';
import { ProblemCategory } from './problem-category.model';

export interface User {
  id?: number;
  name: string;
  lastName?: string;
  email: string;
  password?: string;
  role?: {
    id: number;
    name: string;
  };
  country?: {
    id: number;
    name: string;
  };
  company?: {
    id: number;
    name: string;
  };
  status?: string;
  createdAt?: Date;
  updatedAt?: Date;
  projectId?: number;
  companyId?: number;
  phoneNumber?: string;
  hasContract?: boolean;
  contractStartDate?: Date;
  contractEndDate?: Date;
  // Backend response property
  roles?: string[];
  assignedProjects?: Project[];
  assignedCollaborateurs?: User[];
  assignedProblemCategories?: ProblemCategory[];
  companies?: Company[];

  // Auth-related properties
  tokenExpired?: boolean; // Indicates token has expired but user data still exists
  sessionExpired?: boolean; // Indicates the session has expired
}

export interface AuthResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}
