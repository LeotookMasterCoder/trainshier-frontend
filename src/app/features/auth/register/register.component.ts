import { Component, OnInit } from '@angular/core';

import {
  FormBuilder,
  Validators
} from '@angular/forms';

import { Router } from '@angular/router';

import { AuthService } from '../../../core/services/auth.service';
import { UserService } from '../../../core/services/user.service';

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

  trnVerified = false;
  requestingCode = false;
  instructors: any[] = [];
  selectedInstructorId: number | null = null;
  trnCodeInput = '';
  generatedTrnCode = '';

  constructor(
    private fb:FormBuilder,
    private router:Router,
    private authService:AuthService,
    private userService:UserService
  ){

    this.generateId();

  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('theme') === 'dark';

    // Cargar los instructores para el filtro
    this.userService.getAll().subscribe({
      next: (users) => {
        this.instructors = users.filter(u => u.role === 'INSTRUCTOR' || u.role === 'instructor');
        if (this.instructors.length > 0) {
          this.selectedInstructorId = this.instructors[0].id;
        }
      },
      error: (err) => {
        console.error("Error al cargar instructores", err);
      }
    });
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

  autofill(): void {
    const random = Math.floor(1000 + Math.random() * 9000);
    this.form.patchValue({
      fullName: 'Cajero Aprendiz Simulado',
      username: `cajero${random}#${random}`,
      role: 'aprendiz',
      email: `cajero.simulado.${random}@trainshier.com`,
      password: 'Password123*'
    });
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

  pedirCodigo(): void {
    if (!this.selectedInstructorId) {
      this.errorMessage = 'Por favor selecciona un instructor';
      return;
    }
    this.requestingCode = true;
    this.errorMessage = '';
    
    // Simular retraso de envío de notificación al instructor
    setTimeout(() => {
      this.requestingCode = false;
      const rand = Math.floor(1000 + Math.random() * 9000);
      this.generatedTrnCode = `TRN-${rand}`;
    }, 1200);
  }

  copiarCodigo(): void {
    this.trnCodeInput = this.generatedTrnCode;
  }

  verificarCodigo(): void {
    this.errorMessage = '';
    if (!this.trnCodeInput) {
      this.errorMessage = 'Por favor ingresa el código TRN de autorización';
      return;
    }

    if (this.trnCodeInput.trim().toUpperCase() === this.generatedTrnCode) {
      this.trnVerified = true;
      this.successMessage = 'Código TRN validado con éxito. Ahora puedes completar tu registro.';
      setTimeout(() => {
        this.successMessage = '';
      }, 3000);
    } else {
      this.errorMessage = 'El código TRN ingresado no coincide o es inválido.';
    }
  }

  back():void{

    this.router.navigate(['/']);

  }

}
