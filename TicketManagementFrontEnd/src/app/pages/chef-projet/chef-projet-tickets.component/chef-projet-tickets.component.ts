import { Component, OnInit, OnDestroy, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { RouterModule } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { AuthService } from '../../../services/auth.service';
import { firstValueFrom, lastValueFrom, of, throwError, TimeoutError, Subject } from 'rxjs';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { UserService } from '../../../services/user.service';
import { ChefProjetRefuseDialogComponent } from '../../../components/chef-projetComponents/chef-projet-refuse-dialog/chef-projet-refuse-dialog.component';
import { ChefAssignUserDialogComponent } from '../../../components/chef-projetComponents/chef-projet-assign-user-dialog.component/chef-projet-assign-user-dialog.component';
import { CommentDialogComponent } from '../../admin/tickets/comment-dialog.component';
import { TICKET_STATUS } from '../../../constants/ticket-status.constant';
import { catchError, retry, timeout, tap, map, switchMap, takeUntil } from 'rxjs/operators';
import { ExcelService } from '../../../services/excel.service';
import { ChefProjetExportDialogComponent } from './chef-projet-export-dialog.component';
import { environment } from '../../../../environments/environment';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-chef-projet-tickets',
  standalone: true,
  imports: [
    CommonModule, 
    MatIconModule, 
    RouterModule, 
    MatCardModule, 
    MatButtonModule, 
    MatFormFieldModule, 
    MatInputModule, 
    MatSelectModule, 
    MatSnackBarModule,
    MatDialogModule,
    FormsModule
  ],
  templateUrl: './chef-projet-tickets.component.html',
  styleUrls: ['./chef-projet-tickets.component.scss'],
})
export class ChefProjetTicketsComponent implements OnInit, OnDestroy {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  loading = true;
  error: string | null = null;
  
  // Search and sort properties
  searchTerm = '';
  sortCriteria: 'newest' | 'oldest' | 'status' | 'title' | 'priority' = 'newest';
  
  // Add STATUS constant for easier access
  readonly STATUS = TICKET_STATUS;

  // Filter options
  projects: any[] = [];
  statuses: string[] = [];
  priorities: string[] = [];

  // Add additional properties
  currentUserId: string | number = '';
  private destroy$ = new Subject<void>();
  
  // Expose localStorage to the template
  get localStorage() {
    return localStorage;
  }

  constructor(
    private ticketService: TicketService,
    private userService: UserService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private zone: NgZone,
    public dialog: MatDialog,
    private excelService: ExcelService,
    private http: HttpClient
  ) {}

  getAssignedToName(ticket: Ticket): string {
    return ticket.assignedTo?.name || 'Non assigné';
  }

  async ngOnInit() {
    try {
      console.log('[ChefProjet] Component initialized with sort criteria:', this.sortCriteria);
      
      // Set default values
      this.tickets = [];
      this.filteredTickets = [];
      this.loading = true; // Start in loading state
      this.error = null;
      
      // Initialize user ID from local storage for immediate display
      this.currentUserId = localStorage.getItem('userId') || '';
      console.log(`[ChefProjet] 👤 Initial user ID from storage: ${this.currentUserId}`);
      
      // Initial load of tickets
      await this.loadTickets();
    } catch (error) {
      console.error('[ChefProjet] Error during component initialization:', error);
      this.error = 'Erreur lors de l\'initialisation du composant.';
      this.loading = false;
    }
  }

  async loadTickets() {
    try {
      console.log('[ChefProjet] 🚀 Loading tickets - START');
      this.loading = true;
      this.error = null;

      // Check token first
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('[ChefProjet] ❌ Cannot load tickets: Token missing');
        this.error = 'Erreur d\'authentification: Token manquant. Veuillez vous reconnecter.';
        this.loading = false;
        return;
      }

      // Get current user ID - first try from localStorage for faster loading
      this.currentUserId = localStorage.getItem('userId') || '';
      console.log(`[ChefProjet] 👤 Initial user ID from localStorage: ${this.currentUserId}`);

      // If no user ID in localStorage, try to get it from the auth service
      if (!this.currentUserId) {
        try {
          const user = await lastValueFrom(this.authService.getCurrentUser());
          if (user && user.id) {
            this.currentUserId = user.id;
            console.log(`[ChefProjet] 👤 Got user ID from auth service: ${this.currentUserId}`);
          } else {
            throw new Error('User ID not available');
          }
        } catch (err) {
          console.error('[ChefProjet] ❌ Could not get user ID:', err);
          this.error = 'Erreur d\'identification: Impossible de récupérer votre ID utilisateur.';
          this.loading = false;
          return;
        }
      }

      // Attempt to load tickets - using the endpoint that works from the logs
      console.log(`[ChefProjet] 🔍 Fetching tickets for chef projet ID: ${this.currentUserId}`);
      
      try {
        // Direct HTTP call to the working endpoint - we know from logs this is the correct one
        this.http.get<any[]>(`http://localhost:5000/api/tickets/chef-projet/${this.currentUserId}`)
          .pipe(
            timeout(15000), // 15 second timeout
            catchError(error => {
              console.error('[ChefProjet] ❌ HTTP error getting tickets:', error);
              
              if (error instanceof TimeoutError) {
                this.error = 'La requête a expiré. Le serveur est peut-être indisponible ou surchargé.';
              } else if (error.status === 401 || error.status === 403) {
                this.error = 'Erreur d\'authentification: Accès non autorisé. Veuillez vous reconnecter.';
              } else if (error.status === 404) {
                this.error = `Pas de tickets trouvés pour l'ID chef de projet ${this.currentUserId}.`;
              } else if (error.status >= 500) {
                this.error = 'Erreur serveur. Veuillez réessayer plus tard.';
              } else {
                this.error = `Erreur lors du chargement des tickets: ${error.message || 'Erreur inconnue'}`;
              }
              
              this.loading = false;
              return of([]);
            })
          )
          .subscribe(tickets => {
            console.log(`[ChefProjet] ✅ Received ${tickets.length} tickets from API`);
            
            if (Array.isArray(tickets) && tickets.length > 0) {
              this.processTicketsArray(tickets, this.currentUserId);
            } else {
              console.warn('[ChefProjet] ⚠️ No tickets returned from API or response is not an array');
              this.tickets = [];
              this.filteredTickets = [];
              this.loading = false;
              
              if (!this.error) {
                this.error = `Aucun ticket trouvé pour le chef de projet ID ${this.currentUserId}.`;
              }
            }
          });
        
      } catch (err: any) {
        console.error('[ChefProjet] ❌ Error in API call:', err);
        this.error = `Erreur lors de l'appel API: ${err.message || 'Erreur inconnue'}`;
        this.loading = false;
      }
    } catch (err: any) {
      console.error('[ChefProjet] ❌ Error in loadTickets:', err);
      this.error = `Erreur: ${err.message || 'Erreur inconnue'}`;
      this.loading = false;
    }
  }
  
  // Method to process tickets array
  private processTicketsArray(tickets: any[], chefProjetId: string | number) {
    console.log(`[ChefProjet] 📊 Processing ${tickets.length} tickets for chef projet ID ${chefProjetId}`);
    
    try {
      // Log first ticket for debugging
      if (tickets.length > 0) {
        console.log('[ChefProjet] 📋 Sample ticket format:', JSON.stringify(tickets[0]));
      }

      // Make a deep copy to avoid modifying the original data
      const processedTickets = tickets.map(ticket => {
        // Create a copy of the ticket
        const processedTicket = { ...ticket };
        
        // Normalize status field - handle both uppercase constants and normal text status
        if (processedTicket.status) {
          processedTicket.status = this.normalizeStatus(processedTicket.status);
        }
        
        // Ensure dates are in the correct format
        if (processedTicket.createdDate) {
          processedTicket.createdDate = new Date(processedTicket.createdDate);
        }
        
        if (processedTicket.updatedAt) {
          processedTicket.updatedAt = new Date(processedTicket.updatedAt);
        }
        
        return processedTicket;
      });
      
      console.log(`[ChefProjet] ✅ Successfully processed ${processedTickets.length} tickets`);
      
      // Update UI values
      this.tickets = processedTickets;
      this.filteredTickets = [...processedTickets];
      this.loading = false;
      this.extractFilterOptions();
      this.sortTickets();
      
      return processedTickets;
    } catch (error: any) {
      console.error('[ChefProjet] ❌ Error processing tickets:', error);
      this.error = 'Erreur lors du traitement des tickets: ' + (error.message || 'Erreur inconnue');
      this.loading = false;
      return [];
    }
  }

  // Method to normalize status values from different API formats
  private normalizeStatus(status: string): string {
    if (!status) return 'OPEN';
    
    // Convert to uppercase for consistent comparison
    const upperStatus = status.toUpperCase();
    
    // Map from API status to display status
    const statusMap: {[key: string]: string} = {
      'OPEN': 'OPEN',
      'UNRESOLVED': 'UNRESOLVED',
      'NON RÉSOLU': 'UNRESOLVED',
      'NON RESOLU': 'UNRESOLVED',
      'IN_PROGRESS': 'IN_PROGRESS',
      'EN COURS': 'IN_PROGRESS',
      'RESOLVED': 'RESOLVED',
      'RÉSOLU': 'RESOLVED',
      'RESOLU': 'RESOLVED',
      'CLOSED': 'CLOSED',
      'FERMÉ': 'CLOSED',
      'FERME': 'CLOSED',
      'REFUSED': 'REFUSED',
      'REFUSÉ': 'REFUSED',
      'REFUSE': 'REFUSED',
      'ACCEPTED': 'ACCEPTED',
      'ACCEPTÉ': 'ACCEPTED',
      'ACCEPTE': 'ACCEPTED',
      'ASSIGNED': 'ASSIGNED',
      'ASSIGNÉ': 'ASSIGNED',
      'ASSIGNE': 'ASSIGNED',
    };
    
    // Check for direct mapping
    if (statusMap[upperStatus]) {
      console.log(`[ChefProjet] 🏷️ Normalized status from "${status}" to "${statusMap[upperStatus]}"`);
      return statusMap[upperStatus];
    }
    
    // Check for partial matching (fallback)
    if (upperStatus.includes('RESOLV') || upperStatus.includes('RÉSOLU') || upperStatus.includes('RESOLU')) {
      return 'RESOLVED';
    }
    
    if (upperStatus.includes('UNRESOLV') || upperStatus.includes('NON RÉSOLU') || upperStatus.includes('NON RESOLU')) {
      return 'UNRESOLVED';
    }
    
    if (upperStatus.includes('PROGRESS') || upperStatus.includes('COURS')) {
      return 'IN_PROGRESS';
    }
    
    if (upperStatus.includes('REFUS')) {
      return 'REFUSED'; 
    }
    
    if (upperStatus.includes('ACCEPT')) {
      return 'ACCEPTED';
    }
    
    if (upperStatus.includes('ASSIGN')) {
      return 'ASSIGNED';
    }
    
    // If no matching found, return as-is
    console.warn(`[ChefProjet] ⚠️ Unknown status format: "${status}", using as-is`);
    return status;
  }

  // Accept a ticket with improved error handling
  async acceptTicket(ticketId: number) {
    try {
      console.log(`[ChefProjet] Accepting ticket ${ticketId}`);
      
      // Find the ticket in our arrays
      const ticket = this.tickets.find(t => t.id === ticketId);
      if (!ticket) {
        console.error(`[ChefProjet] Cannot find ticket with id ${ticketId}`);
        return;
      }
      
      // Update UI immediately for better UX
      console.log(`[ChefProjet] Original ticket status: "${ticket.status}"`);
      
      // Get the right index from all arrays
      const ticketIndex = this.tickets.findIndex(t => t.id === ticketId);
      const filteredIndex = this.filteredTickets.findIndex(t => t.id === ticketId);
      
      // Create the updated ticket with explicit status that will match the template conditions
      const updatedTicket = { 
        ...ticket, 
        status: this.STATUS.ACCEPTED // This should be 'Accepté'
      };
      
      console.log(`[ChefProjet] Setting ticket status to: "${updatedTicket.status}"`);
      
      // Update in both arrays
      if (ticketIndex !== -1) {
        this.tickets[ticketIndex] = updatedTicket;
      }
      if (filteredIndex !== -1) {
        this.filteredTickets[filteredIndex] = updatedTicket;
      }
      
      // Log all statuses in filtered tickets to help with debugging
      console.log('[ChefProjet] Tickets statuses after update:');
      this.filteredTickets.forEach(t => {
        if (t.id === ticketId) {
          console.log(`Ticket #${t.id}: Status = "${t.status}" (isTicketAccepted: ${this.isTicketAccepted(t)})`);
        }
      });
      
      // Force change detection to update UI
      this.zone.run(() => {});
      
      // Call ticket service
      const acceptedTicket = await lastValueFrom(this.ticketService.acceptTicket(ticketId));
      console.log(`[ChefProjet] Successfully accepted ticket ${ticketId}:`, acceptedTicket);
      
      // Show success message
      this.snackBar.open('Ticket accepté avec succès', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    } catch (error) {
      console.error('[ChefProjet] Error accepting ticket:', error);
      // Revert changes on error
      this.ngOnInit();
      this.snackBar.open('Erreur lors de l\'acceptation du ticket', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  // Add a helper method to check if a ticket is in Accepted status with better case handling
  isTicketAccepted(ticket: Ticket): boolean {
    if (!ticket || !ticket.status) return false;
    
    // Normalize the status to handle all possible variations
    const normalizedStatus = ticket.status.trim().toLowerCase();
    
    // Check against all possible variations of "Accepted" status
    return normalizedStatus === 'accepté' || 
           normalizedStatus === 'accepted' || 
           normalizedStatus === 'accepte' || 
           normalizedStatus === this.STATUS.ACCEPTED.toLowerCase();
  }

  // Helper method to check if a ticket can be assigned
  canAssignTicket(ticket: Ticket): boolean {
    if (!ticket || !ticket.status) return false;
    
    const status = ticket.status.trim().toLowerCase();
    return this.isTicketAccepted(ticket) && 
           status !== 'assigné' && 
           status !== 'assigned' &&
           status !== 'résolu' &&
           status !== 'resolved' &&
           status !== 'refusé' &&
           status !== 'refused';
  }

  openRefuseDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ChefProjetRefuseDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.handleRefuseTicket(ticket.id, result.report);
      }
    });
  }

  async handleRefuseTicket(ticketId: number, report: string) {
    try {
      console.log(`Attempting to refuse ticket #${ticketId} with report: "${report.substring(0, 50)}..."`);
      
      // Update UI immediately
      const updatedTicket = { 
        ...this.tickets.find(t => t.id === ticketId)!,
        status: this.STATUS.REFUSED,
        report: report
      };
      
      // Update both arrays
      this.tickets = this.tickets.map(ticket =>
        ticket.id === ticketId ? updatedTicket : ticket
      );
      this.filteredTickets = this.filteredTickets.map(ticket =>
        ticket.id === ticketId ? updatedTicket : ticket
      );
      
      // Call service
      const result = await lastValueFrom(this.ticketService.refuseTicket(ticketId, report));
      console.log('API response from ticket update:', result);
      
      // Show success message
      this.snackBar.open('Ticket refusé avec succès', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    } catch (error) {
      console.error('Error refusing ticket:', error);
      // Revert changes on error
      this.ngOnInit();
      this.snackBar.open('Erreur lors du refus du ticket', 'Fermer', {
        duration: 3000,
        horizontalPosition: 'end',
        verticalPosition: 'top'
      });
    }
  }

  openAssignDialog(ticket: Ticket): void {
    // Double-check the ticket status before opening the dialog
    if (ticket.status?.toLowerCase() !== 'accepté' && ticket.status?.toLowerCase() !== 'accepted') {
      console.warn('Impossible d\'assigner un ticket qui n\'est pas dans le statut "Accepté"', ticket);
      this.snackBar.open('Ce ticket ne peut pas être assigné dans son état actuel', 'Fermer', {
        duration: 3000,
      });
      return;
    }

    // Check if the ticket is already assigned
    if (ticket.status?.toLowerCase() === 'assigné' || ticket.status?.toLowerCase() === 'assigned') {
      console.warn('Ce ticket est déjà assigné à un collaborateur', ticket);
      this.snackBar.open('Ce ticket est déjà assigné à un collaborateur', 'Fermer', {
        duration: 3000,
      });
      return;
    }

    const dialogRef = this.dialog.open(ChefAssignUserDialogComponent, {
      width: '500px',
      data: { ticket },
    });

    dialogRef.afterClosed().subscribe((selectedUser) => {
      if (selectedUser) {
        this.assignTicket(ticket, selectedUser.id);
      }
    });
  }

  async assignTicket(ticket: Ticket, collaborateurId: number) {
    try {
      // Update UI immediately for better UX
      const optimisticUpdate = {
        ...ticket,
        status: TICKET_STATUS.ASSIGNED,
        assignedToId: collaborateurId,
        assignedTo: {
          id: collaborateurId,
          name: 'Collaborateur',
          lastName: '',
          email: '',
          countryId: 0,
          roleId: 0,
          roles: []
        }
      };

      // Update both arrays immediately
      this.tickets = this.tickets.map(t => 
        t.id === ticket.id ? optimisticUpdate : t
      );
      this.filteredTickets = this.filteredTickets.map(t => 
        t.id === ticket.id ? optimisticUpdate : t
      );

      // Make the API call in the background
      this.ticketService.assignTicket(ticket.id, collaborateurId).pipe(
        switchMap(updatedTicket => 
          this.ticketService.updateTicketStatus(ticket.id, TICKET_STATUS.ASSIGNED)
        )
      ).subscribe({
        next: (finalTicket) => {
          // Update with actual data from server
          const serverUpdate = {
            ...ticket,
            status: TICKET_STATUS.ASSIGNED,
            assignedToId: collaborateurId,
            assignedTo: finalTicket?.assignedTo || optimisticUpdate.assignedTo
          };

          this.tickets = this.tickets.map(t => 
            t.id === ticket.id ? serverUpdate : t
          );
          this.filteredTickets = this.filteredTickets.map(t => 
            t.id === ticket.id ? serverUpdate : t
          );

          this.snackBar.open('Ticket assigné avec succès', 'Fermer', {
            duration: 3000,
          });
        },
        error: (error) => {
          console.error('Error in background update:', error);
          // Revert optimistic update on error
          this.tickets = this.tickets.map(t => 
            t.id === ticket.id ? ticket : t
          );
          this.filteredTickets = this.filteredTickets.map(t => 
            t.id === ticket.id ? ticket : t
          );

          this.snackBar.open('Erreur lors de l\'assignation du ticket', 'Fermer', {
            duration: 5000,
            panelClass: ['error-snackbar']
          });
        }
      });
      
    } catch (error) {
      console.error('Error in assignment process:', error);
      this.snackBar.open('Erreur lors de l\'assignation du ticket', 'Fermer', {
        duration: 5000,
        panelClass: ['error-snackbar']
      });
    }
  }

  // Extract filter options for export dialog
  private extractFilterOptions(): void {
    try {
      console.log('[ChefProjet] Extracting filter options from', this.tickets.length, 'tickets');
      
      // Guard against empty tickets array
      if (!this.tickets || this.tickets.length === 0) {
        console.log('[ChefProjet] No tickets available to extract filters from');
        this.projects = [];
        this.statuses = [];
        this.priorities = [];
        return;
      }
      
      // Extract unique projects with safety checks
      this.projects = this.extractUniqueObjects(
        this.tickets
          .filter(ticket => ticket && typeof ticket === 'object')
          .map(ticket => ticket.project)
          .filter(project => project && typeof project === 'object' && project.id)
      );

      // Extract unique statuses with safety checks
      this.statuses = this.extractUniqueStrings(
        this.tickets
          .filter(ticket => ticket && typeof ticket === 'object')
          .map(ticket => ticket.status)
          .filter((status): status is string => !!status && typeof status === 'string')
      );

      // Extract unique priorities with safety checks
      this.priorities = this.extractUniqueStrings(
        this.tickets
          .filter(ticket => ticket && typeof ticket === 'object')
          .map(ticket => ticket.priority)
          .filter((priority): priority is string => !!priority && typeof priority === 'string')
      );

      console.log('[ChefProjet] Extracted filter options:', {
        projects: this.projects.length,
        statuses: this.statuses,
        priorities: this.priorities
      });
    } catch (error) {
      console.error('[ChefProjet] Error extracting filter options:', error);
      // Set default values to prevent further errors
      this.projects = [];
      this.statuses = [];
      this.priorities = [];
    }
  }

  private extractUniqueObjects(objects: any[]): any[] {
    const uniqueMap = new Map();
    
    objects.forEach(obj => {
      if (obj && obj.id) {
        uniqueMap.set(obj.id, obj);
      }
    });
    
    return Array.from(uniqueMap.values());
  }

  private extractUniqueStrings(strings: string[]): string[] {
    return [...new Set(strings)];
  }

  // Open export dialog
  openExportDialog(): void {
    const dialogRef = this.dialog.open(ChefProjetExportDialogComponent, {
      width: '500px',
      data: {
        projects: this.projects,
        statuses: this.statuses,
        priorities: this.priorities
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.exportTickets(result);
      }
    });
  }

  // Export tickets based on filter options
  private exportTickets(filterOptions: any): void {
    let filteredTickets: Ticket[] = [];
    let fileName = 'tickets-chef-projet';

    // Apply filters
    if (filterOptions.filterType === 'all') {
      filteredTickets = [...this.tickets];
    } else if (filterOptions.filterType === 'project' && filterOptions.projectId) {
      filteredTickets = this.tickets.filter(
        t => t.project && t.project.id === filterOptions.projectId
      );
      const projectName = this.projects.find(
        p => p.id === filterOptions.projectId
      )?.name || 'projet';
      fileName = `tickets-${projectName}`;
    } else if (filterOptions.filterType === 'status' && filterOptions.status) {
      filteredTickets = this.tickets.filter(
        t => t.status === filterOptions.status
      );
      fileName = `tickets-${filterOptions.status}`;
    } else if (filterOptions.filterType === 'priority' && filterOptions.priority) {
      filteredTickets = this.tickets.filter(
        t => t.priority === filterOptions.priority
      );
      fileName = `tickets-priorite-${filterOptions.priority}`;
    }

    // Export to Excel if we have tickets
    if (filteredTickets.length > 0) {
      this.excelService.exportToExcel(filteredTickets, fileName);
      this.snackBar.open('Export Excel réussi', 'Fermer', { duration: 3000 });
    } else {
      this.snackBar.open('Aucun ticket à exporter', 'Fermer', {
        duration: 3000,
      });
    }
  }

  // Search functionality
  applySearch(): void {
    if (!this.searchTerm || this.searchTerm.trim() === '') {
      this.filteredTickets = [...this.tickets];
    } else {
      const searchTermLower = this.searchTerm.toLowerCase().trim();
      this.filteredTickets = this.tickets.filter(ticket => 
        (ticket.title && ticket.title.toLowerCase().includes(searchTermLower)) ||
        (ticket.description && ticket.description.toLowerCase().includes(searchTermLower)) ||
        (ticket.project?.name && ticket.project.name.toLowerCase().includes(searchTermLower))
      );
    }
    
    // Re-apply current sorting
    this.sortTickets();
  }
  
  // Clear search
  clearSearch(): void {
    this.searchTerm = '';
    this.filteredTickets = [...this.tickets];
    this.sortTickets();
  }
  
  // Sort functionality
  applySort(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const value = selectElement.value;
    
    console.log('[ChefProjet] Applying sort with value:', value);
    
    if (this.isValidSortCriteria(value)) {
      this.sortCriteria = value;
      this.sortTickets();
      
      // Debug after sorting
      console.log('[ChefProjet] After sorting, first 3 tickets:');
      this.filteredTickets.slice(0, 3).forEach(ticket => {
        console.log(`Ticket #${ticket.id}, createdAt: ${ticket.createdAt}, parsed timestamp: ${this.parseTicketDate(ticket)}`);
      });
    }
  }
  
  // Check if sort criteria is valid
  private isValidSortCriteria(
    value: string
  ): value is 'newest' | 'oldest' | 'status' | 'title' | 'priority' {
    return ['newest', 'oldest', 'status', 'title', 'priority'].includes(value);
  }
  
  // Sort tickets based on criteria
  sortTickets(): void {
    try {
      console.log('[ChefProjet] Sorting tickets with criteria:', this.sortCriteria);
      
      // Ensure we have filteredTickets to sort
      if (!this.filteredTickets || this.filteredTickets.length === 0) {
        console.log('[ChefProjet] No filteredTickets to sort');
        return;
      }
      
      // Create a safe copy to avoid modifying the original array during sorting
      let tempTickets = [...this.filteredTickets];
      
      switch (this.sortCriteria) {
        case 'newest':
          tempTickets.sort((a, b) => {
            try {
              const dateA = this.parseTicketDate(a);
              const dateB = this.parseTicketDate(b);
              return dateB - dateA; // newest first
            } catch (error) {
              console.error('[ChefProjet] Error comparing dates for tickets:', a.id, b.id, error);
              return 0; // Keep original order in case of error
            }
          });
          break;
        case 'oldest':
          tempTickets.sort((a, b) => {
            try {
              const dateA = this.parseTicketDate(a);
              const dateB = this.parseTicketDate(b);
              return dateA - dateB; // oldest first
            } catch (error) {
              console.error('[ChefProjet] Error comparing dates for tickets:', a.id, b.id, error);
              return 0; // Keep original order in case of error
            }
          });
          break;
        case 'status':
          tempTickets.sort((a, b) => {
            try {
              const statusA = a?.status || '';
              const statusB = b?.status || '';
              return statusA.localeCompare(statusB);
            } catch (error) {
              console.error('[ChefProjet] Error comparing statuses for tickets:', a.id, b.id, error);
              return 0; // Keep original order in case of error
            }
          });
          break;
        case 'title':
          tempTickets.sort((a, b) => {
            try {
              const titleA = a?.title || '';
              const titleB = b?.title || '';
              return titleA.localeCompare(titleB);
            } catch (error) {
              console.error('[ChefProjet] Error comparing titles for tickets:', a.id, b.id, error);
              return 0; // Keep original order in case of error
            }
          });
          break;
        case 'priority':
          // Custom priority sorting: High > Medium > Low
          tempTickets.sort((a, b) => {
            try {
              const priorityOrder: { [key: string]: number } = {
                'Haute': 1,
                'Moyenne': 2,
                'Basse': 3,
              };
              
              const orderA = priorityOrder[a?.priority || ''] || 999;
              const orderB = priorityOrder[b?.priority || ''] || 999;
              
              return orderA - orderB;
            } catch (error) {
              console.error('[ChefProjet] Error comparing priorities for tickets:', a.id, b.id, error);
              return 0; // Keep original order in case of error
            }
          });
          break;
      }
      
      // Update the filteredTickets array with our sorted copy
      this.filteredTickets = tempTickets;
      console.log('[ChefProjet] Finished sorting', this.filteredTickets.length, 'tickets');
      
    } catch (error) {
      console.error('[ChefProjet] Error in sortTickets method:', error);
      // Don't modify filteredTickets if an error occurs to prevent data loss
    }
  }

  // Helper method to parse dates consistently
  private parseTicketDate(ticket: Ticket): number {
    try {
      // Safety check for null/undefined ticket
      if (!ticket) {
        console.warn('[Date Parsing] Received null or undefined ticket');
        return 0;
      }
      
      // Safety check for ticket not being an object
      if (typeof ticket !== 'object') {
        console.warn(`[Date Parsing] Ticket is not an object: ${typeof ticket}`);
        return 0;
      }
      
      // Try different date fields
      const dateStr = ticket.createdAt || 
                     (ticket as any).createdDate || 
                     (ticket as any).creationDate ||
                     (ticket as any).created ||
                     (ticket as any).dateCreated;
      
      if (!dateStr) {
        console.warn(`[Date Parsing] Ticket ${ticket.id || 'unknown'} has no date field, defaulting to 0`);
        return 0; // Default to oldest possible date (timestamp 0)
      }
      
      // Handle numeric timestamps directly
      if (typeof dateStr === 'number') {
        return dateStr > 946684800000 ? dateStr : 0; // Sanity check for valid dates (after year 2000)
      }
      
      // Attempt to parse the date string
      const timestamp = new Date(dateStr).getTime();
      
      // If we get NaN, try alternative parsing approaches
      if (isNaN(timestamp)) {
        console.warn(`[Date Parsing] Failed to parse date ${dateStr} for ticket ${ticket.id || 'unknown'}`);
        
        // Try to detect and parse common date formats
        if (typeof dateStr === 'string') {
          // Try DD/MM/YYYY format
          if (/^\d{2}\/\d{2}\/\d{4}/.test(dateStr)) {
            const parts = dateStr.split('/');
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JavaScript months are 0-indexed
            const year = parseInt(parts[2]);
            const altTimestamp = new Date(year, month, day).getTime();
            if (!isNaN(altTimestamp)) {
              return altTimestamp;
            }
          }
          
          // Try to extract timestamp if the string contains a number that could be a timestamp
          const possibleTimestamp = parseInt(dateStr);
          if (!isNaN(possibleTimestamp) && possibleTimestamp > 1000000000000) { // Sanity check for millisecond timestamps
            return possibleTimestamp;
          }
        }
        
        // Last resort: use ticket ID as a proxy for creation order (assuming higher IDs are newer)
        if (ticket.id) {
          console.warn(`[Date Parsing] Using ticket ID ${ticket.id} as fallback for sorting`);
          return typeof ticket.id === 'number' ? ticket.id : Number(ticket.id);
        }
        
        return 0; // Default to oldest possible date if all else fails
      }
      
      return timestamp;
    } catch (error) {
      console.error(`[Date Parsing] Error parsing date for ticket:`, error);
      return 0; // Default to oldest possible date on error
    }
  }

  // Method to open the comment dialog to add/view comments
  openCommentDialog(ticket: Ticket): void {
    // Get the current user ID for the comment
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    
    // Open the comment dialog
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'comment-dialog-container',
      data: {
        ticket: ticket,
        ticketId: ticket.id,
        currentUserId: currentUserId,
        isAdmin: false,
        isChefProjet: true
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result && result.updated) {
        // Refresh tickets to show the updated comment
        this.ngOnInit();
        
        // Show success message
        this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
          duration: 3000,
          horizontalPosition: 'center',
          verticalPosition: 'bottom'
        });
      }
    });
  }

  // Diagnostic method to directly test the API connection
  async runApiDiagnostic() {
    console.log('[ChefProjet] 🔧 Starting API diagnostic test');
    this.error = 'Diagnostic en cours...';
    
    try {
      // First check token
      const token = localStorage.getItem('token');
      if (!token) {
        this.error = 'Erreur de diagnostic: Token d\'authentification manquant. Veuillez vous reconnecter.';
        return;
      }
      
      // Try to get current user
      const currentUser = await lastValueFrom(this.authService.getCurrentUser());
      
      if (!currentUser || !currentUser.id) {
        console.error('[ChefProjet] ❌ Cannot run diagnostic: User not found or ID is missing');
        this.error = 'Erreur de diagnostic: Utilisateur non trouvé ou ID manquant.';
        return;
      }
      
      const chefProjetId = currentUser.id;
      // Store the user ID for display in the debug section
      this.currentUserId = chefProjetId;
      console.log(`[ChefProjet] 🔧 Running diagnostic for chef projet ID: ${chefProjetId}`);
      
      // Test multiple possible API endpoints
      const endpoints = [
        `${environment.apiUrl}/tickets/chef-projet/${chefProjetId}`,  // Format 1
        `${environment.apiUrl}/chef-projet/${chefProjetId}`,         // Format 2
        `${environment.apiUrl}/tickets/project-manager/${chefProjetId}`, // Format 3
        `${environment.apiUrl}/tickets/by-user-role/chef-projet/${chefProjetId}` // Format 4
      ];
      
      // Get the headers from service if possible
      const headers = new HttpHeaders({
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      });
      
      // Use Angular's HttpClient directly
      const http = this.ticketService['http']; // Access the private http property
      if (!http) {
        this.error = 'Erreur: Impossible d\'accéder au client HTTP';
        return;
      }
      
      // Try first with a ping/simple OPTIONS request to check if server is reachable
      try {
        this.error = 'Diagnostic en cours... Vérification de la disponibilité du serveur...';
        await lastValueFrom(
          http.options(environment.apiUrl, { 
            headers,
            responseType: 'text'
          }).pipe(timeout(5000))
        );
        console.log(`[ChefProjet] 🔧 Server is reachable at ${environment.apiUrl}`);
      } catch (pingError: any) {
        console.error(`[ChefProjet] 🔧 Server ping failed:`, pingError);
        this.error = `❌ Erreur de connexion au serveur: ${environment.apiUrl}. ${pingError.message || 'Serveur injoignable'}.
          Vérifiez que le serveur backend est démarré et accessible.`;
        return;
      }
      
      // Now try each endpoint systematically to find the working one
      for (let i = 0; i < endpoints.length; i++) {
        const endpoint = endpoints[i];
        this.error = `Diagnostic en cours... Test de l'endpoint ${i+1}/${endpoints.length}: ${endpoint}`;
        console.log(`[ChefProjet] 🔧 Testing endpoint ${i+1}/${endpoints.length}: ${endpoint}`);
        
        try {
          // Call API endpoint
          const response = await lastValueFrom(
            http.get(endpoint, { 
              headers, 
              observe: 'response' 
            }).pipe(
              timeout(8000),
              tap(resp => {
                console.log(`[ChefProjet] 🔧 Endpoint ${i+1} HTTP response status: ${resp.status}`);
                if (resp.body) {
                  console.log(`[ChefProjet] 🔧 Response body type: ${typeof resp.body}, Is array: ${Array.isArray(resp.body)}`);
                  if (Array.isArray(resp.body)) {
                    console.log(`[ChefProjet] 🔧 Response contains ${resp.body.length} tickets`);
                  }
                }
              }),
              map(resp => resp.body)
            )
          );
          
          console.log(`[ChefProjet] 🔧 Endpoint ${i+1} successful:`, response);
          const ticketCount = Array.isArray(response) ? response.length : 0;
          
          // We found a working endpoint!
          this.error = `✅ Diagnostic réussi avec l'endpoint ${i+1}: ${endpoint}. 
            ${ticketCount} ticket(s) trouvé(s) pour l'utilisateur #${chefProjetId}.
            Rechargement des tickets en cours...`;
          
          // Save the working endpoint to localStorage to use it in the future
          localStorage.setItem('working_tickets_endpoint', endpoint);
          console.log(`[ChefProjet] 🔧 Saved working endpoint to localStorage: ${endpoint}`);
          
          // If diagnostic succeeded, try loading tickets again after a short delay
          setTimeout(() => {
            this.loadTickets();
          }, 2000);
          
          return; // Exit the function as we found a working endpoint
          
        } catch (endpointError: any) {
          console.error(`[ChefProjet] 🔧 Endpoint ${i+1} failed:`, endpointError);
          // Continue to the next endpoint
        }
      }
      
      // If we reach here, all endpoints failed
      console.error('[ChefProjet] 🔧 All API endpoints failed');
      this.error = `❌ Tous les endpoints API ont échoué. Vérifiez que:
        1. Le serveur backend est en cours d'exécution
        2. Votre token d'authentification est valide
        3. L'utilisateur a le rôle "Chef Projet" correctement configuré
        4. Le serveur est accessible sur ${environment.apiUrl}`;
      
    } catch (error: any) {
      console.error('[ChefProjet] 🔧 Diagnostic failed:', error);
      
      // Provide more detailed error messages based on error type
      if (error.status === 0) {
        this.error = `❌ Erreur de connexion: Le serveur API n'est pas accessible. Vérifiez que le serveur backend est en cours d'exécution sur http://localhost:5000.`;
      } else if (error.status === 401) {
        this.error = `❌ Erreur d'authentification: Token invalide ou expiré. Essayez de vous reconnecter.`;
      } else if (error.status === 403) {
        this.error = `❌ Accès refusé: Vous n'avez pas les permissions pour accéder à cette ressource.`;
      } else if (error.status === 404) {
        this.error = `❌ Endpoint non trouvé: L'API "${environment.apiUrl}/tickets/chef-projet/${this.currentUserId}" n'existe pas.`;
      } else if (error.status >= 500) {
        this.error = `❌ Erreur serveur: Le serveur a rencontré une erreur (${error.status}). Vérifiez les logs du serveur.`;
      } else {
        this.error = `❌ Erreur de diagnostic: ${error.message || 'Erreur inconnue'}`;
      }
    }
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}