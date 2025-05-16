import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Role } from '../models/role.model';

@Injectable({
  providedIn: 'root',
})
export class RoleService {
  private apiUrl = 'http://localhost:5000/api/roles'; // Adjust backend URL if needed

  constructor(private http: HttpClient) {}

  getRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.apiUrl);
  }

  addRole(role: Role): Observable<Role> {
    return this.http.post<Role>(this.apiUrl, role);
  }

  deleteRole(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
