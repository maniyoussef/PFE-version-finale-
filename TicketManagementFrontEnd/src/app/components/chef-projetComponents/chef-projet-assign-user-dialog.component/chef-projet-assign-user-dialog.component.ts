import { Component, Inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Ticket } from '../../../models/ticket.model';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom, lastValueFrom } from 'rxjs';
import { environment } from '../../../../environments/environment';

interface DialogData {
  ticket: Ticket;
}

@Component({
  selector: 'app-chef-projet-assign-user-dialog',
  templateUrl: './chef-projet-assign-user-dialog.component.html',
  styleUrls: ['./chef-projet-assign-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatSelectModule,
    FormsModule,
    MatButtonModule,
    MatProgressSpinnerModule
  ]
})
export class ChefAssignUserDialogComponent implements OnInit {
  collaborateurs: User[] = [];
  selectedUser: User | null = null;
  isLoading = true;
  error: string | null = null;
  ticketTitle: string = '';
  private apiUrl = environment.apiUrl;

  constructor(
    public dialogRef: MatDialogRef<ChefAssignUserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData,
    private userService: UserService,
    private authService: AuthService,
    private http: HttpClient
  ) {
    this.ticketTitle = data.ticket.title || 'Ticket sans titre';
  }

  async ngOnInit() {
    this.isLoading = true;
    
    try {
      console.log('[ChefAssignDialog] Initializing dialog...');
      const currentUser = await firstValueFrom(this.authService.getCurrentUser());
      
      if (!currentUser || !currentUser.id) {
        console.error('[ChefAssignDialog] Current user not found or has no ID');
        this.error = 'Utilisateur non trouvé. Veuillez vous reconnecter.';
        this.isLoading = false;
        return;
      }
      
      console.log('[ChefAssignDialog] Loading collaborateurs for chef ID:', currentUser.id);
      
      // First try the standard endpoint
      try {
        // Get collaborateurs assigned to this chef
        const collaborateurs = await firstValueFrom(
          this.userService.getCollaborateursByChefId(currentUser.id)
        );
        
        this.collaborateurs = this.normalizeUsers(collaborateurs);
        console.log('[ChefAssignDialog] Loaded collaborateurs via service:', this.collaborateurs);
        
        // If no collaborateurs found, try direct API call as fallback
        if (!this.collaborateurs || this.collaborateurs.length === 0) {
          console.log('[ChefAssignDialog] No collaborateurs found via service, trying direct API call');
          await this.loadCollaborateursDirectly(currentUser.id);
        }
      } catch (serviceError) {
        console.error('[ChefAssignDialog] Service error loading collaborateurs:', serviceError);
        // Try direct API call as fallback
        await this.loadCollaborateursDirectly(currentUser.id);
      }
    } catch (error) {
      console.error('[ChefAssignDialog] Error loading collaborateurs:', error);
      this.error = "Impossible de charger les collaborateurs. Veuillez réessayer.";
    } finally {
      this.isLoading = false;
    }
  }
  
  // Fallback method to load collaborateurs directly via HTTP
  private async loadCollaborateursDirectly(chefId: number) {
    try {
      console.log(`[ChefAssignDialog] Trying direct API call to: ${this.apiUrl}/users/chef-projet/${chefId}/collaborateurs`);
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Make direct HTTP call
      const response$ = this.http.get<User[]>(
        `${this.apiUrl}/users/chef-projet/${chefId}/collaborateurs`, 
        { headers }
      );
      
      const collaborateurs = await lastValueFrom(response$);
      this.collaborateurs = this.normalizeUsers(collaborateurs);
      
      console.log('[ChefAssignDialog] Loaded collaborateurs via direct API call:', this.collaborateurs);
    } catch (error) {
      console.error('[ChefAssignDialog] Error in direct API call:', error);
      this.error = "Erreur lors du chargement des collaborateurs.";
      
      // Last resort - try to get all collaborateurs
      await this.loadAllCollaborateurs();
    }
  }
  
  // Last resort method to get all collaborateurs
  private async loadAllCollaborateurs() {
    try {
      console.log('[ChefAssignDialog] Trying to load all collaborateurs as last resort');
      
      const token = localStorage.getItem('token');
      const headers = {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      };
      
      // Get all collaborateurs
      const response$ = this.http.get<User[]>(
        `${this.apiUrl}/users/collaborateurs`, 
        { headers }
      );
      
      const allCollaborateurs = await lastValueFrom(response$);
      this.collaborateurs = this.normalizeUsers(allCollaborateurs);
      
      console.log('[ChefAssignDialog] Loaded all collaborateurs as fallback:', this.collaborateurs);
    } catch (error) {
      console.error('[ChefAssignDialog] Failed to load all collaborateurs:', error);
      this.error = "Aucun collaborateur disponible. Veuillez contacter l'administrateur.";
      this.collaborateurs = [];
    }
  }
  
  // Helper method to normalize user data
  private normalizeUsers(users: User[]): User[] {
    if (!users) return [];
    
    return users.map(user => ({
      id: user.id,
      name: user.name || '',
      lastName: user.lastName || '',
      email: user.email || '',
      role: user.role || { id: 0, name: 'Collaborateur' }
    }));
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSave(): void {
    this.dialogRef.close(this.selectedUser);
  }
} 