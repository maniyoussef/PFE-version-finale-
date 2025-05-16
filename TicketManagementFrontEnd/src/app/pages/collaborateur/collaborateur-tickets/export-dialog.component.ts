import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
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
    MatRadioModule,
    MatDividerModule,
    MatIconModule
  ],
  template: `
    <div class="export-dialog-container">
      <h2 mat-dialog-title>Exporter les tickets en Excel</h2>
      <mat-dialog-content>
        <p>Sélectionnez les critères de filtrage pour l'export :</p>
        
        <div class="filter-radio-group">
          <div class="radio-option">
            <input 
              type="radio" 
              id="filter-project" 
              name="filterType" 
              [(ngModel)]="selectedFilterType" 
              value="project" 
              (change)="onFilterTypeChange()"
            >
            <label for="filter-project">Par projet</label>
          </div>
          
          <div class="radio-option">
            <input 
              type="radio" 
              id="filter-category" 
              name="filterType" 
              [(ngModel)]="selectedFilterType" 
              value="problemCategory"
              (change)="onFilterTypeChange()"
            >
            <label for="filter-category">Par catégorie de problème</label>
          </div>
          
          <div class="radio-option">
            <input 
              type="radio" 
              id="filter-status" 
              name="filterType" 
              [(ngModel)]="selectedFilterType" 
              value="status"
              (change)="onFilterTypeChange()"
            >
            <label for="filter-status">Par statut</label>
          </div>
          
          <div class="radio-option">
            <input 
              type="radio" 
              id="filter-priority" 
              name="filterType" 
              [(ngModel)]="selectedFilterType" 
              value="priority"
              (change)="onFilterTypeChange()"
            >
            <label for="filter-priority">Par priorité</label>
          </div>
          
          <div class="radio-option">
            <input 
              type="radio" 
              id="filter-all" 
              name="filterType" 
              [(ngModel)]="selectedFilterType" 
              value="all"
              (change)="onFilterTypeChange()"
            >
            <label for="filter-all">Tous les tickets</label>
          </div>
        </div>
        
        <div class="selected-filter-type">
          Filtre sélectionné: <strong>{{ getFilterLabel() }}</strong>
        </div>
        
        <div class="filter-selection" *ngIf="selectedFilterType !== 'all'">
          <mat-divider class="divider"></mat-divider>
          
          <div *ngIf="selectedFilterType === 'project'" class="filter-item">
            <label for="project-select">Projet</label>
            <select 
              id="project-select" 
              [(ngModel)]="selectedProjectId" 
              class="form-select"
            >
              <option [ngValue]="null">Sélectionnez un projet</option>
              <option *ngFor="let project of data.projects" [ngValue]="project.id">
                {{ project.name }}
              </option>
            </select>
          </div>
          
          <div *ngIf="selectedFilterType === 'problemCategory'" class="filter-item">
            <label for="category-select">Catégorie de problème</label>
            <select 
              id="category-select" 
              [(ngModel)]="selectedProblemCategoryId"
              class="form-select"
            >
              <option [ngValue]="null">Sélectionnez une catégorie</option>
              <option *ngFor="let category of data.problemCategories" [ngValue]="category.id">
                {{ category.name }}
              </option>
            </select>
          </div>
          
          <div *ngIf="selectedFilterType === 'status'" class="filter-item">
            <label for="status-select">Statut</label>
            <select 
              id="status-select" 
              [(ngModel)]="selectedStatus"
              class="form-select"
            >
              <option [ngValue]="null">Sélectionnez un statut</option>
              <option *ngFor="let status of data.statuses" [ngValue]="status">
                {{ status }}
              </option>
            </select>
          </div>
          
          <div *ngIf="selectedFilterType === 'priority'" class="filter-item">
            <label for="priority-select">Priorité</label>
            <select 
              id="priority-select" 
              [(ngModel)]="selectedPriority"
              class="form-select"
            >
              <option [ngValue]="null">Sélectionnez une priorité</option>
              <option *ngFor="let priority of data.priorities" [ngValue]="priority">
                {{ priority }}
              </option>
            </select>
          </div>
        </div>
      </mat-dialog-content>
      
      <mat-dialog-actions align="end">
        <button mat-button class="cancel-button" (click)="onCancel()">Annuler</button>
        <button 
          mat-raised-button 
          [disabled]="!isExportable()" 
          (click)="onExport()"
          class="export-button"
        >
          <mat-icon>file_download</mat-icon>
          Exporter
        </button>
      </mat-dialog-actions>
    </div>
  `,
  styles: [`
    .export-dialog-container {
      padding: 16px;
      position: relative;
      z-index: 100;
    }
    
    .filter-radio-group {
      display: flex;
      flex-direction: column;
      gap: 10px;
      margin-bottom: 15px;
      padding: 10px;
      background-color: #f5f5f5;
      border-radius: 6px;
    }
    
    .radio-option {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 6px 0;
    }
    
    .radio-option input[type="radio"] {
      margin: 0;
    }
    
    .radio-option label {
      margin: 0;
      font-size: 15px;
      cursor: pointer;
    }
    
    .selected-filter-type {
      margin: 10px 0;
      font-size: 14px;
      color: #666;
    }
    
    .divider {
      margin: 15px 0;
    }
    
    .filter-item {
      margin-top: 15px;
      display: flex;
      flex-direction: column;
    }
    
    .filter-item label {
      font-weight: 500;
      margin-bottom: 8px;
      color: #555;
    }
    
    .form-select {
      width: 100%;
      padding: 10px 12px;
      border-radius: 4px;
      border: 1px solid #ddd;
      background-color: white;
      font-size: 14px;
      margin-bottom: 10px;
      color: #333;
    }
    
    .form-select:focus {
      border-color: #ff7043;
      outline: none;
      box-shadow: 0 0 0 2px rgba(255, 112, 67, 0.25);
    }
    
    .export-button {
      background-color: #ff7043 !important;
      color: white !important;
    }
    
    .cancel-button {
      color: #555 !important;
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
    // Ensure each array has values
    if (!this.data.projects) this.data.projects = [];
    if (!this.data.problemCategories) this.data.problemCategories = [];
    if (!this.data.statuses) this.data.statuses = [];
    if (!this.data.priorities) this.data.priorities = [];
    
    // Set a default filter type if needed
    if (this.data.projects.length > 0) this.selectedFilterType = 'project';
    else if (this.data.problemCategories.length > 0) this.selectedFilterType = 'problemCategory';
    else if (this.data.statuses.length > 0) this.selectedFilterType = 'status';
    else if (this.data.priorities.length > 0) this.selectedFilterType = 'priority';
    else this.selectedFilterType = 'all';
  }
  
  onFilterTypeChange(): void {
    // Reset the selected values when changing filter type
    this.selectedProjectId = null;
    this.selectedProblemCategoryId = null;
    this.selectedStatus = null;
    this.selectedPriority = null;
  }
  
  getFilterLabel(): string {
    switch(this.selectedFilterType) {
      case 'project': return 'Projet';
      case 'problemCategory': return 'Catégorie de problème';
      case 'status': return 'Statut';
      case 'priority': return 'Priorité';
      case 'all': return 'Tous les tickets';
      default: return 'Non sélectionné';
    }
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