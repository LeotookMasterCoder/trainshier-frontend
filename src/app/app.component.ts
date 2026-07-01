import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './core/services/auth.service';

@Component({
  selector:'app-root',
  templateUrl:'./app.component.html',
  styleUrls:['./app.component.scss']
})

export class AppComponent implements OnInit {

  isOffline: boolean = !navigator.onLine;

  constructor(
    private router: Router,
    private authService: AuthService
  ){}

  ngOnInit(): void {
    const savedTheme = localStorage.getItem('theme');
    const root = document.documentElement;
    if (savedTheme === 'dark') {
      document.body.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
    } else {
      document.body.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
    }

    // Check token expiration on load
    this.checkSession();

    // Check token expiration every 5 seconds
    setInterval(() => {
      this.checkSession();
    }, 5000);
  }

  private checkSession(): void {
    if (localStorage.getItem('token')) {
      const expired = this.authService.checkTokenExpiration();
      if (expired) {
        this.router.navigate(['/login']);
      }
    }
  }

  @HostListener('window:offline')
  onOffline(): void {
    this.isOffline = true;
  }

  @HostListener('window:online')
  onOnline(): void {
    this.isOffline = false;
  }

  showNavbar():boolean{

    return ![
      '/',
      '/login',
      '/register',
      '/recover-password'
    ].includes(this.router.url);
  }

  showAssistant(): boolean {
    return true;
  }
}
