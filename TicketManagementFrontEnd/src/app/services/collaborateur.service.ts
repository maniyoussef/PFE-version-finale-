import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { User } from '../models/user.model';

@Injectable({
  providedIn: 'root',
})
export class CollaborateurService {
  private apiUrl = `${environment.apiUrl}/collaborateurs`;

  constructor(private http: HttpClient) {}

  /**
   * Get all collaborateurs
   */
  getCollaborateurs(): Observable<User[]> {
    return this.http
      .get<User[]>(this.apiUrl, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error fetching collaborateurs:', error);
          return throwError(
            () => 'Failed to fetch collaborateurs. Please try again later.'
          );
        })
      );
  }

  /**
   * Get a collaborateur by ID
   */
  getCollaborateur(id: string | number): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching collaborateur with ID ${id}:`, error);
          return throwError(
            () =>
              'Failed to fetch collaborateur details. Please try again later.'
          );
        })
      );
  }

  /**
   * Get collaborateurs assigned to a chef
   */
  getCollaborateursByChefId(chefId: string | number): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/chef/${chefId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching collaborateurs for chef with ID ${chefId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to fetch collaborateurs by chef. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign collaborateur to a project
   */
  assignCollaborateurToProject(
    collaborateurId: string | number,
    projectId: string | number
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/${collaborateurId}/projects/${projectId}`,
        {},
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning collaborateur ${collaborateurId} to project ${projectId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to assign collaborateur to project. Please try again later.'
          );
        })
      );
  }

  /**
   * Get tickets assigned to a collaborateur
   */
  getCollaborateurTickets(collaborateurId: string | number): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/${collaborateurId}/tickets`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching tickets for collaborateur with ID ${collaborateurId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to fetch collaborateur tickets. Please try again later.'
          );
        })
      );
  }

  /**
   * Update collaborateur availability status
   */
  updateCollaborateurStatus(
    collaborateurId: string | number,
    status: { isAvailable: boolean }
  ): Observable<User> {
    return this.http
      .patch<User>(`${this.apiUrl}/${collaborateurId}/status`, status, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error updating status for collaborateur with ID ${collaborateurId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to update collaborateur status. Please try again later.'
          );
        })
      );
  }

  /**
   * Create HTTP headers
   */
  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
}
