<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import {
    AlertTriangle,
    Download,
    FileUp,
    RotateCcw,
    Search,
    Sparkles,
    X,
} from 'lucide-vue-next';
import { computed, onBeforeUnmount, reactive, ref, watch } from 'vue';
import AppFooter from '@/Components/AppFooter.vue';
import InstallAppButton from '@/Components/InstallAppButton.vue';
import { useDocumentTitle } from '@/composables/useDocumentTitle';
import { categories, tools, type ToolDefinition } from '@/data/tools';
import { downloadResult, processPdfTool, validateFiles, type ProcessingOptions, type ProcessResult } from '@/pdf/operations';

const props = defineProps<{
    initialTool?: string;
    pageMode?: 'home' | 'tools' | 'features' | 'tool';
    seo?: SeoMeta;
}>();

type FileItem = {
    id: string;
    file: File;
    url?: string;
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

const query = ref('');
const activeCategory = ref<string>('All');
const selectedTool = ref<ToolDefinition>(tools[0]);
const fileInput = ref<HTMLInputElement | null>(null);
const files = ref<FileItem[]>([]);
const errors = ref<string[]>([]);
const results = ref<Array<ProcessResult & { url: string }>>([]);
const isProcessing = ref(false);
const isDragging = ref(false);
let processingRun = 0;

const options = reactive<ProcessingOptions>({
    pageRange: '',
    rotation: 90,
    order: '',
    compressionMode: 'smart',
    watermarkText: 'CONFIDENTIAL',
    watermarkOpacity: 0.18,
    pageNumberPrefix: 'Page',
    imageFormat: 'png',
    title: '',
    author: '',
    subject: '',
});

const filteredTools = computed(() => {
    const normalized = query.value.trim().toLowerCase();
    return tools.filter((tool) => {
        const matchesCategory = activeCategory.value === 'All' || tool.category === activeCategory.value;
        const matchesQuery = !normalized || `${tool.name} ${tool.short} ${tool.description}`.toLowerCase().includes(normalized);
        return matchesCategory && matchesQuery;
    });
});

const filteredCategories = computed(() => {
    return categories
        .map((category) => ({
            name: category,
            icon: categoryIcon(category),
            tools: filteredTools.value.filter((tool) => tool.category === category),
        }))
        .filter((category) => category.tools.length > 0);
});

const localCount = computed(() => tools.length);
const acceptsImages = computed(() => selectedTool.value.id === 'images-to-pdf');
const isToolPage = computed(() => props.pageMode === 'tool');
const isHomePage = computed(() => props.pageMode === 'home');
const isToolsIndexPage = computed(() => props.pageMode === 'tools');
const isFeaturesPage = computed(() => props.pageMode === 'features');
const pageTitle = computed(() => {
    if (props.seo?.title) return props.seo.title;
    if (isToolPage.value) return `${selectedTool.value.name} - ILovePDF Studio`;
    if (props.pageMode === 'tools') return 'All PDF Tools - ILovePDF Studio';
    if (props.pageMode === 'features') return 'PDF Features - ILovePDF Studio';
    return 'ILovePDF Studio';
});
useDocumentTitle(pageTitle);
const seoJsonLd = computed(() => (props.seo?.jsonLd ?? []).map((schema) => JSON.stringify(schema)));

const heroHighlights = computed(() => [
    { value: localCount.value.toString(), label: 'Local PDF tools' },
    { value: '0', label: 'Uploads to server' },
    { value: '200MB', label: 'Browser-safe file limit' },
    { value: 'ZIP', label: 'Batch downloads' },
]);

watch(() => props.initialTool, (path) => {
    syncPath(path);
}, { immediate: true });

watch(selectedTool, (tool, previousTool) => {
    if (previousTool && tool.id !== previousTool.id) {
        processingRun += 1;
        isProcessing.value = false;
        clearFiles();
    }

    errors.value = [];
});

onBeforeUnmount(() => {
    processingRun += 1;
    clearFiles();
});

function syncPath(preferredPath = window.location.pathname) {
    const match = tools.find((tool) => tool.route === preferredPath);
    if (match) selectedTool.value = match;
}

function chooseTool(tool: ToolDefinition) {
    if (window.location.pathname === tool.route) {
        selectedTool.value = tool;
        return;
    }

    router.visit(tool.route, {
        method: 'get',
        preserveScroll: false,
        preserveState: false,
        onStart: () => {
            selectedTool.value = tool;
        },
        onError: () => {
            syncPath(props.initialTool);
        },
    });
}

async function addFiles(list: FileList | File[]) {
    errors.value = [];
    const incoming = Array.from(list);
    const selected = selectedTool.value.multiple ? incoming : incoming.slice(0, 1);
    const validationErrors = await validateFiles(selected, acceptsImages.value);

    if (validationErrors.length > 0) {
        errors.value = validationErrors;
        return;
    }

    const existing = new Set(files.value.map((item) => `${item.file.name}-${item.file.size}-${item.file.lastModified}`));
    const additions = selected
        .filter((file) => !existing.has(`${file.name}-${file.size}-${file.lastModified}`))
        .map((file) => ({
            id: crypto.randomUUID(),
            file,
            url: file.type.startsWith('image/') ? URL.createObjectURL(file) : undefined,
        }));

    files.value = selectedTool.value.multiple ? [...files.value, ...additions] : additions;
}

function removeFile(id: string) {
    const item = files.value.find((file) => file.id === id);
    if (item?.url) URL.revokeObjectURL(item.url);
    files.value = files.value.filter((file) => file.id !== id);
}

function clearFiles() {
    files.value.forEach((item) => {
        if (item.url) URL.revokeObjectURL(item.url);
    });
    results.value.forEach((result) => URL.revokeObjectURL(result.url));
    files.value = [];
    results.value = [];
}

async function processFiles() {
    const run = ++processingRun;
    errors.value = [];
    results.value.forEach((result) => URL.revokeObjectURL(result.url));
    results.value = [];
    isProcessing.value = true;

    try {
        const processed = await processPdfTool(
            selectedTool.value.id,
            files.value.map((item) => item.file),
            options,
        );
        if (run !== processingRun) return;

        results.value = processed.map((result) => ({
            ...result,
            url: downloadResult(result),
        }));
    } catch (error) {
        if (run !== processingRun) return;

        errors.value = [error instanceof Error ? error.message : 'Processing failed unexpectedly.'];
    } finally {
        if (run === processingRun) {
            isProcessing.value = false;
        }
    }
}

function formatBytes(bytes: number) {
    if (bytes === 0) return '0 B';
    const unit = Math.floor(Math.log(bytes) / Math.log(1024));
    const units = ['B', 'KB', 'MB', 'GB'];
    return `${(bytes / 1024 ** unit).toFixed(unit === 0 ? 0 : 1)} ${units[unit]}`;
}

function onDrop(event: DragEvent) {
    isDragging.value = false;
    if (event.dataTransfer?.files) void addFiles(event.dataTransfer.files);
}

function categoryIcon(category: string) {
    const icons: Record<string, string> = {
        Organize: '🗂️',
        Convert: '🔁',
        Edit: '✍️',
    };
    return icons[category] ?? '📄';
}
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
            <div class="absolute -right-10 -top-32 h-96 w-96 rounded-full bg-primary-500/30 blur-[180px]"></div>
            <div class="absolute -left-24 top-1/3 h-[28rem] w-[28rem] rounded-full bg-blue-500/20 blur-[200px]"></div>
        </div>

        <header class="sticky top-0 z-40 border-b border-white/10 bg-slate-950/75 backdrop-blur-md">
            <nav class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div class="flex h-20 items-center justify-between">
                    <Link class="flex items-center gap-3 text-left" href="/">
                        <img :src="'/icons/icon.svg'" alt="ILovePDF Studio logo" class="h-11 w-11 rounded-2xl object-cover shadow-lg shadow-primary-900/30" />
                        <span>
                            <span class="block text-lg font-bold tracking-wide">ILovePDF Studio</span>
                            <span class="block text-xs text-white/60">Private · Instant · Document-perfect</span>
                        </span>
                    </Link>

                    <div v-if="!isToolPage" class="hidden items-center gap-1 md:flex">
                        <Link href="/#tools" class="nav-link">Tools</Link>
                        <Link href="/#features" class="nav-link">Features</Link>
                    </div>
                    <div v-else class="hidden items-center gap-1 md:flex">
                        <Link href="/#tools" class="nav-link">All Tools</Link>
                        <Link href="/privacy" class="nav-link">Privacy</Link>
                        <Link href="/terms" class="nav-link">Terms</Link>
                    </div>

                    <div class="flex items-center gap-3">
                        <InstallAppButton />
                        <button class="inline-flex items-center gap-2 rounded-2xl bg-white px-4 py-2 text-sm font-semibold text-slate-900 shadow-lg shadow-white/20 transition hover:-translate-y-0.5" type="button" @click="chooseTool(tools[0])">
                            {{ isToolPage ? 'Start Over' : 'Start with Merge PDF' }}
                            <span aria-hidden="true">→</span>
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <main v-if="!isToolPage" class="relative z-10 mx-auto max-w-7xl space-y-16 px-4 py-12 sm:px-6 lg:px-8">
            <section v-if="isHomePage" class="relative overflow-hidden rounded-[40px] border border-white/10 bg-gradient-to-br from-white/5 via-transparent to-white/10 p-8 sm:p-12">
                <div class="pointer-events-none absolute inset-0">
                    <div class="absolute -top-16 left-10 h-64 w-64 rounded-full bg-primary-500/20 blur-[120px]"></div>
                    <div class="absolute bottom-0 right-0 h-96 w-96 rounded-full bg-blue-500/20 blur-[160px]"></div>
                </div>
                <div class="relative z-10 grid gap-10 lg:grid-cols-2">
                    <div class="space-y-6">
                        <span class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.4em] text-white/70">
                            Trusted toolkit · Browser native
                        </span>
                        <h1 class="text-4xl font-semibold leading-tight sm:text-5xl">
                            All-in-one PDF studio for instant, private workflows.
                        </h1>
                        <p class="max-w-2xl text-lg text-white/70">
                            Merge, split, rotate, watermark, number, organize, convert images, and render PDF pages directly in your browser with the same workspace experience across every tool.
                        </p>
                        <div class="flex flex-wrap gap-4">
                            <button class="brand-button" type="button" @click="chooseTool(tools[0])">
                                Start with Merge PDF
                            </button>
                            <Link href="/#tools" class="quiet-button">Browse All Tools</Link>
                        </div>
                        <div class="flex flex-wrap gap-5 text-sm text-white/60">
                            <div>
                                <p class="text-2xl font-semibold text-white">0</p>
                                <p>Uploads to server</p>
                            </div>
                            <div>
                                <p class="text-2xl font-semibold text-white">{{ localCount }}</p>
                                <p>Local PDF utilities</p>
                            </div>
                            <div>
                                <p class="text-2xl font-semibold text-white">∞</p>
                                <p>Batch downloads</p>
                            </div>
                        </div>
                    </div>

                    <div class="grid gap-4 sm:grid-cols-2">
                        <div v-for="stat in heroHighlights" :key="stat.label" class="rounded-3xl border border-white/10 bg-white/5 p-6">
                            <p class="text-3xl font-semibold text-white">{{ stat.value }}</p>
                            <p class="text-sm text-white/60">{{ stat.label }}</p>
                        </div>
                    </div>
                </div>

                <div class="relative z-10 mt-10 grid gap-6 md:grid-cols-2">
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                        <p class="font-semibold text-white/80">Zero learning curve</p>
                        <p class="mt-1">Choose a tool, open its page, process, and download.</p>
                    </div>
                    <div class="rounded-3xl border border-white/10 bg-white/5 p-5 text-sm text-white/70">
                        <p class="font-semibold text-white/80">Private by default</p>
                        <p class="mt-1">Current PDF workflows run in browser memory without document uploads.</p>
                    </div>
                </div>
            </section>

            <section v-if="isHomePage || isToolsIndexPage" id="tools" class="space-y-10">
                <div class="flex flex-col gap-2">
                    <p class="text-sm uppercase tracking-[0.4em] text-white/60">Toolset</p>
                    <h2 class="text-3xl font-semibold text-white">Every document workflow.</h2>
                    <p class="text-white/60">{{ filteredTools.length }} tools shown · {{ localCount }} run locally today</p>
                </div>

                <label class="relative flex items-center gap-3 rounded-3xl border border-white/10 bg-white/5 px-5">
                    <Search class="h-5 w-5 text-white/60" />
                    <input v-model="query" type="search" placeholder="Search tools, e.g. merge, rotate, watermark" class="w-full bg-transparent py-4 text-white placeholder-white/50 focus:outline-none" />
                    <button v-if="query" class="text-xs text-white/60" type="button" @click="query = ''">Clear</button>
                </label>

                <div class="flex gap-2 overflow-x-auto pb-2">
                    <button
                        v-for="category in ['All', ...categories]"
                        :key="category"
                        class="rounded-full border px-4 py-2 text-sm font-semibold transition"
                        :class="activeCategory === category ? 'border-primary-400/60 bg-primary-500/20 text-primary-100' : 'border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white'"
                        type="button"
                        :aria-pressed="activeCategory === category"
                        @click="activeCategory = category"
                    >
                        {{ category }}
                    </button>
                </div>

                <div v-if="filteredCategories.length" class="space-y-10">
                    <div v-for="category in filteredCategories" :key="category.name" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <span class="text-4xl">{{ category.icon }}</span>
                            <div>
                                <h3 class="text-2xl font-semibold text-white">{{ category.name }}</h3>
                                <p class="text-sm text-white/60">{{ category.tools.length }} specialized actions</p>
                            </div>
                        </div>
                        <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <button
                                v-for="tool in category.tools"
                                :key="tool.id"
                                class="tool-card group text-left"
                                :class="isToolPage && selectedTool.id === tool.id ? 'border-primary-400/70 bg-primary-500/15 ring-2 ring-primary-500/20' : ''"
                                type="button"
                                :aria-current="isToolPage && selectedTool.id === tool.id ? 'page' : undefined"
                                @click="chooseTool(tool)"
                            >
                                <div class="flex items-center justify-between">
                                    <p class="font-semibold text-white">{{ tool.name }}</p>
                                    <span class="text-white/50 transition group-hover:text-white">→</span>
                                </div>
                                <p class="mt-3 text-xs text-white/50">Instant · Local</p>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="text-center text-white/70">No tools match “{{ query }}”. Try another PDF workflow.</div>
            </section>

            <section v-if="isHomePage || isFeaturesPage" id="features" class="space-y-6">
                <div class="flex flex-col gap-3">
                    <p class="text-sm uppercase tracking-[0.4em] text-white/60">Why ILovePDF</p>
                    <h2 class="text-3xl font-semibold text-white">Privacy-first by design</h2>
                    <p class="text-white/60">Browser-local processing for every workflow shown in the studio.</p>
                </div>
                <div class="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
                    <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">🔒</div>
                        <div>
                            <p class="text-lg font-semibold text-white">No hidden uploads</p>
                            <p class="text-sm text-white/60">Implemented tools use browser files and temporary object URLs.</p>
                        </div>
                    </div>
                    <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">📄</div>
                        <div>
                            <p class="text-lg font-semibold text-white">PDF-native engine</p>
                            <p class="text-sm text-white/60">pdf-lib and PDF.js power local organization, editing, and rendering.</p>
                        </div>
                    </div>
                    <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">⚡</div>
                        <div>
                            <p class="text-lg font-semibold text-white">Fast shared flow</p>
                            <p class="text-sm text-white/60">Every tool page keeps the same queue, options, and download rhythm.</p>
                        </div>
                    </div>
                    <div class="space-y-4 rounded-3xl border border-white/10 bg-white/5 p-6">
                        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-2xl">✅</div>
                        <div>
                            <p class="text-lg font-semibold text-white">Focused scope</p>
                            <p class="text-sm text-white/60">Only wired PDF workflows appear in the toolset.</p>
                        </div>
                    </div>
                </div>
            </section>

        </main>

        <main v-else class="relative z-10 mx-auto max-w-7xl space-y-10 px-4 py-12 sm:px-6 lg:px-8">
            <section class="grid gap-4 rounded-[32px] border border-white/10 bg-white/5 p-5 md:grid-cols-[1fr_auto] md:items-center">
                <div class="min-w-0">
                    <p class="text-xs uppercase tracking-[0.4em] text-white/50">Tool page</p>
                    <h2 class="mt-2 truncate text-2xl font-semibold text-white">{{ selectedTool.name }}</h2>
                    <p class="mt-1 text-sm text-white/60">Upload files, set options, and download the finished output.</p>
                </div>
                <Link href="/#tools" class="quiet-button justify-center">Browse All Tools</Link>
            </section>

            <section id="tool" class="space-y-10">
                <section class="relative overflow-hidden rounded-[36px] border border-white/10 bg-gradient-to-br from-white/5 via-white/0 to-white/5 p-8 sm:p-10">
                    <div class="pointer-events-none absolute inset-0">
                        <div class="absolute -top-8 right-0 h-64 w-64 rounded-full bg-primary-500/30 blur-[140px]"></div>
                    </div>
                    <div class="relative z-10 grid gap-8 lg:grid-cols-[2fr_1fr]">
                        <div class="space-y-4">
                            <p class="text-sm uppercase tracking-[0.4em] text-white/60">Processing Suite</p>
                            <h1 class="text-4xl font-semibold leading-tight">{{ selectedTool.name }}</h1>
                            <p class="max-w-2xl text-lg text-white/70">{{ selectedTool.description }}</p>
                            <div class="flex flex-wrap gap-3">
                                <span class="glass-chip">{{ selectedTool.category }}</span>
                                <span class="glass-chip">Local processing</span>
                                <span class="glass-chip">200MB max</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-4">
                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p class="mb-1 text-xs text-white/50">Queued</p>
                                <p class="text-2xl font-semibold">{{ files.length }}</p>
                                <p class="text-sm text-white/60">Files</p>
                            </div>
                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p class="mb-1 text-xs text-white/50">Processed</p>
                                <p class="text-2xl font-semibold">{{ results.length }}</p>
                                <p class="text-sm text-white/60">Downloads ready</p>
                            </div>
                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p class="mb-1 text-xs text-white/50">Status</p>
                                <p class="text-2xl font-semibold">{{ isProcessing ? 'Busy' : 'Ready' }}</p>
                                <p class="text-sm text-white/60">Live state</p>
                            </div>
                            <div class="rounded-2xl border border-white/10 bg-white/5 p-4">
                                <p class="mb-1 text-xs text-white/50">Privacy</p>
                                <p class="text-2xl font-semibold">Local</p>
                                <p class="text-sm text-white/60">Never uploaded</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <section class="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
                        <div class="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p class="text-sm uppercase tracking-[0.4em] text-white/50">Step 1</p>
                                <h2 class="text-2xl font-semibold text-white">Upload workspace</h2>
                            </div>
                            <span class="rounded-full bg-white/10 px-4 py-1 text-xs uppercase tracking-widest text-white/70">Drop · Browse</span>
                        </div>

                        <div
                            class="relative overflow-hidden rounded-[32px] border border-white/10 bg-white/5 p-10 text-center transition-all duration-200"
                            :class="isDragging ? 'scale-[1.01] ring-2 ring-primary-400 ring-offset-2 ring-offset-white/10' : ''"
                            @dragover.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false"
                            @drop.prevent="onDrop"
                        >
                            <div class="pointer-events-none absolute inset-0">
                                <div class="absolute inset-0 bg-gradient-to-br from-white/10 via-transparent to-white/5"></div>
                                <div class="absolute -bottom-10 -right-6 h-48 w-48 rounded-full bg-primary-500/20 blur-3xl"></div>
                            </div>

                            <div class="relative z-10 space-y-6">
                                <div class="mx-auto flex h-20 w-20 items-center justify-center rounded-[22px] bg-white/10 shadow-inner shadow-white/20">
                                    <FileUp class="h-10 w-10 text-white/80" />
                                </div>
                                <div class="space-y-2">
                                    <p class="text-2xl font-semibold tracking-tight text-white">Drop your {{ selectedTool.name }} files here</p>
                                    <p class="text-sm text-white/60">Supports drag and drop or browsing from your device.</p>
                                </div>
                                <div class="flex flex-wrap justify-center gap-3 text-xs uppercase tracking-widest text-white/60">
                                    <span class="rounded-full bg-white/10 px-3 py-1">{{ selectedTool.multiple ? 'Batch enabled' : 'Single PDF' }}</span>
                                    <span class="rounded-full bg-white/10 px-3 py-1">No upload</span>
                                    <span class="rounded-full bg-white/10 px-3 py-1">{{ selectedTool.accepts.split(',')[0] }}</span>
                                </div>
                                <div class="flex flex-wrap items-center justify-center gap-4">
                                    <button class="brand-button" type="button" @click="fileInput?.click()">Select Files</button>
                                    <button class="quiet-button" type="button" @click="files.length ? clearFiles() : fileInput?.click()">
                                        {{ files.length ? 'Clear Selection' : 'Browse Files' }}
                                    </button>
                                </div>
                                <input ref="fileInput" class="hidden" type="file" :accept="selectedTool.accepts" :multiple="selectedTool.multiple" @change="event => addFiles((event.target as HTMLInputElement).files ?? [])" />
                            </div>
                        </div>

                        <div v-if="errors.length" class="space-y-2">
                            <div v-for="error in errors" :key="error" class="flex gap-2 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                                <AlertTriangle class="h-4 w-4 shrink-0" />
                                <span>{{ error }}</span>
                            </div>
                        </div>

                        <div v-if="files.length" class="space-y-4">
                            <div class="flex items-center justify-between text-sm text-white/60">
                                <p>{{ files.length }} file{{ files.length === 1 ? '' : 's' }} queued</p>
                                <button class="text-primary-200 hover:text-primary-100" type="button" @click="clearFiles">Reset</button>
                            </div>
                            <div class="max-h-[280px] space-y-3 overflow-y-auto pr-2">
                                <div v-for="item in files" :key="item.id" class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4">
                                    <div class="flex min-w-0 items-center gap-4">
                                        <img v-if="item.url" :src="item.url" alt="" class="h-12 w-12 rounded-2xl object-cover" />
                                        <div v-else class="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-primary-500/60 to-orange-400/60 text-xs font-semibold">
                                            PDF
                                        </div>
                                        <div class="min-w-0">
                                            <p class="truncate font-medium text-white">{{ item.file.name }}</p>
                                            <p class="text-xs text-white/60">{{ formatBytes(item.file.size) }}</p>
                                        </div>
                                    </div>
                                    <button class="text-white/50 hover:text-white" type="button" @click="removeFile(item.id)">
                                        <X class="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside class="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
                        <div class="space-y-2">
                            <p class="text-sm uppercase tracking-[0.4em] text-white/50">Step 2</p>
                            <h3 class="text-xl font-semibold text-white">Run pipeline</h3>
                            <p class="text-sm text-white/60">PDF operations run in browser memory using local libraries.</p>
                        </div>

                        <div class="space-y-3">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-white/70">Overall progress</span>
                                <span class="font-semibold text-white">{{ isProcessing ? 'Working' : 'Ready' }}</span>
                            </div>
                            <div class="h-2 overflow-hidden rounded-full bg-white/10">
                                <div class="h-full rounded-full bg-gradient-to-r from-primary-500 to-orange-400 transition-all duration-300" :style="{ width: isProcessing ? '66%' : results.length ? '100%' : '0%' }"></div>
                            </div>
                            <p class="text-xs text-white/50">{{ results.length ? 'Downloads ready.' : 'Add files, set options, then process.' }}</p>
                        </div>

                        <div class="space-y-4">
                            <div v-if="selectedTool.options.includes('pageRange')">
                                <label class="text-sm font-semibold text-white/80">Page range</label>
                                <input v-model="options.pageRange" class="field mt-2" type="text" placeholder="All, or 1,3-5,last" />
                            </div>
                            <div v-if="selectedTool.options.includes('order')">
                                <label class="text-sm font-semibold text-white/80">New page order</label>
                                <input v-model="options.order" class="field mt-2" type="text" placeholder="3,1,2,4" />
                            </div>
                            <div v-if="selectedTool.options.includes('rotation')">
                                <label class="text-sm font-semibold text-white/80">Rotation</label>
                                <select v-model.number="options.rotation" class="field mt-2">
                                    <option :value="90">90 degrees</option>
                                    <option :value="180">180 degrees</option>
                                    <option :value="270">270 degrees</option>
                                </select>
                            </div>
                            <div v-if="selectedTool.options.includes('compression')" class="space-y-3">
                                <label class="text-sm font-semibold text-white/80">Compression level</label>
                                <select v-model="options.compressionMode" class="field">
                                    <option value="smart">Smart - best safe result</option>
                                    <option value="lossless">Lossless - keep exact visuals</option>
                                    <option value="balanced">Balanced - qpdf image cleanup</option>
                                    <option value="strong">Strong - flatten only when smaller</option>
                                    <option value="maximum">Maximum - smallest accepted output</option>
                                </select>
                                <p class="text-xs leading-5 text-white/50">
                                    The browser-served qpdf engine runs first. Aggressive modes only flatten pages when the result is actually smaller.
                                </p>
                            </div>
                            <div v-if="selectedTool.options.includes('watermark')" class="space-y-3">
                                <label class="text-sm font-semibold text-white/80">Watermark text</label>
                                <input v-model="options.watermarkText" class="field" type="text" />
                                <label class="text-sm font-semibold text-white/80">Opacity</label>
                                <input v-model.number="options.watermarkOpacity" class="w-full accent-primary-500" type="range" min="0.05" max="0.5" step="0.01" />
                            </div>
                            <div v-if="selectedTool.options.includes('pageNumbers')">
                                <label class="text-sm font-semibold text-white/80">Label prefix</label>
                                <input v-model="options.pageNumberPrefix" class="field mt-2" type="text" />
                            </div>
                            <div v-if="selectedTool.options.includes('imageOutput')">
                                <label class="text-sm font-semibold text-white/80">Image format</label>
                                <select v-model="options.imageFormat" class="field mt-2">
                                    <option value="png">PNG</option>
                                    <option value="jpeg">JPG</option>
                                </select>
                            </div>
                            <div v-if="selectedTool.options.includes('metadata')" class="space-y-3">
                                <input v-model="options.title" class="field" type="text" placeholder="Title" />
                                <input v-model="options.author" class="field" type="text" placeholder="Author" />
                                <input v-model="options.subject" class="field" type="text" placeholder="Subject" />
                            </div>
                        </div>

                        <button class="brand-button w-full justify-center disabled:cursor-not-allowed disabled:opacity-50" type="button" :disabled="isProcessing || files.length === 0" @click="processFiles">
                            <Sparkles v-if="!isProcessing" class="h-4 w-4" />
                            <RotateCcw v-else class="h-4 w-4 animate-spin" />
                            {{ isProcessing ? 'Hold tight…' : `Process ${selectedTool.name}` }}
                        </button>

                        <div class="space-y-2 text-sm text-white/60">
                            <p class="font-semibold text-white/80">Smart defaults</p>
                            <ul class="space-y-1 text-xs">
                                <li>• Page range accepts 1, 3-5, and last</li>
                                <li>• Local batch packaging for multi-output tools</li>
                                <li>• Tool options stay matched to the selected workflow</li>
                            </ul>
                        </div>
                    </aside>
                </div>

                <section v-if="results.length" class="space-y-6 rounded-[32px] border border-white/10 bg-white/5 p-8">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="text-sm uppercase tracking-[0.4em] text-white/50">Step 3</p>
                            <h2 class="text-2xl font-semibold text-white">Processed Assets</h2>
                            <p class="text-sm text-white/60">Ready to download instantly from your browser memory.</p>
                        </div>
                        <button class="quiet-button" type="button" @click="clearFiles">Start New Batch</button>
                    </div>
                    <div class="grid gap-4 md:grid-cols-2">
                        <a v-for="result in results" :key="result.name" class="flex items-center justify-between gap-4 rounded-2xl border border-white/10 bg-white/5 p-4" :href="result.url" :download="result.name">
                            <span class="min-w-0 space-y-1">
                                <span class="block truncate font-medium text-white">{{ result.name }}</span>
                                <span class="block text-xs text-white/60">{{ result.summary }}</span>
                            </span>
                            <span class="quiet-button px-4 py-2 text-sm">
                                <Download class="h-4 w-4" />
                                Download
                            </span>
                        </a>
                    </div>
                </section>
            </section>
        </main>

        <AppFooter />
    </div>
</template>
