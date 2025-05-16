import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-unauthorized',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="unauthorized-container">
      <div class="unauthorized-content">
        <h1>Access Denied</h1>
        <p>You don't have permission to access this page.</p>
        <a routerLink="/dashboard" class="btn-back">Return to Dashboard</a>
      </div>
    </div>
  `,
  styles: [
    `
      .unauthorized-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .unauthorized-content {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h1 {
        color: #dc3545;
        margin-bottom: 1rem;
      }

      p {
        color: #6c757d;
        margin-bottom: 2rem;
      }

      .btn-back {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .btn-back:hover {
        background-color: #0056b3;
      }
    `,
  ],
})
export class UnauthorizedComponent {}
