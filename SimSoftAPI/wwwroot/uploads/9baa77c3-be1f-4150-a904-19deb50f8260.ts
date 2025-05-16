import { Component, type OnInit } from '@angular/core';
import { NavbarComponent } from '../../../components/navbar/navbar.component';
import { TopBarComponent } from '../../../components/top-bar/top-bar.component';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { CommonModule, DatePipe } from '@angular/common';
import type { Ticket } from '../../../models/ticket.model';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TicketService } from '../../../services/ticket.service';

@Component({
  selector: 'app-tickets',
  standalone: true,
  templateUrl: './tickets.component.html',
  styleUrls: ['./tickets.component.scss'],
  imports: [
    CommonModule,
    NavbarComponent,
    TopBarComponent,
    MatCardModule,
    MatChipsModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    DatePipe,
  ],
})
export class TicketsComponent implements OnInit {
  tickets: Ticket[] = [];
  isLoading = false;

  constructor(private ticketService: TicketService) {}

  ngOnInit() {
    this.loadTickets();
  }

  loadTickets() {
    this.isLoading = true;
    this.ticketService.getTickets().subscribe({
      next: (tickets: Ticket[]) => {
        this.tickets = tickets;
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Failed to load tickets:', err);
        this.isLoading = false;
      },
    });
  }

  getPriorityColor(priority: string): string {
    const colors: { [key: string]: string } = {
      Urgent: '#dc3545',
      Élevé: '#fd7e14',
      Moyen: '#ffc107',
      Faible: '#28a745',
      Amélioration: '#4d96ff',
    };
    return colors[priority] || '#000000';
  }

  getAttachmentIcon(fileType: string | undefined): string {
    if (!fileType) return 'attach_file';
    const icons: { [key: string]: string } = {
      pdf: 'picture_as_pdf',
      doc: 'description',
      docx: 'description',
      xls: 'table_chart',
      xlsx: 'table_chart',
      jpg: 'image',
      jpeg: 'image',
      png: 'image',
      gif: 'image',
    };
    return icons[fileType.toLowerCase()] || 'attach_file';
  }
}
