import { Component, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-chef-projet-refuse-dialog',
  templateUrl: './chef-projet-refuse-dialog.component.html',
  styleUrls: ['./chef-projet-refuse-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class ChefProjetRefuseDialogComponent {
  report: string = '';

  constructor(
    public dialogRef: MatDialogRef<ChefProjetRefuseDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: any }
  ) {}

  onNoClick(): void {
    this.dialogRef.close();
  }

  submitRefusal(): void {
    if (this.report.trim().length > 0) {
      this.dialogRef.close({ report: this.report });
    }
  }
} 