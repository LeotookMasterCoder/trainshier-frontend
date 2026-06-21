import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductService {

  private apiUrl =
    `${environment.apiUrl}/products`;

  constructor(
    private http: HttpClient
  ) {}

  getAll(): Observable<any[]> {

    return this.http.get<any[]>(
      this.apiUrl
    );

  }

  getById(id:number): Observable<any> {

    return this.http.get<any>(
      `${this.apiUrl}/${id}`
    );

  }

  create(product:any): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      product
    );

  }

  update(product:any): Observable<any> {

    return this.http.post<any>(
      this.apiUrl,
      product
    );

  }

  delete(id:number): Observable<any> {

    return this.http.delete<any>(
      `${this.apiUrl}/${id}`
    );

  }

}
