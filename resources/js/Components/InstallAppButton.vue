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
        class="hidden items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs uppercase tracking-widest text-white/70 shadow-inner shadow-white/10 transition hover:border-primary-300/40 hover:bg-white/15 hover:text-white focus:outline-none focus:ring-4 focus:ring-primary-500/20 md:inline-flex"
        type="button"
        title="Install ILovePDF Studio as a browser app"
        @click="installApp"
    >
        <span class="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white/10 text-primary-200">
            <Download class="h-3.5 w-3.5" />
        </span>
        {{ label }}
    </button>
</template>
