import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all clients
   */
  getClients(): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/clients`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error fetching clients:', error);
          return throwError(
            () => 'Failed to fetch clients. Please try again later.'
          );
        })
      );
  }

  /**
   * Get client by ID
   */
  getClient(id: string): Observable<any> {
    return this.http
      .get(`${this.apiUrl}/clients/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching client ${id}:`, error);
          return throwError(
            () => 'Failed to fetch client details. Please try again later.'
          );
        })
      );
  }

  /**
   * Add a new client
   */
  addClient(clientData: any): Observable<any> {
    return this.http
      .post(`${this.apiUrl}/clients`, clientData, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error creating client:', error);
          return throwError(
            () => 'Failed to create client. Please try again later.'
          );
        })
      );
  }

  /**
   * Update client
   */
  updateClient(id: string, clientData: any): Observable<any> {
    return this.http
      .put(`${this.apiUrl}/clients/${id}`, clientData, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(`Error updating client ${id}:`, error);
          return throwError(
            () => 'Failed to update client. Please try again later.'
          );
        })
      );
  }

  /**
   * Delete client
   */
  deleteClient(id: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/clients/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error(`Error deleting client ${id}:`, error);
          return throwError(
            () => 'Failed to delete client. Please try again later.'
          );
        })
      );
  }

  /**
   * Get projects assigned to a client
   */
  getClientProjects(clientId: number | string): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/projects/client/${clientId}/projects`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching projects for client with ID ${clientId}:`,
            error
          );
          return throwError(
            () => 'Failed to fetch client projects. Please try again later.'
          );
        })
      );
  }

  /**
   * Create headers for HTTP requests
   */
  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
}
