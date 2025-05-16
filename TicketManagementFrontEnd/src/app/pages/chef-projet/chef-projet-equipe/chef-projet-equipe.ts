import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { User } from '../../../models/user.model';
import { Router } from '@angular/router';
import { Observable, of } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-chef-projet-equipe',
  templateUrl: './chef-projet-equipe.html',
  styleUrls: ['./chef-projet-equipe.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatTooltipModule,
  ],
})
export class ChefProjetEquipeComponent implements OnInit {
  collaborators: User[] = [];
  filteredCollaborators: User[] = [];
  currentUser!: User;
  isLoading = true;
  errorMessage: string | null = null;
  searchTerm: string = '';

  constructor(
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadUserDetails();
  }

  // Search collaborators based on input
  searchCollaborators(event: Event): void {
    const searchInput = (event.target as HTMLInputElement).value;
    this.searchTerm = searchInput;
    this.filterCollaborators();
  }
  
  // Filter collaborators based on search term
  filterCollaborators(): void {
    if (!this.searchTerm.trim()) {
      this.filteredCollaborators = [...this.collaborators];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    this.filteredCollaborators = this.collaborators.filter(collaborator => 
      (collaborator.name?.toLowerCase().includes(searchTermLower) || 
       collaborator.lastName?.toLowerCase().includes(searchTermLower) || 
       collaborator.email?.toLowerCase().includes(searchTermLower) ||
       collaborator.role?.name?.toLowerCase().includes(searchTermLower))
    );
    
    console.log(`Filtered collaborators: ${this.filteredCollaborators.length} matches for "${this.searchTerm}"`);
  }

  private loadUserDetails(): void {
    this.authService
      .getCurrentUser()
      .pipe()
      .subscribe({
        next: (user: User | null) => {
          if (user && user.id !== undefined) {
            this.getUserWithDetails(user.id).subscribe({
              next: (userDetails: User | null) => {
                if (userDetails) {
                  const userRole = userDetails.role?.name
                    ? userDetails.role.name.toLowerCase()
                    : 'unknown';
                  const userRoleId = userDetails.role?.id;

                  console.log('User role:', userRole, 'Role ID:', userRoleId);

                  // Accept any variation of chef projet or role ID 3
                  if (
                    userRoleId === 3 ||
                    (userRole &&
                      ((userRole.includes('chef') &&
                        userRole.includes('projet')) ||
                        userRole === 'chef_projet' ||
                        userRole === 'chefprojet'))
                  ) {
                    this.currentUser = userDetails;
                    this.loadCollaborators();
                  } else {
                    console.error('User is not a Chef Projet');
                    this.errorMessage =
                      'Access denied. Chef Projet role required.';
                  }
                } else {
                  console.error('User details not found');
                  this.errorMessage = 'User details could not be loaded.';
                }
              },
              error: (error) => {
                console.error('Error fetching user details:', error);
                this.errorMessage = 'Error loading user details.';
              },
            });
          } else {
            console.error('Current user or ID is undefined');
            this.errorMessage = 'User information is missing.';
          }
        },
        error: (error) => {
          console.error('Error fetching current user:', error);
          this.errorMessage = 'Authentication error.';
        },
      });
  }

  private loadCollaborators(): void {
    if (this.currentUser && this.currentUser.id !== undefined) {
      this.isLoading = true;
      this.userService
        .getCollaborateursByChefId(this.currentUser.id)
        .subscribe({
          next: (collaborateurs: User[]) => {
            this.collaborators = collaborateurs;
            this.filteredCollaborators = [...collaborateurs]; // Initialize filtered collaborators
            this.isLoading = false;
          },
          error: (error) => {
            console.error('Error loading collaborateurs:', error);
            this.isLoading = false;
            this.errorMessage = 'Failed to load team members.';
          },
        });
    } else {
      this.errorMessage = 'User ID is undefined. Cannot load team members.';
    }
  }

  getUserWithDetails(userId: number | undefined): Observable<User | null> {
    if (userId === undefined) {
      console.error('User ID is undefined');
      return of(null);
    }
    return this.userService.getUser(userId);
  }
}
