import type { ComputedRef } from 'vue';
import { watch } from 'vue';

export function useDocumentTitle(title: ComputedRef<string>) {
    watch(title, (value) => {
        if (typeof document !== 'undefined' && value.trim()) {
            document.title = value;
        }
    }, { immediate: true });
}
