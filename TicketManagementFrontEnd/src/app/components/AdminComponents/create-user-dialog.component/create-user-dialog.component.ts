import { Component, OnInit, Inject, OnDestroy, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormGroup,
  FormBuilder,
  Validators,
} from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Country } from '../../../models/country.model';
import { Role } from '../../../models/role.model';
import { User } from '../../../models/user.model';
import { CountryService } from '../../../services/country.service';
import { NotificationService } from '../../../services/notification.service';
import { RoleService } from '../../../services/role.service';

interface DialogData {
  isEdit: boolean;
  user?: User;
}

@Component({
  selector: 'app-user-dialog',
  templateUrl: './create-user-dialog.component.html',
  styleUrls: ['./create-user-dialog.component.scss'],
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatProgressSpinnerModule,
  ],
  encapsulation: ViewEncapsulation.None
})
export class UserDialogComponent implements OnInit, OnDestroy {
  userForm!: FormGroup;
  countries: Country[] = [];
  roles: Role[] = [];
  isLoading = true;

  constructor(
    private fb: FormBuilder,
    private countryService: CountryService,
    private roleService: RoleService,
    private notificationService: NotificationService,
    public dialogRef: MatDialogRef<UserDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) {}

  ngOnInit(): void {
    this.createForm();
    this.loadData();
    
    // Prevent parent scrolling when dialog is open
    this.preventParentScrolling();
  }
  
  ngOnDestroy(): void {
    // Re-enable parent scrolling when dialog is closed
    document.body.style.overflow = '';
  }
  
  // Helper method to prevent scrolling in the parent window
  private preventParentScrolling(): void {
    document.body.style.overflow = 'hidden';
  }

  createForm(): void {
    this.userForm = this.fb.group({
      name: ['', [Validators.required]],
      lastName: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      countryId: [null, [Validators.required]],
      roleId: [null, [Validators.required]],
    });

    if (this.data.isEdit && this.data.user) {
      const formPatch = {
        ...this.data.user,
        countryId: this.data.user.country?.id || null,
        roleId: this.data.user.role?.id || null
      };
      
      console.log('Patching form with values:', formPatch);
      this.userForm.patchValue(formPatch);
    }
  }

  loadData(): void {
    // Load countries and roles
    Promise.all([
      new Promise<void>((resolve) => {
        this.countryService.getCountries().subscribe({
          next: (data) => {
            console.log('Countries loaded successfully:', data);
            this.countries = data;
            resolve();
          },
          error: (error) => {
            console.error('Error loading countries:', error);
            this.notificationService.showError('Failed to load countries. Please refresh and try again.');
            resolve();
          },
        });
      }),
      new Promise<void>((resolve) => {
        this.roleService.getRoles().subscribe({
          next: (data) => {
            console.log('Roles loaded successfully:', data);
            this.roles = data;
            resolve();
          },
          error: (error) => {
            console.error('Error loading roles:', error);
            this.notificationService.showError('Failed to load roles. Please refresh and try again.');
            resolve();
          },
        });
      })
    ]).then(() => {
      this.isLoading = false;
      console.log('All data loaded, form ready');
    });
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onSubmit(): void {
    if (this.userForm.valid) {
      const formValues = this.userForm.value;
      
      // Find the complete country and role objects from the selections
      const selectedCountry = this.countries.find(c => c.id === formValues.countryId);
      const selectedRole = this.roles.find(r => r.id === formValues.roleId);
      
      // Format user with proper structure matching the User model
      const user: User = {
        ...formValues,
        country: selectedCountry ? { 
          id: selectedCountry.id,
          name: selectedCountry.name
        } : undefined,
        role: selectedRole ? {
          id: selectedRole.id,
          name: selectedRole.name
        } : undefined
      };
      
      console.log('Submitting user data:', user);
      this.dialogRef.close(user);
    } else {
      this.userForm.markAllAsTouched();
    }
  }
}
