import { Component, Inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';

@Component({
  selector: 'app-edit-comment-dialog',
  template: `
    <h2 mat-dialog-title>Modifier le commentaire</h2>
    <form [formGroup]="commentForm" (ngSubmit)="onSubmit()">
      <mat-dialog-content>
        <mat-form-field appearance="outline">
          <mat-label>Commentaire</mat-label>
          <textarea
            matInput
            formControlName="commentaire"
            required
            rows="4"
          ></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button mat-button type="button" (click)="dialogRef.close()">
          Annuler
        </button>
        <button
          mat-raised-button
          color="primary"
          type="submit"
          [disabled]="!commentForm.valid"
        >
          Enregistrer
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: [],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
  ],
})
export class EditCommentDialogComponent {
  commentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public data: { ticketId: number; commentaire: string }
  ) {}

  ngOnInit(): void {
    this.commentForm = this.fb.group({
      commentaire: [this.data.commentaire, Validators.required],
    });
  }

  onSubmit(): void {
    if (this.commentForm.valid) {
      this.dialogRef.close(this.commentForm.value.commentaire);
    }
  }
}
