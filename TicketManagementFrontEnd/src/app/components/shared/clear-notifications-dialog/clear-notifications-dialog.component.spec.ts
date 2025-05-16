import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClearNotificationsDialogComponent } from './clear-notifications-dialog.component';

describe('ClearNotificationsDialogComponent', () => {
  let component: ClearNotificationsDialogComponent;
  let fixture: ComponentFixture<ClearNotificationsDialogComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [ClearNotificationsDialogComponent]
    });
    fixture = TestBed.createComponent(ClearNotificationsDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
