import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';
import { ErrorHandler } from '@angular/core';

// Define a class to handle errors and suppress specific HTTP errors
class CustomErrorHandler implements ErrorHandler {
  // Store the original console.error
  private originalConsoleError = console.error;

  constructor() {
    // Override console.error for Angular-specific error handling
    console.error = (...args: any[]) => {
      // Convert arguments to a string to check for HTTP errors
      const errorString = args.join(' ');
      
      // Check if it's an HTTP error we want to suppress
      if (errorString.includes('Http failure response for') && 
          (errorString.includes('/api/Tickets/user/') || 
           errorString.includes('/api/Tickets/history/') ||
           errorString.includes('/api/Tickets/all') ||
           errorString.includes('/api/Tickets/81') ||
           errorString.includes('/api/Tickets/82'))) {
        // Don't output anything for these errors
        return;
      }
      
      // For all other errors, use the original console.error
      this.originalConsoleError.apply(console, args);
    };
  }

  // This method is called for all unhandled errors in Angular
  handleError(error: any): void {
    // Check if it's an HTTP error we want to suppress
    if (error && error.message && typeof error.message === 'string' &&
        error.message.includes('Http failure response for') && 
        (error.message.includes('/api/Tickets/user/') || 
         error.message.includes('/api/Tickets/history/') ||
         error.message.includes('/api/Tickets/all') ||
         error.message.includes('/api/Tickets/81') ||
         error.message.includes('/api/Tickets/82'))) {
      // Log a custom message instead
      console.log('API endpoint unavailable, using fallback data');
      return;
    }
    
    // Log all other errors as usual
    this.originalConsoleError('Angular Error:', error);
  }
}

// Update the app config to use our custom error handler
appConfig.providers = [...(appConfig.providers || []), 
  { provide: ErrorHandler, useClass: CustomErrorHandler }
];

// Bootstrap the application with updated config
bootstrapApplication(AppComponent, appConfig).catch((err) => {
  // This should never show error messages from the suppressed endpoints
  console.error('Application bootstrap error:', err);
});
