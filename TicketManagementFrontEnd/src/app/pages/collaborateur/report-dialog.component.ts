import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, MatButtonModule],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <div class="description" *ngIf="data.isRequired">
        <p>Veuillez fournir un rapport détaillé. Cela aidera à documenter la résolution ou les problèmes rencontrés.</p>
      </div>
      <textarea
        matInput
        [placeholder]="data.placeholder || 'Veuillez expliquer pourquoi vous ' + data.action + ' ce ticket...'"
        [(ngModel)]="reason"
        rows="6"
        style="width: 100%"
        [attr.required]="data.isRequired ? true : null"
      ></textarea>
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button mat-button mat-dialog-close>Annuler</button>
      <button
        mat-raised-button
        color="primary"
        (click)="submitReason()"
        [disabled]="data.isRequired && !reason.trim()"
        class="submit-button"
      >
        Soumettre
      </button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      textarea {
        width: 100%;
        box-sizing: border-box;
        margin-bottom: 1rem;
        resize: vertical;
        min-height: 100px;
        padding: 8px;
        font-family: inherit;
      }
      
      .description {
        margin-bottom: 16px;
        color: #555;
        font-size: 14px;
      }
      
      mat-dialog-content {
        min-width: 400px;
      }
      
      mat-dialog-actions {
        padding-top: 16px;
        margin-bottom: 0;
      }
      
      .submit-button {
        color: black !important;
        font-weight: 500;
      }
      
      /* Override Material styling */
      ::ng-deep .mat-mdc-raised-button.mat-primary.submit-button {
        color: black !important;
      }
    `,
  ],
})
export class ReportDialogComponent {
  reason = '';

  constructor(
    public dialogRef: MatDialogRef<ReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { 
      title: string; 
      action: string;
      isRequired?: boolean;
      placeholder?: string;
    }
  ) {}

  submitReason() {
    if (!this.data.isRequired || this.reason.trim()) {
      this.dialogRef.close(this.reason);
    }
  }
}
