import { Component, OnInit, OnDestroy, Inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MatDialogModule, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { MatListModule } from '@angular/material/list';
import { MatBadgeModule } from '@angular/material/badge';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule, Router } from '@angular/router';
import { Notification, NotificationService, NotificationType, UserRole } from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';

@Component({
  selector: 'app-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    MatListModule,
    MatBadgeModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
    RouterModule
  ]
})
export class NotificationDialogComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  hasUnread: boolean = false;
  unreadCount: number = 0;
  error: string | null = null;
  showLoading: boolean = false;
  notificationSubscription: Subscription | null = null;
  notificationCategoryMap = new Map<string, Notification[]>();
  notificationCounts = {
    assignment: 0,
    comments: 0,
    chefProjet: 0,
    other: 0
  };
  NotificationType = NotificationType;
  private debugMode = false;
  loading = false;
  highlightResolutionNotifications = false;
  processedNotificationIds = new Set<string>();
  private lastRefreshTime = 0;
  private readonly REFRESH_THROTTLE = 10000; // 10 seconds
  private readonly BATCH_SIZE = 50; // Process notifications in batches
  
  // Group notifications for easier rendering in template
  importantNotifications: Notification[] = [];
  otherNotifications: Notification[] = [];
  
  // Property for the enhanced dialog
  enableClearSeenButton: boolean = false;

  constructor(
    private notificationService: NotificationService,
    private router: Router,
    public dialogRef: MatDialogRef<NotificationDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    if (data) {
      if (data.notifications) {
        this.notifications = data.notifications;
      }
      if (data.highlightResolutionNotifications !== undefined) {
        this.highlightResolutionNotifications = data.highlightResolutionNotifications;
      }
      // Get property from dialog data
      if (data.enableClearSeenButton !== undefined) {
        this.enableClearSeenButton = data.enableClearSeenButton;
      }
    }
  }

  ngOnInit() {
    try {
      // Initial load from current state
      this.notifications = this.notificationService.getNotificationsForCurrentUser();
      this.processNotifications();
      
      // Subscribe to notification changes with debounce
      this.notificationSubscription = this.notificationService.notifications$
        .pipe(
          debounceTime(300), // Debounce rapid changes
          distinctUntilChanged((prev, curr) => {
            // Only update if the arrays are different
            return prev.length === curr.length && 
                   prev.every((n, i) => n.id === curr[i].id && n.isRead === curr[i].isRead);
          })
        )
        .subscribe({
          next: (notifications: Notification[]) => {
            this.notifications = this.notificationService.getNotificationsForCurrentUser();
            this.processNotifications();
            this.changeDetectorRef.detectChanges();
          },
          error: (err) => {
            console.error('[NotificationDialog] Error loading notifications:', err);
            this.error = 'Error loading notifications';
            this.showLoading = false;
            this.changeDetectorRef.detectChanges();
          }
        });
    } catch (err) {
      console.error('[NotificationDialog] Error in ngOnInit:', err);
      this.error = 'Error initializing notifications';
      this.showLoading = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private processNotifications(): void {
    // Clear arrays before processing
    this.importantNotifications = [];
    this.otherNotifications = [];

    // Process notifications in batches to avoid UI freezing
    const processBatch = (startIndex: number) => {
      const endIndex = Math.min(startIndex + this.BATCH_SIZE, this.notifications.length);
      const batch = this.notifications.slice(startIndex, endIndex);
      
      // Process the batch
      batch.forEach(notification => {
        if (!this.processedNotificationIds.has(notification.id)) {
          this.processedNotificationIds.add(notification.id);
          this.processNotification(notification);
        }
        
        // Sort notification into appropriate group
        if (this.isImportantNotification(notification)) {
          this.importantNotifications.push(notification);
        } else {
          this.otherNotifications.push(notification);
        }
      });
      
      // If there are more notifications to process, schedule the next batch
      if (endIndex < this.notifications.length) {
        setTimeout(() => processBatch(endIndex), 0);
      } else {
        // All notifications processed
        this.updateCategoryCounts();
        this.sortNotificationGroups();
        this.hasUnread = this.notifications.some(n => !n.isRead);
        this.unreadCount = this.notifications.filter(n => !n.isRead).length;
        this.showLoading = false;
        this.changeDetectorRef.detectChanges();
      }
    };
    
    // Start processing from the beginning
    processBatch(0);
  }

  private processNotification(notification: Notification): void {
    // Process individual notification
    if (this.isHighlightedResolutionNotification(notification)) {
      (notification as any).isResolutionNotification = true;
    }
  }

  // Helper method to check if a notification is "important"
  isImportantNotification(notification: Notification): boolean {
    return this.isHighlightedResolutionNotification(notification) || 
           this.isResolutionNotification(notification) || 
           this.isUnresolutionNotification(notification);
  }

  // Helper method to check if there are any important notifications
  hasImportantNotifications(): boolean {
    return this.importantNotifications.length > 0;
  }

  refreshNotifications(): void {
    const now = Date.now();
    if (now - this.lastRefreshTime < this.REFRESH_THROTTLE) {
      return;
    }
    
    this.lastRefreshTime = now;
    this.showLoading = true;
    this.changeDetectorRef.detectChanges();
    
    // Use requestAnimationFrame for smoother UI updates
    requestAnimationFrame(() => {
      this.notificationService.refreshNotifications();
    });
  }

  // Helper method to update category counts without excessive logging
  private updateCategoryCounts(): void {
    const assignmentNotifications = this.notifications.filter(n => n.type === NotificationType.TICKET_ASSIGNED);
    const commentNotifications = this.notifications.filter(n => n.type === NotificationType.COMMENT_ADDED);
    const chefProjetNotifications = this.notifications.filter(n => 
      (n.message && n.message.toLowerCase().includes('chef projet')) || 
      (n.id && n.id.includes('chef_'))
    );
    
    this.notificationCounts = {
      assignment: assignmentNotifications.length,
      comments: commentNotifications.length,
      chefProjet: chefProjetNotifications.length,
      other: this.notifications.length - assignmentNotifications.length - commentNotifications.length - chefProjetNotifications.length
    };
  }

  private sortNotificationGroups(): void {
    // Sort both arrays by time (newest first)
    this.importantNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    this.otherNotifications.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  ngOnDestroy() {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.hasUnread = false;
  }

  markAsRead(notification: Notification): void {
    this.notificationService.markAsRead(notification.id);
    notification.isRead = true;
    this.hasUnread = this.notifications.some(n => !n.isRead);
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
  }

  clearNotifications(): void {
    if (this.debugMode) {
      console.log('[NotificationDialog] Clearing all notifications');
    }
    this.notificationService.clearNotifications();
    this.notifications = [];
    this.importantNotifications = [];
    this.otherNotifications = [];
    this.hasUnread = false;
    this.unreadCount = 0;
  }

  // Keep a simplified version of the sort function
  private sortNotificationsByTime(): void {
    this.notifications.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  navigateToTicket(notification: Notification): void {
    if (notification && notification.route) {
      this.markAsRead(notification);
      this.dialogRef.close();
      this.router.navigateByUrl(notification.route);
    }
  }

  trackByFn(index: number, notification: Notification): string {
    return notification.id;
  }

  formatDate(date: Date): string {
    if (!date) return '';
    return new Date(date).toLocaleDateString('fr-FR', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  getRelativeTime(timestamp: Date): string {
    if (!timestamp) return '';
    
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    
    const seconds = Math.floor(diff / 1000);
    if (seconds < 60) return 'à l\'instant';
    
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `Il y a ${minutes} minute${minutes > 1 ? 's' : ''}`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Il y a ${hours} heure${hours > 1 ? 's' : ''}`;
    
    const days = Math.floor(hours / 24);
    if (days < 30) return `Il y a ${days} jour${days > 1 ? 's' : ''}`;
    
    return this.formatDate(timestamp);
  }

  getNotificationTypeLabel(type: string): string {
    switch (type) {
      case NotificationType.NEW_TICKET:
        return 'Nouveau ticket';
      case NotificationType.TICKET_ACCEPTED:
        return 'Ticket accepté';
      case NotificationType.TICKET_REFUSED:
        return 'Ticket refusé';
      case NotificationType.TICKET_RESOLVED:
        return 'Ticket résolu';
      case NotificationType.TICKET_UNRESOLVED:
        return 'Ticket non résolu';
      case NotificationType.TICKET_STATUS_CHANGED:
        return 'Statut modifié';
      case NotificationType.TICKET_ASSIGNED:
        return 'Ticket assigné';
      case NotificationType.COMMENT_ADDED:
        return 'Nouveau commentaire';
      case NotificationType.REPORT_CREATED:
        return 'Rapport créé';
      default:
        return 'Notification';
    }
  }

  getIconForNotificationType(type: string): string {
    switch (type) {
      case NotificationType.NEW_TICKET:
        return 'add_circle';
      case NotificationType.TICKET_ACCEPTED:
        return 'check_circle';
      case NotificationType.TICKET_REFUSED:
        return 'cancel';
      case NotificationType.TICKET_RESOLVED:
        return 'done_all';
      case NotificationType.TICKET_UNRESOLVED:
        return 'replay';
      case NotificationType.TICKET_STATUS_CHANGED:
        return 'update';
      case NotificationType.TICKET_ASSIGNED:
        return 'person_add';
      case NotificationType.COMMENT_ADDED:
        return 'comment';
      case NotificationType.REPORT_CREATED:
        return 'description';
      default:
        return 'notifications';
    }
  }

  // Get color for notification icon based on type and content
  getIconColorForNotification(notification: Notification): string {
    // Use specific colors for resolution notifications
    if (notification.type === NotificationType.TICKET_RESOLVED) {
      return 'primary'; // Or use 'green' for even more emphasis
    }
    
    if (notification.type === NotificationType.TICKET_UNRESOLVED) {
      return 'warn'; // Or use 'orange' for even more emphasis
    }
    
    // Check for status change related to resolution
    if (notification.type === NotificationType.TICKET_STATUS_CHANGED &&
        notification.message) {
      if (notification.message.toLowerCase().includes('résolu') && 
          !notification.message.toLowerCase().includes('non résolu')) {
        return 'primary'; // Same as TICKET_RESOLVED
      }
      
      if (notification.message.toLowerCase().includes('non résolu')) {
        return 'warn'; // Same as TICKET_UNRESOLVED
      }
    }
    
    // Default colors based on read status
    return notification.isRead ? 'accent' : 'primary';
  }

  // Highlight resolution terms in notification messages
  highlightResolutionTerms(message: string): string {
    if (!message) {
      return '';
    }
    
    // Check if the message contains resolution terms
    const containsResolved = message.toLowerCase().includes('résolu') && 
                           !message.toLowerCase().includes('non résolu');
    const containsUnresolved = message.toLowerCase().includes('non résolu');
    
    if (!containsResolved && !containsUnresolved) {
      return message; // Return unchanged if no resolution terms
    }
    
    // Replace resolution terms with highlighted versions
    let highlightedMessage = message;
    
    if (containsResolved) {
      // Use regex with case insensitivity to highlight "résolu" in any case
      highlightedMessage = highlightedMessage.replace(
        /résolu/i, 
        '<span class="highlight-resolved">$&</span>'
      );
    }
    
    if (containsUnresolved) {
      // Use regex with case insensitivity to highlight "non résolu" in any case
      highlightedMessage = highlightedMessage.replace(
        /non résolu/i, 
        '<span class="highlight-unresolved">$&</span>'
      );
    }
    
    return highlightedMessage;
  }

  // Add a helper method to get a summary of notification types
  private getNotificationTypesSummary(): string {
    const typeCounts: Record<string, number> = {};
    
    this.notifications.forEach(n => {
      typeCounts[n.type] = (typeCounts[n.type] || 0) + 1;
    });
    
    return Object.entries(typeCounts)
      .map(([type, count]) => `${type}: ${count}`)
      .join(', ');
  }

  // Method to detect and process resolution notifications
  private detectAndHighlightResolutionNotifications(): void {
    // Only run this once per component initialization to avoid excessive processing
    if (this.processedNotificationIds) {
      return;
    }
    
    // Create a set to track processed notification IDs
    this.processedNotificationIds = new Set<string>();
    
    // Find all resolution notifications - more aggressively check for status changes
    const resolutionNotifications = this.notifications.filter(n => {
      // Skip if already processed
      if (this.processedNotificationIds.has(n.id)) {
        return false;
      }
      
      // Direct resolution notification types
      if (n.type === NotificationType.TICKET_RESOLVED || 
          n.type === NotificationType.TICKET_UNRESOLVED) {
        this.processedNotificationIds.add(n.id);
        return true;
      }
      
      // IMPROVED: Always consider TICKET_STATUS_CHANGED as important
      if (n.type === NotificationType.TICKET_STATUS_CHANGED) {
        this.processedNotificationIds.add(n.id);
        return true;
      }
      
      // Custom property set by the service
      if ((n as any).isResolutionNotification) {
        this.processedNotificationIds.add(n.id);
        return true;
      }
      
      // Check if the message contains any resolution terms
      if (n.message) {
        const lowerMsg = n.message.toLowerCase();
        // Check for any references to ticket resolution or status changes
        if (lowerMsg.includes('résolu') || 
            lowerMsg.includes('resolu') || 
            lowerMsg.includes('terminé') || 
            lowerMsg.includes('termine') || 
            lowerMsg.includes('accepté') ||
            lowerMsg.includes('accepted') ||
            (lowerMsg.includes('statut') && lowerMsg.includes('chang')) ||
            (lowerMsg.includes('status') && lowerMsg.includes('chang'))) {
          this.processedNotificationIds.add(n.id);
          return true;
        }
      }
      
      return false;
    });
    
    if (resolutionNotifications.length > 0) {
      console.log(`[NotificationDialog] Found ${resolutionNotifications.length} resolution notifications:`);
      
      // Process all notifications in batch
      resolutionNotifications.forEach(notification => {
        // Add a special property to resolution notifications for additional handling
        (notification as any).isResolutionNotification = true;
        
        // Force as unread to increase visibility
        if (notification.type === NotificationType.TICKET_STATUS_CHANGED) {
          notification.isRead = false;
        }
        
        // Set a special icon if missing
        if (!notification.icon) {
          if (notification.message && notification.message.toLowerCase().includes('non résolu')) {
            notification.icon = 'replay';
          } else if (notification.message && notification.message.toLowerCase().includes('résolu')) {
            notification.icon = 'done_all';
          } else if (notification.message && 
                    (notification.message.toLowerCase().includes('accepté') || 
                     notification.message.toLowerCase().includes('accepted'))) {
            notification.icon = 'assignment_turned_in';
          } else {
            notification.icon = 'update';
          }
        }
        
        // Add a comment if missing
        if (!notification.comment) {
          if (notification.message && notification.message.toLowerCase().includes('non résolu')) {
            notification.comment = 'Ce ticket nécessite encore du travail';
            (notification as any).isUnresolutionNotification = true;
          } else if (notification.message && notification.message.toLowerCase().includes('résolu')) {
            notification.comment = 'Ce ticket a été résolu avec succès';
          } else if (notification.message && 
                    (notification.message.toLowerCase().includes('accepté') || 
                     notification.message.toLowerCase().includes('accepted'))) {
            notification.comment = 'Ce ticket a été accepté et est en cours de traitement';
          } else {
            notification.comment = 'Changement de statut important du ticket';
          }
        }
      });
    }
  }

  // Helper method to check if notification is from Chef Projet
  isChefProjetNotification(notification: Notification): boolean {
    if (!notification || !notification.message) {
      return false;
    }
    
    const message = notification.message;
    return message.includes('chef de projet') || 
           message.includes('Chef de projet') || 
           message.includes('par le chef projet');
  }

  // Helper methods for template class binding
  isResolutionNotification(notification: Notification): boolean {
    if (notification.type === NotificationType.TICKET_RESOLVED) {
      return true;
    }
    
    if (notification.type === NotificationType.TICKET_STATUS_CHANGED && 
        notification.message && 
        notification.message.toLowerCase().includes('résolu') &&
        !notification.message.toLowerCase().includes('non résolu')) {
      return true;
    }
    
    return false;
  }

  isUnresolutionNotification(notification: Notification): boolean {
    // Check by direct type
    if (notification.type === NotificationType.TICKET_UNRESOLVED) {
      return true;
    }
    
    // Check by status change message
    if (notification.type === NotificationType.TICKET_STATUS_CHANGED && 
        notification.message && 
        (notification.message.toLowerCase().includes('non résolu') || 
         notification.message.toLowerCase().includes('non resolu'))) {
      return true;
    }
    
    // Check for special property
    if ((notification as any).isUnresolutionNotification) {
      return true;
    }
    
    return false;
  }
  
  isHighlightedResolutionNotification(notification: Notification): boolean {
    // Check if this notification has been marked specifically as a resolution notification
    const property = (notification as any).isResolutionNotification;
    return typeof property === 'boolean' ? property : false;
  }

  // Check if there are any read notifications
  hasReadNotifications(): boolean {
    return this.notifications.some(n => n.isRead);
  }

  // Clear only seen (read) notifications
  clearSeenNotifications(): void {
    console.log('[NotificationDialog] Clearing seen notifications');
    
    // Filter out only the read notifications
    const readNotifications = this.notifications.filter(n => n.isRead);
    
    if (readNotifications.length === 0) {
      console.log('[NotificationDialog] No read notifications to clear');
      return;
    }
    
    console.log(`[NotificationDialog] Clearing ${readNotifications.length} read notifications`);
    
    // Get current unread notifications to keep
    const unreadNotifications = this.notifications.filter(n => !n.isRead);
    
    // Use public methods to update the service
    // Create a new array with unread notifications only
    const currentNotifications = this.notificationService.getNotificationsForCurrentUser();
    const updatedNotifications = currentNotifications.filter(n => !n.isRead);
    
    // Use proper public methods to update storage
    this.notificationService.clearNotifications(); // First clear all
    
    // Then add back the unread notifications one by one
    updatedNotifications.forEach(notification => {
      // Add notification without id, timestamp and isRead as they'll be generated
      this.notificationService.addNotification({
        message: notification.message,
        route: notification.route,
        type: notification.type,
        relatedId: notification.relatedId,
        userId: notification.userId,
        icon: notification.icon,
        comment: notification.comment
      });
    });
    
    // Update local notifications
    this.notifications = updatedNotifications;
    this.importantNotifications = this.importantNotifications.filter(n => !n.isRead);
    this.otherNotifications = this.otherNotifications.filter(n => !n.isRead);
    this.hasUnread = updatedNotifications.length > 0;
    this.unreadCount = updatedNotifications.length;
    
    // Show success message
    this.notificationService.showSnackbarNotification(
      `${readNotifications.length} notifications lues effacées`,
      'OK'
    );
  }
} 