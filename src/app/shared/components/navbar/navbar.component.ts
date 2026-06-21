import { Component, HostListener } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector:'app-navbar',
  templateUrl:'./navbar.component.html',
  styleUrls:['./navbar.component.scss']
})
export class NavbarComponent{

  darkMode:boolean=false;

  isLoggedIn:boolean=false;

  role:string='OBSERVADOR';

  profileImage:string='assets/img/default-profile.png';

  notifications: any[] = [];
  showNotificationsDropdown: boolean = false;

  constructor(
    private router:Router
  ){

    const savedTheme=localStorage.getItem('theme');

    if(savedTheme==='dark' || document.body.classList.contains('dark-mode')){

      this.darkMode=true;

    }

    const savedRole=localStorage.getItem('role');

    if(savedRole){

      this.role=savedRole.toUpperCase();

    }

    const token=localStorage.getItem('token');

    if(token){

      this.isLoggedIn=true;

    }

    const savedImage=
      localStorage.getItem('profileImage');

    if(savedImage){

      this.profileImage=savedImage;

    }

    // Load active notifications
    this.loadNotifications();

    // Check periodically for new notifications (every 3 seconds)
    setInterval(() => {
      if (this.isLoggedIn) {
        this.loadNotifications();
      }
    }, 3000);

  }

  isObserver():boolean{

    return this.role==='OBSERVADOR';

  }

  loadNotifications(): void {
    const saved = localStorage.getItem('trainshier_notifications');
    let allNotifications: any[] = [];
    if (saved) {
      allNotifications = JSON.parse(saved);
    } else {
      // Seed default notifications for testing
      allNotifications = [
        {
          id: '1',
          role: 'APRENDIZ',
          message: '📋 Tu examen del simulador ha sido calificado por el instructor.',
          actionText: 'Ver Calificación',
          route: '/evaluation',
          read: false
        },
        {
          id: '2',
          role: 'INSTRUCTOR',
          message: '🚀 El aprendiz Carlos Ruiz subió los resultados de su simulación para calificación.',
          actionText: 'Evaluar',
          route: '/evaluation',
          read: false
        },
        {
          id: '3',
          role: 'ADMIN',
          message: '⚠️ Soporte: Reporte de error en módulo de facturación (ID #8827).',
          actionText: 'Ver Reportes',
          route: '/reports',
          read: false
        },
        {
          id: '4',
          role: 'ADMIN',
          message: '👤 Solicitud: El usuario Santiago Ortega solicita cambio de rol a Instructor.',
          actionText: 'Ver Solicitudes',
          route: '/statistics',
          read: false
        }
      ];
      localStorage.setItem('trainshier_notifications', JSON.stringify(allNotifications));
    }
    
    // Filter active unread notifications for this role
    const currentRole = this.role === 'ADMINISTRADOR' ? 'ADMIN' : this.role;
    this.notifications = allNotifications.filter(n => n.role === currentRole && !n.read);
  }

  toggleNotifications(event: Event): void {
    event.stopPropagation();
    this.showNotificationsDropdown = !this.showNotificationsDropdown;
    if (this.showNotificationsDropdown) {
      this.loadNotifications();
    }
  }

  readAndNavigate(notif: any): void {
    // Mark as read in localStorage
    const saved = localStorage.getItem('trainshier_notifications');
    if (saved) {
      const all: any[] = JSON.parse(saved);
      const target = all.find(n => n.id === notif.id);
      if (target) {
        target.read = true;
      }
      localStorage.setItem('trainshier_notifications', JSON.stringify(all));
    }
    
    this.showNotificationsDropdown = false;
    this.loadNotifications();
    this.router.navigate([notif.route]);
  }

  clearAllNotifications(): void {
    const saved = localStorage.getItem('trainshier_notifications');
    if (saved) {
      const all: any[] = JSON.parse(saved);
      const currentRole = this.role === 'ADMINISTRADOR' ? 'ADMIN' : this.role;
      all.forEach(n => {
        if (n.role === currentRole) {
          n.read = true;
        }
      });
      localStorage.setItem('trainshier_notifications', JSON.stringify(all));
    }
    this.notifications = [];
  }

  toggleTheme():void{

    this.darkMode=!this.darkMode;
    const root = document.documentElement;

    if(this.darkMode){

      document.body.classList.add('dark-mode');
      root.setAttribute('data-theme', 'dark');
      localStorage.setItem('theme','dark');

    }else{

      document.body.classList.remove('dark-mode');
      root.setAttribute('data-theme', 'light');
      localStorage.setItem('theme','light');

    }

  }

  logout():void{

    localStorage.clear();

    this.router.navigate(['/dashboard']);

  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    this.showNotificationsDropdown = false;
  }

}
