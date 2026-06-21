import { Injectable } from '@angular/core';

import {
  HttpClient
} from '@angular/common/http';

import {
  Observable,
  tap
} from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(
    private http: HttpClient
  ) {}

  login(
    credentials: any
  ): Observable<any> {

    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        credentials
      )
      .pipe(

        tap(response => {

          localStorage.setItem(
            'token',
            response.token
          );

          localStorage.setItem(
            'role',
            response.role
          );

          localStorage.setItem(
            'name',
            response.name
          );

          localStorage.setItem(
            'userId',
            String(response.userId)
          );

        })

      );

  }

  register(
    data: any
  ): Observable<any> {

    return this.http.post(
      `${this.apiUrl}/register`,
      data
    );

  }

  rfidLogin(rfidUid: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rfid-login`, { rfidUid })
      .pipe(
        tap(response => {
          localStorage.setItem('token', response.token);
          localStorage.setItem('role', response.role);
          localStorage.setItem('name', response.name);
          localStorage.setItem('userId', String(response.userId));
        })
      );
  }

  logout(): void {

    localStorage.clear();

  }

}
