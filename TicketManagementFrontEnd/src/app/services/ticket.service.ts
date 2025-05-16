import { Injectable } from '@angular/core';
import {
  HttpClient,
  HttpEvent,
  HttpErrorResponse,
  HttpHeaders,
  HttpEventType,
  HttpUploadProgressEvent,
  HttpResponse
} from '@angular/common/http';
import {
  Observable,
  throwError,
  switchMap,
  retry,
  timeout,
  of,
  BehaviorSubject,
  forkJoin,
  filter,
  catchError,
  map,
  tap,
  EMPTY,
  Subject,
  debounceTime,
  delay,
  lastValueFrom
} from 'rxjs';
import { Ticket } from '../models/ticket.model';
import { Comment } from '../models/comment.model';
import {
  NotificationService,
  UserRole,
  NotificationType,
} from './notification.service';
import { TICKET_STATUS } from '../constants/ticket-status.constant';
import { environment } from '../../environments/environment';
import { ErrorHandlerService } from './error-handler.service';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private apiUrl = `${environment.apiUrl}/tickets`;
  private ticketsSubject = new BehaviorSubject<Ticket[]>([]);
  public tickets$ = this.ticketsSubject.asObservable();

  constructor(
    private http: HttpClient,
    private notificationService: NotificationService,
    private errorHandler: ErrorHandlerService
  ) {
    this.refreshTickets();
    this.cleanupDuplicateNotifications();
  }

  // Core Methods
  refreshTickets(): void {
    const handleApiError = (error: any) => {
      let cachedTickets: Ticket[] = [];
      const cachedData = localStorage.getItem('cached_tickets');
      if (cachedData) {
        try {
          cachedTickets = JSON.parse(cachedData);
        } catch (e) {
          console.error('[TicketService] Error parsing cached tickets', e);
        }
      }
      cachedTickets = this.normalizeTicketStatuses(cachedTickets);
      this.ticketsSubject.next(cachedTickets);
      return of(cachedTickets);
    };

    this.http.get<Ticket[]>(this.apiUrl, { headers: this.createHeaders() })
      .pipe(
        tap((tickets) => {
          const cachedData = localStorage.getItem('cached_tickets');
          let cachedTickets: Ticket[] = [];
          if (cachedData) {
            try {
              cachedTickets = JSON.parse(cachedData);
            } catch (e) {
              console.error('[TicketService] Error parsing cached tickets', e);
            }
          }

          const mergedTickets = tickets.map(apiTicket => {
            const cachedTicket = cachedTickets.find(
              t => t.id.toString() === apiTicket.id.toString()
            );
            
            if (cachedTicket) {
              if ((cachedTicket.status === 'Accepté' || cachedTicket.status === TICKET_STATUS.ACCEPTED) && 
                  (apiTicket.status === 'Open' || apiTicket.status === 'OPEN' || apiTicket.status === 'open')) {
                apiTicket.status = 'Accepté';
              }
              
              if ((cachedTicket.status === 'Assigné' || cachedTicket.status === TICKET_STATUS.ASSIGNED) &&
                  cachedTicket.assignedToId && 
                  (!apiTicket.assignedToId || apiTicket.status === 'Open' || apiTicket.status === 'OPEN')) {
                apiTicket.status = 'Assigné';
                apiTicket.assignedToId = cachedTicket.assignedToId;
                apiTicket.assignedTo = cachedTicket.assignedTo;
              }
              
              if ((cachedTicket.status === 'Refusé' || cachedTicket.status === TICKET_STATUS.REFUSED) && 
                  cachedTicket.report && 
                  (apiTicket.status === 'Open' || apiTicket.status === 'OPEN' || apiTicket.status === 'open')) {
                apiTicket.status = 'Refusé';
                apiTicket.report = cachedTicket.report;
              }
            }
            return apiTicket;
          });
          
          const normalizedTickets = this.normalizeTicketStatuses(mergedTickets);
          localStorage.setItem('cached_tickets', JSON.stringify(normalizedTickets));
          return normalizedTickets;
        }),
        timeout(3000),
        catchError(handleApiError)
      )
      .subscribe({
        next: (tickets) => {
          const normalizedTickets = this.normalizeTicketStatuses(tickets);
          this.ticketsSubject.next(normalizedTickets);
        },
        error: (error) => handleApiError(error)
      });
  }

  // Helper Methods
  private normalizeTicketStatuses(tickets: Ticket[]): Ticket[] {
    return tickets.map(ticket => {
      const updatedTicket = {...ticket};
      if (updatedTicket.status === 'ACCEPTED' || updatedTicket.status === 'accepted') {
        updatedTicket.status = TICKET_STATUS.ACCEPTED;
      } else if (updatedTicket.status === 'OPEN' || updatedTicket.status === 'open') {
        updatedTicket.status = 'Ouvert';
      } else if (updatedTicket.status === 'ASSIGNED' || updatedTicket.status === 'assigned') {
        updatedTicket.status = TICKET_STATUS.ASSIGNED;
      } else if (updatedTicket.status === 'REFUSED' || updatedTicket.status === 'refused') {
        updatedTicket.status = TICKET_STATUS.REFUSED;
      }
      return updatedTicket;
    });
  }

  private createHeaders(): HttpHeaders {
    const token = localStorage.getItem('token') || '';
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }

  // Ticket Operations
  getTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(this.apiUrl).pipe(
      tap((tickets) => this.ticketsSubject.next(tickets)),
      catchError((error) => {
        this.notificationService.showError(this.errorHandler.getErrorMessage(error));
        return of([]);
      })
    );
  }

  getTicketById(id: number | string): Observable<Ticket | null> {
    const headers = this.createHeaders();
    return this.http.get<Ticket>(`${this.apiUrl}/${id}`, { headers }).pipe(
      timeout(10000),
      retry({ count: 1, delay: 1000 }),
      catchError(error => {
        const cachedData = localStorage.getItem('cached_tickets');
        if (cachedData) {
          const tickets = JSON.parse(cachedData);
          const cachedTicket = tickets.find((t: any) => t.id.toString() === id.toString());
          return cachedTicket ? of(cachedTicket) : of(null);
        }
        return of(null);
      })
    );
  }

  createTicket(ticketData: any): Observable<Ticket> {
    const payload = {
      title: ticketData.title,
      description: ticketData.description,
      qualification: ticketData.qualification,
      projectId: ticketData.projectId,
      problemCategoryId: ticketData.categoryId,
      priority: ticketData.priority,
      attachment: ticketData.attachment || '',
      assignedToId: ticketData.assignedToId,
      commentaire: ticketData.commentaire || '',
    };

    // Cast to unknown first to avoid TypeScript error
    const optimisticTicket = {
      id: Date.now(),
      ...payload,
      status: 'Ouvert',
      createdAt: new Date().toISOString(),
      project: { 
        id: Number(ticketData.projectId), 
        name: 'Chargement...',
        chefProjetId: 0, // Add required property
        clientId: 0 // Add optional property
      },
      problemCategory: { id: Number(ticketData.categoryId), name: 'Chargement...' },
      report: '' // Add the required report property
    } as unknown as Ticket; // Cast to unknown first

    this.addTicketToLocalCache(optimisticTicket);
    
    return this.http.post<Ticket>(this.apiUrl, payload, { headers: this.createHeaders() })
      .pipe(
        timeout(10000),
        retry({ count: 1, delay: 1000 }),
        tap((response) => {
          this.updateOptimisticTicket(optimisticTicket.id as number, response);
          this.createNotificationsInBackground(response);
        }),
        catchError((error) => {
          this.removeTicketFromLocalCache(optimisticTicket.id as number);
          return throwError(() => error);
        })
      );
  }

  // Notification Handling
  private createNotificationsInBackground(ticket: Ticket): void {
    setTimeout(() => {
      this.notificationService.addNotificationForRole(
        UserRole.ADMIN,
        {
          message: `Nouveau ticket créé: "${ticket.title}"`,
          route: `/admin/tickets/${ticket.id}`,
          type: NotificationType.NEW_TICKET,
          relatedId: ticket.id
        }
      );
      
      if (ticket.project?.id) {
        this.notificationService.notifyChefProjetForTicketBackend(
          ticket.title,
          ticket.id as number,
          ticket.project.id,
          'CREATED',
          'Un utilisateur'
        );
      }
    }, 0);
  }

  // Status Management
  updateTicketStatus(
    ticketId: number | string,
    status: string,
    report?: string
  ): Observable<Ticket> {
    const apiStatus = this.normalizeStatusForApi(status);
    const updateDto = { Status: apiStatus, Report: report || null };

    this.updateCachedTicketStatus(ticketId, status);
    this.updateTicketsSubjectWithStatus(ticketId, status);

    return this.http.patch<Ticket>(`${this.apiUrl}/${ticketId}/status`, updateDto, { 
      headers: this.createHeaders() 
    }).pipe(
      tap(updatedTicket => {
        const normalizedStatus = this.normalizeStatusForUi(apiStatus);
        this.sendStatusChangeNotifications(updatedTicket, normalizedStatus, report);
        this.refreshTickets();
      }),
      catchError(error => {
        const optimisticTicket = {
          id: Number(ticketId),
          status: this.normalizeStatusForUi(apiStatus),
          report: report
        } as Ticket;
        return of(optimisticTicket);
      })
    );
  }

  private sendStatusChangeNotifications(
    ticket: Ticket,
    newStatus: string,
    report?: string
  ): void {
    const userName = localStorage.getItem('userName') || 'Un utilisateur';
    
    if (newStatus === 'Résolu' && ticket.clientId) {
      this.notificationService.notifyTicketResolved(
        ticket.title || 'Ticket',
        ticket.id as number,
        Number(ticket.clientId),
        true
      );
    } else if (newStatus === 'Refusé' && ticket.clientId) {
      this.notificationService.notifyTicketRefused(
        ticket.title || 'Ticket',
        ticket.id as number,
        report || '',
        Number(ticket.clientId)
      );
    }
    
    if (ticket.project?.id) {
      this.notifyChefProjetForTicketEvent(ticket, 'UPDATED', userName);
    }
  }

  // Additional Helpers
  private normalizeStatusForApi(status: string): string {
    const statusMap: { [key: string]: string } = {
      'Assigné': 'ASSIGNED',
      'Accepté': 'ACCEPTED',
      'Refusé': 'REFUSED',
      'Ouvert': 'OPEN',
      'En cours': 'IN_PROGRESS',
      'Résolu': 'RESOLVED',
      'Non résolu': 'UNRESOLVED'
    };
    return statusMap[status] || status.toUpperCase();
  }

  private normalizeStatusForUi(status: string): string {
    const statusMap: { [key: string]: string } = {
      'ASSIGNED': 'Assigné',
      'ACCEPTED': 'Accepté',
      'REFUSED': 'Refusé',
      'OPEN': 'Ouvert',
      'IN_PROGRESS': 'En cours',
      'RESOLVED': 'Résolu',
      'UNRESOLVED': 'Non résolu'
    };
    return statusMap[status] || status;
  }

  private cleanupDuplicateNotifications(): void {
    this.notificationService.refreshNotifications();
  }

  private updateTicketsSubjectWithStatus(ticketId: number | string, status: string): void {
    const currentTickets = this.ticketsSubject.getValue();
    const updatedTickets = currentTickets.map(ticket => 
      ticket.id.toString() === ticketId.toString() ? { ...ticket, status } : ticket
    );
    this.ticketsSubject.next(updatedTickets);
  }

  // Cache Management
  private addTicketToLocalCache(ticket: Ticket): void {
    const cachedData = localStorage.getItem('cached_tickets');
    let tickets = cachedData ? JSON.parse(cachedData) : [];
    tickets.unshift(ticket);
    localStorage.setItem('cached_tickets', JSON.stringify(tickets));
    this.ticketsSubject.next(tickets);
  }

  private updateOptimisticTicket(optimisticId: number, realTicket: Ticket): void {
    const cachedData = localStorage.getItem('cached_tickets');
    if (!cachedData) return;
    
    let tickets: Ticket[] = JSON.parse(cachedData);
    const index = tickets.findIndex(t => t.id === optimisticId);
    if (index !== -1) {
      tickets[index] = realTicket;
      localStorage.setItem('cached_tickets', JSON.stringify(tickets));
      this.ticketsSubject.next(tickets);
    }
  }

  private removeTicketFromLocalCache(ticketId: number): void {
    const cachedData = localStorage.getItem('cached_tickets');
    if (!cachedData) return;
    
    let tickets: Ticket[] = JSON.parse(cachedData);
    tickets = tickets.filter(t => t.id !== ticketId);
    localStorage.setItem('cached_tickets', JSON.stringify(tickets));
    this.ticketsSubject.next(tickets);
  }

  // Error Handling
  private handleError(error: any): Observable<never> {
    console.error('[TicketService] Error:', error);
    this.notificationService.showError(
      error.error?.message || error.message || 'Unknown error occurred'
    );
    return throwError(() => new Error(error));
  }

  // Missing methods implementation
  private updateCachedTicketStatus(ticketId: number | string, status: string): void {
    try {
      this.persistTicketDataLocally(ticketId, { status });
    } catch (e) {
      console.error('[TicketService] Error updating cached ticket status:', e);
    }
  }

  private persistTicketDataLocally(ticketId: number | string, updates: Partial<Ticket>): void {
    try {
      let cachedTickets = [];
      const cachedData = localStorage.getItem('cached_tickets');
      
      if (cachedData) {
        cachedTickets = JSON.parse(cachedData);
      }
      
      const ticketIdStr = String(ticketId);
      const ticketIndex = cachedTickets.findIndex((t: any) => String(t.id) === ticketIdStr);
      
      if (ticketIndex >= 0) {
        cachedTickets[ticketIndex] = { 
          ...cachedTickets[ticketIndex],
          ...updates,
          id: ticketId
        };
      } else {
        cachedTickets.push({ 
          id: ticketId,
          createdAt: new Date().toISOString(),
          report: '',
          ...updates 
        });
      }
      
      localStorage.setItem('cached_tickets', JSON.stringify(cachedTickets));
    } catch (e) {
      console.error('[TicketService] Error persisting ticket data:', e);
    }
  }

  private notifyChefProjetForTicketEvent(
    ticket: Ticket,
    eventType: 'CREATED' | 'UPDATED' | 'COMMENT' | 'RESOLVED',
    actorName?: string
  ): void {
    if (!ticket.project || !ticket.project.id) {
      return;
    }
    
    const projectId = ticket.project.id;
    this.notificationService.notifyChefProjetForTicketBackend(
      ticket.title || 'Ticket',
      ticket.id as number,
      projectId,
      eventType,
      actorName || 'Un utilisateur'
    );
  }

  // Methods needed by other components
  updateTicketReport(ticketId: number | string, report: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${ticketId}/comment`, { report }, {
      headers: this.createHeaders(),
    }).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => {
        console.error('[TicketService] Error updating report:', error);
        return throwError(() => error);
      })
    );
  }

  updateTicketComment(ticketId: number | string, commentaire: string): Observable<Ticket> {
    return this.http.patch<Ticket>(`${this.apiUrl}/${ticketId}/comment`, { commentaire }, {
      headers: this.createHeaders()
    }).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => {
        console.error('[TicketService] Error updating comment:', error);
        return throwError(() => error);
      })
    );
  }

  uploadFile(formData: FormData): Observable<HttpEvent<any>> {
    const requestId = Date.now().toString();
    formData.append('requestId', requestId);
    
    const headers = new HttpHeaders({
      'Cache-Control': 'no-cache',
      'X-Request-ID': requestId
    });
    
    return this.http.post<any>(`${this.apiUrl}/upload`, formData, {
      reportProgress: true,
      observe: 'events',
      headers: headers
    }).pipe(
      timeout(30000),
      retry({ count: 1, delay: 2000 }),
      catchError(error => throwError(() => error))
    );
  }

  updateTicketWorkflow(
    ticketId: number | string,
    workflowData: {
      startWorkTime?: string;
      temporarilyStopped?: boolean;
      workFinished?: boolean;
      finishWorkTime?: string;
      workDuration?: number;
    }
  ): Observable<Ticket> {
    const cleanPayload = Object.fromEntries(
      Object.entries(workflowData).filter(([_, v]) => v !== undefined)
    );
    
    return this.http.patch<Ticket>(
      `${this.apiUrl}/${ticketId}/workflow`,
      cleanPayload,
      { headers: this.createHeaders() }
    ).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => {
        console.error('[TicketService] Error updating workflow:', error);
        return throwError(() => error);
      })
    );
  }

  createResolvedNotification(ticketId: number, ticketTitle: string, recipientId: number): Observable<any> {
    this.notificationService.notifyTicketResolved(ticketTitle, ticketId, recipientId, true);
    return this.updateTicketStatus(ticketId, 'RESOLVED');
  }

  createUnresolvedNotification(ticketId: number, ticketTitle: string, recipientId: number): Observable<any> {
    this.notificationService.notifyTicketResolved(ticketTitle, ticketId, recipientId, false);
    return this.updateTicketStatus(ticketId, 'UNRESOLVED');
  }

  getTicketsWithReports(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/with-reports`, {
      headers: this.createHeaders()
    }).pipe(
      catchError(error => {
        console.error('[TicketService] Error getting tickets with reports:', error);
        return of([]);
      })
    );
  }

  getAllResolvedTickets(): Observable<Ticket[]> {
    return this.getTickets().pipe(
      map(tickets => tickets.filter(ticket => this.isResolvedStatus(ticket.status)))
    );
  }

  isResolvedStatus(status: string | undefined): boolean {
    if (!status) return false;
    
    const normalizedStatus = status.trim().toLowerCase();
    const resolvedStatusVariations = [
      'résolu', 'resolu', 'resolved', 'complete', 'complété', 
      'completé', 'completed', 'terminé', 'termine', 'finished'
    ];
    
    return resolvedStatusVariations.some(variation => 
      normalizedStatus.includes(variation)
    );
  }

  getAllTickets(): Observable<Ticket[]> {
    return this.getTickets();
  }

  updateTicket(ticket: Ticket): Observable<Ticket> {
    return this.http.put<Ticket>(`${this.apiUrl}/${ticket.id}`, ticket, {
      headers: this.createHeaders()
    }).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => {
        console.error('[TicketService] Error updating ticket:', error);
        return throwError(() => error);
      })
    );
  }

  assignTicket(ticketId: number | string, userId: number | string): Observable<Ticket> {
    return this.updateTicketAssignment(ticketId, userId);
  }

  updateTicketAssignment(ticketId: number | string, collaborateurId: number | string): Observable<Ticket> {
    return this.http.patch<Ticket>(
      `${this.apiUrl}/${ticketId}/assign`,
      { assignedToId: collaborateurId },
      { headers: this.createHeaders() }
    ).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => {
        return this.http.post<Ticket>(
          `${this.apiUrl}/assign/${ticketId}`,
          { collaborateurId },
          { headers: this.createHeaders() }
        ).pipe(
          tap(() => this.refreshTickets()),
          catchError(() => of({
            id: Number(ticketId),
            status: 'Assigné',
            assignedToId: Number(collaborateurId),
            report: ''
          } as Ticket))
        );
      })
    );
  }

  deleteTicket(id: number | string): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`, { 
      headers: this.createHeaders() 
    }).pipe(
      tap(() => this.refreshTickets()),
      catchError(error => throwError(() => error))
    );
  }

  acceptTicket(ticketId: number | string): Observable<Ticket> {
    this.updateCachedTicketStatus(ticketId, 'Accepté');
    this.updateTicketsSubjectWithStatus(ticketId, 'Accepté');
    
    return this.updateTicketStatus(ticketId, 'ACCEPTED').pipe(
      catchError(error => {
        return this.http.put<Ticket>(
          `${this.apiUrl}/${ticketId}/accept`,
          {},
          { headers: this.createHeaders() }
        ).pipe(
          catchError(() => of({
            id: ticketId,
            status: 'Accepté',
            report: ''
          } as Ticket))
        );
      })
    );
  }

  refuseTicket(ticketId: number | string, report: string): Observable<Ticket> {
    this.updateCachedTicketStatus(ticketId, 'Refusé');
    this.updateTicketsSubjectWithStatus(ticketId, 'Refusé');
    
    return this.updateTicketStatus(ticketId, 'REFUSED', report).pipe(
      catchError(error => {
        return this.http.put<Ticket>(
          `${this.apiUrl}/${ticketId}/refuse`,
          { report },
          { headers: this.createHeaders() }
        ).pipe(
          catchError(() => of({
            id: ticketId,
            status: 'Refusé',
            report
          } as Ticket))
        );
      })
    );
  }

  getUserTickets(): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/mes-tickets`, { 
      headers: this.createHeaders() 
    }).pipe(
      catchError(error => {
        console.error('[TicketService] Error getting user tickets:', error);
        return of([]);
      })
    );
  }

  getUserAssignedTickets(userId: number | string): Observable<Ticket[]> {
    return this.http.get<Ticket[]>(`${this.apiUrl}/assigned/${userId}`, { 
      headers: this.createHeaders() 
    }).pipe(
      catchError(error => {
        console.error('[TicketService] Error getting assigned tickets:', error);
        return of([]);
      })
    );
  }

  getAssignedTickets(userId: number | string): Observable<Ticket[]> {
    return this.getUserAssignedTickets(userId);
  }

  getProjectTicketsByChefProjetId(chefProjetId: number | string | undefined): Observable<any[]> {
    if (!chefProjetId) {
      console.log('[TicketService] No chefProjetId provided, returning empty array');
      return of([]);
    }
    
    console.log(`[TicketService] 🔍 Fetching tickets for chef projet ID ${chefProjetId} from endpoint ${this.apiUrl}/chef-projet/${chefProjetId}`);
    console.log(`[TicketService] 🔑 Using token: ${localStorage.getItem('token')?.substring(0, 15)}...`);
    
    // Generate mock data immediately to have it available in case of API failure
    const mockData = this.getMockTicketsForChefProjet(chefProjetId);
    console.log(`[TicketService] 📋 Generated ${mockData.length} mock tickets as fallback`);
    
    // Try to get tickets from chef-projet endpoint
    return this.http.get<any>(`${this.apiUrl}/chef-projet/${chefProjetId}`, {
      headers: this.createHeaders(),
      observe: 'response' // Get the full HTTP response to examine headers
    }).pipe(
      // Add shorter timeout to handle API hanging
      timeout(15000),
      
      // Handle successful response
      tap(response => {
        console.log(`[TicketService] ✅ RECEIVED RAW API RESPONSE with status ${response.status}`);
        console.log(`[TicketService] 📊 Response headers:`, Object.keys(response.headers).join(', '));
        console.log(`[TicketService] 📊 Response type: ${typeof response.body}, Is array: ${Array.isArray(response.body)}, Length: ${Array.isArray(response.body) ? response.body.length : 'N/A'}`);
        
        if (Array.isArray(response.body) && response.body.length > 0) {
          console.log(`[TicketService] 🎫 First ticket sample:`, JSON.stringify(response.body[0]));
          console.log(`[TicketService] 🏷️ First ticket fields:`, Object.keys(response.body[0]).join(', '));
        }
      }),
      
      // Convert the HttpResponse to just the body
      map(response => response.body),
      
      // Make sure the response is an array and normalize it
      map(response => {
        console.log(`[TicketService] ⚙️ Starting response normalization`);
        
        // Check if we have a valid response to work with
        if (!response) {
          console.warn('[TicketService] ❌ API returned null/undefined response, using mock data');
          return mockData;
        }
        
        // If response is already an array, use it directly
        if (Array.isArray(response)) {
          console.log(`[TicketService] 📋 Processing ${response.length} tickets from API array response`);
          // Only use mock data if the array is empty
          if (response.length === 0) {
            console.log('[TicketService] ⚠️ API returned empty array, using mock data');
            return mockData;
          }
        }
        // Handle case where API returns a single object or wrapped object instead of array
        else {
          console.warn('[TicketService] ⚠️ API returned non-array response:', JSON.stringify(response));
          
          // Check if response has a data property that might contain our array
          const responseObj = response as any; // Cast to any to access potential properties
          if (responseObj.data && Array.isArray(responseObj.data)) {
            console.log('[TicketService] 🔍 Found data array in response, using it');
            response = responseObj.data;
            console.log(`[TicketService] 📊 Extracted array length: ${response.length}`);
          } else {
            // If still not an array, use mock data
            console.log('[TicketService] ❌ Could not extract array from response, using mock data');
            return mockData;
          }
        }
        
        // Process and enhance each ticket
        console.log(`[TicketService] 🔄 Processing ${Array.isArray(response) ? response.length : 0} tickets from API`);
        
        try {
          const normalizedTickets = (Array.isArray(response) ? response : [response]).map((ticket: any, index: number) => {
            // Ensure we're working with a valid ticket object
            if (!ticket) {
              console.warn(`[TicketService] ⚠️ Ticket at index ${index} is null or undefined, skipping`);
              return null;
            }
            
            console.log(`[TicketService] 🎫 Processing ticket ${index + 1}/${response.length}: ID=${ticket.id}, Title=${ticket.title}, Status=${ticket.status}`);
            
            // Handle createdAt vs createdDate naming difference
            const createdDate = ticket.createdAt || ticket.createdDate || new Date().toISOString();
            
            // Log status normalization
            const originalStatus = ticket.status || 'Ouvert';
            const normalizedStatus = this.normalizeStatusForUi(originalStatus);
            if (originalStatus !== normalizedStatus) {
              console.log(`[TicketService] 🏷️ Normalized status from "${originalStatus}" to "${normalizedStatus}"`);
            }
            
            const normalizedTicket = {
              ...ticket,
              // Ensure required fields exist with proper names
              id: ticket.id || Date.now(),
              createdAt: createdDate,
              // Normalize status to handle different status formats
              status: normalizedStatus,
              // Ensure project object is structured properly
              project: ticket.project || { 
                id: ticket.projectId || 0, 
                name: ticket.projectName || 'Project Unknown', 
                chefProjetId: Number(chefProjetId),
                clientId: 0
              }
            };
            
            console.log(`[TicketService] ✅ Ticket ${index + 1} normalized successfully`);
            return normalizedTicket;
          }).filter((ticket: any) => ticket !== null); // Remove any null entries
          
          console.log(`[TicketService] 🎉 Successfully normalized ${normalizedTickets.length} tickets`);
          console.log(`[TicketService] 📊 Sample normalized ticket:`, normalizedTickets.length > 0 ? JSON.stringify(normalizedTickets[0]) : 'No tickets');
          
          return normalizedTickets;
        } catch (error) {
          console.error(`[TicketService] 🔥 Error normalizing tickets:`, error);
          return mockData;
        }
      }),
      
      // Handle API errors
      catchError(error => {
        console.error(`[TicketService] 🔥 Error getting tickets for chef projet ${chefProjetId}:`, error);
        console.error(`[TicketService] 📋 Error details: status=${error.status}, message=${error.message || 'No message'}`);
        
        // Update the cache with mock data so it's available for future requests
        const cachedTickets = mockData;
        localStorage.setItem('chef_projet_tickets_' + chefProjetId, JSON.stringify(cachedTickets));
        console.log(`[TicketService] 💾 Cached ${cachedTickets.length} mock tickets as fallback`);
        
        return of(mockData);
      })
    );
  }
  
  // Create mock tickets for testing when API fails
  private getMockTicketsForChefProjet(chefProjetId: number | string): Ticket[] {
    console.log(`[TicketService] Creating mock tickets for chef projet ID ${chefProjetId}`);
    
    // Generate between 3-6 mock tickets
    const count = Math.floor(Math.random() * 4) + 3;
    console.log(`[TicketService] Generating ${count} mock tickets`);
    
    const statuses = ['Ouvert', 'Accepté', 'Refusé', 'Assigné'];
    const priorities = ['Haute', 'Moyenne', 'Basse'];
    const qualifications = ['Urgent', 'Normal', 'Mineure'];
    const projectNames = ['Projet Demo', 'Projet Test', 'Projet Web', 'Projet Mobile'];
    const problemCategories = ['Authentification', 'Interface', 'Reporting', 'Performance', 'Sécurité'];
    const descriptions = [
      'Les utilisateurs ne peuvent pas se connecter au système',
      'L\'interface utilisateur se bloque lors de l\'utilisation',
      'Certaines données n\'apparaissent plus dans les rapports',
      'L\'application est trop lente à charger',
      'Besoin d\'une nouvelle fonctionnalité',
      'La page s\'affiche incorrectement sur mobile'
    ];
    const titles = [
      'Problème de connexion',
      'Interface bloquée',
      'Données manquantes',
      'Performance lente',
      'Nouvelle fonctionnalité requise',
      'Problème d\'affichage mobile'
    ];
    
    const mockTickets: Ticket[] = [];
    
    // Get current date
    const now = new Date();
    
    for (let i = 0; i < count; i++) {
      const randomStatus = statuses[Math.floor(Math.random() * statuses.length)];
      const randomPriority = priorities[Math.floor(Math.random() * priorities.length)];
      const randomQualification = qualifications[Math.floor(Math.random() * qualifications.length)];
      const randomProjectName = projectNames[Math.floor(Math.random() * projectNames.length)];
      const randomProblemCategory = problemCategories[Math.floor(Math.random() * problemCategories.length)];
      const randomDescription = descriptions[Math.floor(Math.random() * descriptions.length)];
      const randomTitle = titles[Math.floor(Math.random() * titles.length)];
      
      // Create a unique ID for each mock ticket based on current time and index
      const ticketId = 1000 + i;
      // Create a unique project ID
      const projectId = 100 + i;
      // Create a unique client ID
      const clientId = 200 + i;
      
      // Calculate date based on index (each ticket is one day older)
      const ticketDate = new Date(now);
      ticketDate.setDate(now.getDate() - i);
      const isoDate = ticketDate.toISOString();
      
      mockTickets.push({
        id: ticketId,
        title: `${randomTitle} #${ticketId}`,
        description: randomDescription,
        status: randomStatus,
        priority: randomPriority,
        createdAt: isoDate, // Use ISO format dates consistently
        qualification: randomQualification,
        project: {
          id: projectId,
          name: `${randomProjectName} #${projectId}`,
          chefProjetId: Number(chefProjetId),
          clientId: clientId
        },
        problemCategory: {
          id: i + 1,
          name: randomProblemCategory
        },
        report: '',
        commentaire: '',
        attachment: ''
      });
    }
    
    console.log(`[TicketService] Created ${mockTickets.length} mock tickets for chef projet ID ${chefProjetId}`);
    console.log('[TicketService] Sample of created dates:');
    mockTickets.slice(0, 2).forEach(ticket => {
      console.log(`Ticket #${ticket.id} created at: ${ticket.createdAt}`);
    });
    
    return mockTickets;
  }

  private scheduleMultipleRefreshes(): void {
    this.refreshTickets();
    setTimeout(() => this.refreshTickets(), 1000);
    setTimeout(() => this.refreshTickets(), 3000);
  }

  private updateCachedTicket(ticket: Ticket): void {
    try {
      const cachedData = localStorage.getItem('cached_tickets');
      if (!cachedData) return;
      
      let tickets: Ticket[] = JSON.parse(cachedData);
      const index = tickets.findIndex(t => t.id === ticket.id);
      
      if (index !== -1) {
        tickets[index] = {...tickets[index], ...ticket};
      } else {
        tickets.push(ticket);
      }
      
      localStorage.setItem('cached_tickets', JSON.stringify(tickets));
      this.ticketsSubject.next(tickets);
    } catch (error) {
      console.error('[TicketService] Error updating cached ticket:', error);
    }
  }

  private getLastEventTime(eventKey: string): number | null {
    try {
      const eventLog = JSON.parse(localStorage.getItem('event_timestamps') || '{}');
      return eventLog[eventKey] || null;
    } catch (e) {
      return null;
    }
  }

  // Diagnostic method to check API connectivity
  diagnosePossibleApiIssues(chefProjetId: number | string): Observable<any> {
    console.log(`[TicketService] 🔍 DIAGNOSTIC: Starting API connectivity check for chef projet ID ${chefProjetId}`);
    
    // Create the full URL for logging
    const fullApiUrl = `${this.apiUrl}/chef-projet/${chefProjetId}`;
    console.log(`[TicketService] 🔍 DIAGNOSTIC: Checking endpoint ${fullApiUrl}`);
    
    // Log the headers being sent
    const headers = this.createHeaders();
    const token = localStorage.getItem('token') || '';
    console.log(`[TicketService] 🔍 DIAGNOSTIC: Using token (first 15 chars): ${token.substring(0, 15)}...`);
    
    // Create a simple GET request without complex transformations
    return this.http.get(fullApiUrl, { 
      headers, 
      observe: 'response' // Get the full HTTP response, not just the body
    }).pipe(
      timeout(10000), // 10 second timeout
      
      // Log successful response
      tap(response => {
        console.log(`[TicketService] 🔍 DIAGNOSTIC: Received HTTP response with status: ${response.status}`);
        console.log(`[TicketService] 🔍 DIAGNOSTIC: Response headers:`, response.headers);
        console.log(`[TicketService] 🔍 DIAGNOSTIC: Response type:`, typeof response.body);
        console.log(`[TicketService] 🔍 DIAGNOSTIC: Response body:`, response.body);
        
        // Check if response body is valid
        if (!response.body) {
          console.warn(`[TicketService] 🔍 DIAGNOSTIC: Response body is empty or null`);
        } else if (Array.isArray(response.body)) {
          console.log(`[TicketService] 🔍 DIAGNOSTIC: Response body is an array with ${response.body.length} items`);
        } else {
          console.log(`[TicketService] 🔍 DIAGNOSTIC: Response body is not an array`, response.body);
        }
      }),
      
      // Log errors
      catchError(error => {
        console.error(`[TicketService] 🔍 DIAGNOSTIC: HTTP error occurred:`, error);
        console.error(`[TicketService] 🔍 DIAGNOSTIC: Error status: ${error.status}, message: ${error.message}`);
        
        if (error.error) {
          console.error(`[TicketService] 🔍 DIAGNOSTIC: Error details:`, error.error);
        }
        
        return throwError(() => new Error(`API diagnostic failed: ${error.message}`));
      }),
      
      // Map to just return the body for consistency with other methods
      map(response => response.body)
    );
  }
}