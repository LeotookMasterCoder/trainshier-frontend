import { Component, OnInit, HostListener } from '@angular/core';
import { FormBuilder, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent implements OnInit {

  errorMessage: string = '';
  darkMode: boolean = false;
  isLoading: boolean = false;
  showMobileDemos: boolean = false;

  // RFID Scanner logic
  showRfidModal: boolean = false;
  rfidInput: string = '';
  private rfidBuffer: string = '';
  private lastKeyTime: number = 0;

  @HostListener('window:keydown', ['$event'])
  handleKeyboardEvent(event: KeyboardEvent) {
    const currentTime = Date.now();
    const isFast = (currentTime - this.lastKeyTime) <= 50;
    
    // USB card readers simulate typing very fast (typically < 30ms between keystrokes)
    if (currentTime - this.lastKeyTime > 50) {
      this.rfidBuffer = ''; 
    }
    
    this.lastKeyTime = currentTime;

    if (event.key >= '0' && event.key <= '9') {
      const activeElement = document.activeElement?.tagName;
      if (activeElement === 'INPUT' || activeElement === 'TEXTAREA') {
        const activeInput = document.activeElement as HTMLInputElement;
        if (isFast || this.rfidBuffer === '') {
          this.rfidBuffer += event.key;
          if (isFast) {
            event.preventDefault();
            // Clean up the first character that got typed before we detected the fast scan
            if (this.rfidBuffer.length === 2 && activeInput && activeInput.value) {
              activeInput.value = activeInput.value.slice(0, -1);
              activeInput.dispatchEvent(new Event('input'));
            }
          }
        } else {
          // Slow typing, reset buffer to this single digit
          this.rfidBuffer = event.key;
        }
      } else {
        // Outside input fields, accumulate normally
        this.rfidBuffer += event.key;
      }
    } else if (event.key === 'Enter') {
      if (this.rfidBuffer.length >= 8) {
        event.preventDefault();
        this.loginWithRfid(this.rfidBuffer);
        this.rfidBuffer = '';
      }
    }
  }

  loginWithRfid(uid: string): void {
    if (!uid) return;
    this.isLoading = true;
    this.errorMessage = '';
    this.showRfidModal = false;
    this.authService.rfidLogin(uid).subscribe({
      next: (response) => {
        this.isLoading = false;
        
        // Store details in localStorage just like regular login
        localStorage.setItem('token', response.token);
        
        let finalRole = 'APRENDIZ';
        const rawRole = response.role?.toUpperCase();
        if (rawRole === 'ADMINISTRATOR' || rawRole === 'ADMIN') {
          finalRole = 'ADMIN';
        } else if (rawRole === 'INSTRUCTOR') {
          finalRole = 'INSTRUCTOR';
        } else {
          finalRole = 'APRENDIZ';
        }
        
        localStorage.setItem('role', finalRole);
        localStorage.setItem('name', response.name || 'Usuario');
        localStorage.setItem('userId', String(response.userId));

        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Tarjeta RFID no registrada o inválida';
      }
    });
  }

  form = this.fb.group({
    email: [
      '',
      [
        Validators.required,
        Validators.email
      ]
    ],
    password: [
      '',
      [
        Validators.required
      ]
    ]
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService
  ) {}

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

  fillDemo(role: string): void {
    if (role === 'admin') {
      this.form.patchValue({
        email: 'admin@trainshier.com',
        password: 'Admin123*'
      });
    } else if (role === 'instructor') {
      this.form.patchValue({
        email: 'instructor@trainshier.com',
        password: 'Instructor123*'
      });
    } else if (role === 'aprendiz') {
      this.form.patchValue({
        email: 'aprendiz@trainshier.com',
        password: 'Aprendiz123*'
      });
    }
  }

  login(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.form.value)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Store token and user details in localStorage
          localStorage.setItem('token', response.token);
          
          let finalRole = 'APRENDIZ';
          const rawRole = response.role?.toUpperCase();
          if (rawRole === 'ADMINISTRATOR' || rawRole === 'ADMIN') {
            finalRole = 'ADMIN';
          } else if (rawRole === 'INSTRUCTOR') {
            finalRole = 'INSTRUCTOR';
          } else {
            finalRole = 'APRENDIZ';
          }

          localStorage.setItem('role', finalRole);
          localStorage.setItem('name', response.name || 'Usuario');
          localStorage.setItem('userId', String(response.userId));

          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Correo o contraseña incorrectos';
        }
      });
  }
}
