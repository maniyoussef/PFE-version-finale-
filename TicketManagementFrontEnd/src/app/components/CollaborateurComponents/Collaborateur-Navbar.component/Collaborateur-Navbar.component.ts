// collaborateur-navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../services/auth.service';
import { MaterialModule } from '../../../shared/material.module';
import { MatDialog } from '@angular/material/dialog';
import { 
  NotificationService, 
  Notification,
  NotificationType
} from '../../../services/notification.service';
import { Subscription } from 'rxjs';
import { CollaborateurNotificationDialogComponent } from '../notification-dialog/notification-dialog.component';

@Component({
  selector: 'app-collaborateur-navbar',
  templateUrl: './Collaborateur-Navbar.component.html',
  styleUrls: ['./Collaborateur-Navbar.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MaterialModule
  ]
})
export class CollaborateurNavbarComponent implements OnInit, OnDestroy {
  notificationCount = 0;
  unreadNotifications = 0;
  private notificationSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private dialog: MatDialog,
    public notificationService: NotificationService
  ) {}

  ngOnInit(): void {
    // Get current user info for logging
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = localStorage.getItem('userRole') || '';
    console.log(`[CollaborateurNavbar] Current user ID: ${currentUserId}, Role: ${currentUserRole}`);
    
    // Subscribe to notification updates
    this.notificationSubscription = this.notificationService.notifications$
      .subscribe(notifications => {
        // Use the service's filtered count method
        this.notificationCount = this.notificationService.getUnreadCountForCurrentUser();
        this.unreadNotifications = this.notificationCount;
        
        console.log(`[CollaborateurNavbar] Found ${this.notificationService.getNotificationsForCurrentUser().length} notifications (${this.notificationCount} unread)`);
      });
      
    // Force a refresh of notifications to ensure we have the latest counts
    if (this.notificationService.refreshFromStorage) {
      console.log('[CollaborateurNavbar] Refreshing notifications from storage');
      this.notificationService.refreshFromStorage();
    }

    // Synchronize with backend every 2 minutes
    setInterval(() => {
      this.notificationService.synchronizeWithBackend().subscribe({
        next: () => console.log('[CollaborateurNavbar] Successfully synchronized notifications with backend'),
        error: err => console.error('[CollaborateurNavbar] Error synchronizing notifications:', err)
      });
    }, 120000); // 2 minutes
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.authService.logout();
  }

  openNotificationDialog(): void {
    console.log('[CollaborateurNavbar] Opening notification dialog');
    
    // Refresh notifications before opening dialog
    this.notificationService.refreshFromStorage();
    
    // Open the notification dialog
    this.dialog.open(CollaborateurNotificationDialogComponent, {
      width: '480px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      data: {}
    });
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'COMMENT_ADDED':
        return 'comment';
      case 'TICKET_STATUS_CHANGED':
        return 'update';
      case 'TICKET_ASSIGNED':
        return 'assignment_ind';
      case 'NEW_TICKET':
        return 'add_circle';
      case 'TICKET_RESOLVED':
        return 'done_all';
      default:
        return 'notifications';
    }
  }

  // Helper methods for the template
  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  getCurrentUserNotifications(): Notification[] {
    return this.notificationService.getNotificationsForCurrentUser();
  }

  navigateToNotification(route: string, notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
    this.router.navigateByUrl(route);
  }

  // Method to test collaborateur notifications
  testCollaborateurNotifications(): void {
    const userId = Number(localStorage.getItem('userId') || '0');
    
    this.notificationService.addNotification({
      message: 'TEST - Vous avez été assigné à un ticket',
      route: '/collaborateur/tickets/123',
      type: NotificationType.TICKET_ASSIGNED,
      userId: userId,
      relatedId: 123
    });
    
    this.notificationService.showSnackbarNotification(
      'Notification de test créée avec succès!',
      'OK'
    );
  }
}
