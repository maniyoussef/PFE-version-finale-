import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { User } from '../models/user.model';
import { environment } from '../../environments/environment';
import { catchError, map } from 'rxjs/operators';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Basic CRUD operations
  getUsers(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/users`, { headers: this.createHeaders() })
      .pipe(catchError(this.handleError));
  }

  getUser(id: number): Observable<User> {
    return this.http
      .get<User>(`${this.apiUrl}/users/${id}`, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  createUser(user: User): Observable<User> {
    return this.http
      .post<User>(`${this.apiUrl}/users`, user, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  updateUser(id: number, user: User): Observable<User> {
    return this.http
      .put<User>(`${this.apiUrl}/users/${id}`, user, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  deleteUser(id: number): Observable<void> {
    return this.http
      .delete<void>(`${this.apiUrl}/users/${id}`, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Role-specific operations
  getChefsProjet(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/users/chefs-projet`, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getCollaborateurs(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/users/collaborateurs`, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  getClients(): Observable<User[]> {
    return this.http
      .get<User[]>(`${this.apiUrl}/users/clients`, {
        headers: this.createHeaders(),
      })
      .pipe(catchError(this.handleError));
  }

  // Assignment operations
  assignCollaborateurToChef(
    collaborateurId: number,
    chefId: number
  ): Observable<void> {
    return this.http
      .post<void>(
        `${this.apiUrl}/users/${chefId}/assign-collaborateur`,
        { collaborateurId: collaborateurId },
        { headers: this.createHeaders() }
      )
      .pipe(catchError(this.handleError));
  }

  getCollaborateursByChefId(chefId: number | undefined): Observable<User[]> {
    if (chefId === undefined) {
      console.error('Chef ID is undefined');
      return of([]);
    }
    return this.http
      .get<User[]>(
        `${this.apiUrl}/users/chef-projet/${chefId}/collaborateurs`,
        {
          headers: this.createHeaders(),
        }
      )
      .pipe(catchError(this.handleError));
  }

  private createHeaders(): HttpHeaders {
    const token = localStorage.getItem('token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  private handleError(error: any): Observable<never> {
    console.error('An error occurred:', error);
    throw error;
  }
}
