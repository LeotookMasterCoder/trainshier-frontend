import { Injectable } from '@angular/core';

import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router
} from '@angular/router';

@Injectable({
  providedIn:'root'
})

export class RoleGuard implements CanActivate {

  constructor(
    private router:Router
  ){}

  canActivate(route:ActivatedRouteSnapshot):boolean{

    const expectedRole=route.data['role'];

    const currentRole=localStorage.getItem('role');

    if(currentRole===expectedRole){

      return true;
    }

    this.router.navigate(['/home']);

    return false;
  }

}
