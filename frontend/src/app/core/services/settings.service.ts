import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';

import { API_BASE_URL } from './config';

@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly http = inject(HttpClient);

  getAnnouncement() {
    return this.http
      .get<{ announcement: string }>(`${API_BASE_URL}/settings/announcement`)
      .pipe(timeout(8000));
  }

  updateAnnouncement(announcement: string) {
    return this.http
      .put<{ announcement: string }>(`${API_BASE_URL}/settings/announcement`, { announcement })
      .pipe(timeout(8000));
  }
}