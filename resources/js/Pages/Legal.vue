<script setup lang="ts">
import { Head, Link } from '@inertiajs/vue3';
import { ArrowLeft, FileText, ShieldCheck } from 'lucide-vue-next';
import { computed } from 'vue';
import AppFooter from '@/Components/AppFooter.vue';
import InstallAppButton from '@/Components/InstallAppButton.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';

const props = defineProps<{
    page: 'privacy' | 'terms';
    seo?: SeoMeta;
}>();

type LegalSection = {
    title: string;
    body: string[];
};

type SeoMeta = {
    title: string;
    description: string;
    canonical: string;
    image: string;
    type: string;
    robots: string;
    jsonLd?: unknown[];
};

const effectiveDate = 'May 6, 2026';

const legalPages: Record<'privacy' | 'terms', {
    title: string;
    subtitle: string;
    icon: typeof ShieldCheck;
    sections: LegalSection[];
}> = {
    privacy: {
        title: 'Privacy Policy',
        subtitle: 'How ILovePDF Studio handles files, browser data, and service information.',
        icon: ShieldCheck,
        sections: [
            {
                title: 'Summary',
                body: [
                    'ILovePDF Studio is designed for browser-local PDF work. The PDF files you choose for the available tools are processed in your browser and are not uploaded to our server by those tools.',
                    'We do not require an account, payment details, or profile information to use the current studio.',
                ],
            },
            {
                title: 'Files you process',
                body: [
                    'Your selected PDFs and images stay on your device for the current implemented workflows. The app uses browser memory, temporary object URLs, PDF libraries, canvas rendering, and generated downloads to complete the selected operation.',
                    'When you leave the page, clear the selection, or close the browser tab, the app releases the temporary object URLs it created. Your browser or operating system may still keep downloaded files or cache data according to your own settings.',
                ],
            },
            {
                title: 'Information we receive',
                body: [
                    'When you visit the website, standard web servers may receive technical request information such as IP address, browser type, device type, requested URL, referring page, and time of request. This information is used to serve the app, maintain security, diagnose issues, and understand aggregate service reliability.',
                    'The current app does not ask you to create an account and does not intentionally collect the contents of your documents for the available browser-local tools.',
                ],
            },
            {
                title: 'Cookies and local browser storage',
                body: [
                    'The Laravel application may set essential cookies for session integrity and request protection. These cookies support the website and are not used by the PDF tools to upload document contents.',
                    'The current studio does not require marketing cookies to process files. If analytics or additional services are added later, this policy should be updated before those services are enabled.',
                ],
            },
            {
                title: 'Sharing',
                body: [
                    'We do not sell your document contents. We do not share your uploaded document contents for the current implemented tools because those files are not uploaded to us by those tools.',
                    'We may disclose limited technical request information when required to operate hosting, comply with law, protect the service, or respond to valid legal requests.',
                ],
            },
            {
                title: 'Security',
                body: [
                    'The app is intentionally scoped to reduce data collection. Keeping document processing in the browser limits exposure because files do not need to be transferred for the available workflows.',
                    'No browser-based tool can make your device, browser, network, or downloaded files completely risk-free. Keep your browser updated and avoid processing files you do not trust.',
                ],
            },
            {
                title: 'Your choices',
                body: [
                    'You can choose not to select files, clear selected files before processing, close the tab, delete downloaded outputs, and manage cookies or cached site data through your browser settings.',
                    'For questions about this policy or ILovePDF Studio, contact Codezela Technologies through https://codezela.com.',
                ],
            },
        ],
    },
    terms: {
        title: 'Terms of Use',
        subtitle: 'The rules for using ILovePDF Studio and its browser-local PDF tools.',
        icon: FileText,
        sections: [
            {
                title: 'Acceptance',
                body: [
                    'By accessing or using ILovePDF Studio, you agree to these Terms. If you do not agree, do not use the service.',
                    'These Terms apply to the website, interface, and available browser-local PDF tools provided as ILovePDF Studio.',
                ],
            },
            {
                title: 'Service scope',
                body: [
                    'ILovePDF Studio provides PDF organization, editing, rendering, and download workflows that run in the browser for the tools shown in the interface.',
                    'The service may change over time. Features may be added, changed, limited, or removed to improve reliability, security, performance, or product scope.',
                ],
            },
            {
                title: 'Your files and responsibility',
                body: [
                    'You are responsible for the files you choose to process and for verifying the accuracy, formatting, and completeness of any output before relying on it.',
                    'You must have the rights and permissions needed to process the files you select. Do not use the service to process or distribute content that violates law, infringes rights, contains malware, or harms others.',
                ],
            },
            {
                title: 'Browser-local processing',
                body: [
                    'The current implemented tools are designed to process files on your device. Performance and output quality can vary based on browser capability, available memory, file size, encryption, malformed PDFs, fonts, forms, and PDF features.',
                    'Some files may fail to open, render, edit, flatten, or export correctly. Keep original files and review all results before deleting source documents.',
                ],
            },
            {
                title: 'No professional advice',
                body: [
                    'ILovePDF Studio is a document utility. It does not provide legal, financial, medical, compliance, archival, or professional advice.',
                    'You are responsible for deciding whether an output is suitable for your purpose, recordkeeping requirements, accessibility needs, or regulatory obligations.',
                ],
            },
            {
                title: 'Availability and warranties',
                body: [
                    'The service is provided as is and as available. We do not promise uninterrupted access, error-free operation, perfect compatibility with every PDF, or that outputs will meet every requirement.',
                    'To the maximum extent permitted by law, Codezela Technologies disclaims implied warranties of merchantability, fitness for a particular purpose, and non-infringement.',
                ],
            },
            {
                title: 'Limitation of liability',
                body: [
                    'To the maximum extent permitted by law, Codezela Technologies will not be liable for indirect, incidental, special, consequential, exemplary, or punitive damages, or for loss of data, files, profits, revenue, or business opportunities arising from use of the service.',
                    'Some jurisdictions do not allow certain limitations, so parts of this section may not apply to you.',
                ],
            },
            {
                title: 'Contact',
                body: [
                    'For questions about these Terms or ILovePDF Studio, contact Codezela Technologies through https://codezela.com.',
                ],
            },
        ],
    },
};

const currentPage = computed(() => legalPages[props.page]);
const pageTitle = computed(() => props.seo?.title ?? currentPage.value.title);
useDocumentTitle(pageTitle);
const seoJsonLd = computed(() => (props.seo?.jsonLd ?? []).map((schema) => JSON.stringify(schema)));
</script>

<template>
    <Head>
        <title>{{ pageTitle }}</title>
        <meta v-if="seo" head-key="description" name="description" :content="seo.description" />
        <meta v-if="seo" head-key="robots" name="robots" :content="seo.robots" />
        <link v-if="seo" head-key="canonical" rel="canonical" :href="seo.canonical" />
        <meta v-if="seo" head-key="og:title" property="og:title" :content="seo.title" />
        <meta v-if="seo" head-key="og:description" property="og:description" :content="seo.description" />
        <meta v-if="seo" head-key="og:url" property="og:url" :content="seo.canonical" />
        <meta v-if="seo" head-key="og:image" property="og:image" :content="seo.image" />
        <meta v-if="seo" head-key="twitter:title" name="twitter:title" :content="seo.title" />
        <meta v-if="seo" head-key="twitter:description" name="twitter:description" :content="seo.description" />
        <meta v-if="seo" head-key="twitter:image" name="twitter:image" :content="seo.image" />
        <script v-for="(schema, index) in seoJsonLd" :key="index" type="application/ld+json">{{ schema }}</script>
    </Head>

    <div class="min-h-screen bg-slate-950 text-white">
        <div class="pointer-events-none absolute inset-0 overflow-hidden">
            <div class="absolute -right-10 -top-32 h-96 w-96 rounded-full bg-primary-500/25 blur-[180px]"></div>
            <div class="absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-500/15 blur-[200px]"></div>
        </div>

        <header class="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-md">
            <nav class="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
                <Link class="flex items-center gap-3 text-left" href="/merge-pdf">
                    <img :src="'/icons/icon.svg'" alt="ILovePDF Studio logo" class="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-primary-900/30" />
                    <span>
                        <span class="block text-lg font-bold tracking-wide">ILovePDF Studio</span>
                        <span class="block text-xs text-white/60">Private · Instant · Document-perfect</span>
                    </span>
                </Link>

                <div class="flex items-center gap-3">
                    <InstallAppButton />
                    <Link class="quiet-button px-4 py-2" href="/merge-pdf">
                        <ArrowLeft class="h-4 w-4" />
                        Back to Studio
                    </Link>
                </div>
            </nav>
        </header>

        <main class="relative z-10 mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
            <section class="rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/10 p-8 sm:p-12">
                <div class="flex flex-col gap-6 sm:flex-row sm:items-start">
                    <div class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[24px] bg-white/10 text-primary-200 shadow-inner shadow-white/10">
                        <component :is="currentPage.icon" class="h-8 w-8" />
                    </div>
                    <div class="space-y-4">
                        <p class="text-sm uppercase tracking-[0.4em] text-white/60">ILovePDF Studio</p>
                        <h1 class="text-4xl font-semibold leading-tight sm:text-5xl">{{ currentPage.title }}</h1>
                        <p class="max-w-3xl text-lg text-white/70">{{ currentPage.subtitle }}</p>
                        <p class="text-sm text-white/50">Effective date: {{ effectiveDate }}</p>
                    </div>
                </div>
            </section>

            <section class="mt-8 space-y-4">
                <article v-for="section in currentPage.sections" :key="section.title" class="rounded-[32px] border border-white/10 bg-white/5 p-6 sm:p-8">
                    <h2 class="text-2xl font-semibold text-white">{{ section.title }}</h2>
                    <div class="mt-4 space-y-3 text-sm leading-7 text-white/70 sm:text-base">
                        <p v-for="paragraph in section.body" :key="paragraph">{{ paragraph }}</p>
                    </div>
                </article>
            </section>
        </main>

        <AppFooter />
    </div>
</template>
