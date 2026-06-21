import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { SimulatorModule } from './features/simulator/simulator.module';

import {
  FormsModule,
  ReactiveFormsModule
} from '@angular/forms';

import { HttpClientModule } from '@angular/common/http';

import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { AppRoutingModule } from './app-routing.module';

import { AppComponent } from './app.component';


import { NavbarComponent } from './shared/components/navbar/navbar.component';
import { FooterComponent } from './shared/components/footer/footer.component';


import { DashboardComponent } from './features/dashboard/dashboard.component';

import { HomeComponent } from './features/home/home.component';


import { LoginComponent } from './features/auth/login/login.component';
import { RegisterComponent } from './features/auth/register/register.component';
import { RecoverPasswordComponent } from './features/auth/recover-password/recover-password.component';

import { SimulatorComponent } from './features/simulator/simulator/simulator.component';

import { ProfileComponent } from './features/profile/profile.component';


import { TransactionFormComponent } from './features/transactions/transaction-form/transaction-form.component';


import { InstructorCommentsComponent } from './features/evaluation/instructor-comments/instructor-comments.component';

import { ReportsComponent }     from './features/reports/report-list/report-list.component';

import { StatisticsComponent }  from './features/statistics/statistics/statistics.component';
@NgModule({

  declarations:[

    AppComponent,

    NavbarComponent,
    FooterComponent,

    DashboardComponent,

    HomeComponent,

    LoginComponent,
    RegisterComponent,
    RecoverPasswordComponent,


    ProfileComponent,

    TransactionFormComponent,

    InstructorCommentsComponent,

    ReportsComponent,

    StatisticsComponent

  ],

  imports:[

    SimulatorModule,

    BrowserModule,

    AppRoutingModule,

    BrowserAnimationsModule,

    HttpClientModule,

    FormsModule,

    ReactiveFormsModule

  ],

  providers:[],

  bootstrap:[
    AppComponent
  ]

})

export class AppModule{}
