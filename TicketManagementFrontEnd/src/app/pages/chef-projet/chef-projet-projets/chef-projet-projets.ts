import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RouterModule } from '@angular/router';
import { Project } from '../../../models/project.model';
import { User } from '../../../models/user.model';
import { AuthService } from '../../../services/auth.service';
import { ProjectService } from '../../../services/project.service';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { Router } from '@angular/router';
import { take, catchError, retry, timeout } from 'rxjs/operators';
import { of } from 'rxjs';
import { ChefProjetNavbarComponent } from '../../../components/chef-projetComponents/chef-projet-navbar/chef-projet-navbar.component';

@Component({
  selector: 'app-project',
  templateUrl: './chef-projet-projets.html',
  styleUrls: ['./chef-projet-projets.scss'],
  imports: [
    CommonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    RouterModule,
    TopBarComponent,
    ChefProjetNavbarComponent,
  ],
  standalone: true,
})
export class ProjectComponent implements OnInit {
  projects: Project[] = [];
  filteredProjects: Project[] = [];
  currentUser!: User;
  isLoading = true;
  searchTerm: string = '';

  constructor(
    private authService: AuthService,
    private projectService: ProjectService,
    private router: Router
  ) {}

  ngOnInit(): void {
    console.log('*** Chef Projet Projects Component Initializing ***');
    
    this.authService.currentUser$
      .pipe(
        take(1),
        catchError((error) => {
          console.error('Error fetching current user:', error);
          return of(null);
        })
      )
      .subscribe((user) => {
        if (!user) {
          console.error('No user found in authentication service');
          return;
        }

        console.log('Current user:', user);
        
        // Extract role information safely
        let userRoles: string[] = [];
        if (user.roles && Array.isArray(user.roles)) {
          userRoles = user.roles;
          console.log('Found roles array:', userRoles);
        }
        
        const roleName = user.role?.name;
        console.log('Role object name:', roleName);
        
        const roleId = user.role?.id;
        console.log('Role object ID:', roleId);

        // Check specifically for 'Chef Projet' role in any format
        const isChefProjet = this.checkIfChefProjet(user);
        
        console.log('Role check summary:', {
          userRoles,
          roleName,
          roleId,
          isChefProjet
        });

        if (isChefProjet) {
          console.log('✅ User is confirmed as Chef Projet, loading projects...');
          this.currentUser = user;
          this.loadAssignedProjects();
        } else {
          console.error('❌ User role mismatch - not a Chef Projet:', {
            roles: userRoles,
            roleName,
            roleId
          });
        }
      });
  }
  
  // Separate method for cleaner role checking
  private checkIfChefProjet(user: User): boolean {
    // Check roles array (preferred method)
    if (user.roles && Array.isArray(user.roles)) {
      // First check exact matches
      if (user.roles.includes('Chef Projet') || 
          user.roles.includes('CHEF_PROJET') || 
          user.roles.includes('ChefProjet')) {
        console.log('Found Chef Projet in roles array via exact match');
        return true;
      }
      
      // Then check for partial matches with string comparison
      for (const role of user.roles) {
        if (typeof role === 'string') {
          const roleLower = role.toLowerCase();
          if ((roleLower.includes('chef') && roleLower.includes('projet')) ||
              roleLower === 'chef_projet' || 
              roleLower === 'chefprojet') {
            console.log(`Found Chef Projet via partial match: "${role}"`);
            return true;
          }
        }
      }
    }
    
    // Check role object if it exists
    if (user.role) {
      if (user.role.id === 3) {
        console.log('Found Chef Projet via role.id === 3');
        return true;
      }
      
      if (user.role.name) {
        const roleNameLower = user.role.name.toLowerCase();
        if (roleNameLower === 'chef projet' || 
            roleNameLower === 'chef_projet' || 
            (roleNameLower.includes('chef') && roleNameLower.includes('projet'))) {
          console.log(`Found Chef Projet via role.name: "${user.role.name}"`);
          return true;
        }
      }
    }
    
    return false;
  }

  private loadAssignedProjects(): void {
    this.isLoading = true;
    console.log(`Loading projects for chef projet ID: ${this.currentUser.id}`);
    
    this.projectService.getProjectsByChefId(this.currentUser.id)
      .pipe(
        retry(3), // Retry up to 3 times if the request fails
        timeout(30000), // Add a 30-second timeout to prevent hanging requests
        catchError(err => {
          console.error('Error loading projects:', err);
          // Return empty array to prevent breaking the chain
          return of([]);
        })
      )
      .subscribe({
        next: (projects) => {
          console.log(`Loaded ${projects.length} projects for chef projet ID ${this.currentUser.id}:`, 
                      projects.map(p => ({ id: p.id, name: p.name })));
          this.projects = projects;
          this.filteredProjects = [...projects]; // Initialize filtered projects
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Unrecoverable error loading projects:', err);
          this.isLoading = false;
          // This error handler will only be called if the catchError above fails
        },
      });
  }
  
  // Search projects based on input
  searchProjects(event: Event): void {
    const searchInput = (event.target as HTMLInputElement).value;
    this.searchTerm = searchInput;
    this.filterProjects();
  }
  
  // Filter projects based on search term
  filterProjects(): void {
    if (!this.searchTerm.trim()) {
      this.filteredProjects = [...this.projects];
      return;
    }
    
    const searchTermLower = this.searchTerm.toLowerCase().trim();
    this.filteredProjects = this.projects.filter(project => 
      project.name.toLowerCase().includes(searchTermLower)
    );
    
    console.log(`Filtered projects: ${this.filteredProjects.length} matches for "${this.searchTerm}"`);
  }
}
