import { Component, OnInit } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-recover-password',
  templateUrl: './recover-password.component.html',
  styleUrls: ['./recover-password.component.scss']
})
export class RecoverPasswordComponent implements OnInit {

  darkMode: boolean = false;
  currentStep: number = 1;

  successMessage = '';
  errorMessage = '';

  form = this.fb.group({
    email: ['', [
      Validators.required,
      Validators.email
    ]],
    code: ['', [
      Validators.required,
      Validators.pattern(/^\d{6}$/)
    ]],
    newPassword: ['', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern(/^(?=.*[!@#$%^&*(),.?":{}|<>]).{8,}$/)
    ]],
    confirmPassword: ['', [
      Validators.required
    ]]
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ){}

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

  nextStep(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.currentStep === 1) {
      const emailCtrl = this.form.get('email');
      if (emailCtrl?.invalid) {
        emailCtrl.markAsTouched();
        this.errorMessage = 'Por favor, ingresa un correo electrónico válido.';
        return;
      }
      // Simular el envío de código
      this.successMessage = 'Código de verificación enviado al correo (simulado).';
      setTimeout(() => {
        this.successMessage = '';
        this.currentStep = 2;
      }, 1500);

    } else if (this.currentStep === 2) {
      const codeCtrl = this.form.get('code');
      if (codeCtrl?.invalid) {
        codeCtrl.markAsTouched();
        this.errorMessage = 'Por favor, ingresa el código de 6 dígitos.';
        return;
      }
      this.successMessage = 'Código verificado correctamente.';
      setTimeout(() => {
        this.successMessage = '';
        this.currentStep = 3;
      }, 1000);
    }
  }

  submit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    const passCtrl = this.form.get('newPassword');
    const confCtrl = this.form.get('confirmPassword');

    if (passCtrl?.invalid || confCtrl?.invalid) {
      passCtrl?.markAsTouched();
      confCtrl?.markAsTouched();
      this.errorMessage = 'Por favor, cumple con los requisitos de la contraseña.';
      return;
    }

    const password = this.form.value.newPassword;
    const confirm = this.form.value.confirmPassword;

    if (password !== confirm) {
      this.errorMessage = 'Las contraseñas no coinciden.';
      return;
    }

    this.authService.recoverPassword({
      email: this.form.value.email,
      newPassword: password
    }).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'Contraseña actualizada correctamente.';
        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 1500);
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Error al restablecer contraseña. El correo podría no estar registrado.';
      }
    });
  }

  back(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    } else {
      this.router.navigate(['/login']);
    }
  }
}

