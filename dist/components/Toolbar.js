import { defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { useIcons } from '../icons.js';

export default defineComponent({
  props: ['language', 'hasSteps', 'pdfBusy', 't'], emits: ['language-change', 'new-hike', 'import', 'export-json', 'export-pdf'],
  setup() { useIcons(); },
  template: `
    <header class="topbar">
      <a class="brand" href="./" :aria-label="t('home')">
        <span class="brand-mark"><i data-lucide="signpost" aria-hidden="true"></i></span>
        hike-generator
      </a>
      <div class="top-actions">
        <label class="sr-only" for="language">{{ t('language') }}</label>
        <span class="language-picker">
          <select
            class="language-select"
            id="language"
            :value="language"
            :aria-label="t('language')"
            @change="$emit('language-change', $event.target.value)"
          >
            <option value="nl" title="Nederlands">🇳🇱</option>
            <option value="en" title="English">🇬🇧</option>
          </select>
          <i data-lucide="chevron-down" aria-hidden="true"></i>
        </span>
        <button
          class="button quiet top-icon-button"
          type="button"
          id="undo"
          :disabled="!canUndo"
          :aria-label="t('undo')"
          :data-tooltip="t('undo')"
          @click="$emit('undo')"
        >
          <i data-lucide="undo-2" aria-hidden="true"></i>
        </button>
        <button
          class="button quiet top-icon-button"
          type="button"
          id="new-hike"
          :aria-label="t('newHike')"
          :data-tooltip="t('newHike')"
          @click="$emit('new-hike')"
        >
          <i data-lucide="file-plus-2" aria-hidden="true"></i>
        </button>
        <label class="button quiet top-icon-button file-button" id="import-json" :data-tooltip="t('importHike')">
          <input
            type="file"
            accept=".json,application/json"
            :aria-label="t('importHike')"
            @change="$emit('import', $event.target.files[0], $event.target)"
          />
          <i data-lucide="file-up" aria-hidden="true"></i>
        </label>
        <a
          class="button quiet top-icon-button"
          id="export-json"
          href="#"
          download="hike.json"
          :aria-label="t('exportHike')"
          :data-tooltip="t('exportHike')"
          @click.prevent="$emit('export-json')"
        >
          <i data-lucide="file-json-2" aria-hidden="true"></i>
        </a>
        <button
          class="button primary top-icon-button"
          type="button"
          id="export"
          :disabled="!hasSteps || pdfBusy"
          :aria-busy="pdfBusy"
          :aria-label="t(pdfBusy ? 'preparingPdf' : 'downloadPdf')"
          :data-tooltip="t(pdfBusy ? 'preparingPdf' : 'downloadPdf')"
          @click="$emit('export-pdf')"
        >
          <i data-lucide="file-down" aria-hidden="true"></i>
        </button>
      </div>
    </header>
  `
});
