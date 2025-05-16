import { Component, OnInit, OnDestroy, Inject, PLATFORM_ID } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { MatBadgeModule } from '@angular/material/badge';
import { MatDividerModule } from '@angular/material/divider';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { NotificationService, Notification } from '../../../services/notification.service';
import { RouterLink, Router, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { Subscription } from 'rxjs';
import { NotificationDialogComponent } from '../../UserComponents/notification-dialog/notification-dialog.component';
import { NavigationEnd } from '@angular/router';

// Define the interface for projects to fix TypeScript errors
interface Project {
  id: number;
  name: string;
  description?: string;
  [key: string]: any; // Allow other properties
}

@Component({
  standalone: true,
  selector: 'app-chef-projet-navbar',
  templateUrl: './chef-projet-navbar.component.html',
  styleUrls: ['./chef-projet-navbar.component.scss'],
  imports: [
    MatToolbarModule,
    CommonModule,
    RouterLink,
    RouterLinkActive,
    MatIconModule,
    MatMenuModule,
    MatBadgeModule,
    MatDividerModule,
    MatTooltipModule
  ],
})
export class ChefProjetNavbarComponent implements OnInit, OnDestroy {
  unreadNotifications = 0;
  notifications: Notification[] = [];
  private notificationSubscription: Subscription | null = null;
  logoUrl = '/logo.png'; // Directly set to the correct path

  constructor(
    public notificationService: NotificationService,
    private router: Router,
    private auth: AuthService,
    private dialog: MatDialog,
    @Inject(PLATFORM_ID) private platformId: Object
  ) {
    // Remove complex image loading logic that might be causing issues
  }

  ngOnInit(): void {
    // Load user immediately
    this.loadUser();
    
    // IMMEDIATE LOAD: Call the auth service's method that ensures fast notification display
    try {
      // Use type assertion to access the method safely
      const authService = this.auth as any;
      if (typeof authService.loadUserNotifications === 'function') {
        console.log('[ChefProjetNavbar] 🔄 Calling auth.loadUserNotifications for immediate notifications');
        authService.loadUserNotifications();
      }
    } catch (e) {
      console.error('[ChefProjetNavbar] Error calling loadUserNotifications:', e);
    }
    
    // Subscribe to notification updates
    this.notificationSubscription = this.notificationService.notifications$.subscribe(notifications => {
      console.log(`[ChefProjetNavbar] Received ${notifications.length} notifications`);
      
      // Process notifications specifically for chef projet
      this.updateChefProjetNotifications(notifications);
    });
    
    // Subscribe to notification count
    this.notificationService.notificationCount$.subscribe(count => {
      this.unreadNotifications = count;
    });
    
    // Subscribe to route changes to refresh notifications on navigation
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationEnd) {
        // Force refresh notifications on navigation
        console.log('[ChefProjetNavbar] 🔄 Navigation detected, refreshing notifications');
        try {
          // Refresh notifications on navigation
          this.notificationService.refreshNotifications();
          
          // Also try the auth service's fast loader
          const authService = this.auth as any;
          if (typeof authService.loadUserNotifications === 'function') {
            authService.loadUserNotifications();
          }
        } catch (e) {
          console.error('[ChefProjetNavbar] Error refreshing notifications on navigation:', e);
        }
      }
    });
  }
  
  private loadUser(): void {
    // Get current user info for logging
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    const currentUserRole = localStorage.getItem('userRole') || '';
    
    console.log('[ChefProjetNavbar] 🔔 Initializing notification subscription');
    console.log(`[ChefProjetNavbar] Current user ID: ${currentUserId}, Role: ${currentUserRole}`);
    
    // IMMEDIATE LOAD: Refresh notifications in multiple ways for redundancy
    console.log('[ChefProjetNavbar] 🔄 Refreshing notifications immediately');
    
    // First refresh from storage which is fastest
    if (typeof this.notificationService.refreshFromStorage === 'function') {
      this.notificationService.refreshFromStorage();
    }
    
    // Then refresh from API to get latest data
    this.notificationService.refreshNotifications();
    
    // Retry after a short delay in case the first attempt fails
    setTimeout(() => {
      console.log('[ChefProjetNavbar] 🔄 Performing secondary notification refresh');
      this.notificationService.refreshNotifications();
    }, 1000);
  }
  
  private updateChefProjetNotifications(notifications: Notification[]): void {
    // Get current user ID for filtering
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    
    // Filter notifications for chef projet - they need to see all project-related notifications
    // 1. Get notifications specifically for this chef projet user
    const directNotifications = notifications.filter(n => n.userId === currentUserId);
    
    // 2. Also get notifications that chef projets should see regardless of userId
    const projectNotifications = notifications.filter(n => {
      // Look for anything ticket or assignment related
      return (n.message && 
              (n.message.toLowerCase().includes('ticket') || 
               n.message.toLowerCase().includes('assigné') ||
               n.message.toLowerCase().includes('projet'))) ||
             n.type === 'TICKET_ASSIGNED' ||
             n.type === 'NEW_TICKET';
    });
    
    // Combine direct and project notifications, removing duplicates
    const allChefProjetNotifications = [...directNotifications];
    
    // Add project notifications if they're not already included
    projectNotifications.forEach(n => {
      if (!allChefProjetNotifications.some(existing => existing.id === n.id)) {
        allChefProjetNotifications.push(n);
      }
    });
    
    // Sort by timestamp (newest first)
    allChefProjetNotifications.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Update the component's notifications list
    this.notifications = allChefProjetNotifications;
    
    // Count unread notifications
    this.unreadNotifications = this.notifications.filter(n => !n.isRead).length;
    
    console.log(`[ChefProjetNavbar] Updated chef projet notifications: ${this.notifications.length} total, ${this.unreadNotifications} unread`);
  }

  ngOnDestroy(): void {
    if (this.notificationSubscription) {
      this.notificationSubscription.unsubscribe();
    }
  }

  // Open notification dialog instead of menu
  openNotificationDialog(): void {
    console.log('[ChefProjetNavbar] Opening notification dialog');
    
    // Refresh notifications before opening dialog
    this.notificationService.refreshNotifications();
    
    // Get notifications for current user
    const notifications = this.notificationService.getNotificationsForCurrentUser();
    
    // Open dialog with notifications using refined styling
    const dialogRef = this.dialog.open(NotificationDialogComponent, {
      width: '400px',
      maxHeight: '80vh',
      panelClass: 'notification-dialog',
      autoFocus: false,
      data: {
        notifications: notifications,
        highlightResolutionNotifications: true,
        enableClearSeenButton: true, // Pass flag to enable the clear seen button
      },
    });
    
    // Handle dialog close
    dialogRef.afterClosed().subscribe(result => {
      console.log('[ChefProjetNavbar] Notification dialog closed');
      
      // Refresh notifications after dialog is closed
      setTimeout(() => this.notificationService.refreshNotifications(), 300);
    });
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  navigateToNotification(route: string, notificationId: string): void {
    this.markAsRead(notificationId);
    this.router.navigateByUrl(route);
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case 'COMMENT_ADDED':
        return 'comment';
      case 'TICKET_STATUS_CHANGED':
        return 'update';
      case 'TICKET_ASSIGNED':
        return 'assignment_ind';
      case 'TICKET_RESOLVED':
        return 'done_all';
      case 'TICKET_UNRESOLVED':
        return 'replay';
      case 'NEW_TICKET':
        return 'add_circle';
      default:
        return 'notifications';
    }
  }

  logout(): void {
    this.auth.logout();
  }

  // Debug function to fix chef projet notifications
  fixNotifications(): void {
    console.log('[ChefProjetNavbar] Running notification debug and repair utility');
    
    // Check if fix is already in progress
    if (localStorage.getItem('chef_projet_fix_running') === 'true') {
      console.log('[ChefProjetNavbar] Notification repair already in progress, skipping duplicate request');
      this.notificationService.showSnackbarNotification(
        'Réparation déjà en cours...', 
        'OK'
      );
      return;
    }
    
    // Set flag to prevent duplicate calls
    localStorage.setItem('chef_projet_fix_running', 'true');
    
    this.notificationService.debugChefProjetAssociations();
    
    // Also manually call refreshNotifications on the service after a delay to ensure
    // the debugChefProjetAssociations has completed
    setTimeout(() => {
      this.notificationService.refreshNotifications();
      console.log('[ChefProjetNavbar] Forced notification refresh');
      
      // Clear fix flag
      localStorage.removeItem('chef_projet_fix_running');
      
      // Show a snackbar to indicate the process is complete
      this.notificationService.showSnackbarNotification(
        'Réparation des notifications terminée', 
        'OK'
      );
    }, 2000);
  }

  // Debug function to fix duplicate notifications
  fixDuplicateNotifications(): void {
    console.log('[ChefProjetNavbar] Running duplicate notification cleanup');
    this.notificationService.fixDuplicateBackendNotifications();
    
    // Show a snackbar to indicate the process is running
    this.notificationService.showSnackbarNotification(
      'Suppression des notifications en double...', 
      'OK'
    );
  }

  // Emergency fix for chef projet notifications
  emergencyFix(): void {
    console.log('[ChefProjetNavbar] Running EMERGENCY notification fix');
    
    // Show a snackbar to indicate the process is running
    this.notificationService.showSnackbarNotification(
      'Réparation des notifications de Chef Projet en cours...', 
      'OK'
    );
    
    // First check if user is Chef Projet
    const userId = Number(localStorage.getItem('userId') || '0');
    const userRole = localStorage.getItem('userRole') || '';
    
    if (!userId || !userRole.toLowerCase().includes('chef')) {
      console.error('[ChefProjetNavbar] Emergency fix must be run as Chef Projet');
      this.notificationService.showError('Cette réparation nécessite des droits de Chef Projet');
      return;
    }
    
    // 1. First run the standard emergency fix
    this.notificationService.emergencyChefProjetNotificationFix();
    
    // 2. Create all missing notification types directly
    console.log('[ChefProjetNavbar] Creating test notifications for all event types');
    
    // Set flag to prevent multiple executions
    localStorage.setItem('emergency_fix_running', 'true');
    
    // Find a project for this Chef Projet to add notifications for
    this.notificationService.getProjectsForChefProjet().subscribe({
      next: (projects: Project[]) => {
        if (!projects || projects.length === 0) {
          console.error('[ChefProjetNavbar] No projects found for Chef Projet');
          this.notificationService.showError('Aucun projet trouvé pour ce Chef Projet');
          return;
        }
        
        // Use the first project
        const project = projects[0];
        console.log(`[ChefProjetNavbar] Using project ${project.id} (${project.name}) for test notifications`);
        
        // Create each notification type with some delay between each
        setTimeout(() => {
          // NEW_TICKET notification - often missing
          this.notificationService.createNewTicketNotificationForChefProjet(
            999, // Use a dummy ticket ID
            'TEST - Nouveau ticket', 
            project.id,
            'Test Système'
          );
        }, 500);
        
        setTimeout(() => {
          // TICKET_RESOLVED notification - often missing
          this.notificationService.createResolutionNotificationForChefProjet(
            999, // Use a dummy ticket ID
            'TEST - Ticket résolu', 
            project.id,
            true, // resolved = true
            'Test Système'
          );
        }, 1000);
        
        setTimeout(() => {
          // TICKET_UNRESOLVED notification
          this.notificationService.createResolutionNotificationForChefProjet(
            999, // Use a dummy ticket ID
            'TEST - Ticket non résolu', 
            project.id,
            false, // resolved = false
            'Test Système'
          );
        }, 1500);
        
        setTimeout(() => {
          // TICKET_STATUS_CHANGED notification - often missing
          this.notificationService.notifyChefProjetForTicketEvent(
            999, // Use a dummy ticket ID
            'TICKET_STATUS_CHANGED',
            'Test Système'
          );
        }, 2000);
        
        setTimeout(() => {
          // COMMENT_ADDED notification
          this.notificationService.notifyChefProjetForTicketEvent(
            999, // Use a dummy ticket ID
            'COMMENT_ADDED',
            'Test Système'
          );
        }, 2500);
        
        // Final step - refresh notifications and clear flag
        setTimeout(() => {
          console.log('[ChefProjetNavbar] Emergency fix completed, refreshing notifications');
          this.notificationService.refreshNotifications();
          localStorage.removeItem('emergency_fix_running');
          this.notificationService.showSuccess('Réparation terminée. Toutes les notifications de test ont été créées.');
        }, 3500);
      },
      error: (err: any) => {
        console.error('[ChefProjetNavbar] Error fetching projects for Chef Projet:', err);
        this.notificationService.showError('Erreur lors de la récupération des projets');
        localStorage.removeItem('emergency_fix_running');
      }
    });
  }

  // Test API connectivity
  testApi(): void {
    console.log('[ChefProjetNavbar] Testing API connectivity');
    this.notificationService.testDirectApiCall();
    
    // Also test the specific notification endpoints that we need
    const userId = Number(localStorage.getItem('userId') || '0');
    
    if (userId) {
      // Test user-specific notification endpoint
      this.notificationService.testUserNotificationsEndpoint(userId);
    }
  }

  // Force refresh notifications from backend
  forceRefresh(): void {
    console.log('[ChefProjetNavbar] Force refreshing notifications from backend');
    
    // Check if refresh is already in progress
    if (localStorage.getItem('sync_in_progress') === 'true') {
      console.log('[ChefProjetNavbar] Refresh already in progress, skipping duplicate request');
      this.notificationService.showSnackbarNotification(
        'Actualisation déjà en cours...', 
        'OK'
      );
      return;
    }
    
    // Set refresh flag to prevent duplicate calls
    localStorage.setItem('sync_in_progress', 'true');
    
    // Call synchronizeWithBackend and then refresh notifications
    this.notificationService.synchronizeWithBackend().subscribe({
      next: () => {
        console.log('[ChefProjetNavbar] Backend synchronization complete');
        
        // Also refresh from local storage 
        this.notificationService.refreshFromStorage();
        
        // Then do a full refresh after a short delay
        setTimeout(() => {
          this.notificationService.refreshNotifications();
          console.log('[ChefProjetNavbar] Force refresh complete');
          
          // Show success message
          this.notificationService.showSuccess('Notifications actualisées avec succès');
          
          // Clear sync flag
          localStorage.removeItem('sync_in_progress');
        }, 500);
      },
      error: (err) => {
        console.error('[ChefProjetNavbar] Error refreshing notifications:', err);
        this.notificationService.showError('Erreur lors de l\'actualisation des notifications');
        // Clear sync flag on error
        localStorage.removeItem('sync_in_progress');
      }
    });
  }

  // Create emergency notification specifically for chef projet users
  createEmergencyNotification(): void {
    console.log('[ChefProjetNavbar] Creating emergency notification for Chef Projet');
    this.notificationService.createEmergencyChefProjetNotification();
    
    // Force refresh notifications after a short delay
    setTimeout(() => {
      this.notificationService.refreshNotifications();
    }, 1000);
  }

  // Verify all notification types
  verifyAllNotificationTypes(): void {
    console.log('[ChefProjetNavbar] Verifying all notification types');
    
    // Show loading snackbar
    this.notificationService.showSnackbarNotification(
      'Vérification des notifications en cours...', 
      'OK'
    );
    
    // Call the verification service method
    this.notificationService.verifyAllChefProjetNotifications().subscribe(
      {
        next: (response) => {
          console.log('[ChefProjetNavbar] Verification completed successfully:', response);
        },
        error: (error) => {
          console.error('[ChefProjetNavbar] Error during verification:', error);
          this.notificationService.showError('Erreur lors de la vérification des notifications');
        }
      }
    );
  }
}
