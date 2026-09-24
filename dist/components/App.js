import { computed, defineComponent, nextTick, onBeforeUnmount, onMounted, reactive, ref, toRaw, watch } from '../vendor/vue.esm-browser.prod.js';
import { elements, drawSheet, drawTechniqueGuide, createPDF, validateHike, blankHike, pageCount, documentPageCount, hikeTechniques, stepNumbers, rotateStep, landmarkTypes, sidedLandmarkTypes, roadArms, landmarkArms, roadCount, translate, elementName, groupName, landmarkName, serializeHike, parseHike } from '../hike-sheet.js';
import { refreshIcons } from '../icons.js';
import HikeEditor from './HikeEditor.js';
import Toolbar from './Toolbar.js';
import StepLibrary from './StepLibrary.js';
import PreviewPanel from './PreviewPanel.js';

const $ = selector => document.querySelector(selector);
const escapeHTML = text => String(text).replace(/[&<>"']/g, character => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[character]));
const readPhoto = (file, done, invalid) => { const type = file?.type === 'image/png' || /\.png$/i.test(file?.name ?? '') ? 'image/png' : file?.type === 'image/jpeg' || file?.type === 'image/jpg' || /\.jpe?g$/i.test(file?.name ?? '') ? 'image/jpeg' : null; if (!type) return invalid?.(); const reader = new FileReader(); reader.onload = () => done(String(reader.result).replace(/^data:[^;]+;/, `data:${type};`)); reader.readAsDataURL(file); };
const updateStripkaartPoint = (point, side, value, road) => { if (road === undefined) { point[side] = Number(value); point.faintRoads = point.faintRoads.filter(id => !id.startsWith(`${side}-`) || Number(id.slice(side.length + 1)) < point[side]); return; } const id = `${side}-${road}`; point.faintRoads = value ? [...new Set([...point.faintRoads, id])] : point.faintRoads.filter(item => item !== id); };

export default defineComponent({
  components: { Toolbar, HikeEditor, StepLibrary, PreviewPanel },
  setup() {
    const language = ref('nl'); try { const saved = localStorage.getItem('trailnote-language'); if (['en', 'nl'].includes(saved)) language.value = saved; } catch {}
    const t = (key, values) => translate(language.value, key, values); let storageWarning = '';
    const defaultHike = number => ({ ...blankHike(), title: t('hikeSlot', { number }) });
    const emptyHikeEntry = (id, hike = defaultHike(1)) => ({ id, title: hike.title || t('hikeSlot', { number: 1 }), hike: serializeHike({ ...hike, title: hike.title || t('hikeSlot', { number: 1 }) }) });
    const hikeStore = reactive({ version: 1, activeId: 'hike-1', hikes: { 'hike-1': emptyHikeEntry('hike-1') } });
    try {
      const stored = localStorage.getItem('trailnote-hikes-v1');
      if (stored) {
        const parsed = JSON.parse(stored), hikes = Object.fromEntries(Object.entries(parsed.hikes ?? {}).filter(([, entry]) => entry?.id && typeof entry.hike === 'string').map(([id, entry], index) => { const hike = parseHike(entry.hike), title = entry.title || hike.title || t('hikeSlot', { number: index + 1 }); return [id, { id, title, hike: serializeHike({ ...hike, title }) }]; }));
        if (Object.keys(hikes).length) { hikeStore.hikes = hikes; hikeStore.activeId = hikes[parsed.activeId]?.id || Object.keys(hikes)[0]; }
      }
    } catch { storageWarning = t('loadFailed'); }
    const activeHike = hikeStore.hikes[hikeStore.activeId] || hikeStore.hikes[Object.keys(hikeStore.hikes)[0]];
    hikeStore.activeId = activeHike.id;
    const state = reactive(parseHike(activeHike.hike));
    const history = ref([]), toastMessage = ref(''), toastVisible = ref(false), pdfBusy = ref(false), libraryOpen = ref(false), libraryDialog = ref(null), printOutput = ref(null), toastTimer = ref(null), saveTimer = ref(null), insertIndex = ref(0);
    const draft = reactive({ technique: 'junction', roadCount: 3, selectedJunctionLayout: '', bearing: 0, numerator: 3, denominator: 4, quizQuestion: '', quizAnswers: ['', ''], inputValue: '', inputNumbered: true, time: '12:00', photo: '', photoNumbered: true, photoColumns: 1, stripkaartEndMarker: 'arrow', stripkaartPoints: [{ left: 1, right: 1, faintRoads: [] }] });
    const activeHikeId = ref(hikeStore.activeId), hikeOptions = computed(() => Object.values(hikeStore.hikes)), pageCountValue = computed(() => documentPageCount(state)), canUndo = computed(() => history.value.length > 0), snapshot = () => structuredClone(toRaw(state));
    const notify = message => { toastMessage.value = message; toastVisible.value = true; clearTimeout(toastTimer.value); toastTimer.value = setTimeout(() => { toastVisible.value = false; }, 3000); };
    let hikeSelect, deleteHikeButton, hikeTitleInput;
    const renderHikePicker = () => { if (!hikeSelect) return; const hikes = Object.values(hikeStore.hikes); hikeSelect.replaceChildren(); hikes.forEach(hike => { const option = document.createElement('option'); option.value = hike.id; option.textContent = hike.title; hikeSelect.append(option); }); hikeSelect.value = activeHikeId.value; if (hikeTitleInput) hikeTitleInput.placeholder = hikeStore.hikes[activeHikeId.value]?.title || t('hikeSlot', { number: 1 }); if (deleteHikeButton) deleteHikeButton.disabled = false; };
    const save = () => { try { const hike = snapshot(); hikeStore.hikes[activeHikeId.value] = { id: activeHikeId.value, title: hike.title || '', hike: serializeHike(hike) }; hikeStore.activeId = activeHikeId.value; localStorage.setItem('trailnote-hikes-v1', JSON.stringify(hikeStore)); renderHikePicker(); } catch { notify(t('saveFailed')); } };
    const saveLater = () => { clearTimeout(saveTimer.value); saveTimer.value = setTimeout(save, 250); };
    const remember = () => { history.value.push(snapshot()); if (history.value.length > 50) history.value.shift(); };
    const focus = selector => nextTick(() => $(selector)?.focus());
    const replaceState = next => Object.assign(state, next);
    const applyLanguage = () => { document.documentElement.lang = language.value; document.title = t('meta.title'); const meta = $('meta[name="description"]'); if (meta) meta.content = t('meta.description'); };
    const resetDraft = () => Object.assign(draft, { technique: 'junction', roadCount: 3, selectedJunctionLayout: '', bearing: 0, numerator: 3, denominator: 4, quizQuestion: '', quizAnswers: ['', ''], inputValue: '', inputNumbered: true, time: '12:00', photo: '', photoNumbered: true, photoColumns: 1, stripkaartEndMarker: 'arrow', stripkaartPoints: [{ left: 1, right: 1, faintRoads: [] }] });
    const openLibrary = index => { insertIndex.value = index; resetDraft(); libraryOpen.value = true; };
    const closeLibrary = () => { libraryOpen.value = false; };
    const updateDraft = ({ field, value, index, side, road }) => { if (field === 'quizAnswer') draft.quizAnswers[index] = value; else if (field === 'addQuizAnswer') draft.quizAnswers.push(''); else if (field === 'removeQuizAnswer' && draft.quizAnswers.length > 2) draft.quizAnswers.splice(index, 1); else if (field === 'stripkaart-point-left' || field === 'stripkaart-point-right') updateStripkaartPoint(draft.stripkaartPoints[index], field.endsWith('left') ? 'left' : 'right', value); else if (field === 'stripkaart-point-faint') updateStripkaartPoint(draft.stripkaartPoints[index], side, value, road); else if (field === 'stripkaart-add' && draft.stripkaartPoints.length < 50) draft.stripkaartPoints.push({ left: 1, right: 1, faintRoads: [] }); else if (field === 'stripkaart-remove' && draft.stripkaartPoints.length > 1) draft.stripkaartPoints.splice(index, 1); else draft[field] = ['roadCount', 'bearing', 'numerator', 'denominator'].includes(field) ? Number(value) : value; };
    const addLibraryStep = request => { if (request.close) return closeLibrary(); const query = selector => libraryDialog.value?.querySelector(selector); if (request.technique === 'compass' || draft.technique === 'compass') { const input = query('#compass-bearing'); if (input && !input.checkValidity()) return input.reportValidity(); } if (request.technique === 'fraction' || draft.technique === 'fraction') { const numerator = query('#fraction-numerator'), denominator = query('#fraction-denominator'); if (numerator && (!numerator.checkValidity() || !denominator.checkValidity())) return (query('#fraction-numerator:invalid') || query('#fraction-denominator:invalid')).reportValidity(); } if (request.technique === 'quiz' || draft.technique === 'quiz') { if (!draft.quizQuestion.trim() || !draft.quizAnswers.every(answer => answer.trim())) { const input = query('[data-field="question"]'); input?.setCustomValidity(t('quiz.required')); input?.reportValidity(); return; } } if (request.technique === 'photo' || draft.technique === 'photo') { if (!draft.photo) return notify(t('photo.invalid')); } const step = request.technique === 'quiz' || draft.technique === 'quiz' ? { technique: 'quiz', question: draft.quizQuestion, answers: [...draft.quizAnswers], note: '', distance: '' } : request.technique === 'input' || draft.technique === 'input' ? { technique: 'input', value: draft.inputValue, numbered: draft.inputNumbered, note: '', distance: '' } : request.technique === 'photo' || draft.technique === 'photo' ? { technique: 'photo', image: draft.photo, columns: draft.photoColumns, numbered: draft.photoNumbered, note: '', distance: '' } : request.technique === 'compass' || draft.technique === 'compass' ? { technique: 'compass', bearing: draft.bearing, note: '', distance: '' } : request.technique === 'clock' || draft.technique === 'clock' ? { technique:'clock', time: draft.time, note: '', distance: '' } : request.technique === 'fraction' || draft.technique === 'fraction' ? { technique: 'fraction', numerator: draft.numerator, denominator: draft.denominator, note: '', distance: '' } : request.technique === 'stripkaart' || draft.technique === 'stripkaart' ? { technique: 'stripkaart', endMarker: draft.stripkaartEndMarker, points: draft.stripkaartPoints.map(point => ({ left: point.left, right: point.right, faintRoads: [...point.faintRoads] })), note: '', distance: '' } : request.technique ? { technique: request.technique, rotation: request.rotation, distance: '', note: '' } : { element: request.element, distance: '', note: '' }; const nextSteps = snapshot().steps; nextSteps.splice(insertIndex.value, 0, step); remember(); replaceState(validateHike({ ...snapshot(), steps: nextSteps })); closeLibrary(); save(); notify(t('added', { number: stepNumbers(state)[insertIndex.value] ?? t('step.unnumbered') })); };
    const libraryPhoto = file => readPhoto(file, image => { draft.photo = image; }, () => notify(t('photo.invalid')));
    const fieldInput = payload => { if (['title', 'start', 'finish'].includes(payload.field)) { state[payload.field] = payload.value; return saveLater(); } const { index, field, value, element, answerIndex, pointIndex, side, road } = payload, step = state.steps[index]; if (!step) return; if (field === 'stripkaart-point' || field === 'stripkaart-point-faint') { updateStripkaartPoint(step.points[pointIndex], side, value, field === 'stripkaart-point-faint' ? road : undefined); return saveLater(); } if (field === 'question') { step.question = value; element?.setCustomValidity(value.trim() ? '' : t('quiz.required')); return saveLater(); } if (field === 'answer') { step.answers[answerIndex] = value; element?.setCustomValidity(value.trim() ? '' : t('quiz.required')); return saveLater(); } if (['distance', 'bearing', 'time', 'numerator', 'denominator'].includes(field) && element && !element.checkValidity()) return element.reportValidity(); step[field] = ['bearing', 'numerator', 'denominator'].includes(field) ? Number(value) : field === 'distance' && value !== '' ? String(Number(value)) : value; if (field === 'denominator') step.numerator = Math.min(step.numerator, step.denominator); saveLater(); };
    const stepChange = payload => { const step = state.steps[payload.index]; if (!step) return; remember(); if (payload.type === 'numbered') step.numbered = payload.value; if (payload.type === 'photo-columns') step.columns = payload.value; if (payload.type === 'faint-arm') { const arms = new Set(step.faintArms); payload.value ? arms.add(payload.arm) : arms.delete(payload.arm); step.faintArms = [...arms]; } save(); };
    const landmarkUpdate = payload => { const updated = snapshot(), placement = updated.steps[payload.index]?.landmarks[payload.placementIndex]; if (!placement) return; if (payload.field === 'position') { const [arm, side] = payload.value.split(':'); placement.arm = arm; placement.side = side; } else placement[payload.field] = payload.value; try { remember(); replaceState(validateHike(updated)); save(); focus(`[data-landmark-field="${payload.field}"][data-index="${payload.index}"][data-landmark="${payload.placementIndex}"]`); } catch (error) { notify(error.message); } };
    const stepAction = ({ action, index, answerIndex, landmark, pointIndex }) => { const step = state.steps[index]; if (!step) return; if (action === 'duplicate' && state.steps.length >= 300) return notify(t('stepLimit')); if (action === "duplicate" && !window.confirm(t("duplicateConfirm", { number: index + 1 }))) return; if (action === "delete" && !window.confirm(t("removeConfirm", { number: index + 1 }))) return; remember(); if (action === 'delete') { state.steps.splice(index, 1); notify(t('removed')); } else if (action === 'duplicate') { state.steps.splice(index + 1, 0, structuredClone(toRaw(step))); notify(t('duplicated', { number: stepNumbers(state)[index + 1] ?? t('step.unnumbered') })); } else if (action === 'quiz-add' && step.answers.length < 6) step.answers.push(''); else if (action === 'quiz-remove' && step.answers.length > 2) step.answers.splice(answerIndex, 1); else if (action === 'stripkaart-add' && step.points.length < 50) step.points.push({ left: 1, right: 1, faintRoads: [] }); else if (action === 'stripkaart-remove' && step.points.length > 1) step.points.splice(pointIndex, 1); else if (action === 'landmark-add') { const arms = landmarkArms(elements.find(element => element.id === step.element), step.landmarks), arm = arms.find(item => !step.landmarks.some(placement => !sidedLandmarkTypes.includes(placement.type) && placement.arm === item.id)); if (arm) step.landmarks.push({ type: 'bridge', arm: arm.id }); else { const slot = arms.flatMap(item => ['left', 'right'].map(side => ({ item, side }))).find(({ item, side }) => !step.landmarks.some(placement => sidedLandmarkTypes.includes(placement.type) && placement.arm === item.id && (placement.side ?? 'right') === side)); if (slot) step.landmarks.push({ type: 'parking', arm: slot.item.id, side: slot.side }); } } else if (action === 'landmark-remove') step.landmarks.splice(landmark, 1); else if (action.startsWith('rotate-')) rotateStep(step, action === 'rotate-right' ? 45 : -45); else { const target = index + (action === 'up' ? -1 : 1); if (target < 0 || target >= state.steps.length) return; [state.steps[index], state.steps[target]] = [state.steps[target], state.steps[index]]; } save(); const newIndex = action === 'delete' ? Math.min(index, state.steps.length - 1) : action === 'up' ? index - 1 : ['down', 'duplicate'].includes(action) ? index + 1 : index; nextTick(() => { const selector = action === 'landmark-add' ? `[data-landmark-field="type"][data-index="${index}"][data-landmark="${state.steps[index].landmarks.length - 1}"]` : `[data-action="${action}"][data-index="${newIndex}"]`; const target = $(selector); if (target && !target.disabled) target.focus(); else $('#undo')?.focus(); }); };
    const stepPhoto = ({ index, file }) => readPhoto(file, image => { remember(); state.steps[index].image = image; save(); }, () => notify(t('photo.invalid')));
    const undo = () => { if (!history.value.length) return; replaceState(history.value.pop()); save(); notify(t('undone')); };
    const switchHike = id => { if (!hikeStore.hikes[id] || id === activeHikeId.value) return; save(); const hike = parseHike(hikeStore.hikes[id].hike); remember(); activeHikeId.value = id; hikeStore.activeId = id; replaceState(hike); history.value = []; save(); focus('#hike-title'); };
    const nextHikeNumber = () => Math.max(0, ...Object.values(hikeStore.hikes).map(hike => Number(hike.title.match(/^Hike (\d+)$/)?.[1] || 0))) + 1;
    const newHike = () => { if (hikeOptions.value.length >= 3) return notify(t('newHikeLimit')); save(); const id = `hike-${Date.now()}-${hikeOptions.value.length + 1}`, hike = defaultHike(nextHikeNumber()); hikeStore.hikes[id] = emptyHikeEntry(id, hike); activeHikeId.value = id; hikeStore.activeId = id; history.value = []; replaceState(hike); save(); notify(t('newReady')); focus('#hike-title'); };
    const deleteHike = () => { const hikeIndex = Object.keys(hikeStore.hikes).indexOf(activeHikeId.value), hikeTitle = hikeStore.hikes[activeHikeId.value]?.title || t('hikeSlot', { number: hikeIndex + 1 }); if (!window.confirm(t(hikeOptions.value.length === 1 ? 'resetHikeConfirm' : 'deleteHikeConfirm', { hikeTitle }))) return; if (hikeOptions.value.length === 1) { remember(); replaceState(defaultHike(1)); history.value = []; save(); notify(t('newReady')); focus('#hike-title'); return; } save(); delete hikeStore.hikes[activeHikeId.value]; const id = Object.keys(hikeStore.hikes)[0]; activeHikeId.value = id; hikeStore.activeId = id; history.value = []; replaceState(parseHike(hikeStore.hikes[id].hike)); save(); focus('#hike-title'); };
    const importHike = async (file, input) => { if (!file) return; try { if (hikeOptions.value.length >= 3) return notify(t('importHikeLimit')); const imported = parseHike(await file.text()), hikeNumber = nextHikeNumber(), hike = { ...imported, title: imported.title || t('hikeSlot', { number: hikeNumber }) }; save(); const id = `hike-${Date.now()}-${hikeOptions.value.length + 1}`; hikeStore.hikes[id] = emptyHikeEntry(id, hike); activeHikeId.value = id; hikeStore.activeId = id; history.value = []; replaceState(hike); save(); notify(t('hikeImported')); } catch (error) { notify(t('hikeImportFailed', { error: error.message })); } finally { input.value = ''; } };
    const exportJSON = () => { const link = document.createElement('a'), url = URL.createObjectURL(new Blob([serializeHike(snapshot())], { type: 'application/json' })); link.href = url; link.download = `${state.title || 'hike'}.json`.replace(/[\/:*?"<>|]/g, '-'); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); notify(t('hikeExported')); };
    const exportPDF = async () => { const invalid = $('#hike-steps :invalid'); if (invalid) return invalid.reportValidity(); pdfBusy.value = true; try { const hike = snapshot(), bytes = await createPDF(hike, () => document.createElement('canvas'), Path2D, language.value), link = document.createElement('a'), url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' })); link.href = url; link.download = `${hike.title || 'hike'}.pdf`.replace(/[\/:*?"<>|]/g, '-'); document.body.append(link); link.click(); link.remove(); setTimeout(() => URL.revokeObjectURL(url), 60000); notify(t('pdfReady')); } catch (error) { notify(t('pdfFailed', { error: error.message })); } finally { pdfBusy.value = false; } };
    const renderPrint = () => { const hike = snapshot(); printOutput.value.replaceChildren(); if (hike.includeTechniqueExplanation && hikeTechniques(hike).length) { const canvas = drawTechniqueGuide(document.createElement('canvas'), hike, 12, Path2D, language.value); canvas.className = 'paper'; printOutput.value.append(canvas); } for (let index = 0; index < pageCount(hike); index++) { const canvas = drawSheet(document.createElement('canvas'), hike, index, 12, Path2D, language.value); canvas.className = 'paper'; printOutput.value.append(canvas); } };
    const registerTools = () => { const context = document.modelContext; if (!context?.registerTool) return; const lifecycle = new AbortController(); const tools = [{ name: 'read_hike', description: 'Read the current hike and the available intersection IDs.', inputSchema: { type: 'object', properties: {}, additionalProperties: false }, annotations: { readOnlyHint: true }, execute: () => ({ language: language.value, hike: snapshot(), elements: elements.map(element => ({ id: element.id, roadCount: roadCount(element), group: groupName(element, language.value), name: elementName(element, language.value), arms: roadArms(element).map(arm => arm.id), landmarkArms: landmarkArms(element).map(arm => arm.id) })), landmarkTypes: landmarkTypes.map(type => ({ id: type.id, name: landmarkName(type, language.value) })), pages: documentPageCount(state) }) }, { name: 'append_intersections', description: 'Append a batch of intersection instructions to the current hike. Updates the editor and this device-local draft.', inputSchema: { type: 'object', properties: { steps: { type: 'array', minItems: 1, maxItems: 300, items: { type: 'object', properties: { element: { type: 'string', enum: elements.map(element => element.id) }, note: { type: 'string', maxLength: 160 }, rotation: { type: 'integer', enum: [0, 45, 90, 135, 180, 225, 270, 315] }, faintArms: { type: 'array', maxItems: 6, uniqueItems: true, items: { type: 'string', enum: [...new Set(elements.flatMap(element => roadArms(element).map(arm => arm.id)))] } }, landmarks: { type: 'array', maxItems: 18, items: { type: 'object', properties: { type: { type: 'string', enum: landmarkTypes.map(type => type.id) }, arm: { type: 'string', enum: [...new Set(elements.flatMap(element => [...roadArms(element), ...landmarkArms(element)].map(arm => arm.id)))] }, side: { type: 'string', enum: ['left', 'right'] } }, required: ['type', 'arm'], additionalProperties: false } }, distance: { type: 'string', pattern: '^(|[0-9]{1,6})$' } }, required: ['element'], additionalProperties: false } } }, required: ['steps'], additionalProperties: false }, annotations: { readOnlyHint: false }, execute: input => { if (!input || !Array.isArray(input.steps) || !input.steps.length) throw Error('Provide at least one intersection.'); const steps = input.steps.map(step => ({ element: step?.element, note: step?.note ?? '', distance: step?.distance ?? '', rotation: step?.rotation === undefined ? 0 : step.rotation, faintArms: step?.faintArms === undefined ? [] : step.faintArms, landmarks: step?.landmarks === undefined ? [] : step.landmarks })); const nextSteps = snapshot().steps.concat(steps); remember(); replaceState(validateHike({ ...snapshot(), steps: nextSteps })); save(); return { steps: state.steps.length, pages: documentPageCount(state) }; } }]; for (const tool of tools) { try { Promise.resolve(context.registerTool(tool, { signal: lifecycle.signal })).catch(() => {}); } catch {} } return () => lifecycle.abort(); };
    let unregisterTools;
    watch(language, value => { try { localStorage.setItem('trailnote-language', value); } catch {} applyLanguage(); if (hikeSelect) { hikeSelect.setAttribute('aria-label', t('hikeEditor')); renderHikePicker(); } });
    watch(libraryOpen, value => nextTick(() => { const dialog = libraryDialog.value; if (!dialog) return; if (value && !dialog.open) dialog.showModal(); if (!value && dialog.open) dialog.close(); }));
    onMounted(() => { applyLanguage(); hikeTitleInput = $('#hike-title'); const actions = $('.top-actions'); if (actions) { hikeSelect = document.createElement('select'); hikeSelect.id = 'hike-select'; hikeSelect.className = 'hike-select'; hikeSelect.setAttribute('aria-label', t('hikeEditor')); hikeSelect.addEventListener('change', event => switchHike(event.target.value)); deleteHikeButton = document.createElement('button'); deleteHikeButton.type = 'button'; deleteHikeButton.id = 'delete-hike'; deleteHikeButton.className = 'button quiet top-icon-button'; deleteHikeButton.innerHTML = '<i data-lucide="trash-2" aria-hidden="true"></i>'; deleteHikeButton.title = t('deleteHike'); deleteHikeButton.setAttribute('aria-label', t('deleteHike')); deleteHikeButton.addEventListener('click', deleteHike); actions.append(hikeSelect, $('#new-hike'), deleteHikeButton, $('#undo'), $('#import-json'), $('#export-json'), $('.language-picker'), $('#export')); renderHikePicker(); nextTick(refreshIcons); } unregisterTools = registerTools(); window.addEventListener('beforeprint', renderPrint); window.addEventListener('pagehide', save); if (storageWarning) notify(storageWarning); });
    onBeforeUnmount(() => { unregisterTools?.(); window.removeEventListener('beforeprint', renderPrint); window.removeEventListener('pagehide', save); clearTimeout(toastTimer.value); clearTimeout(saveTimer.value); });
    return { state, language, t, draft, canUndo, pdfBusy, libraryOpen, libraryDialog, printOutput, toastMessage, toastVisible, pageCountValue, updateDraft, addLibraryStep, libraryPhoto, openLibrary, closeLibrary, fieldInput, stepChange, landmarkUpdate, stepAction, stepPhoto, undo, newHike, importHike, exportJSON, exportPDF, toggleGuide: value => { remember(); state.includeTechniqueExplanation = value; save(); }, setLanguage: value => { language.value = value; } };
  },
  template: `
    <div>
      <div class="app-shell">
        <Toolbar
          :language="language"
          :has-steps="state.steps.length > 0"
          :can-undo="canUndo"
          :pdf-busy="pdfBusy"
          :t="t"
          @language-change="setLanguage"
          @undo="undo"
          @new-hike="newHike"
          @import="importHike"
          @export-json="exportJSON"
          @export-pdf="exportPDF"
        />
        <main class="workspace">
          <HikeEditor
            :state="state"
            :language="language"
            :t="t"
            :page-count="pageCountValue"
            @open-library="openLibrary"
            @step-action="stepAction"
            @field-input="fieldInput"
            @change="stepChange"
            @photo="stepPhoto"
            @remember="remember"
            @landmark-update="landmarkUpdate"
          />
          <PreviewPanel :state="state" :language="language" :t="t" @toggle-guide="toggleGuide" />
        </main>
        <footer class="app-footer footer" aria-label="Credits">
          <span class="credits-links">
            <a
              class="credits-link"
              href="https://www.linkedin.com/in/wouter-van-der-ven/"
              target="_blank"
              rel="noreferrer"
              aria-label="LinkedIn"
            >
              <svg class="credits-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.13 1.44-2.13 2.94v5.67H9.35V8.99h3.42v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.61 0 4.28 2.38 4.28 5.47v6.28zM5.34 7.43a2.07 2.07 0 1 1 0-4.14 2.07 2.07 0 0 1 0 4.14zM3.56 20.45h3.57V8.99H3.56v11.46z"
                />
              </svg>
            </a>
            <a
              class="credits-link"
              href="https://github.com/vandervenwouter/hike-generator"
              target="_blank"
              rel="noreferrer"
              aria-label="GitHub repository"
            >
              <svg class="credits-icon" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M12 .5a12 12 0 0 0-3.79 23.39c.6.11.82-.26.82-.58v-2.25c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.75.08-.74.08-.74 1.2.08 1.84 1.23 1.84 1.23 1.07 1.83 2.81 1.3 3.5.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.31.47-2.38 1.23-3.22-.12-.3-.53-1.52.12-3.17 0 0 1-.32 3.3 1.23a11.46 11.46 0 0 1 6 0c2.3-1.55 3.3-1.23 3.3-1.23.65 1.65.24 2.87.12 3.17.76.84 1.23 1.91 1.23 3.22 0 4.62-2.81 5.65-5.49 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.69.83.57A12 12 0 0 0 12 .5z"
                />
              </svg>
            </a>
          </span>
        </footer>
      </div>
      <dialog
        id="element-dialog"
        ref="libraryDialog"
        class="library-dialog"
        aria-labelledby="library-title"
        @close="libraryOpen = false"
        @click.self="closeLibrary"
      >
        <StepLibrary
          :draft="draft"
          :language="language"
          :t="t"
          @update="updateDraft"
          @add="addLibraryStep"
          @photo="libraryPhoto"
        />
      </dialog>
      <section id="print-output" ref="printOutput" :aria-label="t('printableHike')"></section>
      <div id="toast" class="toast" role="status" aria-live="polite" :class="{ visible: toastVisible }">
        {{ toastMessage }}
      </div>
    </div>
  `
});
