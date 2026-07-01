import { Routes } from '@angular/router';
import { LoginComponent } from './features/login/login.component';
import { SuperAdminComponent } from './features/super-admin/super-admin.component';
import { SchoolAdminComponent } from './features/school-admin/school-admin.component';
import { superAdminGuard, schoolAdminGuard, loginGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: 'login', component: LoginComponent, canActivate: [loginGuard] },
  { path: 'super-admin', component: SuperAdminComponent, canActivate: [superAdminGuard] },
  { path: 'school-admin', component: SchoolAdminComponent, canActivate: [schoolAdminGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
