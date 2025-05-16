import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { HttpClientModule } from '@angular/common/http';
import { ReactiveFormsModule } from '@angular/forms';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule } from '@angular/router';

import { AppComponent } from './app.component';
import { routes } from './app.routes';

// The ClientAssignmentsDebuggerComponent is a standalone component
// It will be imported in the routes where needed
// import { ClientAssignmentsDebuggerComponent } from './pages/admin/client-assignments-debugger/client-assignments-debugger.component';

// Note: If your app uses standalone components including AppComponent,
// you should use bootstrapApplication in main.ts instead of NgModule bootstrap
// Example: bootstrapApplication(AppComponent, { providers: [...] })

@NgModule({
  // Only include non-standalone components in declarations array
  declarations: [],
  imports: [
    BrowserModule,
    HttpClientModule,
    ReactiveFormsModule,
    BrowserAnimationsModule,
    RouterModule.forRoot(routes),
    // Standalone components can be imported here
    // ClientAssignmentsDebuggerComponent
  ],
  providers: [],
  // If AppComponent is standalone, it should be bootstrapped in main.ts
  // Uncomment this only if AppComponent is NOT standalone:
  // bootstrap: [AppComponent]
})
export class AppModule { } 