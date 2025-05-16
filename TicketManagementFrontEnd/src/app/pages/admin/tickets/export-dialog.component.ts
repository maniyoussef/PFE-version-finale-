import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatRadioModule } from '@angular/material/radio';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';

export interface ExportDialogData {
  projects: any[];
  problemCategories: any[];
  statuses: string[];
  priorities: string[];
}

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatRadioModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <h2 mat-dialog-title>Exporter les tickets en Excel</h2>
    <mat-dialog-content>
      <p>Sélectionnez les critères de filtrage pour l'export :</p>
      
      <mat-radio-group [(ngModel)]="selectedFilterType" class="filter-radio-group">
        <mat-radio-button value="project">Par projet</mat-radio-button>
        <mat-radio-button value="problemCategory">Par catégorie de problème</mat-radio-button>
        <mat-radio-button value="status">Par statut</mat-radio-button>
        <mat-radio-button value="priority">Par priorité</mat-radio-button>
        <mat-radio-button value="all">Tous les tickets</mat-radio-button>
      </mat-radio-group>
      
      <div class="filter-selection" *ngIf="selectedFilterType !== 'all'">
        <mat-divider class="divider"></mat-divider>
        
        <div *ngIf="selectedFilterType === 'project'" class="filter-item">
          <mat-form-field appearance="outline">
            <mat-label>Projet</mat-label>
            <mat-select [(ngModel)]="selectedProjectId">
              <mat-option *ngFor="let project of data.projects" [value]="project.id">
                {{ project.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <div *ngIf="selectedFilterType === 'problemCategory'" class="filter-item">
          <mat-form-field appearance="outline">
            <mat-label>Catégorie de problème</mat-label>
            <mat-select [(ngModel)]="selectedProblemCategoryId">
              <mat-option *ngFor="let category of data.problemCategories" [value]="category.id">
                {{ category.name }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <div *ngIf="selectedFilterType === 'status'" class="filter-item">
          <mat-form-field appearance="outline">
            <mat-label>Statut</mat-label>
            <mat-select [(ngModel)]="selectedStatus">
              <mat-option *ngFor="let status of data.statuses" [value]="status">
                {{ status }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
        
        <div *ngIf="selectedFilterType === 'priority'" class="filter-item">
          <mat-form-field appearance="outline">
            <mat-label>Priorité</mat-label>
            <mat-select [(ngModel)]="selectedPriority">
              <mat-option *ngFor="let priority of data.priorities" [value]="priority">
                {{ priority }}
              </mat-option>
            </mat-select>
          </mat-form-field>
        </div>
      </div>
    </mat-dialog-content>
    
    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Annuler</button>
      <button 
        mat-raised-button 
        color="primary" 
        [disabled]="!isExportable()" 
        (click)="onExport()"
      >
        <mat-icon>file_download</mat-icon>
        Exporter
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .filter-radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
    }
    
    .divider {
      margin: 15px 0;
    }
    
    .filter-item {
      margin-top: 10px;
    }
    
    mat-form-field {
      width: 100%;
    }
  `]
})
export class ExportDialogComponent implements OnInit {
  selectedFilterType: 'project' | 'problemCategory' | 'status' | 'priority' | 'all' = 'all';
  selectedProjectId: number | null = null;
  selectedProblemCategoryId: number | null = null;
  selectedStatus: string | null = null;
  selectedPriority: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<ExportDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ExportDialogData
  ) {}

  ngOnInit(): void {
    // Initialize with defaults
  }

  isExportable(): boolean {
    if (this.selectedFilterType === 'all') {
      return true;
    }
    
    switch (this.selectedFilterType) {
      case 'project':
        return !!this.selectedProjectId;
      case 'problemCategory':
        return !!this.selectedProblemCategoryId;
      case 'status':
        return !!this.selectedStatus;
      case 'priority':
        return !!this.selectedPriority;
      default:
        return false;
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  onExport(): void {
    const result = {
      filterType: this.selectedFilterType,
      projectId: this.selectedProjectId,
      problemCategoryId: this.selectedProblemCategoryId,
      status: this.selectedStatus,
      priority: this.selectedPriority
    };
    
    this.dialogRef.close(result);
  }
} 