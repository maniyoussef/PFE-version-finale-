// notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { catchError, of } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string; // Unique identifier
  message: string;
  route: string;
  timestamp: Date;
  isRead: boolean;
  type: NotificationType;
  relatedId?: number; // Ticket ID, Project ID, etc.
}

export enum NotificationType {
  NEW_TICKET = 'NEW_TICKET',
  TICKET_ACCEPTED = 'TICKET_ACCEPTED',
  TICKET_REFUSED = 'TICKET_REFUSED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  TICKET_UNRESOLVED = 'TICKET_UNRESOLVED',
  REPORT_ADDED = 'REPORT_ADDED',
  COMMENT_ADDED = 'COMMENT_ADDED'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CHEF_PROJET = 'CHEF_PROJET',
  COLLABORATEUR = 'COLLABORATEUR',
  CLIENT = 'CLIENT'
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = environment.apiUrl;

  // Separate notification streams for different user roles
  private adminNotifications = new BehaviorSubject<Notification[]>([]);
  private chefProjetNotifications = new BehaviorSubject<Notification[]>([]);
  private collaborateurNotifications = new BehaviorSubject<Notification[]>([]);
  private clientNotifications = new BehaviorSubject<Notification[]>([]);
  
  // Notification counts
  private adminNotificationCount = new BehaviorSubject<number>(0);
  private chefProjetNotificationCount = new BehaviorSubject<number>(0);
  private collaborateurNotificationCount = new BehaviorSubject<number>(0);
  private clientNotificationCount = new BehaviorSubject<number>(0);

  // Public Observable properties
  public adminNotifications$ = this.adminNotifications.asObservable();
  public chefProjetNotifications$ = this.chefProjetNotifications.asObservable();
  public collaborateurNotifications$ = this.collaborateurNotifications.asObservable();
  public clientNotifications$ = this.clientNotifications.asObservable();
  
  public adminNotificationCount$ = this.adminNotificationCount.asObservable();
  public chefProjetNotificationCount$ = this.chefProjetNotificationCount.asObservable();
  public collaborateurNotificationCount$ = this.collaborateurNotificationCount.asObservable();
  public clientNotificationCount$ = this.clientNotificationCount.asObservable();

  constructor(private snackBar: MatSnackBar, private http: HttpClient) {
    // Initialize from localStorage if needed
    this.loadNotificationsFromStorage();
  }

  // Helper for getting the relevant BehaviorSubject based on role
  private getNotificationSubject(role: UserRole): BehaviorSubject<Notification[]> {
    switch (role) {
      case UserRole.ADMIN: return this.adminNotifications;
      case UserRole.CHEF_PROJET: return this.chefProjetNotifications;
      case UserRole.COLLABORATEUR: return this.collaborateurNotifications;
      case UserRole.CLIENT: return this.clientNotifications;
      default: return this.adminNotifications;
    }
  }

  // Helper for getting the relevant count BehaviorSubject based on role
  private getCountSubject(role: UserRole): BehaviorSubject<number> {
    switch (role) {
      case UserRole.ADMIN: return this.adminNotificationCount;
      case UserRole.CHEF_PROJET: return this.chefProjetNotificationCount;
      case UserRole.COLLABORATEUR: return this.collaborateurNotificationCount;
      case UserRole.CLIENT: return this.clientNotificationCount;
      default: return this.adminNotificationCount;
    }
  }

  // Add notification for a specific role
  addNotificationForRole(role: UserRole, notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) {
    const notificationSubject = this.getNotificationSubject(role);
    const countSubject = this.getCountSubject(role);
    
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString(), // Simple unique ID
      timestamp: new Date(),
      isRead: false
    };
    
    const updatedNotifications = [fullNotification, ...notificationSubject.value];
    notificationSubject.next(updatedNotifications);
    countSubject.next(this.getUnreadCount(updatedNotifications));
    
    // Save to localStorage for persistence
    this.saveNotificationsToStorage();
  }

  // Get unread count from a notification array
  private getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  }

  // Mark notification as read
  markAsRead(role: UserRole, notificationId: string) {
    const notificationSubject = this.getNotificationSubject(role);
    const countSubject = this.getCountSubject(role);
    
    const updatedNotifications = notificationSubject.value.map(n => 
      n.id === notificationId ? {...n, isRead: true} : n
    );
    
    notificationSubject.next(updatedNotifications);
    countSubject.next(this.getUnreadCount(updatedNotifications));
    
    this.saveNotificationsToStorage();
  }

  // Mark all notifications as read for a role
  markAllAsRead(role: UserRole) {
    const notificationSubject = this.getNotificationSubject(role);
    const countSubject = this.getCountSubject(role);
    
    const updatedNotifications = notificationSubject.value.map(n => ({...n, isRead: true}));
    
    notificationSubject.next(updatedNotifications);
    countSubject.next(0);
    
    this.saveNotificationsToStorage();
  }

  // Clear notifications for a role
  clearNotifications(role: UserRole) {
    const notificationSubject = this.getNotificationSubject(role);
    const countSubject = this.getCountSubject(role);
    
    notificationSubject.next([]);
    countSubject.next(0);
    
    this.saveNotificationsToStorage();
  }

  // Save notifications to localStorage
  private saveNotificationsToStorage() {
    localStorage.setItem('adminNotifications', JSON.stringify(this.adminNotifications.value));
    localStorage.setItem('chefProjetNotifications', JSON.stringify(this.chefProjetNotifications.value));
    localStorage.setItem('collaborateurNotifications', JSON.stringify(this.collaborateurNotifications.value));
    localStorage.setItem('clientNotifications', JSON.stringify(this.clientNotifications.value));
  }

  // Load notifications from localStorage
  private loadNotificationsFromStorage() {
    try {
      const adminNotifs = JSON.parse(localStorage.getItem('adminNotifications') || '[]');
      const chefProjetNotifs = JSON.parse(localStorage.getItem('chefProjetNotifications') || '[]');
      const collaborateurNotifs = JSON.parse(localStorage.getItem('collaborateurNotifications') || '[]');
      const clientNotifs = JSON.parse(localStorage.getItem('clientNotifications') || '[]');
      
      this.adminNotifications.next(adminNotifs);
      this.chefProjetNotifications.next(chefProjetNotifs);
      this.collaborateurNotifications.next(collaborateurNotifs);
      this.clientNotifications.next(clientNotifs);
      
      this.adminNotificationCount.next(this.getUnreadCount(adminNotifs));
      this.chefProjetNotificationCount.next(this.getUnreadCount(chefProjetNotifs));
      this.collaborateurNotificationCount.next(this.getUnreadCount(collaborateurNotifs));
      this.clientNotificationCount.next(this.getUnreadCount(clientNotifs));
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
  }

  // Specific notification methods for different events
  notifyNewTicket(ticketTitle: string, ticketId: number) {
    // Notify admin
    this.addNotificationForRole(UserRole.ADMIN, {
      message: `Nouveau ticket créé: ${ticketTitle}`,
      route: `/admin-dashboard/tickets`,
      type: NotificationType.NEW_TICKET,
      relatedId: ticketId
    });
    
    // Notify chef projet if needed (this will be called from the client with specific chef projet ID)
  }

  notifyTicketAccepted(ticketTitle: string, ticketId: number, clientId?: number) {
    // Notify client
    if (clientId) {
      this.addNotificationForRole(UserRole.CLIENT, {
        message: `Votre ticket "${ticketTitle}" a été accepté`,
        route: `/client-dashboard/tickets/${ticketId}`,
        type: NotificationType.TICKET_ACCEPTED,
        relatedId: ticketId
      });
    }
  }

  notifyTicketRefused(ticketTitle: string, ticketId: number, reason: string, clientId?: number) {
    // Notify client
    if (clientId) {
      this.addNotificationForRole(UserRole.CLIENT, {
        message: `Votre ticket "${ticketTitle}" a été refusé: ${reason}`,
        route: `/client-dashboard/tickets/${ticketId}`,
        type: NotificationType.TICKET_REFUSED,
        relatedId: ticketId
      });
    }
  }

  notifyTicketAssigned(ticketTitle: string, ticketId: number, collaborateurId: number) {
    // Notify collaborateur
    this.addNotificationForRole(UserRole.COLLABORATEUR, {
      message: `Un nouveau ticket vous a été assigné: ${ticketTitle}`,
      route: `/collaborateur-dashboard/tickets/${ticketId}`,
      type: NotificationType.TICKET_ASSIGNED,
      relatedId: ticketId
    });
  }

  notifyTicketResolved(ticketTitle: string, ticketId: number, clientId?: number) {
    // Notify client
    if (clientId) {
      this.addNotificationForRole(UserRole.CLIENT, {
        message: `Votre ticket "${ticketTitle}" a été résolu`,
        route: `/client-dashboard/tickets/${ticketId}`,
        type: NotificationType.TICKET_RESOLVED,
        relatedId: ticketId
      });
    }
    
    // Notify admin
    this.addNotificationForRole(UserRole.ADMIN, {
      message: `Le ticket "${ticketTitle}" a été résolu`,
      route: `/admin-dashboard/historique`,
      type: NotificationType.TICKET_RESOLVED,
      relatedId: ticketId
    });
  }

  notifyTicketUnresolved(ticketTitle: string, ticketId: number, reason: string, clientId?: number) {
    // Notify client
    if (clientId) {
      this.addNotificationForRole(UserRole.CLIENT, {
        message: `Impossible de résoudre votre ticket "${ticketTitle}": ${reason}`,
        route: `/client-dashboard/tickets/${ticketId}`,
        type: NotificationType.TICKET_UNRESOLVED,
        relatedId: ticketId
      });
    }
    
    // Notify admin
    this.addNotificationForRole(UserRole.ADMIN, {
      message: `Le ticket "${ticketTitle}" n'a pas pu être résolu: ${reason}`,
      route: `/admin-dashboard/rapports`,
      type: NotificationType.TICKET_UNRESOLVED,
      relatedId: ticketId
    });
  }

  notifyCommentAdded(ticketTitle: string, ticketId: number, commenter: string, userId?: number) {
    // This can be customized based on who added the comment and who should be notified
    this.addNotificationForRole(UserRole.ADMIN, {
      message: `Nouveau commentaire de ${commenter} sur le ticket "${ticketTitle}"`,
      route: `/admin-dashboard/tickets`,
      type: NotificationType.COMMENT_ADDED,
      relatedId: ticketId
    });
  }

  // Display success snackbar message
  showSuccess(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  // Display error snackbar message
  showError(message: string) {
    this.snackBar.open(message, 'Fermer', {
      duration: 5000,
      panelClass: ['error-snackbar']
    });
  }

  addNotificationForUser(
    userId: number,
    notification: {
      message: string;
      route: string;
      type: NotificationType;
      relatedId: number;
    }
  ): void {
    // Create notification object
    const notificationObj = {
      userId: userId,
      message: notification.message,
      route: notification.route,
      type: notification.type,
      timestamp: new Date(),
      isRead: false,
      relatedId: notification.relatedId
    };
    
    // Send notification to backend
    this.http.post(`${this.apiUrl}/notifications/user`, notificationObj)
      .pipe(
        catchError(error => {
          console.error('Failed to send notification to user:', error);
          return of(null);
        })
      )
      .subscribe();
  }
}
