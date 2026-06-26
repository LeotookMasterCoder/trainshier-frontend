import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private apiUrl = `${environment.apiUrl}/users`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl);
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  update(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}`, data);
  }

  createInstructor(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/instructors`, data);
  }

  /** Create any user (admin or instructor) */
  createAny(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create-any`, data);
  }

  updateAdmin(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/admin`, data);
  }

  /** Toggle user active/inactive */
  toggleActive(id: number, active: boolean): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/${id}/toggle-active`, { active });
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  truncateData(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/truncate`, {});
  }

  // RFID Requests
  getRfidRequests(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/rfid-requests`);
  }

  submitRfidRequest(userId: number, rfidUid: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/rfid-requests`, { userId: userId.toString(), rfidUid });
  }

  reviewRfidRequest(id: number, status: string, adminId: number, notes: string = ''): Observable<any> {
    return this.http.patch<any>(`${this.apiUrl}/rfid-requests/${id}/review`, {
      status, adminId: adminId.toString(), notes
    });
  }

  askAssistant(message: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/assistant/chat`, { message });
  }
}
