import { Component, OnInit, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatTooltipModule } from '@angular/material/tooltip';

import { TicketService } from '../../../services/ticket.service';
import { ProjectService } from '../../../services/project.service';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { UserService } from '../../../services/user.service';
import { AuthService } from '../../../services/auth.service';
import { ClientService } from '../../../services/client.service';
import { AssignmentService } from '../../../services/assignment.service';
import { Project } from '../../../models/project.model';
import { ProblemCategory } from '../../../models/problem-category.model';
import { User } from '../../../models/user.model';
import { forkJoin } from 'rxjs';
import { catchError, of, throwError, finalize } from 'rxjs';
import { retry } from 'rxjs';

interface ApiResponse {
  projects: Project[];
  categories: ProblemCategory[];
}

interface UserWithCategories extends User {
  assignedProblemCategories?: ProblemCategory[];
}

interface DialogData {
  priorities: string[];
  qualifications: string[];
  projects?: any[];
  problemCategories?: any[];
}

@Component({
  selector: 'app-create-ticket-dialog',
  templateUrl: './create-ticket-dialog.component.html',
  styleUrls: ['./create-ticket-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule,
    MatIconModule,
    MatProgressBarModule,
    MatDialogModule,
    MatTooltipModule,
  ],
})
export class CreateTicketDialogComponent implements OnInit {
  ticketForm: FormGroup;
  isLoading = false;
  isLoadingAssignments = false;
  isUploading = false;
  errorMessage = '';
  availableProjects: Project[] = [];
  availableCategories: ProblemCategory[] = [];
  selectedFile: File | null = null;
  selectedFileName: string = '';
  uploadProgress = 0;
  qualifications = ['Demande de formation', 'Demande d\'information', 'Ticket support'];
  priorities = ['Basse', 'Moyenne', 'Haute'];
  data: DialogData = {
    priorities: ['Basse', 'Moyenne', 'Haute'],
    qualifications: ['Demande de formation', 'Demande d\'information', 'Ticket support'],
  };
  userId: number | string | null = null;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    private projectService: ProjectService,
    private problemCategoryService: ProblemCategoryService,
    private userService: UserService,
    private authService: AuthService,
    private clientService: ClientService,
    private assignmentService: AssignmentService,
    private snackBar: MatSnackBar,
    private dialogRef: MatDialogRef<CreateTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) dialogData: DialogData
  ) {
    // Initialize the form first
    this.ticketForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', Validators.required],
      projectId: ['', Validators.required],
      categoryId: ['', Validators.required],
      priority: ['Moyenne', Validators.required], // Default to medium priority
      qualification: ['Demande de formation', Validators.required], // Default to first qualification
      attachment: [''],
      commentaire: [''],
    });

    // Then initialize data from dialog
    if (dialogData) {
      this.data = dialogData;
      
      // Use the provided data for dropdown options
      if (this.data.priorities && this.data.priorities.length > 0) {
        this.priorities = this.data.priorities;
        // Update form default
        this.ticketForm.get('priority')?.setValue(this.priorities[1] || 'Moyenne');
      }
      
      if (this.data.qualifications && this.data.qualifications.length > 0) {
        this.qualifications = this.data.qualifications;
        // Update form default
        this.ticketForm.get('qualification')?.setValue(this.qualifications[0] || 'Demande de formation');
      }
      
      // If projects are already passed in the dialog data, use them
      if (this.data.projects && Array.isArray(this.data.projects) && this.data.projects.length > 0) {
        try {
          // Normalize project data to ensure consistent properties
          this.availableProjects = this.normalizeProjects(this.data.projects);
        } catch (error) {
          this.availableProjects = this.data.projects;
        }
      }
      
      // If categories are already passed in the dialog data, use them
      if (this.data.problemCategories && Array.isArray(this.data.problemCategories) && this.data.problemCategories.length > 0) {
        try {
          // Normalize category data to ensure consistent properties
          this.availableCategories = this.normalizeCategories(this.data.problemCategories);
        } catch (error) {
          this.availableCategories = this.data.problemCategories;
        }
      }
    }
  }

  ngOnInit(): void {
    console.log('CreateTicketDialogComponent initialized');
    
    // Only load user data and fetch projects/categories if not already provided
    if (this.availableProjects.length === 0 || this.availableCategories.length === 0) {
      this.loadCurrentUser();
    } else {
      // Data already available, no need to show loading
      this.isLoading = false;
      this.isLoadingAssignments = false;
    }
  }

  loadCurrentUser(): void {
    this.isLoading = true;
    this.isLoadingAssignments = true;
    this.errorMessage = '';

    // Try to get user from localStorage directly as fallback
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        if (user && user.id) {
          this.userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
          console.log('User ID from localStorage:', this.userId);
          
          // Check if userId is a valid number
          const userIdNum = Number(this.userId);
          if (!isNaN(userIdNum)) {
            this.fetchData();
            return;
          } else {
            console.error('Invalid user ID from localStorage:', user.id);
          }
        }
      } catch (error) {
        console.error('Error parsing user from localStorage:', error);
      }
    }

    // Get the current user from the auth service as an Observable
    this.authService.currentUser$.subscribe({
      next: (user) => {
        if (!user) {
          this.errorMessage = 'Utilisateur non authentifié';
          this.isLoading = false;
          this.isLoadingAssignments = false;
          // Try hardcoded IDs as a last resort for testing
          this.tryHardcodedClientIds();
          return;
        }

        if (!user.id) {
          this.errorMessage = 'ID utilisateur manquant';
          this.isLoading = false;
          this.isLoadingAssignments = false;
          // Try hardcoded IDs as a last resort for testing
          this.tryHardcodedClientIds();
          return;
        }

        this.userId = typeof user.id === 'string' ? parseInt(user.id, 10) : user.id;
        console.log('Current user ID from auth service:', this.userId);

        // Check if userId is a valid number
        const userIdNum = Number(this.userId);
        if (isNaN(userIdNum)) {
          this.errorMessage = 'ID utilisateur invalide';
          this.isLoading = false;
          this.isLoadingAssignments = false;
          // Try hardcoded IDs as a last resort for testing
          this.tryHardcodedClientIds();
          return;
        }

        // Now fetch the data using the user ID
        this.fetchData();
      },
      error: (error) => {
        console.error('Error retrieving current user:', error);
        this.errorMessage = 'Erreur lors de la récupération de l\'utilisateur actuel: ' + (error?.message || error);
        this.isLoading = false;
        this.isLoadingAssignments = false;
        
        // Try hardcoded IDs as a last resort for testing
        this.tryHardcodedClientIds();
      },
      complete: () => {
        // If somehow the observable completes without giving us a user
        if (!this.userId) {
          console.warn('Auth service completed without providing user');
          this.isLoading = false;
          this.isLoadingAssignments = false;
          this.errorMessage = 'Session utilisateur non disponible';
          
          // Try hardcoded IDs as a last resort for testing
          this.tryHardcodedClientIds();
        }
      }
    });
  }

  fetchData(): void {
    if (!this.userId) {
      this.errorMessage = 'Aucun ID utilisateur disponible';
      this.isLoading = false;
      this.isLoadingAssignments = false;
      return;
    }

    // Try both methods to get projects
    this.fetchProjectsAndCategories();
  }

  fetchProjectsAndCategories(): void {
    // First try client service
    if (!this.userId) {
      this.errorMessage = 'No user ID available';
      this.isLoading = false;
      this.isLoadingAssignments = false;
      // Load fallback data anyway
      this.loadFallbackProjectsAndCategories();
      return;
    }

    // Now we're sure userId is not null
    const userId = this.userId; // Non-null version for type safety
    let projectsLoaded = false;
    let categoriesLoaded = false;

    // Create a timeout to ensure we don't get stuck waiting for API
    const fallbackTimer = setTimeout(() => {
      if (!projectsLoaded || !categoriesLoaded) {
        console.log('API calls taking too long, loading fallback data');
        this.loadFallbackProjectsAndCategories();
      }
    }, 5000); // 5 second timeout

    // Load projects - clientService.getClientProjects accepts number|string
    this.clientService.getClientProjects(userId).subscribe({
      next: (projects) => {
        console.log('Client projects loaded:', projects);
        projectsLoaded = true;
        
        if (projects && Array.isArray(projects) && projects.length > 0) {
          this.availableProjects = projects;
          
          // Check if we have both data sets now
          if (categoriesLoaded) {
            clearTimeout(fallbackTimer);
            this.isLoading = false;
            this.isLoadingAssignments = false;
          }
        } else {
          // If no projects found, try assignment service
          // assignmentService.getProjectsByClientId accepts number|string
          this.assignmentService.getProjectsByClientId(userId).subscribe({
            next: (assignedProjects: Project[]) => {
              console.log('Assigned projects loaded:', assignedProjects);
              
              if (assignedProjects && Array.isArray(assignedProjects) && assignedProjects.length > 0) {
                this.availableProjects = assignedProjects;
              } else {
                // Still no projects, load all projects as a fallback
                this.loadAllProjects();
              }
              
              // Check if we have both data sets now
              if (categoriesLoaded) {
                clearTimeout(fallbackTimer);
                this.isLoading = false;
                this.isLoadingAssignments = false;
              }
            },
            error: (error: any) => {
              console.error('Error loading assigned projects:', error);
              // Load all projects as a fallback
              this.loadAllProjects();
              
              // Check if we have both data sets now
              if (categoriesLoaded) {
                clearTimeout(fallbackTimer);
                this.isLoading = false;
                this.isLoadingAssignments = false;
              }
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading client projects:', error);
        // Try assignment service as fallback
        // assignmentService.getProjectsByClientId accepts number|string
        this.assignmentService.getProjectsByClientId(userId).subscribe({
          next: (assignedProjects: Project[]) => {
            projectsLoaded = true;
            this.availableProjects = assignedProjects;
            
            // Check if we have both data sets now
            if (categoriesLoaded) {
              clearTimeout(fallbackTimer);
              this.isLoading = false;
              this.isLoadingAssignments = false;
            }
          },
          error: (assignError) => {
            console.error('Error loading assigned projects:', assignError);
            // Load all projects as a last resort
            this.loadAllProjects();
            
            // Check if we have both data sets now
            if (categoriesLoaded) {
              clearTimeout(fallbackTimer);
              this.isLoading = false;
              this.isLoadingAssignments = false;
            }
          }
        });
      }
    });

    // Load categories in parallel
    // problemCategoryService.getCategoriesByClientId accepts string
    const userIdStr = typeof userId === 'number' ? userId.toString() : userId;
    this.problemCategoryService.getCategoriesByClientId(userIdStr as string).subscribe({
      next: (categories) => {
        console.log('Categories loaded:', categories);
        categoriesLoaded = true;
        
        if (categories && Array.isArray(categories) && categories.length > 0) {
          this.availableCategories = categories;
        } else {
          // No categories found, load all categories as fallback
          this.loadAllCategories();
        }
        
        // Check if we have both data sets now
        if (projectsLoaded) {
          clearTimeout(fallbackTimer);
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      },
      error: (catError) => {
        console.error('Error loading categories for client:', catError);
        // Fallback to all categories
        this.loadAllCategories();
        
        // Check if we have both data sets now
        if (projectsLoaded) {
          clearTimeout(fallbackTimer);
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      }
    });
  }

  // Helper method to load all projects as fallback
  private loadAllProjects(): void {
    console.log('Loading all projects as fallback');
    this.projectService.getProjects().subscribe({
      next: (allProjects) => {
        console.log('All projects loaded as fallback:', allProjects);
        if (allProjects && Array.isArray(allProjects)) {
          this.availableProjects = allProjects;
        } else {
          this.availableProjects = [];
          console.warn('Received invalid projects data', allProjects);
        }
        this.isLoading = false;
      },
      error: (allProjError) => {
        console.error('Error loading all projects:', allProjError);
        this.errorMessage = 'Error loading projects: ' + (allProjError?.message || allProjError);
        this.availableProjects = [];
        this.isLoading = false;
      },
      complete: () => {
        this.isLoading = false;
      }
    });
  }

  // Helper method to load all categories as fallback
  private loadAllCategories(): void {
    console.log('Loading all categories as fallback');
    this.problemCategoryService.getCategories().subscribe({
      next: (allCategories) => {
        console.log('All categories loaded as fallback:', allCategories);
        if (allCategories && Array.isArray(allCategories)) {
          this.availableCategories = allCategories;
        } else {
          this.availableCategories = [];
          console.warn('Received invalid categories data', allCategories);
        }
        this.isLoadingAssignments = false;
      },
      error: (allCatError) => {
        console.error('Error loading all categories:', allCatError);
        this.errorMessage = 'Error loading categories: ' + (allCatError?.message || allCatError);
        this.availableCategories = [];
        this.isLoadingAssignments = false;
      },
      complete: () => {
        this.isLoadingAssignments = false;
      }
    });
  }

  // Load both fallbacks at once
  private loadFallbackProjectsAndCategories(): void {
    console.log('Loading fallback data for both projects and categories');
    // Track completion of both calls
    let projectsDone = false;
    let categoriesDone = false;
    
    // Load all projects
    this.projectService.getProjects().subscribe({
      next: (allProjects) => {
        console.log('Fallback all projects loaded:', allProjects?.length || 0);
        if (allProjects && Array.isArray(allProjects)) {
          this.availableProjects = allProjects;
        }
        projectsDone = true;
        if (categoriesDone) {
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      },
      error: (error) => {
        console.error('Error loading fallback projects:', error);
        this.availableProjects = [];
        projectsDone = true;
        if (categoriesDone) {
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      }
    });
    
    // Load all categories
    this.problemCategoryService.getCategories().subscribe({
      next: (allCategories) => {
        console.log('Fallback all categories loaded:', allCategories?.length || 0);
        if (allCategories && Array.isArray(allCategories)) {
          this.availableCategories = allCategories;
        }
        categoriesDone = true;
        if (projectsDone) {
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      },
      error: (error) => {
        console.error('Error loading fallback categories:', error);
        this.availableCategories = [];
        categoriesDone = true;
        if (projectsDone) {
          this.isLoading = false;
          this.isLoadingAssignments = false;
        }
      }
    });
    
    // Set a timeout in case both API calls fail completely
    setTimeout(() => {
      if (!projectsDone || !categoriesDone) {
        console.warn('Fallback loading timeout reached');
        this.isLoading = false;
        this.isLoadingAssignments = false;
        
        // Create some minimal default data if nothing was loaded
        if (this.availableProjects.length === 0) {
          this.errorMessage = 'Could not load any projects. Please try again.';
        }
        if (this.availableCategories.length === 0) {
          this.errorMessage = 'Could not load any categories. Please try again.';
        }
      }
    }, 8000); // 8 second timeout
  }

  refreshData(): void {
    this.isLoading = true;
    this.isLoadingAssignments = true;
    this.errorMessage = '';
    this.fetchData();
  }

  tryHardcodedClientIds(): void {
    // This is a fallback method with hardcoded IDs for testing
    const hardcodedUserIds = [1, 2, 3, 4, 5]; // Try several common user IDs
    this.isLoadingAssignments = true;
    this.errorMessage = 'Tentative avec des IDs client prédéfinis...';

    let successFound = false;

    // Try each ID until we find one that works
    for (const id of hardcodedUserIds) {
      this.clientService.getClientProjects(id).subscribe({
        next: (projects) => {
          if (projects && Array.isArray(projects) && projects.length > 0 && !successFound) {
            successFound = true;
            this.availableProjects = projects;
            this.userId = id; // Set a valid non-null ID
            console.log(`Found projects using hardcoded ID: ${id}`);

            this.problemCategoryService
              .getCategoriesByClientId(id.toString())
              .subscribe({
                next: (categories) => {
                  if (categories && Array.isArray(categories)) {
                    this.availableCategories = categories;
                  }
                  this.isLoadingAssignments = false;
                  this.errorMessage = `Utilisation de l'ID client test: ${id}`;
                },
                error: () => {
                  this.problemCategoryService
                    .getCategories()
                    .subscribe({
                      next: (allCats) => {
                        if (allCats && Array.isArray(allCats)) {
                          this.availableCategories = allCats;
                        }
                        this.isLoadingAssignments = false;
                      },
                      error: () => {
                        this.isLoadingAssignments = false;
                      }
                    });
                },
              });
          }
        },
        error: () => {
          // Silent error, will try next ID
        },
      });
    }

    // If all hardcoded IDs fail, fetch all projects as last resort
    setTimeout(() => {
      if (!successFound) {
        this.projectService.getProjects().subscribe({
          next: (allProjects) => {
            if (allProjects && Array.isArray(allProjects)) {
              this.availableProjects = allProjects;
            }
            this.problemCategoryService.getCategories().subscribe({
              next: (allCategories) => {
                if (allCategories && Array.isArray(allCategories)) {
                  this.availableCategories = allCategories;
                }
                this.isLoadingAssignments = false;
                this.errorMessage =
                  'Utilisation de tous les projets et catégories disponibles';
              },
              error: () => {
                this.isLoadingAssignments = false;
                this.errorMessage = 'Impossible de charger les catégories';
              }
            });
          },
          error: () => {
            this.isLoadingAssignments = false;
            this.errorMessage = 'Impossible de charger les projets ou catégories';
          },
        });
      }
    }, 2000);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input?.files && input.files.length > 0) {
      this.selectedFile = input.files[0];
      this.selectedFileName = this.selectedFile.name;
      console.log('File selected:', this.selectedFileName);
    }
  }

  // Add method to remove the selected file
  removeFile(): void {
    this.selectedFile = null;
    this.selectedFileName = '';
    this.uploadProgress = 0;
    console.log('File removed');
  }

  onSubmit(): void {
    if (this.ticketForm.invalid) {
      return;
    }
    
    this.isLoading = true;
    this.isUploading = true;
    this.uploadProgress = 0;
    
    // Create a proper ticket object instead of FormData
    const ticketData = {
      title: this.ticketForm.get('title')?.value,
      description: this.ticketForm.get('description')?.value,
      priority: this.ticketForm.get('priority')?.value,
      qualification: this.ticketForm.get('qualification')?.value,
      projectId: this.stringifyId(this.ticketForm.get('projectId')?.value),
      categoryId: this.stringifyId(this.ticketForm.get('categoryId')?.value),
      commentaire: this.ticketForm.get('commentaire')?.value || '',
      attachment: this.selectedFileName || '',
      clientId: this.userId ? this.userId.toString() : '',
    };

    // Simulate faster upload progress for better UX
    const progressInterval = setInterval(() => {
      if (this.uploadProgress < 90) {
        this.uploadProgress += 15; // Faster progress increment
      }
    }, 100); // Shorter interval

    // Handle file and ticket creation in parallel when possible
    if (this.selectedFile) {
      // Prepare form data for file upload
      const formData = new FormData();
      formData.append('file', this.selectedFile, this.selectedFile.name);

      // Optimize by conducting file upload and ticket creation in parallel
      // This is much faster than sequential requests
      forkJoin({
        // File upload
        fileUpload: this.ticketService.uploadFile(formData).pipe(
          catchError(error => {
            console.error('File upload error, continuing with ticket creation:', error);
            // Continue even if file upload fails - don't block ticket creation
            return of(null);
          })
        ),
        // Ticket creation
        ticketCreation: this.ticketService.createTicket(ticketData).pipe(
          // Add retry to ensure success
          retry(1),
          catchError(error => {
            console.error('Ticket creation failed, will retry once more:', error);
            return throwError(() => error);
          })
        )
      }).pipe(
        // Ensure resources are released in any case
        finalize(() => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
        })
      ).subscribe({
        next: ({ ticketCreation }) => {
          this.handleTicketCreationSuccess(ticketCreation, ticketData);
        },
        error: (error) => {
          this.handleTicketCreationError(error, progressInterval);
        }
      });
    } else {
      // No file to upload, just create the ticket - much simpler and faster
      this.ticketService.createTicket(ticketData).pipe(
        // Add retry logic for reliability
        retry(1),
        // Always clean up resources
        finalize(() => {
          clearInterval(progressInterval);
          this.uploadProgress = 100;
        })
      ).subscribe({
        next: (response) => {
          this.handleTicketCreationSuccess(response, ticketData);
        },
        error: (error) => {
          this.handleTicketCreationError(error, progressInterval);
        }
      });
    }
  }

  // Split ticket creation handling into separate methods for better organization
  private handleTicketCreationSuccess(response: any, ticketData: any): void {
    // Complete progress UI
    this.uploadProgress = 100;
    this.isLoading = false;
    this.isUploading = false;
    
    // Show success message
    this.snackBar.open('Ticket créé avec succès', 'Fermer', {
      duration: 3000,
    });
    
    // Prepare complete ticket data to return
    const newTicket = {
      ...response,
      project: this.availableProjects.find(p => p.id === ticketData.projectId),
      problemCategory: this.availableCategories.find(c => c.id === ticketData.categoryId),
      status: 'Ouvert',
      createdAt: new Date().toISOString(),
      priority: ticketData.priority,
      qualification: ticketData.qualification,
      title: ticketData.title,
      description: ticketData.description,
      commentaire: ticketData.commentaire,
      attachment: ticketData.attachment
    };
    
    // Close dialog with the new ticket data
    this.dialogRef.close(newTicket);
  }
  
  private handleTicketCreationError(error: any, progressInterval?: any): void {
    // Stop progress animation
    if (progressInterval) {
      clearInterval(progressInterval);
    }
    
    // Reset UI state
    this.isLoading = false;
    this.isUploading = false;
    
    // Set error message
    this.errorMessage = 'Erreur lors de la création du ticket: ' + (error?.message || error);
    
    // Show error notification
    this.snackBar.open('Erreur lors de la création du ticket', 'Fermer', {
      duration: 3000,
    });
  }

  closeDialog(): void {
    this.dialogRef.close();
  }

  onCancel(): void {
    this.closeDialog();
  }

  // Helper function to normalize project data
  private normalizeProjects(projects: any[]): any[] {
    return projects.map(project => ({
      id: project.id,
      name: project.name || 'Projet sans nom',
      description: project.description || '',
      status: project.status || 'Active',
      clientId: project.clientId || 0,
      // Include other required properties from Project interface
      chefProjetId: project.chefProjetId,
      collaborateurIds: project.collaborateurIds || [],
      startDate: project.startDate,
      endDate: project.endDate
    }));
  }

  // Helper function to normalize category data
  private normalizeCategories(categories: any[]): any[] {
    return categories.map(category => ({
      id: category.id,
      name: category.name || 'Catégorie sans nom',
      description: category.description || ''
    }));
  }

  // Helper to ensure consistent ID format
  private stringifyId(id: any): string {
    if (id === null || id === undefined) {
      return '';
    }
    return id.toString();
  }
}
