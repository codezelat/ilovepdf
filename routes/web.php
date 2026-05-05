<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

$makeSeo = static function (array $entry, string $kind = 'WebPage'): array {
    $path = $entry['path'];
    $canonical = url($path);
    $image = url(config('studio.image'));
    $title = $entry['title'];
    $description = $entry['description'];

    $jsonLd = [
        [
            '@context' => 'https://schema.org',
            '@type' => 'Organization',
            '@id' => url('/#organization'),
            'name' => 'Codezela Technologies',
            'url' => 'https://codezela.com',
            'logo' => $image,
        ],
        [
            '@context' => 'https://schema.org',
            '@type' => $kind,
            '@id' => $canonical.'#webpage',
            'name' => $title,
            'description' => $description,
            'url' => $canonical,
            'isPartOf' => [
                '@type' => 'WebSite',
                '@id' => url('/#website'),
                'name' => config('studio.base_title'),
                'url' => url('/'),
            ],
            'publisher' => [
                '@id' => url('/#organization'),
            ],
        ],
    ];

    return [
        'title' => $title,
        'description' => $description,
        'canonical' => $canonical,
        'image' => $image,
        'type' => 'website',
        'robots' => $entry['robots'] ?? 'index, follow, max-image-preview:large',
        'jsonLd' => $jsonLd,
    ];
};

$renderStudio = static function (string $pageMode, string $initialTool, array $entry) use ($makeSeo) {
    $seo = $makeSeo($entry, $pageMode === 'tool' ? 'SoftwareApplication' : 'WebPage');

    if ($pageMode === 'tool') {
        $seo['jsonLd'][] = [
            '@context' => 'https://schema.org',
            '@type' => 'SoftwareApplication',
            'name' => $entry['name'],
            'applicationCategory' => 'ProductivityApplication',
            'operatingSystem' => 'Any modern browser',
            'url' => $seo['canonical'],
            'description' => $entry['description'],
            'offers' => [
                '@type' => 'Offer',
                'price' => '0',
                'priceCurrency' => 'USD',
            ],
        ];
    }

    return Inertia::render('Studio', [
        'initialTool' => $initialTool,
        'pageMode' => $pageMode,
        'seo' => $seo,
    ])->withViewData('seo', $seo);
};

$renderLegal = static function (string $page, array $entry) use ($makeSeo) {
    $seo = $makeSeo($entry, 'WebPage');

    return Inertia::render('Legal', [
        'page' => $page,
        'seo' => $seo,
    ])->withViewData('seo', $seo);
};

Route::get('/', function () {
    return app('renderStudio')('home', '/merge-pdf', config('studio.pages.home'));
})->name('studio');

app()->instance('renderStudio', $renderStudio);
app()->instance('renderLegal', $renderLegal);

Route::get('/privacy', fn () => app('renderLegal')('privacy', config('studio.pages.privacy')))->name('privacy');

Route::get('/terms', fn () => app('renderLegal')('terms', config('studio.pages.terms')))->name('terms');

Route::get('/tools', fn () => app('renderStudio')('tools', '/merge-pdf', config('studio.pages.tools')))->name('tools.index');

Route::get('/features', fn () => app('renderStudio')('features', '/merge-pdf', config('studio.pages.features')))->name('features');

foreach (config('studio.tools') as $toolName => $tool) {
    Route::get($tool['path'], fn () => app('renderStudio')('tool', $tool['path'], $tool))->name("tools.$toolName");
}

Route::get('/sitemap.xml', function () {
    $entries = collect(config('studio.pages'))
        ->merge(config('studio.tools'))
        ->map(fn (array $entry) => [
            'loc' => url($entry['path']),
            'lastmod' => now()->toDateString(),
            'changefreq' => str_starts_with($entry['path'], '/privacy') || str_starts_with($entry['path'], '/terms') ? 'monthly' : 'weekly',
            'priority' => $entry['path'] === '/' ? '1.0' : (str_starts_with($entry['path'], '/privacy') || str_starts_with($entry['path'], '/terms') ? '0.4' : '0.8'),
        ]);

    return response()
        ->view('sitemap', ['entries' => $entries])
        ->header('Content-Type', 'application/xml; charset=UTF-8');
})->name('sitemap');

Route::get('/robots.txt', function () {
    return response(
        "User-agent: *\n".
        "Allow: /\n\n".
        'Sitemap: '.url('/sitemap.xml')."\n",
        200,
        ['Content-Type' => 'text/plain; charset=UTF-8']
    );
})->name('robots');
