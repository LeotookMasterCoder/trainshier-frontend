import { Injectable } from '@angular/core';

@Injectable({
  providedIn:'root'
})

export class TokenService {

  save(token:string){

    localStorage.setItem('token',token);
  }

  get(){

    return localStorage.getItem('token');
  }

  clear(){

    localStorage.removeItem('token');
    localStorage.removeItem('role');
  }

}
