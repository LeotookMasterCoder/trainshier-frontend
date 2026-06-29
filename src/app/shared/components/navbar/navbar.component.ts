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

    // Load active notifications
    this.loadNotifications();

    // Check periodically for new notifications (every 3 seconds)
    setInterval(() => {
      if (this.isLoggedIn) {
        this.loadNotifications();
      }
    }, 3000);

  }

  /** Avatar image path based on role — color variants of the classic profile icon */
  get avatarImage(): string {
    const r = this.role.toUpperCase();
    if (r === 'ADMIN' || r === 'ADMINISTRADOR' || r === 'ADMINISTRATOR') return 'assets/img/avatar_admin.png';
    if (r === 'INSTRUCTOR') return 'assets/img/avatar_instructor.png';
    if (r === 'OBSERVADOR') return 'assets/img/avatar_observador.png';
    return 'assets/img/avatar_aprendiz.png';
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
      allNotifications = [];
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
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('login_timestamp');
    this.router.navigate(['/dashboard']);
  }

  @HostListener('window:storage', ['$event'])
  onStorageChange(event: StorageEvent): void {
    if (event.key === 'trainshier_notifications') {
      this.loadNotifications();
    }
  }

  @HostListener('document:click', ['$event'])
  closeDropdowns(event: Event): void {
    this.showNotificationsDropdown = false;
  }
}
