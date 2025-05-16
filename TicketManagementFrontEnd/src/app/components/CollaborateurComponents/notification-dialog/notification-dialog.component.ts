import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { NotificationService, Notification, NotificationType } from '../../../services/notification.service';

@Component({
  selector: 'app-collaborateur-notification-dialog',
  templateUrl: './notification-dialog.component.html',
  styleUrls: ['./notification-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    MatDividerModule
  ]
})
export class CollaborateurNotificationDialogComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<CollaborateurNotificationDialogComponent>,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Get notifications for the current collaborateur
    this.notifications = this.notificationService.getNotificationsForCurrentUser();
    
    // Sort by timestamp, newest first
    this.notifications.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Count unread
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    console.log(`[CollaborateurNotificationDialog] Loaded ${this.notifications.length} notifications (${this.unreadCount} unread)`);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
    this.loadNotifications();
  }

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
    this.loadNotifications();
  }

  navigateToLink(route: string, notificationId: string): void {
    this.markAsRead(notificationId);
    this.dialogRef.close();
    this.router.navigateByUrl(route);
  }

  close(): void {
    this.dialogRef.close();
  }

  getNotificationIcon(type: string): string {
    switch (type) {
      case NotificationType.COMMENT_ADDED:
        return 'comment';
      case NotificationType.TICKET_STATUS_CHANGED:
        return 'update';
      case NotificationType.TICKET_ASSIGNED:
        return 'assignment_ind';
      case NotificationType.TICKET_RESOLVED:
        return 'done_all';
      case NotificationType.TICKET_UNRESOLVED:
        return 'error';
      default:
        return 'notifications';
    }
  }

  getNotificationClass(notification: Notification): string {
    let classes = notification.isRead ? 'notification-item read' : 'notification-item unread';
    
    // Add type-specific classes
    if (notification.type === NotificationType.TICKET_ASSIGNED) {
      classes += ' assigned';
    } else if (notification.type === NotificationType.TICKET_RESOLVED) {
      classes += ' resolved';
    } else if (notification.type === NotificationType.TICKET_UNRESOLVED) {
      classes += ' unresolved';
    } else if (notification.type === NotificationType.COMMENT_ADDED) {
      classes += ' comment';
    }
    
    return classes;
  }
} 