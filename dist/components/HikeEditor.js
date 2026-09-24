import { computed, defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { stepNumbers } from '../hike-sheet.js';
import { useIcons } from '../icons.js';
import StepCard from './StepCard.js';

export default defineComponent({
  components: { StepCard }, props: ['state', 'language', 't', 'pageCount'], emits: ['open-library', 'step-action', 'field-input', 'change', 'photo', 'remember', 'landmark-update'],
  setup(props) { useIcons(); return { stepNumbers: computed(() => stepNumbers(props.state)) }; },
  template: `
    <section class="hike-editor" aria-label="Hike editor">
      <label class="sr-only" for="hike-title">{{ t('hikeName') }}</label>
      <input
        id="hike-title"
        class="hike-title"
        :placeholder="t('untitled')"
        maxlength="80"
        autocomplete="off"
        :value="state.title"
        @focus="$emit('remember')"
        @input="$emit('field-input', { field: 'title', value: $event.target.value })"
      />
      <div class="hike-summary">
        <span class="summary-item">
          <i data-lucide="list-ordered" aria-hidden="true"></i>
          <span id="step-count">
            {{ stepNumbers.filter(Boolean).length }}
            {{ stepNumbers.filter(Boolean).length === 1 ? t('step') : t('steps') }}
          </span>
        </span>
        <span class="summary-item">
          <i data-lucide="file-text" aria-hidden="true"></i>
          <span id="page-summary">{{ pageCount }} A4 {{ pageCount === 1 ? t('page') : t('pages') }}</span>
        </span>
      </div>
      <div class="hike-timeline">
        <div class="endpoint">
          <span class="endpoint-mark start-mark"><i data-lucide="navigation" aria-hidden="true"></i></span>
          <div>
            <label for="start">{{ t('start') }}</label>
            <input
              id="start"
              :placeholder="t('startPlaceholder')"
              maxlength="100"
              :value="state.start"
              @focus="$emit('remember')"
              @input="$emit('field-input', { field: 'start', value: $event.target.value })"
            />
          </div>
        </div>
        <div v-if="state.steps.length" class="insert-control">
          <button
            class="button insert-hike-item"
            type="button"
            data-insert-index="0"
            :aria-label="t('insertHikeItemBefore', { number: stepNumbers[0] || t('step.unnumbered') })"
            @click="$emit('open-library', 0)"
          >
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>{{ t('addHikeItem') }}</span>
          </button>
        </div>
        <div id="hike-steps">
          <template v-for="(step, index) in state.steps" :key="index">
            <StepCard
              :step="step"
              :index="index"
              :number="stepNumbers[index]"
              :last="index === state.steps.length - 1"
              :language="language"
              :t="t"
              @action="$emit('step-action', $event)"
              @field-input="$emit('field-input', $event)"
              @change="$emit('change', $event)"
              @photo="$emit('photo', $event)"
              @remember="$emit('remember')"
              @landmark-update="$emit('landmark-update', $event)"
            />
            <div class="insert-control">
              <button
                class="button insert-hike-item"
                type="button"
                :data-insert-index="index + 1"
                :aria-label="t('insertHikeItem', { number: stepNumbers[index] || t('step.unnumbered') })"
                @click="$emit('open-library', index + 1)"
              >
                <i data-lucide="plus" aria-hidden="true"></i>
                <span>{{ t('addHikeItem') }}</span>
              </button>
            </div>
          </template>
        </div>
        <div id="empty-hike" class="empty-hike" v-if="!state.steps.length">
          <button class="button primary add-hike-item" type="button" id="empty-add" @click="$emit('open-library', 0)">
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>{{ t('addHikeItem') }}</span>
          </button>
        </div>
        <div class="endpoint finish">
          <span class="endpoint-mark finish-mark"><i data-lucide="flag" aria-hidden="true"></i></span>
          <div>
            <label for="finish">{{ t('finish') }}</label>
            <input
              id="finish"
              :placeholder="t('finishPlaceholder')"
              maxlength="100"
              :value="state.finish"
              @focus="$emit('remember')"
              @input="$emit('field-input', { field: 'finish', value: $event.target.value })"
            />
          </div>
        </div>
      </div>
    </section>
  `
});
