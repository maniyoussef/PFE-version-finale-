// problem-category.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { TopBarComponent } from '../../../components/AdminComponents/top-bar/top-bar.component';
import { ProblemCategory } from '../../../models/problem-category.model';
import { ProblemCategoryService } from '../../../services/problem-category.service';
import { NavbarComponent } from '../../../components/AdminComponents/navbar/navbar.component';

@Component({
  selector: 'app-problem-category',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatInputModule,
    MatFormFieldModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    TopBarComponent,
    NavbarComponent,
  ],
  templateUrl: './problem-category.component.html',
  styleUrls: ['./problem-category.component.scss'],
})
export class ProblemCategoryComponent implements OnInit {
  categories: ProblemCategory[] = [];
  newCategoryName: string = '';
  isLoading: boolean = false;
  error: string | null = null;

  constructor(
    private categoryService: ProblemCategoryService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadCategories();
  }

  loadCategories(): void {
    this.isLoading = true;
    this.error = null;

    this.categoryService.getCategories().subscribe({
      next: (categories) => {
        this.categories = categories;
        this.isLoading = false;
      },
      error: (error) => {
        this.error = 'Failed to load categories';
        this.isLoading = false;
        this.showErrorMessage('Failed to load categories');
        console.error('Error loading categories:', error);
      },
    });
  }

  addCategory(): void {
    if (!this.newCategoryName.trim()) {
      this.showErrorMessage('Category name cannot be empty');
      return;
    }

    this.isLoading = true;

    const newCategory: ProblemCategory = {
      id: '0', // Temporary ID that will be replaced by the server
      name: this.newCategoryName.trim(),
    };

    this.categoryService.addCategory(newCategory).subscribe({
      next: (createdCategory) => {
        if (createdCategory) {
          this.categories.push(createdCategory);
          this.newCategoryName = '';
          this.isLoading = false;
          this.showSuccessMessage('Category added successfully');
        } else {
          this.isLoading = false;
          this.showErrorMessage('Failed to add category: No data returned');
        }
      },
      error: (error) => {
        this.isLoading = false;
        this.showErrorMessage('Failed to add category');
        console.error('Error adding category:', error);
      },
    });
  }

  deleteCategory(id: string | number): void {
    this.isLoading = true;

    // Convert to string if it's a number
    const categoryId = id.toString();

    this.categoryService.deleteCategory(categoryId).subscribe({
      next: () => {
        this.categories = this.categories.filter(
          (category) => category.id !== id
        );
        this.isLoading = false;
        this.showSuccessMessage('Category deleted successfully');
      },
      error: (error) => {
        this.isLoading = false;
        this.showErrorMessage('Failed to delete category');
        console.error('Error deleting category:', error);
      },
    });
  }

  private showSuccessMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['success-snackbar'],
    });
  }

  private showErrorMessage(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 5000,
      horizontalPosition: 'center',
      verticalPosition: 'bottom',
      panelClass: ['error-snackbar'],
    });
  }
}
