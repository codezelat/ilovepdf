<p align="center">
  <img src="public/icons/icon.svg" width="112" height="112" alt="ILovePDF Studio logo">
</p>

# ILovePDF Studio

Private browser PDF tools by Codezela Technologies, built with the same Laravel + Inertia + Vue stack family as the ILoveIMG reference and a separate PDF-focused brand mark.

The current tools process files in the browser. Laravel serves the Inertia app, SEO metadata, routes, sitemap, manifest, and static assets; the implemented PDF tools do not upload user documents to a server.

## Stack

- Laravel 13
- Inertia Laravel
- Vue 3
- TypeScript
- Vite
- Tailwind CSS 4
- pdf-lib, PDF.js, JSZip

## Pages

- `/` - homepage with hero, tools, features, and footer
- `/tools` - direct tools directory page
- `/features` - direct features page
- `/privacy` - Privacy Policy
- `/terms` - Terms of Use
- `/merge-pdf`, `/split-pdf`, `/extract-pdf-pages`, `/delete-pdf-pages`
- `/organize-pdf`, `/rotate-pdf`, `/add-page-numbers`, `/watermark-pdf`
- `/images-to-pdf`, `/pdf-to-images`, `/edit-pdf-metadata`, `/flatten-pdf`
- `/sitemap.xml` and `/robots.txt`

## Tools

- Merge PDF
- Split PDF
- Extract pages
- Delete pages
- Organize/reorder pages
- Rotate PDF
- Add page numbers
- Text watermark
- JPG/PNG to PDF
- PDF to JPG/PNG
- Edit metadata
- Flatten PDF forms

## Browser App

The app is installable in supported browsers:

- `public/manifest.webmanifest` defines the PWA shell, icons, shortcuts, and scope.
- `public/sw.js` caches the app shell and static assets for resilient repeat visits.
- `public/icons/icon.svg` is the primary PDF Studio logo.
- `public/icons/icon-192.png`, `icon-512.png`, and `apple-touch-icon.png` are generated install icons.

Regenerate icons after changing the mark:

```bash
php scripts/generate-pwa-icons.php
```

## SEO

SEO metadata is server-generated for every route:

- Unique page and tool titles
- Unique meta descriptions
- Canonical URLs based on `APP_URL`
- Open Graph and Twitter card tags
- JSON-LD for Organization, WebPage, and SoftwareApplication
- Dynamic `/sitemap.xml`
- Dynamic `/robots.txt`

For production, `APP_URL` must be the final public HTTPS domain so canonical URLs, sitemap URLs, robots output, and social metadata are correct.

## Install

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
```

## Develop

```bash
php artisan serve
npm run dev
```

The local app is usually available at `http://127.0.0.1:8000`.

## Production Checklist

- Set `APP_ENV=production`
- Set `APP_DEBUG=false`
- Set `APP_URL=https://your-domain.com`
- Set a generated `APP_KEY`
- Set `SESSION_SECURE_COOKIE=true` when deployed behind HTTPS
- Run migrations for the selected database/session/cache drivers
- Run `php artisan optimize`
- Build frontend assets with `npm run build`
- Confirm `/sitemap.xml`, `/robots.txt`, `/manifest.webmanifest`, and `/icons/icon-512.png` resolve on the production domain

## Verify

```bash
php scripts/generate-pwa-icons.php
npm run build
php artisan test
```

Useful live checks:

```bash
curl -I "$APP_URL/merge-pdf"
curl -I "$APP_URL/manifest.webmanifest"
curl "$APP_URL/robots.txt"
curl "$APP_URL/sitemap.xml"
```

## Architecture

- `routes/web.php` owns public routes, SEO view data, sitemap, and robots output.
- `config/studio.php` contains route metadata, tool metadata for SEO, and browser-app image settings.
- `resources/views/app.blade.php` is the Inertia root view with SEO, PWA, and social metadata.
- `resources/views/sitemap.blade.php` renders sitemap XML.
- `resources/js/Pages/Studio.vue` renders homepage, tools directory, features, and individual tool pages.
- `resources/js/Pages/Legal.vue` renders Privacy and Terms pages.
- `resources/js/Components/AppFooter.vue` contains the shared footer and Codezela link.
- `resources/js/data/tools.ts` is the frontend tool registry.
- `resources/js/pdf/operations.ts` contains the browser-local PDF engine.
- `resources/css/app.css` contains Tailwind 4 sources and shared UI classes.

## Privacy Notes

- Implemented tools use the browser File API, browser memory, and object URLs.
- There is no upload endpoint for the implemented PDF processing workflows.
- PDF magic bytes are checked before processing PDFs.
- Temporary object URLs are revoked when selections/results are cleared or pages unmount.
