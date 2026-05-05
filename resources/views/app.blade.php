<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        @php
            $seo = $seo ?? [
                'title' => config('studio.pages.home.title', config('app.name', 'ILovePDF Studio')),
                'description' => config('studio.pages.home.description', 'Private browser PDF tools.'),
                'canonical' => url()->current(),
                'image' => url(config('studio.image', '/icons/icon-512.png')),
                'type' => 'website',
                'robots' => 'index, follow, max-image-preview:large',
                'jsonLd' => [],
            ];
        @endphp
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <meta name="application-name" content="ILovePDF Studio">
        <meta name="apple-mobile-web-app-title" content="PDF Studio">
        <meta name="apple-mobile-web-app-capable" content="yes">
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
        <meta name="mobile-web-app-capable" content="yes">
        <meta name="format-detection" content="telephone=no">
        <meta name="color-scheme" content="dark light">
        <link rel="preconnect" href="https://fonts.googleapis.com" crossorigin>
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link rel="dns-prefetch" href="https://fonts.googleapis.com">
        <meta name="theme-color" content="#0f172a" media="(prefers-color-scheme: dark)">
        <meta name="theme-color" content="#f8fafc" media="(prefers-color-scheme: light)">
        <meta data-inertia="description" name="description" content="{{ $seo['description'] }}">
        <meta data-inertia="robots" name="robots" content="{{ $seo['robots'] }}">
        <link data-inertia="canonical" rel="canonical" href="{{ $seo['canonical'] }}">
        <meta property="og:site_name" content="ILovePDF Studio">
        <meta property="og:type" content="{{ $seo['type'] }}">
        <meta data-inertia="og:title" property="og:title" content="{{ $seo['title'] }}">
        <meta data-inertia="og:description" property="og:description" content="{{ $seo['description'] }}">
        <meta data-inertia="og:url" property="og:url" content="{{ $seo['canonical'] }}">
        <meta data-inertia="og:image" property="og:image" content="{{ $seo['image'] }}">
        <meta property="og:image:alt" content="ILovePDF Studio PDF tools logo">
        <meta name="twitter:card" content="summary_large_image">
        <meta data-inertia="twitter:title" name="twitter:title" content="{{ $seo['title'] }}">
        <meta data-inertia="twitter:description" name="twitter:description" content="{{ $seo['description'] }}">
        <meta data-inertia="twitter:image" name="twitter:image" content="{{ $seo['image'] }}">
        <link rel="manifest" href="/manifest.webmanifest">
        <link rel="icon" href="/icons/icon.svg" type="image/svg+xml">
        <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png">
        <link rel="mask-icon" href="/icons/icon.svg" color="#ef4444">
        <meta name="msapplication-TileColor" content="#020617">
        <title data-inertia="">{{ $seo['title'] }}</title>
        @foreach ($seo['jsonLd'] ?? [] as $schema)
            <script type="application/ld+json">{!! json_encode($schema, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE) !!}</script>
        @endforeach
        @routes
        @vite(['resources/css/app.css', 'resources/js/app.ts'])
        @inertiaHead
    </head>
    <body class="antialiased bg-slate-950 text-white">
        @inertia
    </body>
</html>
