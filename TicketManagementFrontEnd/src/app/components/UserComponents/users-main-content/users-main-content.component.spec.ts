import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UsersMainContentComponent } from './users-main-content.component';

describe('UsersMainContentComponent', () => {
  let component: UsersMainContentComponent;
  let fixture: ComponentFixture<UsersMainContentComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [UsersMainContentComponent]
    });
    fixture = TestBed.createComponent(UsersMainContentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
