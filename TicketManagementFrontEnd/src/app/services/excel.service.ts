import { Injectable } from '@angular/core';
import { Ticket } from '../models/ticket.model';
import * as XLSX from 'xlsx';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
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
      { wch: 50 }  // Comments
    ];
    
    worksheet['!cols'] = columnWidths;
    
    // Create workbook
    const workbook: XLSX.WorkBook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Tickets');
    
    // Generate Excel file
    XLSX.writeFile(workbook, `${fileName}.xlsx`);
  }

  private prepareTicketData(tickets: Ticket[]): any[] {
    return tickets.map(ticket => ({
      'Titre': ticket.title || 'Non spécifié',
      'Qualification': ticket.qualification || 'Non spécifié',
      'Priorité': ticket.priority || 'Non spécifié',
      'Projet': ticket.project?.name || 'Non spécifié',
      'Catégorie': ticket.problemCategory?.name || 'Non spécifié',
      'Statut': this.formatStatus(ticket.status) || 'Non spécifié',
      'Assigné à': ticket.assignedTo ? 
        `${ticket.assignedTo.name || ''} ${ticket.assignedTo.lastName || ''}`.trim() || 'Non spécifié' : 
        'Non assigné',
      'Date de création': this.formatDate(ticket.createdAt),
      'Durée de travail': this.formatWorkDuration(ticket.workDuration),
      'Description': ticket.description || '',
      'Commentaires': ticket.commentaire || ''
    }));
  }

  private formatStatus(status: string | undefined): string {
    if (!status) return 'Non spécifié';
    
    switch(status) {
      case 'Assigned': return 'Assigné';
      case 'In Progress': return 'En cours';
      case 'Resolved': return 'Résolu';
      case 'Unresolved': return 'Non résolu';
      default: return status;
    }
  }
  
  private formatWorkDuration(seconds: number | undefined): string {
    if (!seconds) return '00:00:00';
    
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
        minute: '2-digit'
      });
    } catch (error) {
      return 'Date invalide';
    }
  }
} 