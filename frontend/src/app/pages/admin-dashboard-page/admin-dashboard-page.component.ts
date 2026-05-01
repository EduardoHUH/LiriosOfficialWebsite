import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ChangeDetectorRef } from '@angular/core';
import { QuoteSummary } from '../../core/models';
import { AuthService } from '../../core/services/auth.service';
import { QuoteService } from '../../core/services/quote.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-admin-dashboard-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-dashboard-page.component.html',
  styleUrl: './admin-dashboard-page.component.scss'
})
export class AdminDashboardPageComponent implements OnInit {
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly quoteService = inject(QuoteService);
  private readonly authService = inject(AuthService);
  private readonly settingsService = inject(SettingsService);
  private readonly router = inject(Router);

  readonly quotes = signal<QuoteSummary[]>([]);
  readonly loading = signal(true);
  readonly filter = signal<'all' | QuoteSummary['status']>('all');
  readonly searchTerm = signal('');
  readonly quoteToDelete = signal<QuoteSummary | null>(null);
  readonly deleting = signal(false);

  announcement = '';
  savingAnnouncement = false;
  announcementSaved = false;

  readonly filteredQuotes = computed(() => {
    const currentFilter = this.filter();
    const search = this.searchTerm().trim().toLowerCase();
    return this.quotes().filter((quote) => {
      const matchesFilter = currentFilter === 'all' || quote.status === currentFilter;
      const haystack = `${quote.id} ${quote.name || ''} ${quote.phone || ''} ${quote.email || ''}`.toLowerCase();
      const matchesSearch = !search || haystack.includes(search);
      return matchesFilter && matchesSearch;
    });
  });

  readonly pendingCount = computed(() => this.quotes().filter((q) => q.status === 'pending').length);
  readonly approvedCount = computed(() => this.quotes().filter((q) => q.status === 'approved').length);
  readonly revenueTotal = computed(() => this.quotes().reduce((sum, q) => sum + Number(q.total), 0));

  userName = this.authService.getUser()?.name || 'Admin';
  errorMessage = '';

  ngOnInit(): void {
    this.loadQuotes();
    this.loadAnnouncement();
  }

  loadAnnouncement(): void {
    this.settingsService.getAnnouncement().subscribe({
      next: (res) => { this.announcement = res.announcement || ''; },
      error: () => {}
    });
  }

  saveAnnouncement(): void {
    this.savingAnnouncement = true;
    this.announcementSaved = false;
    this.settingsService.updateAnnouncement(this.announcement).subscribe({
      next: () => {
        this.savingAnnouncement = false;
        this.announcementSaved = true;
        this.cdr.detectChanges(); 
        setTimeout(() => {
          this.announcementSaved = false;
          this.cdr.detectChanges(); 
        }, 3000);
      },
    error: () => {
      this.savingAnnouncement = false;
      this.cdr.detectChanges(); 
    }
  });
}

  loadQuotes(): void {
    this.loading.set(true);
    this.errorMessage = '';
    this.quoteService.getQuotes().subscribe({
      next: (quotes) => { this.quotes.set(quotes); this.loading.set(false); },
      error: () => { this.loading.set(false); this.errorMessage = 'No se pudieron cargar las cotizaciones.'; }
    });
  }

  setFilter(value: 'all' | QuoteSummary['status']): void { this.filter.set(value); }
  updateSearch(value: string): void { this.searchTerm.set(value); }

  onStatusChange(quote: QuoteSummary, value: string): void {
    const status = value as QuoteSummary['status'];
    const currentQuotes = this.quotes();
    this.quotes.set(currentQuotes.map((item) => (item.id === quote.id ? { ...item, status } : item)));
    this.quoteService.updateQuoteStatus(quote.id, status).subscribe({
      error: () => { this.quotes.set(currentQuotes); }
    });
  }

  confirmDelete(quote: QuoteSummary): void { this.quoteToDelete.set(quote); }
  cancelDelete(): void { this.quoteToDelete.set(null); }

  confirmDeleteAction(): void {
    const quote = this.quoteToDelete();
    if (!quote) return;
    this.deleting.set(true);
    this.quoteService.deleteQuote(quote.id).subscribe({
      next: () => {
        this.quotes.set(this.quotes().filter((q) => q.id !== quote.id));
        this.quoteToDelete.set(null);
        this.deleting.set(false);
      },
      error: () => {
        this.deleting.set(false);
        this.errorMessage = 'No se pudo eliminar la cotizacion.';
        this.quoteToDelete.set(null);
      }
    });
  }

  openPdf(id: number): void {
    this.quoteService.downloadPdf(id).subscribe({
      next: (blob) => {
        if (typeof window === 'undefined') return;
        const url = window.URL.createObjectURL(blob);
        window.open(url, '_blank');
        window.setTimeout(() => window.URL.revokeObjectURL(url), 1000);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigateByUrl('/admin/login');
  }
}