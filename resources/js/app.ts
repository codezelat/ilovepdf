import { createInertiaApp } from '@inertiajs/vue3';
import { createApp, h } from 'vue';
import '../css/app.css';

const appName = 'ILovePDF Studio';
const appTitleSuffix = ` - ${appName}`;

function formatDocumentTitle(title: string) {
    if (!title) {
        return typeof document === 'undefined' ? appName : document.title;
    }

    return title.endsWith(appTitleSuffix) ? title : `${title}${appTitleSuffix}`;
}

createInertiaApp({
    title: formatDocumentTitle,
    resolve: (name) => {
        const pages = import.meta.glob('./Pages/**/*.vue', { eager: true });
        const page = pages[`./Pages/${name}.vue`] as { default: never } | undefined;
        if (!page) throw new Error(`Page not found: ${name}`);
        return page;
    },
    setup({ el, App, props, plugin }) {
        createApp({ render: () => h(App, props) }).use(plugin).mount(el);
    },
    progress: {
        color: '#ef4444',
    },
});

if ('serviceWorker' in navigator && import.meta.env.PROD) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js').catch(() => {
            // The app remains fully usable if a browser blocks service workers.
        });
    });
}
