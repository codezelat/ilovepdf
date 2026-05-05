<?php

namespace Tests\Feature;

use Inertia\Testing\AssertableInertia as Assert;
use PHPUnit\Framework\Attributes\DataProvider;
use Tests\TestCase;

class StudioRoutingTest extends TestCase
{
    public function test_homepage_loads_the_default_pdf_tool(): void
    {
        $this->get('/')
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Studio')
                ->where('initialTool', '/merge-pdf')
                ->where('pageMode', 'home')
                ->has('seo.title')
                ->has('seo.description')
                ->has('seo.canonical'));
    }

    #[DataProvider('legalRoutes')]
    public function test_legal_pages_have_direct_laravel_routes(string $route, string $pageName): void
    {
        $this->get($route)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Legal')
                ->where('page', $pageName)
                ->has('seo.title')
                ->has('seo.description')
                ->has('seo.canonical'));
    }

    #[DataProvider('studioIndexRoutes')]
    public function test_studio_index_pages_have_direct_laravel_routes(string $route, string $pageMode): void
    {
        $this->get($route)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Studio')
                ->where('initialTool', '/merge-pdf')
                ->where('pageMode', $pageMode)
                ->has('seo.title')
                ->has('seo.description')
                ->has('seo.canonical'));
    }

    #[DataProvider('toolRoutes')]
    public function test_each_pdf_tool_has_a_direct_laravel_route(string $route): void
    {
        $this->get($route)
            ->assertOk()
            ->assertInertia(fn (Assert $page) => $page
                ->component('Studio')
                ->where('initialTool', $route)
                ->where('pageMode', 'tool')
                ->has('seo.title')
                ->has('seo.description')
                ->has('seo.canonical')
                ->has('seo.jsonLd'));
    }

    public function test_sitemap_lists_all_indexable_pages(): void
    {
        $response = $this->get('/sitemap.xml');

        $response->assertOk();
        $response->assertHeader('Content-Type', 'application/xml; charset=UTF-8');
        $response->assertSee('<urlset', false);
        $response->assertSee(url('/merge-pdf'), false);
        $response->assertSee(url('/privacy'), false);
    }

    public function test_all_seo_titles_use_one_brand_suffix(): void
    {
        $suffix = ' - ILovePDF Studio';
        $entries = collect(config('studio.pages'))->merge(config('studio.tools'));

        $entries->each(function (array $entry) use ($suffix): void {
            $this->assertStringEndsWith($suffix, $entry['title']);
            $this->assertSame(1, substr_count($entry['title'], $suffix));
        });

        $this->get('/')
            ->assertOk()
            ->assertSee('<title data-inertia="">'.e(config('studio.pages.home.title')).'</title>', false)
            ->assertSee('data-inertia="description"', false)
            ->assertSee(e(config('studio.pages.home.title')), false);
    }

    #[DataProvider('removedRoutes')]
    public function test_out_of_scope_routes_are_not_exposed(string $route): void
    {
        $this->get($route)->assertNotFound();
    }

    /**
     * @return array<string, array{string}>
     */
    public static function toolRoutes(): array
    {
        return [
            'merge' => ['/merge-pdf'],
            'split' => ['/split-pdf'],
            'extract' => ['/extract-pdf-pages'],
            'delete pages' => ['/delete-pdf-pages'],
            'organize' => ['/organize-pdf'],
            'rotate' => ['/rotate-pdf'],
            'page numbers' => ['/add-page-numbers'],
            'watermark' => ['/watermark-pdf'],
            'images to pdf' => ['/images-to-pdf'],
            'pdf to images' => ['/pdf-to-images'],
            'metadata' => ['/edit-pdf-metadata'],
            'flatten' => ['/flatten-pdf'],
        ];
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function legalRoutes(): array
    {
        return [
            'privacy' => ['/privacy', 'privacy'],
            'terms' => ['/terms', 'terms'],
        ];
    }

    /**
     * @return array<string, array{string, string}>
     */
    public static function studioIndexRoutes(): array
    {
        return [
            'tools index' => ['/tools', 'tools'],
            'features' => ['/features', 'features'],
        ];
    }

    /**
     * @return array<string, array{string}>
     */
    public static function removedRoutes(): array
    {
        return [
            'compress' => ['/compress-pdf'],
            'office converters' => ['/office-pdf-converters'],
            'ocr' => ['/ocr-pdf'],
            'protect unlock' => ['/protect-unlock-pdf'],
        ];
    }
}
