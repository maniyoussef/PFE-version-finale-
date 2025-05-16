// assign-user-dialog.component.ts
import { Component, Inject, OnInit } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { Ticket } from '../../../models/ticket.model';
import { User } from '../../../models/user.model';
import { ProjectService } from '../../../services/project.service';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatOptionModule } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { lastValueFrom } from 'rxjs';
import { Project } from '../../../models/project.model';

@Component({
  selector: 'app-assign-user-dialog',
  templateUrl: './assign-user-dialog.component.html',
  styleUrls: ['./assign-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    FormsModule,
    MatOptionModule,
  ],
})
export class AssignUserDialogComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  selectedUser: User | null = null;
  chefProjetId: number | null = null;
  isLoading = true;
  error: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AssignUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private projectService: ProjectService,
    private http: HttpClient
  ) {}

  async ngOnInit() {
    this.isLoading = true;
    
    try {
      // Check if current user is admin FIRST - admins should see all collaborators
      const userRole = localStorage.getItem('userRole') || '';
      const isAdmin = userRole.toUpperCase() === 'ADMIN';
      
      if (isAdmin) {
        console.log('[AssignUserDialog] Admin user detected - fetching all collaborateurs');
        await this.loadAllCollaborateursForAdmin();
        return;
      }
      
      // Non-admin flow - check for project and chef projet ID
      const ticketProject = this.data.ticket.project;
      let project: any = null;
      
      // Handle different project data structures
      if (ticketProject) {
        if (typeof ticketProject === 'object') {
          project = ticketProject;
        } else if (typeof ticketProject === 'number') {
          // If project is just an ID, try to fetch project details
          const projectId = ticketProject;
          try {
            const projects = await lastValueFrom(this.projectService.getProjects());
            project = projects.find(p => p.id === projectId);
          } catch (err) {
            console.error('[AssignUserDialog] Error fetching project by ID:', err);
          }
        }
      }

      if (project?.chefProjetId) {
        this.chefProjetId = project.chefProjetId;
        // Ensure chefProjetId is a number before passing it
        if (this.chefProjetId !== null) {
          await this.loadProjectCollaborateurs(this.chefProjetId);
        } else {
          console.error('Chef Projet ID is null, loading all collaborateurs as fallback');
          await this.loadAllCollaborateursForAdmin();
        }
      } else {
        console.error('No Chef Projet ID found for this ticket');
        // Fallback to load all collaborators
        await this.loadAllCollaborateursForAdmin();
      }
    } catch (err) {
      console.error('[AssignUserDialog] Error in ngOnInit:', err);
      this.error = "Une erreur s'est produite lors du chargement des collaborateurs.";
      this.isLoading = false;
    }
  }

  // New helper method to load all collaborateurs for admins
  async loadAllCollaborateursForAdmin() {
    try {
      // Get API URL from the project service
      const apiUrl = this.projectService['apiUrl'] || `${window.location.origin}/api`;
      
      try {
        // First try the collaborateurs endpoint
        const users$ = this.http.get<User[]>(`${apiUrl}/users/collaborateurs`);
        this.users = await lastValueFrom(users$);
        console.log(`[AssignUserDialog] Admin fetched ${this.users.length} collaborateurs from API`);
        
        // If no users found, try the general users endpoint
        if (!this.users || this.users.length === 0) {
          console.log('[AssignUserDialog] No collaborateurs found, fetching all users');
          const allUsers$ = this.http.get<User[]>(`${apiUrl}/users`);
          this.users = await lastValueFrom(allUsers$);
          console.log(`[AssignUserDialog] Admin fetched ${this.users.length} total users`);
        }
        
        // Normalize user data to ensure consistent structure
        this.users = this.users.map(user => this.normalizeUserData(user));
        
        // Filter users with role collaborateur - CASE INSENSITIVE comparison
        this.filteredUsers = this.users.filter(user => 
          user.role?.name?.toLowerCase() === 'collaborateur'
        );
        
        console.log(`[AssignUserDialog] Admin found ${this.filteredUsers.length} collaborateurs after filtering`);
        
        // If still no collaborateurs, show all users as fallback
        if (this.filteredUsers.length === 0) {
          console.log('[AssignUserDialog] No collaborateurs found after filtering, showing all users');
          this.filteredUsers = this.users;
        }
      } catch (e) {
        console.error('[AssignUserDialog] Admin user error fetching collaborateurs:', e);
        this.error = "Erreur lors de la récupération des collaborateurs";
        this.filteredUsers = [];
      } finally {
        this.isLoading = false;
      }
    } catch (error) {
      console.error('[AssignUserDialog] Error loading collaborateurs for admin:', error);
      this.error = "Erreur lors du chargement des collaborateurs";
      this.filteredUsers = [];
      this.isLoading = false;
    }
  }

  async loadProjectCollaborateurs(chefProjetId: number) {
    try {
      console.log(`[AssignUserDialog] Loading projects for chef projet ID: ${chefProjetId}`);
      
      // Non-admin flow - use the projectService to get project-specific collaborators
      const projects = await lastValueFrom(
        this.projectService.getProjectsByChefId(chefProjetId)
      );

      console.log(`[AssignUserDialog] Found ${projects.length} projects for chef projet ID ${chefProjetId}`);

      // Extract collaborator IDs from projects
      const collaborateurIds = projects.flatMap(
        (project) => project.collaborateurIds || []
      );
      const uniqueCollaborateurIds = Array.from(new Set(collaborateurIds));
      console.log(`[AssignUserDialog] Found ${uniqueCollaborateurIds.length} unique collaborateur IDs`);

      // Use the correct API URL from environment
      const apiUrl = this.projectService['apiUrl'] || `${window.location.origin}/api`; 
      
      try {
        // First try to get all collaborateurs
        const users$ = this.http.get<User[]>(`${apiUrl}/users/collaborateurs`);
        this.users = await lastValueFrom(users$);
        console.log(`[AssignUserDialog] Fetched ${this.users.length} collaborateurs from API`);
      } catch (e) {
        console.error('[AssignUserDialog] Error fetching collaborateurs:', e);
        
        // Fallback to all users if collaborateurs endpoint fails
        console.log(`[AssignUserDialog] Error fetching collaborateurs, falling back to all users`);
        const allUsers$ = this.http.get<User[]>(`${apiUrl}/users`);
        this.users = await lastValueFrom(allUsers$);
        console.log(`[AssignUserDialog] Fetched ${this.users.length} total users as fallback`);
      }

      // Normalize user data for consistency
      this.users = this.users.map(user => this.normalizeUserData(user));

      // If we found no users at all, show an error but don't crash
      if (!this.users || this.users.length === 0) {
        console.error('[AssignUserDialog] No users found at all');
        this.error = "Aucun utilisateur trouvé";
        this.filteredUsers = [];
        this.isLoading = false;
        return;
      }

      // For non-admin users, filter by both role AND project assignment
      if (uniqueCollaborateurIds.length > 0) {
        // Filter users to show only collaborateurs assigned to these projects
        this.filteredUsers = this.users.filter(
          (user) => 
            // Check if role is collaborateur (case insensitive)
            user.role?.name?.toLowerCase() === 'collaborateur' && 
            // Check if user is assigned to one of the projects and has a valid ID
            user.id !== undefined && uniqueCollaborateurIds.includes(user.id)
        );
      } else {
        // No collaborateur IDs found, just filter by role
        this.filteredUsers = this.users.filter(
          (user) => user.role?.name?.toLowerCase() === 'collaborateur'
        );
      }
      
      console.log(`[AssignUserDialog] Filtered to ${this.filteredUsers.length} collaborateurs`);
      
      // Show all users as fallback if no collaborateurs found
      if (this.filteredUsers.length === 0) {
        console.log('[AssignUserDialog] No collaborateurs found after filtering, showing all users as fallback');
        this.filteredUsers = this.users;
      }
    } catch (error) {
      console.error('[AssignUserDialog] Error fetching project collaborators:', error);
      this.error = "Erreur lors du chargement des collaborateurs du projet";
      this.filteredUsers = this.users || []; // Use any loaded users as fallback
    } finally {
      this.isLoading = false;
    }
  }

  // Helper to ensure consistent user data structure
  private normalizeUserData(user: User): User {
    return {
      id: user.id || undefined,
      name: user.name || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || { id: 0, name: 'Inconnu' },
      // Add any other required fields
    };
  }

  onSave(): void {
    this.dialogRef.close(this.selectedUser);
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
