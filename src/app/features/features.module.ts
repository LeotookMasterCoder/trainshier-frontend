import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HomeComponent } from './home/home.component';
import { DashboardComponent } from './dashboard/dashboard.component';
import { ProfileComponent } from './profile/profile.component';
import { JunitMockitoComponent } from './tests/junit-mockito/junit-mockito.component';
import { ReportListComponent } from './reports/report-list/report-list.component';
import { ObserverComponent } from './observer/observer.component';



@NgModule({
  declarations: [
    HomeComponent,
    DashboardComponent,
    ProfileComponent,
    JunitMockitoComponent,
    ReportListComponent,
    ObserverComponent
  ],
  imports: [
    CommonModule
  ]
})
export class FeaturesModule { }
