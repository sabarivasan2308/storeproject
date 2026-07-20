import { Routes } from '@angular/router';
import { superAdminGuard, schoolAdminGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { 
    path: 'login', 
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent), 
    canActivate: [loginGuard] 
  },
  { 
    path: 'super-admin', 
    loadComponent: () => import('./features/super-admin/super-admin.component').then(m => m.SuperAdminComponent), 
    canActivate: [superAdminGuard] 
  },
  { 
    path: 'school-admin', 
    loadComponent: () => import('./features/school-admin/school-admin.component').then(m => m.SchoolAdminComponent), 
    canActivate: [schoolAdminGuard] 
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];

