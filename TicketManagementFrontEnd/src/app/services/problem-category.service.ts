import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import { ProblemCategory } from '../models/problem-category.model';

@Injectable({
  providedIn: 'root',
})
export class ProblemCategoryService {
  private apiUrl = environment.apiUrl + '/problem-categories';

  constructor(private http: HttpClient) {}

  /**
   * Get all problem categories
   * @returns Observable with all problem categories
   */
  getCategories(): Observable<ProblemCategory[]> {
    return this.http
      .get<ProblemCategory[]>(`${this.apiUrl}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching problem categories:', error);
          return throwError(
            () => 'Failed to fetch problem categories. Please try again later.'
          );
        })
      );
  }

  /**
   * Get problem category by ID
   * @param id The category ID
   * @returns Observable with the problem category
   */
  getCategory(id: string): Observable<ProblemCategory> {
    return this.http
      .get<ProblemCategory>(`${this.apiUrl}/${id}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching problem category:', error);
          return throwError(
            () =>
              'Failed to fetch problem category details. Please try again later.'
          );
        })
      );
  }

  /**
   * Create a new problem category
   * @param category The problem category to create
   * @returns Observable with the created problem category
   */
  addCategory(category: ProblemCategory): Observable<ProblemCategory> {
    return this.http
      .post<ProblemCategory>(`${this.apiUrl}`, category, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error creating problem category:', error);
          return throwError(
            () => 'Failed to create problem category. Please try again.'
          );
        })
      );
  }

  /**
   * Update an existing problem category
   * @param id The category ID
   * @param category The updated problem category
   * @returns Observable with the updated problem category
   */
  updateCategory(
    id: string,
    category: ProblemCategory
  ): Observable<ProblemCategory> {
    return this.http
      .put<ProblemCategory>(`${this.apiUrl}/${id}`, category, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error updating problem category:', error);
          return throwError(
            () => 'Failed to update problem category. Please try again.'
          );
        })
      );
  }

  /**
   * Delete a problem category
   * @param id The category ID
   * @returns Observable with the result of the operation
   */
  deleteCategory(id: string): Observable<any> {
    return this.http
      .delete(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error deleting problem category:', error);
          return throwError(
            () => 'Failed to delete problem category. Please try again.'
          );
        })
      );
  }

  /**
   * Get problem categories for a specific client
   * @param clientId The client ID
   * @returns Observable with problem categories for the client
   */
  getCategoriesByClientId(clientId: string): Observable<ProblemCategory[]> {
    return this.http
      .get<ProblemCategory[]>(`${this.apiUrl}/client/${clientId}`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching client problem categories:', error);
          return throwError(
            () => 'Failed to fetch client problem categories. Please try again.'
          );
        })
      );
  }

  /**
   * Get all qualifications (problem categories)
   * @returns Observable with all qualifications
   */
  getQualifications(): Observable<ProblemCategory[]> {
    return this.http
      .get<ProblemCategory[]>(`${this.apiUrl}/qualifications`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error fetching qualifications:', error);
          return throwError(
            () => 'Failed to fetch qualifications. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a problem category to a client
   * @param clientId The client ID
   * @param problemCategoryId The problem category ID
   * @returns Observable with the result of the operation
   */
  assignCategoryToClient(
    clientId: string,
    problemCategoryId: string
  ): Observable<any> {
    const dto = {
      clientId: clientId,
      problemCategoryId: problemCategoryId,
    };

    return this.http
      .post(`${this.apiUrl}/assign-to-client`, dto, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error('Error assigning problem category to client:', error);
          return throwError(
            () =>
              'Failed to assign problem category to client. Please try again.'
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
