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

  showConfirm: boolean = false;
  previewUser: any = {};
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
    // Only capture global inputs if we are not actively typing in an input field (to avoid intercepting email/password fields)
    const activeElement = document.activeElement?.tagName;
    if (activeElement === 'INPUT' || activeElement === 'TEXTAREA') {
      return;
    }

    const currentTime = Date.now();
    
    // USB card readers simulate typing very fast (typically < 30ms between keystrokes)
    if (currentTime - this.lastKeyTime > 50) {
      this.rfidBuffer = ''; 
    }
    
    this.lastKeyTime = currentTime;

    if (event.key >= '0' && event.key <= '9') {
      this.rfidBuffer += event.key;
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
        localStorage.setItem('role', response.role);
        localStorage.setItem('name', response.name);
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

  validateLogin(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.previewUser = {
      email: this.form.value.email,
      name: 'Usuario Demo',
      role: 'APRENDIZ'
    };

    // Auto-detect preview details based on email
    const email = this.form.value.email?.toLowerCase();
    if (email?.includes('admin')) {
      this.previewUser.name = 'Administrador Sistema';
      this.previewUser.role = 'ADMINISTRADOR';
    } else if (email?.includes('instructor')) {
      this.previewUser.name = 'Instructor Formación';
      this.previewUser.role = 'INSTRUCTOR';
    } else if (email?.includes('aprendiz')) {
      this.previewUser.name = 'Aprendiz Caja POS';
      this.previewUser.role = 'APRENDIZ';
    }

    this.showConfirm = true;
  }

  login(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.authService.login(this.form.value)
      .subscribe({
        next: (response) => {
          this.isLoading = false;
          // Store token and user details in localStorage
          localStorage.setItem('token', response.token);
          
          // Decode details from token or infer role
          const email = this.form.value.email?.toLowerCase();
          let finalRole = 'APRENDIZ';
          let finalName = 'Usuario';
          
          if (email?.includes('admin')) {
            finalRole = 'ADMIN';
            finalName = 'Administrador';
          } else if (email?.includes('instructor')) {
            finalRole = 'INSTRUCTOR';
            finalName = 'Instructor';
          } else {
            finalRole = 'APRENDIZ';
            finalName = 'Aprendiz';
          }

          localStorage.setItem('role', finalRole);
          localStorage.setItem('name', finalName);

          this.router.navigate(['/home']);
        },
        error: (err) => {
          this.isLoading = false;
          this.errorMessage = err.error?.message || 'Correo o contraseña incorrectos';
          this.showConfirm = false;
        }
      });
  }
}
