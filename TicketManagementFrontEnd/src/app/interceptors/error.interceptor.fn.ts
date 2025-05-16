import {
  HttpInterceptorFn,
  HttpHandlerFn,
  HttpRequest,
  HttpErrorResponse,
} from '@angular/common/http';
import {
  inject,
  EnvironmentInjector,
  runInInjectionContext,
} from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (
  req: HttpRequest<unknown>,
  next: HttpHandlerFn
) => {
  const injector = inject(EnvironmentInjector);

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      let errorMessage = 'An unknown error occurred';

      // Run in injection context to avoid NG0203 error
      return runInInjectionContext(injector, () => {
        const snackBar = inject(MatSnackBar);

        // Extract error message
        if (error.error?.message) {
          errorMessage = error.error.message;
        } else if (error.message) {
          errorMessage = error.message;
        }

        // Don't show snackbar for auth errors (handled by auth interceptor)
        if (error.status !== 401) {
          snackBar.open(errorMessage, 'Close', {
            duration: 5000,
            horizontalPosition: 'end',
            verticalPosition: 'top',
            panelClass: ['error-snackbar'],
          });
        }

        return throwError(() => error);
      });
    })
  );
};
