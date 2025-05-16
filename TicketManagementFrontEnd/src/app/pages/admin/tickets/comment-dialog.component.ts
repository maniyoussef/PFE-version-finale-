import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Ticket } from '../../../models/ticket.model';
import { CommonModule } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { TicketService } from '../../../services/ticket.service';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';

@Component({
  selector: 'app-comment-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatInputModule,
    FormsModule,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    MatChipsModule,
    MatSnackBarModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="title-row">
          <h2 class="dialog-title">Commentaires</h2>
          <div class="ticket-info">
            <mat-chip class="ticket-chip">{{ data.ticket.title }}</mat-chip>
            <mat-chip class="ticket-id-chip">#{{ data.ticket.id }}</mat-chip>
            <mat-chip *ngIf="data.ticket.status" class="ticket-status-chip">{{ data.ticket.status }}</mat-chip>
          </div>
        </div>
        <div *ngIf="data.ticket.project?.name" class="ticket-project">
          Projet: {{ data.ticket.project?.name }}
        </div>
      </div>
      
      <div class="dialog-content">
        <!-- Comments History Section -->
        <div class="comments-section">
          <div class="section-header">
            <h3 class="section-title">Historique des commentaires</h3>
            <button 
              mat-icon-button 
              class="refresh-button" 
              (click)="refreshComments()" 
              matTooltip="Actualiser les commentaires"
            >
              <mat-icon>refresh</mat-icon>
            </button>
          </div>
          
          <!-- Loading state -->
          <div *ngIf="isLoading" class="loading-container">
            <mat-icon class="loading-icon spin">refresh</mat-icon>
            <p>Chargement des commentaires...</p>
          </div>
          
          <!-- Comments list -->
          <div *ngIf="!isLoading && hasComments()" class="comments-list">
            <div 
              *ngFor="let comment of getFormattedComments()" 
              class="comment-item"
              [class.system-comment]="isSystemComment(comment)"
            >
              <div class="comment-meta">
                <span *ngIf="comment.time" class="comment-time">{{ comment.time }}</span>
                <span *ngIf="comment.time && comment.author" class="comment-divider">|</span>
                <span *ngIf="comment.author" class="comment-author">{{ comment.author }}</span>
                <span *ngIf="!comment.time && !comment.author" class="comment-author">Commentaire</span>
              </div>
              <div class="comment-text">{{ comment.text }}</div>
            </div>
          </div>
          
          <!-- No comments state -->
          <div *ngIf="!isLoading && !hasComments()" class="no-comments">
            <mat-icon>chat</mat-icon>
            <p>Aucun commentaire pour le moment. Soyez le premier à commenter!</p>
          </div>
        </div>
        
        <!-- New Comment Section -->
        <div class="new-comment-section">
          <h3 class="section-title">Ajouter un commentaire</h3>
          <div class="comment-input-area">
            <textarea
              matInput
              placeholder="Rédigez votre commentaire ici..."
              [(ngModel)]="newComment"
              rows="4"
              class="comment-textarea"
              [disabled]="isSubmitting"
            ></textarea>
          </div>
        </div>
      </div>
      
      <div class="dialog-footer">
        <button mat-button class="cancel-button" mat-dialog-close [disabled]="isSubmitting">
          <mat-icon>close</mat-icon>
          Annuler
        </button>
        <button 
          mat-button 
          class="submit-button" 
          [disabled]="!newComment.trim() || isSubmitting" 
          (click)="addComment()"
        >
          <mat-icon>{{ isSubmitting ? 'hourglass_empty' : 'send' }}</mat-icon>
          {{ isSubmitting ? 'Envoi en cours...' : 'Envoyer' }}
        </button>
      </div>
    </div>
  `,
  styles: [
    `
      .dialog-container {
        display: flex;
        flex-direction: column;
        max-width: 100%;
        min-height: 300px;
        width: 100%;
        overflow: hidden;
      }
      
      .dialog-header {
        padding: 16px 20px 10px;
        border-bottom: 1px solid #eee;
        background: linear-gradient(to right, #f5f5f5, #ffffff);
      }
      
      .title-row {
        display: flex;
        justify-content: space-between;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
      }
      
      .dialog-title {
        margin: 0;
        font-size: 18px;
        color: #333;
        flex-shrink: 0;
      }
      
      .ticket-info {
        display: flex;
        gap: 6px;
        flex-wrap: wrap;
      }
      
      .ticket-project {
        font-size: 12px;
        color: #666;
        margin-top: 6px;
      }
      
      .ticket-chip {
        background-color: #ff9800 !important;
        color: white !important;
        font-size: 11px;
        height: 24px;
        font-weight: 500;
        max-width: 150px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .ticket-id-chip {
        background-color: #2196f3 !important;
        color: white !important;
        font-size: 11px;
        height: 24px;
        font-weight: 500;
      }
      
      .ticket-status-chip {
        background-color: #4caf50 !important;
        color: white !important;
        font-size: 11px;
        height: 24px;
        font-weight: 500;
      }
      
      .dialog-content {
        padding: 16px 20px;
        flex: 1;
        max-height: 40vh;
        overflow-y: auto;
        overflow-x: hidden;
      }
      
      .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 10px;
      }
      
      .section-title {
        font-size: 15px;
        color: #ff9800;
        margin: 0;
        font-weight: 500;
      }
      
      .refresh-button {
        color: #999;
        width: 24px;
        height: 24px;
        line-height: 24px;
        
        .mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
        }
        
        &:hover {
          color: #ff9800;
        }
      }
      
      .loading-container {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 20px;
        color: #999;
      }
      
      .loading-icon {
        font-size: 24px;
        margin-bottom: 8px;
        color: #ff9800;
      }
      
      .spin {
        animation: spin 1.5s linear infinite;
      }
      
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
      
      .comments-section {
        margin-bottom: 20px;
      }
      
      .comments-list {
        background-color: #f9f9f9;
        border-radius: 8px;
        padding: 2px;
        max-width: 100%;
        overflow-x: hidden;
      }
      
      .comment-item {
        padding: 10px 12px;
        margin: 8px;
        background-color: white;
        border-radius: 6px;
        box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        word-break: break-word;
        overflow-wrap: break-word;
        
        &.system-comment {
          background-color: #f0f0f0;
          font-style: italic;
          
          .comment-text {
            color: #666;
          }
        }
      }
      
      .comment-meta {
        display: flex;
        flex-wrap: wrap;
        font-size: 11px;
        color: #666;
        margin-bottom: 6px;
      }
      
      .comment-time {
        font-weight: 500;
      }
      
      .comment-divider {
        margin: 0 6px;
      }
      
      .comment-author {
        color: #ff9800;
      }
      
      .comment-text {
        font-size: 13px;
        line-height: 1.5;
        word-break: break-word;
        white-space: pre-line;
      }
      
      .no-comments {
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 24px 16px;
        background-color: #f9f9f9;
        border-radius: 8px;
        margin-bottom: 20px;
        
        mat-icon {
          font-size: 32px;
          height: 32px;
          width: 32px;
          margin-bottom: 12px;
          color: #ccc;
        }
        
        p {
          color: #999;
          text-align: center;
          margin: 0;
          font-size: 13px;
        }
      }
      
      .new-comment-section {
        margin-top: 16px;
      }
      
      .comment-input-area {
        width: 100%;
      }
      
      .comment-textarea {
        width: 100%;
        box-sizing: border-box;
        padding: 12px;
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        background-color: #fff;
        font-size: 14px;
        resize: vertical;
        transition: border-color 0.3s ease;
        max-height: 150px;
        
        &:focus {
          border-color: #ff9800;
          outline: none;
        }
      }
      
      .dialog-footer {
        padding: 10px 20px 16px;
        display: flex;
        justify-content: flex-end;
        gap: 12px;
        border-top: 1px solid #f0f0f0;
      }
      
      .cancel-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #f0f0f0;
        
        &:hover {
          background-color: #e0e0e0;
        }
        
        mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
        }
      }
      
      .submit-button {
        display: flex;
        align-items: center;
        gap: 8px;
        background-color: #ff9800;
        color: white;
        font-weight: 500;
        
        &:hover:not([disabled]) {
          background-color: #f57c00;
        }
        
        &[disabled] {
          background-color: #ffcc80;
          color: rgba(255, 255, 255, 0.7);
        }
        
        mat-icon {
          font-size: 16px;
          height: 16px;
          width: 16px;
        }
      }
      
      /* Media query for smaller screens */
      @media (max-width: 480px) {
        .dialog-header {
          padding: 12px 16px 8px;
        }
        
        .dialog-title {
          font-size: 16px;
        }
        
        .ticket-chip {
          font-size: 10px;
          height: 22px;
          max-width: 120px;
        }
        
        .dialog-content {
          padding: 12px 16px;
          max-height: 30vh;
        }
        
        .dialog-footer {
          padding: 8px 16px 12px;
        }
        
        .comment-item {
          padding: 8px 10px;
          margin: 6px;
        }
      }
    `,
  ],
})
export class CommentDialogComponent {
  newComment = '';
  isSubmitting = false;
  isLoading = true;

  constructor(
    public dialogRef: MatDialogRef<CommentDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private ticketService: TicketService,
    private snackBar: MatSnackBar
  ) {
    // Log full ticket data to diagnose comment issues
    console.log('[CommentDialog] Constructor - Ticket data:', this.data.ticket);
    
    // Add a comment if the commentaire property doesn't exist or isn't a string
    if (!this.data.ticket.commentaire || typeof this.data.ticket.commentaire !== 'string') {
      console.log('[CommentDialog] Missing or invalid commentaire property, initializing empty string');
      this.data.ticket.commentaire = '';
    } else if (this.data.ticket.commentaire.trim() === '') {
      console.log('[CommentDialog] Commentaire is empty string');
    } else {
      console.log('[CommentDialog] Commentaire exists with length:', this.data.ticket.commentaire.length);
    }
    
    // Fetch fresh ticket data to ensure we have the latest comments
    this.fetchTicketData();
  }
  
  fetchTicketData(): void {
    this.isLoading = true;
    this.ticketService.getTicketById(this.data.ticket.id).subscribe({
      next: (ticket) => {
        if (ticket) {
          console.log('[CommentDialog] Fetched fresh ticket data:', ticket);
          
          // Update ticket data but preserve any passed dialog configuration
          this.data.ticket = { 
            ...ticket,
            // Preserve any additional dialog config properties that might be in data.ticket
            ...Object.fromEntries(
              Object.entries(this.data.ticket)
                .filter(([key]) => !Object.keys(ticket).includes(key))
            )
          };
          
          console.log('[CommentDialog] Updated ticket data with fresh data:', this.data.ticket);
        } else {
          console.warn('[CommentDialog] Could not fetch ticket data, using passed data');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('[CommentDialog] Error fetching ticket data:', error);
        this.isLoading = false;
      }
    });
  }

  addComment() {
    if (this.newComment.trim()) {
      this.isSubmitting = true;
      
      // Format the current timestamp 
      const timestamp = new Date().toLocaleString('fr-FR');
      
      // Get current user's name if available (from localStorage or data)
      const currentUser = localStorage.getItem('userName') || 'Utilisateur';
      
      // Format the new comment including author info in square brackets
      const formattedComment = `${timestamp} - [${currentUser}] ${this.newComment}`;
      
      // Prepare the updated comment text (add to existing or set as first)
      const updatedCommentaire = this.data.ticket.commentaire && this.data.ticket.commentaire.trim() ? 
        `${this.data.ticket.commentaire}\n${formattedComment}` : 
        formattedComment;
      
      console.log('[CommentDialog] Adding new comment:', formattedComment);
      console.log('[CommentDialog] Updated commentaire will be:', updatedCommentaire);
      
      // Update the local data immediately for immediate UI feedback
      this.data.ticket.commentaire = updatedCommentaire;
      
      // Use the specialized updateTicketComment method directly
      this.ticketService.updateTicketComment(this.data.ticket.id, updatedCommentaire)
        .subscribe({
          next: (updatedTicket) => {
            console.log('[CommentDialog] Comment updated successfully', updatedTicket);
            this.isSubmitting = false;
            
            // Update the ticket data with the response from the server
            if (updatedTicket) {
              // Update whole ticket but preserve our updated commentaire
              this.data.ticket = {
                ...updatedTicket,
                commentaire: updatedCommentaire, // Keep our updated comments
              };
              
              // Store update status separately instead of on the ticket object
              const wasUpdated = true;
            }
            
            // Clear the comment input
            this.newComment = '';
            
            // Show success notification
            this.snackBar.open(
              'Commentaire ajouté avec succès',
              'Fermer',
              { duration: 3000 }
            );
          },
          error: (error) => {
            this.isSubmitting = false;
            console.error('[CommentDialog] Error updating ticket comment:', error);
            this.snackBar.open(
              'Erreur lors de l\'ajout du commentaire. Les changements pourraient ne pas être sauvegardés. Veuillez actualiser.',
              'Fermer',
              { duration: 5000, panelClass: ['error-snackbar'] }
            );
          }
        });
    }
  }
  
  getFormattedComments(): { time: string, author: string, text: string }[] {
    if (!this.data.ticket.commentaire) {
      console.log('[CommentDialog] No commentaire property found on ticket:', this.data.ticket);
      return [];
    }
    
    if (typeof this.data.ticket.commentaire !== 'string') {
      console.log('[CommentDialog] Commentaire is not a string:', typeof this.data.ticket.commentaire, this.data.ticket.commentaire);
      
      // Try to convert from object or other type to string
      try {
        this.data.ticket.commentaire = String(this.data.ticket.commentaire);
        console.log('[CommentDialog] Converted commentaire to string:', this.data.ticket.commentaire);
      } catch (e) {
        console.error('[CommentDialog] Failed to convert commentaire to string:', e);
        return [];
      }
    }
    
    if (this.data.ticket.commentaire.trim() === '') {
      console.log('[CommentDialog] Commentaire is empty or only whitespace');
      return [];
    }
    
    // Log the raw comment data to help with debugging
    console.log('[CommentDialog] Raw comment data:', this.data.ticket.commentaire);
    console.log('[CommentDialog] Comment data length:', this.data.ticket.commentaire.length);
    
    // Handle possible JSON string (API sometimes returns comments as JSON)
    if (this.data.ticket.commentaire.startsWith('{') || this.data.ticket.commentaire.startsWith('[')) {
      try {
        const jsonComments = JSON.parse(this.data.ticket.commentaire);
        console.log('[CommentDialog] Parsed JSON comments:', jsonComments);
        
        // Handle array of comments
        if (Array.isArray(jsonComments)) {
          return jsonComments.map(comment => {
            if (typeof comment === 'string') {
              return { time: '', author: '', text: comment };
            } else {
              return {
                time: comment.time || comment.date || '',
                author: comment.author || comment.user || '',
                text: comment.text || comment.content || comment.message || ''
              };
            }
          });
        } 
        // Handle single comment object
        else if (typeof jsonComments === 'object') {
          return [{
            time: jsonComments.time || jsonComments.date || '',
            author: jsonComments.author || jsonComments.user || '',
            text: jsonComments.text || jsonComments.content || jsonComments.message || String(jsonComments)
          }];
        }
      } catch (e) {
        console.log('[CommentDialog] Not valid JSON, proceeding with string parsing');
      }
    }
    
    // First split by new lines, then process each line
    const commentsArray = this.data.ticket.commentaire
      .split('\n')
      .filter(c => c.trim())
      .map(c => c.trim());
    
    console.log('[CommentDialog] Split comments array:', commentsArray.length, 'comments');
    console.log('[CommentDialog] Comments array:', commentsArray);
    
    // Return empty array if no comments
    if (commentsArray.length === 0) {
      console.log('[CommentDialog] No comments after splitting and filtering');
      return [];
    }
    
    // Process each comment line to extract time, author, and text
    const formattedComments = commentsArray.map(comment => {
      // Try multiple comment format patterns
      
      // Format 1: Date time - [Author] Text
      // Example: 2025-05-15 10:30 - [John] This is a comment
      const formatWithAuthorPattern = /^([\d\.\-\/\s:,]+)\s*-\s*\[(.*?)\]\s*(.*)$/;
      const authorMatch = comment.match(formatWithAuthorPattern);
      
      if (authorMatch) {
        return {
          time: authorMatch[1].trim(),
          author: authorMatch[2].trim(),
          text: authorMatch[3].trim()
        };
      }
      
      // Format 2: Date time - Text
      // Example: 2025-05-15 10:30 - This is a comment
      const formatWithoutAuthorPattern = /^([\d\.\-\/\s:,]+)\s*-\s*(.*)$/;
      const noAuthorMatch = comment.match(formatWithoutAuthorPattern);
      
      if (noAuthorMatch) {
        return {
          time: noAuthorMatch[1].trim(),
          author: '',
          text: noAuthorMatch[2].trim()
        };
      }
      
      // Format 3: [Author] Text
      // Example: [John] This is a comment
      const authorOnlyPattern = /^\[(.*?)\]\s*(.*)$/;
      const authorOnlyMatch = comment.match(authorOnlyPattern);
      
      if (authorOnlyMatch) {
        return {
          time: '',
          author: authorOnlyMatch[1].trim(),
          text: authorOnlyMatch[2].trim()
        };
      }
      
      // Format 4: Any other format - treat as plain text
      console.log('[CommentDialog] Comment format not recognized, treating as plain text:', comment);
      return {
        time: '',
        author: '',
        text: comment
      };
    });
    
    console.log('[CommentDialog] Formatted comments:', formattedComments);
    return formattedComments;
  }
  
  hasComments(): boolean {
    // Always check if we have valid commentaire data
    if (!this.data.ticket.commentaire) {
      console.log('[CommentDialog] hasComments: no commentaire property');
      return false;
    }
    
    if (typeof this.data.ticket.commentaire !== 'string') {
      console.log('[CommentDialog] hasComments: commentaire is not a string:', typeof this.data.ticket.commentaire);
      return false;
    }
    
    if (this.data.ticket.commentaire.trim() === '') {
      console.log('[CommentDialog] hasComments: commentaire is empty string or whitespace');
      return false;
    }
    
    // Try to split by new lines and filter empty ones
    const commentLines = this.data.ticket.commentaire
      .split('\n')
      .filter(line => line.trim().length > 0);
    
    console.log('[CommentDialog] hasComments: found', commentLines.length, 'comment lines after splitting');
    
    // If we have any non-empty lines, we have comments
    return commentLines.length > 0;
  }
  
  isSystemComment(comment: { time: string, author: string, text: string }): boolean {
    // Check if this is likely a system-generated comment
    const systemIndicators = [
      'changed status',
      'a été assigné',
      'a été créé',
      'système',
      'system',
      'mis à jour',
      'updated',
      'status changed',
      'ticket status',
      'automatically'
    ];
    
    // Check if the comment contains any system-related text
    const lowerText = comment.text.toLowerCase();
    const hasSystemText = systemIndicators.some(indicator => lowerText.includes(indicator.toLowerCase()));
    const hasSystemAuthor = comment.author ? comment.author.toLowerCase().includes('system') : false;
    
    return hasSystemText || hasSystemAuthor;
  }

  // Add an update method that can be called from a button to refresh comments
  refreshComments(): void {
    this.fetchTicketData();
  }
}
