import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth.guard';
import { AdminDashboardPageComponent } from './pages/admin-dashboard-page/admin-dashboard-page.component';
import { AdminLoginPageComponent } from './pages/admin-login-page/admin-login-page.component';
import { AdminQuoteDetailPageComponent } from './pages/admin-quote-detail-page/admin-quote-detail-page.component';
import { HomePageComponent } from './pages/home-page/home-page.component';

export const routes: Routes = [
  {
    path: '',
    component: HomePageComponent
  },
  {
    path: 'admin',
    pathMatch: 'full',
    redirectTo: 'admin/login'
  },
  {
    path: 'admin/login',
    component: AdminLoginPageComponent
  },
  {
    path: 'admin/dashboard',
    component: AdminDashboardPageComponent,
    canActivate: [authGuard]
  },
  {
    path: 'admin/quotes/:id',
    component: AdminQuoteDetailPageComponent,
    canActivate: [authGuard]
  },
  {
    path: '**',
    redirectTo: ''
  }
];
