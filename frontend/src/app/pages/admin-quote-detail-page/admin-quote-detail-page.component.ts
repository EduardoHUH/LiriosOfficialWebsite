import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { QuoteDetailResponse, QuoteSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { QuoteService } from '../../core/services/quote.service';

@Component({
  selector: 'app-admin-quote-detail-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-quote-detail-page.component.html',
  styleUrl: './admin-quote-detail-page.component.scss'
})
export class AdminQuoteDetailPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly route = inject(ActivatedRoute);
  private readonly quoteService = inject(QuoteService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  loading = true;
  errorMessage = '';
  data: QuoteDetailResponse | null = null;

  ngOnInit(): void {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.quoteService.getQuoteById(id).subscribe({
      next: (response) => {
        this.data = response;
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No se pudo cargar esta cotizacion.';
      }
    });
  }

  get statusClass(): string {
    return this.data?.quote?.status || 'pending';
  }

  getReferenceImageUrl(imagePath: string): string {
    return this.quoteService.resolveUploadUrl(imagePath);
  }

  openPdf(): void {
    if (!this.data) {
      return;
    }

    this.quoteService.downloadPdf(this.data.quote.id).subscribe({
      next: (blob) => {
        if (typeof window === 'undefined') {
          return;
        }

        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    });
  }

  updateStatus(status: QuoteSummary['status']): void {
    if (!this.data) {
      return;
    }

    const previousStatus = this.data.quote.status;
    this.data = {
      ...this.data,
      quote: { ...this.data.quote, status }
    };

    this.quoteService.updateQuoteStatus(this.data.quote.id, status).subscribe({
      error: () => {
        if (!this.data) {
          return;
        }
        this.data = {
          ...this.data,
          quote: { ...this.data.quote, status: previousStatus }
        };
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}
