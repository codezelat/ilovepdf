<script setup lang="ts">
import { Download } from 'lucide-vue-next';
import { computed, onBeforeUnmount, onMounted, ref } from 'vue';

type BeforeInstallPromptEvent = Event & {
    prompt: () => Promise<void>;
    userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
};

const deferredPrompt = ref<BeforeInstallPromptEvent | null>(null);
const isInstalled = ref(false);

const label = computed(() => (isInstalled.value ? 'App installed' : '100% client-side'));

onMounted(() => {
    isInstalled.value = isStandalone();
    window.addEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.addEventListener('appinstalled', onAppInstalled);
});

onBeforeUnmount(() => {
    window.removeEventListener('beforeinstallprompt', onBeforeInstallPrompt as EventListener);
    window.removeEventListener('appinstalled', onAppInstalled);
});

function onBeforeInstallPrompt(event: BeforeInstallPromptEvent) {
    event.preventDefault();
    deferredPrompt.value = event;
}

function onAppInstalled() {
    isInstalled.value = true;
    deferredPrompt.value = null;
}

async function installApp() {
    if (isStandalone()) {
        isInstalled.value = true;
        window.alert('ILovePDF Studio is already running as an installed app.');
        return;
    }

    if (deferredPrompt.value) {
        const promptEvent = deferredPrompt.value;
        deferredPrompt.value = null;
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        isInstalled.value = choice.outcome === 'accepted' || isStandalone();
        return;
    }

    window.alert(`To install:\n\n1. Click the ... menu in Edge\n2. Go to Apps -> Install this site as an app`);
}

function isStandalone() {
    return window.matchMedia('(display-mode: standalone)').matches
        || ('standalone' in navigator && Boolean((navigator as Navigator & { standalone?: boolean }).standalone));
}
</script>

<template>
    <button
        class="hidden items-center gap-2 rounded-lg border border-paper-400 bg-white px-3 py-1.5 text-xs font-semibold uppercase tracking-widest text-ink-500 transition hover:border-stamp-300 hover:text-stamp-500 focus:outline-none focus:ring-2 focus:ring-stamp-500/20 md:inline-flex"
        type="button"
        title="Install ILovePDF Studio as a browser app"
        @click="installApp"
    >
        <Download class="h-3.5 w-3.5" aria-hidden="true" />
        {{ label }}
    </button>
</template>
