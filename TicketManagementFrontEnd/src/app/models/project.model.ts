export interface Project {
  id: number;
  name: string;
  status: string;
  chefProjetId?: number;
  collaborateurIds?: number[];
  clientId: number;
  description?: string;
  startDate?: Date | string;
  endDate?: Date | string;
}
