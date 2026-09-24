import { computed, defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { landmarkTypes, sidedLandmarkTypes, landmarkArms, roadArmLabel, landmarkName } from '../hike-sheet.js';
import { useIcons } from '../icons.js';

export default defineComponent({
  props: ['step', 'element', 'index', 'number', 'language', 't'], emits: ['add', 'remove', 'update'],
  setup(props) {
    useIcons();
    const arms = computed(() => landmarkArms(props.element, props.step.landmarks));
    const isSided = type => sidedLandmarkTypes.includes(type);
    const free = (placementIndex, arm, side, sided) => !props.step.landmarks.some((placement, index) => index !== placementIndex && placement.arm === arm.id && sidedLandmarkTypes.includes(placement.type) === sided && (!sided || (placement.side ?? 'right') === side));
    const optionsFor = (placement, placementIndex) => isSided(placement.type) ? arms.value.flatMap(arm => ['left', 'right'].filter(side => free(placementIndex, arm, side, true)).map(side => ({ value: `${arm.id}:${side}`, label: `${arm.id === 'centre' ? '' : `${roadArmLabel(arm, props.step.rotation, props.language)} · `}${props.t(`side.${side}`)}` }))) : arms.value.filter(arm => free(placementIndex, arm, null, false)).map(arm => ({ value: arm.id, label: roadArmLabel(arm, props.step.rotation, props.language) }));
    return { arms, isSided, optionsFor, landmarkTypes, landmarkName, roadArmLabel };
  },
  template: `
    <section class="landmark-editor">
      <h4 class="editor-heading">{{ t('landmarks') }}</h4>
      <div class="landmark-rows">
        <div v-for="(placement, placementIndex) in step.landmarks" :key="placementIndex" class="landmark-row">
          <label>
            {{ t('item') }}
            <select
              :data-index="index"
              :data-landmark="placementIndex"
              data-landmark-field="type"
              :aria-label="t('itemLabel', { landmark: placementIndex + 1, step: number })"
              :value="placement.type"
              @change="$emit('update', { placementIndex, field: 'type', value: $event.target.value })"
            >
              <option v-for="type in landmarkTypes" :key="type.id" :value="type.id">
                {{ landmarkName(type, language) }}
              </option>
            </select>
          </label>
          <label>
            {{ t(isSided(placement.type) || arms.length === 1 ? 'position' : 'roadArm') }}
            <select
              :data-index="index"
              :data-landmark="placementIndex"
              :data-landmark-field="isSided(placement.type) ? 'position' : 'arm'"
              :aria-label="
                t(isSided(placement.type) || arms.length === 1 ? 'positionLabel' : 'armLabel', {
                  landmark: placementIndex + 1,
                  step: number,
                })
              "
              :value="isSided(placement.type) ? placement.arm + ':' + (placement.side || 'right') : placement.arm"
              @change="
                $emit('update', {
                  placementIndex,
                  field: isSided(placement.type) ? 'position' : 'arm',
                  value: $event.target.value,
                })
              "
            >
              <option v-for="option in optionsFor(placement, placementIndex)" :key="option.value" :value="option.value">
                {{ option.label }}
              </option>
            </select>
          </label>
          <button
            class="icon-button delete"
            type="button"
            :data-index="index"
            :data-landmark="placementIndex"
            :aria-label="t('removeLandmark', { landmark: placementIndex + 1, step: number })"
            :title="t('removeLandmark', { landmark: placementIndex + 1, step: number })"
            @click="$emit('remove', placementIndex)"
          >
            <i data-lucide="trash-2" aria-hidden="true"></i>
          </button>
        </div>
      </div>
      <button
        class="button add-landmark"
        type="button"
        :data-index="index"
        :disabled="step.landmarks.length === arms.length * 3"
        @click="$emit('add')"
      >
        <i data-lucide="plus" aria-hidden="true"></i>
        <span>{{ t('addLandmark') }}</span>
      </button>
    </section>
  `
});
