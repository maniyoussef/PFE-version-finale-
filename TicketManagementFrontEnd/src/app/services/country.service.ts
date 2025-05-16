import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Country } from '../models/country.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CountryService {
  // Remove the /api prefix since it's already in the controller route
  private apiUrl = `${environment.apiUrl}/countries`;

  constructor(private http: HttpClient) {}

  getCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(this.apiUrl);
  }

  getAvailableCountries(): Observable<Country[]> {
    return this.http.get<Country[]>(`${this.apiUrl}/available`);
  }

  addCountry(country: Country): Observable<Country> {
    return this.http.post<Country>(this.apiUrl, country);
  }

  deleteCountry(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
