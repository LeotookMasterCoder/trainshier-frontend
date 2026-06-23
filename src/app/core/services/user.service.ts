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

  updateAdmin(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${id}/admin`, data);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  truncateData(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/truncate`, {});
  }

  askAssistant(message: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/assistant/chat`, { message });
  }
}
