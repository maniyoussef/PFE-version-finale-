import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TicketService } from '../../../services/ticket.service';
import type { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSnackBarModule
  ],
  template: `
    <div class="report-dialog">
      <div class="dialog-header">
        <h2 mat-dialog-title>{{ isResolved ? 'Rapport de Résolution' : 'Rapport de Non-Résolution' }} - Ticket #{{ data.ticket.id }}</h2>
        <button mat-icon-button (click)="closeDialog()">
          <mat-icon>close</mat-icon>
        </button>
      </div>

      <mat-divider></mat-divider>

      <mat-dialog-content>
        <div class="ticket-summary">
          <div class="summary-row">
            <span class="label">Titre:</span>
            <span class="value">{{ data.ticket.title }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Projet:</span>
            <span class="value">{{ data.ticket.project?.name || "N/A" }}</span>
          </div>
          <div class="summary-row">
            <span class="label">Status Final:</span>
            <span class="value status" [ngClass]="isResolved ? 'status-resolved' : 'status-unresolved'">
              {{ isResolved ? 'Résolu' : 'Non résolu' }}
            </span>
          </div>
        </div>

        <div class="report-form">
          <h3 class="section-title">{{ isResolved ? 'Expliquez comment le problème a été résolu' : 'Expliquez pourquoi le problème ne peut pas être résolu' }}</h3>
          
          <mat-form-field appearance="outline" class="report-field">
            <mat-label>Contenu du rapport</mat-label>
            <textarea 
              matInput 
              [(ngModel)]="reportContent" 
              rows="6" 
              placeholder="Veuillez détailler les raisons..."
              #reportTextarea
            ></textarea>
            <mat-hint>Soyez précis et détaillé pour faciliter la compréhension</mat-hint>
            <mat-error *ngIf="reportError">Le contenu du rapport est requis</mat-error>
          </mat-form-field>
        </div>
      </mat-dialog-content>

      <mat-dialog-actions align="end">
        <button mat-button (click)="closeDialog()">Annuler</button>
        <button 
          mat-raised-button 
          color="primary" 
          [disabled]="!reportContent || reportContent.trim() === ''"
          (click)="saveReport()"
        >
          Enregistrer
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .report-dialog {
      max-width: 600px;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0 0 16px 0;
    }
    
    h2 {
      margin: 0;
      font-size: 20px;
      font-weight: 500;
    }
    
    mat-dialog-content {
      padding-top: 20px;
      max-height: 65vh;
    }
    
    .ticket-summary {
      background-color: rgba(0, 0, 0, 0.03);
      padding: 16px;
      border-radius: 8px;
      margin-bottom: 24px;
    }
    
    .summary-row {
      display: flex;
      margin-bottom: 8px;
    }
    
    .summary-row:last-child {
      margin-bottom: 0;
    }
    
    .label {
      font-weight: 500;
      width: 100px;
      color: rgba(0, 0, 0, 0.6);
    }
    
    .value {
      flex: 1;
    }
    
    .status {
      padding: 4px 8px;
      border-radius: 4px;
      font-weight: 500;
      display: inline-block;
    }
    
    .status-resolved {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
    }
    
    .status-unresolved {
      background-color: rgba(244, 67, 54, 0.1);
      color: #d32f2f;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
      color: rgba(0, 0, 0, 0.87);
    }
    
    .report-field {
      width: 100%;
    }
    
    mat-dialog-actions {
      padding: 16px 0;
      margin-bottom: 0;
    }
  `]
})
export class ReportDialogComponent {
  reportContent: string = '';
  reportError: boolean = false;
  isResolved: boolean = false;

  constructor(
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket, isResolved: boolean },
    private ticketService: TicketService,
    private snackBar: MatSnackBar
  ) {
    // Initialize with any existing report text
    if (data.ticket && data.ticket.report) {
      this.reportContent = data.ticket.report;
    }
    
    // Store if the ticket is being marked as resolved
    this.isResolved = data.isResolved;
  }

  closeDialog(): void {
    this.dialogRef.close();
  }
  
  saveReport(): void {
    // Validate report content
    if (!this.reportContent || this.reportContent.trim() === '') {
      this.reportError = true;
      return;
    }
    
    // Reset any errors
    this.reportError = false;
    
    // Update the ticket with the report
    const ticketId = this.data.ticket.id;
    
    this.ticketService.updateTicketReport(ticketId, this.reportContent).subscribe({
      next: (updatedTicket) => {
        this.snackBar.open('Rapport enregistré avec succès', 'Fermer', { duration: 3000 });
        
        // Return the report to the caller
        this.dialogRef.close({ success: true, report: this.reportContent });
      },
      error: (error) => {
        console.error('Error saving report:', error);
        this.snackBar.open('Erreur lors de l\'enregistrement du rapport', 'Fermer', { duration: 3000 });
      }
    });
  }
}
