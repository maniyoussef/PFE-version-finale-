import { Injectable } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';

@Injectable({
  providedIn: 'root'
})
export class SnackbarService {
  constructor(private snackBar: MatSnackBar) {}

  success(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration: duration,
      panelClass: ['success-snackbar']
    });
  }

  error(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration: duration,
      panelClass: ['error-snackbar']
    });
  }

  info(message: string, action: string = 'Fermer', duration: number = 3000) {
    this.snackBar.open(message, action, {
      duration: duration
    });
  }
} 