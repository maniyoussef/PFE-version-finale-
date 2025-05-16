import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { AuthService } from './services/auth.service';
import { of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    const authServiceMock = {
      isLoggedIn: () => of(false)
    };

    await TestBed.configureTestingModule({
      imports: [
        RouterTestingModule
      ],
      providers: [
        { provide: AuthService, useValue: authServiceMock }
      ],
      declarations: [
        AppComponent
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  // No additional tests needed at this time
});
