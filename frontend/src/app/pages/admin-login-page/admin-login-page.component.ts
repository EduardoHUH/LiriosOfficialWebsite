import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-admin-login-page',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './admin-login-page.component.html',
  styleUrl: './admin-login-page.component.scss'
})
export class AdminLoginPageComponent {
  private readonly fb = inject(FormBuilder);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly cdr = inject(ChangeDetectorRef);

  loading = false;
  errorMessage = '';
  formMessage = '';

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(4)]]
  });

  constructor() {
    if (this.authService.isAuthenticated()) {
      this.router.navigateByUrl('/admin/dashboard');
    }
  }

  submit(): void {
    this.formMessage = '';
    this.errorMessage = '';

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.formMessage = 'Revisa el correo y la contrasena antes de continuar.';
      this.cdr.detectChanges();
      return;
    }

    this.loading = true;
    this.cdr.detectChanges();

    this.authService.login(this.form.getRawValue()).subscribe({
      next: (response) => {
        this.loading = false;

        if (!response.success) {
          this.errorMessage = response.message || 'No se pudo iniciar sesion.';
          this.cdr.detectChanges();
          return;
        }

        this.router.navigateByUrl('/admin/dashboard');
      },
      error: (error) => {
        this.loading = false;
        if (error instanceof HttpErrorResponse) {
          if (error.status === 401) {
            this.errorMessage = 'La contrasena es incorrecta.';
            this.cdr.detectChanges();
            return;
          }

          if (error.status === 404) {
            this.errorMessage = 'No existe una cuenta con ese correo.';
            this.cdr.detectChanges();
            return;
          }
        }

        this.errorMessage = error?.error?.message || 'No se pudo iniciar sesion. Revisa que el backend este encendido.';
        this.cdr.detectChanges();
      }
    });
  }
}