import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AssignmentService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getAssignments(): Observable<any> {
    return this.http
      .get<any>(this.apiUrl, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error fetching assignments:', error);
          return throwError(
            () => 'Failed to fetch assignments. Please try again later.'
          );
        })
      );
  }

  getAssignment(id: string | number): Observable<any> {
    return this.http
      .get<any>(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error(`Error fetching assignment with ID ${id}:`, error);
          return throwError(
            () => 'Failed to fetch assignment details. Please try again later.'
          );
        })
      );
  }

  createAssignment(assignment: any): Observable<any> {
    return this.http
      .post<any>(this.apiUrl, assignment, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error('Error creating assignment:', error);
          return throwError(
            () => 'Failed to create assignment. Please try again later.'
          );
        })
      );
  }

  updateAssignment(id: string | number, assignment: any): Observable<any> {
    return this.http
      .put<any>(`${this.apiUrl}/${id}`, assignment, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(`Error updating assignment with ID ${id}:`, error);
          return throwError(
            () => 'Failed to update assignment. Please try again later.'
          );
        })
      );
  }

  deleteAssignment(id: string | number): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/${id}`, { headers: this.createHeaders() })
      .pipe(
        catchError((error) => {
          console.error(`Error deleting assignment with ID ${id}:`, error);
          return throwError(
            () => 'Failed to delete assignment. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a project to a chef de projet
   */
  assignProjectToChef(
    projectId: string | number,
    chefId: string | number
  ): Observable<any> {
    console.log(`Attempting to assign project ${projectId} to chef ${chefId}`);

    return this.http
      .post<any>(
        `${this.apiUrl}/projects/${chefId}/assign-project`,
        { projectId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning project ${projectId} to chef ${chefId}:`,
            error
          );
          return throwError(
            () => 'Failed to assign project to chef. Please try again later.'
          );
        })
      );
  }

  /**
   * Unassign a project from a chef de projet
   */
  unassignProjectFromChef(
    projectId: string | number,
    chefId?: string | number
  ): Observable<any> {
    // If chefId is provided, use the endpoint for removing a project from a specific chef
    if (chefId !== undefined) {
      console.log(`Removing project ${projectId} from specific chef ${chefId}`);
      return this.http
        .post<any>(
          `${this.apiUrl}/projects/${chefId}/remove-project`,
          { projectId },
          { headers: this.createHeaders() }
        )
        .pipe(
          catchError((error) => {
            console.error(
              `Error unassigning project ${projectId} from chef ${chefId}:`,
              error
            );
            return throwError(
              () =>
                'Failed to unassign project from chef. Please try again later.'
            );
          })
        );
    }

    // Otherwise use the general endpoint that removes the primary chef
    console.log(`Removing primary chef from project ${projectId}`);
    return this.http
      .delete<any>(`${this.apiUrl}/projects/${projectId}/remove-chef`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error unassigning project ${projectId} from chef:`,
            error
          );
          return throwError(
            () =>
              'Failed to unassign project from chef. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a project to a client
   */
  assignProjectToClient(
    projectId: string | number,
    clientId: string | number
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/projects/assign-project-to-client`,
        { projectId, clientId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning project ${projectId} to client ${clientId}:`,
            error
          );
          return throwError(
            () => 'Failed to assign project to client. Please try again later.'
          );
        })
      );
  }

  /**
   * Unassign a project from a client
   */
  unassignProjectFromClient(
    projectId: number | string,
    clientId: number | string
  ): Observable<any> {
    return this.http
      .delete<any>(`${this.apiUrl}/projects/${projectId}/remove-client`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error unassigning project ${projectId} from client ${clientId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to unassign project from client. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a collaborator to a chef de projet
   */
  assignCollaboratorToChef(
    collaboratorId: string | number,
    chefId: string | number
  ): Observable<any> {
    console.log(
      `Attempting to assign collaborator ${collaboratorId} to chef ${chefId}`
    );

    return this.http
      .post<any>(
        `${this.apiUrl}/users/${chefId}/assign-collaborateur`,
        { collaborateurId: collaboratorId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning collaborator ${collaboratorId} to chef ${chefId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to assign collaborator to chef. Please try again later.'
          );
        })
      );
  }

  /**
   * Unassign a collaborator from a chef de projet
   */
  unassignCollaboratorFromChef(
    collaboratorId: string | number,
    chefId: string | number
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/users/${collaboratorId}/remove-from-chef`,
        { chefProjetId: chefId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error unassigning collaborator ${collaboratorId} from chef ${chefId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to unassign collaborator from chef. Please try again later.'
          );
        })
      );
  }

  /**
   * Assign a problem category to a client
   */
  assignCategoryToClient(
    categoryId: number | string,
    clientId: number | string
  ): Observable<any> {
    return this.http
      .post<any>(
        `${this.apiUrl}/problem-categories/assign-to-client`,
        { problemCategoryId: categoryId, clientId },
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error assigning category ${categoryId} to client ${clientId}:`,
            error
          );
          return throwError(
            () => 'Failed to assign category to client. Please try again later.'
          );
        })
      );
  }

  /**
   * Unassign a problem category from a client
   */
  unassignCategoryFromClient(
    categoryId: number | string,
    clientId: number | string
  ): Observable<any> {
    return this.http
      .delete<any>(
        `${this.apiUrl}/problem-categories/${categoryId}/client/${clientId}`,
        { headers: this.createHeaders() }
      )
      .pipe(
        catchError((error) => {
          console.error(
            `Error unassigning category ${categoryId} from client ${clientId}:`,
            error
          );
          return throwError(
            () =>
              'Failed to unassign category from client. Please try again later.'
          );
        })
      );
  }

  /**
   * Get projects assigned to a client
   */
  getProjectsByClientId(clientId: number | string): Observable<any[]> {
    return this.http
      .get<any[]>(`${this.apiUrl}/projects/client/${clientId}/projects`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching projects for client ${clientId}:`,
            error
          );
          return throwError(
            () => 'Failed to fetch client projects. Please try again later.'
          );
        })
      );
  }

  /**
   * Create HTTP headers for API requests
   */
  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
    });
  }
}
