import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';

import { API_BASE_URL } from './config';
import { ClientPayload, ClientResponse } from '../models';

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);

  createClient(payload: ClientPayload) {
    return this.http.post<ClientResponse>(`${API_BASE_URL}/clients`, payload);
  }
}
