import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector:'app-register',
  templateUrl:'./register.component.html',
  styleUrls:['./register.component.scss']
})
export class RegisterComponent implements OnInit {

  generatedId:string = '';

  successMessage:string = '';

  errorMessage:string = '';

  darkMode:boolean = false;

  constructor(
    private fb:FormBuilder,
    private router:Router,
    private authService:AuthService
  ){

    this.generateId();

  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('theme') === 'dark';
  }

  toggleTheme(): void {
    this.darkMode = !this.darkMode;
    const root = document.documentElement;
    if (this.darkMode) {
      document.body.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme', 'light');
    }
  }

  form = this.fb.group({

    fullName:[
      '',
      Validators.required
    ],

    username:[
      '',
      [
        Validators.required,
        Validators.pattern('^[a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+#[0-9]{4}$')
      ]
    ],

    role:[
      'aprendiz',
      Validators.required
    ],

    email:[
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],

    password:[
      '',
      [
        Validators.required,
        Validators.minLength(6)
      ]
    ]

  });

  generateId():void{

    const random =
      Math.floor(
        1000 + Math.random() * 9000
      );

    this.generatedId =
      `TRN-${random}`;

  }

  register():void {

    if(this.form.invalid){

      this.form.markAllAsTouched();

      return;
    }

    const request = {

      name:this.form.value.fullName,

      email:this.form.value.email,

      password:this.form.value.password,

      role:this.form.value.role

    };

    this.authService
      .register(request)
      .subscribe({

        next:(response)=>{

          this.successMessage =
            response.message ||
            'Usuario registrado correctamente';

          setTimeout(()=>{

            this.router.navigate(['/login']);

          },2000);

        },

        error:(err)=>{

          this.errorMessage =
            err.error?.message ||
            'Error al registrar usuario';

        }

      });

  }

  back():void{

    this.router.navigate(['/']);

  }

}
