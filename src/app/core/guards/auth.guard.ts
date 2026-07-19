import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AppwriteService } from '../services/appwrite.service';

export const superAdminGuard: CanActivateFn = async () => {
  const service = inject(AppwriteService);
  const router = inject(Router);
  const user = await service.getCurrentUser();

  if (user && user.role === 'Super Admin') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const schoolAdminGuard: CanActivateFn = async () => {
  const service = inject(AppwriteService);
  const router = inject(Router);
  const user = await service.getCurrentUser();

  if (user && user.role === 'School Admin') {
    return true;
  }
  router.navigate(['/login']);
  return false;
};

export const loginGuard: CanActivateFn = async () => {
  const service = inject(AppwriteService);
  const router = inject(Router);
  const user = await service.getCurrentUser();

  if (user) {
    if (user.role === 'Super Admin') {
      router.navigate(['/super-admin']);
    } else {
      router.navigate(['/school-admin']);
    }
    return false;
  }
  return true;
};
