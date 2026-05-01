import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { forkJoin, Observable, of, switchMap } from 'rxjs';
import { NgZone } from '@angular/core';

import {
  Decoration,
  LengthOption,
  QuoteDecorationPayload,
  QuoteExtraPayload,
  QuoteItemPayload,
  ReferenceImageUploadResponse,
  ServiceExtra,
  Technique,
} from '../../core/models';
import { CatalogService } from '../../core/services/catalog.service';
import { ClientService } from '../../core/services/client.service';
import { QuoteService } from '../../core/services/quote.service';
import { SettingsService } from '../../core/services/settings.service';

@Component({
  selector: 'app-home-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './home-page.component.html',
  styleUrl: './home-page.component.scss'
})
export class HomePageComponent implements OnInit, OnDestroy {
  private readonly ngZone = inject(NgZone);
  private readonly cdr = inject(ChangeDetectorRef);
  private readonly fb = inject(FormBuilder);
  private readonly catalogService = inject(CatalogService);
  private readonly clientService = inject(ClientService);
  private readonly quoteService = inject(QuoteService);
  private readonly settingsService = inject(SettingsService);
  private catalogWatchdogId: ReturnType<typeof setTimeout> | null = null;
  private carouselIntervalId: ReturnType<typeof setInterval> | null = null;

  //  Carrusel 
  
    slides = [
      { src: 'gallery/lirios2.jpeg', alt: 'Trabajo Lirios 2' },
      { src: 'gallery/lirios3.jpeg', alt: 'Trabajo Lirios 3' },
      { src: 'gallery/lirios4.jpeg', alt: 'Trabajo Lirios 4' },
      { src: 'gallery/lirios5.jpeg', alt: 'Trabajo Lirios 5' },
    ];
  currentSlide = 0;

  //  Estado general 
  loadingCatalog = true;
  catalogLoadFailed = false;
  submitting = false;
  errorMessage = '';
  successMessage = '';
  createdQuoteId: number | null = null;
  selectedReferenceImageFile: File | null = null;
  selectedReferenceImageName = '';
  announcement = '';

  techniques: Technique[] = [];
  lengths: LengthOption[] = [];
  extrasCatalog: ServiceExtra[] = [];
  decorationsCatalog: Decoration[] = [];

  selectedItems: QuoteItemPayload[] = [];
  selectedExtras: QuoteExtraPayload[] = [];
  selectedDecorations: QuoteDecorationPayload[] = [];

  customerForm = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(3)]],
    phone: ['', [Validators.required, Validators.minLength(8)]],
    email: ['', [Validators.email]],
    appointment_date: [''],
    notes: ['']
  });

  serviceForm = this.fb.nonNullable.group({
    technique_id: [0, [Validators.min(1)]],
    length_id: [0, [Validators.min(1)]],
    quantity: [1, [Validators.min(1)]]
  });

  extraForm = this.fb.nonNullable.group({
    extra_id: [0, [Validators.min(1)]],
    quantity: [1, [Validators.min(1)]]
  });

  decorationForm = this.fb.nonNullable.group({
    decoration_id: [0, [Validators.min(1)]],
    quantity: [1, [Validators.min(1)]]
  });

  ngOnInit(): void {
    this.loadCatalog();
    this.loadAnnouncement();
    this.startCarousel();
  }

  ngOnDestroy(): void {
    this.stopCarousel();
  }

  //  Carrusel 
    startCarousel(): void {
      this.ngZone.runOutsideAngular(() => {
        this.carouselIntervalId = setInterval(() => {
          this.ngZone.run(() => {
            this.currentSlide = (this.currentSlide + 1) % this.slides.length;
            this.cdr.detectChanges();
          });
        }, 4000);
      });
    }
  stopCarousel(): void {
    if (this.carouselIntervalId) {
      clearInterval(this.carouselIntervalId);
      this.carouselIntervalId = null;
    }
  }

  nextSlide(): void {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide + 1) % this.slides.length;
    this.startCarousel();
  }

  prevSlide(): void {
    this.stopCarousel();
    this.currentSlide = (this.currentSlide - 1 + this.slides.length) % this.slides.length;
    this.startCarousel();
  }

  goToSlide(index: number): void {
    this.stopCarousel();
    this.currentSlide = index;
    this.startCarousel();
  }

  //  Anuncio 
  loadAnnouncement(): void {
    this.settingsService.getAnnouncement().subscribe({
      next: (res) => {
        this.announcement = res.announcement || '';
        this.cdr.detectChanges();
      },
      error: () => {}
    });
  }

  //  Catálogo 
  loadCatalog(): void {
    this.clearCatalogWatchdog();
    this.loadingCatalog = true;
    this.catalogLoadFailed = false;
    this.errorMessage = '';
    this.catalogWatchdogId = setTimeout(() => {
      this.loadingCatalog = false;
      this.catalogLoadFailed = true;
      this.errorMessage = 'No se pudo cargar el catalogo del salon.';
    }, 9000);

    forkJoin({
      techniques: this.catalogService.getTechniques(),
      lengths: this.catalogService.getLengths(),
      extras: this.catalogService.getExtras(),
      decorations: this.catalogService.getDecorations()
    }).subscribe({
      next: ({ techniques, lengths, extras, decorations }) => {
        this.clearCatalogWatchdog();
        this.techniques = techniques;
        this.lengths = lengths;
        this.extrasCatalog = extras;
        this.decorationsCatalog = decorations;
        this.loadingCatalog = false;
        this.catalogLoadFailed = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.clearCatalogWatchdog();
        this.errorMessage = 'No se pudo cargar el catalogo del salon.';
        this.loadingCatalog = false;
        this.catalogLoadFailed = true;
        this.cdr.detectChanges();
      }
    });
  }

  private clearCatalogWatchdog(): void {
    if (this.catalogWatchdogId) {
      clearTimeout(this.catalogWatchdogId);
      this.catalogWatchdogId = null;
    }
  }

  onReferenceImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] || null;
    if (!file) { this.selectedReferenceImageFile = null; this.selectedReferenceImageName = ''; return; }
    this.selectedReferenceImageFile = file;
    this.selectedReferenceImageName = file.name;
  }

  addServiceItem(): void {
    if (this.serviceForm.invalid) { this.serviceForm.markAllAsTouched(); return; }
    const technique = this.techniques.find(i => i.id === Number(this.serviceForm.getRawValue().technique_id));
    const length = this.lengths.find(i => i.id === Number(this.serviceForm.getRawValue().length_id));
    if (!technique || !length) return;
    const quantity = Number(this.serviceForm.getRawValue().quantity);
    const unitPrice = Number(technique.base_price) + Number(length.extra_price);
    this.selectedItems = [...this.selectedItems, { technique_id: technique.id, length_id: length.id, technique_name: technique.name, length_name: length.name, base_price: Number(technique.base_price), quantity, price: unitPrice }];
    this.serviceForm.patchValue({ technique_id: 0, length_id: 0, quantity: 1 });
  }

  addExtra(): void {
    if (this.extraForm.invalid) { this.extraForm.markAllAsTouched(); return; }
    const extra = this.extrasCatalog.find(i => i.id === Number(this.extraForm.getRawValue().extra_id));
    if (!extra) return;
    this.selectedExtras = [...this.selectedExtras, { extra_id: extra.id, extra_name: extra.name, quantity: Number(this.extraForm.getRawValue().quantity), price: Number(extra.price) }];
    this.extraForm.patchValue({ extra_id: 0, quantity: 1 });
  }

  addDecoration(): void {
    if (this.decorationForm.invalid) { this.decorationForm.markAllAsTouched(); return; }
    const decoration = this.decorationsCatalog.find(i => i.id === Number(this.decorationForm.getRawValue().decoration_id));
    if (!decoration) return;
    this.selectedDecorations = [...this.selectedDecorations, { decoration_id: decoration.id, decoration_name: decoration.name, quantity: Number(this.decorationForm.getRawValue().quantity), price: Number(decoration.price) }];
    this.decorationForm.patchValue({ decoration_id: 0, quantity: 1 });
  }

  removeService(index: number): void { this.selectedItems = this.selectedItems.filter((_, i) => i !== index); }
  removeExtra(index: number): void { this.selectedExtras = this.selectedExtras.filter((_, i) => i !== index); }
  removeDecoration(index: number): void { this.selectedDecorations = this.selectedDecorations.filter((_, i) => i !== index); }

  getTotal(): number {
    return [
      ...this.selectedItems.map(i => Number(i.price) * Number(i.quantity)),
      ...this.selectedExtras.map(i => Number(i.price) * Number(i.quantity)),
      ...this.selectedDecorations.map(i => Number(i.price) * Number(i.quantity)),
    ].reduce((sum, val) => sum + val, 0);
  }

  submitQuote(): void {
    if (this.customerForm.invalid) { this.customerForm.markAllAsTouched(); return; }
    if (!this.selectedItems.length && !this.selectedExtras.length && !this.selectedDecorations.length) {
      this.errorMessage = 'Agrega al menos un servicio, extra o decoracion.'; return;
    }
    this.submitting = true;
    this.errorMessage = '';
    this.successMessage = '';
    this.createdQuoteId = null;
    const customer = this.customerForm.getRawValue();
    const imageUpload$: Observable<ReferenceImageUploadResponse | null> = this.selectedReferenceImageFile
      ? this.quoteService.uploadReferenceImage(this.selectedReferenceImageFile)
      : of(null);

    imageUpload$.pipe(
      switchMap(imageUploadResponse =>
        this.clientService.createClient({ name: customer.name, phone: customer.phone, email: customer.email }).pipe(
          switchMap(clientResponse =>
            this.quoteService.createQuote({
              client_id: clientResponse.id,
              appointment_date: customer.appointment_date ? customer.appointment_date.replace('T', ' ') : null,
              notes: customer.notes,
              source: 'web',
              contact_phone: customer.phone,
              reference_image_path: imageUploadResponse?.imagePath || null,
              items: this.selectedItems,
              extras: this.selectedExtras,
              decorations: this.selectedDecorations
            })
          )
        )
      )
    ).subscribe({
      next: (response) => {
        this.submitting = false;
        this.createdQuoteId = response.quote_id;
        this.successMessage = `Tu cotizacion fue creada con el numero #${response.quote_id}.`;
        this.customerForm.reset({ name: '', phone: '', email: '', appointment_date: '', notes: '' });
        this.selectedReferenceImageFile = null;
        this.selectedReferenceImageName = '';
        this.selectedItems = [];
        this.selectedExtras = [];
        this.selectedDecorations = [];
      },
      error: () => {
        this.submitting = false;
        this.errorMessage = 'No pudimos registrar tu cotizacion. Intenta de nuevo.';
      }
    });
  }

  trackByIndex(index: number): number { return index; }
}