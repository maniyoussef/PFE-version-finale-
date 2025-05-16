// src/app/pages/admin/companies/companies.component.ts
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Company, CompanyService } from '../../../services/company.service';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-companies',
  templateUrl: './companies.component.html',
  styleUrls: ['./companies.component.scss'],
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
    TopBarComponent,
    NavbarComponent,
    MatProgressSpinnerModule,
  ],
  animations: [
    trigger('fadeIn', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.4s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
    trigger('fadeInList', [
      transition(':enter', [
        style({ opacity: 0, transform: 'translateY(20px)' }),
        animate('0.5s ease-out', style({ opacity: 1, transform: 'translateY(0)' })),
      ]),
    ]),
  ],
})
export class CompaniesComponent implements OnInit {
  societes: Company[] = [];
  nouvelleSociete = '';
  contactPerson = '';
  email = '';
  isLoading = false;
  error: string | null = null;
  searchTerm = '';
  sortDirection = 'asc';

  constructor(
    private companyService: CompanyService,
    private snackBar: MatSnackBar,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCompanies();
  }

  loadCompanies() {
    this.isLoading = true;
    this.error = null;

    this.companyService.getCompanies().subscribe({
      next: (companies) => {
        console.log('Loaded companies:', companies);
        this.societes = companies;
        this.sortCompanies();
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading companies:', error);
        this.error = 'Failed to load companies';
        this.isLoading = false;
        this.snackBar.open('Error loading companies', 'Close', {
          duration: 3000,
        });
      },
    });
  }

  sortCompanies() {
    this.societes.sort((a, b) => {
      const nameA = a.name.toLowerCase();
      const nameB = b.name.toLowerCase();
      const comparison = nameA.localeCompare(nameB);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleSort() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortCompanies();
  }

  getFilteredCompanies() {
    if (!this.searchTerm.trim()) {
      return this.societes;
    }
    
    const term = this.searchTerm.toLowerCase().trim();
    return this.societes.filter(
      company => company.name.toLowerCase().includes(term) || 
                (company.contactPerson && company.contactPerson.toLowerCase().includes(term)) ||
                (company.email && company.email.toLowerCase().includes(term))
    );
  }

  ajouterSociete() {
    if (
      this.nouvelleSociete.trim() &&
      this.contactPerson.trim() &&
      this.email.trim()
    ) {
      const newCompany: Company = {
        name: this.nouvelleSociete.trim(),
        contactPerson: this.contactPerson.trim(),
        email: this.email.trim(),
        phone: '',
        address: '',
      };

      this.companyService.addCompany(newCompany).subscribe({
        next: (company) => {
          this.societes.push(company);
          this.sortCompanies();
          this.resetForm();
          this.snackBar.open('Company added successfully!', 'Close', { duration: 3000 });
        },
        error: (error) => {
          console.error('Error:', error);
          this.snackBar.open(
            `Error: ${error.error.errors?.Email?.[0] || error.message || 'Unknown error'}`,
            'Close'
          );
        },
      });
    }
  }

  supprimerSociete(societe: Company) {
    if (societe.id) {
      if (confirm(`Are you sure you want to delete the company "${societe.name}"?`)) {
        this.companyService.deleteCompany(societe.id).subscribe({
          next: () => {
            this.societes = this.societes.filter((s) => s.id !== societe.id);
            this.snackBar.open('Company deleted successfully', 'Close', {
              duration: 3000,
            });
          },
          error: (error) => {
            console.error('Error deleting company:', error);
            this.snackBar.open('Error deleting company', 'Close', {
              duration: 3000,
            });
          },
        });
      }
    }
  }

  private resetForm() {
    this.nouvelleSociete = '';
    this.contactPerson = '';
    this.email = '';
  }
}
