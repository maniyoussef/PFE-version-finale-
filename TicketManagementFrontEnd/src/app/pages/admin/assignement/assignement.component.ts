import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { MatChipsModule } from '@angular/material/chips';

import { UserService } from '../../../services/user.service';
import { ProjectService } from '../../../services/project.service';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { AssignmentService } from '../../../services/assignment.service';

import { User } from '../../../models/user.model';
import { Project } from '../../../models/project.model';
import { ProblemCategory } from '../../../models/problem-category.model';
import { forkJoin, finalize } from 'rxjs';

@Component({
  selector: 'app-assignement',
  templateUrl: './assignement.component.html',
  styleUrls: ['./assignement.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatTabsModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatTooltipModule,
    MatExpansionModule,
    MatChipsModule,
  ],
})
export class AssignementComponent implements OnInit, OnDestroy {
  // Chef de Projet Assignment
  chefProjects: Project[] = [];
  selectedChef: User | null = null;
  availableProjects: Project[] = [];
  selectedProjectForChef: Project | null = null;
  isLoadingChefProjects = false;
  isAssigningProjectToChef = false;

  // Client Assignment
  clientProjects: Project[] = [];
  clientCategories: ProblemCategory[] = [];
  selectedClient: User | null = null;
  availableProjectsForClient: Project[] = [];
  availableCategories: ProblemCategory[] = [];
  selectedProjectForClient: Project | null = null;
  selectedCategoryForClient: ProblemCategory | null = null;
  isLoadingClientData = false;
  isAssigningToClient = false;

  // Collaborator Assignment
  chefCollaborators: User[] = [];
  selectedCollaborator: User | null = null;
  availableCollaborators: User[] = [];
  isLoadingCollaborators = false;
  isAssigningCollaborator = false;

  // Common data
  chefs: User[] = [];
  clients: User[] = [];
  collaborateurs: User[] = [];
  allProjects: Project[] = [];
  allCategories: ProblemCategory[] = [];
  isLoadingData = false;

  // Table columns
  chefProjectColumns: string[] = ['id', 'name', 'description', 'actions'];
  clientProjectColumns: string[] = ['id', 'name', 'description', 'actions'];
  clientCategoryColumns: string[] = ['id', 'name', 'description', 'actions'];
  collaboratorColumns: string[] = ['id', 'name', 'email', 'actions'];

  // Pagination
  @ViewChild('chefProjectsPaginator') chefProjectsPaginator!: MatPaginator;
  @ViewChild('clientProjectsPaginator') clientProjectsPaginator!: MatPaginator;
  @ViewChild('clientCategoriesPaginator')
  clientCategoriesPaginator!: MatPaginator;
  @ViewChild('collaboratorsPaginator') collaboratorsPaginator!: MatPaginator;

  // Sorting
  @ViewChild('chefProjectsSort') chefProjectsSort!: MatSort;
  @ViewChild('clientProjectsSort') clientProjectsSort!: MatSort;
  @ViewChild('clientCategoriesSort') clientCategoriesSort!: MatSort;
  @ViewChild('collaboratorsSort') collaboratorsSort!: MatSort;

  private dataVerificationTimer: any;

  constructor(
    private userService: UserService,
    private projectService: ProjectService,
    private categoryService: ProblemCategoryService,
    private assignmentService: AssignmentService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadInitialData();

    // Set up periodic verification of collaborator assignments
    this.startPeriodicDataVerification();
  }

  ngOnDestroy(): void {
    // Clean up any subscriptions or timers
    this.stopPeriodicDataVerification();
  }

  loadInitialData(): void {
    this.isLoadingData = true;

    forkJoin({
      chefs: this.userService.getChefsProjet(),
      clients: this.userService.getClients(),
      collaborateurs: this.userService.getCollaborateurs(),
      projects: this.projectService.getProjects(),
      categories: this.categoryService.getCategories(),
    })
      .pipe(
        finalize(() => {
          this.isLoadingData = false;
        })
      )
      .subscribe({
        next: (results) => {
          console.log('Loaded initial data:');
          console.log('- Chefs:', results.chefs.length);
          console.log('- Clients:', results.clients.length);
          console.log('- Collaborateurs:', results.collaborateurs.length);
          console.log('- Projects:', results.projects.length);
          console.log('- Categories:', results.categories.length);

          this.chefs = results.chefs;
          this.clients = results.clients;
          this.collaborateurs = results.collaborateurs;
          this.allProjects = results.projects;
          this.allCategories = results.categories;

          // Verify project IDs for debugging
          console.log(
            'Project IDs from initial load:',
            this.allProjects.map((p) => p.id)
          );

          // Initialize available projects and categories
          this.updateAvailableProjects();
          this.updateAvailableProjectsForClient();
          this.updateAvailableCategories();
          this.updateAvailableCollaborators();
        },
        error: (error) => {
          console.error('Error loading initial data:', error);
          this.showErrorMessage(
            'Failed to load initial data. Please try again.'
          );
        },
      });
  }

  // Chef de Projet Assignment Methods
  onChefSelected(): void {
    if (!this.selectedChef) {
      this.chefProjects = [];
      return;
    }

    this.loadChefProjects();
    this.updateAvailableProjects();
  }

  loadChefProjects(): void {
    if (!this.selectedChef || this.selectedChef.id === undefined) return;

    this.isLoadingChefProjects = true;
    // Use non-null assertion since we've checked for undefined above
    const chefId = this.selectedChef.id as number;

    console.log(`Loading projects for chef ${chefId}...`);

    this.projectService
      .getProjectsByChefId(chefId)
      .pipe(
        finalize(() => {
          this.isLoadingChefProjects = false;
        })
      )
      .subscribe({
        next: (projects) => {
          console.log(
            `Received ${projects.length} projects for chef ${chefId}`
          );
          this.chefProjects = projects;
          // Ensure the UI updates with the latest data
          this.updateAvailableProjects();
        },
        error: (error) => {
          console.error(`Error loading projects for chef ${chefId}:`, error);
          this.showErrorMessage(
            'Failed to load chef projects. Please try again.'
          );
        },
      });
  }

  updateAvailableProjects(): void {
    if (!this.selectedChef) {
      this.availableProjects = [...this.allProjects];
      return;
    }

    // Filter out projects already assigned to the chef
    const assignedProjectIds = this.chefProjects.map((p) => p.id);
    this.availableProjects = this.allProjects.filter(
      (p) => !assignedProjectIds.includes(p.id)
    );
  }

  assignProjectToChef(): void {
    if (!this.selectedChef || !this.selectedProjectForChef) {
      this.showErrorMessage('Please select both a chef and a project.');
      return;
    }

    if (
      this.selectedChef.id === undefined ||
      this.selectedProjectForChef.id === undefined
    ) {
      this.showErrorMessage('Invalid chef or project ID.');
      return;
    }

    // Store a copy of the project before assignment
    const projectToAssign = { ...this.selectedProjectForChef };
    const chefId = this.selectedChef.id;

    this.isAssigningProjectToChef = true;
    this.assignmentService
      .assignProjectToChef(projectToAssign.id, chefId)
      .pipe(
        finalize(() => {
          this.isAssigningProjectToChef = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Project assignment successful:', response);
          this.showSuccessMessage(
            `Project "${projectToAssign.name}" assigned to chef "${this.selectedChef?.name}"`
          );

          // Immediately add the project to the local list
          if (!this.chefProjects.some((p) => p.id === projectToAssign.id)) {
            this.chefProjects.push(projectToAssign);
          }

          // Update the available projects list
          this.availableProjects = this.availableProjects.filter(
            (p) => p.id !== projectToAssign.id
          );

          // Clear the selection
          this.selectedProjectForChef = null;

          // Then refresh data from the server to ensure everything is in sync
          setTimeout(() => {
            this.loadChefProjects();
          }, 500);
        },
        error: (error) => {
          console.error('Error assigning project to chef:', error);
          // Log more details for debugging
          if (error.error && error.error.message) {
            console.error('Server error message:', error.error.message);
          }
          this.showErrorMessage(
            'Failed to assign project to chef. Please try again.'
          );
        },
      });
  }

  removeProjectFromChef(project: Project): void {
    if (!this.selectedChef || !project || !this.selectedChef.id || !project.id)
      return;

    const confirmRemove = confirm(
      `Are you sure you want to remove project "${project.name}" from chef "${this.selectedChef.name}"?`
    );
    if (!confirmRemove) return;

    // Pass both project ID and chef ID to ensure proper deletion
    this.assignmentService
      .unassignProjectFromChef(project.id, this.selectedChef.id)
      .subscribe({
        next: () => {
          this.showSuccessMessage(
            `Project "${project.name}" removed from chef "${
              this.selectedChef?.name || ''
            }"`
          );

          // Force a complete refresh to ensure data is up-to-date
          this.chefProjects = this.chefProjects.filter(
            (p) => p.id !== project.id
          );
          setTimeout(() => {
            this.loadChefProjects();
            this.updateAvailableProjects();
          }, 500);
        },
        error: (error) => {
          console.error('Error removing project from chef:', error);
          this.showErrorMessage(
            'Failed to remove project from chef. Please try again.'
          );
        },
      });
  }

  // Client Assignment Methods
  onClientSelected(): void {
    if (!this.selectedClient) {
      this.clientProjects = [];
      this.clientCategories = [];
      return;
    }

    this.loadClientData();
    this.updateAvailableProjectsForClient();
    this.updateAvailableCategories();
  }

  loadClientData(): void {
    if (!this.selectedClient || this.selectedClient.id === undefined) return;

    this.isLoadingClientData = true;
    console.log(`Loading data for client ID: ${this.selectedClient.id}`);

    // Use non-null assertion since we've checked for undefined above
    const clientId = this.selectedClient.id as number;

    forkJoin({
      projects: this.projectService.getClientProjects(clientId),
      categories: this.categoryService.getCategoriesByClientId(
        clientId.toString()
      ),
    })
      .pipe(
        finalize(() => {
          this.isLoadingClientData = false;
        })
      )
      .subscribe({
        next: (results) => {
          console.log(
            `Received ${results.projects.length} projects for client ${clientId}`
          );
          console.log(
            'Project data from server:',
            JSON.stringify(results.projects)
          );

          // Log each project ID received from the server
          console.log(
            'Project IDs from server:',
            results.projects.map((p) => p.id)
          );

          this.clientProjects = results.projects;
          this.clientCategories = results.categories;

          // Update assigned projects for filtering
          this.updateAvailableProjectsForClient();
        },
        error: (error) => {
          console.error(`Error loading data for client ${clientId}:`, error);
          // Try to handle the error gracefully
          if (error.status === 404) {
            this.clientProjects = [];
            this.clientCategories = [];
          }
          this.showErrorMessage(
            'Failed to load client data. Please try again.'
          );
        },
      });
  }

  updateAvailableProjectsForClient(): void {
    if (!this.selectedClient) {
      this.availableProjectsForClient = [...this.allProjects];
      return;
    }

    // Filter out projects already assigned to the client
    const assignedProjectIds = this.clientProjects.map((p) => p.id);
    console.log('Current assigned project IDs:', assignedProjectIds);

    // Type checking issue - log both the type and value of all project IDs
    console.log('All project IDs with types:');
    this.allProjects.forEach((p) => {
      console.log(`Project ${p.name} - ID: ${p.id}, Type: ${typeof p.id}`);
    });

    console.log('Client project IDs with types:');
    this.clientProjects.forEach((p) => {
      console.log(`Project ${p.name} - ID: ${p.id}, Type: ${typeof p.id}`);
    });

    // Convert IDs to strings for comparison to avoid type issues
    const assignedProjectIdStrings = assignedProjectIds.map((id) => String(id));

    this.availableProjectsForClient = this.allProjects.filter(
      (project) => !assignedProjectIdStrings.includes(String(project.id))
    );

    console.log(
      `Available projects: ${this.availableProjectsForClient.length} of ${this.allProjects.length} total`
    );

    // Additional logging to debug the issue
    console.log('All projects:', this.allProjects);
    console.log('Client projects:', this.clientProjects);
  }

  updateAvailableCategories(): void {
    if (!this.selectedClient) {
      this.availableCategories = [...this.allCategories];
      return;
    }

    // Filter out categories already assigned to the client
    const assignedCategoryIds = this.clientCategories.map((c) => c.id);
    this.availableCategories = this.allCategories.filter(
      (c) => !assignedCategoryIds.includes(c.id)
    );
  }

  assignProjectToClient(): void {
    if (!this.selectedClient || !this.selectedProjectForClient) {
      this.showErrorMessage('Please select both a client and a project.');
      return;
    }

    if (
      this.selectedClient.id === undefined ||
      this.selectedProjectForClient.id === undefined
    ) {
      this.showErrorMessage('Invalid client or project ID.');
      return;
    }

    // Keep a copy of the project for UI updates
    const projectToAssign = { ...this.selectedProjectForClient };
    console.log('Assigning project to client:', projectToAssign);
    console.log('Project ID type:', typeof projectToAssign.id);

    this.isAssigningToClient = true;
    this.assignmentService
      .assignProjectToClient(projectToAssign.id, this.selectedClient.id)
      .pipe(
        finalize(() => {
          this.isAssigningToClient = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Server response for project assignment:', response);
          this.showSuccessMessage(
            `Project "${projectToAssign.name}" assigned to client "${this.selectedClient?.name}"`
          );

          // Add the newly assigned project to the list immediately with exact client ID copying
          if (this.selectedClient?.id !== undefined) {
            projectToAssign.clientId = this.selectedClient.id;
          }

          if (
            !this.clientProjects.some(
              (p) => String(p.id) === String(projectToAssign.id)
            )
          ) {
            console.log(
              'Adding project to client projects list:',
              projectToAssign
            );
            this.clientProjects = [...this.clientProjects, projectToAssign];
          } else {
            console.log('Project already in client projects list');
          }

          // Clear selection
          this.selectedProjectForClient = null;

          // Update available projects list
          this.updateAvailableProjectsForClient();

          // Then refresh data in the background
          setTimeout(() => {
            console.log('Refreshing client data after project assignment');
            this.loadClientData();
          }, 1000);
        },
        error: (error) => {
          console.error('Error assigning project to client:', error);
          this.showErrorMessage(
            'Failed to assign project to client. Please try again.'
          );
        },
      });
  }

  assignCategoryToClient(): void {
    if (!this.selectedClient || !this.selectedCategoryForClient) {
      this.showErrorMessage('Please select both a client and a category.');
      return;
    }

    if (
      this.selectedClient.id === undefined ||
      this.selectedCategoryForClient.id === undefined
    ) {
      this.showErrorMessage('Invalid client or category ID.');
      return;
    }

    this.isAssigningToClient = true;
    this.categoryService
      .assignCategoryToClient(
        this.selectedClient.id.toString(),
        this.selectedCategoryForClient.id.toString()
      )
      .pipe(
        finalize(() => {
          this.isAssigningToClient = false;
        })
      )
      .subscribe({
        next: () => {
          this.showSuccessMessage(
            `Category "${this.selectedCategoryForClient?.name}" assigned to client "${this.selectedClient?.name}"`
          );
          this.loadClientData();
          this.selectedCategoryForClient = null;
          this.updateAvailableCategories();
        },
        error: (error) => {
          console.error('Error assigning category to client:', error);
          this.showErrorMessage(
            'Failed to assign category to client. Please try again.'
          );
        },
      });
  }

  removeProjectFromClient(project: Project): void {
    if (
      !this.selectedClient ||
      !project ||
      !this.selectedClient.id ||
      !project.id
    )
      return;

    const confirmRemove = confirm(
      `Are you sure you want to remove project "${project.name}" from client "${this.selectedClient.name}"?`
    );
    if (!confirmRemove) return;

    this.assignmentService
      .unassignProjectFromClient(project.id, this.selectedClient.id)
      .subscribe({
        next: () => {
          this.showSuccessMessage(
            `Project "${project.name}" removed from client "${
              this.selectedClient?.name || ''
            }"`
          );

          // Immediately filter out the removed project from the UI
          this.clientProjects = this.clientProjects.filter(
            (p) => p.id !== project.id
          );

          // Then refresh data from the server to ensure everything is in sync
          setTimeout(() => {
            this.loadClientData();
            this.updateAvailableProjectsForClient();
          }, 500);
        },
        error: (error) => {
          console.error('Error removing project from client:', error);
          this.showErrorMessage(
            'Failed to remove project from client. Please try again.'
          );
        },
      });
  }

  removeCategoryFromClient(category: ProblemCategory): void {
    if (
      !this.selectedClient ||
      !category ||
      !this.selectedClient.id ||
      !category.id
    )
      return;

    const confirmRemove = confirm(
      `Are you sure you want to remove category "${category.name}" from client "${this.selectedClient.name}"?`
    );
    if (!confirmRemove) return;

    this.assignmentService
      .unassignCategoryFromClient(category.id, this.selectedClient.id)
      .subscribe({
        next: () => {
          this.showSuccessMessage(
            `Category "${category.name}" removed from client "${
              this.selectedClient?.name || ''
            }"`
          );

          // Immediately filter out the removed category from the UI
          this.clientCategories = this.clientCategories.filter(
            (c) => c.id !== category.id
          );

          // Then refresh data from the server to ensure everything is in sync
          setTimeout(() => {
            this.loadClientData();
            this.updateAvailableCategories();
          }, 500);
        },
        error: (error) => {
          console.error('Error removing category from client:', error);
          this.showErrorMessage(
            'Failed to remove category from client. Please try again.'
          );
        },
      });
  }

  // Collaborator Assignment Methods
  onChefForCollaboratorSelected(): void {
    console.log('Chef selection changed:', this.selectedChef);

    // Clear current selection
    this.selectedCollaborator = null;

    if (!this.selectedChef) {
      console.log('No chef selected, clearing collaborator lists');
      this.chefCollaborators = [];
      this.updateAvailableCollaborators();
      return;
    }

    // Load the chef's collaborators from the server
    this.loadChefCollaborators();
  }

  loadChefCollaborators(): void {
    if (!this.selectedChef || this.selectedChef.id === undefined) {
      console.warn(
        'Cannot load collaborators: No chef selected or invalid chef ID'
      );
      this.chefCollaborators = [];
      this.isLoadingCollaborators = false;
      return;
    }

    const chefId = this.selectedChef.id;
    console.log(`Loading collaborators for chef ID ${chefId}`);

    this.isLoadingCollaborators = true;
    this.userService
      .getCollaborateursByChefId(chefId)
      .pipe(
        finalize(() => {
          this.isLoadingCollaborators = false;
        })
      )
      .subscribe({
        next: (collaborators) => {
          console.log(
            `Loaded ${collaborators.length} collaborators for chef ${chefId}`,
            collaborators
          );

          // Check if there are any null or undefined entries
          const validCollaborators = collaborators.filter(
            (c) => c !== null && c !== undefined
          );
          if (validCollaborators.length !== collaborators.length) {
            console.warn(
              `Filtered out ${
                collaborators.length - validCollaborators.length
              } invalid collaborators`
            );
          }

          // Store the collaborators in the component
          this.chefCollaborators = validCollaborators;

          // Update the available collaborators list based on the loaded data
          this.updateAvailableCollaborators();
        },
        error: (error) => {
          console.error(
            `Error loading collaborators for chef ${chefId}:`,
            error
          );

          // Log additional error details if available
          if (error.error) {
            console.error('Server error details:', error.error);
          }

          // Ensure we have an empty array rather than undefined
          this.chefCollaborators = [];

          this.showErrorMessage(
            'Failed to load chef collaborators. Please try again.'
          );
        },
      });
  }

  updateAvailableCollaborators(): void {
    // Start with all collaborateurs
    let available = [...this.collaborateurs];

    console.log(`Initial available collaborators count: ${available.length}`);

    // Remove null or undefined values
    available = available.filter((c) => c !== null && c !== undefined);

    if (!this.selectedChef) {
      // If no chef is selected, all collaborators are available
      this.availableCollaborators = available;
      console.log(
        `No chef selected, all ${available.length} collaborators are available`
      );
      return;
    }

    // If chef is selected, filter out collaborators already assigned to this chef
    const assignedIds = this.chefCollaborators
      .filter((c) => c !== null && c !== undefined && c.id !== undefined)
      .map((c) => c.id);

    console.log(
      `Found ${assignedIds.length} already assigned collaborator IDs`,
      assignedIds
    );

    this.availableCollaborators = available.filter(
      (c) => c.id !== undefined && !assignedIds.includes(c.id)
    );

    console.log(
      `After filtering, ${this.availableCollaborators.length} collaborators are available`
    );
  }

  assignCollaboratorToChef(): void {
    if (!this.selectedChef || !this.selectedCollaborator) {
      this.showErrorMessage('Please select both a chef and a collaborator.');
      return;
    }

    if (
      this.selectedChef.id === undefined ||
      this.selectedCollaborator.id === undefined
    ) {
      this.showErrorMessage('Invalid chef or collaborator ID.');
      return;
    }

    const collaboratorId = this.selectedCollaborator.id;
    const chefId = this.selectedChef.id;

    // Store the selected collaborator before clearing the selection
    const collaboratorToAssign = { ...this.selectedCollaborator };

    this.isAssigningCollaborator = true;
    this.assignmentService
      .assignCollaboratorToChef(collaboratorId, chefId)
      .pipe(
        finalize(() => {
          this.isAssigningCollaborator = false;
        })
      )
      .subscribe({
        next: (response) => {
          console.log('Assignment successful:', response);
          this.showSuccessMessage(
            `Collaborator "${collaboratorToAssign.name}" assigned to chef "${this.selectedChef?.name}"`
          );

          // Immediately add the collaborator to the local list
          if (
            !this.chefCollaborators.some(
              (c) => c.id === collaboratorToAssign.id
            )
          ) {
            this.chefCollaborators.push(collaboratorToAssign);
          }

          // Update the available collaborators list
          this.availableCollaborators = this.availableCollaborators.filter(
            (c) => c.id !== collaboratorToAssign.id
          );

          // Clear the selection
          this.selectedCollaborator = null;

          // Then refresh data from the server to ensure everything is in sync
          setTimeout(() => {
            this.loadChefCollaborators();
          }, 500);
        },
        error: (error) => {
          console.error('Error assigning collaborator to chef:', error);
          // Log more details for debugging
          if (error.error && error.error.message) {
            console.error('Server error message:', error.error.message);
          }
          this.showErrorMessage(
            'Failed to assign collaborator to chef. Please try again.'
          );
        },
      });
  }

  removeCollaboratorFromChef(collaborator: User): void {
    if (
      !this.selectedChef ||
      !collaborator ||
      !this.selectedChef.id ||
      !collaborator.id
    ) {
      this.showErrorMessage('Invalid chef or collaborator data.');
      return;
    }

    const confirmRemove = confirm(
      `Are you sure you want to remove collaborator "${collaborator.name}" from chef "${this.selectedChef.name}"?`
    );
    if (!confirmRemove) return;

    const collaboratorId = collaborator.id;
    const chefId = this.selectedChef.id;

    // Keep a copy of the collaborator for UI updates
    const collaboratorToRemove = { ...collaborator };

    this.assignmentService
      .unassignCollaboratorFromChef(collaboratorId, chefId)
      .subscribe({
        next: (response) => {
          console.log('Unassignment successful:', response);
          this.showSuccessMessage(
            `Collaborator "${collaboratorToRemove.name}" removed from chef "${this.selectedChef?.name}"`
          );

          // Immediately filter out the removed collaborator from the UI
          this.chefCollaborators = this.chefCollaborators.filter(
            (c) => c.id !== collaboratorToRemove.id
          );

          // Add the collaborator back to available list if not already there
          if (
            !this.availableCollaborators.some(
              (c) => c.id === collaboratorToRemove.id
            )
          ) {
            this.availableCollaborators.push(collaboratorToRemove);
          }

          // Then refresh data from the server to ensure everything is in sync
          setTimeout(() => {
            this.loadChefCollaborators();
            this.updateAvailableCollaborators();
          }, 500);
        },
        error: (error) => {
          console.error('Error removing collaborator from chef:', error);
          // Log more details for debugging
          if (error.error && error.error.message) {
            console.error('Server error message:', error.error.message);
          }
          this.showErrorMessage(
            'Failed to remove collaborator from chef. Please try again.'
          );
        },
      });
  }

  // Helper methods
  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      panelClass: ['error-snackbar'],
    });
  }

  refreshAllData(): void {
    this.loadInitialData();
    if (this.selectedChef) this.loadChefProjects();
    if (this.selectedClient) this.loadClientData();
    if (this.selectedChef) this.loadChefCollaborators();
  }

  /**
   * Start a timer to periodically verify data consistency with the server
   */
  private startPeriodicDataVerification(): void {
    // Check every 30 seconds if the component has been active for a while
    this.dataVerificationTimer = setInterval(() => {
      this.verifyDataConsistency();
    }, 30000); // 30 seconds
  }

  /**
   * Stop the periodic verification timer
   */
  private stopPeriodicDataVerification(): void {
    if (this.dataVerificationTimer) {
      clearInterval(this.dataVerificationTimer);
      this.dataVerificationTimer = null;
    }
  }

  /**
   * Verify that local data matches server data
   */
  private verifyDataConsistency(): void {
    console.log('Verifying data consistency with server...');

    // Only check if we have a selected chef
    if (this.selectedChef && this.selectedChef.id) {
      console.log(
        `Verifying collaborator assignments for chef ${this.selectedChef.id}`
      );

      // Get current assignment count
      const currentAssignmentCount = this.chefCollaborators.length;

      // Query the server for the latest data
      this.userService
        .getCollaborateursByChefId(this.selectedChef.id)
        .subscribe({
          next: (serverCollaborators) => {
            console.log(
              `Server returned ${serverCollaborators.length} collaborators (local: ${currentAssignmentCount})`
            );

            // If the count doesn't match, refresh the data
            if (serverCollaborators.length !== currentAssignmentCount) {
              console.warn(
                'Data inconsistency detected, refreshing from server'
              );
              this.chefCollaborators = serverCollaborators;
              this.updateAvailableCollaborators();
            } else {
              // Check if the IDs match
              const localIds = new Set(this.chefCollaborators.map((c) => c.id));
              const serverIds = new Set(serverCollaborators.map((c) => c.id));

              let mismatched = false;

              // Check if any local IDs are missing from server
              for (const id of localIds) {
                if (!serverIds.has(id)) {
                  console.warn(
                    `Collaborator with ID ${id} is in local data but not on server`
                  );
                  mismatched = true;
                  break;
                }
              }

              // Check if any server IDs are missing from local
              for (const id of serverIds) {
                if (!localIds.has(id)) {
                  console.warn(
                    `Collaborator with ID ${id} is on server but not in local data`
                  );
                  mismatched = true;
                  break;
                }
              }

              // If there's a mismatch, refresh the data
              if (mismatched) {
                console.warn(
                  'Collaborator ID mismatch detected, refreshing from server'
                );
                this.chefCollaborators = serverCollaborators;
                this.updateAvailableCollaborators();
              } else {
                console.log(
                  'Data verification successful: local and server data match'
                );
              }
            }
          },
          error: (error) => {
            console.error('Error during data verification:', error);
          },
        });
    }
  }
}
