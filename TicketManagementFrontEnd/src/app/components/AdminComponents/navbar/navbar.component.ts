import { Component, OnInit, OnDestroy } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule } from '@angular/common';
import { RouterLink, Router, NavigationEnd } from '@angular/router';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../../../services/auth.service';
import {
  NotificationService,
  UserRole,
  Notification,
  NotificationType
} from '../../../services/notification.service';
import { AdminNotificationDialogComponent } from '../notification-dialog/notification-dialog.component';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule,
    MatButtonModule
  ],
})
export class NavbarComponent implements OnInit, OnDestroy {
  notificationCount: number = 0;
  unreadNotifications: number = 0;
  unreadCount: number = 0;
  private notificationSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;
  notifications: Notification[] = [];
  showDebugTools: boolean = false;
  notificationMenuOpen = false;

  constructor(
    private router: Router,
    private auth: AuthService,
    public notificationService: NotificationService,
    private dialog: MatDialog
  ) {}

  ngOnInit(): void {
    // Load user immediately
    this.loadUser();
    
    // IMMEDIATE LOAD: Call the auth service's method that ensures fast notification display
    try {
      // Use type assertion to access the method safely
      const authService = this.auth as any;
      if (typeof authService.loadUserNotifications === 'function') {
        console.log('[AdminNavbar] 🔄 Calling auth.loadUserNotifications for immediate notifications');
        authService.loadUserNotifications();
      }
    } catch (e) {
      console.error('[AdminNavbar] Error calling loadUserNotifications:', e);
    }
    
    // Subscribe to notification updates
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      console.log(`[AdminNavbar] Received ${notifications.length} notifications`);
      
      // Filter for admin-relevant notifications
      this.updateAdminNotifications(notifications);
      
      // Update unread count
      this.unreadCount = this.notifications.filter(notification => !notification.isRead).length;
      this.unreadNotifications = this.unreadCount;
    });
    
    // Subscribe to route changes to refresh notifications on navigation
    this.routerSubscription = this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Force refresh notifications on navigation
        console.log('[AdminNavbar] 🔄 Navigation detected, refreshing notifications');
        try {
          // Refresh notifications on navigation
          this.notificationService.refreshNotifications();
          
          // Also try the auth service's fast loader
          const authService = this.auth as any;
          if (typeof authService.loadUserNotifications === 'function') {
            authService.loadUserNotifications();
          }
        } catch (e) {
          console.error('[AdminNavbar] Error refreshing notifications on navigation:', e);
        }
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up subscriptions to prevent memory leaks
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
    
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  logout(): void {
    this.auth.logout();
  }

  openNotificationDialog(): void {
    const dialogRef = this.dialog.open(AdminNotificationDialogComponent, {
      width: '450px',
      maxHeight: '80vh',
      data: { notifications: this.notifications }
    });

    dialogRef.afterClosed().subscribe(() => {
      // Force refresh after dialog closes
      this.notificationService.refreshNotifications();
    });
  }

  navigateTo(route: string): void {
    this.router.navigateByUrl(route);
  }

  private loadUser(): void {
    // Get current user info for logging
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = localStorage.getItem('userRole') || '';
    
    console.log('[AdminNavbar] 🔔 Initializing notification subscription');
    console.log(`[AdminNavbar] Current user ID: ${currentUserId}, Role: ${currentUserRole}`);
    
    // IMMEDIATE LOAD: Refresh notifications in multiple ways for redundancy
    console.log('[AdminNavbar] 🔄 Refreshing notifications immediately');
    
    // First refresh from storage which is fastest
    if (typeof this.notificationService.refreshFromStorage === 'function') {
      this.notificationService.refreshFromStorage();
    }
    
    // Then refresh from API to get latest data
    this.notificationService.refreshNotifications();
    
    // Retry after a short delay in case the first attempt fails
    setTimeout(() => {
      console.log('[AdminNavbar] 🔄 Performing secondary notification refresh');
      this.notificationService.refreshNotifications();
    }, 1000);
  }

  private updateAdminNotifications(notifications: Notification[]): void {
    // Get current user ID for filtering
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = localStorage.getItem('userRole') || '';
    
    console.log(`[AdminNavbar] 🔍 Filtering notifications for admin. User ID: ${currentUserId}, Role: ${currentUserRole}`);
    console.log(`[AdminNavbar] 📊 Total notifications available: ${notifications.length}`);
    
    // Log notification types for debugging
    const notificationTypes = notifications.map(n => n.type);
    const uniqueTypes = [...new Set(notificationTypes)];
    console.log(`[AdminNavbar] 🏷️ Notification types in system: ${uniqueTypes.join(', ')}`);
    
    // Filter notifications for admin
    // 1. Get notifications specifically for this admin user
    const adminDirectNotifications = notifications.filter(n => n.userId === currentUserId);
    console.log(`[AdminNavbar] 👤 Direct notifications for admin: ${adminDirectNotifications.length}`);
    
    // 2. Also get important notifications that admins should see regardless of userId
    const adminRelevantNotifications = notifications.filter(n => {
      // Include status change notifications
      const isStatusChange = n.type === NotificationType.TICKET_STATUS_CHANGED;
      
      // Include new ticket notifications
      const isNewTicket = n.type === NotificationType.NEW_TICKET;
      
      // Tickets that are in high priority/urgent status
      const isUrgent = n.message && 
        (n.message.toLowerCase().includes('urgent') || 
         n.message.toLowerCase().includes('high priority'));
      
      // Tickets with reported problems
      const isReported = n.message && 
        (n.message.toLowerCase().includes('report') || 
         n.message.toLowerCase().includes('problem'));
      
      return isStatusChange || isNewTicket || isUrgent || isReported;
    });
    
    console.log(`[AdminNavbar] 🚩 Relevant notifications for admin: ${adminRelevantNotifications.length}`);
    if (adminRelevantNotifications.length > 0) {
      console.log(`[AdminNavbar] Sample relevant notification: ${JSON.stringify(adminRelevantNotifications[0])}`);
    }
    
    // Combine direct and relevant notifications, removing duplicates
    const allAdminNotifications = [...adminDirectNotifications];
    
    // Add relevant notifications if they're not already included
    adminRelevantNotifications.forEach(n => {
      if (!allAdminNotifications.some(existing => existing.id === n.id)) {
        allAdminNotifications.push(n);
      }
    });
    
    // Sort by timestamp (newest first)
    allAdminNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Update the component's notifications list
    this.notifications = allAdminNotifications;
    
    // Count unread notifications
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    this.notificationCount = this.unreadCount;
    
    console.log(`[AdminNavbar] ✅ Updated admin notifications: ${this.notifications.length} total, ${this.unreadCount} unread`);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'COMMENT':
      case 'COMMENT_ADDED':
        return 'comment';
      case 'STATUS_CHANGE':
      case 'TICKET_STATUS_CHANGED':
        return 'update';
      case 'ASSIGNMENT':
      case 'TICKET_ASSIGNED':
        return 'assignment_ind';
      case 'NEW_TICKET':
        return 'add_circle';
      case 'TICKET_ACCEPTED':
        return 'check_circle';
      case 'TICKET_REFUSED':
        return 'cancel';
      case 'TICKET_RESOLVED':
        return 'done_all';
      case 'REPORT_CREATED':
        return 'description';
      default:
        return 'notifications';
    }
  }

  /**
   * Handle opening the notification menu
   */
  openNotificationMenu(): void {
    console.log('[NavbarComponent] Opening notification menu');
    this.notificationMenuOpen = true;
    
    // Refresh notifications when opening the menu
    this.notificationService.refreshFromStorage();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    console.log('[NavbarComponent] Marking all notifications as read');
    this.notificationService.markAllAsRead();
  }

  /**
   * Get notifications for the current user
   */
  getCurrentUserNotifications(): Notification[] {
    return this.notificationService.getNotificationsForCurrentUser();
  }

  /**
   * Navigate to a notification destination and mark it as read
   */
  navigateToNotification(route: string, notificationId: string): void {
    console.log(`[NavbarComponent] Navigating to notification route: ${route}`);
    
    // Mark notification as read
    this.notificationService.markAsRead(notificationId);
    
    // Navigate to the route
    this.router.navigateByUrl(route);
  }
}
