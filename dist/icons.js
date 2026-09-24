import { nextTick, onMounted, onUpdated } from './vendor/vue.esm-browser.prod.js';

export const refreshIcons = () => globalThis.lucide?.createIcons();
export const useIcons = () => { onMounted(() => nextTick(refreshIcons)); onUpdated(() => nextTick(refreshIcons)); };
