import { Component, OnInit, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef, MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { Router } from '@angular/router';
import { NotificationService, Notification } from '../../../services/notification.service';

@Component({
  selector: 'app-admin-notification-dialog',
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
export class AdminNotificationDialogComponent implements OnInit {
  notifications: Notification[] = [];
  unreadCount: number = 0;

  constructor(
    @Inject(MAT_DIALOG_DATA) public data: any,
    private dialogRef: MatDialogRef<AdminNotificationDialogComponent>,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
  }

  loadNotifications(): void {
    // Get notifications for the current admin user
    this.notifications = this.notificationService.getNotificationsForCurrentUser();
    
    // Sort by timestamp, newest first
    this.notifications.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
    
    // Count unread
    this.unreadCount = this.notifications.filter(n => !n.isRead).length;
    
    console.log(`[AdminNotificationDialog] Loaded ${this.notifications.length} notifications (${this.unreadCount} unread)`);
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
      case 'COMMENT_ADDED':
        return 'comment';
      case 'TICKET_STATUS_CHANGED':
        return 'update';
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
      case 'TICKET_UNRESOLVED':
        return 'error';
      case 'REPORT_CREATED':
        return 'description';
      default:
        return 'notifications';
    }
  }

  getNotificationClass(notification: Notification): string {
    let classes = notification.isRead ? 'notification-item read' : 'notification-item unread';
    
    // Add type-specific classes
    if (notification.type === 'NEW_TICKET') {
      classes += ' new-ticket';
    } else if (notification.type === 'TICKET_RESOLVED') {
      classes += ' resolved';
    } else if (notification.type === 'TICKET_UNRESOLVED') {
      classes += ' unresolved';
    } else if (notification.type === 'COMMENT_ADDED') {
      classes += ' comment';
    } else if (notification.type === 'REPORT_CREATED') {
      classes += ' report';
    }
    
    return classes;
  }
} 