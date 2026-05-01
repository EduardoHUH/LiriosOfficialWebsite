import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { API_BASE_URL } from './config';
import {
  QuoteCreatePayload,
  QuoteCreateResponse,
  QuoteDetailResponse,
  QuoteSummary,
  ReferenceImageUploadResponse,
} from '../models';

@Injectable({ providedIn: 'root' })
export class QuoteService {
  private readonly http = inject(HttpClient);

  createQuote(payload: QuoteCreatePayload) {
    return this.http.post<QuoteCreateResponse>(`${API_BASE_URL}/quotes`, payload);
  }

  uploadReferenceImage(file: File) {
    const formData = new FormData();
    formData.append('referenceImage', file);

    return this.http
      .post<ReferenceImageUploadResponse>(`${API_BASE_URL}/quotes/reference-image`, formData)
      .pipe(timeout(8000));
  }

  getQuotes() {
    return this.http.get<QuoteSummary[]>(`${API_BASE_URL}/quotes`).pipe(timeout(8000));
  }

  getQuoteById(id: number) {
    return this.http
      .get<QuoteDetailResponse>(`${API_BASE_URL}/quotes/${id}`)
      .pipe(timeout(8000));
  }

  updateQuoteStatus(id: number, status: QuoteSummary['status']) {
    return this.http.patch<{ message: string; status: QuoteSummary['status'] }>(
      `${API_BASE_URL}/quotes/${id}/status`,
      { status }
    );
  }

  deleteQuote(id: number) {
    return this.http.delete<{ message: string }>(`${API_BASE_URL}/quotes/${id}`);
  }

  getPdfUrl(id: number) {
    return `${API_BASE_URL}/quotes/pdf/${id}`;
  }

  downloadPdf(id: number) {
    return this.http.get(`${API_BASE_URL}/quotes/pdf/${id}`, {
      responseType: 'blob'
    });
  }

  resolveUploadUrl(imagePath: string) {
    return imagePath.startsWith('http') ? imagePath : `${environment.apiBaseUrl.replace('/api', '')}${imagePath}`;
  }
}
