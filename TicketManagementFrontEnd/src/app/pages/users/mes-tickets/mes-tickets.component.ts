import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatTooltipModule } from '@angular/material/tooltip';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../core/services/auth.service';
import { TicketService } from '../../../services/ticket.service';
import { ExcelService } from '../../../services/excel.service';
import { Ticket } from '../../../models/ticket.model';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { UserNavbarComponent } from '../../../components/UserComponents/user-navbar/user-navbar.component';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { CommentDialogComponent } from '../../admin/tickets/comment-dialog.component';
import { CreateTicketDialogComponent } from '../../../components/UserComponents/create-ticket-dialog/create-ticket-dialog.component';
import { ExportDialogComponent } from '../../admin/tickets/export-dialog.component';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-mes-tickets',
  templateUrl: './mes-tickets.component.html',
  styleUrls: ['./mes-tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatDialogModule,
    MatTooltipModule,
    TopBarComponent,
    UserNavbarComponent,
  ],
})
export class MesTicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  viewMode = 'list'; // Default view mode ('card' or 'list')
  isLoading = false;
  error: string | null = null;
  selectedTicket: Ticket | null = null;
  currentUserId: number | null = null;
  searchTerm = '';
  
  // Properties for filtering export
  projects: any[] = [];
  problemCategories: any[] = [];
  statuses: string[] = [];
  priorities: string[] = [];
  
  // Current sort value
  currentSortValue = 'newest';

  constructor(
    private authService: AuthService,
    private ticketService: TicketService,
    private excelService: ExcelService,
    private router: Router,
    private dialog: MatDialog,
    private snackBar: MatSnackBar,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    // Restore previous view mode preference if it exists
    const savedViewMode = localStorage.getItem('ticketsViewMode');
    if (savedViewMode) {
      this.viewMode = savedViewMode;
    }
    
    this.loadTickets();
  }

  loadTickets(): void {
    this.isLoading = true;
    this.error = null;
    this.tickets = [];
    this.filteredTickets = [];

    const currentUser = this.authService.user();
    if (!currentUser || !currentUser.id) {
      this.router.navigate(['/login']);
      return;
    }

    this.currentUserId = parseInt(currentUser.id, 10);
    if (isNaN(this.currentUserId)) {
      this.error = 'Invalid user ID';
      this.isLoading = false;
      return;
    }

    // Direct API call to the mes-tickets endpoint
    this.http.get<Ticket[]>(`${environment.apiUrl}/tickets/mes-tickets`)
      .subscribe({
        next: (tickets: Ticket[]) => {
          this.tickets = tickets;
          this.filteredTickets = [...tickets]; // Initialize filtered tickets
          this.isLoading = false;
          
          // Extract filter options for export
          this.extractFilterOptions(tickets);
          
          // Apply current sort
          this.applySorting();
          
          if (tickets.length > 0) {
            this.snackBar.open(`${tickets.length} tickets chargés`, 'Fermer', {
              duration: 3000,
              horizontalPosition: 'end',
              verticalPosition: 'bottom',
            });
          }
        },
        error: (error: unknown) => {
          this.error = 'Failed to load tickets. Please try again later.';
          this.isLoading = false;
          console.error('Error loading tickets:', error);
          
          this.snackBar.open('Erreur lors du chargement des tickets', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      });
  }

  // Extract unique filter options from tickets
  private extractFilterOptions(tickets: Ticket[]) {
    // Extract unique projects
    this.projects = this.extractUniqueObjects(
      tickets.filter((t) => t.project).map((t) => t.project)
    );

    // Extract unique problem categories
    this.problemCategories = this.extractUniqueObjects(
      tickets.filter((t) => t.problemCategory).map((t) => t.problemCategory)
    );

    // Extract unique statuses
    this.statuses = this.extractUniqueStrings(
      tickets.map((t) => t.status).filter(Boolean) as string[]
    );

    // Extract unique priorities
    this.priorities = this.extractUniqueStrings(
      tickets.map((t) => t.priority).filter(Boolean) as string[]
    );
  }

  // Helper to extract unique objects by ID
  private extractUniqueObjects(objects: any[]): any[] {
    const uniqueMap = new Map();
    objects.forEach((obj) => {
      if (obj && !uniqueMap.has(obj.id)) {
        uniqueMap.set(obj.id, obj);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // Helper to extract unique strings
  private extractUniqueStrings(strings: string[]): string[] {
    return [...new Set(strings)];
  }

  // Open export dialog
  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '500px',
      data: {
        projects: this.projects,
        problemCategories: this.problemCategories,
        statuses: this.statuses,
        priorities: this.priorities,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.exportTickets(result);
      }
    });
  }

  // Export tickets based on filter options
  private exportTickets(filterOptions: any): void {
    let filteredTickets: any[] = [];
    let fileName = 'mes-tickets';

    // Filter tickets based on selected criteria
    if (filterOptions.filterType === 'all') {
      filteredTickets = [...this.tickets];
      fileName = 'tous-mes-tickets';
    } else if (
      filterOptions.filterType === 'project' &&
      filterOptions.projectId
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.project?.id === filterOptions.projectId
      );
      const projectName =
        this.projects.find((p) => p.id === filterOptions.projectId)?.name ||
        'projet';
      fileName = `mes-tickets-${projectName}`;
    } else if (
      filterOptions.filterType === 'problemCategory' &&
      filterOptions.problemCategoryId
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.problemCategory?.id === filterOptions.problemCategoryId
      );
      const categoryName =
        this.problemCategories.find(
          (c) => c.id === filterOptions.problemCategoryId
        )?.name || 'categorie';
      fileName = `mes-tickets-${categoryName}`;
    } else if (filterOptions.filterType === 'status' && filterOptions.status) {
      filteredTickets = this.tickets.filter(
        (t) => t.status === filterOptions.status
      );
      fileName = `mes-tickets-${filterOptions.status}`;
    } else if (
      filterOptions.filterType === 'priority' &&
      filterOptions.priority
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.priority === filterOptions.priority
      );
      fileName = `mes-tickets-priorite-${filterOptions.priority}`;
    }

    // Export to Excel if we have tickets
    if (filteredTickets.length > 0) {
      // Convert to expected format (as any to bypass type checking)
      this.excelService.exportToExcel(filteredTickets as any, fileName);
      this.snackBar.open('Export Excel réussi', 'Fermer', { duration: 3000 });
    } else {
      this.snackBar.open('Aucun ticket à exporter', 'Fermer', {
        duration: 3000,
      });
    }
  }

  refreshTickets(): void {
    this.isLoading = true;
    this.snackBar.open('Actualisation des tickets...', '', {
      duration: 2000,
    });
    
    // Clear existing tickets to show loading state
    this.tickets = [];
    this.filteredTickets = [];
    
    // Using ticketService with the correct method
    this.ticketService.getUserTickets().subscribe({
      next: (tickets: Ticket[]) => {
        console.log('Tickets refreshed:', tickets);
        this.tickets = tickets;
        this.extractFilterOptions(tickets);
        
        // Apply text search if any
        this.applySearchAndSort();
        
        this.isLoading = false;
        this.snackBar.open(`${tickets.length} tickets chargés`, 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
      },
      error: (error: unknown) => {
        console.error('Error refreshing tickets:', error);
        this.error = 'Erreur lors du chargement des tickets';
        this.isLoading = false;
        
        // Fallback to HTTP client if service fails
        this.fallbackRefresh();
      }
    });
  }
  
  private fallbackRefresh(): void {
    this.http.get<Ticket[]>(`${environment.apiUrl}/tickets/mes-tickets`)
      .subscribe({
        next: (tickets: Ticket[]) => {
          console.log('Tickets refreshed via fallback:', tickets);
          this.tickets = tickets;
          this.extractFilterOptions(tickets);
          this.applySearchAndSort();
          this.isLoading = false;
          
          this.snackBar.open(`${tickets.length} tickets chargés`, 'Fermer', {
            duration: 3000,
            horizontalPosition: 'end',
            verticalPosition: 'bottom',
          });
        },
        error: (error: unknown) => {
          console.error('Error in fallback refresh:', error);
          this.isLoading = false;
          this.snackBar.open('Erreur lors du chargement des tickets', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar'],
          });
        }
      });
  }

  applySort(event: Event): void {
    const select = event.target as HTMLSelectElement;
    this.currentSortValue = select.value;
    this.applySearchAndSort();
  }
  
  applySearchAndSort(): void {
    if (!this.tickets || this.tickets.length === 0) return;
    
    // First apply the search term
    let result = [...this.tickets];
    if (this.searchTerm.trim()) {
      result = result.filter(ticket => this.matchesSearchTerm(ticket, this.searchTerm));
    }
    
    // Apply the sort
    result = this.sortTickets(result, this.currentSortValue);
    
    this.filteredTickets = result;
  }
  
  private applySorting(): void {
    this.filteredTickets = this.sortTickets([...this.filteredTickets], this.currentSortValue);
  }
  
  private sortTickets(tickets: Ticket[], sortBy: string): Ticket[] {
    const sorted = [...tickets];
    
    switch (sortBy) {
      case 'newest':
        return sorted.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'oldest':
        return sorted.sort((a, b) => 
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      case 'status':
        return sorted.sort((a, b) => 
          (a.status || '').localeCompare(b.status || '')
        );
      case 'title':
        return sorted.sort((a, b) => 
          (a.title || '').localeCompare(b.title || '')
        );
      case 'priority':
        // Custom priority order: Haute > Moyenne > Basse
        return sorted.sort((a, b) => {
          const priorityOrder: {[key: string]: number} = {
            'Haute': 1,
            'Moyenne': 2,
            'Basse': 3
          };
          const aPriority = priorityOrder[a.priority || ''] || 999;
          const bPriority = priorityOrder[b.priority || ''] || 999;
          return aPriority - bPriority;
        });
      default:
        return sorted;
    }
  }

  filterTickets(event: Event): void {
    this.searchTerm = (event.target as HTMLInputElement).value.toLowerCase().trim();
    this.applySearchAndSort();
  }

  switchView(mode: 'card' | 'list'): void {
    this.viewMode = mode;
    localStorage.setItem('ticketsViewMode', mode);
  }

  openCreateTicketDialog(): void {
    // Define the standard options for dropdown menus
    const dialogData = {
      priorities: ['Basse', 'Moyenne', 'Haute'],
      qualifications: ['Demande de formation', 'Demande d\'information', 'Ticket support'],
      // Pass already loaded projects and categories if available
      projects: this.projects,
      problemCategories: this.problemCategories
    };

    const dialogRef = this.dialog.open(CreateTicketDialogComponent, {
      width: '800px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: ['ticket-dialog-container', 'simplified-dialog'],
      disableClose: false,
      autoFocus: true,
      data: dialogData,
      enterAnimationDuration: '300ms',
      exitAnimationDuration: '200ms'
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Show immediate success feedback
        this.snackBar.open('Ticket créé avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
        
        // Add the new ticket directly to the UI without needing a refresh
        console.log('New ticket created:', result);
        
        // If the result doesn't include all the necessary properties, construct a complete ticket object
        const newTicket: Ticket = {
          ...result,
          createdAt: result.createdAt || new Date().toISOString(),
          status: result.status || 'Ouvert',
          id: result.id || 'temp_' + Date.now(), // Use a temporary ID with timestamp if not available
          title: result.title || 'Nouveau ticket',
          priority: result.priority || 'Moyenne',
          qualification: result.qualification || 'Ticket support',
          project: result.project || null,
          problemCategory: result.problemCategory || null
        };
        
        // Add the new ticket to the beginning of the array (newest first)
        this.tickets = [newTicket, ...this.tickets];
        
        // Update filter options with any new values from the ticket
        this.extractFilterOptions(this.tickets);
        
        // Re-apply current search/sort to immediately show the new ticket in the UI
        this.applySearchAndSort();
        
        // Silently refresh tickets from server in the background to ensure data consistency
        // but the UI already shows the new ticket for immediate feedback
        setTimeout(() => {
          this.ticketService.getUserTickets().subscribe({
            next: (updatedTickets: Ticket[]) => {
              // Silent update to ensure consistency with server
              console.log('Background refresh completed, updated tickets:', updatedTickets.length);
              this.tickets = updatedTickets;
              this.extractFilterOptions(updatedTickets);
              this.applySearchAndSort();
            },
            error: (error) => {
              console.error('Background refresh error:', error);
              // No need to show an error to the user since they already see their new ticket
            }
          });
        }, 1000);
      }
    });
  }

  getStatusColor(status?: string): string {
    if (!status) return '#999999';
    
    switch (status.toLowerCase()) {
      case 'nouveau':
      case 'en attente de traitement':
        return '#FF9800'; // Orange
      case 'en cours':
      case 'en traitement':
        return '#2196F3'; // Blue
      case 'en attente de validation':
        return '#673AB7'; // Deep Purple
      case 'en attente d\'informations':
        return '#9C27B0'; // Purple
      case 'validé':
      case 'résolu':
      case 'fermé':
        return '#4CAF50'; // Green
      case 'rejeté':
      case 'non résolu':
        return '#F44336'; // Red
      default:
        return '#999999'; // Grey for unknown status
    }
  }

  formatCreatedDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Date invalide';
    
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Format as "Today at HH:MM" or "Yesterday at HH:MM" or "DD/MM/YYYY"
    if (date.toDateString() === now.toDateString()) {
      return `Aujourd'hui à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else if (date.toDateString() === yesterday.toDateString()) {
      return `Hier à ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
    } else {
      return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    }
  }

  showDescription(ticket: Ticket): void {
    this.dialog.open(DescriptionDialogComponent, {
      width: '600px',
      data: ticket
    });
  }

  openCommentDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '700px',
      data: {
        ticket: ticket,
        ticketId: ticket.id,
        currentUserId: this.currentUserId,
        isAdmin: false,
        isChefProjet: false
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        // Immediately update the UI without requiring a refresh
        console.log('Comment added to ticket:', result);
        
        // Find and update the ticket in our local array
        const ticketIndex = this.tickets.findIndex(t => t.id === ticket.id);
        if (ticketIndex !== -1) {
          // Update comment in the local array with the exact returned comment from the server
          this.tickets[ticketIndex] = {
            ...this.tickets[ticketIndex],
            // Use the exact comment returned from the API if available
            commentaire: result.commentaire || result.comment || this.tickets[ticketIndex].commentaire,
            updatedAt: new Date().toISOString()
          };
          
          // Also update the filtered tickets to ensure the UI is consistent
          const filteredTicketIndex = this.filteredTickets.findIndex(t => t.id === ticket.id);
          if (filteredTicketIndex !== -1) {
            this.filteredTickets[filteredTicketIndex] = { ...this.tickets[ticketIndex] };
          }
          
          // Re-apply search/sort to update the UI
          this.applySearchAndSort();
        }
        
        // Show success message
        this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'end',
          verticalPosition: 'bottom',
        });
      }
    });
  }

  private matchesSearchTerm(ticket: Ticket, term: string): boolean {
    // Check if term is part of any ticket property
    const searchTerm = term.toLowerCase();
    return (
      (ticket.title || '').toLowerCase().includes(searchTerm) ||
      (ticket.description || '').toLowerCase().includes(searchTerm) ||
      (ticket.status || '').toLowerCase().includes(searchTerm) ||
      (ticket.priority || '').toLowerCase().includes(searchTerm) ||
      (ticket.qualification || '').toLowerCase().includes(searchTerm) ||
      (ticket.project?.name || '').toLowerCase().includes(searchTerm) ||
      (ticket.problemCategory?.name || '').toLowerCase().includes(searchTerm)
    );
  }

  // Helper method to generate proper attachment URLs
  getAttachmentUrl(attachmentPath: string): string {
    if (!attachmentPath) return '';
    
    // Handle absolute URLs
    if (attachmentPath.startsWith('http')) {
      return attachmentPath;
    }
    
    // Make sure the path starts with a slash
    const normalizedPath = attachmentPath.startsWith('/') ? attachmentPath : `/${attachmentPath}`;
    
    // Combine API base URL with the attachment path
    return `${environment.apiUrl.replace('/api', '')}${normalizedPath}`;
  }
}
