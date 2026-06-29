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

          localStorage.setItem('email', response.email || '');
          localStorage.setItem('username', response.username || '');

          // Store login timestamp (represented in milliseconds)
          localStorage.setItem(
            'login_timestamp',
            String(Date.now())
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
          localStorage.setItem('email', response.email || '');
          localStorage.setItem('username', response.username || '');
          // Store login timestamp (represented in milliseconds)
          localStorage.setItem('login_timestamp', String(Date.now()));
        })
      );
  }

  recoverPassword(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recover-password`, data);
  }

  requestRecoveryCode(email: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recover-password/request?email=${email}`, {});
  }

  verifyRecoveryCode(email: string, code: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/recover-password/verify?email=${email}&code=${code}`, {});
  }

  /** TRN Registration requests */
  requestTrnCode(instructorId: number, studentName: string, studentEmail: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/trn-requests`, { instructorId, studentName, studentEmail });
  }

  checkTrnStatus(studentEmail: string): Observable<any> {
    return this.http.get<any>(`${environment.apiUrl}/auth/trn-requests/check?email=${studentEmail}`);
  }

  getPendingTrnRequests(instructorId: number): Observable<any[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/trn-requests/instructor/${instructorId}`);
  }

  approveTrnRequest(id: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/trn-requests/${id}/approve`, {});
  }

  rejectTrnRequest(id: number): Observable<any> {
    return this.http.put<any>(`${environment.apiUrl}/trn-requests/${id}/reject`, {});
  }

  /**
   * Returns the list of instructors from the public endpoint.
   * No JWT token needed - used by the apprentice registration form.
   */
  getInstructors(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/instructors`);
  }

  checkTokenExpiration(): boolean {
    const token = localStorage.getItem('token');
    const timestampStr = localStorage.getItem('login_timestamp');
    if (!token || !timestampStr) {
      return false;
    }
    const timestamp = Number(timestampStr);
    const duration = 10 * 60 * 1000; // 10 minutes in milliseconds (600,000 ms)
    if (Date.now() - timestamp > duration) {
      this.logout();
      return true; // Expiró y se limpió la sesión
    }
    return false; // Sesión válida
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('login_timestamp');
  }

}
