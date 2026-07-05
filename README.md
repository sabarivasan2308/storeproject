# KARE Store Project

Enterprise asset, inventory, vendor, request, and reporting system for the KARE group of institutions.

This application is an Angular 22 frontend backed by Appwrite Cloud. It is designed for a multi-school workflow where a super admin can manage enterprise-wide master data and each school admin can manage or request changes for their own inventory.

## Current Branch

Active development branch:

```bash
refactor/pure-appwrite
```

Do not merge this branch into `main` until the project is fully completed, tested, and approved.

## Live Appwrite Configuration

The app currently targets:

```text
Endpoint: https://sgp.cloud.appwrite.io/v1
Project ID: kare-store-project
Database ID: kare-db
Storage bucket: asset-attachments
```

API keys are intentionally not committed. Run database alignment or seeding with `APPWRITE_API_KEY` set in your local shell.

## Main Features

- Appwrite Authentication login flow.
- Quick access demo accounts for super admin and school admins.
- Super admin dashboard with institution-wide asset, request, value, category, status, and audit summaries.
- School admin dashboard with scoped inventory, requests, issue reporting, and change proposals.
- Multi-school asset inventory for KARE, AKCP, LINGA Global School, AKCAS, CSHM, AK B.Ed College, and KMCH.
- Database-backed master data for schools, categories, statuses, and vendors.
- Asset CRUD with QR/barcode fields, purchase details, warranty details, vendors, locations, and container relationships.
- Request review workflow for approve/reject decisions.
- Audit log records for important administrative actions.
- Location-aware inventory records.
- Reporting views with filters and dashboard metrics.
- Appwrite storage bucket for asset attachments.
- Local mock fallback remains available for development safety when Appwrite is not reachable.

## Demo Login Accounts

The seeded Appwrite Auth users use the default demo password:

```text
password123
```

Available demo accounts:

```text
super@kare.edu   Super Admin
kare@kare.edu    KARE Admin
akcp@kare.edu    AKCP Admin
linga@kare.edu   LINGA Global School Admin
cshm@kare.edu    CSHM Admin
akcas@kare.edu   AKCAS Admin
akbed@kare.edu   AK B.Ed College Admin
kmch@kare.edu    KMCH Admin
```

For production use, replace demo passwords and disable or remove demo access patterns.

## Appwrite Database Work

The alignment script is:

```bash
npm run appwrite:align
```

It creates or updates:

- `kare-db` database
- shared collections: `users`, `assets`, `locations`, `requests`, `audit_logs`
- master collections: `master_schools`, `master_categories`, `master_statuses`, `master_vendors`
- school-scoped collections for each institution, including assets, consumables, furniture, locations, requests, audit logs, departments, categories, statuses, vendors, and issue requests
- Appwrite Auth users for quick access
- Appwrite Teams and memberships for school scoping
- seeded school, category, status, vendor, location, asset, request, and audit data
- `asset-attachments` storage bucket

Run it like this from PowerShell:

```powershell
$env:APPWRITE_ENDPOINT="https://sgp.cloud.appwrite.io/v1"
$env:APPWRITE_PROJECT_ID="kare-store-project"
$env:APPWRITE_DATABASE_ID="kare-db"
$env:APPWRITE_API_KEY="your-rotated-api-key"
npm run appwrite:align
```

Never commit the API key. If a key is shared in chat or screenshots, rotate it in Appwrite after the work is complete.

## Seeded Demo Data

The live database has been prepared with representative demo data across:

- KARE
- AKCP
- LINGA Global School
- AKCAS
- CSHM
- AK B.Ed College
- KMCH

Seed data includes locations, assets, consumables, furniture, vendors, categories, statuses, pending requests, approved requests, and audit logs. The seeded records are intended to make dashboards and school inventory screens immediately usable.

## Project Structure

```text
src/app/core/config/appwrite.config.ts       Appwrite endpoint, project, database, collection, and bucket IDs
src/app/core/services/appwrite.service.ts    Appwrite data access, auth, CRUD, requests, and fallback handling
src/app/core/services/mock-db.ts             Local fallback data
src/app/core/models/types.ts                 Shared application types
src/app/features/login                       Login and quick access screen
src/app/features/super-admin                 Enterprise admin dashboard and management workflows
src/app/features/school-admin                School-scoped dashboard and request workflows
scripts/appwrite-align.mjs                   Appwrite schema, auth, storage, master data, and demo data alignment
```

## Local Development

Install dependencies:

```bash
npm install
```

Start the Angular development server:

```bash
npm start
```

Build the project:

```bash
npm run build
```

Run tests:

```bash
npm test -- --watch=false
```

## Implementation Status

Completed:

- Angular app shell, routing, and login flow.
- Appwrite Cloud connection for the KARE project.
- Appwrite Auth users for quick access demo login.
- Database creation and alignment script.
- Master data collections and seed values.
- Multi-school collections and seed data.
- Asset inventory dashboards for super admin and school admin views.
- Request submission and review workflow.
- Asset attachment bucket creation.
- Vendor, category, status, school, and location seeded data.
- Build and unit test verification after the Appwrite refactor.

Partially completed:

- Realtime integration is structurally planned but still needs full live subscription coverage across dashboard widgets and school-scoped grids.
- Reporting is usable with filters and dashboard metrics, but export-ready reports and deeper analytics remain future work.
- Vendor module is backed by master vendors, but full vendor lifecycle screens can be expanded.
- Master Data Management is backed by database collections; richer admin editing flows can still be improved.

Pending:

- Full end-to-end browser testing against the live Appwrite project.
- Production credential hardening and API key rotation.
- Final review of all CRUD paths with real school users.
- Expanded file upload UI for asset attachments.
- Production deployment configuration.

## CRUD Coverage Estimate

| Module | Coverage | Notes |
| --- | ---: | --- |
| Authentication | 90% | Login/logout and demo users work; production password policy remains. |
| Users and profiles | 80% | Seeded and fetched from Appwrite; richer admin user management pending. |
| Schools | 80% | Master school data seeded and fetched; editing UI can be expanded. |
| Assets | 90% | Create, read, update, and delete paths exist for admin flows. |
| Locations | 80% | Seeded and fetched; richer location management pending. |
| Requests | 90% | Submit, review, approve, and reject flows exist. |
| Audit logs | 75% | Important actions are logged; coverage can be widened. |
| Vendors | 70% | Master values seeded and fetched; full CRUD screen needs expansion. |
| Categories and statuses | 75% | Master data backed by Appwrite; admin editing can be expanded. |
| Attachments | 50% | Bucket exists; complete UI upload/download flow still needs finishing. |
| Reporting | 70% | Dashboards and filters exist; export and advanced analytics pending. |
| Realtime | 35% | Appwrite-ready architecture exists; complete subscriptions pending. |

## Security Notes

- Do not commit Appwrite API keys.
- Rotate any API key that was shared outside a secret manager.
- Demo password `password123` is for development and testing only.
- Confirm Appwrite collection permissions before production rollout.
- Keep GitHub credentials out of the repository and use Git Credential Manager or a personal access token locally.

## Repository

Target GitHub repository:

```text
https://github.com/Vishal-WD/Store-Project.git
```
