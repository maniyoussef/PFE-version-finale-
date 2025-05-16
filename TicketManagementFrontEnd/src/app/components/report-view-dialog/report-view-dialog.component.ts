import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-report-view-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Rapport du ticket #{{ data.ticketId }}</h2>
    <mat-dialog-content>
      <div class="report-header">
        <h3>{{ data.ticketTitle }}</h3>
        <span class="status-badge" [ngClass]="getStatusClass()">{{ data.status }}</span>
      </div>
      <div class="report-content">
        <p>{{ data.report }}</p>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [`
    .report-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }
    
    h3 {
      margin: 0;
      font-weight: 500;
    }
    
    .status-badge {
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      font-weight: 500;
    }
    
    .status-resolved {
      background-color: #4caf50;
      color: white;
    }
    
    .status-unresolved {
      background-color: #f44336;
      color: white;
    }
    
    .report-content {
      background-color: #f5f5f5;
      padding: 16px;
      border-radius: 4px;
      white-space: pre-line;
    }
  `]
})
export class ReportViewDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ReportViewDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: {
      ticketId: number;
      ticketTitle: string;
      report: string;
      status: string;
    }
  ) {}

  getStatusClass(): string {
    if (this.data.status === 'Résolu') return 'status-resolved';
    if (this.data.status === 'Non résolu') return 'status-unresolved';
    return '';
  }
} 