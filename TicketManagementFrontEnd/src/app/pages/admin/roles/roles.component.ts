import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDialogModule } from '@angular/material/dialog';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { FormsModule } from '@angular/forms';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Role } from '../../../models/role.model';
import { RoleService } from '../../../services/role.service';
import { animate, style, transition, trigger } from '@angular/animations';

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    MatTableModule,
    MatButtonModule,
    MatInputModule,
    MatIconModule,
    MatMenuModule,
    MatDialogModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    FormsModule
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.scss'],
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
export class RolesComponent implements OnInit {
  roles: Role[] = [];
  newRoleName: string = '';
  editingRole: Role | null = null;
  isLoading = false;
  sortDirection = 'asc';
  activeRow: number | null = null;

  constructor(
    private roleService: RoleService,
    private changeDetectorRef: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadRoles();
  }

  loadRoles() {
    this.isLoading = true;
    this.roleService.getRoles().subscribe({
      next: (data) => {
        this.roles = data;
        this.sortRoles();
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error loading roles:', error);
        this.isLoading = false;
      }
    });
  }

  sortRoles() {
    this.roles.sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  }

  toggleSort() {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    this.sortRoles();
  }

  addNewRole() {
    if (!this.newRoleName.trim()) return;

    const newRole: Partial<Role> = {
      name: this.newRoleName.trim(),
    };

    this.roleService.createRole(newRole).subscribe({
      next: () => {
        this.newRoleName = '';
        this.loadRoles();
      },
      error: (error) => {
        console.error('Error creating role:', error);
      }
    });
  }

  startEdit(role: Role) {
    this.editingRole = { ...role };
  }

  saveEdit() {
    if (!this.editingRole) return;

    this.roleService.updateRole(this.editingRole.id, this.editingRole).subscribe({
      next: () => {
        this.editingRole = null;
        this.loadRoles();
      },
      error: (error) => {
        console.error('Error updating role:', error);
      }
    });
  }

  cancelEdit() {
    this.editingRole = null;
  }

  setActiveRow(roleId: number | null) {
    this.activeRow = roleId;
  }
}
