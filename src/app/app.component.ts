import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector:'app-root',
  templateUrl:'./app.component.html',
  styleUrls:['./app.component.scss']
})

export class AppComponent implements OnInit {

  constructor(private router:Router){}

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
  }

  showNavbar():boolean{

    return ![
      '/',
      '/login',
      '/register',
      '/recover-password'
    ].includes(this.router.url);
  }
}
