import { User } from './user.model';

export interface Ticket {
  id: number;
  title: string;
  description: string;
  priority: string;
  qualification: string;
  status?: string;
  createdAt: string;
  updatedAt?: string;
  report: string; // Ensure this exists
  commentaire: string; // Separate from reports
  attachment: string;
  clientId?: number; // Added to fix TS2339 errors
  createdById?: number; // ID of the user who created the ticket

  // Time tracking fields
  startWorkTime?: string; // When collaborator started working
  finishWorkTime?: string; // When collaborator finished working
  workDuration?: number; // Duration in seconds
  currentSessionDuration?: number; // Current session duration in seconds

  // Added fields for collaborateur dashboard
  startTime?: Date | string; // When work started
  endTime?: Date | string; // When work ended

  // Workflow tracking
  temporarilyStopped?: boolean; // To track when work is paused temporarily
  workFinished?: boolean; // To track when work is finished but not yet resolved

  // User associations
  assignedUserId?: number; // ID of the user assigned to the ticket
  reporterId?: number; // ID of the user who reported the ticket

  project?: {
    id: number;
    name: string;
    chefProjetId: number;
    clientId?: number; // The client ID associated with the project
  };
  problemCategory?: {
    id: number;
    name: string;
  };
  assignedToId?: number;
  assignedTo?: User;
  showComments?: boolean;
}
