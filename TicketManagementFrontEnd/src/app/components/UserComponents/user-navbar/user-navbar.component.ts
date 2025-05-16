import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDialog } from '@angular/material/dialog';
import { MatMenuModule } from '@angular/material/menu';
import { NotificationService, NotificationType } from '../../../services/notification.service';
import { NotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { Subscription } from 'rxjs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NavigationEnd } from '@angular/router';

@Component({
  selector: 'app-user-navbar',
  templateUrl: './user-navbar.component.html',
  styleUrls: ['./user-navbar.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    MatIconModule,
    MatButtonModule,
    RouterModule,
    MatTooltipModule,
    MatBadgeModule,
    MatMenuModule,
  ],
})
export class UserNavbarComponent implements OnInit, OnDestroy {
  unreadNotifications = 0;
  private notificationSubscription: Subscription | null = null;
  notifications: any[] = [];
  unreadCount: number = 0;
  isDeveloperMode = true; // Enable test tools

  constructor(
    private router: Router, 
    private auth: AuthService,
    private dialog: MatDialog,
    private notificationService: NotificationService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Show what component we're in and when it was loaded
    console.log(`[UserNavbar] Component initialized at ${new Date().toISOString()}`);
    
    // Load notifications immediately in multiple ways to ensure they appear
    this.loadUser();
    
    // IMMEDIATE LOAD: Call the auth service's loader which ensures fast notification display
    try {
      if (this.auth['loadUserNotifications']) {
        console.log('[UserNavbar] 🔄 Calling auth.loadUserNotifications for immediate notifications');
        this.auth['loadUserNotifications']();
      }
    } catch (e) {
      console.error('[UserNavbar] Error calling loadUserNotifications:', e);
    }
    
    // Subscribe to notification changes
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      console.log(`[UserNavbar] Received ${notifications.length} notifications`);
      
      // Filter for current user ID
      const currentUserId = Number(localStorage.getItem('userId') || '0');
      this.notifications = notifications.filter(n => n.userId === currentUserId);
      
      // Update unread count
      this.unreadCount = this.notifications.filter(n => !n.isRead).length;
      
      // Special check for resolution notifications that may have been missed
      const resolutionNotifications = notifications.filter(
        n => (n.type === 'TICKET_RESOLVED' || n.type === 'TICKET_UNRESOLVED' || 
            (n.type === 'TICKET_STATUS_CHANGED' && 
            (n.message?.includes('résolu') || n.message?.includes('Résolu')))) && 
            !n.isRead
      );
      
      // Log found notifications for debugging
      console.log(`[UserNavbar] Found ${notifications.length} notifications (${this.unreadCount} unread)`);
      
      // If we have unread resolution notifications, highlight them
      if (resolutionNotifications.length > 0) {
        console.log(`[UserNavbar] Found ${resolutionNotifications.length} unread resolution notifications!`);
        
        // Check if any resolution notifications are recent (within the last hour)
        const recentResolutionNotifications = resolutionNotifications.filter(n => {
          const notificationTime = n.timestamp instanceof Date ? 
            n.timestamp : new Date(n.timestamp);
          const ageMs = Date.now() - notificationTime.getTime();
          return ageMs < 3600000; // Within last hour (3600000ms = 1 hour)
        });
        
        if (recentResolutionNotifications.length > 0) {
          // Display a snackbar for the most recent resolution notification
          const mostRecent = recentResolutionNotifications.sort((a, b) => {
            const timeA = a.timestamp instanceof Date ? a.timestamp : new Date(a.timestamp);
            const timeB = b.timestamp instanceof Date ? b.timestamp : new Date(b.timestamp);
            return timeB.getTime() - timeA.getTime();
          })[0];
          
          // Display notification if it hasn't been shown recently (use local storage to track)
          const notificationKey = `shown_${mostRecent.id}`;
          if (!localStorage.getItem(notificationKey)) {
            this.notificationService.showSnackbarNotification(
              mostRecent.message, 
              'Voir Ticket'
            );
            // Mark as shown to avoid repeated display
            localStorage.setItem(notificationKey, Date.now().toString());
            console.log(`[UserNavbar] Displayed resolution notification: ${mostRecent.message}`);
          }
        }
      }
    });
    
    // Subscribe to notification count changes
    this.notificationService.notificationCount$.subscribe(count => {
      this.unreadNotifications = count;
    });
    
    // Subscribe to route changes
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Force refresh notifications on navigation
        console.log('[UserNavbar] 🔄 Navigation detected, refreshing notifications');
        try {
          // Refresh notifications on navigation
          this.notificationService.refreshNotifications();
          
          // Also try the auth service's fast loader
          if (this.auth['loadUserNotifications']) {
            this.auth['loadUserNotifications']();
          }
        } catch (e) {
          console.error('[UserNavbar] Error refreshing notifications on navigation:', e);
        }
      }
    });
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.auth.logout();
  }
  
  openProfileDirectly(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    window.location.href = window.location.origin + '/user-profile';
  }

  openNotificationDialog(): void {
    console.log('[UserNavbar] Opening notification dialog');
    
    // Check specifically for resolution notifications - use more flexible matching
    const resolutionNotifications = this.notifications.filter(n => {
      // Check by type
      if (n.type === NotificationType.TICKET_RESOLVED || 
          n.type === NotificationType.TICKET_UNRESOLVED) {
        return true;
      }
      
      // Check by status change with resolution message
      if (n.type === NotificationType.TICKET_STATUS_CHANGED && 
          n.message && 
          (n.message.toLowerCase().includes('résolu') || 
           n.message.toLowerCase().includes('resolu'))) {
        return true;
      }
      
      // Check for special property added by service
      if ((n as any).isResolutionNotification) {
        return true;
      }
      
      return false;
    });
    
    // Log found resolution notifications
    if (resolutionNotifications.length > 0) {
      console.log(`[UserNavbar] Found ${resolutionNotifications.length} resolution notifications to highlight in dialog`);
      
      // Make sure they're properly marked for highlighting
      resolutionNotifications.forEach(notification => {
        (notification as any).isResolutionNotification = true;
        
        // Add special icon if missing
        if (!notification.icon) {
          notification.icon = notification.type === NotificationType.TICKET_RESOLVED ? 
            'done_all' : (notification.type === NotificationType.TICKET_UNRESOLVED ? 'replay' : 'update');
        }
        
        // Add comment if missing
        if (!notification.comment) {
          if (notification.type === NotificationType.TICKET_RESOLVED || 
              (notification.message && notification.message.toLowerCase().includes('résolu') && 
               !notification.message.toLowerCase().includes('non résolu'))) {
            notification.comment = 'Ce ticket a été résolu avec succès';
          } else {
            notification.comment = 'Ce ticket nécessite encore du travail';
          }
        }
      });
    }
    
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '450px',
      maxHeight: '80vh',
      panelClass: 'notification-dialog',
      data: { 
        notifications: this.notifications,
        highlightResolutionNotifications: true // Tell dialog to highlight resolution notifications
      }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Force refresh notifications after dialog closes
      this.notificationService.refreshNotifications();
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  private loadUser(): void {
    // Get current user info for logging
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = localStorage.getItem('userRole') || '';
    
    console.log('[UserNavbar] 🔔 Initializing notification subscription');
    console.log(`[UserNavbar] Current user ID: ${currentUserId}, Role: ${currentUserRole}`);
    
    // IMMEDIATE LOAD: Refresh notifications on init in multiple ways for redundancy
    console.log('[UserNavbar] 🔄 Refreshing notifications immediately');
    
    // First refresh from storage which is fastest
    this.notificationService.refreshFromStorage();
    
    // Then refresh from API to get latest data
    this.notificationService.refreshNotifications();
    
    // Retry after a short delay in case the first attempt fails
    setTimeout(() => {
      console.log('[UserNavbar] 🔄 Performing secondary notification refresh');
      this.notificationService.refreshNotifications();
    }, 1000);
  }

  // Method to create a test resolution notification
  createTestResolutionNotification(): void {
    console.log('[UserNavbar] Creating test resolution notification');
    
    // Create a standard TICKET_RESOLVED notification
    this.notificationService.createTestResolutionNotification();
    
    // Also create a status change notification that should be detected as resolution
    setTimeout(() => {
      console.log('[UserNavbar] Creating test status change notification');
      
      // Get sample data for test notification
      const userId = Number(localStorage.getItem('userId') || '0');
      const ticketId = 55; // Use a valid ticket ID from your system
      
      // Create a TICKET_STATUS_CHANGED notification manually
      const statusChangeNotification = {
        id: `test_status_change_${Date.now()}`,
        message: `Le statut de votre ticket "Test Ticket" a été mis à jour de "Open" à "ACCEPTED"`,
        type: NotificationType.TICKET_STATUS_CHANGED,
        timestamp: new Date(),
        isRead: false,
        relatedId: ticketId,
        route: `/user/mes-tickets/${ticketId}`,
        userId,
        // Add special properties for highlighting
        icon: 'assignment_turned_in',
        comment: 'Ce ticket a été accepté et est en cours de traitement'
      };
      
      // Add special flag for resolution
      (statusChangeNotification as any).isResolutionNotification = true;
      
      // Add to notifications - fix access to BehaviorSubject
      // Get notifications from the service directly to avoid linter errors
      this.notificationService.refreshFromStorage();
      
      // Use the public method to add the notification
      this.notificationService.addNotification({
        message: statusChangeNotification.message,
        route: statusChangeNotification.route,
        type: statusChangeNotification.type,
        relatedId: statusChangeNotification.relatedId,
        userId: statusChangeNotification.userId,
        icon: statusChangeNotification.icon,
        comment: statusChangeNotification.comment
      });
      
      // Show snackbar
      this.notificationService.showSnackbarNotification(
        'Notification de test créée: ' + statusChangeNotification.message, 
        'Voir Ticket'
      );
      
      console.log('[UserNavbar] Test status change notification created:', statusChangeNotification);
    }, 1000);
  }

  // Create a test notification for status ACCEPTED
  createTestStatusAcceptedNotification(): void {
    console.log('[UserNavbar] Creating test ACCEPTED status notification');
    
    const userId = Number(localStorage.getItem('userId') || '0');
    const ticketId = 55; // Use a valid ticket ID
    
    // Create a notification for status change to ACCEPTED
    this.notificationService.createResolutionFromStatusChange(
      'Test Ticket', 
      ticketId, 
      'Open', 
      'ACCEPTED', 
      userId
    );
  }
  
  // Create a test notification for generic status change
  createTestStatusChangeNotification(): void {
    console.log('[UserNavbar] Creating test status change notification');
    
    const userId = Number(localStorage.getItem('userId') || '0');
    const ticketId = 55; // Use a valid ticket ID
    
    // Create a notification for a generic status change
    this.notificationService.createResolutionFromStatusChange(
      'Test Ticket', 
      ticketId, 
      'Open', 
      'In Progress', 
      userId
    );
  }

  // Create a test notification for unresolved status
  createTestUnresolvedNotification(): void {
    console.log('[UserNavbar] Creating test UNRESOLVED notification');
    
    // Use the notification service method
    this.notificationService.createTestUnresolvedNotification();
    
    // Show a snackbar
    this.snackBar.open('Test notification non résolu créée', 'Fermer', {
      duration: 3000
    });
  }

  // Create a test notification for unresolved status from status change
  createTestUnresolvedStatusChangeNotification(): void {
    console.log('[UserNavbar] Creating test UNRESOLVED from status change notification');
    
    const userId = Number(localStorage.getItem('userId') || '0');
    const ticketId = 55; // Use a valid ticket ID
    
    // Create a notification for unresolved status from status change
    this.notificationService.createUnresolvedFromStatusChange(
      'Test Ticket', 
      ticketId, 
      'Résolu', 
      userId
    );
  }

  // Test notification synchronization
  testSynchronizeNotifications(): void {
    console.log('[UserNavbar] Testing notification synchronization');
    
    // Show a loading indicator
    this.snackBar.open('Synchronisation des notifications en cours...', '', {
      duration: 2000
    });
    
    // Access the private method via any cast
    (this.notificationService as any).synchronizeNotificationsWithBackend();
    
    // Force refresh after a short delay
    setTimeout(() => {
      this.notificationService.refreshNotifications();
      this.snackBar.open('Synchronisation terminée', 'OK', {
        duration: 3000
      });
    }, 3000);
  }
}
