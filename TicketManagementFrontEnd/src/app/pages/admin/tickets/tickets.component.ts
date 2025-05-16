import {
  Component,
  OnInit,
  ElementRef,
  Renderer2,
  OnDestroy,
  HostListener,
  ChangeDetectorRef,
  ViewEncapsulation,
  ViewChildren,
  QueryList,
  AfterViewInit,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { ExcelService } from '../../../services/excel.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { DescriptionDialogComponent } from '../../../components/description-dialog/description-dialog.component';
import { CommentDialogComponent } from './comment-dialog.component';
import { ExportDialogComponent } from './export-dialog.component';
import { EditTicketDialogComponent } from '../../../components/AdminComponents/edit-ticket-dialog.component/edit-ticket-dialog.component';
import { AssignUserDialogComponent } from '../../../components/AdminComponents/assign-user-dialog.component/assign-user-dialog.component';
import { RefuseDialogComponent } from '../../../components/AdminComponents/refuse-dialog.component/refuse-dialog.component';
import { MatTableModule } from '@angular/material/table';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';
import { MatTooltipModule } from '@angular/material/tooltip';
import { lastValueFrom, Subject, takeUntil, tap, catchError, EMPTY } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { Router } from '@angular/router';
import { animate, style, transition, trigger } from '@angular/animations';
import { NotificationService } from '../../../services/notification.service';
import { ConfirmationDialogComponent } from '../../../components/confirmation-dialog/confirmation-dialog.component';
import { TicketDetailsDialogComponent } from '../../../components/ticket-details-dialog/ticket-details-dialog.component';

/**
 * Admin Tickets Component that displays and manages all tickets.
 * This component uses a reactive pattern with the TicketService to
 * automatically update when ticket changes occur without requiring
 * manual refreshes.
 */
@Component({
  selector: 'app-tickets',
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatTooltipModule,
    FormsModule,
    MatDialogModule,
    MatSnackBarModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.4s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
    trigger('fadeInList', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate(
          '0.5s ease-out',
          style({ opacity: 1, transform: 'translateY(0)' })
        ),
      ]),
    ]),
  ],
  encapsulation: ViewEncapsulation.None
})
export class TicketsComponent implements OnInit, OnDestroy, AfterViewInit {
  tickets: Ticket[] = [];
  filteredTickets: Ticket[] = [];
  allTickets: Ticket[] = [];
  isLoading = false;
  selectedTicket: Ticket | null = null;
  sortCriteria: 'newest' | 'oldest' | 'status' | 'title' | 'priority' =
    'newest';
  searchTerm = '';

  // Lists for filtering
  projects: any[] = [];
  problemCategories: any[] = [];
  statuses: string[] = [];
  priorities: string[] = [];

  openActionMenuId: number | null = null;
  sortDirection = 'desc';
  activeRow: number | null = null;
  private destroy$ = new Subject<void>();

  // Add properties and decorators for menu handling
  @ViewChildren(MatMenuTrigger) menuTriggers!: QueryList<MatMenuTrigger>;

  constructor(
    private ticketService: TicketService,
    private excelService: ExcelService,
    public dialog: MatDialog,
    private snackBar: MatSnackBar,
    private renderer: Renderer2,
    private el: ElementRef,
    private userService: UserService,
    private router: Router,
    private changeDetectorRef: ChangeDetectorRef,
    private notificationService: NotificationService
  ) {}

  ngOnInit() {
    this.loadTickets();
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // Lifecycle hook for menu handling
  ngAfterViewInit() {
    // No special handling needed here, Angular Material handles this
  }

  loadTickets() {
    console.log('[Admin Tickets] Loading tickets');
    this.isLoading = true;

    // Clean up subscription to avoid memory leaks
    this.destroy$.next();

    // First, get locally stored ticket statuses
    const cachedTicketStatuses = this.getLocallyAcceptedTickets();
    console.log(`[Admin Tickets] Found ${Object.keys(cachedTicketStatuses).length} locally stored ticket statuses`);

    this.ticketService
      .getAllTickets()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (tickets) => {
          console.log(`[Admin Tickets] Loaded ${tickets.length} tickets from API`);
          
          // Apply additional filtering or processing of tickets here if needed
          this.allTickets = tickets.map(ticket => {
            // Make sure the createdAt field is properly set
            // Backend may use CreatedDate or createdDate instead of createdAt
            if (!ticket.createdAt && (ticket as any).createdDate) {
              ticket.createdAt = (ticket as any).createdDate;
              console.log(`[Admin Tickets] Mapped createdDate to createdAt for ticket ${ticket.id}`);
            } else if (!ticket.createdAt && (ticket as any).CreatedDate) {
              ticket.createdAt = (ticket as any).CreatedDate;
              console.log(`[Admin Tickets] Mapped CreatedDate to createdAt for ticket ${ticket.id}`);
            }
            
            // First check if there's a local cached status override
            const ticketIdStr = String(ticket.id);
            const localStatus = cachedTicketStatuses[ticketIdStr];
            if (localStatus) {
              console.log(`[Admin Tickets] Using locally stored status for ticket ${ticket.id}: '${localStatus}' (was: '${ticket.status}')`);
              ticket.status = localStatus;
              return ticket;
            }
            
            // Explicitly normalize status values for consistent case and whitespace
            if (!ticket.status) {
              ticket.status = 'Ouvert'; // Default to open if no status
              console.log(`[Admin Tickets] No status for ticket ${ticket.id}, setting default: 'Ouvert'`);
            } else {
              const normalizedStatus = this.normalizeStatus(ticket.status);
              if (normalizedStatus !== ticket.status) {
                console.log(`[Admin Tickets] Normalized ticket ${ticket.id} status from '${ticket.status}' to '${normalizedStatus}'`);
                ticket.status = normalizedStatus;
              }
            }

            return ticket;
          });
          
          // Log the status of each ticket to debug visibility issues
          console.log('[Admin Tickets] Status of all tickets after processing:');
          this.allTickets.forEach(ticket => {
            console.log(`Ticket #${ticket.id}: Status = '${ticket.status}'`);
          });
          
          // Check if we have any tickets without a createdAt date after mapping
          const missingDates = this.allTickets.filter(t => !t.createdAt).length;
          if (missingDates > 0) {
            console.warn(`[Admin Tickets] Found ${missingDates} tickets without a creation date after mapping`);
          }
          
          this.isLoading = false;
          this.extractFilterOptions(this.allTickets);
          this.filteredTickets = [...this.allTickets];
          this.applySearch();
          this.sortTickets();
          this.changeDetectorRef.detectChanges();
          console.log('[Admin Tickets] Tickets loaded and rendered with normalized statuses');
        },
        error: (error) => {
          console.error('[Admin Tickets] Error loading tickets:', error);
          this.isLoading = false;
          this.snackBar.open(
            'Erreur lors du chargement des tickets',
            'Fermer',
            {
              duration: 3000,
            }
          );
        },
      });
  }

  // Helper method to extract locally saved tickets from localStorage
  private getLocallyAcceptedTickets(): {[key: string]: string} {
    const result: {[key: string]: string} = {};
    try {
      // Get locally cached tickets
      const cachedData = localStorage.getItem('cached_tickets');
      if (cachedData) {
        console.log('[Admin Tickets] Found cached_tickets in localStorage');
        try {
          const cachedTickets = JSON.parse(cachedData);
          
          if (Array.isArray(cachedTickets)) {
            // Log all tickets found in cache
            console.log(`[Admin Tickets] Loaded ${cachedTickets.length} cached tickets:`);
            cachedTickets.forEach((ticket: any) => {
              // Ensure ticket has valid id and status
              if (ticket && ticket.id && ticket.status) {
                // Convert ID to string to use as key in result object
                const idStr = String(ticket.id);
                result[idStr] = ticket.status;
                console.log(`[Admin Tickets] Cached ticket #${idStr}: Status = '${ticket.status}'`);
              } else {
                console.warn('[Admin Tickets] Found invalid cached ticket:', ticket);
              }
            });
          } else {
            console.warn('[Admin Tickets] cached_tickets is not an array:', cachedTickets);
          }
        } catch (parseError) {
          console.error('[Admin Tickets] Error parsing cached_tickets:', parseError);
        }
      } else {
        console.log('[Admin Tickets] No cached_tickets found in localStorage');
      }
    } catch (e) {
      console.error('[Admin Tickets] Error reading cached ticket status:', e);
    }
    
    // Log the result
    console.log(`[Admin Tickets] Returning ${Object.keys(result).length} locally stored ticket statuses`);
    return result;
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
      if (!uniqueMap.has(obj.id)) {
        uniqueMap.set(obj.id, obj);
      }
    });
    return Array.from(uniqueMap.values());
  }

  // Helper to extract unique strings
  private extractUniqueStrings(strings: string[]): string[] {
    return [...new Set(strings)];
  }

  formatCreatedDate(dateString: string): string {
    if (!dateString) {
      return 'Date inconnue';
    }
    
    // Attempt to create a date from the input
    const date = new Date(dateString);
    
    // Check if the date is valid
    if (isNaN(date.getTime())) {
      return 'Date invalide';
    }
    
    // Calculate the Tunisia offset (UTC+1) in minutes
    const tunisiaOffsetMinutes = 60; // 1 hour = 60 minutes
    
    // Get the UTC components of the date
    const utcHours = date.getUTCHours();
    const utcMinutes = date.getUTCMinutes();
    
    // Adjust to Tunisia time (UTC+1)
    let tunisiaHours = utcHours + 1; // Add 1 hour for Tunisia
    const tunisiaMinutes = utcMinutes;
    
    // Handle day change if hours overflow
    let day = date.getUTCDate();
    let month = date.getUTCMonth() + 1;
    let year = date.getUTCFullYear();
    
    if (tunisiaHours >= 24) {
      tunisiaHours -= 24;
      // Increment day, handling month and year changes
      const newDate = new Date(Date.UTC(year, month - 1, day + 1));
      day = newDate.getUTCDate();
      month = newDate.getUTCMonth() + 1;
      year = newDate.getUTCFullYear();
    }
    
    // Pad values with leading zeros as needed
    const dayStr = String(day).padStart(2, '0');
    const monthStr = String(month).padStart(2, '0');
    const hoursStr = String(tunisiaHours).padStart(2, '0');
    const minutesStr = String(tunisiaMinutes).padStart(2, '0');
    
    return `${dayStr}/${monthStr}/${year} ${hoursStr}:${minutesStr}`;
  }

  getStatusColor(status?: string): string {
    if (!status) return '#999999';

    const colors: { [key: string]: string } = {
      'En attente': '#f0ad4e',
      Assigné: '#5bc0de',
      ASSIGNED: '#5bc0de',
      'En cours': '#5cb85c',
      Résolu: '#5cb85c',
      Refusé: '#d9534f',
      REFUSED: '#d9534f',
      OPEN: '#337ab7',
      Open: '#337ab7',
      Ouvert: '#337ab7',
      ACCEPTED: '#5bc0de',
      Accepté: '#5bc0de',
    };
    return colors[status] || '#999999';
  }

  showDescription(ticket: Ticket, event?: Event): void {
    console.log('Opening description dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog with position config to center it
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });
  }

  // Helper to normalize ticket status values
  private normalizeStatus(status: string): string {
    if (!status) return 'Ouvert';

    // Trim whitespace and normalize case
    const trimmedStatus = status.trim();
    
    // Convert to standardized format
    const statusMap: { [key: string]: string } = {
      'ASSIGNED': 'Assigné',
      'assigned': 'Assigné',
      'ASSIGNÉ': 'Assigné',
      'assigné': 'Assigné',
      'ACCEPTED': 'Accepté',
      'accepted': 'Accepté',
      'ACCEPTÉ': 'Accepté',
      'accepté': 'Accepté',
      'REFUSED': 'Refusé',
      'refused': 'Refusé',
      'REFUSÉ': 'Refusé',
      'refusé': 'Refusé',
      'OPEN': 'Ouvert',
      'open': 'Ouvert',
      'OUVERT': 'Ouvert',
      'ouvert': 'Ouvert',
      'OPENED': 'Ouvert',
      'opened': 'Ouvert'
    };

    // Log the status normalization for debugging
    console.log(`[Status Normalization] Input: '${status}', Trimmed: '${trimmedStatus}'`);
    
    const normalizedStatus = statusMap[trimmedStatus] || trimmedStatus;
    console.log(`[Status Normalization] Output: '${normalizedStatus}'`);
    
    return normalizedStatus;
  }

  openCommentDialog(ticket: Ticket, event?: Event): void {
    console.log('[TicketsComponent] Opening comment dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog with position config to center it
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        console.log('[TicketsComponent] Comment updated for ticket:', updatedTicket.id);
        
        // Refresh the tickets list to show the updated comment
        this.loadTickets();
        
        // Show confirmation that notification was sent
        this.snackBar.open(
          'Notification envoyée au propriétaire du ticket', 
          'OK', 
          { duration: 5000, panelClass: ['success-snackbar'] }
        );
      }
    });
  }

  openEditDialog(ticket: Ticket): void {
    const dialogRef = this.dialog.open(EditTicketDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        this.ticketService.updateTicket(updatedTicket).subscribe({
          next: (result) => {
            this.snackBar.open('Ticket mis à jour avec succès', 'Fermer', {
              duration: 3000,
            });
          },
          error: (err) => {
            console.error('Error updating ticket:', err);
            this.snackBar.open(
              'Erreur lors de la mise à jour du ticket',
              'Fermer',
              {
                duration: 3000,
              }
            );
          },
        });
      }
    });
  }

  openRefuseDialog(ticket: Ticket, event?: Event): void {
    console.log('Opening refuse dialog for ticket:', ticket.id);

    // Stop event propagation if event is provided
    if (event) {
      event.stopPropagation();
      event.preventDefault();
    }

    // Create the dialog directly and use handleRefuseClick which already has proper UI updates
    this.handleRefuseClick(ticket, event || new Event('custom'));
  }

  // New method for opening the export dialog
  openExportDialog(): void {
    const dialogRef = this.dialog.open(ExportDialogComponent, {
      width: '500px',
      data: {
        projects: this.projects,
        problemCategories: this.problemCategories,
        statuses: this.statuses,
        priorities: this.priorities,
      },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.exportTickets(result);
      }
    });
  }

  // Method to handle the export based on filter selection
  private exportTickets(filterOptions: any): void {
    let filteredTickets: Ticket[] = [];
    let fileName = 'tickets';

    // Filter tickets based on selected criteria
    if (filterOptions.filterType === 'all') {
      filteredTickets = [...this.tickets];
      fileName = 'tous-les-tickets';
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
      fileName = `tickets-${projectName}`;
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
      fileName = `tickets-${categoryName}`;
    } else if (filterOptions.filterType === 'status' && filterOptions.status) {
      filteredTickets = this.tickets.filter(
        (t) => t.status === filterOptions.status
      );
      fileName = `tickets-${filterOptions.status}`;
    } else if (
      filterOptions.filterType === 'priority' &&
      filterOptions.priority
    ) {
      filteredTickets = this.tickets.filter(
        (t) => t.priority === filterOptions.priority
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

  setSortCriteria(criteria: string) {
    if (this.isValidSortCriteria(criteria)) {
      if (this.sortCriteria === criteria) {
        this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortCriteria = criteria;
        this.sortDirection = 'desc';
      }
      this.loadTickets();
    }
  }

  setActiveRow(ticketId: number | null) {
    this.activeRow = ticketId;
  }

  getPriorityClass(priority: string): string {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'priority-high';
      case 'medium':
        return 'priority-medium';
      case 'low':
        return 'priority-low';
      default:
        return '';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'opened':
        return 'bg-blue-500';
      case 'in progress':
        return 'bg-orange-500';
      case 'pending':
        return 'bg-purple-500';
      case 'resolved':
        return 'bg-green-500';
      case 'closed':
        return 'bg-gray-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }

  // Handle description click
  handleDescriptionClick(ticket: Ticket, event: Event): void {
    console.log('Description clicked for ticket:', ticket.id);

    // Stop event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Close all menus first
    this.closeAllMenus();

    // Open dialog with position config to center it
    this.dialog.open(DescriptionDialogComponent, {
      width: '500px',
      data: { ticket },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });
  }

  // Handle comment click
  handleCommentClick(ticket: Ticket, event: Event): void {
    console.log('Comment clicked for ticket:', ticket.id);

    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Close all menus first
    this.closeAllMenus();
    
    // Open dialog with position config to center it
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '600px',
      data: { ticket: { ...ticket } },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((updatedTicket) => {
      if (updatedTicket) {
        console.log('Dialog closed with updated ticket:', updatedTicket.id);
        
        // Refresh the tickets list to reflect changes
        this.loadTickets();
        
        // Show confirmation that comment was added
        this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
          duration: 3000,
          panelClass: ['success-snackbar']
        });
      }
    });
  }

  // Handle assign click
  handleAssignClick(ticket: Ticket, event: Event): void {
    console.log('Assign clicked for ticket:', ticket.id);

    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Close all menus first
    this.closeAllMenus();

    // Store the original ticket state in case we need to revert
    const originalTicket = { ...ticket };
    const ticketId = ticket.id;
    
    // Open dialog with position config
    const dialogRef = this.dialog.open(AssignUserDialogComponent, {
      width: '500px',
      data: { ticket: originalTicket },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((selectedUser) => {
      if (selectedUser) {
        // Prepare user name for display
        const userName = this.getUserDisplayName(selectedUser);
        
        // Find ticket in arrays
        const index = this.tickets.findIndex(t => t.id === ticketId);
        const filteredIndex = this.filteredTickets.findIndex(t => t.id === ticketId);
        const allIndex = this.allTickets.findIndex(t => t.id === ticketId);
        
        // Update UI immediately for responsive feedback
        if (index !== -1) {
          // Create new assigned state with user info
          const assignedState = {
            status: 'Assigné',
            assignedToId: selectedUser.id,
            assignedTo: selectedUser
          };
          
          // Update in main tickets array
          this.tickets[index] = {
            ...this.tickets[index],
            ...assignedState
          };
          
          // Update in filtered tickets array
          if (filteredIndex !== -1) {
            this.filteredTickets[filteredIndex] = {
              ...this.filteredTickets[filteredIndex],
              ...assignedState
            };
          }
          
          // Update in all tickets array
          if (allIndex !== -1) {
            this.allTickets[allIndex] = {
              ...this.allTickets[allIndex],
              ...assignedState
            };
          }
          
          // Persist to localStorage
          this.persistTicketStatusLocally(ticketId, 'Assigné');
          
          // Force UI update
          this.changeDetectorRef.detectChanges();
        }
        
        // Call API to assign the ticket
        this.ticketService.assignTicket(ticketId, selectedUser.id)
          .subscribe({
            next: (updatedTicket) => {
              console.log('Ticket assigned successfully', updatedTicket);
              
              this.snackBar.open(
                `Ticket assigné à ${userName}`, 
                'Fermer', 
                { duration: 3000, panelClass: ['success-snackbar'] }
              );
              
              // Update the ticket directly rather than doing a full reload
              if (index !== -1) {
                // Create merged ticket with updated data
                const mergedTicket = {
                  ...this.tickets[index],
                  ...updatedTicket,
                  status: 'Assigné',
                  assignedToId: selectedUser.id,
                  assignedTo: selectedUser
                };
                
                // Update in all arrays
                this.tickets[index] = mergedTicket;
                
                if (filteredIndex !== -1) {
                  this.filteredTickets[filteredIndex] = mergedTicket;
                }
                
                if (allIndex !== -1) {
                  this.allTickets[allIndex] = mergedTicket;
                }
                
                // Force UI update
                this.changeDetectorRef.detectChanges();
              }
            },
            error: (err) => {
              console.error('Error assigning ticket:', err);
              
              // Revert UI changes on error
              if (index !== -1) {
                // Revert in all arrays
                this.tickets[index] = originalTicket;
                
                if (filteredIndex !== -1) {
                  this.filteredTickets[filteredIndex] = originalTicket;
                }
                
                if (allIndex !== -1) {
                  this.allTickets[allIndex] = originalTicket;
                }
                
                // Revert in localStorage
                this.persistTicketStatusLocally(ticketId, originalTicket.status || 'Accepté');
                
                // Force UI update
                this.changeDetectorRef.detectChanges();
              }
              
              this.snackBar.open(
                'Erreur lors de l\'assignation du ticket', 
                'Fermer', 
                { duration: 3000, panelClass: ['error-snackbar'] }
              );
            }
          });
      }
    });
  }
  
  // Helper function to safely get user display name
  private getUserDisplayName(user: any): string {
    if (!user) return 'utilisateur inconnu';
    
    // Try different user properties in order of preference
    if (user.name && user.lastName) {
      return `${user.name} ${user.lastName}`;
    } else if (user.username) {
      return user.username;
    } else if (user.name) {
      return user.name;
    } else if (user.email) {
      return user.email;
    } else {
      return `utilisateur #${user.id || 'inconnu'}`;
    }
  }

  // Type guard for sort criteria
  private isValidSortCriteria(
    value: string
  ): value is 'newest' | 'oldest' | 'status' | 'title' | 'priority' {
    return ['newest', 'oldest', 'status', 'title', 'priority'].includes(value);
  }

  sortTickets() {
    if (!this.filteredTickets || this.filteredTickets.length === 0) {
      return;
    }

    // Use filteredTickets instead of tickets directly
    switch (this.sortCriteria) {
      case 'newest':
        this.tickets = [...this.filteredTickets].sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
        break;
      case 'oldest':
        this.tickets = [...this.filteredTickets].sort((a, b) => {
          if (!a.createdAt) return 1;
          if (!b.createdAt) return -1;
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        });
        break;
      case 'status':
        this.tickets = [...this.filteredTickets].sort((a, b) => {
          if (!a.status) return 1;
          if (!b.status) return -1;
          return a.status.localeCompare(b.status);
        });
        break;
      case 'title':
        this.tickets = [...this.filteredTickets].sort((a, b) => {
          if (!a.title) return 1;
          if (!b.title) return -1;
          return a.title.localeCompare(b.title);
        });
        break;
      case 'priority':
        const priorityOrder: { [key: string]: number } = {
          Haute: 1,
          Moyenne: 2,
          Basse: 3,
        };
        this.tickets = [...this.filteredTickets].sort((a, b) => {
          const priorityA = priorityOrder[a.priority || 'Basse'] || 999;
          const priorityB = priorityOrder[b.priority || 'Basse'] || 999;
          return priorityA - priorityB;
        });
        break;
      default:
        this.tickets = [...this.filteredTickets];
    }
  }

  applySearch(): void {
    const term = this.searchTerm.trim().toLowerCase();
    
    if (!term) {
      this.filteredTickets = [...this.allTickets];
    } else {
      this.filteredTickets = this.allTickets.filter(ticket => 
        ticket.title?.toLowerCase().includes(term) || 
        ticket.description?.toLowerCase().includes(term) || 
        ticket.project?.name.toLowerCase().includes(term) ||
        ticket.problemCategory?.name.toLowerCase().includes(term) ||
        ticket.status?.toLowerCase().includes(term) ||
        (ticket.assignedTo && 
          `${ticket.assignedTo.name} ${ticket.assignedTo.lastName}`.toLowerCase().includes(term))
      );
    }
    
    this.tickets = this.filteredTickets;
    this.sortTickets();
  }

  clearSearch(): void {
    this.searchTerm = '';
    this.filteredTickets = [...this.allTickets];
    this.tickets = this.filteredTickets;
    this.sortTickets();
  }

  /**
   * Applies sorting when user selects a sorting option
   */
  applySort(event: Event) {
    const target = event.target as HTMLSelectElement;
    const value = target.value;
    // Type guard to ensure value is a valid sortCriteria
    if (this.isValidSortCriteria(value)) {
      this.sortCriteria = value;
      this.sortTickets();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    // Check if click is on a menu item or menu trigger
    const clickedElement = event.target as HTMLElement;
    
    // Don't close if user clicked on a menu item or a menu trigger
    if (clickedElement.closest('.mat-mdc-menu-panel') || 
        clickedElement.closest('button[mat-icon-button]') || 
        clickedElement.closest('button[mat-menu-item]') ||
        clickedElement.closest('.menu-container')) {
      return;
    }
    
    // Close all menus
    this.closeAllMenus();
  }
  
  // Method to open menu with correct positioning
  openActionsMenu(event: MouseEvent, ticket: Ticket, menuTrigger: MatMenuTrigger): void {
    // Prevent event bubbling
    event.preventDefault();
    event.stopPropagation();
    
    // Close any open menus first
    this.closeAllMenus();
    
    // Set the active row
    this.setActiveRow(ticket.id as number);
    
    // Store the ID of the menu that's being opened
    this.openActionMenuId = ticket.id as number;
    
    // Open this specific menu
    if (menuTrigger && !menuTrigger.menuOpen) {
      menuTrigger.openMenu();
      
      // Force the menu to position correctly
      const overlayContainerEl = document.querySelector('.cdk-overlay-container');
      if (overlayContainerEl) {
        this.renderer.setStyle(overlayContainerEl, 'z-index', '99999');
      }
      
      // Force change detection
      this.changeDetectorRef.detectChanges();
    }
  }
  
  // Helper method to close all open menus
  closeAllMenus(): void {
    if (this.menuTriggers) {
      this.menuTriggers.forEach(trigger => {
        if (trigger.menuOpen) {
          trigger.closeMenu();
        }
      });
    }
    this.openActionMenuId = null;
  }

  // Open the ticket details dialog
  openTicketDetailsDialog(ticket: Ticket): void {
    this.dialog.open(TicketDetailsDialogComponent, {
      width: '700px',
      data: { ticket },
      panelClass: 'custom-dialog'
    });
  }

  // Assign an agent to the ticket
  assignAgent(ticket: Ticket): void {
    this.handleAssignClick(ticket, new MouseEvent('click'));
  }

  // Change the ticket status
  changeStatus(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Changer le statut',
        message: 'Choisissez le nouveau statut du ticket',
        buttons: [
          { text: 'Ouvert', value: 'Ouvert' },
          { text: 'Accepté', value: 'Accepté' },
          { text: 'Assigné', value: 'Assigné' },
          { text: 'Refusé', value: 'Refusé' },
          { text: 'Annuler', value: null }
        ]
      },
      position: { top: '50px' }
    });

    dialogRef.afterClosed().subscribe(newStatus => {
      if (newStatus) {
        this.ticketService.updateTicketStatus(ticket.id as number, newStatus).subscribe(
          () => {
            this.snackBar.open(`Statut modifié avec succès à ${newStatus}`, 'Fermer', {
              duration: 3000
            });
            this.loadTickets();
          },
          error => {
            this.snackBar.open('Erreur lors du changement de statut', 'Fermer', {
              duration: 3000
            });
            console.error('Error updating status:', error);
          }
        );
      }
    });
  }

  // Delete the ticket
  deleteTicket(ticket: Ticket): void {
    const dialogRef = this.dialog.open(ConfirmationDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation de suppression',
        message: 'Êtes-vous sûr de vouloir supprimer ce ticket ?',
        buttons: [
          { text: 'Supprimer', value: true },
          { text: 'Annuler', value: false }
        ]
      },
      position: { top: '50px' }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.ticketService.deleteTicket(ticket.id as number).subscribe(
          () => {
            this.snackBar.open('Ticket supprimé avec succès', 'Fermer', {
              duration: 3000
            });
            this.loadTickets();
          },
          error => {
            this.snackBar.open('Erreur lors de la suppression du ticket', 'Fermer', {
              duration: 3000
            });
            console.error('Error deleting ticket:', error);
          }
        );
      }
    });
  }

  // Refresh tickets - alias for loadTickets
  refreshTickets(): void {
    this.loadTickets();
  }

  handleAcceptClick(ticket: Ticket, event: Event): void {
    console.log('Accept clicked for ticket:', ticket.id);

    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }

    // Close all menus first
    this.closeAllMenus();

    // Keep a reference to the ticket
    const ticketId = ticket.id;
    const originalTicket = { ...ticket };
    
    // Show a notification that we're working on it
    this.snackBar.open('Acceptation en cours...', '', { duration: 1000 });

    // Update UI immediately for instant feedback
    const index = this.tickets.findIndex((t) => t.id === ticketId);
    if (index !== -1) {
      // Ensure we use the standard 'Accepté' status with proper accent
      const acceptedStatus = 'Accepté';
      console.log(`Setting ticket ${ticketId} status to: '${acceptedStatus}'`);
      
      this.tickets[index].status = acceptedStatus;
      
      // Also update in filteredTickets and allTickets to ensure consistency across all arrays
      const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
      if (filteredIndex !== -1) {
        this.filteredTickets[filteredIndex].status = acceptedStatus;
      }
      
      const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
      if (allIndex !== -1) {
        this.allTickets[allIndex].status = acceptedStatus;
      }
      
      // Persist status change locally to survive page refreshes
      this.persistTicketStatusLocally(ticketId, acceptedStatus);
      
      console.log(`Immediately updating UI status to: ${this.tickets[index].status}`);
      this.changeDetectorRef.detectChanges();
      
      // Force a second change detection cycle to ensure UI updates
      setTimeout(() => {
        console.log(`Verifying UI update for ticket ${ticketId}:`, this.tickets[index].status);
        console.log(`isAcceptedStatus: ${this.isAcceptedStatus(this.tickets[index].status)}`);
        this.changeDetectorRef.detectChanges();
      }, 50);
    }

    // Call the service method
    this.ticketService.acceptTicket(ticketId)
      .pipe(
        catchError(error => {
          console.error('Error accepting ticket:', error);
          // Revert changes on error
          if (index !== -1) {
            this.tickets[index] = originalTicket;
            
            // Also revert in filteredTickets and allTickets
            const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
            if (filteredIndex !== -1) {
              this.filteredTickets[filteredIndex] = originalTicket;
            }
            
            const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
            if (allIndex !== -1) {
              this.allTickets[allIndex] = originalTicket;
            }
            
            this.changeDetectorRef.detectChanges();
          }
          return EMPTY;
        })
      )
      .subscribe({
        next: (updatedTicket) => {
          console.log('Ticket accepted successfully:', updatedTicket);
          
          this.snackBar.open('Ticket accepté avec succès', 'Fermer', { 
            duration: 3000,
            panelClass: ['success-snackbar']
          });
          
          // Update the ticket directly rather than doing a full reload
          if (index !== -1) {
            // Ensure we use the standard 'Accepté' status with proper accent
            const acceptedStatus = 'Accepté';
            
            // Merge updated ticket with local ticket to preserve any local data
            this.tickets[index] = { ...this.tickets[index], ...updatedTicket, status: acceptedStatus };
            
            // Also update in filteredTickets and allTickets
            const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
            if (filteredIndex !== -1) {
              this.filteredTickets[filteredIndex] = { ...this.filteredTickets[filteredIndex], ...updatedTicket, status: acceptedStatus };
            }
            
            const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
            if (allIndex !== -1) {
              this.allTickets[allIndex] = { ...this.allTickets[allIndex], ...updatedTicket, status: acceptedStatus };
            }
            
            // Persist the update to localStorage
            this.persistTicketStatusLocally(ticketId, acceptedStatus);
            
            // Log updated status for debugging
            console.log(`Final UI update for ticket ${ticketId}:`, this.tickets[index].status);
            console.log(`isAcceptedStatus: ${this.isAcceptedStatus(this.tickets[index].status)}`);
            
            this.changeDetectorRef.detectChanges();
          }
        },
        error: (err) => {
          console.error('Error accepting ticket:', err);
          
          // If there was an error, revert the local status
          if (index !== -1) {
            this.tickets[index] = originalTicket;
            
            // Also revert in filteredTickets and allTickets
            const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
            if (filteredIndex !== -1) {
              this.filteredTickets[filteredIndex] = originalTicket;
            }
            
            const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
            if (allIndex !== -1) {
              this.allTickets[allIndex] = originalTicket;
            }
            
            this.persistTicketStatusLocally(ticketId, originalTicket.status || 'Ouvert');
            this.changeDetectorRef.detectChanges();
          }
          
          this.snackBar.open('Erreur lors de l\'acceptation du ticket', 'Fermer', {
            duration: 3000,
            panelClass: ['error-snackbar']
          });
        }
      });
  }

  // Helper method to persist ticket status to local storage
  private persistTicketStatusLocally(ticketId: number | string, status: string): void {
    try {
      console.log(`[Admin Tickets] Persisting ticket ${ticketId} status as '${status}' to localStorage`);
      
      let cachedTickets = [];
      const cachedData = localStorage.getItem('cached_tickets');
      
      // Parse existing tickets or create a new array
      if (cachedData) {
        try {
          cachedTickets = JSON.parse(cachedData);
          if (!Array.isArray(cachedTickets)) {
            console.warn('[Admin Tickets] cached_tickets is not an array, resetting to empty array');
            cachedTickets = [];
          }
        } catch (parseError) {
          console.error('[Admin Tickets] Error parsing cached tickets:', parseError);
          cachedTickets = [];
        }
      }
      
      // Find the ticket index or prepare to add new ticket
      const ticketIdStr = String(ticketId);
      const ticketIndex = cachedTickets.findIndex((t: any) => String(t.id) === ticketIdStr);
      
      if (ticketIndex >= 0) {
        // Update existing ticket
        cachedTickets[ticketIndex].status = status;
        console.log(`[Admin Tickets] Updated cached ticket ${ticketId} status to '${status}'`);
      } else {
        // Add new ticket with minimal data
        cachedTickets.push({ id: ticketId, status: status });
        console.log(`[Admin Tickets] Added new cached ticket ${ticketId} with status '${status}'`);
      }
      
      // Save back to localStorage
      localStorage.setItem('cached_tickets', JSON.stringify(cachedTickets));
      console.log(`[Admin Tickets] Saved ${cachedTickets.length} tickets to localStorage`);
      
      // For debugging - show all cached tickets
      console.log('[Admin Tickets] Current cached ticket statuses:');
      cachedTickets.forEach((t: any) => {
        console.log(`Ticket #${t.id}: Status = '${t.status}'`);
      });
    } catch (e) {
      console.error('[Admin Tickets] Error persisting ticket status to localStorage:', e);
    }
  }

  handleRefuseClick(ticket: Ticket, event: Event): void {
    console.log('Refuse clicked for ticket:', ticket.id);

    // Prevent event propagation
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    // Close all menus first
    this.closeAllMenus();
    
    // Store original ticket data for potential rollback
    const originalTicket = { ...ticket };
    const ticketId = ticket.id;
    
    // Open dialog with position config
    const dialogRef = this.dialog.open(RefuseDialogComponent, {
      width: '600px',
      data: { ticket: ticket },
      panelClass: 'custom-dialog',
      position: { top: '10vh' },
      maxHeight: '90vh'
    });

    dialogRef.afterClosed().subscribe((result) => {
      console.log('Refuse dialog closed with result:', result);
      if (result) {
        // Update UI immediately for instant feedback
        const index = this.tickets.findIndex((t) => t.id === ticketId);
        if (index !== -1) {
          this.tickets[index].status = 'Refusé';
          this.tickets[index].report = result.report;
          
          // Also update in filteredTickets and allTickets to ensure consistency
          const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
          if (filteredIndex !== -1) {
            this.filteredTickets[filteredIndex].status = 'Refusé';
            this.filteredTickets[filteredIndex].report = result.report;
          }
          
          const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
          if (allIndex !== -1) {
            this.allTickets[allIndex].status = 'Refusé';
            this.allTickets[allIndex].report = result.report;
          }
          
          // Persist status change locally to survive page refreshes
          this.persistTicketStatusLocally(ticketId, 'Refusé');
          
          this.changeDetectorRef.detectChanges();
        }

        // Call the API
        this.ticketService.refuseTicket(ticketId, result.report).subscribe({
          next: (updatedTicket) => {
            console.log('Ticket refused successfully', updatedTicket);
            
            this.snackBar.open('Ticket refusé avec succès', 'Fermer', {
              duration: 3000,
              panelClass: ['success-snackbar']
            });
            
            // Update the ticket directly rather than doing a full reload
            if (index !== -1) {
              // Merge updated ticket with local ticket to preserve any local data
              this.tickets[index] = { ...this.tickets[index], ...updatedTicket, status: 'Refusé', report: result.report };
              
              // Also update in filteredTickets and allTickets
              const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
              if (filteredIndex !== -1) {
                this.filteredTickets[filteredIndex] = { ...this.filteredTickets[filteredIndex], ...updatedTicket, status: 'Refusé', report: result.report };
              }
              
              const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
              if (allIndex !== -1) {
                this.allTickets[allIndex] = { ...this.allTickets[allIndex], ...updatedTicket, status: 'Refusé', report: result.report };
              }
              
              this.changeDetectorRef.detectChanges();
            }
          },
          error: (err) => {
            console.error('Error refusing ticket:', err);
            
            // If there was an error, revert the local status
            if (index !== -1) {
              this.tickets[index] = originalTicket;
              
              // Also revert in filteredTickets and allTickets
              const filteredIndex = this.filteredTickets.findIndex((t) => t.id === ticketId);
              if (filteredIndex !== -1) {
                this.filteredTickets[filteredIndex] = originalTicket;
              }
              
              const allIndex = this.allTickets.findIndex((t) => t.id === ticketId);
              if (allIndex !== -1) {
                this.allTickets[allIndex] = originalTicket;
              }
              
              this.persistTicketStatusLocally(ticketId, originalTicket.status || 'Ouvert');
              this.changeDetectorRef.detectChanges();
            }
            
            this.snackBar.open('Erreur lors du refus du ticket', 'Fermer', {
              duration: 3000,
              panelClass: ['error-snackbar']
            });
          },
        });
      } else {
        console.log('Refuse dialog was cancelled or closed without a report');
      }
    });
  }

  // Helper method to check if a status is any variation of "Open"
  isOpenStatus(status: string | undefined): boolean {
    if (!status) return false;
    
    // Normalize the status for checking
    const normalizedStatus = status.trim().toLowerCase();
    
    // Check against all possible variations of "Open" status
    const openStatusVariations = [
      'ouvert', 'open', 'opened', 'ouverte'
    ];
    
    return openStatusVariations.includes(normalizedStatus);
  }

  // Helper method to check if a status is any variation of "Accepted"
  isAcceptedStatus(status: string | undefined): boolean {
    if (!status) return false;
    
    // Normalize the status for checking
    const normalizedStatus = status.trim().toLowerCase();
    
    // Check against all possible variations of "Accepted" status
    const acceptedStatusVariations = [
      'accepté', 'accepted', 'accepte', 'acceptée', 'accepte'
    ];
    
    return acceptedStatusVariations.includes(normalizedStatus);
  }
}
