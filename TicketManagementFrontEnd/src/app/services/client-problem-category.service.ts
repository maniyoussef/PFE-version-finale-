import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProblemCategory } from '../models/problem-category.model';
import { Client } from '../models/client.model';

@Injectable({
  providedIn: 'root',
})
export class ClientProblemCategoryService {
  private apiUrl = environment.apiUrl + '/client-problem-categories';

  constructor(private http: HttpClient) {}

  /**
   * Get all client-problem category relationships
   * @returns Observable with all client-problem category relationships
   */
  getAllRelationships(): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            'Error fetching client-problem category relationships:',
            error
          );
          return throwError(
            () =>
              'Failed to fetch client-problem category relationships. Please try again later.'
          );
        })
      );
  }

  /**
   * Get client-problem category relationship by ID
   * @param id The relationship ID
   * @returns Observable with the client-problem category relationship
   */
  getRelationshipById(id: string): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            'Error fetching client-problem category relationship:',
            error
          );
          return throwError(
            () =>
              'Failed to fetch client-problem category relationship. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a problem category to a client
   * @param clientId The client ID
   * @param categoryId The problem category ID
   * @returns Observable with the result of the operation
   */
  assignCategoryToClient(
    clientId: string,
    categoryId: string
  ): Observable<any> {
    const body = { clientId, problemCategoryId: categoryId };
    return this.http
      .post(`${this.apiUrl}/assign`, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error assigning problem category to client:', error);
          return throwError(
            () =>
              'Failed to assign problem category to client. Please try again later.'
          );
        })
      );
  }

  /**
   * Remove a problem category from a client
   * @param clientId The client ID
   * @param categoryId The problem category ID
   * @returns Observable with the result of the operation
   */
  removeCategoryFromClient(
    clientId: string,
    categoryId: string
  ): Observable<any> {
    const body = { clientId, problemCategoryId: categoryId };
    return this.http
      .post(`${this.apiUrl}/remove`, body, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error removing problem category from client:', error);
          return throwError(
            () =>
              'Failed to remove problem category from client. Please try again later.'
          );
        })
      );
  }

  /**
   * Get all problem categories assigned to a client
   * @param clientId The client ID
   * @returns Observable with problem categories assigned to the client
   */
  getCategoriesByClientId(clientId: string): Observable<ProblemCategory[]> {
    return this.http
      .get<ProblemCategory[]>(`${this.apiUrl}/client/${clientId}/categories`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching problem categories for client:', error);
          return throwError(
            () =>
              'Failed to fetch problem categories for client. Please try again later.'
          );
        })
      );
  }

  /**
   * Get all clients assigned to a problem category
   * @param categoryId The problem category ID
   * @returns Observable with clients assigned to the problem category
   */
  getClientsByCategoryId(categoryId: string): Observable<Client[]> {
    return this.http
      .get<Client[]>(`${this.apiUrl}/category/${categoryId}/clients`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching clients for problem category:', error);
          return throwError(
            () =>
              'Failed to fetch clients for problem category. Please try again later.'
          );
        })
      );
  }

  /**
   * Create HTTP headers for API requests
   * @returns HttpHeaders object with content type
   */
  private createHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Content-Type': 'application/json' });
  }
}
