import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FormsModule } from '@angular/forms';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { MatSelectModule } from '@angular/material/select';
import { MatTooltipModule } from '@angular/material/tooltip';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { CountryService } from '../../../services/country.service';
import { Country } from '../../../models/country.model';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-pays-list',
  templateUrl: './pays-list.component.html',
  styleUrls: ['./pays-list.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    FormsModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    MatTooltipModule,
    TopBarComponent,
    NavbarComponent,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('cardEnter', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class PaysListComponent implements OnInit {
  pays: Country[] = [];
  nouveauPays: Country | null = null;
  isLoading = false;
  countryOptions: Country[] = [];
  searchTerm = '';
  activeCard: number | null = null;

  constructor(
    private countryService: CountryService,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadCountries();
    this.loadAvailableCountries();
  }

  loadAvailableCountries(): void {
    this.countryService.getAvailableCountries().subscribe({
      next: (countries: Country[]) => {
        this.countryOptions = countries.sort((a, b) => a.name.localeCompare(b.name));
      },
      error: (error: Error) => {
        console.error('Error loading available countries:', error);
        this.snackBar.open('Erreur lors du chargement des pays disponibles', 'Fermer', {
          duration: 3000,
        });
      },
    });
  }

  loadCountries(): void {
    this.isLoading = true;
    this.countryService.getCountries().subscribe({
      next: (countries: Country[]) => {
        this.pays = countries.sort((a, b) => a.name.localeCompare(b.name));
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error: Error) => {
        console.error('Error loading countries:', error);
        this.isLoading = false;
        this.snackBar.open('Erreur lors du chargement des pays', 'Fermer', {
          duration: 3000,
        });
      },
    });
  }

  getFilteredCountries(): Country[] {
    if (!this.searchTerm.trim()) {
      return this.pays;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.pays.filter(
      country => 
        country.name.toLowerCase().includes(term) || 
        country.code.toLowerCase().includes(term)
    );
  }

  onCountrySelect(country: Country): void {
    this.nouveauPays = country;
  }

  ajouterPays(): void {
    if (this.nouveauPays) {
      this.countryService.addCountry(this.nouveauPays).subscribe({
        next: (country: Country) => {
          this.pays.push(country);
          this.pays.sort((a, b) => a.name.localeCompare(b.name));
          this.countryOptions = this.countryOptions.filter(
            (c) => c.code !== country.code
          );
          this.nouveauPays = null;
          this.snackBar.open('Pays ajouté avec succès', 'Fermer', {
            duration: 3000,
          });
        },
        error: (error: Error) => {
          console.error('Error adding country:', error);
          this.snackBar.open('Erreur lors de l\'ajout du pays', 'Fermer', {
            duration: 3000,
          });
        },
      });
    }
  }

  deleteCountry(country: Country): void {
    if (country.id) {
      if (confirm(`Êtes-vous sûr de vouloir supprimer ${country.name}?`)) {
        this.countryService.deleteCountry(country.id).subscribe({
          next: () => {
            this.pays = this.pays.filter((p) => p.id !== country.id);
            this.loadAvailableCountries(); // Refresh available list
            this.snackBar.open('Pays supprimé avec succès', 'Fermer', { duration: 3000 });
          },
          error: (error: Error) => {
            console.error('Error deleting country:', error);
            this.snackBar.open('Erreur lors de la suppression du pays', 'Fermer', {
              duration: 3000,
            });
          },
        });
      }
    }
  }

  handleFlagError(event: Event): void {
    const img = event.target as HTMLImageElement;
    if (img.src.includes('flagcdn')) {
      // If flagcdn image fails, try local fallback
      img.src = '/assets/img/flag.png'; // Path to your public/flag.png
    } else {
      // If local fallback also fails, show empty
      img.style.display = 'none';
    }
  }

  setActiveCard(countryId: number | null | undefined) {
    this.activeCard = countryId || null;
  }
}
