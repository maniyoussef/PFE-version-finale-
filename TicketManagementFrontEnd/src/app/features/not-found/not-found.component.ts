import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <h1>404</h1>
        <h2>Page Not Found</h2>
        <p>The page you are looking for doesn't exist or has been moved.</p>
        <a routerLink="/" class="btn-home">Go to Home</a>
      </div>
    </div>
  `,
  styles: [
    `
      .not-found-container {
        display: flex;
        justify-content: center;
        align-items: center;
        min-height: 100vh;
        background-color: #f8f9fa;
      }

      .not-found-content {
        text-align: center;
        padding: 2rem;
        background: white;
        border-radius: 8px;
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }

      h1 {
        font-size: 6rem;
        color: #dc3545;
        margin: 0;
        line-height: 1;
      }

      h2 {
        color: #343a40;
        margin: 1rem 0;
      }

      p {
        color: #6c757d;
        margin-bottom: 2rem;
      }

      .btn-home {
        display: inline-block;
        padding: 0.75rem 1.5rem;
        background-color: #007bff;
        color: white;
        text-decoration: none;
        border-radius: 4px;
        transition: background-color 0.2s;
      }

      .btn-home:hover {
        background-color: #0056b3;
      }
    `,
  ],
})
export class NotFoundComponent {}
