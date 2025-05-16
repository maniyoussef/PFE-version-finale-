// notification.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { catchError, tap, finalize } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface Notification {
  id: string; // Unique identifier
  message: string;
  route: string;
  timestamp: Date;
  isRead: boolean;
  type: NotificationType;
  relatedId?: number; // Ticket ID, Project ID, etc.
  userId?: number;
  icon?: string;    // Icon to display for the notification
  comment?: string; // Additional information about the notification
}

export enum NotificationType {
  NEW_TICKET = 'NEW_TICKET',
  TICKET_ACCEPTED = 'TICKET_ACCEPTED',
  TICKET_REFUSED = 'TICKET_REFUSED',
  TICKET_ASSIGNED = 'TICKET_ASSIGNED',
  TICKET_RESOLVED = 'TICKET_RESOLVED',
  TICKET_UNRESOLVED = 'TICKET_UNRESOLVED',
  TICKET_STATUS_CHANGED = 'TICKET_STATUS_CHANGED',
  REPORT_CREATED = 'REPORT_CREATED',
  COMMENT_ADDED = 'COMMENT_ADDED',
  TICKET_UPDATE = 'TICKET_UPDATE',
  TICKET_CREATED = 'TICKET_CREATED',
  REPORT_ADDED = 'REPORT_ADDED',
  SYSTEM = 'SYSTEM',
  OTHER = 'OTHER'
}

export enum UserRole {
  ADMIN = 'ADMIN',
  CHEF_PROJET = 'CHEF_PROJET',
  COLLABORATEUR = 'COLLABORATEUR',
  CLIENT = 'CLIENT',
  USER = 'USER'
}

export interface ApiNotification {
  id: number;
  userId: number;
  message: string;
  type: string;
  relatedTicketId?: number;
  route?: string;
  isRead: boolean;
  createdAt: string;  // ISO timestamp from server
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  private storageKey = 'notifications';

  // Combined storage approach - all notifications in one stream
  private notifications = new BehaviorSubject<Notification[]>([]);
  private notificationCount = new BehaviorSubject<number>(0);
  
  // Separate notification streams for different user roles for backward compatibility
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
  public notifications$ = this.notifications.asObservable();
  public notificationCount$ = this.notificationCount.asObservable();
  
  public adminNotifications$ = this.adminNotifications.asObservable();
  public chefProjetNotifications$ = this.chefProjetNotifications.asObservable();
  public collaborateurNotifications$ = this.collaborateurNotifications.asObservable();
  public clientNotifications$ = this.clientNotifications.asObservable();
  
  public adminNotificationCount$ = this.adminNotificationCount.asObservable();
  public chefProjetNotificationCount$ = this.chefProjetNotificationCount.asObservable();
  public collaborateurNotificationCount$ = this.collaborateurNotificationCount.asObservable();
  public clientNotificationCount$ = this.clientNotificationCount.asObservable();

  constructor(private snackBar: MatSnackBar, private http: HttpClient) {
    // Initialize from localStorage
    this.loadNotificationsFromStorage();
  }

  // Add notification for a specific role
  addNotificationForRole(role: UserRole, notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) {
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString(), // Simple unique ID
      timestamp: new Date(),
      isRead: false
    };
    
    // Add to role-specific stream
    this.addToRoleSpecificStream(role, fullNotification);
    
    // Also add to the main notifications stream
    this.addNotification(fullNotification);
  }

  // Add notification to the main stream
  addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'isRead'>) {
    const fullNotification: Notification = {
      ...notification,
      id: Date.now().toString(),
      timestamp: new Date(),
      isRead: false
    };
    
    const updatedNotifications = [fullNotification, ...this.notifications.value];
    this.notifications.next(updatedNotifications);
    this.updateNotificationCount();
    
    // Save to localStorage
    this.saveNotificationsToStorage();
  }

  // Add to role-specific stream
  private addToRoleSpecificStream(role: UserRole, notification: Notification) {
    const notificationSubject = this.getNotificationSubject(role);
    const countSubject = this.getCountSubject(role);
    
    const updatedNotifications = [notification, ...notificationSubject.value];
    notificationSubject.next(updatedNotifications);
    countSubject.next(this.getUnreadCount(updatedNotifications));
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

  // Get unread count from a notification array
  private getUnreadCount(notifications: Notification[]): number {
    return notifications.filter(n => !n.isRead).length;
  }

  // Mark notification as read
  markAsRead(notificationId: string): void;
  markAsRead(role: UserRole, notificationId: string): void;
  markAsRead(roleOrId: UserRole | string, notificationId?: string): void {
    // If notificationId is undefined, then roleOrId is the notificationId
    if (notificationId === undefined) {
      const id = roleOrId as string;
      const updatedNotifications = this.notifications.value.map(n => 
        n.id === id ? {...n, isRead: true} : n
      );
      
      this.notifications.next(updatedNotifications);
      this.updateNotificationCount();
      
      this.saveNotificationsToStorage();
    } else {
      // Otherwise, roleOrId is the role
      const role = roleOrId as UserRole;
      const notificationSubject = this.getNotificationSubject(role);
      const countSubject = this.getCountSubject(role);
      
      const updatedNotifications = notificationSubject.value.map(n => 
        n.id === notificationId ? {...n, isRead: true} : n
      );
      
      notificationSubject.next(updatedNotifications);
      countSubject.next(this.getUnreadCount(updatedNotifications));
      
      // Also mark as read in the main stream if it exists there
      const mainNotification = this.notifications.value.find(n => n.id === notificationId);
      if (mainNotification) {
        this.markAsRead(notificationId);
      }
    }
  }

  // Mark all notifications as read
  markAllAsRead(): void;
  markAllAsRead(role: UserRole): void;
  markAllAsRead(role?: UserRole): void {
    if (role === undefined) {
      // Mark all as read in the main notifications stream
      const updatedNotifications = this.notifications.value.map(n => ({...n, isRead: true}));
      
      this.notifications.next(updatedNotifications);
      this.notificationCount.next(0);
      
      this.saveNotificationsToStorage();
    } else {
      // Mark all as read for a specific role
      const notificationSubject = this.getNotificationSubject(role);
      const countSubject = this.getCountSubject(role);
      
      const updatedNotifications = notificationSubject.value.map(n => ({...n, isRead: true}));
      
      notificationSubject.next(updatedNotifications);
      countSubject.next(0);
    }
  }

  // Update notification count
  private updateNotificationCount(): void {
    const unreadCount = this.notifications.value.filter(n => !n.isRead).length;
    this.notificationCount.next(unreadCount);
  }

  // Clear notifications
  clearNotifications(): void;
  clearNotifications(role: UserRole): void;
  clearNotifications(role?: UserRole): void {
    if (role === undefined) {
      // Clear all notifications
      this.notifications.next([]);
      this.notificationCount.next(0);
      
      this.saveNotificationsToStorage();
    } else {
      // Clear notifications for a specific role
      const notificationSubject = this.getNotificationSubject(role);
      const countSubject = this.getCountSubject(role);
      
      notificationSubject.next([]);
      countSubject.next(0);
    }
  }

  // Save notifications to localStorage
  private saveNotificationsToStorage() {
    localStorage.setItem(this.storageKey, JSON.stringify(this.notifications.value));
  }

  // Load notifications from localStorage
  private loadNotificationsFromStorage() {
    try {
      const storedNotifications = localStorage.getItem(this.storageKey);
      
      if (storedNotifications) {
        const parsedNotifications = JSON.parse(storedNotifications);
        
        // Convert string timestamps to Date objects
        const notifications = parsedNotifications.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp)
        }));
        
        this.notifications.next(notifications);
        this.updateNotificationCount();
        
        // Also populate role-specific streams based on user IDs or types
        this.populateRoleSpecificStreams(notifications);
      }
    } catch (error) {
      console.error('Error loading notifications from localStorage:', error);
    }
  }

  // Populate role-specific streams
  private populateRoleSpecificStreams(notifications: Notification[]) {
    // Admin notifications (general administrative notifications)
    const adminNotifs = notifications.filter(n => 
      n.type === NotificationType.NEW_TICKET || 
      n.type === NotificationType.TICKET_STATUS_CHANGED ||
      n.userId === Number(localStorage.getItem('adminUserId'))
    );
    this.adminNotifications.next(adminNotifs);
    this.adminNotificationCount.next(this.getUnreadCount(adminNotifs));
    
    // Chef projet notifications
    const chefProjetNotifs = notifications.filter(n => 
      n.userId === Number(localStorage.getItem('userId')) && 
      localStorage.getItem('userRole')?.includes('CHEF_PROJET')
    );
    this.chefProjetNotifications.next(chefProjetNotifs);
    this.chefProjetNotificationCount.next(this.getUnreadCount(chefProjetNotifs));
    
    // Collaborateur notifications
    const collaborateurNotifs = notifications.filter(n => 
      n.userId === Number(localStorage.getItem('userId')) && 
      localStorage.getItem('userRole')?.includes('COLLABORATEUR')
    );
    this.collaborateurNotifications.next(collaborateurNotifs);
    this.collaborateurNotificationCount.next(this.getUnreadCount(collaborateurNotifs));
    
    // Client notifications
    const clientNotifs = notifications.filter(n => 
      n.userId === Number(localStorage.getItem('userId')) && 
      localStorage.getItem('userRole')?.includes('CLIENT')
    );
    this.clientNotifications.next(clientNotifs);
    this.clientNotificationCount.next(this.getUnreadCount(clientNotifs));
  }

  // Refresh notifications from storage
  refreshFromStorage() {
    this.loadNotificationsFromStorage();
  }

  // Refresh notifications (potentially from API in the future)
  refreshNotifications() {
    this.refreshFromStorage();
  }

  // Get notifications for current user
  getNotificationsForCurrentUser(): Notification[] {
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    return this.notifications.value.filter(n => !n.userId || n.userId === currentUserId);
  }

  // Specific notification methods for different events
  notifyNewTicket(ticketTitle: string, ticketId: number, userId?: number) {
    this.addNotification({
      message: `Nouveau ticket créé: ${ticketTitle}`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.NEW_TICKET,
      relatedId: ticketId,
      userId: userId,
      icon: 'add_circle'
    });
  }

  notifyTicketAccepted(ticketTitle: string, ticketId: number, userId: number) {
    // Create notification for the client
    this.addNotification({
      message: `Le ticket "${ticketTitle}" a été accepté`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.TICKET_ACCEPTED,
      relatedId: ticketId,
      userId: userId,
      icon: 'thumb_up'
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `Le ticket "${ticketTitle}" a été accepté`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.TICKET_ACCEPTED,
        relatedId: ticketId,
        icon: 'thumb_up'
      }
    );
  }

  notifyTicketRefused(ticketTitle: string, ticketId: number, reason: string, userId: number) {
    // Create notification for the client
    this.addNotification({
      message: `Le ticket "${ticketTitle}" a été refusé: ${reason}`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.TICKET_REFUSED,
      relatedId: ticketId,
      userId: userId,
      icon: 'thumb_down',
      comment: reason
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `Le ticket "${ticketTitle}" a été refusé: ${reason}`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.TICKET_REFUSED,
        relatedId: ticketId,
        icon: 'thumb_down',
        comment: reason
      }
    );
  }

  // Method to notify a user that a ticket has been assigned to them
  notifyTicketAssigned(ticketTitle: string, ticketId: number, userId: number, assignedUserName: string = 'un collaborateur') {
    // Create notification for the assigned user
    this.addNotification({
      message: `Le ticket "${ticketTitle}" vous a été assigné`,
      route: `/collaborateur/tickets/${ticketId}`,
      type: NotificationType.TICKET_ASSIGNED,
      relatedId: ticketId,
      userId: userId,
      icon: 'assignment_ind'
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `Le ticket "${ticketTitle}" a été assigné à ${assignedUserName}`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.TICKET_ASSIGNED,
        relatedId: ticketId,
        icon: 'assignment_ind'
      }
    );
  }

  notifyTicketResolved(ticketTitle: string, ticketId: number, userId: number, resolved: boolean = true) {
    // Notification for client
    this.addNotification({
      message: resolved 
        ? `Le ticket "${ticketTitle}" a été résolu` 
        : `Le ticket "${ticketTitle}" a été marqué comme non résolu`,
      route: `/tickets/${ticketId}`,
      type: resolved ? NotificationType.TICKET_RESOLVED : NotificationType.TICKET_UNRESOLVED,
      relatedId: ticketId,
      userId: userId,
      icon: resolved ? 'check_circle' : 'error'
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: resolved 
          ? `Le ticket "${ticketTitle}" a été résolu` 
          : `Le ticket "${ticketTitle}" a été marqué comme non résolu`,
        route: `/admin/tickets/${ticketId}`,
        type: resolved ? NotificationType.TICKET_RESOLVED : NotificationType.TICKET_UNRESOLVED,
        relatedId: ticketId,
        icon: resolved ? 'check_circle' : 'error'
      }
    );
  }

  // Method to notify a user that a comment has been added to their ticket
  notifyCommentAdded(ticketTitle: string, ticketId: number, userId: number, commenterName: string = 'Un utilisateur') {
    // Create notification for the ticket owner
    this.addNotification({
      message: `${commenterName} a ajouté un commentaire au ticket "${ticketTitle}"`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.COMMENT_ADDED,
      relatedId: ticketId,
      userId: userId,
      icon: 'comment'
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `${commenterName} a ajouté un commentaire au ticket "${ticketTitle}"`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.COMMENT_ADDED,
        relatedId: ticketId,
        icon: 'comment'
      }
    );
  }

  notifyTicketStatusChange(
    ticketTitle: string,
    ticketId: number,
    previousStatus: string,
    newStatus: string,
    userId: number
  ) {
    // Create the notification object
    const statusNotification = {
      message: `Le statut du ticket "${ticketTitle}" a été changé de "${previousStatus}" à "${newStatus}"`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.TICKET_STATUS_CHANGED,
      relatedId: ticketId,
      userId: userId,
      icon: 'update'
    };
    
    // Add to regular notification system for the specific user
    this.addNotification(statusNotification);
    
    // Ensure we get all admin user IDs
    const adminUserIds = this.getAllAdminUserIds();
    
    // Also add notification for admin to ensure admins get status updates - with admin route
    adminUserIds.forEach(adminId => {
      if (adminId !== userId) { // Don't duplicate if the user is an admin
        this.addNotification({
          ...statusNotification,
          message: `Le statut du ticket "${ticketTitle}" a été changé de "${previousStatus}" à "${newStatus}"`,
          route: `/admin/tickets/${ticketId}`,
          userId: adminId
        });
      }
    });
    
    // Also add notification using role-based approach as a fallback
    this.addNotificationForRole(UserRole.ADMIN, {
      ...statusNotification,
      message: `Le statut du ticket "${ticketTitle}" a été changé de "${previousStatus}" à "${newStatus}"`,
      route: `/admin/tickets/${ticketId}`
    });
  }

  // Helper method to get all admin user IDs from localStorage
  private getAllAdminUserIds(): number[] {
    const ids: number[] = [];
    // Get the main admin user ID
    const adminUserId = Number(localStorage.getItem('adminUserId') || '0');
    if (adminUserId > 0) {
      ids.push(adminUserId);
    }
    
    // Get the current user ID if they're an admin
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const userRole = localStorage.getItem('userRole') || '';
    if (userRole.includes('ADMIN') && currentUserId > 0 && !ids.includes(currentUserId)) {
      ids.push(currentUserId);
    }
    
    // If no admin IDs found, add a default (this shouldn't happen in production)
    if (ids.length === 0) {
      console.warn('[NotificationService] No admin user IDs found, using fallback');
      ids.push(1); // Fallback admin ID
    }
    
    return ids;
  }

  // Success notification
  showSuccess(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'success-snackbar'
    });
  }

  // Error notification
  showError(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 5000,
      panelClass: 'error-snackbar'
    });
  }

  // Info notification
  showInfo(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 3000,
      panelClass: 'info-snackbar'
    });
  }

  // Warning notification
  showWarning(message: string) {
    this.snackBar.open(message, 'OK', {
      duration: 4000,
      panelClass: 'warning-snackbar'
    });
  }

  // Snackbar notification
  showSnackbarNotification(message: string, action: string, panelClass?: string) {
    this.snackBar.open(message, action, {
      duration: 5000,
      panelClass: panelClass || 'info-snackbar'
    });
  }

  // Functions for chef projet notifications
  getUnreadCountForCurrentUser(): number {
    const userId = Number(localStorage.getItem('userId') || '0');
    return this.notifications.value.filter(n => 
      !n.isRead && (n.userId === undefined || n.userId === userId)
    ).length;
  }

  synchronizeWithBackend(): Observable<any> {
    const userId = Number(localStorage.getItem('userId') || '0');
    const endpoint = `${environment.apiUrl}/notifications/user/${userId}`;
    return this.http.get(endpoint).pipe(
      tap(response => {
        console.log('[NotificationService] Synchronized with backend:', response);
      }),
      catchError(error => {
        console.error('[NotificationService] Error synchronizing with backend:', error);
        return of({ error: 'Failed to sync notifications' });
      })
    );
  }

  // Test notifications
  createTestResolutionNotification(): void {
    this.notifyTicketResolved('Test Ticket', 999, 1);
  }

  createResolutionFromStatusChange(
    ticketTitle: string, 
    ticketId: number, 
    previousStatus: string, 
    newStatus: string, 
    userId: number
  ): void {
    this.notifyTicketStatusChange(ticketTitle, ticketId, previousStatus, newStatus, userId);
    // If the new status indicates resolution, also create a resolved notification
    if (newStatus.toLowerCase().includes('résolu')) {
      this.notifyTicketResolved(ticketTitle, ticketId, userId, true);
    }
  }

  createTestUnresolvedNotification(): void {
    this.notifyTicketResolved('Test Ticket', 999, 1, false);
  }

  createUnresolvedFromStatusChange(
    ticketTitle: string, 
    ticketId: number, 
    previousStatus: string, 
    userId: number
  ): void {
    this.notifyTicketResolved(ticketTitle, ticketId, userId, false);
  }

  // Chef projet specific methods
  debugChefProjetAssociations(): void {
    console.log('[NotificationService] Debug chef projet associations');
  }

  fixDuplicateBackendNotifications(): void {
    console.log('[NotificationService] Fix duplicate backend notifications');
  }

  emergencyChefProjetNotificationFix(): void {
    console.log('[NotificationService] Emergency chef projet notification fix');
  }

  getProjectsForChefProjet(): Observable<any> {
    const userId = Number(localStorage.getItem('userId') || '0');
    const endpoint = `${environment.apiUrl}/projects/chef-projet/${userId}`;
    return this.http.get(endpoint).pipe(
      catchError(error => {
        console.error('[NotificationService] Error getting projects for chef projet:', error);
        return of([]);
      })
    );
  }

  createNewTicketNotificationForChefProjet(
    ticketId: number,
    ticketTitle: string,
    projectId: number,
    systemMessage?: string
  ): void {
    const userId = Number(localStorage.getItem('userId') || '0');
    this.addNotification({
      message: systemMessage || `Un nouveau ticket "${ticketTitle}" a été créé dans votre projet`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.NEW_TICKET,
      relatedId: ticketId,
      userId: userId,
      icon: 'add_circle'
    });
  }

  createResolutionNotificationForChefProjet(
    ticketId: number,
    ticketTitle: string,
    projectId: number,
    resolved: boolean = true,
    actorName?: string
  ): void {
    const userId = Number(localStorage.getItem('userId') || '0');
    this.addNotification({
      message: resolved 
        ? `Le ticket "${ticketTitle}" a été résolu` 
        : `Le ticket "${ticketTitle}" a été marqué comme non résolu`,
      route: `/tickets/${ticketId}`,
      type: resolved ? NotificationType.TICKET_RESOLVED : NotificationType.TICKET_UNRESOLVED,
      relatedId: ticketId,
      userId: userId,
      icon: resolved ? 'check_circle' : 'error'
    });
  }

  notifyChefProjetForTicketEvent(
    ticketId: number,
    eventType: string,
    actorName?: string
  ): void {
    const userId = Number(localStorage.getItem('userId') || '0');
    const ticketTitle = 'Ticket #' + ticketId; // Generic title if not provided
    
    this.addNotification({
      message: `Événement sur le ticket "${ticketTitle}": ${eventType}`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.TICKET_UPDATE,
      relatedId: ticketId,
      userId: userId,
      icon: 'update'
    });
  }

  testDirectApiCall(): void {
    console.log('[NotificationService] Test direct API call');
  }

  testUserNotificationsEndpoint(userId: number): void {
    console.log('[NotificationService] Test user notifications endpoint for user:', userId);
  }

  createEmergencyChefProjetNotification(): void {
    const userId = Number(localStorage.getItem('userId') || '0');
    this.addNotification({
      message: 'Notification d\'urgence pour Chef de Projet',
      route: '/dashboard',
      type: NotificationType.SYSTEM,
      userId: userId,
      icon: 'warning'
    });
  }

  verifyAllChefProjetNotifications(): Observable<any> {
    const userId = Number(localStorage.getItem('userId') || '0');
    const endpoint = `${environment.apiUrl}/notifications/chef-projet/${userId}/verify`;
    return this.http.get(endpoint).pipe(
      catchError(error => {
        console.error('[NotificationService] Error verifying chef projet notifications:', error);
        return of({ error: 'Failed to verify notifications' });
      })
    );
  }

  migrateGlobalNotifications(): void {
    console.log('[NotificationService] Migrating global notifications');
  }

  forceWriteNotificationsToStorage(): void {
    this.saveNotificationsToStorage();
  }

  notifyChefProjetForTicketBackend(
    ticketTitle: string,
    ticketId: number,
    projectId: number,
    action: string,
    actorName?: string
  ): Observable<any> {
    const endpoint = `${environment.apiUrl}/notifications/chef-projet/ticket`;
    const payload = {
      ticketId,
      projectId,
      action,
      ticketTitle,
      actorName
    };
    
    return this.http.post(endpoint, payload).pipe(
      catchError(error => {
        console.error('[NotificationService] Error notifying chef projet for ticket backend:', error);
        return of({ error: 'Failed to notify chef projet' });
      })
    );
  }

  notifyChefProjetAction(
    ticketTitle: string,
    ticketId: number,
    projectId: number,
    action: string,
    actorName?: string
  ): Observable<any> {
    return this.notifyChefProjetForTicketBackend(ticketTitle, ticketId, projectId, action, actorName);
  }

  // Method to notify the creator that a ticket has been created (specifically for admins)
  notifyTicketCreated(ticketTitle: string, ticketId: number, creatorName: string) {
    // Only notify admins about new ticket creation
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `Nouveau ticket "${ticketTitle}" créé par ${creatorName}`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.TICKET_CREATED,
        relatedId: ticketId,
        icon: 'add_circle'
      }
    );
  }

  // Method to notify the creator that a report has been added to their ticket
  notifyReportAdded(ticketTitle: string, ticketId: number, userId: number, reporterName: string) {
    // Create notification for the ticket creator
    this.addNotification({
      message: `${reporterName} a ajouté un rapport au ticket "${ticketTitle}"`,
      route: `/tickets/${ticketId}`,
      type: NotificationType.REPORT_ADDED,
      relatedId: ticketId,
      userId: userId,
      icon: 'description'
    });
    
    // Also add a notification for all admins with admin route
    this.addNotificationForRole(
      UserRole.ADMIN,
      {
        message: `${reporterName} a ajouté un rapport au ticket "${ticketTitle}"`,
        route: `/admin/tickets/${ticketId}`,
        type: NotificationType.REPORT_ADDED,
        relatedId: ticketId,
        icon: 'description'
      }
    );
  }
}