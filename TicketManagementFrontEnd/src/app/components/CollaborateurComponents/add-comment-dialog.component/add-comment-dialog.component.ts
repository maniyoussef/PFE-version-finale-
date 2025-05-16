import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { TicketService } from '../../../services/ticket.service';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-add-comment-dialog',
  templateUrl: './add-comment-dialog.component.html',
  styleUrls: ['./add-comment-dialog.component.scss'],
  standalone: true,
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
  ],
})
export class AddCommentDialogComponent {
  commentForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private ticketService: TicketService,
    public dialogRef: MatDialogRef<AddCommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {
    // Initialize form with current comment if available
    this.commentForm = this.fb.group({
      commentaire: [data.ticket.commentaire || '', Validators.required],
    });
  }

  onSubmit(): void {
    if (this.commentForm.valid) {
      const commentaire = this.commentForm.value.commentaire;

      this.ticketService
        .updateTicketComment(this.data.ticket.id, commentaire)
        .subscribe({
          next: (response) => {
            this.dialogRef.close(response);
          },
          error: (err) => {
            console.error('Error updating comment:', err);
          },
        });
    }
  }
}
