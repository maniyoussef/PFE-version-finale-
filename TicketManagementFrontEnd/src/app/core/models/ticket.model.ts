export interface Ticket {
  id: number;
  title: string;
  description: string;
  status: string;
  priority: string;
  qualification: string;
  createdAt: string;
  updatedAt?: string;
  report?: string;
  commentaire?: string;
  attachment?: string;
  clientId?: number;
  agentId?: number;
  project?: {
    id: number;
    name: string;
  };
  problemCategory?: {
    id: number;
    name: string;
  };
  assignedToId?: number;
  assignedTo?: {
    id: number;
    name: string;
  };
}
