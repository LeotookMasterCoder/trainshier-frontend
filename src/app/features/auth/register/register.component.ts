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

  trnVerified = false;
  requestingCode = false;
  instructors: any[] = [];
  selectedInstructorId: number | null = null;
  trnCodeInput = '';
  generatedTrnCode = '';

  trnStudentName = '';
  trnStudentEmail = '';
  hasRequestedCode = false;
  trnRequestStatus = '';
  checkingStatus = false;

  constructor(
    private fb:FormBuilder,
    private router:Router,
    private authService:AuthService
  ){

    this.generateId();

  }

  ngOnInit(): void {
    this.darkMode = localStorage.getItem('theme') === 'dark';

    // Cargar los instructores desde el endpoint público (no requiere JWT)
    this.authService.getInstructors().subscribe({
      next: (instructors) => {
        this.instructors = instructors;
        if (this.instructors.length > 0) {
          this.selectedInstructorId = this.instructors[0].id;
        }
      },
      error: (err) => {
        console.error('Error al cargar instructores', err);
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
    this.trnStudentName = 'Aprendiz Simulado';
    this.trnStudentEmail = `aprendiz.simulado.${random}@trainshier.com`;
    this.form.patchValue({
      fullName: this.trnStudentName,
      username: `cajero${random}#${random}`,
      role: 'aprendiz',
      email: this.trnStudentEmail,
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

      username:this.form.value.username,

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
    if (!this.trnStudentName || !this.trnStudentEmail) {
      this.errorMessage = 'Por favor ingresa tu nombre y correo para solicitar el código';
      return;
    }
    if (!this.selectedInstructorId) {
      this.errorMessage = 'Por favor selecciona un instructor';
      return;
    }
    this.requestingCode = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.requestTrnCode(
      this.selectedInstructorId,
      this.trnStudentName,
      this.trnStudentEmail
    ).subscribe({
      next: (response) => {
        this.requestingCode = false;
        this.hasRequestedCode = true;
        this.successMessage = response.message || 'Solicitud de autorización TRN enviada correctamente. Espera a que el instructor la apruebe.';

        // Push real-time notification to the instructor
        const savedNotifs = localStorage.getItem('trainshier_notifications');
        let notifs = savedNotifs ? JSON.parse(savedNotifs) : [];
        notifs.push({
          id: String(Date.now()),
          role: 'INSTRUCTOR',
          message: `📋 El aprendiz "${this.trnStudentName}" ha solicitado un código de autorización TRN para registrarse.`,
          actionText: 'Revisar Solicitudes',
          route: '/evaluation',
          read: false
        });
        localStorage.setItem('trainshier_notifications', JSON.stringify(notifs));
      },
      error: (err) => {
        this.requestingCode = false;
        this.errorMessage = err.error?.message || 'Error al solicitar el código TRN al instructor.';
      }
    });
  }

  verificarEstado(): void {
    if (!this.trnStudentEmail) return;
    this.checkingStatus = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.authService.checkTrnStatus(this.trnStudentEmail).subscribe({
      next: (req) => {
        this.checkingStatus = false;
        this.trnRequestStatus = req.status;
        if (req.status === 'APPROVED') {
          this.generatedTrnCode = req.trnCode;
          this.generatedId = req.trnCode; // Sync left brandside panel display
          this.trnCodeInput = req.trnCode;
          this.successMessage = '¡Tu solicitud ha sido aprobada por el instructor!';
        } else if (req.status === 'PENDING') {
          this.errorMessage = 'La solicitud sigue pendiente de aprobación por el instructor.';
        } else if (req.status === 'REJECTED') {
          this.errorMessage = 'La solicitud fue rechazada por el instructor.';
        }
      },
      error: (err) => {
        this.checkingStatus = false;
        this.errorMessage = err.error?.message || 'No se encontró solicitud para este correo.';
      }
    });
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
      this.generatedId = this.generatedTrnCode; // Sync left brandside panel display
      this.form.patchValue({
        fullName: this.trnStudentName,
        email: this.trnStudentEmail
      });
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
