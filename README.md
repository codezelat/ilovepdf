# ILovePDF Studio

<p align="center">
  <img src="public/icons/icon.svg" alt="ILovePDF Studio Logo" width="120" height="120">
</p>

<h1 align="center">ILovePDF Studio</h1>

<p align="center">
  <strong>Private Browser-Based PDF Processing Toolkit</strong><br>
  13 PDF Workflows · Browser-Local Processing · Installable PWA · SEO-Ready Laravel Routes
</p>

<p align="center">
  <a href="https://codezela.com" target="_blank">
    <img src="https://img.shields.io/badge/Codezela-Technologies-0f6aa6?style=for-the-badge" alt="Codezela Technologies">
  </a>
  <a href="composer.json">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License: MIT">
  </a>
  <a href="public/vendor/qpdf/LICENSE">
    <img src="https://img.shields.io/badge/qpdf%20WASM-Apache--2.0-blue.svg?style=for-the-badge" alt="qpdf WASM Apache-2.0">
  </a>
</p>

<p align="center">
  <a href="#features">Features</a> ·
  <a href="#complete-tool-list">Tools</a> ·
  <a href="#installation">Installation</a> ·
  <a href="#configuration">Configuration</a> ·
  <a href="#deployment">Deployment</a> ·
  <a href="#architecture">Architecture</a>
</p>

---

## Table of Contents

- [Introduction](#introduction)
- [Features](#features)
- [Complete Tool List](#complete-tool-list)
- [Technology Stack](#technology-stack)
- [Installation](#installation)
- [Configuration](#configuration)
- [Usage Guide](#usage-guide)
- [Architecture](#architecture)
- [SEO & PWA](#seo--pwa)
- [Privacy & Security](#privacy--security)
- [Development](#development)
- [Deployment](#deployment)
- [Verification](#verification)
- [Troubleshooting](#troubleshooting)
- [License](#license)
- [Acknowledgments](#acknowledgments)
- [Support](#support)

---

## Introduction

ILovePDF Studio is a production-minded PDF utility app by Codezela Technologies. It uses Laravel, Inertia, Vue 3, TypeScript, Vite, and Tailwind CSS to deliver direct, indexable pages for each PDF workflow while keeping implemented document processing in the browser.

Laravel serves the application shell, SEO metadata, legal pages, sitemap, robots file, PWA manifest, service worker, and static browser engines. The current PDF tools use browser APIs and JavaScript/WASM libraries instead of uploading user PDFs to a processing endpoint.

### Key Differentiators

- **Browser-Local PDF Workflows**: Implemented tools operate in browser memory with object URLs.
- **Dedicated Laravel Routes**: Every tool has its own route for direct loading, refreshes, sharing, and SEO.
- **qpdf-Powered Compression**: Compress PDF serves qpdf WASM from `public/vendor/qpdf/` before using guarded aggressive fallbacks.
- **Installable Browser App**: Manifest, service worker, icons, and install button are included.
- **SEO-Ready Output**: Titles, descriptions, canonical URLs, Open Graph tags, Twitter tags, JSON-LD, sitemap, and robots are generated server-side.
- **Codezela Branding**: Footer and structured data identify Codezela Technologies with a direct link to `https://codezela.com`.

---

## Features

### PDF Organization

- **Merge PDF**: Combine two or more PDFs into one file.
- **Split PDF**: Export each page into individual PDFs inside a ZIP.
- **Extract Pages**: Build a new PDF from page ranges like `1,3-5,last`.
- **Delete Pages**: Remove selected pages while guarding against deleting every page.
- **Organize PDF**: Reorder pages using a custom page sequence.

### PDF Editing

- **Compress PDF**: Smart, lossless, balanced, strong, and maximum modes.
- **Rotate PDF**: Rotate all or selected pages by 90, 180, or 270 degrees.
- **Add Page Numbers**: Add clean footer page numbers with a configurable prefix.
- **Watermark PDF**: Apply a diagonal text watermark with opacity control.
- **Edit PDF Metadata**: Update title, author, and subject.
- **Flatten PDF**: Flatten supported form fields into static page content.

### PDF Conversion

- **Images to PDF**: Convert JPG and PNG images into a PDF.
- **PDF to Images**: Render PDF pages as JPG or PNG and download a ZIP.

### Browser App

- Installable via supported Chromium/Edge browser install flows.
- Service worker caches the app shell and core static assets.
- PWA shortcuts open common workflows.
- Generated PNG and Apple touch icons are included.

### Quality & Safety

- Duplicate file detection.
- PDF magic-byte validation.
- 200 MB per-file validation limit.
- Page range validation with useful error messages.
- Object URL cleanup when files/results are cleared or views unmount.
- TypeScript checked build pipeline.
- PHPUnit route/SEO/static-engine coverage.

---

## Complete Tool List

### PDF Tool Routes

| Tool | Route | Input | Output | Notes |
|------|-------|-------|--------|-------|
| Merge PDF | `/merge-pdf` | 2+ PDFs | PDF | Combines pages in upload order |
| Compress PDF | `/compress-pdf` | PDF | PDF | qpdf WASM first, safe aggressive fallbacks |
| Split PDF | `/split-pdf` | PDF | ZIP | One PDF per page |
| Extract PDF Pages | `/extract-pdf-pages` | PDF | PDF | Supports ranges and `last` |
| Delete PDF Pages | `/delete-pdf-pages` | PDF | PDF | Prevents empty output |
| Organize PDF | `/organize-pdf` | PDF | PDF | Custom sequence like `3,1,2,4` |
| Rotate PDF | `/rotate-pdf` | PDF | PDF | 90, 180, or 270 degrees |
| Add Page Numbers | `/add-page-numbers` | PDF | PDF | Footer numbering |
| Watermark PDF | `/watermark-pdf` | PDF | PDF | Text watermark |
| JPG and PNG to PDF | `/images-to-pdf` | JPG/PNG | PDF | Multi-image document creation |
| PDF to JPG or PNG | `/pdf-to-images` | PDF | ZIP | Page rendering through PDF.js |
| Edit PDF Metadata | `/edit-pdf-metadata` | PDF | PDF | Title, author, subject |
| Flatten PDF | `/flatten-pdf` | PDF | PDF | Supported PDF form fields |

### Public Pages

| Page | Route | Purpose |
|------|-------|---------|
| Home | `/` | Hero, tools, features, footer |
| Tools | `/tools` | Tool directory |
| Features | `/features` | Browser-local feature overview |
| Privacy Policy | `/privacy` | Privacy terms for browser-local processing |
| Terms of Use | `/terms` | Product usage terms |

### System & SEO Routes

| Endpoint | Route | Purpose |
|----------|-------|---------|
| Sitemap | `/sitemap.xml` | Dynamic XML sitemap |
| Robots | `/robots.txt` | Dynamic crawler directives |
| Health | `/up` | Laravel health check |
| Manifest | `/manifest.webmanifest` | Browser app manifest |
| Service Worker | `/sw.js` | PWA cache worker |
| qpdf Engine | `/vendor/qpdf/qpdf.mjs` | Browser-served PDF compression engine |

---

## Technology Stack

### Backend

| Technology | Version | Purpose |
|------------|---------|---------|
| PHP | 8.3+ | Runtime |
| Laravel | 13.x | Routing, config, views, sitemap, robots, app shell |
| Inertia Laravel | 3.x | Laravel-to-Vue page transport |
| SQLite | Default | Local database/session/cache driver support |
| PHPUnit | 12.x | Feature and route tests |

### Frontend

| Technology | Version | Purpose |
|------------|---------|---------|
| Vue | 3.5+ | UI |
| TypeScript | 6.x | Type safety |
| Vite | 8.x | Frontend build |
| Tailwind CSS | 4.x | Styling |
| lucide-vue-next | 1.x | Interface icons |
| Inertia Vue | 3.x | SPA navigation |

### PDF Processing

| Library / Asset | Purpose | Location |
|-----------------|---------|----------|
| pdf-lib | PDF creation, page copying, metadata, watermarking, numbering | npm dependency |
| PDF.js | PDF rendering for image export and raster fallback | npm dependency |
| qpdf WASM | Browser-served structural compression and safe optimization | `public/vendor/qpdf/qpdf.mjs` |
| JSZip | ZIP output for split/export workflows | npm dependency |
| Canvas API | Browser raster rendering for PDF-to-image and aggressive compression fallback | browser API |

---

## Installation

### Prerequisites

- PHP 8.3 or newer
- Composer 2.x
- Node.js and npm
- SQLite, MySQL, or PostgreSQL

### Local Setup

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite
php artisan migrate
npm run build
```

### Development Server

```bash
php artisan serve --host=127.0.0.1 --port=8000
npm run dev
```

The local app is usually available at:

```text
http://127.0.0.1:8000
```

---

## Configuration

### Required Production Environment

```env
APP_NAME="ILovePDF Studio"
APP_ENV=production
APP_DEBUG=false
APP_URL=https://your-domain.com
APP_KEY=base64:generated-key

DB_CONNECTION=sqlite
SESSION_DRIVER=database
CACHE_STORE=database
QUEUE_CONNECTION=database

SESSION_SECURE_COOKIE=true
SESSION_HTTP_ONLY=true
SESSION_SAME_SITE=lax

VITE_APP_NAME="${APP_NAME}"
VITE_BUILD_SOURCEMAP=false
```

### Important Notes

- `APP_URL` controls canonical URLs, sitemap URLs, robots output, social metadata, and asset URLs.
- `APP_KEY` must be generated with `php artisan key:generate`.
- `SESSION_SECURE_COOKIE=true` should be used on HTTPS production domains.
- `VITE_BUILD_SOURCEMAP=false` keeps production builds from publishing source maps unless explicitly enabled.
- `public/vendor/qpdf/qpdf.mjs` and `public/vendor/qpdf/LICENSE` must be present after deploy.

---

## Usage Guide

### Basic Workflow

1. Open the homepage or a direct tool route such as `/compress-pdf`.
2. Add files by clicking the upload panel or dragging files into it.
3. Choose tool options when the selected workflow exposes them.
4. Run the processing button.
5. Download the generated PDF or ZIP from the results section.

### Page Ranges

Supported range examples:

```text
1
1,3,5
2-6
1,3-5,last
```

### Compress PDF Modes

| Mode | Behavior | Preserves Text/Vectors |
|------|----------|------------------------|
| Smart | qpdf optimization first, then strong fallback only when useful | Usually yes |
| Lossless | qpdf/pdf-lib structural cleanup without visual flattening | Yes |
| Balanced | qpdf optimization with safe image cleanup | Yes |
| Strong | Adds raster fallback only when smaller | May flatten |
| Maximum | Prioritizes smallest accepted output | May flatten |

The app compares candidates and avoids returning a larger "compressed" output when the original is already smaller.

---

## Architecture

### Directory Structure

```text
ilovepdf/
├── app/
│   ├── Http/Middleware/HandleInertiaRequests.php
│   ├── Models/User.php
│   └── Providers/AppServiceProvider.php
├── bootstrap/
│   └── app.php
├── config/
│   ├── app.php
│   ├── database.php
│   ├── session.php
│   └── studio.php
├── database/
│   ├── migrations/
│   └── seeders/
├── public/
│   ├── build/
│   ├── icons/
│   ├── vendor/qpdf/
│   │   ├── LICENSE
│   │   └── qpdf.mjs
│   ├── manifest.webmanifest
│   └── sw.js
├── resources/
│   ├── css/app.css
│   ├── js/
│   │   ├── app.ts
│   │   ├── Components/
│   │   ├── Pages/
│   │   ├── composables/
│   │   ├── data/tools.ts
│   │   └── pdf/operations.ts
│   └── views/
│       ├── app.blade.php
│       └── sitemap.blade.php
├── routes/
│   └── web.php
├── tests/
│   └── Feature/StudioRoutingTest.php
├── composer.json
├── package.json
├── vite.config.js
└── README.md
```

### Main Responsibilities

| File | Responsibility |
|------|----------------|
| `routes/web.php` | Public routes, legal pages, tool route rendering, sitemap, robots |
| `config/studio.php` | SEO titles/descriptions and tool route metadata |
| `resources/views/app.blade.php` | Root Inertia view, meta tags, PWA links, JSON-LD |
| `resources/js/Pages/Studio.vue` | Homepage, tools page, features page, and tool workspace |
| `resources/js/Pages/Legal.vue` | Privacy and terms pages |
| `resources/js/Components/InstallAppButton.vue` | PWA/browser install action |
| `resources/js/Components/AppFooter.vue` | Footer and Codezela link |
| `resources/js/data/tools.ts` | Frontend tool registry and options |
| `resources/js/pdf/operations.ts` | Browser-local PDF processing engine |
| `resources/js/composables/useDocumentTitle.ts` | Inertia navigation title consistency |
| `public/vendor/qpdf/` | Browser-served qpdf WASM engine and license |
| `tests/Feature/StudioRoutingTest.php` | Route, SEO, sitemap, removed-route, and engine checks |

---

## SEO & PWA

### SEO Implementation

- Unique title and description for every public page and PDF tool.
- Titles consistently end with ` - ILovePDF Studio`.
- Canonical URLs generated from `APP_URL`.
- Open Graph and Twitter metadata.
- JSON-LD for `Organization`, `WebPage`, and tool `SoftwareApplication`.
- Dynamic `/sitemap.xml`.
- Dynamic `/robots.txt`.
- Direct Laravel routes for every tool page.

### PWA Implementation

- `public/manifest.webmanifest` defines app name, colors, icons, display mode, scope, and shortcuts.
- `public/sw.js` caches the app shell and static assets.
- `public/icons/icon.svg` is the primary logo.
- `public/icons/icon-192.png`, `public/icons/icon-512.png`, and `public/icons/apple-touch-icon.png` are generated install icons.

Regenerate icons after changing the mark:

```bash
php scripts/generate-pwa-icons.php
```

---

## Privacy & Security

### Privacy Notes

- Implemented PDF tools run in browser memory.
- There is no upload endpoint for the implemented processing workflows.
- Files are selected with the browser File API.
- Downloads are produced with browser object URLs.
- Temporary object URLs are revoked when selections/results are cleared or the page unmounts.
- No analytics or advertising scripts are configured in this repository.

### Security Notes

- PDF files are checked for `%PDF-` magic bytes before processing.
- Unsupported, encrypted, or malformed PDFs return user-facing errors where detected.
- Laravel session cookies are HTTP-only by default.
- Production HTTPS deployments should set `SESSION_SECURE_COOKIE=true`.
- The qpdf WASM engine is served as a static asset and its Apache-2.0 license is committed beside it.

---

## Development

### Common Commands

```bash
# Frontend typecheck and production build
npm run build

# Frontend dev server only
npm run dev

# Laravel test suite
php artisan test

# Composer-provided test script
composer test
```

### Adding a Tool

1. Add route metadata in `config/studio.php`.
2. Add the frontend tool definition in `resources/js/data/tools.ts`.
3. Implement processing behavior in `resources/js/pdf/operations.ts`.
4. Add any tool-specific options in `resources/js/Pages/Studio.vue`.
5. Add the route to `tests/Feature/StudioRoutingTest.php`.
6. Run `npm run build` and `php artisan test`.

---

## Deployment

### Standard Production Build

```bash
composer install --no-dev --optimize-autoloader
npm ci
npm run build
php artisan key:generate --force
php artisan migrate --force
php artisan storage:link
php artisan optimize
```

### Writable Paths

Ensure these are writable by the PHP user:

```text
database/
storage/
storage/app/public/
storage/framework/cache/data/
storage/framework/sessions/
storage/framework/views/
storage/logs/
bootstrap/cache/
```

### Production Checklist

- [ ] `APP_ENV=production`
- [ ] `APP_DEBUG=false`
- [ ] `APP_URL` is the final HTTPS domain
- [ ] `APP_KEY` is generated
- [ ] Database migrations are applied
- [ ] `SESSION_SECURE_COOKIE=true` on HTTPS
- [ ] `npm run build` completed
- [ ] `php artisan test` completed before deploy
- [ ] `php artisan optimize` completed after env/config updates
- [ ] `/sitemap.xml` resolves
- [ ] `/robots.txt` resolves
- [ ] `/manifest.webmanifest` resolves
- [ ] `/sw.js` resolves
- [ ] `/icons/icon-512.png` resolves
- [ ] `/vendor/qpdf/qpdf.mjs` resolves
- [ ] `/compress-pdf` loads with the correct title and metadata

---

## Verification

### Local Verification

```bash
git diff --check
npm run build
php artisan test
npm audit --audit-level=moderate
```

### Live Route Checks

```bash
curl -I "$APP_URL/"
curl -I "$APP_URL/compress-pdf"
curl -I "$APP_URL/vendor/qpdf/qpdf.mjs"
curl "$APP_URL/robots.txt"
curl "$APP_URL/sitemap.xml"
```

### Commit-Safe File Set for Compression Work

The compression engine requires both the dependency metadata and static vendor asset:

```bash
git add README.md config/studio.php package.json package-lock.json \
  resources/js/Pages/Studio.vue resources/js/data/tools.ts resources/js/pdf/operations.ts \
  resources/js/vite-env.d.ts tests/Feature/StudioRoutingTest.php \
  public/vendor/qpdf/LICENSE public/vendor/qpdf/qpdf.mjs
```

Do not commit local/runtime files such as `.env`, `database/database.sqlite`, `node_modules/`, `vendor/`, `public/build/`, cache files, or storage-generated views.

---

## Troubleshooting

### Compress PDF does not run

- Confirm `/vendor/qpdf/qpdf.mjs` returns `200 OK`.
- Confirm `public/vendor/qpdf/qpdf.mjs` was committed and deployed.
- Confirm browser console does not show a blocked module load.
- Try Lossless mode first to separate qpdf loading from raster fallback behavior.

### Install button does nothing

- Install prompts require HTTPS, `localhost`, or `127.0.0.1`.
- Some browsers hide install if the app is already installed.
- Edge users can also install from Apps → Install this site as an app.
- Confirm `/manifest.webmanifest`, `/sw.js`, and icon files resolve.

### SEO title is wrong after navigation

- Confirm the page uses Inertia navigation and the current built asset is deployed.
- Confirm `resources/js/composables/useDocumentTitle.ts` is included in the active bundle.
- Confirm Blade/Inertia title tags include `data-inertia`.

### Build fails

- Run `npm install` or `npm ci`.
- Confirm Node/npm are available.
- Clear stale Vite artifacts if needed.
- Re-run `npm run build` and read the first TypeScript error.

### Laravel route returns 500

- Confirm `.env` exists.
- Run `php artisan key:generate`.
- Run `php artisan migrate --force`.
- Clear and rebuild caches:

```bash
php artisan optimize:clear
php artisan optimize
```

---

## License

The application package declares the MIT license in `composer.json`.

The bundled qpdf WASM engine in `public/vendor/qpdf/` is Apache-2.0 licensed; its license text is included at `public/vendor/qpdf/LICENSE`.

---

## Acknowledgments

- [Laravel](https://laravel.com) - PHP application framework
- [Inertia.js](https://inertiajs.com) - Modern monolith SPA bridge
- [Vue.js](https://vuejs.org) - Frontend framework
- [Vite](https://vite.dev) - Frontend tooling
- [Tailwind CSS](https://tailwindcss.com) - Utility-first styling
- [pdf-lib](https://pdf-lib.js.org) - PDF creation and editing
- [PDF.js](https://github.com/mozilla/pdf.js) - PDF rendering
- [qpdf](https://qpdf.readthedocs.io) - PDF structure optimization
- [JSZip](https://stuk.github.io/jszip/) - ZIP generation
- [Lucide](https://lucide.dev) - Icon system

---

## Support

- Website: [https://codezela.com](https://codezela.com)
- Company: Codezela Technologies
- Product: ILovePDF Studio

---

<p align="center">
  <strong>Crafted by <a href="https://codezela.com">Codezela Technologies</a></strong><br>
  Colombo, Sri Lanka
</p>
