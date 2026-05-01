import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap, timeout } from 'rxjs';

import { API_BASE_URL } from './config';
import { AuthResponse, AuthUser, LoginPayload } from '../models';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly tokenKey = 'lirios_admin_token';
  private readonly userKey = 'lirios_admin_user';

  login(payload: LoginPayload): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${API_BASE_URL}/auth/login`, payload).pipe(
      timeout(8000),
      tap((response) => {
        if (response.success && response.token && response.user) {
          this.setSession(response.token, response.user);
        }
      })
    );
  }

  logout(): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getToken(): string | null {
    if (typeof window === 'undefined') {
      return null;
    }

    return localStorage.getItem(this.tokenKey);
  }

  getUser(): AuthUser | null {
    if (typeof window === 'undefined') {
      return null;
    }

    const rawUser = localStorage.getItem(this.userKey);
    return rawUser ? (JSON.parse(rawUser) as AuthUser) : null;
  }

  private setSession(token: string, user: AuthUser): void {
    if (typeof window === 'undefined') {
      return;
    }

    localStorage.setItem(this.tokenKey, token);
    localStorage.setItem(this.userKey, JSON.stringify(user));
  }
}
