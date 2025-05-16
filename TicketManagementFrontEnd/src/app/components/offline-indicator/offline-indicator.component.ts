import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { BehaviorSubject, Subject, fromEvent, merge, of } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { NotificationService } from '../../services/notification.service';

@Component({
  selector: 'app-offline-indicator',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule
  ],
  template: `
    <div *ngIf="isOffline || hasPendingChanges" class="offline-indicator">
      <mat-icon color="warn">{{isOffline ? 'cloud_off' : 'sync_problem'}}</mat-icon>
      <div class="offline-message">
        <div class="offline-title">
          {{isOffline ? 'Mode hors-ligne actif' : 'Modifications en attente'}}
        </div>
        <div class="offline-details">
          <ng-container *ngIf="isOffline">Vous êtes actuellement hors-ligne. Les modifications seront enregistrées localement et synchronisées lorsque vous serez de nouveau connecté.</ng-container>
          <ng-container *ngIf="!isOffline && hasPendingChanges">Des modifications sont en attente de synchronisation avec le serveur.</ng-container>
          <span *ngIf="pendingChangesCount > 0" class="offline-count">
            ({{ pendingChangesCount }} modification{{ pendingChangesCount > 1 ? 's' : '' }} en attente)
          </span>
        </div>
        <div *ngIf="lastErrorTime" class="offline-time">
          Dernière erreur: {{ lastErrorTime | date:'HH:mm:ss' }}
        </div>
      </div>
      <button *ngIf="!isOffline && hasPendingChanges" mat-button color="primary" (click)="trySynchronize()">
        <mat-icon>sync</mat-icon> Synchroniser
      </button>
      <button *ngIf="isOffline" mat-button color="primary" (click)="checkOnlineStatus()">
        <mat-icon>refresh</mat-icon> Vérifier la connexion
      </button>
    </div>
  `,
  styles: [`
    .offline-indicator {
      display: flex;
      align-items: center;
      background-color: #fff9e6;
      border: 1px solid #ffe0b2;
      border-radius: 4px;
      padding: 12px 16px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
      
      mat-icon {
        font-size: 24px;
        height: 24px;
        width: 24px;
        margin-right: 16px;
        color: #f57c00;
      }
      
      .offline-message {
        flex: 1;
        
        .offline-title {
          font-weight: 500;
          font-size: 16px;
          color: #e65100;
          margin-bottom: 4px;
        }
        
        .offline-details {
          font-size: 14px;
          color: #555;
          margin-bottom: 4px;
        }
        
        .offline-count {
          font-weight: 500;
          color: #e65100;
        }
        
        .offline-time {
          font-size: 12px;
          color: #777;
        }
      }
      
      button {
        margin-left: 16px;
      }
    }
  `]
})
export class OfflineIndicatorComponent implements OnInit, OnDestroy {
  isOffline = !navigator.onLine;
  hasPendingChanges = false;
  pendingChangesCount = 0;
  lastErrorTime: Date | null = null;
  errorMessage: string | null = null;
  
  private isOffline$ = new BehaviorSubject<boolean>(!navigator.onLine);
  private pendingChanges$ = new BehaviorSubject<number>(0);
  private destroy$ = new Subject<void>();
  
  constructor(private notificationService: NotificationService) {}
  
  ngOnInit() {
    // Listen for online/offline events
    merge(
      of(navigator.onLine),
      fromEvent(window, 'online').pipe(map(() => true)),
      fromEvent(window, 'offline').pipe(map(() => false))
    ).pipe(
      startWith(navigator.onLine),
      takeUntil(this.destroy$)
    ).subscribe(online => {
      this.isOffline = !online;
      this.isOffline$.next(!online);
      
      if (online) {
        this.notificationService.showInfo('Connexion rétablie');
        this.checkPendingChanges();
      } else {
        this.notificationService.showWarning('Connexion perdue - Mode hors-ligne activé');
      }
    });
    
    // Check for pending changes periodically
    this.checkPendingChanges();
    setInterval(() => this.checkPendingChanges(), 30000);
  }
  
  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
  
  checkOnlineStatus() {
    const online = navigator.onLine;
    this.isOffline = !online;
    this.isOffline$.next(!online);
    
    if (online) {
      this.notificationService.showInfo('Connexion disponible');
    } else {
      this.notificationService.showWarning('Toujours hors-ligne');
    }
  }
  
  trySynchronize() {
    if (navigator.onLine) {
      this.notificationService.showInfo('Synchronisation en cours...');
      // Would trigger sync in a real implementation
      // This is a placeholder for the actual sync code
      setTimeout(() => {
        this.checkPendingChanges();
        this.notificationService.showSuccess('Synchronisation terminée');
      }, 1500);
    } else {
      this.notificationService.showError('Impossible de synchroniser en mode hors-ligne');
    }
  }
  
  private checkPendingChanges() {
    try {
      const offlineChangesStr = localStorage.getItem('offlineTicketChanges') || '{}';
      const offlineUpdatesStr = localStorage.getItem('offlineTicketUpdates') || '{}';
      const failedOpsStr = localStorage.getItem('failedTicketOperations') || '[]';
      
      const offlineChanges = JSON.parse(offlineChangesStr);
      const offlineUpdates = JSON.parse(offlineUpdatesStr);
      const failedOps = JSON.parse(failedOpsStr);
      
      const totalPendingChanges = 
        Object.keys(offlineChanges).length + 
        Object.keys(offlineUpdates).length +
        failedOps.length;
      
      this.pendingChangesCount = totalPendingChanges;
      this.hasPendingChanges = totalPendingChanges > 0;
      this.pendingChanges$.next(totalPendingChanges);
      
      // Find last error time
      if (failedOps.length > 0) {
        const latestOp = failedOps.reduce((latest, op) => 
          op.timestamp > latest.timestamp ? op : latest, failedOps[0]);
        this.lastErrorTime = new Date(latestOp.timestamp);
        this.errorMessage = latestOp.error;
      }
    } catch (e) {
      console.error('[OfflineIndicator] Error checking pending changes:', e);
    }
  }
} 