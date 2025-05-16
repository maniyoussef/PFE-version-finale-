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
import type { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-chef-projet-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatDividerModule,
  ],
  templateUrl: './chef-projet-report-dialog.component.html',
  styleUrls: ['./chef-projet-report-dialog.component.scss'],
})
export class ChefProjetReportDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<ChefProjetReportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public ticket: Ticket
  ) {}

  closeDialog(): void {
    this.dialogRef.close();
  }
} 