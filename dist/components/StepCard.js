import { computed, defineComponent } from '../vendor/vue.esm-browser.prod.js';
import { elements, dotArrowShape, quizLetter, elementName, groupName } from '../hike-sheet.js';
import { diagram, dotArrowDiagram, eyesDiagram, stripkaartDiagram, compassDiagram, clockDiagram, fractionDiagram, inputDiagram, quizDiagram, photoDiagram } from '../diagrams.js';
import { useIcons } from '../icons.js';
import RoadTypeEditor from './RoadTypeEditor.js';
import LandmarkEditor from './LandmarkEditor.js';

export default defineComponent({
  components: { RoadTypeEditor, LandmarkEditor }, props: ['step', 'index', 'number', 'last', 'language', 't'], emits: ['action', 'field-input', 'change', 'photo', 'remember', 'landmark-update'],
  setup(props) {
    useIcons();
    const isQuiz = computed(() => props.step.technique === 'quiz'), isInput = computed(() => props.step.technique === 'input'), isPhoto = computed(() => props.step.technique === 'photo'), isCompass = computed(() => props.step.technique === 'compass'), isClock = computed(() => props.step.technique === 'clock'), isFraction = computed(() => props.step.technique === 'fraction'), isDotArrow = computed(() => props.step.technique === 'dot-arrow'), isEyes = computed(() => props.step.technique === 'eyes'), isStripkaart = computed(() => props.step.technique === 'stripkaart');
    const isSpecial = computed(() => isQuiz.value || isInput.value || isPhoto.value || isCompass.value || isClock.value || isFraction.value || isDotArrow.value || isEyes.value || isStripkaart.value);
    const element = computed(() => isQuiz.value || isInput.value || isPhoto.value || isCompass.value || isClock.value || isFraction.value || isEyes.value || isStripkaart.value ? null : isDotArrow.value ? dotArrowShape(props.step.element) : elements.find(item => item.id === props.step.element));
    const art = computed(() => isPhoto.value ? photoDiagram(props.step.image) : isInput.value ? inputDiagram() : isQuiz.value ? quizDiagram() : isCompass.value ? compassDiagram(props.step.bearing) : isClock.value ? clockDiagram() : isFraction.value ? fractionDiagram(props.step.numerator, props.step.denominator) : isEyes.value ? eyesDiagram(props.step.rotation) : isStripkaart.value ? stripkaartDiagram(props.step.points,props.step.endMarker) : isDotArrow.value ? dotArrowDiagram(props.step.rotation, element.value) : diagram(element.value, props.step.rotation, props.step.landmarks, props.step.faintArms, true));
    const heading = computed(() => isPhoto.value ? props.t('technique.photo') : isInput.value ? props.t('technique.input') : isQuiz.value ? props.t('technique.quiz') : isCompass.value ? props.t('technique.compass') : isClock.value ? props.t('technique.clock') : isFraction.value ? props.t('technique.fraction') : isStripkaart.value ? props.t('technique.stripkaart') : isDotArrow.value || isEyes.value ? props.t(`technique.${props.step.technique}`) : elementName(element.value, props.language));
    const subtitle = computed(() => isPhoto.value ? props.t('photo.file') : isInput.value ? (props.step.value || props.t('input.value')) : isQuiz.value ? props.t('quiz.answers', { count: props.step.answers.length }) : isCompass.value ? `${props.step.bearing}°` : isClock.value ? props.step.time : isFraction.value ? `${props.step.numerator}/${props.step.denominator}` : isStripkaart.value ? props.t('stripkaart.points', { count: props.step.points.length }) : isDotArrow.value || isEyes.value ? (element.value ? elementName(element.value, props.language) : props.t(`direction.${props.step.rotation}`)) : groupName(element.value, props.language));
    return { isQuiz, isInput, isPhoto, isCompass, isClock, isFraction, isDotArrow, isEyes, isStripkaart, isSpecial, element, art, heading, subtitle, quizLetter };
  },
  template: `
    <article class="hike-step">
      <span class="step-number" :aria-label="number || t('step.unnumbered')">{{ number || '–' }}</span>
      <div class="step-card">
        <div class="step-card-top">
          <div class="diagram-content" v-html="art"></div>
          <div>
            <h3 class="step-title">{{ heading }}</h3>
            <p class="step-subtitle">{{ subtitle }}</p>
            <div
              v-if="!isQuiz && !isInput && !isPhoto && !isCompass && !isClock && !isFraction && !isStripkaart"
              class="rotation-controls"
            >
              <button
                class="icon-button"
                type="button"
                data-action="rotate-left"
                :data-index="index"
                :aria-label="t('rotateLeft', { number: number || t('step.unnumbered') })"
                :title="t('rotateLeftTitle')"
                @click="$emit('action', { action: 'rotate-left', index })"
              >
                <i data-lucide="rotate-ccw" aria-hidden="true"></i>
              </button>
              <span class="rotation-angle" :aria-label="t('rotation', { degrees: step.rotation })">
                {{ step.rotation }}°
              </span>
              <button
                class="icon-button"
                type="button"
                data-action="rotate-right"
                :data-index="index"
                :aria-label="t('rotateRight', { number: number || t('step.unnumbered') })"
                :title="t('rotateRightTitle')"
                @click="$emit('action', { action: 'rotate-right', index })"
              >
                <i data-lucide="rotate-cw" aria-hidden="true"></i>
              </button>
            </div>
          </div>
          <div class="step-actions">
            <button
              class="icon-button"
              type="button"
              data-action="up"
              :data-index="index"
              :aria-label="t('moveUp', { number: number || t('step.unnumbered') })"
              :disabled="index === 0"
              @click="$emit('action', { action: 'up', index })"
            >
              <i data-lucide="arrow-up" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="down"
              :data-index="index"
              :aria-label="t('moveDown', { number: number || t('step.unnumbered') })"
              :disabled="last"
              @click="$emit('action', { action: 'down', index })"
            >
              <i data-lucide="arrow-down" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button"
              type="button"
              data-action="duplicate"
              :data-index="index"
              :aria-label="t('duplicateStep', { number: number || t('step.unnumbered') })"
              @click="$emit('action', { action: 'duplicate', index })"
            >
              <i data-lucide="copy" aria-hidden="true"></i>
            </button>
            <button
              class="icon-button delete"
              type="button"
              data-action="delete"
              :data-index="index"
              :aria-label="t('removeStep', { number: number || t('step.unnumbered') })"
              @click="$emit('action', { action: 'delete', index })"
            >
              <i data-lucide="trash-2" aria-hidden="true"></i>
            </button>
          </div>
        </div>
        <div v-if="isSpecial" class="step-fields">
          <template v-if="isPhoto">
            <label class="photo-change-field">
              {{ t('photo.change') }}
              <input
                type="file"
                accept="image/png,image/jpeg,.png,.jpg,.jpeg"
                :data-photo-index="index"
                @change="$emit('photo', { index, file: $event.target.files[0] })"
              />
            </label>
            <label class="photo-width-field">
              {{ t('photo.width') }}
              <select
                :data-index="index"
                data-photo-columns
                :value="step.columns"
                @change="$emit('change', { type: 'photo-columns', index, value: Number($event.target.value) })"
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
                :data-index="index"
                :checked="step.numbered"
                @change="$emit('change', { type: 'numbered', index, value: $event.target.checked })"
              />
              {{ t('step.numbered') }}
            </label>
          </template>
          <template v-else-if="isInput">
            <label>
              {{ t('input.value') }}
              <input
                maxlength="160"
                data-field="value"
                :data-index="index"
                :value="step.value"
                :placeholder="t('input.placeholder')"
                @focus="$emit('remember')"
                @input="
                  $emit('field-input', { index, field: 'value', value: $event.target.value, element: $event.target })
                "
              />
            </label>
            <label class="numbering-field">
              <input
                type="checkbox"
                data-numbered
                :data-index="index"
                :checked="step.numbered"
                @change="$emit('change', { type: 'numbered', index, value: $event.target.checked })"
              />
              {{ t('step.numbered') }}
            </label>
          </template>
          <template v-else-if="isQuiz">
            <textarea
              data-field="question"
              :aria-label="t('quiz.question')"
              :data-index="index"
              maxlength="160"
              rows="2"
              :placeholder="t('quiz.questionPlaceholder')"
              required
              :value="step.question"
              @focus="$emit('remember')"
              @input="
                $emit('field-input', { index, field: 'question', value: $event.target.value, element: $event.target })
              "
            ></textarea>
            <div class="quiz-answers">
              <div v-for="(answer, answerIndex) in step.answers" :key="answerIndex" class="quiz-answer">
                <label>
                  {{ t('quiz.answer', { letter: quizLetter(answerIndex) }) }}
                  <input
                    :data-answer="answerIndex"
                    :data-index="index"
                    maxlength="80"
                    required
                    pattern=".*\\S.*"
                    :value="answer"
                    @focus="$emit('remember')"
                    @input="
                      $emit('field-input', {
                        index,
                        field: 'answer',
                        answerIndex,
                        value: $event.target.value,
                        element: $event.target,
                      })
                    "
                  />
                </label>
                <button
                  class="icon-button delete"
                  type="button"
                  data-quiz-action="remove"
                  :data-index="index"
                  :data-answer-index="answerIndex"
                  :aria-label="t('quiz.removeAnswer', { letter: quizLetter(answerIndex) })"
                  :disabled="step.answers.length === 2"
                  @click="$emit('action', { action: 'quiz-remove', index, answerIndex })"
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
                :data-index="index"
                :disabled="step.answers.length >= 6"
                @click="$emit('action', { action: 'quiz-add', index })"
              >
                <i data-lucide="plus" aria-hidden="true"></i>
                {{ t('quiz.addAnswer') }}
              </button>
            </div>
          </template>
          <template v-else-if="isCompass">
            <label>
              {{ t('bearing') }}
              <span class="bearing-input">
                <input
                  type="number"
                  min="0"
                  max="359"
                  step="1"
                  data-field="bearing"
                  :data-index="index"
                  :value="step.bearing"
                  :aria-label="t('bearingLabel', { number: number || t('step.unnumbered') })"
                  required
                  @focus="$emit('remember')"
                  @input="
                    $emit('field-input', { index, field: 'bearing', value: $event.target.value, element: $event.target })
                  "
                />
                <span>°</span>
              </span>
            </label>
          </template>
          <template v-else-if="isClock">
            <label>
              {{ t('time') }}
              <span class="bearing-input clock-input">
                <input
                  class="clock-time-input"
                  type="time"
                  step="60"
                  data-field="time"
                  :data-index="index"
                  :value="step.time"
                  required
                  @focus="$emit('remember')"
                  @input="
                    $emit('field-input', { index, field: 'time', value: $event.target.value, element: $event.target })
                  "
                />
              </span>
            </label>
          </template>
          <template v-else-if="isFraction">
            <div
              class="fraction-inputs step-fraction-inputs"
              :aria-label="t('fractionLabel', { number: number || t('step.unnumbered') })"
            >
              <label>
                {{ t('numerator') }}
                <input
                  type="number"
                  min="1"
                  :max="step.denominator"
                  step="1"
                  data-field="numerator"
                  :data-index="index"
                  :value="step.numerator"
                  required
                  @focus="$emit('remember')"
                  @input="
                    $emit('field-input', {
                      index,
                      field: 'numerator',
                      value: $event.target.value,
                      element: $event.target,
                    })
                  "
                />
              </label>
              <span aria-hidden="true">/</span>
              <label>
                {{ t('denominator') }}
                <input
                  type="number"
                  min="2"
                  max="99"
                  step="1"
                  data-field="denominator"
                  :data-index="index"
                  :value="step.denominator"
                  required
                  @focus="$emit('remember')"
                  @input="
                    $emit('field-input', {
                      index,
                      field: 'denominator',
                      value: $event.target.value,
                      element: $event.target,
                    })
                  "
                />
              </label>
            </div>
          </template>
          <template v-else-if="isStripkaart">
            <label class="stripkaart-end-marker">
              {{ t('stripkaart.endMarker') }}
              <select
                :value="step.endMarker"
                @focus="$emit('remember')"
                @change="$emit('field-input', { index, field: 'endMarker', value: $event.target.value })"
              >
                <option v-for="marker in ['arrow', 'none', 'bar']" :key="marker" :value="marker">
                  {{ t('stripkaart.endMarker.' + marker) }}
                </option>
              </select>
            </label>
            <div class="stripkaart-points">
              <div v-for="(point, pointIndex) in step.points" :key="pointIndex" class="stripkaart-point">
                <span class="stripkaart-point-number">{{ pointIndex + 1 }}</span>
                <label>
                  {{ t('stripkaart.left') }}
                  <select
                    :aria-label="t('stripkaart.left') + ' ' + (pointIndex + 1)"
                    :value="point.left"
                    @focus="$emit('remember')"
                    @change="
                      $emit('field-input', {
                        index,
                        field: 'stripkaart-point',
                        pointIndex,
                        side: 'left',
                        value: $event.target.value,
                      })
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
                    @focus="$emit('remember')"
                    @change="
                      $emit('field-input', {
                        index,
                        field: 'stripkaart-point',
                        pointIndex,
                        side: 'right',
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
                  :disabled="step.points.length === 1"
                  :aria-label="t('stripkaart.remove') + ' ' + (pointIndex + 1)"
                  @click="$emit('action', { action: 'stripkaart-remove', index, pointIndex })"
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
                        @focus="$emit('remember')"
                        @change="
                          $emit('field-input', {
                            index,
                            field: 'stripkaart-point-faint',
                            pointIndex,
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
                        @focus="$emit('remember')"
                        @change="
                          $emit('field-input', {
                            index,
                            field: 'stripkaart-point-faint',
                            pointIndex,
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
                :disabled="step.points.length === 50"
                @click="$emit('action', { action: 'stripkaart-add', index })"
              >
                <i data-lucide="plus" aria-hidden="true"></i>
                {{ t('stripkaart.add') }}
              </button>
            </div>
          </template>
        </div>
        <template v-if="!isSpecial">
          <RoadTypeEditor
            :step="step"
            :element="element"
            :index="index"
            :language="language"
            :t="t"
            @change="$emit('change', { type: 'faint-arm', index, arm: $event.arm, value: $event.checked })"
          />
          <LandmarkEditor
            :step="step"
            :element="element"
            :index="index"
            :number="number || t('step.unnumbered')"
            :language="language"
            :t="t"
            @add="$emit('action', { action: 'landmark-add', index })"
            @remove="$emit('action', { action: 'landmark-remove', index, landmark: $event })"
            @update="$emit('landmark-update', { index, ...$event })"
          />
        </template>
        <div v-if="!isInput" class="step-fields step-note-fields">
          <label>
            {{ t('note') }}
            <textarea
              maxlength="160"
              rows="1"
              data-field="note"
              :data-index="index"
              :placeholder="t('notePlaceholder')"
              :aria-label="t('noteLabel', { number: number || t('step.unnumbered') })"
              :value="step.note"
              @focus="$emit('remember')"
              @input="$emit('field-input', { index, field: 'note', value: $event.target.value, element: $event.target })"
            ></textarea>
          </label>
        </div>
      </div>
    </article>
  `
});
