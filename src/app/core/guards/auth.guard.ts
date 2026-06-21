import { Injectable } from '@angular/core';

import {
  CanActivate,
  Router
} from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn:'root'
})

export class AuthGuard implements CanActivate {

  constructor(
    private router: Router,
    private authService: AuthService
  ){}

  canActivate():boolean{

    // Check if token has expired first
    if (this.authService.checkTokenExpiration()) {
      this.router.navigate(['/login']);
      return false;
    }

    const token=localStorage.getItem('token');

    if(token){

      return true;
    }

    this.router.navigate(['/login']);

    return false;
  }

}
