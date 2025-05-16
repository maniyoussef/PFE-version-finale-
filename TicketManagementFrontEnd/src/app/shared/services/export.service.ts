import { Injectable } from '@angular/core';
import { Ticket } from '../../../models/ticket.model';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root',
})
export class ExportService {
  constructor() {}

  exportToExcel(tickets: Ticket[], fileName: string): void {
    // Prepare data for Excel
    const data = this.prepareTicketData(tickets);

    // Create worksheet
    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);

    // Set column widths
    const columnWidths = [
      { wch: 30 }, // Title
      { wch: 20 }, // Qualification
      { wch: 15 }, // Priority
      { wch: 20 }, // Project
      { wch: 20 }, // Problem Category
      { wch: 15 }, // Status
      { wch: 20 }, // Assigned To
      { wch: 20 }, // Created Date
      { wch: 50 }, // Description
      { wch: 50 }, // Comments
    ];

    worksheet['!cols'] = columnWidths;

    // Create workbook
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');

    // Generate Excel file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  private prepareTicketData(tickets: Ticket[]): any[] {
    return tickets.map((ticket) => ({
      Titre: ticket.title,
      Qualification: ticket.qualification || 'Non spécifié',
      Priorité: ticket.priority || 'Non spécifié',
      Projet: ticket.project?.name || 'Non spécifié',
      Catégorie: ticket.problemCategory?.name || 'Non spécifié',
      Statut: ticket.status || 'Non spécifié',
      'Assigné à': ticket.assignedTo
        ? `${ticket.assignedTo.name} ${ticket.assignedTo.lastName || ''}`
        : 'Non assigné',
      'Date de création': this.formatDate(ticket.createdAt),
      Description: ticket.description || '',
      Commentaires: ticket.commentaire || '',
    }));
  }

  private formatDate(dateString: string): string {
    if (!dateString) return 'Date inconnue';

    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'Date invalide';

      return date.toLocaleString('fr-FR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Date invalide';
    }
  }
}
