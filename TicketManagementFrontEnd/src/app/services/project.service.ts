import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of, switchMap } from 'rxjs';
import { Project } from '../models/project.model';
import { environment } from '../../environments/environment';
import { catchError, map, tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class ProjectService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Basic CRUD operations
  getProjects(): Observable<Project[]> {
    // Add timestamp to URL to prevent caching
    const timestamp = new Date().getTime();
    // Create headers to prevent caching
    const headers = this.createHeaders();
    
    return this.http.get<Project[]>(`${this.apiUrl}/projects?_t=${timestamp}`, { headers }).pipe(
      catchError((error) => {
        console.error('Error fetching projects:', error);
        return of([]);
      })
    );
  }

  getProject(id: number): Observable<Project | null> {
    return this.http.get<Project>(`${this.apiUrl}/projects/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching project ${id}:`, error);
        return of(null);
      })
    );
  }

  addProject(project: Project): Observable<Project | null> {
    return this.http.post<Project>(`${this.apiUrl}/projects`, project).pipe(
      catchError((error) => {
        console.error('Error creating project:', error);
        return of(null);
      })
    );
  }

  updateProject(id: number, project: Project): Observable<Project | null> {
    return this.http
      .put<Project>(`${this.apiUrl}/projects/${id}`, project)
      .pipe(
        catchError((error) => {
          console.error(`Error updating project ${id}:`, error);
          return of(null);
        })
      );
  }

  // Check if a project can be deleted (has no associated tickets)
  canDeleteProject(id: number): Observable<{canDelete: boolean, dependencies?: string[], dependencyCount?: number, willUpdateTickets?: boolean}> {
    console.log(`[ProjectService] Checking if project ${id} can be deleted safely`);
    
    // Try using the new GET endpoint directly - don't use HEAD which gives 405 errors
    return this.http.get<any>(`${this.apiUrl}/projects/${id}/can-delete`).pipe(
      map(response => {
        console.log(`[ProjectService] Can-delete response:`, response);
        return { 
          canDelete: response.canDelete,
          dependencies: response.dependencies || [],
          dependencyCount: response.dependencyCount || 0,
          willUpdateTickets: response.willUpdateTickets || false
        };
      }),
      catchError(error => {
        console.log(`[ProjectService] Can-delete endpoint error (${error.status}), using compatibility mode`);
        
        // If endpoint doesn't exist or fails, try to directly delete the project
        // This will let the backend validation handle it
        return this.deleteProject(id).pipe(
          map(success => {
            // If deletion succeeds, then it was safe to delete
            return { canDelete: true, dependencyCount: 0 };
          }),
          catchError(deleteError => {
            // If deletion fails, parse the reason
            let errorMessage = '';
            if (deleteError.error && typeof deleteError.error === 'string' && 
                deleteError.error.includes('associated tickets')) {
              errorMessage = deleteError.error;
            } else {
              errorMessage = 'Le projet ne peut pas être supprimé, il contient probablement des tickets.';
            }
            
            return of({ 
              canDelete: false,
              dependencies: [errorMessage],
              dependencyCount: 1
            });
          })
        );
      })
    );
  }

  deleteProject(id: number): Observable<boolean> {
    // Add timestamp to URL to prevent caching
    const timestamp = new Date().getTime();
    // Create headers to prevent caching
    const headers = this.createHeaders();
    
    console.log(`[ProjectService] Attempting to delete project with ID: ${id}`);
    
    // Try with DELETE method first
    return this.http.delete(`${this.apiUrl}/projects/${id}?_t=${timestamp}`, { headers }).pipe(
      map(() => {
        console.log(`[ProjectService] Successfully deleted project with ID ${id} using DELETE method`);
        return true;
      }),
      catchError((error) => {
        console.error(`[ProjectService] Error deleting project ${id} with DELETE method:`, error);
        
        if (error.status === 404) {
          console.log(`[ProjectService] Project ${id} not found or already deleted`);
          // For 404, we might consider this a "success" since the project doesn't exist
          return of(true);
        }
        
        // If DELETE fails with other status codes, try with POST method as fallback
        console.log(`[ProjectService] Trying alternative deletion method for project ${id}`);
        
        return this.http.post(`${this.apiUrl}/projects/delete/${id}?_t=${timestamp}`, {}, { headers }).pipe(
          map(() => {
            console.log(`[ProjectService] Successfully deleted project with ID ${id} using POST method`);
            return true;
          }),
          catchError((fallbackError) => {
            console.error(`[ProjectService] Alternative deletion method also failed:`, fallbackError);
            
            // Return false to indicate failure but don't throw error to avoid breaking the UI flow
            // Detailed error info is already logged
            return of(false);
          })
        );
      })
    );
  }

  // Project assignments
  assignProjectToChef(
    projectId: number,
    chefId: number | undefined
  ): Observable<void> {
    if (chefId === undefined) {
      console.error('Chef ID is undefined');
      return of(undefined);
    }
    return this.http
      .post<void>(
        `${this.apiUrl}/projects/assign-to-chef/${projectId}`,
        { chefId },
        { headers: this.createHeaders() }
      )
      .pipe(catchError(this.handleError));
  }

  assignProjectToClient(
    projectId: number,
    clientId: number | undefined
  ): Observable<void> {
    if (clientId === undefined) {
      console.error('Client ID is undefined');
      return of(undefined);
    }

    console.log(`Assigning project ${projectId} to client ${clientId}`);

    // Updated URL to match backend controller endpoint
    return this.http
      .post<void>(
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
          return of(undefined);
        })
      );
  }

  // Project queries
  getClientProjects(clientId: number | undefined): Observable<Project[]> {
    if (clientId === undefined) {
      console.error('Client ID is undefined');
      return of([]);
    }

    console.log(`Fetching projects for client ${clientId}`);

    // Updated URL to match backend controller endpoint
    return this.http
      .get<Project[]>(`${this.apiUrl}/projects/client/${clientId}/projects`, {
        headers: this.createHeaders(),
      })
      .pipe(
        catchError((error) => {
          console.error(
            `Error fetching projects for client ${clientId}:`,
            error
          );
          return of([]);
        })
      );
  }

  // Project queries
  getProjectsByChefId(chefId: number | undefined): Observable<Project[]> {
    if (chefId === undefined) {
      console.error('Chef ID is undefined');
      return of([]);
    }

    console.log(`[ProjectService] Fetching projects for chef projet ID: ${chefId}`);
    
    // Add cache busting parameters and detailed logging
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    
    // Try the chef-projet endpoint that we confirmed works in the backend
    return this.http
      .get<Project[]>(
        `${this.apiUrl}/projects/chef-projet/${chefId}?_=${timestamp}_${random}`,
        {
          headers: this.createHeaders(),
        }
      )
      .pipe(
        tap(projects => {
          if (projects && projects.length > 0) {
            console.log(`[ProjectService] Successfully retrieved ${projects.length} projects for chef ID ${chefId}`);
            projects.forEach(project => {
              console.log(`[ProjectService] Project: ID=${project.id}, Name=${project.name}`);
            });
          } else {
            console.warn(`[ProjectService] No projects found for chef ID ${chefId}`);
          }
        }),
        catchError((error) => {
          console.error(`[ProjectService] Error fetching projects for chef ${chefId}:`, error);
          
          // If the first endpoint fails, try the alternative endpoint
          console.log(`[ProjectService] Trying fallback endpoint for chef ${chefId}`);
          return this.http
            .get<Project[]>(
              `${this.apiUrl}/projects/chef/${chefId}/projects?_=${timestamp}_${random}`,
              {
                headers: this.createHeaders(),
              }
            )
            .pipe(
              tap(projects => {
                console.log(`[ProjectService] Fallback endpoint returned ${projects.length} projects`);
              }),
              catchError(fallbackError => {
                console.error(`[ProjectService] Fallback endpoint also failed:`, fallbackError);
                return of([]);
              })
            );
        })
      );
  }

  private createHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Cache-Control': 'no-cache',
      Pragma: 'no-cache',
    });
  }

  private handleError(error: any): Observable<any> {
    console.error('Error:', error);
    return of(undefined);
  }
}
