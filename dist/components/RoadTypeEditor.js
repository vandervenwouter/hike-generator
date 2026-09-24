import { computed, defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { roadArms, roadArmLabel } from '../hike-sheet.js';
import { useIcons } from '../icons.js';

export default defineComponent({
  props: ['step', 'element', 'index', 'language', 't'], emits: ['change'],
  setup(props) { useIcons(); return { arms: computed(() => roadArms(props.element)), roadArmLabel }; },
  template: `
    <section class="landmark-editor road-type-editor">
      <h4 class="editor-heading">{{ t('roadTypes') }}</h4>
      <div class="road-type-grid">
        <label v-for="arm in arms" :key="arm.id" class="road-type-option">
          <input
            type="checkbox"
            :data-index="index"
            :data-faint-arm="arm.id"
            :checked="step.faintArms.includes(arm.id)"
            :aria-label="t('markFaintPath', { road: roadArmLabel(arm, step.rotation, language) })"
            @change="$emit('change', { arm: arm.id, checked: $event.target.checked })"
          />
          <span>{{ t('faintPath') }}</span>
          <small>{{ roadArmLabel(arm, step.rotation, language) }}</small>
        </label>
      </div>
    </section>
  `
});
