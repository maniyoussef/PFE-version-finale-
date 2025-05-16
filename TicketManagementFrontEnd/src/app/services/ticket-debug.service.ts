import { Injectable } from '@angular/core';
import { Ticket } from '../models/ticket.model';

@Injectable({
  providedIn: 'root'
})
export class TicketDebugService {
  private static readonly TICKET_STATUS = {
    ASSIGNED: 'Assigné',
    IN_PROGRESS: 'En cours',
    RESOLVED: 'Résolu',
    UNRESOLVED: 'Non résolu',
    REFUSED: 'Refusé',
    ACCEPTED: 'Accepté'
  };

  constructor() {}

  /**
   * Logs the current state of a ticket for debugging purposes
   */
  logTicketState(ticket: Ticket, context: string): void {
    console.group(`[TicketDebug] ${context} - Ticket #${ticket.id}`);
    console.log('Title:', ticket.title);
    console.log('Status:', ticket.status);
    console.log('TemporarilyStopped:', ticket.temporarilyStopped);
    console.log('WorkFinished:', ticket.workFinished);
    console.log('StartWorkTime:', ticket.startWorkTime);
    console.log('FinishWorkTime:', ticket.finishWorkTime);
    console.log('WorkDuration:', ticket.workDuration);
    console.groupEnd();
  }

  /**
   * Validates if the ticket state is consistent
   * Returns issues if any are found
   */
  validateTicketState(ticket: Ticket): string[] {
    const issues: string[] = [];
    const { ASSIGNED, IN_PROGRESS, RESOLVED, UNRESOLVED } = TicketDebugService.TICKET_STATUS;

    // Check for missing required properties
    if (ticket.status === undefined) issues.push('Status is undefined');
    if (ticket.temporarilyStopped === undefined) issues.push('temporarilyStopped is undefined');
    if (ticket.workFinished === undefined) issues.push('workFinished is undefined');

    // Logic checks
    if (ticket.status === IN_PROGRESS && ticket.workFinished === true) {
      issues.push('Ticket is in progress but marked as finished');
    }

    if (ticket.status === ASSIGNED && ticket.startWorkTime) {
      issues.push('Ticket is assigned but has a start time');
    }

    if ((ticket.status === RESOLVED || ticket.status === UNRESOLVED) && !ticket.workFinished) {
      issues.push(`Ticket is ${ticket.status} but not marked as finished`);
    }

    return issues;
  }

  /**
   * Fix common ticket state inconsistencies
   */
  fixTicketState(ticket: Ticket): Ticket {
    const { ASSIGNED, IN_PROGRESS, RESOLVED, UNRESOLVED, ACCEPTED } = TicketDebugService.TICKET_STATUS;
    const fixed = { ...ticket };

    // Ensure boolean properties are actual booleans
    fixed.temporarilyStopped = fixed.temporarilyStopped === true;
    fixed.workFinished = fixed.workFinished === true;

    // Fix status-workflow property mismatches
    if (fixed.status === ASSIGNED) {
      fixed.temporarilyStopped = false;
      fixed.workFinished = false;
      fixed.startWorkTime = undefined;
      fixed.finishWorkTime = undefined;
    }

    // Handle ACCEPTED status
    if (fixed.status === ACCEPTED) {
      fixed.temporarilyStopped = false;
      fixed.workFinished = false;
      fixed.startWorkTime = undefined;
      fixed.finishWorkTime = undefined;
    }

    if (fixed.status === IN_PROGRESS && fixed.workFinished) {
      fixed.workFinished = false;
    }

    if ((fixed.status === RESOLVED || fixed.status === UNRESOLVED) && !fixed.workFinished) {
      fixed.workFinished = true;
    }

    return fixed;
  }
} 