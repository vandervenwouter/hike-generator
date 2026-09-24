import { computed, defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { elements, junctionLayoutKey, mirroredJunctionLayoutKey, junctionLateralBias, dotArrowDirections, quizLetter, roadCount, elementName, groupName } from '../hike-sheet.js';
import { diagram, junctionOverview, dotArrowDiagram, eyesDiagram, stripkaartDiagram, compassDiagram, clockDiagram, fractionDiagram } from '../diagrams.js';
import { useIcons } from '../icons.js';

export default defineComponent({
  props: ['draft', 'language', 't'], emits: ['update', 'add', 'photo'],
  setup(props) {
    useIcons();
    const counts = computed(() => [...new Set(elements.map(roadCount))].sort());
    const visible = computed(() => elements.filter(element => roadCount(element) === Number(props.draft.roadCount)));
    const uniqueLayouts = computed(() => visible.value.filter((element, index) => visible.value.findIndex(candidate => junctionLayoutKey(candidate) === junctionLayoutKey(element)) === index));
    const priority = element => Number(props.draft.roadCount) === 3 ? (junctionLayoutKey(element) === '0,90,180' ? 0 : element.id.startsWith('side-') ? 1 : element.id.startsWith('fork-') || element.id.startsWith('angled-side-') ? 2 : 3) : Number(props.draft.roadCount) === 4 ? (junctionLayoutKey(element) === '0,90,180,270' ? 0 : element.id.startsWith('four-') ? 1 : element.id.startsWith('skew-cross-') || element.id.startsWith('three-fork-') ? 2 : 3) : Number(props.draft.roadCount) === 5 && element.id.startsWith('five-') ? 0 : 1;
    const layouts = computed(() => { if (Number(props.draft.roadCount) < 3 || Number(props.draft.roadCount) > 5) return uniqueLayouts.value; const groups = [...new Set(uniqueLayouts.value.map(mirroredJunctionLayoutKey))].map(key => uniqueLayouts.value.filter(element => mirroredJunctionLayoutKey(element) === key).sort((a, b) => junctionLateralBias(a) - junctionLateralBias(b) || junctionLayoutKey(a).localeCompare(junctionLayoutKey(b)))).sort((a, b) => priority(a[0]) - priority(b[0]) || mirroredJunctionLayoutKey(a[0]).localeCompare(mirroredJunctionLayoutKey(b[0]))); const singles = groups.filter(group => group.length === 1).flat(), pairs = groups.filter(group => group.length > 1).flat(), leadingSingles = singles.length % 2 ? singles.slice(0, -1) : singles, trailingSingles = singles.length % 2 ? singles.slice(-1) : []; return [...leadingSingles, ...pairs, ...trailingSingles]; });
    const selectedLayoutId = computed(() => props.draft.selectedJunctionLayout || layouts.value[0]?.id || '');
    const choices = computed(() => { const layout = elements.find(element => element.id === selectedLayoutId.value); return layout ? visible.value.filter(element => junctionLayoutKey(element) === junctionLayoutKey(layout)) : []; });
    return { counts, layouts, selectedLayoutId, choices, junctionOverview, diagram, dotArrowDiagram, eyesDiagram, compassDiagram, clockDiagram, fractionDiagram, stripkaartDiagram, dotArrowDirections, groupName, elementName, quizLetter };
  },
  template: `
    <section class="library" aria-label="Step library">
      <div class="dialog-heading">
        <div class="panel-heading">
          <h1 id="library-title">{{ t('building.title') }}</h1>
        </div>
        <button
          class="icon-button"
          id="close-library"
          type="button"
          :aria-label="t('close')"
          :data-tooltip="t('close')"
          @click="$emit('add', { close: true })"
        >
          <i data-lucide="x" aria-hidden="true"></i>
        </button>
      </div>
      <div id="element-library">
        <section class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">1</span>
            {{ t('technique') }}
          </h2>
          <div class="technique-picker" role="group" :aria-label="t('technique')">
            <button
              v-for="item in [
                { id: 'junction', icon: 'hike', key: 'technique.junction' },
                { id: 'dot-arrow', icon: 'arrow-up-right', key: 'technique.dot-arrow' },
                { id: 'eyes', icon: 'eye', key: 'technique.eyes' },
                { id: 'compass', icon: 'compass', key: 'technique.compass' },
                { id: 'clock', icon: 'clock', key: 'technique.clock' },
                { id: 'fraction', icon: 'divide', key: 'technique.fraction' },
                { id: 'quiz', icon: 'circle-help', key: 'technique.quiz' },
                { id: 'input', icon: 'text-cursor-input', key: 'technique.input' },
                { id: 'photo', icon: 'camera', key: 'technique.photo' },
                { id: 'stripkaart', icon: 'git-branch', key: 'technique.stripkaart' },
              ]"
              :key="item.id"
              class="technique-button"
              type="button"
              :data-technique="item.id"
              :aria-pressed="draft.technique === item.id"
              @click="$emit('update', { field: 'technique', value: item.id })"
            >
              <i :data-lucide="item.icon" aria-hidden="true"></i>
              <span>{{ t(item.key) }}</span>
            </button>
          </div>
        </section>
        <template v-if="draft.technique === 'junction'">
          <section class="builder-stage">
            <h2 class="stage-title">
              <span class="stage-number">2</span>
              {{ t('roadCount') }}
            </h2>
            <div class="road-count-picker" role="group" :aria-label="t('roadCount')">
              <button
                v-for="count in counts"
                :key="count"
                class="road-count-button"
                type="button"
                :data-road-count="count"
                :aria-pressed="Number(draft.roadCount) === count"
                :aria-label="t('roadCountOption', { count })"
                @click="
                  $emit('update', { field: 'roadCount', value: count });
                  $emit('update', { field: 'selectedJunctionLayout', value: '' });
                "
              >
                {{ count }}
              </button>
            </div>
          </section>
          <section class="builder-stage">
            <h2 class="stage-title">
              <span class="stage-number">3</span>
              {{ t('junctionShape') }}
            </h2>
            <div class="element-grid">
              <button
                v-for="item in layouts"
                :key="item.id"
                class="element-button"
                type="button"
                :data-layout="item.id"
                :aria-pressed="item.id === selectedLayoutId"
                :aria-label="t('junctionShape') + ': ' + groupName(item, language)"
                @click="$emit('update', { field: 'selectedJunctionLayout', value: item.id })"
              >
                <span class="element-plus" aria-hidden="true"><i data-lucide="check" aria-hidden="true"></i></span>
                <div class="diagram-content" v-html="junctionOverview(item)"></div>
                <span class="element-name">{{ groupName(item, language) }}</span>
              </button>
            </div>
          </section>
          <section class="builder-stage">
            <h2 class="stage-title">
              <span class="stage-number">4</span>
              {{ t('hikeExit') }}
            </h2>
            <div class="element-grid">
              <button
                v-for="item in choices"
                :key="item.id"
                class="element-button"
                type="button"
                :data-element="item.id"
                :aria-label="t('add') + ' ' + elementName(item, language)"
                @click="$emit('add', { element: item.id })"
              >
                <span class="element-plus" aria-hidden="true"><i data-lucide="plus" aria-hidden="true"></i></span>
                <div class="diagram-content" v-html="diagram(item)"></div>
                <span class="element-name">{{ elementName(item, language) }}</span>
              </button>
            </div>
          </section>
        </template>
        <section v-else-if="draft.technique === 'stripkaart'" class="builder-stage stripkaart-builder">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.stripkaart') }}
          </h2>
          <div class="stripkaart-layout">
            <div
              class="stripkaart-preview"
              aria-hidden="true"
              v-html="stripkaartDiagram(draft.stripkaartPoints, draft.stripkaartEndMarker)"
            ></div>
            <div class="stripkaart-editor">
              <label class="stripkaart-end-marker">
                {{ t('stripkaart.endMarker') }}
                <select
                  :value="draft.stripkaartEndMarker"
                  @change="$emit('update', { field: 'stripkaartEndMarker', value: $event.target.value })"
                >
                  <option v-for="marker in ['arrow', 'none', 'bar']" :key="marker" :value="marker">
                    {{ t('stripkaart.endMarker.' + marker) }}
                  </option>
                </select>
              </label>
              <div class="stripkaart-points">
                <div v-for="(point, pointIndex) in draft.stripkaartPoints" :key="pointIndex" class="stripkaart-point">
                  <span class="stripkaart-point-number">{{ pointIndex + 1 }}</span>
                  <label>
                    {{ t('stripkaart.left') }}
                    <select
                      :aria-label="t('stripkaart.left') + ' ' + (pointIndex + 1)"
                      :value="point.left"
                      @change="
                        $emit('update', { field: 'stripkaart-point-left', index: pointIndex, value: $event.target.value })
                      "
                    >
                      <option v-for="count in [0, 1, 2, 3, 4]" :key="count" :value="count">{{ count }}</option>
                    </select>
                  </label>
                  <label>
                    {{ t('stripkaart.right') }}
                    <select
                      :aria-label="t('stripkaart.right') + ' ' + (pointIndex + 1)"
                      :value="point.right"
                      @change="
                        $emit('update', {
                          field: 'stripkaart-point-right',
                          index: pointIndex,
                          value: $event.target.value,
                        })
                      "
                    >
                      <option v-for="count in [0, 1, 2, 3, 4]" :key="count" :value="count">{{ count }}</option>
                    </select>
                  </label>
                  <button
                    class="icon-button delete"
                    type="button"
                    :disabled="draft.stripkaartPoints.length === 1"
                    :aria-label="t('stripkaart.remove') + ' ' + (pointIndex + 1)"
                    @click="$emit('update', { field: 'stripkaart-remove', index: pointIndex })"
                  >
                    <i data-lucide="trash-2" aria-hidden="true"></i>
                  </button>
                  <div v-if="point.left || point.right" class="stripkaart-faint-options">
                    <div class="stripkaart-faint-column">
                      <label v-for="road in point.left" :key="'left-' + road" class="road-type-option">
                        <input
                          type="checkbox"
                          :checked="point.faintRoads.includes('left-' + (road - 1))"
                          :aria-label="t('markFaintPath', { road: t('stripkaart.leftRoad', { number: road }) })"
                          @change="
                            $emit('update', {
                              field: 'stripkaart-point-faint',
                              index: pointIndex,
                              side: 'left',
                              road: road - 1,
                              value: $event.target.checked,
                            })
                          "
                        />
                        <span>{{ t('faintPath') }}</span>
                        <small>{{ t('stripkaart.leftRoad', { number: road }) }}</small>
                      </label>
                    </div>
                    <div class="stripkaart-faint-column">
                      <label v-for="road in point.right" :key="'right-' + road" class="road-type-option">
                        <input
                          type="checkbox"
                          :checked="point.faintRoads.includes('right-' + (road - 1))"
                          :aria-label="t('markFaintPath', { road: t('stripkaart.rightRoad', { number: road }) })"
                          @change="
                            $emit('update', {
                              field: 'stripkaart-point-faint',
                              index: pointIndex,
                              side: 'right',
                              road: road - 1,
                              value: $event.target.checked,
                            })
                          "
                        />
                        <span>{{ t('faintPath') }}</span>
                        <small>{{ t('stripkaart.rightRoad', { number: road }) }}</small>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
              <div class="stripkaart-actions">
                <button
                  class="button"
                  type="button"
                  :disabled="draft.stripkaartPoints.length === 50"
                  @click="$emit('update', { field: 'stripkaart-add' })"
                >
                  <i data-lucide="plus" aria-hidden="true"></i>
                  {{ t('stripkaart.add') }}
                </button>
                <button
                  class="button primary add-step-button"
                  type="button"
                  data-add-stripkaart
                  @click="$emit('add', { technique: 'stripkaart' })"
                >
                  <i data-lucide="plus" aria-hidden="true"></i>
                  <span>{{ t('add') }}</span>
                </button>
              </div>
            </div>
          </div>
        </section>
        <section v-else-if="draft.technique === 'dot-arrow' || draft.technique === 'eyes'" class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('direction') }}
          </h2>
          <div class="element-grid dot-arrow-grid">
            <button
              v-for="rotation in dotArrowDirections"
              :key="rotation"
              class="element-button"
              type="button"
              :data-direction="rotation"
              :aria-label="t('add') + ' ' + t('direction.' + rotation)"
              @click="$emit('add', { technique: draft.technique, rotation })"
            >
              <span class="element-plus" aria-hidden="true"><i data-lucide="plus" aria-hidden="true"></i></span>
              <div
                class="diagram-content"
                v-html="draft.technique === 'eyes' ? eyesDiagram(rotation) : dotArrowDiagram(rotation)"
              ></div>
              <span class="element-name">{{ t('direction.' + rotation) }}</span>
            </button>
          </div>
        </section>
        <section v-else-if="draft.technique === 'compass'" class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('bearing') }}
          </h2>
          <div class="compass-builder">
            <div class="diagram-content" v-html="compassDiagram(draft.bearing)"></div>
            <label>
              {{ t('bearing') }}
              <span class="bearing-input">
                <input
                  id="compass-bearing"
                  type="number"
                  min="0"
                  max="359"
                  step="1"
                  required
                  :value="draft.bearing"
                  @input="$emit('update', { field: 'bearing', value: $event.target.value })"
                />
                <span>°</span>
              </span>
            </label>
            <button
              class="button primary add-step-button"
              type="button"
              data-add-compass
              @click="$emit('add', { technique: 'compass' })"
            >
              <i data-lucide="plus" aria-hidden="true"></i>
              <span>{{ t('addCompass') }}</span>
            </button>
          </div>
        </section>
        <section v-else-if="draft.technique === 'clock'" class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.clock') }}
          </h2>
          <div class="compass-builder">
            <div class="diagram-content" v-html="clockDiagram()"></div>
            <label>
              {{ t('time') }}
              <span class="bearing-input clock-input">
                <input
                  id="clock-time"
                  class="clock-time-input"
                  type="time"
                  step="60"
                  required
                  :value="draft.time"
                  @input="$emit('update', { field: 'time', value: $event.target.value })"
                />
              </span>
            </label>
            <button
              class="button primary add-step-button"
              type="button"
              data-add-clock
              @click="$emit('add', { technique: 'clock' })"
            >
              <i data-lucide="plus" aria-hidden="true"></i>
              <span>{{ t('add') }}</span>
            </button>
          </div>
        </section>
        <section v-else-if="draft.technique === 'fraction'" class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.fraction') }}
          </h2>
          <div class="compass-builder fraction-builder">
            <div class="diagram-content" v-html="fractionDiagram(draft.numerator, draft.denominator)"></div>
            <div class="fraction-inputs">
              <label>
                {{ t('numerator') }}
                <input
                  id="fraction-numerator"
                  type="number"
                  min="1"
                  :max="draft.denominator"
                  step="1"
                  required
                  :value="draft.numerator"
                  @input="$emit('update', { field: 'numerator', value: $event.target.value })"
                />
              </label>
              <span aria-hidden="true">/</span>
              <label>
                {{ t('denominator') }}
                <input
                  id="fraction-denominator"
                  type="number"
                  min="2"
                  max="99"
                  step="1"
                  required
                  :value="draft.denominator"
                  @input="$emit('update', { field: 'denominator', value: $event.target.value })"
                />
              </label>
            </div>
            <button
              class="button primary add-step-button"
              type="button"
              data-add-fraction
              @click="$emit('add', { technique: 'fraction' })"
            >
              <i data-lucide="plus" aria-hidden="true"></i>
              <span>{{ t('add') }}</span>
            </button>
          </div>
        </section>
        <section v-else-if="draft.technique === 'quiz'" class="builder-stage">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.quiz') }}
          </h2>
          <textarea
            data-field="question"
            :aria-label="t('quiz.question')"
            maxlength="160"
            rows="2"
            required
            :placeholder="t('quiz.questionPlaceholder')"
            :value="draft.quizQuestion"
            @input="$emit('update', { field: 'quizQuestion', value: $event.target.value })"
          ></textarea>
          <div class="quiz-answers">
            <div v-for="(answer, answerIndex) in draft.quizAnswers" :key="answerIndex" class="quiz-answer">
              <label>
                {{ t('quiz.answer', { letter: quizLetter(answerIndex) }) }}
                <input
                  :data-answer="answerIndex"
                  maxlength="80"
                  required
                  pattern=".*\\S.*"
                  :value="answer"
                  @input="$emit('update', { field: 'quizAnswer', index: answerIndex, value: $event.target.value })"
                />
              </label>
              <button
                class="icon-button delete"
                type="button"
                data-quiz-action="remove"
                :data-answer-index="answerIndex"
                :disabled="draft.quizAnswers.length === 2"
                :aria-label="t('quiz.removeAnswer', { letter: quizLetter(answerIndex) })"
                @click="$emit('update', { field: 'removeQuizAnswer', index: answerIndex })"
              >
                <i data-lucide="trash-2" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="quiz-actions">
            <button
              class="button"
              type="button"
              data-quiz-action="add"
              :disabled="draft.quizAnswers.length >= 6"
              @click="$emit('update', { field: 'addQuizAnswer' })"
            >
              <i data-lucide="plus" aria-hidden="true"></i>
              {{ t('quiz.addAnswer') }}
            </button>
          </div>
          <button
            class="button primary add-step-button"
            type="button"
            data-add-quiz
            @click="$emit('add', { technique: 'quiz' })"
          >
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>{{ t('add') }}</span>
          </button>
        </section>
        <section v-else-if="draft.technique === 'input'" class="builder-stage free-text-builder">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.input') }}
          </h2>
          <input
            class="free-text-input"
            id="input-value"
            :aria-label="t('input.value')"
            maxlength="160"
            :placeholder="t('input.placeholder')"
            :value="draft.inputValue"
            @input="$emit('update', { field: 'inputValue', value: $event.target.value })"
          />
          <label class="numbering-field">
            <input
              type="checkbox"
              data-numbered
              :checked="draft.inputNumbered"
              @change="$emit('update', { field: 'inputNumbered', value: $event.target.checked })"
            />
            {{ t('step.numbered') }}
          </label>
          <button
            class="button primary add-step-button"
            type="button"
            data-add-input
            @click="$emit('add', { technique: 'input' })"
          >
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>{{ t('add') }}</span>
          </button>
        </section>
        <section v-else class="builder-stage photo-builder">
          <h2 class="stage-title">
            <span class="stage-number">2</span>
            {{ t('technique.photo') }}
          </h2>
          <label class="photo-file-label">
            {{ t('photo.file') }}
            <input
              id="photo-file"
              type="file"
              accept="image/png,image/jpeg,.png,.jpg,.jpeg"
              @change="$emit('photo', $event.target.files[0])"
            />
          </label>
          <label class="photo-width-field">
            {{ t('photo.width') }}
            <select
              data-photo-columns
              :value="draft.photoColumns"
              @change="$emit('update', { field: 'photoColumns', value: Number($event.target.value) })"
            >
              <option v-for="value in [1, 2, 3]" :key="value" :value="value">
                {{ value }}/3{{ value === 3 ? ' (' + t('photo.fullWidth') + ')' : '' }}
              </option>
            </select>
          </label>
          <label class="numbering-field">
            <input
              type="checkbox"
              data-numbered
              :checked="draft.photoNumbered"
              @change="$emit('update', { field: 'photoNumbered', value: $event.target.checked })"
            />
            {{ t('step.numbered') }}
          </label>
          <img v-if="draft.photo" class="photo-picker-preview" :src="draft.photo" alt="" />
          <button
            class="button primary add-step-button"
            type="button"
            data-add-photo
            :disabled="!draft.photo"
            @click="$emit('add', { technique: 'photo' })"
          >
            <i data-lucide="plus" aria-hidden="true"></i>
            <span>{{ t('add') }}</span>
          </button>
        </section>
      </div>
    </section>
  `
});
