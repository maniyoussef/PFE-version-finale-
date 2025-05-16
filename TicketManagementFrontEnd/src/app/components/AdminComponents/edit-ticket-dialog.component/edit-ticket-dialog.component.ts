import { CommonModule } from '@angular/common';
import { Component, Inject } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { Ticket } from '../../../models/ticket.model';

@Component({
  selector: 'app-edit-ticket-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatDialogModule,
    MatSelectModule,
  ],
  templateUrl: './edit-ticket-dialog.component.html',
  styleUrls: ['./edit-ticket-dialog.component.scss'],
})
export class EditTicketDialogComponent {
  ticketForm!: FormGroup;
  qualifications = [
    'Ticket Support',
    'Demande de Formation',
    "Demande d'Information",
  ];
  priorities = ['Urgent', 'High', 'Medium', 'Low'];
  statuses = ['En attente', 'Assigné', 'En cours', 'Résolu', 'Refusé'];

  constructor(
    private fb: FormBuilder,
    public dialogRef: MatDialogRef<EditTicketDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket }
  ) {}

  ngOnInit(): void {
    this.ticketForm = this.fb.group({
      title: [this.data.ticket.title, Validators.required],
      description: [this.data.ticket.description, Validators.required],
      qualification: [this.data.ticket.qualification, Validators.required],
      priority: [this.data.ticket.priority, Validators.required],
      status: [this.data.ticket.status],
      commentaire: [this.data.ticket.commentaire],
    });
  }

  onSubmit(): void {
    if (this.ticketForm.valid) {
      const updatedTicket = {
        ...this.data.ticket,
        ...this.ticketForm.value,
      };

      this.dialogRef.close(updatedTicket);
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }
}
