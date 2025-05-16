import { Component, Inject } from '@angular/core';
import {
  MatDialogRef,
  MAT_DIALOG_DATA,
  MatDialogModule,
} from '@angular/material/dialog';
import { User } from '../../models/user.model';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';

export interface UserDetailsDialogData {
  user: User;
}

@Component({
  selector: 'app-user-details-dialog',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    MatDialogModule,
    MatTooltipModule,
  ],
  template: `
    <h2 mat-dialog-title>Détails de l'Utilisateur</h2>
    <mat-dialog-content>
      <div class="details-container">
        <div class="detail-row">
          <span class="label">ID:</span>
          <span class="value">{{ data.user.id }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Prénom:</span>
          <span class="value">{{ data.user.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Nom:</span>
          <span class="value">{{ data.user.lastName }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Email:</span>
          <span class="value">{{ data.user.email }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Pays:</span>
          <span class="value">{{ data.user.country?.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Rôle:</span>
          <span class="value">{{ data.user.role?.name }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Projet:</span>
          <span class="value">
            {{ data.user.assignedProjects?.[0]?.name || 'Aucun' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Entreprise:</span>
          <span class="value">
            {{ data.user.companies?.[0]?.name || 'Aucune' }}
          </span>
        </div>
        <div class="detail-row">
          <span class="label">Téléphone:</span>
          <span class="value">{{ data.user.phoneNumber }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Début de Contrat:</span>
          <span class="value">{{ data.user.contractStartDate | date }}</span>
        </div>
        <div class="detail-row">
          <span class="label">Fin de Contrat:</span>
          <span class="value">{{ data.user.contractEndDate | date }}</span>
        </div>
      </div>
    </mat-dialog-content>
    <mat-dialog-actions>
      <button mat-button mat-dialog-close>Fermer</button>
    </mat-dialog-actions>
  `,
  styles: [
    `
      .details-container {
        margin: 1rem 0;
      }

      .detail-row {
        display: flex;
        margin-bottom: 0.5rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        padding-bottom: 0.5rem;
      }

      .label {
        font-weight: 600;
        width: 120px;
        color: #555;
      }

      .value {
        flex: 1;
      }

      mat-dialog-content {
        max-height: 80vh;
        overflow-y: auto;
      }

      mat-dialog-actions {
        justify-content: flex-end;
        padding: 8px 16px;
      }
    `,
  ],
})
export class UserDetailsDialogComponent {
  constructor(
    public dialogRef: MatDialogRef<UserDetailsDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: UserDetailsDialogData
  ) {}
}
