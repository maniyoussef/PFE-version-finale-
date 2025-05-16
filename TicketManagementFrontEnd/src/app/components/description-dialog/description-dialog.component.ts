import { Component, Inject } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { Ticket } from '../../models/ticket.model';

@Component({
  selector: 'app-description-dialog',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatDialogModule, MatIconModule, MatChipsModule],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="title-row">
          <h2 class="dialog-title">{{ data.ticket.title }}</h2>
          <mat-chip class="status-chip" [style.backgroundColor]="getStatusColor(data.ticket.status)">
            {{ data.ticket.status || "Statut non spécifié" }}
          </mat-chip>
        </div>
        <div class="meta-info">
          <span class="meta-item">
            <mat-icon>event</mat-icon> 
            {{ formatDate(data.ticket.createdAt) }}
          </span>
          <span class="meta-item" *ngIf="data.ticket.project?.name">
            <mat-icon>folder</mat-icon> 
            {{ data.ticket.project?.name }}
          </span>
          <span class="meta-item" *ngIf="data.ticket.problemCategory?.name">
            <mat-icon>category</mat-icon> 
            {{ data.ticket.problemCategory?.name }}
          </span>
        </div>
      </div>
      
      <div class="dialog-content">
        <h3 class="content-title">Description</h3>
        <div class="description-text">
          <p *ngIf="data.ticket.description">{{ data.ticket.description }}</p>
          <p *ngIf="!data.ticket.description" class="no-content">Aucune description disponible</p>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button mat-button class="close-button" [mat-dialog-close]>
          <mat-icon>close</mat-icon>
          Fermer
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        display: flex;
        flex-direction: column;
        max-width: 600px;
      }
      
      .dialog-header {
        padding: 20px 24px 12px;
        border-bottom: 1px solid #eee;
      }
      
      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: flex-start;
        margin-bottom: 12px;
      }
      
      .dialog-title {
        margin: 0;
        font-size: 20px;
        color: #333;
        flex: 1;
        padding-right: 16px;
      }
      
      .status-chip {
        color: white !important;
        font-size: 12px;
        height: 26px;
        font-weight: 500;
      }
      
      .meta-info {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;
        color: #666;
        font-size: 13px;
      }
      
      .meta-item {
        display: flex;
        align-items: center;
        
        mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
          margin-right: 5px;
        }
      }
      
      .dialog-content {
        padding: 16px 24px;
        max-height: 400px;
        overflow-y: auto;
      }
      
      .content-title {
        font-size: 16px;
        margin: 0 0 12px 0;
        color: #ff9800;
        font-weight: 500;
      }
      
      .description-text {
        background-color: #f9f9f9;
        padding: 16px;
        border-radius: 8px;
        font-size: 14px;
        line-height: 1.5;
      }
      
      .no-content {
        color: #999;
        font-style: italic;
      }
      
      .dialog-footer {
        padding: 12px 24px 20px;
        display: flex;
        justify-content: flex-end;
      }
      
      .close-button {
        background-color: #f0f0f0;
        display: flex;
        align-items: center;
        gap: 8px;
        font-weight: 500;
        padding: 4px 16px;
        
        &:hover {
          background-color: #e0e0e0;
        }
        
        mat-icon {
          font-size: 18px;
          height: 18px;
          width: 18px;
        }
      }
    `,
  ],
})
export class DescriptionDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<DescriptionDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {}
  
  formatDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }
  
  getStatusColor(status?: string): string {
    if (!status) return '#999999';
    const statusLower = status.toLowerCase();
    
    const colors: { [key: string]: string } = {
      'en attente': '#f0ad4e',
      'attente': '#f0ad4e',
      'pending': '#f0ad4e',
      'assigné': '#5bc0de',
      'assigned': '#5bc0de',
      'en cours': '#428bca',
      'in progress': '#428bca',
      'résolu': '#5cb85c',
      'resolved': '#5cb85c',
      'fermé': '#5cb85c',
      'closed': '#5cb85c',
      'refusé': '#d9534f',
      'refused': '#d9534f',
      'rejected': '#d9534f'
    };
    
    return colors[statusLower] || '#999999';
  }
}
