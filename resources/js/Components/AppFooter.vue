<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
</script>

<template>
    <footer class="mt-16 border-t border-paper-300">
        <div class="page-container flex flex-col items-center justify-between gap-4 py-8 text-sm text-ink-500 md:flex-row">
            <p>
                &copy; 2026 ILovePDF Studio. Crafted by
                <a
                    class="font-semibold text-stamp-500 transition hover:text-stamp-600"
                    href="https://codezela.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Codezela Technologies</a>. Documents stay on your device.
            </p>
            <div class="flex items-center gap-4">
                <Link class="transition hover:text-ink-700" href="/privacy">Privacy</Link>
                <span class="text-paper-400">&middot;</span>
                <Link class="transition hover:text-ink-700" href="/terms">Terms</Link>
            </div>
        </div>
    </footer>
</template>
