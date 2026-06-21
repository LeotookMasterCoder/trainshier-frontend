import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';

import { ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';

import { LoginComponent } from './login/login.component';
import { RegisterComponent } from './register/register.component';
import { RecoverPasswordComponent } from './recover-password/recover-password.component';

@NgModule({
  declarations:[
    LoginComponent,
    RegisterComponent,
    RecoverPasswordComponent
  ],
  imports:[
    CommonModule,
    ReactiveFormsModule,
    RouterModule
  ],
  exports:[
    LoginComponent,
    RegisterComponent,
    RecoverPasswordComponent
  ]
})
export class AuthModule {}
