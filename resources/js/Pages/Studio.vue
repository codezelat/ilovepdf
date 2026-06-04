<script setup lang="ts">
import { Head, Link, router } from '@inertiajs/vue3';
import {
    AlertTriangle,
    ArrowRight,
    Download,
    FilePlus,
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
    { value: localCount.value.toString(), label: 'PDF tools run locally' },
    { value: '0', label: 'Files uploaded to server' },
    { value: '200MB', label: 'Browser-safe per file' },
    { value: 'ZIP', label: 'Batch export included' },
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

    <div class="min-h-screen bg-paper-50 text-ink-900">
        <header class="sticky top-0 z-40 border-b border-paper-300 bg-white/80 backdrop-blur-sm">
            <nav class="page-container">
                <div class="flex h-16 items-center justify-between">
                    <Link class="flex items-center gap-3 text-left" href="/">
                        <img :src="'/icons/icon.svg'" alt="ILovePDF Studio logo" class="h-9 w-9 rounded-lg object-cover" />
                        <span>
                            <span class="block text-base font-semibold tracking-tight text-ink-900">ILovePDF Studio</span>
                            <span class="block text-xs text-ink-500">Private &middot; Instant &middot; Document-perfect</span>
                        </span>
                    </Link>

                    <div v-if="!isToolPage" class="hidden items-center gap-1 md:flex">
                        <Link href="/#tools" class="nav-link">Tools</Link>
                        <Link href="/#features" class="nav-link">Features</Link>
                        <Link href="/privacy" class="nav-link">Privacy</Link>
                    </div>
                    <div v-else class="hidden items-center gap-1 md:flex">
                        <Link href="/#tools" class="nav-link">All Tools</Link>
                        <Link href="/privacy" class="nav-link">Privacy</Link>
                        <Link href="/terms" class="nav-link">Terms</Link>
                    </div>

                    <div class="flex items-center gap-3">
                        <InstallAppButton />
                        <button class="brand-button" type="button" @click="chooseTool(tools[0])">
                            {{ isToolPage ? 'Start Over' : selectedTool.name }}
                            <ArrowRight class="h-4 w-4" aria-hidden="true" />
                        </button>
                    </div>
                </div>
            </nav>
        </header>

        <main v-if="!isToolPage" class="page-container space-y-20 py-12">
            <section v-if="isHomePage" class="grid gap-12 lg:grid-cols-5">
                <div class="space-y-8 lg:col-span-3">
                    <span class="inline-flex items-center gap-2 rounded-full border border-paper-400 bg-white px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-stamp-500">
                        PDF Tools &middot; Browser Native
                    </span>
                    <h1 class="text-4xl font-bold leading-tight tracking-tight text-ink-900 sm:text-5xl sm:leading-tight">
                        All-in-one PDF studio for instant, private workflows.
                    </h1>
                    <p class="max-w-2xl text-lg leading-relaxed text-ink-500">
                        Merge, split, rotate, watermark, number, organize, convert images, and render PDF pages directly in your browser with the same workspace experience across every tool.
                    </p>
                    <div class="flex flex-wrap gap-3">
                        <button class="brand-button" type="button" @click="chooseTool(tools[0])">
                            Start with Compress PDF
                        </button>
                        <Link href="/#tools" class="quiet-button">Browse All Tools</Link>
                    </div>
                </div>

                <div class="lg:col-span-2">
                    <div class="grid grid-cols-2 gap-3">
                        <div v-for="stat in heroHighlights" :key="stat.label" class="rounded-xl border border-paper-400 bg-white p-5">
                            <p class="text-2xl font-bold text-stamp-500">{{ stat.value }}</p>
                            <p class="mt-1 text-xs leading-tight text-ink-500">{{ stat.label }}</p>
                        </div>
                    </div>
                </div>

                <div class="col-span-full grid gap-4 md:grid-cols-3">
                    <div class="rounded-xl border border-paper-400 bg-white p-5">
                        <p class="font-semibold text-ink-900">Zero learning curve</p>
                        <p class="mt-1 text-sm text-ink-500">Choose a tool, open its page, process, and download.</p>
                    </div>
                    <div class="rounded-xl border border-paper-400 bg-white p-5">
                        <p class="font-semibold text-ink-900">Private by default</p>
                        <p class="mt-1 text-sm text-ink-500">PDF workflows run in browser memory without document uploads.</p>
                    </div>
                    <div class="rounded-xl border border-paper-400 bg-white p-5">
                        <p class="font-semibold text-ink-900">200MB per file</p>
                        <p class="mt-1 text-sm text-ink-500">Large enough for real documents, safe for browser processing.</p>
                    </div>
                </div>
            </section>

            <section v-if="isHomePage || isToolsIndexPage" id="tools" class="space-y-8">
                <div class="flex flex-col gap-2">
                    <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Toolset</p>
                    <h2 class="text-3xl font-bold tracking-tight text-ink-900">Every document workflow.</h2>
                    <p class="text-ink-500">{{ filteredTools.length }} tools shown &middot; {{ localCount }} run locally</p>
                </div>

                <label class="relative flex items-center gap-3 rounded-xl border border-paper-400 bg-white px-4">
                    <Search class="h-5 w-5 text-ink-400" />
                    <input v-model="query" type="search" placeholder="Search tools, e.g. merge, rotate, watermark" class="w-full bg-transparent py-3 text-ink-900 placeholder-ink-400 focus:outline-none" />
                    <button v-if="query" class="text-xs font-medium text-stamp-500" type="button" @click="query = ''">Clear</button>
                </label>

                <div class="flex gap-2 overflow-x-auto pb-2">
                    <button
                        v-for="category in ['All', ...categories]"
                        :key="category"
                        class="rounded-lg border px-4 py-2 text-sm font-semibold transition"
                        :class="activeCategory === category ? 'border-stamp-300 bg-stamp-50 text-stamp-600' : 'border-paper-400 bg-white text-ink-600 hover:border-paper-500'"
                        type="button"
                        :aria-pressed="activeCategory === category"
                        @click="activeCategory = category"
                    >
                        {{ category }}
                    </button>
                </div>

                <div v-if="filteredCategories.length" class="space-y-12">
                    <div v-for="category in filteredCategories" :key="category.name" class="space-y-4">
                        <div class="flex items-center gap-3">
                            <span class="text-3xl">{{ category.icon }}</span>
                            <div>
                                <h3 class="text-xl font-semibold text-ink-900">{{ category.name }}</h3>
                                <p class="text-sm text-ink-500">{{ category.tools.length }} specialized actions</p>
                            </div>
                        </div>
                        <div class="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                            <button
                                v-for="tool in category.tools"
                                :key="tool.id"
                                class="tool-card group text-left"
                                :class="isToolPage && selectedTool.id === tool.id ? 'border-stamp-300 ring-2 ring-stamp-500/15' : ''"
                                type="button"
                                :aria-current="isToolPage && selectedTool.id === tool.id ? 'page' : undefined"
                                @click="chooseTool(tool)"
                            >
                                <div class="flex items-center justify-between">
                                    <p class="font-semibold text-ink-900">{{ tool.name }}</p>
                                    <ArrowRight class="h-4 w-4 text-ink-400 transition group-hover:text-stamp-500 group-hover:translate-x-0.5" aria-hidden="true" />
                                </div>
                                <p class="mt-2 text-xs text-ink-500">{{ tool.short }}</p>
                            </button>
                        </div>
                    </div>
                </div>
                <div v-else class="py-12 text-center text-ink-500">No tools match &ldquo;{{ query }}&rdquo;. Try another PDF workflow.</div>
            </section>

            <section v-if="isHomePage || isFeaturesPage" id="features" class="space-y-6">
                <div class="flex flex-col gap-3">
                    <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Why ILovePDF</p>
                    <h2 class="text-3xl font-bold tracking-tight text-ink-900">Privacy-first by design</h2>
                    <p class="text-ink-500">Browser-local processing for every workflow shown in the studio.</p>
                </div>
                <div class="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <div class="rounded-xl border border-paper-400 bg-white p-6">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-stamp-50 text-xl">🔒</div>
                        <p class="mt-4 text-lg font-semibold text-ink-900">No hidden uploads</p>
                        <p class="mt-1 text-sm text-ink-500">Implemented tools use browser files and temporary object URLs.</p>
                    </div>
                    <div class="rounded-xl border border-paper-400 bg-white p-6">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-stamp-50 text-xl">📄</div>
                        <p class="mt-4 text-lg font-semibold text-ink-900">PDF-native engine</p>
                        <p class="mt-1 text-sm text-ink-500">pdf-lib and PDF.js power local organization, editing, and rendering.</p>
                    </div>
                    <div class="rounded-xl border border-paper-400 bg-white p-6">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-stamp-50 text-xl">⚡</div>
                        <p class="mt-4 text-lg font-semibold text-ink-900">Fast shared flow</p>
                        <p class="mt-1 text-sm text-ink-500">Every tool page keeps the same queue, options, and download rhythm.</p>
                    </div>
                    <div class="rounded-xl border border-paper-400 bg-white p-6">
                        <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-stamp-50 text-xl">✅</div>
                        <p class="mt-4 text-lg font-semibold text-ink-900">Focused scope</p>
                        <p class="mt-1 text-sm text-ink-500">Only wired PDF workflows appear in the toolset.</p>
                    </div>
                </div>
            </section>
        </main>

        <main v-else id="main-content" class="page-container space-y-8 py-12">
            <section class="rounded-xl border border-paper-400 bg-white p-5 md:flex md:items-center md:justify-between md:gap-6">
                <div class="min-w-0">
                    <p class="text-xs font-semibold uppercase tracking-[0.4em] text-stamp-500">Tool page</p>
                    <h2 class="mt-1 text-2xl font-bold text-ink-900">{{ selectedTool.name }}</h2>
                    <p class="mt-1 text-sm text-ink-500">{{ selectedTool.short }}</p>
                </div>
                <Link href="/#tools" class="quiet-button mt-4 md:mt-0">Browse All Tools</Link>
            </section>

            <section id="tool" class="space-y-8">
                <section class="rounded-xl border border-paper-400 bg-white p-8">
                    <div class="grid gap-8 lg:grid-cols-[2fr_1fr]">
                        <div class="space-y-4">
                            <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Processing Suite</p>
                            <h1 class="text-3xl font-bold leading-tight text-ink-900">{{ selectedTool.name }}</h1>
                            <p class="max-w-2xl text-lg leading-relaxed text-ink-500">{{ selectedTool.description }}</p>
                            <div class="flex flex-wrap gap-2">
                                <span class="glass-chip">{{ selectedTool.category }}</span>
                                <span class="glass-chip">Local processing</span>
                                <span class="glass-chip">200MB max</span>
                            </div>
                        </div>
                        <div class="grid grid-cols-2 gap-3">
                            <div class="rounded-lg border border-paper-300 bg-paper-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-ink-400">Queued</p>
                                <p class="mt-1 text-2xl font-bold text-ink-900">{{ files.length }}</p>
                                <p class="text-xs text-ink-500">Files</p>
                            </div>
                            <div class="rounded-lg border border-paper-300 bg-paper-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-ink-400">Processed</p>
                                <p class="mt-1 text-2xl font-bold text-ink-900">{{ results.length }}</p>
                                <p class="text-xs text-ink-500">Ready</p>
                            </div>
                            <div class="rounded-lg border border-paper-300 bg-paper-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-ink-500">Status</p>
                                <p class="mt-1 text-2xl font-bold" :class="isProcessing ? 'text-stamp-500' : 'text-ink-900'">{{ isProcessing ? 'Busy' : 'Ready' }}</p>
                                <p class="text-xs text-ink-500">Live</p>
                            </div>
                            <div class="rounded-lg border border-paper-300 bg-paper-50 p-4">
                                <p class="text-xs font-semibold uppercase tracking-wider text-ink-400">Privacy</p>
                                <p class="mt-1 text-2xl font-bold text-ink-900">Local</p>
                                <p class="text-xs text-ink-500">Never uploaded</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div class="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(320px,1fr)]">
                    <section class="rounded-xl border border-paper-400 bg-white p-8">
                        <div class="flex flex-wrap items-center justify-between gap-4">
                            <div>
                                <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Step 1</p>
                                <h2 class="text-xl font-bold text-ink-900">Upload workspace</h2>
                            </div>
                            <span class="glass-chip">Drop &middot; Browse</span>
                        </div>

                        <div
                            class="relative mt-6 overflow-hidden rounded-xl border-2 border-dashed p-12 text-center transition-all duration-200"
                            :class="isDragging ? 'scale-[1.01] border-stamp-400 bg-stamp-50/50' : 'border-paper-400 bg-paper-50'"
                            role="region"
                            aria-label="File upload area"
                            @dragover.prevent="isDragging = true"
                            @dragleave.prevent="isDragging = false"
                            @drop.prevent="onDrop"
                        >
                            <div class="space-y-5">
                                <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-xl bg-stamp-50">
                                    <FileUp class="h-8 w-8 text-stamp-400" aria-hidden="true" />
                                </div>
                                <div>
                                    <p class="text-lg font-semibold text-ink-900">Drop your {{ selectedTool.name }} files here</p>
                                    <p class="mt-1 text-sm text-ink-500">Supports drag and drop or browsing from your device.</p>
                                </div>
                                <div class="flex flex-wrap justify-center gap-2 text-xs font-semibold uppercase tracking-widest text-ink-400">
                                    <span class="glass-chip">{{ selectedTool.multiple ? 'Batch enabled' : 'Single PDF' }}</span>
                                    <span class="glass-chip">No upload</span>
                                    <span class="glass-chip">{{ selectedTool.accepts.split(',')[0] }}</span>
                                </div>
                                <div class="flex flex-wrap items-center justify-center gap-3">
                                    <button class="brand-button" type="button" @click="fileInput?.click()">
                                        <FilePlus class="h-4 w-4" />
                                        Select Files
                                    </button>
                                    <button class="quiet-button" type="button" @click="files.length ? clearFiles() : fileInput?.click()">
                                        {{ files.length ? 'Clear Selection' : 'Browse Files' }}
                                    </button>
                                </div>
                                <input ref="fileInput" class="hidden" type="file" :accept="selectedTool.accepts" :multiple="selectedTool.multiple" @change="event => addFiles((event.target as HTMLInputElement).files ?? [])" />
                            </div>
                        </div>

                        <div v-if="errors.length" class="mt-4 space-y-2">
                            <div v-for="error in errors" :key="error" class="flex gap-2 rounded-lg border border-stamp-200 bg-stamp-50 p-4 text-sm text-stamp-600" role="alert">
                                <AlertTriangle class="mt-0.5 h-4 w-4 shrink-0" />
                                <span>{{ error }}</span>
                            </div>
                        </div>

                        <div v-if="files.length" class="mt-6 space-y-4">
                            <div class="flex items-center justify-between text-sm text-ink-500">
                                <p class="font-medium">{{ files.length }} file{{ files.length === 1 ? '' : 's' }} queued</p>
                                <button class="text-stamp-500 hover:text-stamp-600" type="button" @click="clearFiles">Reset</button>
                            </div>
                            <div class="max-h-[280px] space-y-2 overflow-y-auto pr-1">
                                <div v-for="item in files" :key="item.id" class="flex items-center justify-between gap-4 rounded-lg border border-paper-300 bg-paper-50 p-3">
                                    <div class="flex min-w-0 items-center gap-3">
                                        <img v-if="item.url" :src="item.url" alt="" class="h-10 w-10 rounded-lg object-cover" />
                                        <div v-else class="flex h-10 w-10 items-center justify-center rounded-lg bg-stamp-50 text-xs font-bold text-stamp-500">
                                            PDF
                                        </div>
                                        <div class="min-w-0">
                                            <p class="truncate text-sm font-medium text-ink-900">{{ item.file.name }}</p>
                                            <p class="text-xs text-ink-500">{{ formatBytes(item.file.size) }}</p>
                                        </div>
                                    </div>
                                    <button class="text-ink-400 hover:text-stamp-500" type="button" @click="removeFile(item.id)">
                                        <X class="h-4 w-4" aria-hidden="true" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    </section>

                    <aside class="rounded-xl border border-paper-400 bg-white p-8">
                        <div class="space-y-2">
                            <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Step 2</p>
                            <h3 class="text-xl font-bold text-ink-900">Run pipeline</h3>
                            <p class="text-sm text-ink-500">PDF operations run in browser memory using local libraries.</p>
                        </div>

                        <div class="mt-6 space-y-3">
                            <div class="flex items-center justify-between text-sm">
                                <span class="text-ink-600">Overall progress</span>
                                <span class="font-semibold text-ink-900">{{ isProcessing ? 'Working' : 'Ready' }}</span>
                            </div>
                            <div class="h-2 overflow-hidden rounded-full bg-paper-200">
                                <div class="h-full rounded-full bg-stamp-500 transition-all duration-300" :style="{ width: isProcessing ? '66%' : results.length ? '100%' : '0%' }"></div>
                            </div>
                            <p class="text-xs text-ink-400">{{ results.length ? 'Downloads ready.' : 'Add files, set options, then process.' }}</p>
                        </div>

                        <div class="mt-6 space-y-4">
                            <div v-if="selectedTool.options.includes('pageRange')">
                                <label class="text-sm font-semibold text-ink-700">Page range</label>
                                <input v-model="options.pageRange" class="field mt-1.5" type="text" placeholder="All, or 1,3-5,last" />
                            </div>
                            <div v-if="selectedTool.options.includes('order')">
                                <label class="text-sm font-semibold text-ink-700">New page order</label>
                                <input v-model="options.order" class="field mt-1.5" type="text" placeholder="3,1,2,4" />
                            </div>
                            <div v-if="selectedTool.options.includes('rotation')">
                                <label class="text-sm font-semibold text-ink-700">Rotation</label>
                                <select v-model.number="options.rotation" class="field mt-1.5">
                                    <option :value="90">90 degrees</option>
                                    <option :value="180">180 degrees</option>
                                    <option :value="270">270 degrees</option>
                                </select>
                            </div>
                            <div v-if="selectedTool.options.includes('compression')" class="space-y-3">
                                <label class="text-sm font-semibold text-ink-700">Compression level</label>
                                <select v-model="options.compressionMode" class="field">
                                    <option value="smart">Smart - best safe result</option>
                                    <option value="lossless">Lossless - keep exact visuals</option>
                                    <option value="balanced">Balanced - qpdf image cleanup</option>
                                    <option value="strong">Strong - flatten only when smaller</option>
                                    <option value="maximum">Maximum - smallest accepted output</option>
                                </select>
                                <p class="text-xs leading-5 text-ink-400">
                                    The browser-served qpdf engine runs first. Aggressive modes only flatten pages when the result is actually smaller.
                                </p>
                            </div>
                            <div v-if="selectedTool.options.includes('watermark')" class="space-y-3">
                                <label class="text-sm font-semibold text-ink-700">Watermark text</label>
                                <input v-model="options.watermarkText" class="field" type="text" />
                                <label class="text-sm font-semibold text-ink-700">Opacity</label>
                                <input v-model.number="options.watermarkOpacity" class="w-full accent-stamp-500" type="range" min="0.05" max="0.5" step="0.01" />
                            </div>
                            <div v-if="selectedTool.options.includes('pageNumbers')">
                                <label class="text-sm font-semibold text-ink-700">Label prefix</label>
                                <input v-model="options.pageNumberPrefix" class="field mt-1.5" type="text" />
                            </div>
                            <div v-if="selectedTool.options.includes('imageOutput')">
                                <label class="text-sm font-semibold text-ink-700">Image format</label>
                                <select v-model="options.imageFormat" class="field mt-1.5">
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

                        <button class="brand-button mt-6 w-full justify-center disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="isProcessing || files.length === 0" @click="processFiles">
                            <Sparkles v-if="!isProcessing" class="h-4 w-4" />
                            <RotateCcw v-else class="h-4 w-4 animate-spin" />
                            {{ isProcessing ? 'Hold tight…' : `Process ${selectedTool.name}` }}
                        </button>

                        <div class="mt-5 space-y-2 rounded-lg border border-paper-300 bg-paper-50 p-4 text-sm">
                            <p class="font-semibold text-ink-700">Smart defaults</p>
                            <ul class="space-y-1 text-xs text-ink-500">
                                <li>Page range accepts 1, 3-5, and last</li>
                                <li>Local batch packaging for multi-output tools</li>
                                <li>Tool options stay matched to the selected workflow</li>
                            </ul>
                        </div>
                    </aside>
                </div>

                <section v-if="results.length" class="rounded-xl border border-paper-400 bg-white p-8">
                    <div class="flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <p class="text-sm font-semibold uppercase tracking-[0.4em] text-stamp-500">Step 3</p>
                            <h2 class="text-xl font-bold text-ink-900">Processed Assets</h2>
                            <p class="text-sm text-ink-500">Ready to download instantly from your browser memory.</p>
                        </div>
                        <button class="quiet-button" type="button" @click="clearFiles">Start New Batch</button>
                    </div>
                    <div class="mt-6 grid gap-3 md:grid-cols-2">
                        <a v-for="result in results" :key="result.name" class="flex items-center justify-between gap-4 rounded-lg border border-paper-300 bg-paper-50 p-4 transition hover:border-stamp-300" :href="result.url" :download="result.name">
                            <span class="min-w-0">
                                <span class="block truncate font-medium text-ink-900">{{ result.name }}</span>
                                <span class="block text-xs text-ink-500">{{ result.summary }}</span>
                            </span>
                            <span class="quiet-button shrink-0">
                                <Download class="h-4 w-4" aria-hidden="true" />
                                Download
                            </span>
                        </a>
                    </div>
                </section>
            </section>
        </main>

        <AppFooter />

        <div v-if="isToolPage" class="fixed bottom-0 left-0 right-0 z-50 border-t border-paper-300 bg-white p-4 lg:hidden" style="padding-bottom: max(16px, env(safe-area-inset-bottom));">
            <button class="brand-button w-full disabled:cursor-not-allowed disabled:opacity-40" type="button" :disabled="isProcessing || files.length === 0" :aria-busy="isProcessing" @click="processFiles">
                <Sparkles v-if="!isProcessing" class="h-4 w-4" aria-hidden="true" />
                <RotateCcw v-else class="h-4 w-4 animate-spin" aria-hidden="true" />
                {{ isProcessing ? 'Hold tight…' : `Process ${selectedTool.name}` }}
            </button>
        </div>
    </div>
</template>
