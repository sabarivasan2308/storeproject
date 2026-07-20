import '@angular/compiler';
import { describe, it, expect } from 'vitest';
import { App } from './app';

describe('App', () => {
  it('should create the app', () => {
    const app = new App();
    expect(app).toBeTruthy();
  });

  it('should have title signal set to kare-inventory', () => {
    const app = new App();
    expect(app['title']()).toBe('kare-inventory');
  });
});
