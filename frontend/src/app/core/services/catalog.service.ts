import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

import { API_BASE_URL } from './config';
import { Decoration, LengthOption, ServiceExtra, Technique } from '../models';

@Injectable({ providedIn: 'root' })
export class CatalogService {
  private readonly http = inject(HttpClient);

  getTechniques() {
    return this.http.get<Technique[]>(`${API_BASE_URL}/services/techniques`).pipe(timeout(8000));
  }

  getLengths() {
    return this.http.get<LengthOption[]>(`${API_BASE_URL}/services/lengths`).pipe(timeout(8000));
  }

  getExtras() {
    return this.http.get<ServiceExtra[]>(`${API_BASE_URL}/extras`).pipe(timeout(8000));
  }

  getDecorations() {
    return this.http.get<Decoration[]>(`${API_BASE_URL}/decorations`).pipe(timeout(8000));
  }
}
