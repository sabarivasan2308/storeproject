import { Component, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AppwriteService } from '../../core/services/appwrite.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="login-container">
      <div class="glass-panel login-card">
        <div class="logo-area">
          <span class="logo-icon">🛡️</span>
          <h1 class="display-header app-title">KARE</h1>
          <p class="app-subtitle">Asset & Inventory Management System</p>
        </div>

        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <div class="form-group">
            <label class="form-label" for="email">Email Address</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              class="form-input" 
              placeholder="e.g., super@kare.edu"
              [(ngModel)]="email" 
              required
              email
              #emailInput="ngModel"
            />
          </div>

          <div class="form-group">
            <label class="form-label" for="password">Password</label>
            <input 
              type="password" 
              id="password" 
              name="password" 
              class="form-input" 
              placeholder="••••••••"
              [(ngModel)]="password" 
              required
            />
          </div>

          @if (errorMessage()) {
            <div class="error-banner">
              <span>⚠️</span>
              <p>{{ errorMessage() }}</p>
            </div>
          }

          <button 
            type="submit" 
            class="btn btn-primary btn-block" 
            [disabled]="loginForm.invalid || isLoading()"
          >
            @if (isLoading()) {
              <div class="spinner-small"></div>
            } @else {
              Sign In
            }
          </button>
        </form>

        <div class="demo-credentials">
          <h3 class="form-label demo-title">Quick Test Credentials</h3>
          <div class="demo-credential-row" (click)="fillCreds('super@kare.edu')">
            <span class="badge badge-purple">Super Admin</span>
            <code>super@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('akcp@kare.edu')">
            <span class="badge badge-cyan">School Admin</span>
            <code>akcp@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('linga@kare.edu')">
            <span class="badge badge-green">Linga Admin</span>
            <code>linga@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('cshm@kare.edu')">
            <span class="badge badge-orange">CSHM Admin</span>
            <code>cshm@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('akcas@kare.edu')">
            <span class="badge badge-blue">AKCAS Admin</span>
            <code>akcas@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('akbed@kare.edu')">
            <span class="badge badge-gray">AK B.Ed Admin</span>
            <code>akbed@kare.edu</code>
          </div>
          <div class="demo-credential-row" (click)="fillCreds('kmch@kare.edu')">
            <span class="badge badge-red">KMCH Admin</span>
            <code>kmch@kare.edu</code>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      padding: 20px;
    }
    .login-card {
      width: 100%;
      max-width: 440px;
      padding: 40px;
    }
    .logo-area {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-icon {
      font-size: 3rem;
      display: block;
      margin-bottom: 8px;
    }
    .app-title {
      font-size: 2.2rem;
      background: linear-gradient(135deg, #fff 0%, #a78bfa 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 4px;
    }
    .app-subtitle {
      font-size: 0.85rem;
      color: var(--text-secondary);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .btn-block {
      width: 100%;
      margin-top: 10px;
      height: 48px;
    }
    .error-banner {
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      padding: 12px 16px;
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 20px;
      font-size: 0.9rem;
      color: #fca5a5;
    }
    .demo-credentials {
      margin-top: 30px;
      padding-top: 24px;
      border-top: 1px solid var(--glass-border);
    }
    .demo-title {
      margin-bottom: 12px;
      font-size: 0.75rem;
    }
    .demo-credential-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 12px;
      background: rgba(255, 255, 255, 0.02);
      border: 1px solid var(--glass-border);
      border-radius: 6px;
      margin-bottom: 8px;
      cursor: pointer;
      transition: all var(--transition-fast);
    }
    .demo-credential-row:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: var(--glass-highlight);
    }
    .demo-credential-row code {
      font-family: monospace;
      color: var(--text-secondary);
      font-size: 0.85rem;
    }
    .spinner-small {
      width: 20px;
      height: 20px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-radius: 50%;
      border-top-color: #fff;
      animation: spin 0.8s ease-in-out infinite;
    }
  `]
})
export class LoginComponent {
  email = '';
  password = '';
  errorMessage = signal<string>('');
  isLoading = signal<boolean>(false);

  constructor(
    private appwriteService: AppwriteService,
    private router: Router
  ) {
    effect(() => {
      const user = this.appwriteService.currentUser();
      if (user) {
        if (user.role === 'Super Admin') {
          this.router.navigate(['/super-admin']);
        } else {
          this.router.navigate(['/school-admin']);
        }
      }
    });
  }

  async onSubmit() {
    this.isLoading.set(true);
    this.errorMessage.set('');

    try {
      const user = await this.appwriteService.login(this.email, this.password);
      if (user.role === 'Super Admin') {
        this.router.navigate(['/super-admin']);
      } else {
        this.router.navigate(['/school-admin']);
      }
    } catch (err: any) {
      this.errorMessage.set(err.message || 'Login failed.');
    } finally {
      this.isLoading.set(false);
    }
  }

  fillCreds(email: string) {
    this.email = email;
    this.password = 'password123'; // auto fill password
  }
}
