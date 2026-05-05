import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');

    return {
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.ts'],
                refresh: true,
            }),
            tailwindcss(),
            vue(),
        ],
        resolve: {
            alias: {
                '@': '/resources/js',
            },
        },
        build: {
            sourcemap: env.VITE_BUILD_SOURCEMAP === 'true',
            chunkSizeWarningLimit: 1200,
            rollupOptions: {
                output: {
                    manualChunks(id) {
                        if (id.includes('pdf-lib') || id.includes('pdfjs-dist')) return 'pdf';
                        if (id.includes('jszip')) return 'archive';
                        return undefined;
                    },
                },
            },
        },
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
    };
});
