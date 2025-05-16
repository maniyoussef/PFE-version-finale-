import { Component, Inject, OnInit } from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogRef,
  MatDialogModule,
} from '@angular/material/dialog';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatChipsModule } from '@angular/material/chips';
import { MatTabsModule } from '@angular/material/tabs';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Ticket } from '../../models/ticket.model';
import { FormatTimePipe } from '../../pipes/format-time.pipe';
import { TicketService } from '../../services/ticket.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-ticket-details-dialog',
  standalone: true,
  imports: [
    CommonModule, 
    MatButtonModule, 
    MatDialogModule, 
    MatIconModule, 
    MatChipsModule,
    MatTabsModule,
    MatDividerModule,
    FormatTimePipe,
    MatProgressSpinnerModule
  ],
  template: `
    <div class="dialog-container">
      <div class="dialog-header">
        <div class="header-content">
          <div class="id-chip">#{{ data.ticket.id }}</div>
          <h2 class="dialog-title">{{ data.ticket.title }}</h2>
          <mat-chip class="status-chip" [style.backgroundColor]="getStatusColor(data.ticket.status)">
            {{ data.ticket.status || "Statut non spécifié" }}
          </mat-chip>
        </div>
        <button class="close-btn" mat-icon-button [mat-dialog-close]>
          <mat-icon>close</mat-icon>
        </button>
      </div>
      
      <mat-divider></mat-divider>
      
      <div *ngIf="isLoading" class="loading-container">
        <mat-spinner diameter="40"></mat-spinner>
        <p>Chargement des données...</p>
      </div>
      
      <mat-tab-group *ngIf="!isLoading" animationDuration="300ms" class="ticket-tabs">
        <mat-tab label="Informations">
          <div class="tab-content">
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Qualification</span>
                <div class="info-value">{{ data.ticket.qualification || 'Non spécifié' }}</div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Priorité</span>
                <div class="info-value">
                  <div class="priority-chip" [ngClass]="getPriorityClass(data.ticket.priority)">
                    {{ data.ticket.priority || 'Non spécifiée' }}
                  </div>
                </div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Projet</span>
                <div class="info-value">{{ data.ticket.project?.name || 'Non spécifié' }}</div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Catégorie</span>
                <div class="info-value">{{ data.ticket.problemCategory?.name || 'Non spécifiée' }}</div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Assigné à</span>
                <div class="info-value">
                  {{ data.ticket.assignedTo ? data.ticket.assignedTo.name + ' ' + data.ticket.assignedTo.lastName : 'Non assigné' }}
                </div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Date de création</span>
                <div class="info-value">{{ formatDate(data.ticket.createdAt) }}</div>
              </div>
              
              <div class="info-item" *ngIf="data.ticket.updatedAt">
                <span class="info-label">Dernière mise à jour</span>
                <div class="info-value">{{ formatDate(data.ticket.updatedAt) }}</div>
              </div>
              
              <div class="info-item">
                <span class="info-label">Durée de travail</span>
                <div class="info-value">{{ getWorkTimeDisplay() }}</div>
              </div>

              <div class="info-item" *ngIf="data.ticket.attachment">
                <span class="info-label">Pièce jointe</span>
                <div class="info-value">
                  <a [href]="getAttachmentUrl(data.ticket.attachment)" target="_blank" class="attachment-link">
                    <mat-icon class="attachment-icon">attach_file</mat-icon>
                    {{ data.ticket.attachment.split('/').pop() }}
                  </a>
                </div>
              </div>
            </div>
            
            <mat-divider class="section-divider"></mat-divider>
            
            <div class="description-section">
              <h3 class="section-title">Description</h3>
              <div class="description-content">
                <p *ngIf="data.ticket.description">{{ data.ticket.description }}</p>
                <p *ngIf="!data.ticket.description" class="empty-content">Aucune description disponible</p>
              </div>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Commentaires">
          <div class="tab-content">
            <div class="comments-section" *ngIf="hasComments()">
              <div class="comment-item" *ngFor="let comment of getComments()">
                <div class="comment-header">
                  <span class="comment-author">{{ comment.author }}</span>
                  <span class="comment-date">{{ formatDate(comment.date) }}</span>
                </div>
                <div class="comment-content">{{ comment.content }}</div>
              </div>
            </div>
            <div class="empty-content" *ngIf="!hasComments()">
              <mat-icon>comment</mat-icon>
              <p>Aucun commentaire disponible</p>
            </div>
          </div>
        </mat-tab>
        
        <mat-tab label="Rapport" *ngIf="data.ticket.report">
          <div class="tab-content">
            <div class="report-section">
              <p class="report-content">{{ data.ticket.report }}</p>
            </div>
          </div>
        </mat-tab>
      </mat-tab-group>
      
      <div class="dialog-footer">
        <button mat-button class="cancel-button" [mat-dialog-close]>Fermer</button>
      </div>
    </div>
  `,
  styles: [`
    .dialog-container {
      display: flex;
      flex-direction: column;
      max-width: 700px;
      max-height: 80vh;
      border-radius: 8px;
      overflow: hidden;
    }
    
    .loading-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      gap: 16px;
    }
    
    .loading-container p {
      color: #666;
      font-size: 14px;
    }
    
    .dialog-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding: 24px 24px 16px;
      background: linear-gradient(135deg, #f8f9fa 0%, #f5f5f5 100%);
    }
    
    .header-content {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    
    .dialog-title {
      font-size: 20px;
      font-weight: 600;
      color: #333;
      margin: 0;
      line-height: 1.3;
    }
    
    .id-chip {
      display: inline-flex;
      align-items: center;
      background-color: rgba(0, 0, 0, 0.08);
      color: #666;
      border-radius: 16px;
      padding: 2px 8px;
      font-size: 12px;
      font-weight: 500;
      max-width: fit-content;
    }
    
    .status-chip {
      color: white !important;
      font-size: 12px;
      height: 26px;
      font-weight: 500;
      max-width: fit-content;
    }
    
    .close-btn {
      margin: -12px -12px 0 0;
    }
    
    .ticket-tabs {
      flex: 1;
      overflow: hidden;
    }
    
    .tab-content {
      padding: 20px 24px;
      overflow-y: auto;
      max-height: 400px;
    }
    
    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 20px;
      margin-bottom: 10px;
    }
    
    .info-item {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    
    .info-label {
      font-size: 12px;
      font-weight: 500;
      color: #666;
      text-transform: uppercase;
    }
    
    .info-value {
      font-size: 14px;
      color: #333;
    }
    
    .attachment-link {
      display: flex;
      align-items: center;
      color: #ff7043;
      text-decoration: none;
      font-weight: 500;
      transition: color 0.2s ease;
    }
    
    .attachment-link:hover {
      color: #f4511e;
      text-decoration: underline;
    }
    
    .attachment-icon {
      font-size: 16px;
      height: 16px;
      width: 16px;
      margin-right: 8px;
    }
    
    .section-divider {
      margin: 16px 0;
    }
    
    .section-title {
      font-size: 16px;
      font-weight: 500;
      color: #ff7043;
      margin: 0 0 12px 0;
    }
    
    .description-content, .report-content {
      background-color: #f8f8f8;
      padding: 16px;
      border-radius: 8px;
      font-size: 14px;
      line-height: 1.6;
    }
    
    .empty-content {
      color: #999;
      font-style: italic;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 30px 0;
      
      mat-icon {
        font-size: 36px;
        height: 36px;
        width: 36px;
        color: #ccc;
        margin-bottom: 12px;
      }
    }
    
    .priority-chip {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 4px 10px;
      border-radius: 40px;
      font-weight: 500;
      font-size: 12px;
      min-width: 70px;
      text-align: center;
    }
    
    .priority-high {
      background-color: rgba(244, 67, 54, 0.1);
      color: #d32f2f;
      border: 1px solid rgba(244, 67, 54, 0.2);
    }
    
    .priority-medium {
      background-color: rgba(255, 152, 0, 0.1);
      color: #ef6c00;
      border: 1px solid rgba(255, 152, 0, 0.2);
    }
    
    .priority-low {
      background-color: rgba(76, 175, 80, 0.1);
      color: #2e7d32;
      border: 1px solid rgba(76, 175, 80, 0.2);
    }
    
    .comments-section {
      display: flex;
      flex-direction: column;
      gap: 16px;
    }
    
    .comment-item {
      background-color: #f8f8f8;
      border-radius: 8px;
      padding: 12px 16px;
      border-left: 3px solid #e0e0e0;
    }
    
    .comment-header {
      display: flex;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 12px;
    }
    
    .comment-author {
      font-weight: 500;
      color: #333;
    }
    
    .comment-date {
      color: #757575;
    }
    
    .comment-content {
      font-size: 14px;
      line-height: 1.5;
    }
    
    .dialog-footer {
      padding: 16px 24px;
      display: flex;
      justify-content: flex-end;
      background-color: #f8f9fa;
      border-top: 1px solid #eee;
    }
    
    .cancel-button {
      background-color: #eee;
      color: #333;
    }
    
    @media (max-width: 768px) {
      .info-grid {
        grid-template-columns: 1fr;
      }
      
      .tab-content {
        padding: 16px;
      }
    }
  `]
})
export class TicketDetailsDialogComponent implements OnInit {
  isLoading: boolean = true;
  actualWorkDuration: number | null = null;
  
  constructor(
    public dialogRef: MatDialogRef<TicketDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { ticket: Ticket },
    private ticketService: TicketService,
    private http: HttpClient
  ) {}
  
  ngOnInit(): void {
    // Fetch the latest ticket data to get up-to-date work duration
    this.isLoading = true;
    console.log('[TicketDetailsDialog] Original ticket data:', JSON.stringify(this.data.ticket));
    
    // First, request the specific /work-duration endpoint if it exists
    const apiUrl = `${environment.apiUrl}/tickets/${this.data.ticket.id}`;
    
    this.http.get<any>(apiUrl).subscribe({
      next: (directTicketData) => {
        console.log('[TicketDetailsDialog] Direct API response:', directTicketData);
        
        // Save any workDuration value directly
        if (directTicketData && typeof directTicketData.workDuration === 'number') {
          this.actualWorkDuration = directTicketData.workDuration;
          console.log('[TicketDetailsDialog] Found workDuration directly:', this.actualWorkDuration);
        }
        
        // Now use the ticket service to get all other ticket data
        this.ticketService.getTicketById(this.data.ticket.id).subscribe({
          next: (updatedTicket) => {
            if (updatedTicket) {
              // Log the complete ticket object to see all available properties
              console.log('[TicketDetailsDialog] Raw ticket data from API:', JSON.stringify(updatedTicket));
              console.log('[TicketDetailsDialog] Retrieved fresh ticket data:', {
                id: updatedTicket.id,
                status: updatedTicket.status,
                workDuration: updatedTicket.workDuration,
                allProps: Object.keys(updatedTicket)
              });
              
              // Keep the actual workDuration we found directly
              if (this.actualWorkDuration !== null) {
                console.log('[TicketDetailsDialog] Preserving actual workDuration:', this.actualWorkDuration);
                updatedTicket.workDuration = this.actualWorkDuration;
              }
              
              // Update the ticket with latest data
              this.data.ticket = updatedTicket;
            }
            this.isLoading = false;
          },
          error: (error) => {
            console.error('[TicketDetailsDialog] Error fetching latest ticket data:', error);
            this.isLoading = false;
          }
        });
      },
      error: (error) => {
        console.error('[TicketDetailsDialog] Error fetching direct API data:', error);
        
        // Fall back to just using the ticket service if direct API call fails
        this.ticketService.getTicketById(this.data.ticket.id).subscribe({
          next: (updatedTicket) => {
            if (updatedTicket) {
              this.data.ticket = updatedTicket;
            }
            this.isLoading = false;
          },
          error: (err) => {
            console.error('[TicketDetailsDialog] Error in fallback fetch:', err);
            this.isLoading = false;
          }
        });
      }
    });
  }
  
  formatDate(dateString?: string): string {
    if (!dateString) return 'Date inconnue';
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';
      
      return date.toLocaleDateString('fr-FR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }
  
  getStatusColor(status?: string): string {
    if (!status) return '#999999';
    const statusLower = status.toLowerCase();
    
    const colors: { [key: string]: string } = {
      'en attente': '#f0ad4e',
      'attente': '#f0ad4e',
      'pending': '#f0ad4e',
      'ouvert': '#f0ad4e',
      'open': '#f0ad4e',
      'assigné': '#5bc0de',
      'assigned': '#5bc0de',
      'en cours': '#428bca',
      'in progress': '#428bca',
      'résolu': '#5cb85c',
      'resolved': '#5cb85c',
      'fermé': '#5cb85c',
      'closed': '#5cb85c',
      'refusé': '#d9534f',
      'refused': '#d9534f',
      'rejected': '#d9534f'
    };
    
    for (const key in colors) {
      if (statusLower.includes(key)) {
        return colors[key];
      }
    }
    
    return '#999999';
  }
  
  getPriorityClass(priority?: string): string {
    if (!priority) return '';
    
    const priorityLower = priority.toLowerCase();
    
    if (priorityLower.includes('haute') || priorityLower.includes('high')) {
      return 'priority-high';
    } else if (priorityLower.includes('moyenne') || priorityLower.includes('medium')) {
      return 'priority-medium';
    } else if (priorityLower.includes('basse') || priorityLower.includes('low')) {
      return 'priority-low';
    }
    
    return '';
  }
  
  getWorkTimeDisplay(): string {
    const ticket = this.data.ticket;
    
    console.log('[TicketDetailsDialog] Checking work duration for ticket:', {
      id: ticket.id,
      workDuration: ticket.workDuration,
      actualWorkDuration: this.actualWorkDuration,
      temporarilyStopped: ticket.temporarilyStopped,
      startWorkTime: ticket.startWorkTime,
      finishWorkTime: ticket.finishWorkTime,
      currentSessionDuration: ticket.currentSessionDuration
    });
    
    // First check for the actualWorkDuration that we got directly from the API
    if (this.actualWorkDuration !== null && this.actualWorkDuration > 0) {
      console.log(`[TicketDetailsDialog] Using actual work duration: ${this.actualWorkDuration} seconds`);
      const hours = Math.floor(this.actualWorkDuration / 3600);
      const minutes = Math.floor((this.actualWorkDuration % 3600) / 60);
      const seconds = Math.floor(this.actualWorkDuration % 60);
      return `${hours}h ${minutes}min ${seconds}s`;
    }
    
    // Then check for workDuration from the ticket
    if (ticket.workDuration !== undefined && ticket.workDuration !== null && ticket.workDuration > 0) {
      console.log(`[TicketDetailsDialog] Using work duration from ticket: ${ticket.workDuration} seconds`);
      const hours = Math.floor(ticket.workDuration / 3600);
      const minutes = Math.floor((ticket.workDuration % 3600) / 60);
      const seconds = Math.floor(ticket.workDuration % 60);
      return `${hours}h ${minutes}min ${seconds}s`;
    }
    
    // Calculate from start/finish times if available
    if (ticket.startWorkTime && ticket.finishWorkTime) {
      const start = new Date(ticket.startWorkTime);
      const end = new Date(ticket.finishWorkTime);
      const diff = (end.getTime() - start.getTime()) / 1000; // in seconds
      console.log(`[TicketDetailsDialog] Calculated duration from start/finish: ${diff} seconds`);
      const hours = Math.floor(diff / 3600);
      const minutes = Math.floor((diff % 3600) / 60);
      const seconds = Math.floor(diff % 60);
      return `${hours}h ${minutes}min ${seconds}s`;
    }
    
    // Check for current session duration
    if (ticket.currentSessionDuration) {
      console.log(`[TicketDetailsDialog] Using current session duration: ${ticket.currentSessionDuration} seconds`);
      const hours = Math.floor(ticket.currentSessionDuration / 3600);
      const minutes = Math.floor((ticket.currentSessionDuration % 3600) / 60);
      const seconds = Math.floor(ticket.currentSessionDuration % 60);
      return `${hours}h ${minutes}min ${seconds}s (en cours)`;
    }
    
    // Default to zero
    console.log(`[TicketDetailsDialog] No duration found, returning zero`);
    return '0h 0min 0s';
  }
  
  hasComments(): boolean {
    return !!this.data.ticket.commentaire && this.data.ticket.commentaire.trim() !== '';
  }
  
  getComments(): any[] {
    if (!this.hasComments()) return [];
    
    // For simplicity, we'll treat the commentaire field as a single comment
    // In a real app, you'd parse JSON comments or get them from an API
    return [{
      author: this.data.ticket.assignedTo?.name || 'Utilisateur',
      date: this.data.ticket.updatedAt || this.data.ticket.createdAt,
      content: this.data.ticket.commentaire
    }];
  }
  
  getAttachmentUrl(attachmentPath: string): string {
    if (!attachmentPath) return '';
    
    // Handle absolute URLs
    if (attachmentPath.startsWith('http')) {
      return attachmentPath;
    }
    
    // Make sure the path starts with a slash
    const normalizedPath = attachmentPath.startsWith('/') ? attachmentPath : `/${attachmentPath}`;
    
    // Get the API base URL from the environment and remove '/api' since uploads are served from the root
    const apiBaseUrl = environment.apiUrl.replace('/api', '');
    
    // Combine API base URL with the attachment path
    return `${apiBaseUrl}${normalizedPath}`;
  }
} 