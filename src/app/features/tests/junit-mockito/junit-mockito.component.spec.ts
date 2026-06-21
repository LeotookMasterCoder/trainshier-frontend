import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JunitMockitoComponent } from './junit-mockito.component';

describe('JunitMockitoComponent', () => {
  let component: JunitMockitoComponent;
  let fixture: ComponentFixture<JunitMockitoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [JunitMockitoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JunitMockitoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
