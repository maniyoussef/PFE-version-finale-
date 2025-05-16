import { Component, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { Ticket } from '../../../models/ticket.model';
import { TicketService } from '../../../services/ticket.service';
import { MatDialog } from '@angular/material/dialog';
import { lastValueFrom } from 'rxjs';
import { AssignUserDialogComponent } from '../../../components/AdminComponents/assign-user-dialog.component/assign-user-dialog.component';
import { AuthService } from '../../../services/auth.service';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ChefAssignUserDialogComponent } from '../../../components/chef-projetComponents/chef-projet-assign-user-dialog.component/chef-projet-assign-user-dialog.component';
import { CommentDialogComponent } from '../../admin/tickets/comment-dialog.component';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  standalone: true,
  selector: 'app-ticket-detail',
  templateUrl: './ticket-detail.component.html',
  styleUrls: ['./ticket-detail.component.scss'],
  imports: [
    CommonModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatIconModule,
    RouterModule,
    MatSnackBarModule,
    CommentDialogComponent,
  ],
})
export class TicketDetailComponent implements OnInit {
  ticket: Ticket | null = null;
  loading = true;
  error: string | null = null;
  assignmentLoading = false;

  constructor(
    private route: ActivatedRoute,
    private ticketService: TicketService,
    public dialog: MatDialog,
    private authService: AuthService,
    private snackBar: MatSnackBar
  ) {}

  async ngOnInit() {
    this.loading = true;
    this.error = null;
    
    try {
      const idParam = this.route.snapshot.paramMap.get('id');
      if (!idParam) {
        this.error = 'Identifiant de ticket invalide';
        this.loading = false;
        return;
      }

      const id = Number(idParam);
      if (isNaN(id)) {
        this.error = 'Identifiant de ticket invalide';
        this.loading = false;
        return;
      }

      const result = await lastValueFrom(this.ticketService.getTicketById(id));
      if (!result) {
        this.error = `Ticket avec ID ${id} introuvable`;
      } else {
        this.ticket = result;
      }
    } catch (err) {
      console.error('Erreur lors du chargement du ticket:', err);
      this.error = 'Échec du chargement des détails du ticket';
    } finally {
      this.loading = false;
    }
  }

  openAssignDialog() {
    if (!this.ticket) return;

    // Check if the ticket is already assigned
    if (this.ticket.status?.toLowerCase() === 'assigné' || 
        this.ticket.status?.toLowerCase() === 'assigned') {
      console.warn('Ce ticket est déjà assigné à un collaborateur', this.ticket);
      return; // Exit early - don't allow reassignment
    }

    // Only allow assignment when ticket status is 'Accepté'/'accepted'
    if (this.ticket.status?.toLowerCase() !== 'accepté' && 
        this.ticket.status?.toLowerCase() !== 'accepted') {
      console.warn('Impossible d\'assigner un ticket qui n\'est pas dans le statut "Accepté"', 
                  this.ticket.status);
      return; // Exit early - only allow assignment of accepted tickets
    }

    // Check if the current user is a Chef Projet
    const isChefProjet =
      this.authService.getCurrentUserRole() === 'Chef Projet';

    if (isChefProjet) {
      const dialogRef = this.dialog.open(ChefAssignUserDialogComponent, {
        width: '500px',
        data: { ticket: this.ticket },
        panelClass: 'custom-dialog-container',
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          this.assignmentLoading = true;
          try {
            const updatedTicket = await lastValueFrom(
              this.ticketService.updateTicketAssignment(
                this.ticket!.id,
                result.id
              )
            );
            this.ticket = updatedTicket;
          } catch (error) {
            console.error('Erreur lors de l\'assignation du ticket:', error);
            this.error = 'Échec de l\'assignation du ticket';
          } finally {
            this.assignmentLoading = false;
          }
        }
      });
    } else {
      // For Admin or other roles, use the original dialog
      const dialogRef = this.dialog.open(AssignUserDialogComponent, {
        width: '500px',
        data: { ticket: this.ticket },
        panelClass: 'custom-dialog-container',
      });
      dialogRef.afterClosed().subscribe(async (result) => {
        if (result) {
          this.assignmentLoading = true;
          try {
            const updatedTicket = await lastValueFrom(
              this.ticketService.updateTicketAssignment(
                this.ticket!.id,
                result.id
              )
            );
            this.ticket = updatedTicket;
          } catch (error) {
            console.error('Erreur lors de l\'assignation du ticket:', error);
            this.error = 'Échec de l\'assignation du ticket';
          } finally {
            this.assignmentLoading = false;
          }
        }
      });
    }
  }

  // Format work duration into readable time format
  formatWorkDuration(seconds: number): string {
    if (!seconds || seconds <= 0) {
      return 'Non suivi';
    }

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    let formattedTime = '';
    if (hours > 0) {
      formattedTime += `${hours}h `;
    }
    if (minutes > 0 || hours > 0) {
      formattedTime += `${minutes}min `;
    }
    formattedTime += `${remainingSeconds}s`;

    return formattedTime;
  }

  // Open the comment dialog to add/view comments
  openCommentDialog(): void {
    if (!this.ticket) return;

    // Get the current user ID for the comment
    const currentUserId = Number(localStorage.getItem('userId') || '0');
    
    // Open the comment dialog
    const dialogRef = this.dialog.open(CommentDialogComponent, {
      width: '700px',
      maxWidth: '95vw',
      maxHeight: '90vh',
      panelClass: 'comment-dialog-container',
      data: {
        ticket: this.ticket,
        ticketId: this.ticket.id,
        currentUserId: currentUserId,
        isAdmin: false,
        isChefProjet: true
      }
    });

    dialogRef.afterClosed().subscribe(async result => {
      if (result && this.ticket) {
        // Update the local ticket data with type safety
        this.ticket = {
          ...this.ticket,
          commentaire: result.updated ? result.commentaire : this.ticket.commentaire,
          updatedAt: result.updated ? new Date().toISOString() : this.ticket.updatedAt
        };

        // Show success message if comment was updated
        if (result.updated) {
          this.snackBar.open('Commentaire ajouté avec succès', 'Fermer', {
            duration: 3000,
            horizontalPosition: 'center',
            verticalPosition: 'bottom'
          });
        }
      }
    });
  }
}
