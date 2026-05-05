<script setup lang="ts">
import { Link } from '@inertiajs/vue3';
</script>

<template>
    <footer class="relative z-10 mt-16 border-t border-white/10">
        <div class="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-10 text-sm text-white/70 sm:px-6 md:flex-row lg:px-8">
            <p>
                © 2026 ILovePDF Studio. Crafted by
                <a
                    class="font-semibold text-primary-400 transition hover:text-primary-300"
                    href="https://codezela.com"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    Codezela Technologies</a>. Documents stay on your device.
            </p>
            <div class="flex items-center gap-4">
                <Link class="transition hover:text-white" href="/privacy">Privacy</Link>
                <span class="text-white/30">·</span>
                <Link class="transition hover:text-white" href="/terms">Terms</Link>
            </div>
        </div>
    </footer>
</template>
