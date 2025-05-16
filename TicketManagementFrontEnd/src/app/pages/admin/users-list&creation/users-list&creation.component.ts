import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatTableModule } from '@angular/material/table';
import { MatPaginatorModule, MatPaginator } from '@angular/material/paginator';
import { MatSortModule, MatSort } from '@angular/material/sort';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDialogModule, MatDialog } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '../../../models/user.model';
import { UserService } from '../../../services/user.service';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { CountryService } from '../../../services/country.service';
import { RoleService } from '../../../services/role.service';
import { CompanyService } from '../../../services/company.service';
import { ProjectService } from '../../../services/project.service';
import { ConfirmDialogComponent } from '../../../components/confirm-dialog.component/confirm-dialog.component';
import { UserDetailsDialogComponent } from '../../../components/user-details-dialog/user-details-dialog.component';
import { UserDialogComponent } from '../../../components/AdminComponents/create-user-dialog.component/create-user-dialog.component';
import { EditUserDialogComponent } from '../../../components/AdminComponents/edit-user-dialog.component/edit-user-dialog.component';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';

@Component({
  selector: 'app-users-list-creation',
  templateUrl: './users-list&creation.component.html',
  styleUrls: ['./users-list&creation.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatTableModule,
    MatPaginatorModule,
    MatSortModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDialogModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    MatTooltipModule,
    UserDialogComponent,
    TopBarComponent,
    NavbarComponent,
    ConfirmDialogComponent,
    UserDetailsDialogComponent,
  ],
})
export class UsersListCreationComponent implements OnInit {
  users: User[] = [];
  filteredUsers: User[] = [];
  searchTerm = '';
  displayedColumns: string[] = [
    'id',
    'name',
    'lastName',
    'email',
    'country',
    'role',
    'status',
    'actions',
    'details',
  ];
  isLoading = true;
  countries: any[] = [];
  roles: any[] = [];
  companies: any[] = [];
  projects: any[] = [];
  newUser: User = {
    name: '',
    email: '',
    role: { id: 1, name: 'USER' },
  };
  errorMessage = '';

  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(
    private userService: UserService,
    private countryService: CountryService,
    private roleService: RoleService,
    private companyService: CompanyService,
    private projectService: ProjectService,
    private dialog: MatDialog,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadCountries();
    this.loadRoles();
    this.loadCompanies();
    this.loadProjects();
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers().subscribe({
      next: (data: User[]) => {
        this.users = data;
        this.filteredUsers = [...this.users];
        this.isLoading = false;
      },
      error: (error: any) => {
        console.error('Error loading users:', error);
        this.isLoading = false;
        this.showNotification(
          'Error loading users. Please try again.',
          'error'
        );
      },
    });
  }

  loadCountries(): void {
    this.countryService.getCountries().subscribe({
      next: (data) => {
        this.countries = data;
      },
      error: (error) => {
        console.error('Error loading countries:', error);
      },
    });
  }

  loadRoles(): void {
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
      },
      error: (error) => {
        console.error('Error loading roles:', error);
      },
    });
  }

  loadCompanies(): void {
    this.companyService.getCompanies().subscribe({
      next: (data) => {
        this.companies = data;
      },
      error: (error) => {
        console.error('Error loading companies:', error);
      },
    });
  }

  loadProjects(): void {
    this.projectService.getProjects().subscribe({
      next: (data) => {
        this.projects = data;
      },
      error: (error) => {
        console.error('Error loading projects:', error);
      },
    });
  }

  filterUsers(): void {
    if (!this.searchTerm) {
      this.filteredUsers = [...this.users];
      return;
    }

    const term = this.searchTerm.toLowerCase();
    this.filteredUsers = this.users.filter(
      (user) =>
        user.name?.toLowerCase().includes(term) ||
        user.lastName?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.country?.name?.toLowerCase().includes(term) ||
        (user.role?.name &&
          user.role.name.toLowerCase().includes(term.toLowerCase()))
    );
  }

  openCreateDialog(): void {
    const dialogRef = this.dialog.open(UserDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      data: { isEdit: false },
      panelClass: ['modern-dialog', 'create-user-dialog'],
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.userService.createUser(result).subscribe({
          next: (newUser: User) => {
            this.users.push(newUser);
            this.filterUsers();
            this.showNotification('User created successfully!', 'success');
          },
          error: (error: any) => {
            console.error('Error creating user:', error);
            this.showNotification(
              'Error creating user. Please try again.',
              'error'
            );
          },
        });
      }
    });
  }
  openDetailsDialog(userId: number): void {
    const user = this.users.find((u) => u.id === userId);
    if (user) {
      const dialogRef = this.dialog.open(UserDetailsDialogComponent, {
        width: '600px',
        data: { user },
        panelClass: 'modern-dialog',
      });

      dialogRef.afterClosed().subscribe((result) => {
        // Optional: Add any cleanup or actions after dialog closes
      });
    }
  }

  openEditDialog(userId: number): void {
    const user = this.users.find((u) => u.id === userId);
    if (!user) return;

    const dialogRef = this.dialog.open(EditUserDialogComponent, {
      width: '600px',
      maxHeight: '90vh',
      disableClose: false,
      autoFocus: true,
      restoreFocus: true,
      data: {
        user,
        countries: this.countries,
        roles: this.roles,
        companies: this.companies,
        projects: this.projects,
      },
      panelClass: ['modern-dialog', 'edit-user-dialog'],
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result && result.id) {
        this.userService.updateUser(result.id, result).subscribe({
          next: (updatedUser) => {
            if (!updatedUser) {
              console.error('Updated user is null');
              this.showNotification(
                'Error updating user. Please try again.',
                'error'
              );
              return;
            }

            // Refresh the entire user list to ensure synchronization
            this.loadUsers();
            this.showNotification('User updated successfully!', 'success');
          },
          error: (error) => {
            console.error('Error updating user:', error);
            this.showNotification(
              'Error updating user. Please try again.',
              'error'
            );
          },
        });
      }
    });
  }
  confirmDelete(user: User): void {
    const dialogRef = this.dialog.open(ConfirmDialogComponent, {
      width: '400px',
      data: {
        title: 'Confirmation',
        message: `Voulez-vous vraiment supprimer l'utilisateur ${user.name} ${user.lastName}?`,
      },
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.deleteUser(user.id!);
      }
    });
  }

  deleteUser(userId: number): void {
    this.userService.deleteUser(userId).subscribe({
      next: () => {
        this.users = this.users.filter((user) => user.id !== userId);
        this.filterUsers();
        this.showNotification('Utilisateur supprimé avec succès!', 'success');
      },
      error: (error) => {
        console.error('Error deleting user:', error);
        this.showNotification(
          'Erreur lors de la suppression. Veuillez réessayer.',
          'error'
        );
      },
    });
  }

  // Helper method to safely get country icon URL
  getCountryIcon(user: User): string | null {
    // Check if the country exists and has an icon property
    // This handles the icon property which isn't in the type definition but might exist in the data
    if (user.country && (user.country as any).icon) {
      return (user.country as any).icon;
    }
    return null;
  }

  showNotification(message: string, type: 'success' | 'error'): void {
    this.snackBar.open(message, 'Fermer', {
      duration: 3000,
      horizontalPosition: 'end',
      verticalPosition: 'top',
      panelClass: type === 'success' ? ['success-snackbar'] : ['error-snackbar'],
    });
  }
}
