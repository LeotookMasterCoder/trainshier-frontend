import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';

import { DashboardComponent } from './features/dashboard/dashboard.component';
import { HomeComponent } from './features/home/home.component';

import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password.component';

import { SimulatorComponent } from './features/simulator/simulator/simulator.component';

import { ProfileComponent } from './features/profile/profile.component';
import { ManualComponent } from './features/manual/manual.component';

import { TransactionFormComponent } from './features/transactions/transaction-form/transaction-form.component';

import { InstructorCommentsComponent } from './features/evaluation/instructor-comments/instructor-comments.component';

import { ReportsComponent } from './features/reports/report-list/report-list.component';

import { StatisticsComponent } from './features/statistics/statistics/statistics.component';

const routes: Routes = [

  {
    path: '',
    component: DashboardComponent
  },

  {
    path: 'home',
    component: HomeComponent
  },

  {
    path: 'manual',
    component: ManualComponent
  },

  {
    path: 'login',
    component: LoginComponent
  },

  {
    path: 'register',
    component: RegisterComponent
  },

  {
    path: 'recover-password',
    component: RecoverPasswordComponent
  },

  {
    path: 'simulator',
    component: SimulatorComponent
  },

  {
    path: 'profile',
    component: ProfileComponent
  },

  {
    path: 'transactions',
    component: TransactionFormComponent
  },

  {
    path: 'evaluation',
    component: InstructorCommentsComponent
  },

  {
    path: 'reports',
    component: ReportsComponent
  },

  {
    path: 'statistics',
    component: StatisticsComponent
  },

  {
    path: '**',
    redirectTo: ''
  }

];

@NgModule({
  imports: [
    RouterModule.forRoot(routes)
  ],
  exports: [
    RouterModule
  ]
})
export class AppRoutingModule {}
