import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatMenuModule } from '@angular/material/menu';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { animate, style, transition, trigger } from '@angular/animations';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { Project } from '../../../models/project.model';
import { ProjectService } from '../../../services/project.service';
import { HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';

@Component({
  selector: 'app-projects',
  standalone: true,
  imports: [
    CommonModule,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    NavbarComponent,
    TopBarComponent,
  ],
  templateUrl: './projects.component.html',
  styleUrls: ['./projects.component.scss'],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeInList', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class ProjectsComponent implements OnInit {
  projects: Project[] = [];
  newProject: Partial<Project> = {
    name: '',
    description: '',
    status: 'En attente',
  };
  isLoading = false;
  errorMessage = '';
  displayedColumns: string[] = ['name', 'description', 'status', 'actions'];
  searchTerm = '';
  sortColumn = 'name';
  sortDirection = 'asc';
  activeRow: number | null = null;
  showAddForm = false;
  isEditMode = false;
  editingProjectId: number | null = null;

  constructor(
    private projectService: ProjectService,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadProjects();
  }

  loadProjects(): void {
    this.isLoading = true;
    this.projectService.getProjects().subscribe({
      next: (projects: Project[]) => {
        this.projects = projects;
        this.sortProjects();
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error: any) => {
        console.error('Error loading projects:', error);
        this.errorMessage = 'Erreur lors du chargement des projets';
        this.isLoading = false;
        this.snackBar.open(this.errorMessage, 'Fermer', {
          duration: 3000,
        });
      },
    });
  }

  sortProjects(): void {
    this.projects.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      // Get values based on column
      if (this.sortColumn === 'name') {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      } else if (this.sortColumn === 'status') {
        aValue = a.status?.toLowerCase() || '';
        bValue = b.status?.toLowerCase() || '';
      } else if (this.sortColumn === 'description') {
        aValue = a.description?.toLowerCase() || '';
        bValue = b.description?.toLowerCase() || '';
      } else {
        aValue = a.name?.toLowerCase() || '';
        bValue = b.name?.toLowerCase() || '';
      }

      // Compare values
      const comparison = aValue.localeCompare(bValue);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  setSortCriteria(column: string): void {
    if (this.sortColumn === column) {
      // Toggle direction if same column is clicked again
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      // Set new column and default to ascending
      this.sortColumn = column;
      this.sortDirection = 'asc';
    }
    this.sortProjects();
  }

  getFilteredProjects(): Project[] {
    if (!this.searchTerm.trim()) {
      return this.projects;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.projects.filter(
      project => 
        (project.name && project.name.toLowerCase().includes(term)) || 
        (project.description && project.description.toLowerCase().includes(term)) ||
        (project.status && project.status.toLowerCase().includes(term))
    );
  }

  toggleAddForm(): void {
    this.showAddForm = !this.showAddForm;
    
    if (!this.showAddForm) {
      // Reset form when closing
      this.resetForm();
    }
  }

  resetForm(): void {
    this.newProject = {
      name: '',
      description: '',
      status: 'En attente',
    };
    this.isEditMode = false;
    this.editingProjectId = null;
  }

  editProject(project: Project): void {
    this.isEditMode = true;
    this.editingProjectId = project.id || null;
    this.newProject = { ...project };
    this.showAddForm = true;
  }

  saveProject(): void {
    if (!this.newProject.name?.trim()) return;
    
    this.isLoading = true;
    
    if (this.isEditMode && this.editingProjectId) {
      // Update existing project
      this.projectService.updateProject(this.editingProjectId, this.newProject as Project).subscribe({
        next: (updatedProject) => {
          if (updatedProject) {
            // Find and update the project in the array
            const index = this.projects.findIndex(p => p.id === this.editingProjectId);
            if (index !== -1) {
              this.projects[index] = updatedProject;
              this.sortProjects();
            }
            
            this.snackBar.open('Projet mis à jour avec succès', 'Fermer', {
              duration: 3000,
            });
          } else {
            this.snackBar.open('Erreur lors de la mise à jour du projet', 'Fermer', {
              duration: 3000,
            });
          }
          this.isLoading = false;
          this.toggleAddForm();
        },
        error: (error) => {
          console.error('Error updating project:', error);
          this.snackBar.open('Erreur lors de la mise à jour du projet', 'Fermer', {
            duration: 3000,
          });
          this.isLoading = false;
        }
      });
    } else {
      // Add new project
      this.projectService.addProject(this.newProject as Project).subscribe({
        next: (project: Project | null) => {
          if (project) {
            this.projects.push(project);
            this.sortProjects();
            this.snackBar.open('Projet ajouté avec succès', 'Fermer', {
              duration: 3000,
            });
          }
          this.isLoading = false;
          this.toggleAddForm();
        },
        error: (error: any) => {
          console.error('Error creating project:', error);
          this.snackBar.open('Erreur lors de la création du projet', 'Fermer', {
            duration: 3000,
          });
          this.isLoading = false;
        },
      });
    }
  }

  confirmDeleteProject(project: Project): void {
    // First show a confirmation dialog
    if (!confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}" ?`)) {
      return;
    }
    
    this.isLoading = true;
    
    // Check if project can be deleted first
    this.projectService.canDeleteProject(project.id!).subscribe({
      next: (result) => {
        if (result.canDelete) {
          // Project can be deleted
          this.projectService.deleteProject(project.id!).subscribe({
            next: (success) => {
              if (success) {
                // Remove from local array
                this.projects = this.projects.filter((p) => p.id !== project.id);
                
                this.snackBar.open(`Projet "${project.name}" supprimé avec succès`, 'Fermer', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                
                // Force a hard refresh of the projects list after a short delay
                setTimeout(() => {
                  this.loadProjects();
                }, 500);
              } else {
                this.snackBar.open(`Erreur lors de la suppression du projet "${project.name}"`, 'Fermer', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error(`Error deleting project ${project.id}:`, error);
              this.isLoading = false;
              this.snackBar.open(
                `Erreur lors de la suppression du projet "${project.name}": ${error.message || 'Erreur serveur'}`, 
                'Fermer', 
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
          });
        } else {
          // Project has dependencies but our backend should handle it now
          this.projectService.deleteProject(project.id!).subscribe({
            next: (success) => {
              if (success) {
                // Remove from local array
                this.projects = this.projects.filter((p) => p.id !== project.id);
                
                this.snackBar.open(`Projet "${project.name}" supprimé avec succès. ${result.dependencyCount || 0} tickets ont été mis à jour.`, 'Fermer', {
                  duration: 3000,
                  panelClass: ['success-snackbar']
                });
                
                // Force a hard refresh of the projects list after a short delay
                setTimeout(() => {
                  this.loadProjects();
                }, 500);
              } else {
                this.snackBar.open(`Erreur lors de la suppression du projet "${project.name}"`, 'Fermer', {
                  duration: 3000,
                  panelClass: ['error-snackbar']
                });
              }
              this.isLoading = false;
            },
            error: (error) => {
              console.error(`Error deleting project ${project.id}:`, error);
              this.isLoading = false;
              this.snackBar.open(
                `Erreur lors de la suppression du projet "${project.name}": ${error.message || 'Erreur serveur'}`, 
                'Fermer', 
                { duration: 5000, panelClass: ['error-snackbar'] }
              );
            }
          });
        }
      },
      error: (error) => {
        console.error(`Error checking if project ${project.id} can be deleted:`, error);
        this.isLoading = false;
        this.snackBar.open(
          `Une erreur est survenue lors de la vérification du projet "${project.name}".`, 
          'Fermer', 
          { duration: 5000, panelClass: ['error-snackbar'] }
        );
      }
    });
  }

  getStatusClass(status: string | undefined): string {
    if (!status) return 'status-non-defini';
    
    // Convert status to lowercase and normalize it for CSS class
    const normalizedStatus = status.toLowerCase()
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/[éèêë]/g, 'e') // Replace accented e with normal e
      .replace(/[àâä]/g, 'a') // Replace accented a with normal a
      .replace(/[ùûü]/g, 'u') // Replace accented u with normal u
      .replace(/[îï]/g, 'i'); // Replace accented i with normal i
    
    return `status-${normalizedStatus}`;
  }

  setActiveRow(projectId: number | null) {
    this.activeRow = projectId;
  }
}
