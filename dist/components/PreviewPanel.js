import { defineComponent, onMounted, ref, toRaw, watch } from '../vendor/vue.esm-browser.prod.js';
import { elements, dotArrowShape, drawSheet, drawTechniqueGuide, preloadPhotos, pageCount, documentPageCount, hikeTechniques, hikePages, stepNumbers, quizLetter, landmarkTypes, sidedLandmarkTypes, landmarkArms, roadArmLabel, elementName, landmarkName } from '../hike-sheet.js';
import { useIcons } from '../icons.js';

export default defineComponent({
  props: ['state', 'language', 't'], emits: ['toggle-guide'],
  setup(props) {
    useIcons();
    const paperPreview = ref(null); let photoKey = '';
    const render = async () => { const hike = structuredClone(toRaw(props.state)); const currentPhotoKey = hike.steps.filter(step => step.technique === 'photo').map(step => step.image).join('|'); if (currentPhotoKey && currentPhotoKey !== photoKey) { photoKey = currentPhotoKey; await preloadPhotos(hike); } const pages = documentPageCount(hike), hikePagesCount = pageCount(hike), hasGuide = hike.includeTechniqueExplanation && hikeTechniques(hike).length; if (!paperPreview.value) return; paperPreview.value.replaceChildren(); if (hasGuide) { const canvas = drawTechniqueGuide(document.createElement('canvas'), hike, 3, Path2D, props.language); canvas.className = 'paper'; canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', props.t('guide.pageLabel', { techniques: hikeTechniques(hike).map(technique => props.t(`technique.${technique}`)).join(', ') })); paperPreview.value.append(canvas); } const numbers = stepNumbers(hike); for (let pageIndex = 0; pageIndex < hikePagesCount; pageIndex++) { const canvas = drawSheet(document.createElement('canvas'), hike, pageIndex, 3, Path2D, props.language); canvas.className = 'paper'; canvas.setAttribute('role', 'img'); const steps = hikePages(hike)[pageIndex].flatMap(row => row.steps.map((step, index) => ({ step, number: numbers[row.start + index] }))).map(({ step, number }) => { if (step.technique === 'photo') return `${number === null ? '' : `${number}: `}${props.t('technique.photo')}. ${step.note}`; if (step.technique === 'input') return `${number === null ? '' : `${number}: `}${props.t('technique.input')}. ${step.value}. ${step.note}`; if (step.technique === 'quiz') return `${number}: ${props.t('technique.quiz')}. ${step.question} ${step.answers.map((answer, index) => `${quizLetter(index)}. ${answer}`).join(' ')}. ${step.note}`; if (step.technique === 'compass') return `${number}: ${props.t('technique.compass')}, ${step.bearing}°. ${step.note}`; if (step.technique === 'clock') return `${number}: ${props.t('technique.clock')}, ${step.time}. ${step.note}`; if (step.technique === 'dot-arrow' || step.technique === 'eyes') { const element = step.technique === 'dot-arrow' ? dotArrowShape(step.element) : null; return `${number}: ${props.t(`technique.${step.technique}`)}, ${element ? `${elementName(element, props.language)}, ${props.t('rotation', { degrees: step.rotation })}` : props.t(`direction.${step.rotation}`)}. ${step.note}`; } if (step.technique === 'fraction') return `${number}: ${props.t('technique.fraction')}, ${step.numerator}/${step.denominator}. ${step.note}`; if (step.technique === 'stripkaart') return `${number}: ${props.t('technique.stripkaart')}, ${props.t('stripkaart.points', { count: step.points.length })}, ${props.t('stripkaart.endMarker.' + step.endMarker)}. ${step.note}`; const element = elements.find(item => item.id === step.element); return `${number}: ${elementName(element, props.language)}, ${props.t('rotation', { degrees: step.rotation })}. ${step.landmarks.map(placement => `${landmarkName(landmarkTypes.find(type => type.id === placement.type), props.language)} — ${roadArmLabel(landmarkArms(element, step.landmarks).find(arm => arm.id === placement.arm), step.rotation, props.language)}${sidedLandmarkTypes.includes(placement.type) ? ` · ${props.t(`side.${placement.side ?? 'right'}`)}` : ''}`).join(', ')}. ${step.note}`; }).join(' '); canvas.setAttribute('aria-label', props.t('previewLabel', { page: pageIndex + 1 + (hasGuide ? 1 : 0), pages, steps })); paperPreview.value.append(canvas); } };
    watch(() => props.state, render, { deep: true, immediate: true });
    onMounted(render);
    return { paperPreview };
  },
  template: `
    <aside class="preview-panel" aria-label="Print preview">
      <div class="preview-meta">
        <span>{{ t('printPreview') }}</span>
      </div>
      <details class="preview-options">
        <summary>
          <i data-lucide="settings-2" aria-hidden="true"></i>
          <span>{{ t('pdfOptions') }}</span>
        </summary>
        <label>
          <input
            id="include-technique-explanation"
            type="checkbox"
            :checked="state.includeTechniqueExplanation"
            @change="$emit('toggle-guide', $event.target.checked)"
          />
          <span>{{ t('includeTechniqueGuide') }}</span>
        </label>
      </details>
      <div id="paper-preview" ref="paperPreview"></div>
    </aside>
  `
});
