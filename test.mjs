import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as routeSheet from './dist/route-sheet.js';
import {quizLetter,routePages,stepNumbers,createPDF,junctionLayoutKey,mirroredJunctionLayoutKey,junctionLateralBias} from './dist/route-sheet.js';
import {elements,blankRoute,validateRoute,pageCount,documentPageCount,routeTechniques,stepsPerPage,rotateStep,roadArms,landmarkArms,roadCount,roadArmLabel,landmarkTypes,sidedLandmarkTypes,junctionLayers,junctionOffset,junctionDiagramScale,junctionCardHeight,compassLayers,dotArrowDirections,dotArrowShapes,dotArrowShape,dotArrowLayers,eyesLayers,layerRotation,translations,translate,elementName,groupName,landmarkName,serializeRoute,parseRoute,drawSheet,drawTechniqueGuide,bridgeGeometry,parkingGeometry,waterGeometry} from './dist/route-sheet.js';

const lucide=createRequire(import.meta.url)('./dist/vendor/lucide.js');
for(const name of ['Signpost','Moon','Sun','Undo2','FilePlus2','FileUp','FileJson2','FileDown','FileText','ListOrdered','Copy','ArrowUp','Navigation','Route','Compass','Divide','ArrowLeft','Flag','ArrowUpRight','Camera','Plus','Check','Trash2','RotateCcw','RotateCw','ArrowDown','ChevronDown','Settings2','X'])assert.ok(lucide[name],`Missing Lucide icon: ${name}`);

const route=blankRoute();
assert.equal(pageCount(route),1);
assert.equal(documentPageCount(route),1);
assert.equal(new Set(elements.map(e=>e.id)).size,elements.length);
assert.deepEqual([...new Set(elements.map(roadCount))].sort(),[2,3,4,5,6],'The intersection chooser must offer every supported road count');
// KRUISPUNTEN.md: the complete approach dot must remain visible after every rotation.
for(const element of elements){
  const layers=junctionLayers(element),dot=layers.at(-1),scale=dot.scale??1;
  const start=element.route.match(/^M(-?[\d.]+) (-?[\d.]+)/);
  const routeLayer=layers.find(layer=>layer.path===element.route);
  const radius=Number(dot.path.match(/a([\d.]+) /)[1])*scale;
  const arrow=layers.find(layer=>layer.path===element.arrow),roads=layers.filter(layer=>layer.road);
  assert.ok(Math.abs(routeLayer.width*(routeLayer.scale??1)-2.5)<1e-9,`${element.id}: route ink must have the same visible width at every zoom`);
  assert.ok(roads.some(layer=>layer.path===element.roads&&layer.color==='#fff'&&layer.width*(layer.scale??1)>=20),`${element.id}: the road interior must remain white`);
  const roadBase=roads.filter(layer=>layer.path===element.roads);
  assert.ok(roadBase.some(layer=>layer.color==='#000000')?Math.abs((roadBase.find(layer=>layer.color==='#000000').width-roadBase.find(layer=>layer.color==='#fff').width)*(roadBase[0].scale??1)/2-1)<1e-9:roads.some(layer=>Math.abs(layer.width*(layer.scale??1)-1)<1e-9),`${element.id}: road edges must retain their one-unit ink width`);
  assert.equal(radius,3,`${element.id}: approach dots must have the same visible radius`);
  assert.equal(arrow.path,'M-4.5 -2L0 0L-4.5 2','Every junction must use the same arrowhead geometry');
  assert.equal(arrow.scale,1,'Arrowheads must keep their size when the road geometry shrinks');
  assert.equal(arrow.width,2.5);
  assert.equal(dot.fill,'#000000',`${element.id}: a route needs a filled approach dot`);
  assert.ok(Math.hypot(dot.x-((routeLayer.x??0)+Number(start[1])*(routeLayer.scale??1)),dot.y-((routeLayer.y??0)+Number(start[2])*(routeLayer.scale??1)))<.01,`${element.id}: the dot must be centred on the route start`);
  for(let rotation=0;rotation<360;rotation+=45){
    const angle=rotation*Math.PI/180,x=50+(dot.x-50)*Math.cos(angle)-(dot.y-50)*Math.sin(angle),y=50+(dot.x-50)*Math.sin(angle)+(dot.y-50)*Math.cos(angle);
    assert.ok(Math.min(x-radius,y-radius)>=3&&Math.max(x+radius,y+radius)<=97,`${element.id} at ${rotation}°: the complete dot needs at least 3 units of canvas padding`);
    const direction=angle+arrow.angle*Math.PI/180;
    for(const vertex of arrow.path.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)){
      const px=50+(arrow.x-50)*Math.cos(angle)-(arrow.y-50)*Math.sin(angle)+Number(vertex[1])*Math.cos(direction)-Number(vertex[2])*Math.sin(direction);
      const py=50+(arrow.x-50)*Math.sin(angle)+(arrow.y-50)*Math.cos(angle)+Number(vertex[1])*Math.sin(direction)+Number(vertex[2])*Math.cos(direction);
      assert.ok(Math.min(px,py)-arrow.width/2>=0&&Math.max(px,py)+arrow.width/2<=100,`${element.id} at ${rotation}°: the complete arrowhead must stay in view`);
    }
  }
}
for(const element of elements){route.steps.push({element:element.id,note:'After the bridge',distance:'200',rotation:0,faintArms:[],landmarks:[]});}
assert.deepEqual(validateRoute(route),route);
assert.deepEqual(parseRoute(serializeRoute(route)),route,'Exported routes must survive an import round trip');
assert.deepEqual(parseRoute(JSON.stringify(route)),route,'Raw route JSON must remain importable');
const compassRoute={...blankRoute(),steps:[{technique:'compass',bearing:237,note:'Walk on this bearing',distance:''}]};
assert.deepEqual(validateRoute(compassRoute),compassRoute,'A compass bearing must be a complete route item');
assert.deepEqual(parseRoute(serializeRoute(compassRoute)),compassRoute,'Compass items must survive export and import');
for(const bearing of [-1,360,1.5,'90',null])assert.throws(()=>validateRoute({...compassRoute,steps:[{...compassRoute.steps[0],bearing}]}));
assert.throws(()=>validateRoute({...compassRoute,steps:[{...compassRoute.steps[0],technique:'unknown'}]}));
assert.notEqual(compassLayers(0).at(-1).path,compassLayers(90).at(-1).path,'The compass arrow must follow the selected bearing');
assert.ok(compassLayers(359).every(layer=>Number.isFinite(layer.width)&&layer.color==='#000000'),'Compass lines must use the route ink color');
const fractionRoute={...blankRoute(),steps:[{technique:'fraction',numerator:3,denominator:4,note:'Third road out of four',distance:''}]};
const inputRoute={...blankRoute(),steps:[{technique:'input',value:'Steek nu het zebrapad over',numbered:true,note:'',distance:''}]};
const photoData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const photoRoute={...blankRoute(),steps:[{technique:'photo',image:photoData,columns:1,numbered:true,note:'Look for this landmark',distance:''}]};
assert.equal(translate('nl','technique.input'),'Vrije tekst');
assert.equal(translate('nl','technique.junction'),'Kruispunten');
assert.equal(translate('nl','technique.photo'),'Foto');
assert.equal(translate('nl','startPlaceholder'),'Opmerking bij het startpunt');
assert.equal(translate('nl','finish'),'EIND');
assert.equal(translate('nl','finishPlaceholder'),'Opmerking bij het eindpunt');
assert.deepEqual(validateRoute(inputRoute),inputRoute,'Free text steps must be complete route items');
assert.deepEqual(parseRoute(serializeRoute(inputRoute)),inputRoute,'Free text must survive export and import');
assert.deepEqual(validateRoute({...inputRoute,steps:[{...inputRoute.steps[0],numbered:undefined}]}),inputRoute,'Existing free text must remain numbered');
const unnumberedInput={...inputRoute.steps[0],numbered:false};
assert.deepEqual(parseRoute(serializeRoute({...inputRoute,steps:[unnumberedInput]})).steps[0],unnumberedInput,'Unnumbered text must survive export and import');
for(const numbered of [null,0,1,'false'])assert.throws(()=>validateRoute({...inputRoute,steps:[{...inputRoute.steps[0],numbered}]}));
assert.deepEqual(stepNumbers(blankRoute()),[]);
assert.deepEqual(stepNumbers({...inputRoute,steps:[unnumberedInput,unnumberedInput]}),[null,null],'A route may consist entirely of unnumbered text');
assert.deepEqual(stepNumbers({...compassRoute,steps:[{...compassRoute.steps[0],numbered:false}]}),[1],'Other route techniques must still count in numbering');
for(const value of [null,42,'x'.repeat(161)])assert.throws(()=>validateRoute({...inputRoute,steps:[{...inputRoute.steps[0],value}]}));
assert.deepEqual(validateRoute(photoRoute),photoRoute,'Photo steps must be complete route items');
assert.deepEqual(parseRoute(serializeRoute(photoRoute)),photoRoute,'Photos must survive export and import');
assert.deepEqual(validateRoute({...photoRoute,steps:[{...photoRoute.steps[0],numbered:undefined}]}),photoRoute,'Existing photos must remain numbered');
for(const numbered of [null,0,1,'false'])assert.throws(()=>validateRoute({...photoRoute,steps:[{...photoRoute.steps[0],numbered}]}));
const unnumberedPhoto={...photoRoute.steps[0],numbered:false};
assert.deepEqual(stepNumbers({...photoRoute,steps:[unnumberedPhoto,unnumberedInput,photoRoute.steps[0],compassRoute.steps[0]]}),[null,null,1,2],'Photos and text must share the same numbering rules');
assert.deepEqual(validateRoute({...photoRoute,steps:[{...photoRoute.steps[0],columns:undefined}]}),photoRoute,'Existing photos must default to one column');
for(const columns of [1,2,3]){
  const sizedPhoto={...photoRoute,steps:[{...photoRoute.steps[0],columns}]};
  assert.deepEqual(parseRoute(serializeRoute(sizedPhoto)),sizedPhoto,'Photo widths must survive export and import');
  const unnumbered={...photoRoute,steps:[{...unnumberedPhoto,columns}]};
  assert.deepEqual(parseRoute(serializeRoute(unnumbered)),unnumbered,'All photo widths must retain their numbering option');
}
for(const columns of [0,4,-1,1.5,'2',null])assert.throws(()=>validateRoute({...photoRoute,steps:[{...photoRoute.steps[0],columns}]}));
for(const image of ['', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'data:image/png;base64,not base64'])assert.throws(()=>validateRoute({...photoRoute,steps:[{...photoRoute.steps[0],image}]}));
const quizRoute={...blankRoute(),steps:[{technique:'quiz',question:'How many legs does a spider have?',answers:['Six','Eight','Ten','Twelve'],note:'Count clockwise',distance:'200'}]};
assert.ok(lucide.CircleHelp,'The quiz technique needs its picker icon');
assert.equal(translate('nl','technique.quiz'),'Quizvraag');
assert.deepEqual(parseRoute(serializeRoute(quizRoute)),quizRoute,'Quiz questions and answer order must survive export and import');
assert.deepEqual(Array.from({length:6},(_,i)=>quizLetter(i)).join(''),'ABCDEF','Answer letters must run from A through F');
for(const fields of [{question:null},{question:'x'.repeat(161)},{answers:null},{answers:[]},{answers:['Only one']},{answers:Array(7).fill('Answer')},{answers:['Valid',42]},{answers:['Valid','x'.repeat(81)]},{answers:Array(2)}])assert.throws(()=>validateRoute({...quizRoute,steps:[{...quizRoute.steps[0],...fields}]}));
for(const count of [2,6])assert.equal(parseRoute(serializeRoute({...quizRoute,steps:[{...quizRoute.steps[0],answers:Array(count).fill('Answer')}]})).steps[0].answers.length,count,'Both quiz answer limits must survive export and import');
const unfinishedQuiz={...quizRoute,steps:[{...quizRoute.steps[0],question:'',answers:['','']}]};
assert.deepEqual(parseRoute(serializeRoute(unfinishedQuiz)),unfinishedQuiz,'Unfinished quiz edits must survive saving and reloading a draft');
await assert.rejects(()=>createPDF(unfinishedQuiz,()=>{throw Error('Must validate before rendering');},class{},'nl'),/Vul de vraag/);
assert.deepEqual(validateRoute(fractionRoute),fractionRoute,'A fraction must be a complete route item');
assert.deepEqual(parseRoute(serializeRoute(fractionRoute)),fractionRoute,'Fraction items must survive export and import');
for(const values of [{numerator:0},{numerator:5},{numerator:1.5},{numerator:'3'},{denominator:1},{denominator:100},{denominator:'4'}])assert.throws(()=>validateRoute({...fractionRoute,steps:[{...fractionRoute.steps[0],...values}]}));
const dotArrowRoute={...blankRoute(),steps:dotArrowDirections.map(rotation=>({technique:'dot-arrow',rotation,note:'Follow the arrow',distance:''}))};
const eyesRoute={...blankRoute(),steps:dotArrowDirections.map(rotation=>({technique:'eyes',rotation,note:'Follow the eyes',distance:''}))};
assert.ok(lucide.Eye,'The eyes technique needs its picker icon');
assert.equal(translate('nl','technique.eyes'),'Oogjes');
assert.deepEqual(parseRoute(serializeRoute(eyesRoute)),eyesRoute,'All eye directions must survive export and import');
assert.equal(validateRoute({...blankRoute(),steps:[{technique:'eyes',note:'',distance:''}]}).steps[0].rotation,0);
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateRoute({...eyesRoute,steps:[{...eyesRoute.steps[0],rotation}]}));
const gazeOffsets=[[0,-12],[4.95,-8.49],[7,0],[4.95,8.49],[0,12],[-4.95,8.49],[-7,0],[-4.95,-8.49]];
eyesRoute.steps.forEach((step,index)=>{
  const [outlines,pupils]=eyesLayers(step.rotation);
  assert.deepEqual(outlines,eyesLayers(0)[0],'Eyes must stay upright in every direction');
  assert.ok(pupils.x===gazeOffsets[index][0]&&pupils.y===gazeOffsets[index][1],'Both pupils must look in the selected walking direction');
});
const eyesStep=structuredClone(eyesRoute.steps[0]);
rotateStep(eyesStep,-45);assert.equal(eyesStep.rotation,315);
rotateStep(eyesStep,45);assert.equal(eyesStep.rotation,0);
assert.deepEqual(parseRoute(serializeRoute(dotArrowRoute)),dotArrowRoute,'All dot-and-arrow directions must survive export and import');
assert.equal(validateRoute({...blankRoute(),steps:[{technique:'dot-arrow',note:'',distance:''}]}).steps[0].rotation,0,'Dot and arrow should default to straight ahead');
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateRoute({...dotArrowRoute,steps:[{...dotArrowRoute.steps[0],rotation}]}));
const dotArrowShapeRoute={...blankRoute(),steps:[...dotArrowShapes,...elements].map(element=>({technique:'dot-arrow',element:element.id,rotation:90,note:'Take the marked exit',distance:''}))};
assert.deepEqual(parseRoute(serializeRoute(dotArrowShapeRoute)),dotArrowShapeRoute,'Curves and legacy shapes must retain their shape and rotation on export and import');
for(const element of ['unknown','',null,42])assert.throws(()=>validateRoute({...dotArrowRoute,steps:[{...dotArrowRoute.steps[0],element}]}));
for(const element of [...dotArrowShapes,...elements]){
  const layers=dotArrowLayers(element);
  assert.equal(layers.length,3,'Every curve and legacy shape must render only the route, arrowhead and dot');
  assert.ok(!layers.some(layer=>layer.path===element.roads),'Dot and arrow must never show side roads, including previously saved shapes');
  assert.ok(layers.some(layer=>layer.path===element.route&&Math.abs(layer.width*(layer.scale??1)-2.5)<1e-9),'The selected route should remain clearly marked');
  assert.ok(layers.some(layer=>layer.path===element.arrow),'Every layout must retain the arrow for its chosen exit');
  assert.ok(layers.at(-1).fill==='#000000'&&layers.at(-1).y>50,'The approach dot must stay below the junction');
  assert.ok(layers.every(layer=>layer.color==='#000000'&&layer.width*(layer.scale??1)<=2.5+1e-9),'Dot-and-arrow shapes should use consistent ink and stroke widths');
}
assert.equal(dotArrowShapes.length,6,'Keep retired curves readable in saved routes');
for(const shape of dotArrowShapes){
  assert.match(shape.route,/[QC]/,'Retired curves must keep their saved path');
  assert.notEqual(elementName(shape,'nl'),`element.${shape.name}`,'Every curve needs a translated name');
}
const dotArrowStep=structuredClone(dotArrowRoute.steps[0]);
rotateStep(dotArrowStep,-45);assert.equal(dotArrowStep.rotation,315);
rotateStep(dotArrowStep,90);assert.equal(dotArrowStep.rotation,45);
assert.equal(translate('nl','technique.dot-arrow'),'Bolletje-pijltje');
for(const rotation of dotArrowDirections)assert.notEqual(translate('nl',`direction.${rotation}`),`direction.${rotation}`);
for(const invalid of ['{',JSON.stringify({format:'other',version:1,route}),JSON.stringify({format:'hike-generator-route',version:2,route}),'x'.repeat(1_000_001)])assert.throws(()=>parseRoute(invalid));
assert.equal(stepsPerPage,15);
assert.equal(pageCount(route),25);
assert.deepEqual(routePages(route).flatMap(page=>page.flatMap(row=>row.steps)),route.steps,'Pagination must preserve every route step in order');
assert.equal(pageCount({...route,steps:route.steps.slice(0,12)}),1);
assert.equal(pageCount({...route,steps:route.steps.slice(0,13)}),2);
const rects=[],printed=[],positions=[],ctx={scale(){},fillRect(){},fillText(value,x,y){printed.push(value);positions.push({value,x,y})},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},translate(){},rotate(){},restore(){},setLineDash(){},arc(){},fill(){},strokeRect(...args){rects.push(args)},measureText(value){return {width:value.length}}};
const turnBack=elements.find(element=>element.id==='turn-back');
const turnBackRoute=validateRoute({...blankRoute(),steps:[{element:turnBack.id,note:'Keer om bij de uitkijktoren.',distance:'',rotation:90}]});
assert.equal(roadCount(turnBack),2,'Turning back must be available under two roads');
assert.equal(elementName(turnBack,'nl'),'Omkeren');
const angledStraightRight=elements.find(element=>element.id==='skew-cross-straight-45-right');
assert.equal(roadCount(angledStraightRight),4,'The 45-degree straight-right layout must be a four-way intersection');
assert.equal(elementName(angledStraightRight,'nl'),'Rechtdoor, 45° rechts');
const angledStraightLeft=elements.find(element=>element.id==='skew-cross-mirrored-straight-45-left');
assert.deepEqual(roadArms(angledStraightLeft).map(arm=>arm.angle),[90,0,180,225],'The mirrored 45-degree layout must swap the diagonal side');
assert.equal(elementName(angledStraightLeft,'nl'),'Rechtdoor, 45° links');
assert.deepEqual(parseRoute(serializeRoute(turnBackRoute)),turnBackRoute,'The turn-back instruction, rotation and note must survive saving');
const turnBackPaths=[],turnBackNotes=[];
drawSheet({getContext:()=>({...ctx,strokeRect(){},stroke(path){if(path)turnBackPaths.push(path.value)},fill(path){turnBackPaths.push(path.value)},fillText(value){turnBackNotes.push(value)}})},turnBackRoute,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(turnBackPaths,junctionLayers(turnBack).map(layer=>layer.path),'The printed turn-back symbol must match the editor');
assert.ok(turnBackNotes.includes(turnBackRoute.steps[0].note),'The turn-back destination must appear in the printed note');
const firstPagePrinted=[],secondPagePrinted=[],multiPageRoute={...route,start:'Trailhead',finish:'Campsite',steps:route.steps.slice(0,stepsPerPage+1)};
drawSheet({getContext:()=>({...ctx,fillText(value){firstPagePrinted.push(value)},strokeRect(){}})},multiPageRoute,0,1,class{});
drawSheet({getContext:()=>({...ctx,fillText(value){secondPagePrinted.push(value)},strokeRect(){}})},multiPageRoute,1,1,class{});
assert.ok(!firstPagePrinted.includes('FINISH')&&!firstPagePrinted.includes('Campsite'),'FINISH must only appear on the last route page');
assert.ok(!firstPagePrinted.includes('CONTINUE')&&!firstPagePrinted.some(value=>String(value).startsWith('Next:')),'Continuation pages must not use a continuation heading');
assert.ok(!secondPagePrinted.includes('START')&&!secondPagePrinted.includes('Trailhead'),'A continuation page must not repeat the start instructions');
assert.ok(secondPagePrinted.includes('FINISH')&&secondPagePrinted.includes('Campsite'),'The last route page must include the finish instructions');
const endpointText=[];
drawSheet({getContext:()=>({...ctx,fillText(value,x,y){endpointText.push({value,y,baseline:this.textBaseline})},strokeRect(){}})},{...blankRoute(),start:'Trailhead',finish:'Campsite',steps:[route.steps[0]]},0,1,class{});
for(const [label,note] of [['START','Trailhead'],['FINISH','Campsite']]){const labelText=endpointText.find(item=>item.value===label),noteText=endpointText.find(item=>item.value===note);assert.equal(labelText.y,noteText.y,`${label} and its note must share a baseline`);assert.equal(labelText.baseline,'alphabetic',`${label} must use baseline alignment`);}
const titledEndpoint=[];
drawSheet({getContext:()=>({...ctx,fillText(value,x,y){titledEndpoint.push({value,y})},strokeRect(){}})},{...blankRoute(),title:'Weekendwandeling',start:'Trailhead',steps:[route.steps[0]]},0,1,class{});
assert.equal(titledEndpoint.find(item=>item.value==='START').y,31.4,'The PDF title should leave a compact gap before the start note');
drawSheet({getContext:()=>ctx},{...blankRoute(),steps:[{...route.steps[0],note:''},{...route.steps[0],note:'Short note'}]},0,1,class{});
assert.equal(rects[0][3],44,'A junction without a note should leave equal vertical margins around its enlarged diagram');
assert.ok(rects[1][3]>rects[0][3],'A route item should only grow when its note needs space');
const paddingRects=[],paddingText=[];
drawSheet({getContext:()=>({...ctx,strokeRect(...args){paddingRects.push(args)},fillText(value,x,y){paddingText.push({value,x,y})}})},{...blankRoute(),steps:[{...route.steps[0],note:''},{...route.steps[0],note:'Short note'}]},0,1,class{});
assert.equal(paddingText.find(item=>item.value==='1.').y-paddingRects[0][1],2,'Every regular route item must start with 2 mm padding');
const shortNote=paddingText.find(item=>item.value==='Short note');
assert.equal(paddingRects[1][1]+paddingRects[1][3]-(shortNote.y+2),2,'Every regular route item must end with 2 mm padding');
assert.ok(printed.includes('START')&&!printed.includes('Start point'),'The PDF must render START without inventing a description');
assert.ok(printed.includes('FINISH')&&!printed.includes('Finish point'),'The PDF must render FINISH without inventing a description');
assert.ok(!printed.includes('Untitled hike'),'An empty route title must not render a PDF placeholder');
assert.ok(!printed.includes('2 route items'),'The PDF must not show the route-item count');
assert.ok(positions.find(item=>item.value==='FINISH').y>rects[1][1]+rects[1][3]&&positions.find(item=>item.value==='FINISH').y<267,'FINISH must follow the last route-item row');
for(const flavor of ['HIKE-GENERATOR / ROUTE SHEET','READ LEFT TO RIGHT, TOP TO BOTTOM','Start at the dot and follow the arrow','Dot = your approach. Follow the dark arrow.'])assert.ok(!printed.some(line=>line.includes(flavor)),'PDF must not render flavor text');
drawSheet({getContext:()=>ctx},compassRoute,0,1,class{});
assert.ok(printed.includes('237°'),'The PDF must print the exact compass bearing');
drawSheet({getContext:()=>ctx},fractionRoute,0,1,class{});
assert.ok(printed.includes('3/4'),'The PDF must print the exact route fraction');
drawSheet({getContext:()=>ctx},inputRoute,0,1,class{});
assert.ok(printed.includes('1. Steek nu het zebrapad over'),'The PDF must print free text steps with their number');
const mixedNumberingRoute={...blankRoute(),steps:[unnumberedInput,compassRoute.steps[0],unnumberedInput,inputRoute.steps[0],quizRoute.steps[0],...Array(9).fill(route.steps[0]),unnumberedInput,unnumberedInput,fractionRoute.steps[0],photoRoute.steps[0]]};
assert.deepEqual(stepNumbers(mixedNumberingRoute),[null,1,null,2,3,4,5,6,7,8,9,10,11,12,null,null,13,14],'Numbering must skip consecutive free text and continue across pages');
const numberedText=[];
for(let page=0;page<pageCount(mixedNumberingRoute);page++)drawSheet({getContext:()=>({...ctx,fillText(value){numberedText.push(value)}})},mixedNumberingRoute,page,1,class{});
assert.deepEqual(numberedText.flatMap(value=>String(value).match(/^(\d+)\.(?: |$)/)?.slice(1).map(Number)??[]),Array.from({length:14},(_,i)=>i+1),'All rendered techniques must use continuous numbering across pages');
assert.equal(numberedText.filter(value=>value===unnumberedInput.value).length,4,'Unnumbered text must remain visible without a numeric prefix');
drawSheet({getContext:()=>ctx},photoRoute,0,1,class{});
assert.ok(printed.includes('Photo'),'The PDF must render photo steps');
const mixedPhotoRoute={...blankRoute(),title:'Photo widths',steps:[photoRoute.steps[0],route.steps[0],{...photoRoute.steps[0],columns:2},quizRoute.steps[0],{...photoRoute.steps[0],columns:3},inputRoute.steps[0],route.steps[0],{...photoRoute.steps[0],columns:2},route.steps[0]]};
assert.deepEqual(routePages(mixedPhotoRoute).map(rows=>rows.map(row=>[row.start,row.steps.length])),[[[0,2],[2,2],[4,1]],[[5,2],[7,2]]],'Wide photos must wrap without filling gaps with later route steps');
assert.deepEqual(routePages(mixedPhotoRoute).flatMap(rows=>rows.flatMap(row=>row.steps)),mixedPhotoRoute.steps,'Pagination must preserve every step in route order');
const photoNumbers=[],photoAreas=[];
for(let page=0;page<pageCount(mixedPhotoRoute);page++){
  const boxes=[],draws=[];
  drawSheet({getContext:()=>({...ctx,strokeRect(...args){if([58,120,182].includes(args[2]))boxes.push(args);else photoAreas.push(args)},fillText(value,x,y){draws.push({value,x,y});const match=String(value).match(/^(\d+)\. /)||String(value).match(/^(\d+)\.$/);if(match)photoNumbers.push(Number(match[1]));}})},mixedPhotoRoute,page,1,class{});
  assert.ok(boxes.every(([x,y,width,height])=>x>=14&&x+width<=196&&y+height<267),'All photo sizes must fit inside the printable page');
  for(let i=1;i<boxes.length;i++){
    const [x,y]=boxes[i],[previousX,previousY,previousWidth,previousHeight]=boxes[i-1];
    assert.ok(y===previousY?x>=previousX+previousWidth+4:y>=previousY+previousHeight+2,'Wide photos must not overlap adjacent or following cards');
  }
  for(const {value,x,y} of draws.filter(draw=>draw.value==='Look for this landmark'))assert.ok(boxes.some(([bx,by,width,height])=>x>=bx&&x<bx+width&&y>by&&y+2<=by+height),'Photo notes must stay inside their resized card');
  if(page===0)assert.deepEqual(boxes.map(([x,,width])=>[x,width]),[[14,58],[76,58],[14,120],[138,58],[14,182]],'Photos must span the selected columns while neighbours retain their size');
}
assert.deepEqual(photoNumbers,mixedPhotoRoute.steps.map((_,i)=>i+1),'Numbering must count steps, not occupied columns');
assert.deepEqual(photoAreas.map(([, ,width])=>width),[54,116,178,116],'The photo itself must grow with the card');
assert.ok(photoAreas.every(([, ,width,height])=>Math.abs(width/height-54/25)<1e-9),'The photo area must grow proportionally');
const unnumberedPhotoRoute={...mixedPhotoRoute,steps:mixedPhotoRoute.steps.map(step=>step.technique==='photo'||step.technique==='input'?{...step,numbered:false}:step)};
assert.deepEqual(routePages(unnumberedPhotoRoute).map(rows=>rows.map(row=>row.start)),routePages(mixedPhotoRoute).map(rows=>rows.map(row=>row.start)),'Unnumbered photos must keep the same column and page layout');
const unnumberedPhotoText=[],unnumberedPhotoBoxes=[];
for(let page=0;page<pageCount(unnumberedPhotoRoute);page++)drawSheet({getContext:()=>({...ctx,fillText(value){unnumberedPhotoText.push(value)},strokeRect(...args){if([58,120,182].includes(args[2]))unnumberedPhotoBoxes.push(args)}})},unnumberedPhotoRoute,page,1,class{});
assert.deepEqual(unnumberedPhotoText.flatMap(value=>String(value).match(/^(\d+)\.(?: |$)/)?.slice(1).map(Number)??[]),[1,2,3,4],'Only counted steps may print a number, continuously across photo pages');
assert.ok(!unnumberedPhotoText.some(value=>String(value).includes('null')),'Unnumbered photos must not print a placeholder number');
assert.equal(unnumberedPhotoText.filter(value=>value==='Photo').length,4,'All unnumbered photos must still render');
assert.equal(unnumberedPhotoText.filter(value=>value===photoRoute.steps[0].note).length,4,'Unnumbered photos must keep their notes');
assert.deepEqual(unnumberedPhotoBoxes.map(([, ,width])=>width),[58,58,120,58,182,58,58,120,58],'Photo widths must not change when numbering is disabled');
for(const columns of [1,2,3]){
  const repeatedPhotos={...photoRoute,title:'Photo pagination',steps:Array(16).fill({...photoRoute.steps[0],columns})};
  assert.equal(routePages(repeatedPhotos).flatMap(rows=>rows.flatMap(row=>row.steps)).length,16);
  for(let page=0;page<pageCount(repeatedPhotos);page++)drawSheet({getContext:()=>({...ctx,strokeRect(x,y,width,height){assert.ok(x+width<=196&&y+height<267,'Repeated wide photos must leave room for the finish and footer')}})},repeatedPhotos,page,1,class{});
}
drawSheet({getContext:()=>ctx},quizRoute,0,1,class{});
assert.ok(printed.includes('1. How many legs does a spider have? · 200 m'),'The PDF must combine the step number, quiz question and optional distance');
for(const value of ['A. Six','B. Eight','C. Ten','D. Twelve'])assert.ok(printed.includes(value),'The PDF must include each lettered answer');
const compactQuizRects=[];
drawSheet({getContext:()=>({...ctx,strokeRect(...args){compactQuizRects.push(args)}})},{...blankRoute(),steps:[{...quizRoute.steps[0],note:''},route.steps[0],fractionRoute.steps[0]]},0,1,class{});
assert.deepEqual(compactQuizRects.slice(0,3).map(([x,y,width])=>[x,y,width]),[[14,26,58],[76,26,58],[138,26,58]],'A quiz question must share the same three-column PDF row as other route techniques');
assert.equal(compactQuizRects[0][3],21,'A four-answer quiz must use 2 mm top and bottom padding');
const maxQuiz={...quizRoute.steps[0],question:'W'.repeat(160),answers:Array(6).fill('W'.repeat(80)),note:'W'.repeat(160)};
const wordyQuiz={...maxQuiz,question:Array(4).fill('W'.repeat(39)).join(' '),note:Array(3).fill('W'.repeat(52)).join(' ')};
const mixedQuizRoute={...blankRoute(),includeCredits:false,title:'Mixed route',steps:[...Array(14).fill(route.steps[0]),maxQuiz,...Array(16).fill(route.steps[0]),wordyQuiz]};
assert.deepEqual(routePages(mixedQuizRoute).flatMap(rows=>rows.flatMap(row=>row.steps)),mixedQuizRoute.steps,'Pagination must preserve every step in order');
const quizNumbers=[];
for(let page=0;page<pageCount(mixedQuizRoute);page++){
  const boxes=[],draws=[];
  const quizContext={...ctx,measureText(value){return {width:value.length*parseFloat(this.font.match(/[\d.]+px/)[0])}},strokeRect(...args){boxes.push(args)},fillText(value,x,y){draws.push({value,x,y,font:this.font});const number=String(value).match(/^(\d+)(?:\.|$)/)?.[1];if(number&&x%62===16)quizNumbers.push(Number(number));}};
  drawSheet({getContext:()=>quizContext},mixedQuizRoute,page,1,class{});
  assert.ok(boxes.every(([,y,,height])=>y+height<=267),'Even six long answers must stay above the finish and footer');
  assert.ok(boxes.every(([, ,width])=>width===58),'Every PDF route item must use one third of the row');
  for(const draw of draws.filter(draw=>draw.value.includes('W')||/^[A-F]\./.test(draw.value)))assert.ok(boxes.some(([x,y,width,height])=>draw.x>=x&&draw.x<=x+width&&draw.y>y&&draw.y+parseFloat(draw.font.slice(4))<y+height),'Quiz content must fit inside its card');
  if(draws.some(draw=>draw.value.includes('W'))){assert.ok(draws.some(draw=>draw.value.startsWith('F.')),'The final answer must never be truncated');assert.equal(draws.reduce((count,draw)=>count+(draw.value.match(/W/g)??[]).length,0),routePages(mixedQuizRoute)[page].flatMap(row=>row.steps).filter(step=>step.technique==='quiz').reduce((count,step)=>count+([step.question,...step.answers,step.note].join('').match(/W/g)??[]).length,0),'Every character of maximum-length quiz content must be printed');}
}
assert.deepEqual(quizNumbers,mixedQuizRoute.steps.map((_,i)=>i+1),'Printed numbering must remain continuous across mixed quiz pages');
const dotArrowPaths=[],dotArrowRotations=[];
drawSheet({getContext:()=>({...ctx,stroke(path){if(path)dotArrowPaths.push(path.value)},fill(path){dotArrowPaths.push(path.value)},rotate(angle){dotArrowRotations.push(angle)}})},dotArrowRoute,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowPaths,dotArrowRoute.steps.flatMap(()=>dotArrowLayers().map(layer=>layer.path)),'Every dot-and-arrow PDF symbol must use the shared arrow and dot without junction roads');
for(const rotation of dotArrowDirections)assert.ok(dotArrowRotations.includes(rotation*Math.PI/180),'The PDF must preserve each dot-and-arrow direction');
const dotArrowShapePaths=[];
const shapeCanvas={getContext:()=>({...ctx,stroke(path){if(path)dotArrowShapePaths.push(path.value)},fill(path){dotArrowShapePaths.push(path.value)}})};
for(let page=0;page<pageCount(dotArrowShapeRoute);page++)drawSheet(shapeCanvas,dotArrowShapeRoute,page,1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowShapePaths,dotArrowShapeRoute.steps.flatMap(step=>dotArrowLayers(dotArrowShape(step.element)).map(layer=>layer.path)),'PDF pages must retain every selected curve and omit side roads');
dotArrowShapePaths.length=0;
drawTechniqueGuide(shapeCanvas,{...dotArrowShapeRoute,includeTechniqueExplanation:true},1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowShapePaths,dotArrowLayers(dotArrowShapes[0]).map(layer=>layer.path),'The explanation must illustrate the actual chosen layout');
const eyeDraws=[],eyeRotations=[];
let eyeTranslation;
const eyesCanvas={getContext:()=>({...ctx,fillText(){},translate(x,y){eyeTranslation=[x+0,y+0]},rotate(angle){eyeRotations.push(angle)},fill(path){if(this.fillStyle==='#000000')eyeDraws.push({path:path.value,offset:eyeTranslation})}})};
drawSheet(eyesCanvas,eyesRoute,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(eyeDraws,eyesRoute.steps.map((step,index)=>({path:eyesLayers(step.rotation)[1].path,offset:gazeOffsets[index]})),'The preview and PDF must draw all eight gazes');
eyeDraws.length=0;
drawTechniqueGuide(eyesCanvas,{...eyesRoute,steps:[eyesRoute.steps[5]],includeTechniqueExplanation:true},1,class{constructor(value){this.value=value}});
assert.deepEqual(eyeDraws,[{path:eyesLayers(225)[1].path,offset:gazeOffsets[5]}],'The guide must illustrate the chosen gaze');
assert.ok(eyeRotations.every(angle=>angle===0),'Printed eyes must remain upright; only pupils move');
const guideRoute={...blankRoute(),includeTechniqueExplanation:true,includeCredits:true,steps:[route.steps[0],compassRoute.steps[0],fractionRoute.steps[0],dotArrowRoute.steps[2],eyesRoute.steps[1],quizRoute.steps[0],inputRoute.steps[0],photoRoute.steps[0]]};
const creditsBeforeGuide=printed.filter(value=>value==='created with hike-generator by Wouter van der Ven').length;
assert.deepEqual(routeTechniques(guideRoute),['junction','compass','fraction','dot-arrow','eyes','quiz','photo'],'The guide must omit free-text steps and list the other techniques once, in route order');
assert.equal(documentPageCount(guideRoute),2,'The technique guide must add one A4 page');
assert.deepEqual(parseRoute(serializeRoute(guideRoute)),guideRoute,'The PDF option must survive export and import');
const guideRects=[];
drawTechniqueGuide({getContext:()=>({...ctx,strokeRect(...args){guideRects.push(args)}})},guideRoute,1,class{});
assert.equal(guideRects.length,8);
assert.ok(guideRects.every(([,y,,height])=>y+height<281),'All six explanations must fit above the A4 footer');
assert.ok(printed.includes('Quiz question')&&printed.some(value=>value.includes('clockwise')),'The guide must explain how quiz answers map to roads');
drawSheet({getContext:()=>ctx},guideRoute,0,1,class{});
assert.ok(printed.includes('Route technique guide')&&printed.includes('Situation sketch')&&printed.includes('Compass bearing')&&printed.includes('Fractions')&&printed.includes('Dot and arrow')&&printed.includes('Eyes')&&!printed.includes('Free text')&&printed.includes('Photo'),'The guide must explain every used technique except free text');
assert.ok(printed.includes('PAGE 1 / 2')&&printed.includes('PAGE 2 / 2'),'Guide and route pages must share continuous page numbers');
assert.equal(printed.filter(value=>value==='created with hike-generator by Wouter van der Ven').length-creditsBeforeGuide,2,'Credits must appear in every PDF footer');
for(const invalid of [{element:'unknown'},{distance:'-1'},{distance:'1.5'},{note:'x'.repeat(161)}]){
  assert.throws(()=>validateRoute({...route,steps:[{...route.steps[0],...invalid}]}));
}
assert.throws(()=>validateRoute({...route,steps:Array(301).fill(route.steps[0])}));
assert.throws(()=>validateRoute({...route,title:'x'.repeat(81)}));
assert.throws(()=>validateRoute(null));
const {includeTechniqueExplanation:discardedGuide,includeCredits:discardedCredits,...oldRoute}=route;
assert.equal(validateRoute(oldRoute).includeTechniqueExplanation,false,'Old route files must keep the guide disabled');
assert.equal(validateRoute(oldRoute).includeCredits,true,'Credits must stay enabled for old route files');
assert.equal(validateRoute({...route,includeCredits:false}).includeCredits,true,'Credits must stay enabled');
assert.throws(()=>validateRoute({...route,includeTechniqueExplanation:'yes'}));
assert.throws(()=>validateRoute({...route,includeCredits:'yes'}));
assert.equal(route.steps.length,elements.length,'Validation must not mutate the original route');
const legacy={...route,steps:[{element:'t-left',note:'Existing draft',distance:'200'}]};
assert.equal(validateRoute(legacy).steps[0].rotation,0,'Old drafts should load without rotation');
assert.deepEqual(validateRoute(legacy).steps[0].faintArms,[],'Old drafts should load with regular roads');
assert.deepEqual(validateRoute(legacy).steps[0].landmarks,[],'Old drafts should load without landmarks');
const straight=elements.find(element=>element.id==='straight'),straightStep=route.steps.find(step=>step.element==='straight');
assert.equal(roadCount(straight),2,'A straight road must stay in the two-road picker');
assert.deepEqual(landmarkArms(straight),[{id:'centre',x:50,y:50,angle:270}],'Straight-road landmarks must use one central position');
for(const arm of ['approach','ahead']){
  const migrated=validateRoute({...blankRoute(),steps:[{...straightStep,rotation:90,faintArms:['approach'],landmarks:[{type:'bridge',arm},{type:'parking',arm,side:'left'},{type:'water',arm,side:'right'}]}]});
  assert.deepEqual(migrated.steps[0].landmarks,[{type:'bridge',arm:'centre'},{type:'parking',arm:'centre',side:'left'},{type:'water',arm:'centre',side:'right'}],'Old upper and lower placements must move to the centre while keeping their side');
  assert.deepEqual(migrated.steps[0].faintArms,['approach'],'Road-type choices must survive landmark migration');
  assert.deepEqual(parseRoute(serializeRoute(migrated)),migrated,'Central placements and rotation must survive saving');
  const layers=junctionLayers(straight,migrated.steps[0].landmarks);
  assert.ok(layers.some(layer=>layer.path===landmarkTypes[0].over&&layer.x===50&&layer.y===50),'The bridge must span the centre of the road');
  for(const rotation of dotArrowDirections)assert.equal(roadArmLabel(landmarkArms(straight)[0],rotation,'nl'),'Midden van de weg','Rotating the road must not reintroduce upper and lower placement labels');
}
assert.deepEqual(validateRoute({...blankRoute(),steps:[{...straightStep,landmarks:[{type:'railway',arm:'ahead'}]}]}).steps[0].landmarks,[],'Old railway elements must be removed from saved routes');
assert.throws(()=>validateRoute({...blankRoute(),steps:[{...straightStep,landmarks:[{type:'parking',arm:'right',side:'right'},{type:'water',arm:'right',side:'right'}]}]}),'Only one landmark may occupy the same side of a road');
assert.throws(()=>validateRoute({...blankRoute(),steps:[{...route.steps[0],landmarks:[{type:'bridge',arm:'centre'}]}]}),'Junctions must still require a real road arm');
const rotated=structuredClone(route);
rotateStep(rotated.steps[0],-45);
assert.equal(rotated.steps[0].rotation,315);
assert.equal(rotated.steps[1].rotation,0,'Rotating one step must not rotate its neighbour');
assert.equal(validateRoute(JSON.parse(JSON.stringify(rotated))).steps[0].rotation,315,'Rotation must survive draft save and reload');
rotateStep(rotated.steps[0],45);
assert.equal(rotated.steps[0].rotation,0);
for(let i=0;i<8;i++)rotateStep(rotated.steps[0],45);
assert.equal(rotated.steps[0].rotation,0,'Eight rotations should restore the original orientation');
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateRoute({...route,steps:[{...route.steps[0],rotation}]}));
const bridge=validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'bridge',arm:'right'}]}]});
rotateStep(bridge.steps[0],90);
assert.deepEqual(bridge.steps[0].landmarks,[{type:'bridge',arm:'right'}],'Rotation must keep a landmark attached to its road arm');
assert.deepEqual(validateRoute(JSON.parse(JSON.stringify(bridge))),bridge,'Landmarks must survive save and reload');
assert.deepEqual(landmarkTypes.map(type=>type.id),['bridge','parking','bridleway','water']);
assert.deepEqual(sidedLandmarkTypes,['parking','water'],'Only roadside landmarks should offer left/right placement');
assert.deepEqual(validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'bridleway',arm:'right',side:'left'}]}]}).steps[0].landmarks,[{type:'bridleway',arm:'right'}],'Bridleway placements should be normalized onto the road');
assert.deepEqual(validateRoute({...route,steps:[{...route.steps[0],landmarks:[{type:'steps',arm:'right'}]}]}).steps[0].landmarks,[],'Retired stair elements should be removed from saved routes');
assert.deepEqual(validateRoute({...blankRoute(),steps:[{...route.steps[1],landmarks:[{type:'bench',arm:'right'}]}]}).steps[0].landmarks,[],'Old bench elements must be removed from saved routes');
const leftWater=validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'water',arm:'right',side:'left'}]}]}).steps[0];
assert.equal(junctionLayers(elements[1],leftWater.landmarks).filter(layer=>layer.x===76&&layer.y===15).length,1,'Water should render with padding on either side of a road arm');
const right=roadArms(elements[1]).find(arm=>arm.id==='right');
assert.equal(roadArmLabel(right),'Right road');
assert.equal(roadArmLabel(right,90),'Bottom road','Placement labels must follow the visible rotation');
assert.equal(translate('nl','downloadPdf'),'PDF downloaden');
assert.equal(translate('en','pdf.credits'),'created with hike-generator by Wouter van der Ven');
assert.equal(translate('nl','pdf.credits'),'Gemaakt met https://vandervenwouter.github.io/hike-generator');
assert.equal(translate('nl','darkMode'),'Donkere modus gebruiken');
assert.equal(translate('nl','printPreview'),'Afdrukvoorbeeld A4');
assert.equal(translate('nl','addCompass'),'Toevoegen');
assert.equal(translate('nl','addRouteItem'),'Stap toevoegen');
assert.equal(translate('nl','insertRouteItem',{number:2}),'Stap toevoegen na stap 2');
assert.equal(translate('nl','duplicateStep',{number:2}),'Dupliceer stap 2');
assert.deepEqual(Object.keys(translations.nl).sort(),Object.keys(translations.en).sort(),'English and Dutch must contain the same translation keys');
assert.equal(translate('nl','added',{number:3}),'Stap 3 toegevoegd');
assert.equal(translate('de','downloadPdf'),'Download PDF','Unknown languages should fall back to English');
assert.equal(elementName(elements[1],'nl'),'Rechtsaf');
assert.equal(groupName(elements[1],'nl'),'T-splitsing');
const fiveWay=elements.find(element=>element.id==='five-hard-right');
const sixWay=elements.find(element=>element.id==='six-straight');
const fourWay=elements.filter(element=>element.id.startsWith('four-'));
const threeFork=elements.filter(element=>element.group==='Three-way fork');
assert.equal(fourWay.length,6,'The asymmetric four-way intersection needs three right-hand and three mirrored left-hand variants');
assert.ok(fourWay.every(element=>roadArms(element).length===4),'Every asymmetric four-way variant must expose all four road arms');
assert.deepEqual(roadArms(fourWay[0]).map(arm=>arm.angle),[90,0,-45,-90],'The four-way layout needs an entry, two roads right, and a straight exit');
assert.deepEqual(roadArms(fourWay[3]).map(arm=>arm.angle),[90,180,225,270],'The mirrored four-way layout needs an entry, two roads left, and a straight exit');
assert.equal(elementName(fourWay[3],'nl'),'Eerste weg links');
assert.equal(elementName(fourWay[4],'nl'),'Tweede weg links');
assert.equal(junctionLayoutKey(fourWay[0]),junctionLayoutKey({arms:[{angle:315},{angle:270},{angle:90},{angle:0}]}),'Layout identity must ignore arm order and equivalent negative angles');
// With the arrival road fixed at 90 degrees, choose every set of three or four exits.
const gridAngles=[0,45,135,180,225,270,315],gridLayouts={4:[],5:[]};
for(let a=0;a<7;a++)for(let b=a+1;b<7;b++)for(let c=b+1;c<7;c++){
  gridLayouts[4].push([gridAngles[a],gridAngles[b],gridAngles[c]]);
  for(let d=c+1;d<7;d++)gridLayouts[5].push([gridAngles[a],gridAngles[b],gridAngles[c],gridAngles[d]]);
}
for(const count of [4,5]){
  assert.equal(gridLayouts[count].length,35);
  for(const exits of gridLayouts[count]){
    const key=[90,...exits].sort((a,b)=>a-b).join(',');
    const variants=elements.filter(element=>junctionLayoutKey(element)===key);
    assert.equal(variants.length,count-1,`${count}-road layout ${key} must offer each exit exactly once`);
    assert.deepEqual(variants.map(element=>(element.tip.angle%360+360)%360).sort((a,b)=>a-b),exits,'Every available road must be selectable');
  }
}
// Cover every cardinal/diagonal exit pair, plus both diagonal through-roads.
const angledTPairs=[...[0,180,270].flatMap(cardinal=>[45,135,225,315].map(diagonal=>[cardinal,diagonal])),[135,315],[225,45]];
for(const exits of angledTPairs){
  const variants=elements.filter(element=>roadCount(element)===3&&exits.every(angle=>roadArms(element).some(arm=>arm.angle===angle)));
  assert.equal(variants.length,2,`Three-road layout with exits ${exits} must offer both directions`);
  assert.deepEqual(variants.map(element=>roadArms(element)[element.exit].angle).sort((a,b)=>a-b),exits.toSorted((a,b)=>a-b));
  for(const element of variants){
    const tip=element.route.match(/L(-?[\d.]+) (-?[\d.]+)$/);
    const angle=(Math.atan2(Number(tip[2])-50,Number(tip[1])-50)*180/Math.PI+360)%360;
    assert.ok(Math.abs(angle-roadArms(element)[element.exit].angle)<.01,'Every angled T route must lead to its selected road');
  }
}
assert.ok(elements.filter(element=>element.id.startsWith('angled-t-')).every(element=>groupName(element,'nl')==='Schuine T-splitsing'));
const angledLayouts=[
  ['angled-side-left',[90,225,270],[270,225]],
  ['angled-side-right',[90,270,315],[270,315]],
  ['angled-side-back-left',[90,135,270],[270,135]],
  ['angled-side-back-right',[90,270,45],[270,45]],
  ['skew-cross-ne-sw',[90,135,270,315],[135,270,315]],
  ['skew-cross-nw-se',[90,225,270,45],[225,270,45]],
];
for(const [prefix,angles,exits] of angledLayouts){
  const variants=elements.filter(element=>element.id.startsWith(prefix+'-'));
  assert.equal(variants.length,angles.length-1,'Every angled layout must offer every exit');
  variants.forEach((element,index)=>{
    assert.deepEqual(roadArms(element).map(arm=>arm.angle),angles,'Keep the straight main road and the specified diagonal side roads');
    const end=element.route.match(/L(-?[\d.]+) (-?[\d.]+)$/);
    const exitAngle=(Math.atan2(Number(end[2])-50,Number(end[1])-50)*180/Math.PI+360)%360;
    assert.ok(Math.abs(exitAngle-exits[index])<.01,'The route arrow must point into the chosen exit');
    assert.equal(groupName(element,'nl'),angles.length===3?'Schuine zijweg':'Schuin kruispunt');
  });
}
assert.equal(threeFork.length,3,'The four-road chooser needs left, straight, and right three-way-fork variants');
assert.ok(threeFork.every(element=>roadArms(element).length===4),'Every three-way-fork variant must expose one approach and three exits');
assert.deepEqual(roadArms(threeFork[0]).map(arm=>arm.angle),[90,225,270,315],'A three-way fork needs left, straight, and right exits');
assert.equal(groupName(threeFork[0],'nl'),'Drievoudige vorksplitsing');
assert.equal(groupName(fourWay[0],'nl'),'Viersprong');
assert.equal(elementName(fourWay[0],'nl'),'Eerste weg rechts');
assert.equal(roadArms(fiveWay).length,5,'A five-way intersection must expose all five road arms');
assert.equal(roadArms(sixWay).length,6,'A six-way intersection must expose all six road arms');
assert.equal(new Set(roadArms(sixWay).map(arm=>arm.id)).size,6,'Every six-way road arm needs a distinct landmark position');
assert.equal(groupName(fiveWay,'nl'),'Vijfsprong');
assert.equal(elementName(fiveWay,'nl'),'Scherp rechts');
const radialBridge={...route.steps[0],element:sixWay.id,landmarks:[{type:'bridge',arm:'exit-5'}]};
assert.deepEqual(validateRoute({...route,steps:[radialBridge]}).steps[0],radialBridge,'Landmarks must remain available on every six-way road arm');
assert.ok(!roadArms(fiveWay).map(arm=>roadArmLabel(arm)).some(label=>label.includes('undefined')),'Angled road arms need readable position labels');
assert.equal(landmarkName(landmarkTypes[0],'nl'),'Brug');
assert.equal(landmarkTypes.find(type=>type.id==='bridge').under,undefined,'A bridge must not include water');
assert.equal(landmarkTypes.find(type=>type.id==='bridge').over,'M-10 -27V-23H10V-27M-10 27V23H10V27','Bridge markings must keep their original hook direction while placing hooks outside the road edges');
assert.equal(landmarkName(landmarkTypes.find(type=>type.id==='parking'),'nl'),'Parkeerplaats');
assert.equal(landmarkName(landmarkTypes.find(type=>type.id==='bridleway'),'nl'),'Ruiterpad');
assert.equal(landmarkName(landmarkTypes.find(type=>type.id==='water'),'nl'),'Water');
assert.equal(translate('nl','faintPath'),'Hazenpaadje');
const faintPathLayers=junctionLayers(elements[1],[],['right']);
const faintEdges=faintPathLayers.filter(layer=>layer.faintEdge);
assert.equal(faintEdges.length,2,'A hazenpaadje should dash both edges of the selected road arm');
assert.ok(faintEdges.every(layer=>layer.joinEdge&&Math.abs(layer.width*layer.scale-1)<1e-9&&layer.color==='#000000'&&layer.dash?.join(',')==='5,4'),'A hazenpaadje should use both shared road edges and evenly spaced dashes');
assert.equal(faintPathLayers.filter(layer=>layer.joinEdgeMask).length,0,'A hazenpaadje must not need white masks over solid edges');
const routeIndex=faintPathLayers.findIndex(layer=>layer.path===elements[1].route);
assert.ok(faintEdges.every(layer=>faintPathLayers.indexOf(layer)<routeIndex),'The route arrow must render above the dashed edges');
const straightFaintLayers=junctionLayers(elements.find(element=>element.id==='straight'),[],['approach']);
assert.equal(straightFaintLayers.filter(layer=>layer.faintEdge).length,2,'A straight hazenpaadje should dash both sides of the road');
assert.ok(straightFaintLayers.filter(layer=>layer.faintEdge).every(layer=>layer.width<2),'A straight hazenpaadje must keep its white road interior');
for(const id of ['straight','turn-back']){
  const capFreeLayers=junctionLayers(elements.find(element=>element.id===id));
  assert.ok(capFreeLayers.some(layer=>layer.road&&layer.path==='M39 10V90M61 10V90'&&layer.width===1),'Two-road edges must be redrawn as open longitudinal edges');
  assert.ok(!capFreeLayers.some(layer=>layer.path===elements.find(element=>element.id===id).roads&&layer.color==='#000000'),'Two-road edges must not retain a capped black centreline');
}
for(const element of elements){
  const roadLayers=junctionLayers(element).filter(layer=>layer.road);
  if(!['bend-left','bend-right','straight','turn-back'].includes(element.id)){
    assert.equal(roadLayers.filter(layer=>layer.roadEndMask).length,roadArms(element).length,`${element.id}: every outer road end needs an open-end mask`);
  }
}
const joinedFaintLayers=junctionLayers(elements.find(element=>element.id==='cross-right'),[],['approach','right']);
const firstFaintEdgeIndex=joinedFaintLayers.findIndex(layer=>layer.faintEdge);
assert.ok(firstFaintEdgeIndex>=0,'Joined faint roads must render their shared dashed outlines');
const fullFaintRight=junctionLayers(elements.find(element=>element.id==='t-right'),[],['right']).filter(layer=>layer.faintEdge);
assert.ok(fullFaintRight.every(layer=>layer.path.startsWith('M-15 ')),'A faint T-junction arm must align both visible edge dashes after the junction');
const angledFaintElement=elements.find(element=>element.id==='angled-side-right-straight'),angledFaint=junctionLayers(angledFaintElement,[],['exit-2']),angledFaintArm=roadArms(angledFaintElement).find(arm=>arm.id==='exit-2');
const angledInteriorStart=angledFaint.find(layer=>layer.faintRoadInterior).path.match(/^M(-?[\d.]+) (-?[\d.]+)/);
assert.ok(Math.hypot(Number(angledInteriorStart[1])-50,Number(angledInteriorStart[2])-50)<Math.hypot(angledFaintArm.x-50,angledFaintArm.y-50),'An angled faint road must erase its interior from the physical junction');
assert.ok(angledFaint.filter(layer=>layer.faintEdge).some(layer=>Number(layer.path.match(/^M(-?[\d.]+)/)[1])<-50),'The inner edge of an angled faint road must remain dashed up to the junction');
const tTurnLayers=junctionLayers(elements.find(element=>element.id==='t-left'),[],['approach','left']);
assert.equal(tTurnLayers.filter(layer=>layer.faintEdge).length,4,'The approach and joining road must both retain two dashed edges');
const bothHorizontalFaint=junctionLayers(elements.find(element=>element.id==='t-left'),[],['left','right']).filter(layer=>layer.faintRoadInterior);
assert.deepEqual(bothHorizontalFaint.map(layer=>layer.path),['M39 42L6 42','M61 42L94 42'],'Faint cleanup must stop at the shared T-junction connector');
for(const group of new Set(tTurnLayers.filter(layer=>layer.faintEdge).map(layer=>`${layer.x},${layer.y},${layer.angle}`))){
  const starts=tTurnLayers.filter(layer=>layer.faintEdge&&`${layer.x},${layer.y},${layer.angle}`===group).map(layer=>layer.path.match(/^M(-?[\d.]+)/)?.[1]);
  assert.equal(new Set(starts).size,1,'Both edges of each faint T-junction arm must share one dash phase');
}
assert.ok(!tTurnLayers.some(layer=>layer.joinEdgeMask),'Faint T-junction edges must not depend on white erase masks');
const threeForkTurn=junctionLayers(threeFork[2],[],['exit-2','exit-3']);
const forkTopEdges=threeForkTurn.filter(layer=>layer.faintEdge);
assert.equal(forkTopEdges.length,4,'Both selected 45-degree roads must retain both dashed outlines');
assert.ok(forkTopEdges.every(edge=>Math.abs(edge.width*edge.scale-1)<1e-9),'Every selected 45-degree road must keep one-unit edge ink');
const fork=elements.find(element=>element.id==='fork-right');
assert.equal(junctionLayers(fork,[],['right']).filter(layer=>layer.faintEdge).length,2,'A fork hazenpaadje must dash both branch edges');
assert.equal(junctionLayers(fork,[],['approach']).filter(layer=>layer.faintEdge).length,2,'A fork approach hazenpaadje must dash both approach edges');
const faintBridge={...route.steps[1],faintArms:['right'],landmarks:[{type:'bridge',arm:'right'}]};
assert.deepEqual(validateRoute({...route,steps:[faintBridge]}).steps[0],faintBridge,'A faint road must still accept route elements');
const migratedFaintPath=validateRoute({...route,steps:[{...route.steps[1],faintArms:undefined,landmarks:[{type:'faint-path',arm:'right'}]}]}).steps[0];
assert.deepEqual(migratedFaintPath.faintArms,['right'],'Saved hazenpaadjes must migrate from route elements to road types');
assert.deepEqual(migratedFaintPath.landmarks,[],'Migrated hazenpaadjes must disappear from route elements');
assert.deepEqual(validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'gate',arm:'right'}]}]}).steps[0].landmarks,[],'Saved gates must disappear from route elements');
for(const faintArms of [['unknown'],['right','right'],null])assert.throws(()=>validateRoute({...route,steps:[{...route.steps[1],faintArms}]}));
assert.equal(roadArmLabel(right,90,'nl'),'Onderste weg');
const rightBridgeLayer=junctionLayers(elements[1],bridge.steps[0].landmarks).find(layer=>layer.path===landmarkTypes[0].over);
assert.ok(rightBridgeLayer.x>elements[1].tip.x&&rightBridgeLayer.x<94&&rightBridgeLayer.y===42,'A right-hand bridge must move behind the route arrow while keeping its full marker visible');
const bridgeRoadExtension=junctionLayers(elements[1],[{type:'bridge',arm:'left'}],['left']).filter(layer=>layer.bridgeExtension);
assert.equal(bridgeRoadExtension.length,2,'A bridge with too little road space must extend both road layers');
const leftBridgeGeometry=bridgeGeometry(elements[1],roadArms(elements[1]).find(arm=>arm.id==='left'));
const tRight=elements.find(element=>element.id==='t-right'),tRightBridgeLayers=junctionLayers(tRight,[{type:'bridge',arm:'right'}]),tRightRoadEnd=tRightBridgeLayers.findIndex(layer=>layer.path===tRight.roads&&layer.color==='#fff');
assert.ok(tRightBridgeLayers.findIndex(layer=>layer.bridgeExtension)>tRightRoadEnd,'A bridge extension must mask the original road end cap');
assert.ok(bridgeRoadExtension.some(layer=>layer.path===`M${leftBridgeGeometry.start} 0H${leftBridgeGeometry.end}`)&&bridgeRoadExtension.every(layer=>layer.path.includes(`H${leftBridgeGeometry.end}`)),'The bridge road extension must be derived from the arm endpoint and shifted marker');
assert.ok(bridgeRoadExtension.some(layer=>layer.width===23&&layer.color==='#fff')&&bridgeRoadExtension.some(layer=>layer.width===1&&layer.dash?.join(',')==='5,4'),'A bridge extension must retain the selected road type without a transverse cap');
assert.ok(junctionLayers(elements[1],[{type:'bridge',arm:'left'}],['left']).some(layer=>layer.path===landmarkTypes[0].over&&layer.x>18&&layer.x<19&&layer.y===42),'A bridge must shift farther along a non-route hazenpaadje arm');
const angledElement=elements.find(element=>element.id==='skew-cross-ne-sw-right');
const generatedRoadEndpoints=element=>[...element.roads.matchAll(/[ML](-?[\d.]+) (-?[\d.]+)/g)]
  .map(match=>({x:Number(match[1]),y:Number(match[2])})).filter(p=>p.x!==50||p.y!==50)
  .filter((p,index,points)=>points.findIndex(other=>other.x===p.x&&other.y===p.y)===index);
const angledRoadEndpoints=generatedRoadEndpoints(angledElement);
assert.ok(angledRoadEndpoints[3].y-12*Math.cos(Math.PI/4)>=angledRoadEndpoints[2].y,'The upper-right road must not rise above the through road');
assert.ok(elements.filter(element=>element.arms).every(element=>element.arms.every(arm=>Math.hypot(arm.end.x-50,arm.end.y-50)-Math.hypot(arm.x-50,arm.y-50)>59)),'Generated junctions must use the bridge-clearance road length by default');
const parkingLayers=junctionLayers(elements[1],[{type:'parking',arm:'right'}]);
assert.ok(parkingLayers.some(layer=>layer.fill==='#000000'&&layer.width===0)&&parkingLayers.some(layer=>layer.fill==='#fff'&&layer.width===0)&&!parkingLayers.some(layer=>layer.upright&&layer.color==='#fff'&&layer.width>0),'Parking should use the filled E04 shape without an inset border');
assert.ok(parkingLayers.findIndex(layer=>layer.fill==='#000000'&&layer.width===0)>parkingLayers.findIndex(layer=>layer.path===elements[1].roads&&layer.color==='#fff'),'Parking background must render above the road');
const parkingIconLayers=parkingLayers.filter(layer=>layer.upright);
assert.ok(parkingIconLayers.every(layer=>layer.x===76&&layer.y===66),'Parking should stay beside its road arm');
assert.equal(layerRotation(parkingIconLayers[0],90),-90,'Parking should counter-rotate with the route block');
const angledMarkerElement=elements.find(element=>element.id==='angled-side-right-turn');
const angledParking=junctionLayers(angledMarkerElement,[{type:'parking',arm:'exit-1',side:'right'}]).filter(layer=>layer.upright);
const angledParkingGeometry=parkingGeometry(angledMarkerElement,roadArms(angledMarkerElement).find(arm=>arm.id==='exit-1'),'right');
assert.ok(angledParkingGeometry.along>20&&angledParking.every(layer=>layer.scale===1&&Math.abs(layer.x-74)<1e-9&&layer.y<25.189533778383655),'Parking markers should move outward when an angled neighbour blocks their initial position');
const crowdedParkingElement=elements.find(element=>element.id==='angled-t-ne-e-1'),crowdedParkingArm=roadArms(crowdedParkingElement).find(arm=>arm.id==='exit-1');
const crowdedParkingGeometry=parkingGeometry(crowdedParkingElement,crowdedParkingArm,'right');
assert.ok(crowdedParkingGeometry.extension>50&&crowdedParkingGeometry.end-crowdedParkingGeometry.along>17/crowdedParkingGeometry.geometry.scale,'A parking marker must extend its road far enough to clear a neighbouring road end and continue beyond the marker');
assert.ok(waterGeometry(crowdedParkingElement,crowdedParkingArm,'right').extension>30,'A water marker must use the same road-clearance extension as a parking marker');
const angledBridge=junctionLayers(angledMarkerElement,[{type:'bridge',arm:'exit-2'}]).find(layer=>layer.path===landmarkTypes[0].over);
assert.equal(angledBridge.scale,.55,'Bridge markers should fit the visible road width on angled roads');
const straightAheadBridgeElement=elements.find(element=>element.id==='angled-side-right-turn'),straightAheadArm=roadArms(straightAheadBridgeElement).find(arm=>arm.id==='exit-1'),straightAheadBridgeGeometry=bridgeGeometry(straightAheadBridgeElement,straightAheadArm),straightAheadBridgeLayers=junctionLayers(straightAheadBridgeElement,[{type:'bridge',arm:'exit-1'}]),straightAheadBridge=straightAheadBridgeLayers.find(layer=>layer.path===landmarkTypes[0].over);
assert.equal(straightAheadBridgeGeometry.extension,0,'A straight-road bridge should fit without a second extension after the default road extension');
assert.ok(straightAheadBridge.y<15,'A straight-road bridge must still fit past a diagonal neighbour');
for(const element of elements){
  for(const arm of landmarkArms(element)){
    const layers=junctionLayers(element,[{type:'bridge',arm:arm.id}]),roadScale=layers.find(layer=>layer.path===element.roads)?.scale??1,geometry=bridgeGeometry(element,arm,roadScale),bridge=layers.find(layer=>layer.path===landmarkTypes[0].over);
    assert.ok(bridge,'Every road arm must accept a bridge geometry');
    const expectedX=50+(arm.x+geometry.geometry.direction.x*geometry.along-50)*geometry.geometry.scale,expectedY=50+(arm.y+geometry.geometry.direction.y*geometry.along-50)*geometry.geometry.scale;
    assert.ok(Math.abs(bridge.x-expectedX)<1e-9&&Math.abs(bridge.y-expectedY)<1e-9,'Bridge markers must use the shared arm geometry');
    const extension=layers.find(layer=>layer.bridgeExtension);
    if(geometry.extension)assert.equal(extension.path,`M${geometry.start} 0H${geometry.end}`,'Bridge road extensions must use the same geometry as the marker');
  }
}
const diagonalBridgeElement=elements.find(element=>element.id==='skew-cross-ne-sw-left'),diagonalBridgeLayers=junctionLayers(diagonalBridgeElement,[{type:'bridge',arm:'exit-1'}]),diagonalBridge=diagonalBridgeLayers.find(layer=>layer.path===landmarkTypes[0].over),diagonalArm=roadArms(diagonalBridgeElement).find(arm=>arm.id==='exit-1'),diagonalScale=40/(diagonalBridgeElement.radius+diagonalBridgeElement.throughExtension),diagonalArmX=50+(diagonalArm.x-50)*diagonalScale,diagonalArmY=50+(diagonalArm.y-50)*diagonalScale;
assert.ok((diagonalBridge.x-50)*(diagonalArmX-50)+(diagonalBridge.y-50)*(diagonalArmY-50)>(diagonalArmX-50)**2+(diagonalArmY-50)**2,'A diagonal route bridge should move outward toward the extended road');
assert.ok(diagonalBridgeLayers.some(layer=>layer.bridgeExtension),'A diagonal route bridge should extend its road when it moves beyond the arrow');
const bridlewayLayers=junctionLayers(elements[1],[{type:'bridleway',arm:'right'}]);
const bridlewayIconLayers=bridlewayLayers.filter(layer=>layer.upright);
const allBridleways=roadArms(elements[0]).map(arm=>({type:'bridleway',arm:arm.id})),bridlewayOffset=junctionOffset(elements[0],allBridleways);
assert.ok(bridlewayOffset.x!==0||bridlewayOffset.y!==0,'Junction centering must account for bridleway marker extents');
assert.ok(junctionLayers(elements[0],allBridleways).filter(layer=>layer.upright).every(layer=>layer.x-10.5+bridlewayOffset.x>=0&&layer.x+10.5+bridlewayOffset.x<=100&&layer.y-10.5+bridlewayOffset.y>=0&&layer.y+10.5+bridlewayOffset.y<=100),'Bridleway markers must stay inside the junction drawing area after centering');
const crowdedBridleways=roadArms(elements.find(element=>element.id==='cross-straight')).map(arm=>({type:'bridleway',arm:arm.id}));
assert.ok(junctionDiagramScale(elements.find(element=>element.id==='cross-straight'),crowdedBridleways)<1,'Crowded SVG previews must scale down to keep markers inside their viewBox');
assert.ok(junctionCardHeight({element:'cross-straight',note:'',landmarks:crowdedBridleways})>40,'Crowded junctions must receive a taller PDF card instead of shrinking the drawing');
assert.equal(junctionCardHeight({element:'cross-straight',note:'',landmarks:[]}),44,'Junction cards must leave equal vertical margins around the PDF diagram');
const centeredLayers=junctionLayers(elements.find(element=>element.id==='cross-straight'),crowdedBridleways),centeredOffset=junctionOffset(elements.find(element=>element.id==='cross-straight'),crowdedBridleways),markerYBounds=centeredLayers.filter(layer=>layer.upright).flatMap(layer=>[layer.y+centeredOffset.y-10.5,layer.y+centeredOffset.y+10.5]);
assert.ok(Math.abs((Math.min(...markerYBounds)+Math.max(...markerYBounds))/2-50)<2,'Bridleway marker bounds must stay vertically centred after the approach fit shift');
const crowdedTranslations=[],crowdedContext={...ctx,translate(x,y){crowdedTranslations.push([x,y])}};
drawSheet({getContext:()=>crowdedContext},{...blankRoute(),steps:[{element:'cross-straight',note:'',distance:'',rotation:0,landmarks:crowdedBridleways,faintArms:[]}]},0,1,class{});
assert.ok(Math.abs(crowdedTranslations[0][1]-(26+(junctionCardHeight({element:'cross-straight',note:'',landmarks:crowdedBridleways})-36)/2))<1e-9,'Crowded junctions must be vertically centred inside their taller PDF card');
assert.equal(bridlewayIconLayers.filter(layer=>layer.fill==='#000000').length,1,'The bridleway marker should use one clear horseshoe silhouette');
assert.equal(bridlewayIconLayers[0].fill,'#fff','The bridleway marker should have a white clearance halo');
const horseshoePath=bridlewayIconLayers.find(layer=>layer.fill==='#000000').path;
assert.equal(bridlewayIconLayers.find(layer=>layer.fill==='#000000').fillRule,'evenodd','The source horseshoe vector should preserve its even-odd fill rule');
assert.ok(horseshoePath.startsWith('M 0 7.1 L 0.33 7.05')&&horseshoePath.includes('C 7.91 8.63 4.92 10.71 0 11'),'The bridleway marker should use the supplied horseshoe vector');
assert.ok(bridlewayIconLayers.every(layer=>layer.scale===.75),'The bridleway icon should match the parking icon footprint');
assert.ok(bridlewayIconLayers.every(layer=>layer.x===92&&layer.y===42),'Bridleway markers should sit in the extended road arm after the route arrow');
assert.ok(bridlewayLayers.some(layer=>layer.roadExtension&&layer.color==='#000000'),'Bridleway markers should extend their road arm with open road edges beyond the route arrow');
const faintBridlewayExtension=junctionLayers(elements[1],[{type:'bridleway',arm:'right'}],['right']).find(layer=>layer.roadExtension&&layer.color==='#000000');
assert.deepEqual(faintBridlewayExtension.dash,[5,4],'A bridleway on a hazenpaadje must keep the road extension dashed');
const faintRightEdgeStart=junctionLayers(elements[1],[],['right']).find(layer=>layer.faintEdge).path.match(/^M(-?[\d.]+)/)[1];
assert.equal(faintBridlewayExtension.path.match(/^M(-?[\d.]+)/)[1],faintRightEdgeStart,'A faint road extension must continue the existing dash phase');
assert.ok(!junctionLayers(elements[1],[{type:'bridleway',arm:'right'}],['right']).some(layer=>layer.faintMarkerMask),'A bridleway must not add a second clearance mask over the road edges');
const bridlewayApproach=junctionLayers(elements[1],[{type:'bridleway',arm:'approach'}]).filter(layer=>layer.upright);
assert.ok(bridlewayApproach.every(layer=>layer.x===50&&layer.y===90),'Bridleway markers on the bottom road should stay centred on the road below the entry dot');
assert.ok(bridlewayApproach.some(layer=>layer.path.startsWith('M 0 -14')),'Bridleway markers on the bottom road should retain their clearance halo');
const angledBridleway=junctionLayers(elements.find(element=>element.id==='angled-side-right-turn'),[{type:'bridleway',arm:'exit-1'}]);
const angledBridlewayArm=roadArms(elements.find(element=>element.id==='angled-side-right-turn')).find(arm=>arm.id==='exit-1');
assert.ok(angledBridleway.filter(layer=>layer.upright).every(layer=>Math.abs(layer.x-angledBridlewayArm.x)<1e-6&&layer.y<40),'Bridleway markers on non-route angled arms should stay at the road end');
assert.ok(!angledBridleway.some(layer=>layer.path==='M8 0H24'),'Non-route angled arms should not receive a route-arrow extension');
const angledRouteBridleway=junctionLayers(elements.find(element=>element.id==='angled-side-right-turn'),[{type:'bridleway',arm:'exit-2'}]);
assert.ok(angledRouteBridleway.filter(layer=>layer.upright).every(layer=>layer.x>70&&layer.y<30),'Bridleway markers on 45-degree route arms should sit after the arrow');
assert.ok(angledRouteBridleway.filter(layer=>layer.upright).every(layer=>layer.scale===.75),'45-degree route bridleways should keep the readable icon size');
assert.ok(angledRouteBridleway.some(layer=>layer.path.startsWith('M 0 -14')),'45-degree route markers should retain their clearance halo after the arrow');
const angledExtensionLayers=angledRouteBridleway.filter(layer=>layer.roadExtension),angledExtensionEdges=angledExtensionLayers.filter(layer=>layer.color==='#000000');
assert.equal(angledExtensionLayers.length,2,'A route bridleway should add an interior and open edge layer after the arrow');
assert.equal(angledExtensionEdges.length,1,'A bridleway road extension should combine its two open edges without a centre cap');
assert.ok(Math.abs(angledExtensionEdges[0].width*angledExtensionEdges[0].scale-1)<1e-9,'A bridleway road extension must keep one-unit edge ink');
assert.ok(Math.abs(angledExtensionLayers.find(layer=>layer.color==='#fff').width*angledExtensionLayers.find(layer=>layer.color==='#fff').scale-23)<1e-9,'A bridleway road extension must keep the white road interior');
for(const element of elements){
  const routeArm=roadArms(element).find(arm=>Math.abs(((arm.angle-(element.tip?.angle??NaN)+540)%360)-180)<.01);
  if(!routeArm)continue;
  const layers=junctionLayers(element,[{type:'bridleway',arm:routeArm.id}]),icon=layers.find(layer=>layer.upright&&layer.fill==='#000000'),arrow=layers.find(layer=>layer.path===element.arrow),radians=routeArm.angle*Math.PI/180;
  assert.ok((icon.x-arrow.x)*Math.cos(radians)+(icon.y-arrow.y)*Math.sin(radians)>0,`${element.id}: a route bridleway must be after the arrow`);
}
assert.equal(layerRotation(bridlewayIconLayers[0],90),-90,'Bridleway markers should counter-rotate with the route block');
const sharedArm=validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'bridge',arm:'left'},{type:'water',arm:'left',side:'right'},{type:'parking',arm:'left',side:'left'}]}]}).steps[0];
assert.equal(sharedArm.landmarks.length,3,'A road arm should allow an element on the road and one on each side');
assert.throws(()=>validateRoute({...route,steps:[{...route.steps[1],landmarks:[{type:'water',arm:'left',side:'right'},{type:'parking',arm:'left',side:'right'}]}]}),'Two landmarks may not occupy the same side of a road arm');
assert.ok(junctionLayers(elements[1],[{type:'water',arm:'right',side:'right'}]).filter(layer=>layer.upright).every(layer=>layerRotation(layer,90)===-90),'Water lines must stay horizontal when the route block rotates');
const waterBelowBridge=junctionLayers(elements[1],[{type:'bridge',arm:'right'},{type:'water',arm:'right',side:'right'}]);
assert.ok(waterBelowBridge.findIndex(layer=>layer.upright)>waterBelowBridge.findIndex(layer=>layer.path===elements[1].roads&&layer.color==='#fff')&&waterBelowBridge.findIndex(layer=>layer.upright)<waterBelowBridge.findIndex(layer=>layer.path===landmarkTypes[0].over),'Water must render above the road and below other route elements');
assert.ok(waterBelowBridge.filter(layer=>layer.upright).every(layer=>!layer.fill&&layer.color!=='#dedede'),'Water must not render a background color');
assert.equal((waterBelowBridge.find(layer=>layer.upright).path.match(/M/g)??[]).length,2,'Water must use two wavy lines');
assert.match(waterBelowBridge.find(layer=>layer.upright).path,/^M-10-3.*M-10 3/,'Water must stay compact enough to avoid the bridge marker');
for(const element of elements)for(const arm of landmarkArms(element))for(const side of ['left','right']){
  const geometryScale=40/((element.radius??40)+(element.throughExtension??0)),geometry=waterGeometry(element,arm,side,geometryScale),offset=(side==='left'?-27:27)*(arm.id==='approach'?-1:1)/geometryScale,radians=arm.angle*Math.PI/180;
  const water=junctionLayers(element,[{type:'water',arm:arm.id,side}]).filter(layer=>layer.upright);
  assert.ok(water.every(layer=>Math.abs(layer.x-(50+(arm.x+Math.cos(radians)*geometry.along-Math.sin(radians)*offset-50)*geometryScale))<1e-6&&Math.abs(layer.y-(50+(arm.y+Math.sin(radians)*geometry.along+Math.cos(radians)*offset-50)*geometryScale))<1e-6),'Water must stay on the selected side of every road arm');
}
for(const element of elements.filter(element=>element.arms)){
  const arms=roadArms(element),endpoints=generatedRoadEndpoints(element);
  const joinEdges=junctionLayers(element).filter(layer=>layer.joinEdge);
  assert.equal(joinEdges.length,arms.length*2,'Generated angled junctions must provide two connecting road-edge lines per arm');
  assert.ok(joinEdges.every(layer=>Math.abs(layer.width*layer.scale-1)<1e-9&&layer.color==='#000000'),'Connecting road-edge lines must retain their visible ink width');
  assert.equal(endpoints.length,arms.length,'Every road arm needs its own visible endpoint');
  assert.ok(element.roads.split('M').slice(1).every(path=>/^50 [\d.]+L50 50L/.test(path)),'Road paths must continue through the junction so outer corners have closed joins');
  const armLengths=endpoints.map(endpoint=>Math.hypot(endpoint.x-50,endpoint.y-50));
  assert.ok(Math.max(...armLengths)-Math.min(...armLengths)<.02,'Every angled junction arm must have the same length');
  for(const [index,arm] of arms.entries()){
    const layers=junctionLayers(element,[{type:'bridge',arm:arm.id}],[arm.id]);
    const bridge=layers.find(layer=>layer.path===landmarkTypes[0].over),scale=bridge.scale??1;
    assert.ok(Math.abs(bridge.width*scale-1)<1e-9,'Bridge ink must retain the same visible weight as road edges');
    const endDistance=Math.hypot(endpoints[index].x-50,endpoints[index].y-50),armDistance=Math.hypot(arm.x-50,arm.y-50);
    assert.ok(endDistance-armDistance>11,'A bridge must fit before the end of its road');
    for(const other of arms.filter(other=>other.id!==arm.id)){
      const gap=Math.abs(((other.angle-arm.angle+540)%360)-180)*Math.PI/180;
      const corner=12/Math.tan(gap/2);
      assert.ok((endDistance-corner)*scale>20,'Every angled road must have a clearly visible section beyond the junction');
      // Check the bridge rail tips against every neighbouring road, not just its centre.
      for(const along of [-10,10])for(const across of [-19,19]){
        const x=armDistance+along,projection=x*Math.cos(gap)+across*Math.sin(gap);
        if(projection>0)assert.ok(Math.abs(x*Math.sin(gap)-across*Math.cos(gap))>13,'Bridge rail tips must stay clear of neighbouring roads');
      }
      for(const [offset,iconRadius] of [[24,Math.hypot(12,12)],[27,Math.hypot(11,6)]])for(const side of [-1,1]){
        const across=offset*side,projection=armDistance*Math.cos(gap)+across*Math.sin(gap);
        if(projection>0&&projection<endDistance)assert.ok(Math.abs(armDistance*Math.sin(gap)-across*Math.cos(gap))>12+iconRadius,`${element.id}: upright parking and water symbols must clear neighbouring roads at every rotation`);
      }
    }
    for(const edge of layers.filter(layer=>layer.faintEdge)){
      assert.ok(Math.abs(edge.width*edge.scale-1)<1e-9,'Dashed road outlines must have the same one-unit ink width as solid road edges');
      assert.ok(edge.dash.every((length,index)=>Math.abs(length*edge.scale-[5,4][index])<1e-9),'Dash length and spacing must stay constant at every zoom');
    }
  }
  const dot=junctionLayers(element).at(-1);
  const geometryScale=40/(element.radius+element.throughExtension);
  assert.equal(dot.fill,'#000000');
  const routeStart=Number(element.route.match(/^M50 ([\d.]+)/)[1]);
  assert.ok(Math.abs(dot.y-(50+(routeStart-50)*geometryScale))<.01,'The approach dot must stay connected to the route arrow');
  const arrow=junctionLayers(element).find(layer=>layer.path===element.arrow),end=element.route.match(/L(-?[\d.]+) (-?[\d.]+)$/);
  assert.ok(Math.hypot(arrow.x-(50+(Number(end[1])-50)*geometryScale),arrow.y-(50+(Number(end[2])-50)*geometryScale))<.01,'The fixed-size arrowhead must stay attached to its scaled route');
}
for(const landmarks of [[{type:'bridge',arm:'ahead'}],[{type:'unknown',arm:'right'}],[{type:'parking',arm:'right',side:'right'},{type:'water',arm:'right',side:'right'}],null]){
  assert.throws(()=>validateRoute({...route,steps:[{...route.steps[1],landmarks}]}));
}
for(const element of elements){
  for(const arm of landmarkArms(element)){
    for(const type of landmarkTypes){
      const step={...route.steps[0],element:element.id,landmarks:[{type:type.id,arm:arm.id,...(sidedLandmarkTypes.includes(type.id)?{side:'right'}:{})}]};
      assert.deepEqual(validateRoute({...route,steps:[step]}).steps[0],step);
      const layers=junctionLayers(element,step.landmarks);
      assert.ok(layers.every(layer=>Number.isFinite(layer.width)));
      assert.ok(layers.every(layer=>['#000000','#fff'].includes(layer.color)&&(!layer.fill||['#000000','#fff'].includes(layer.fill))),'Every junction line must use the same ink color');
    }
  }
}
/*
// Run the real picker and click handler with a minimal DOM; rendering is checked above.
const nodes=new Map(),drafts=new Map();
const node=()=>({listeners:{},style:{},dataset:{},classList:{add(){},remove(){}},addEventListener(type,listener){this.listeners[type]=listener},setAttribute(){},replaceChildren(){},append(){},focus(){},close(){},getContext(){return ctx}});
const query=selector=>{if(!nodes.has(selector))nodes.set(selector,node());return nodes.get(selector)};
runInNewContext(readFileSync(new URL('./dist/app.js',import.meta.url),'utf8').replace(/^(?:import[^\n]+\n)+/,''),{
  ...routeSheet,structuredClone,Path2D:class{},setTimeout(){},clearTimeout(){},
  createApp:()=>({mount(){}}),ref:value=>({value}),nextTick:callback=>{callback?.();return Promise.resolve();},
  document:{documentElement:node(),querySelector:query,querySelectorAll:()=>[],createElement:node},
  window:{addEventListener(){}},localStorage:{getItem:key=>drafts.get(key),setItem:(key,value)=>drafts.set(key,value)}
});
const clickLibrary=(attribute,value)=>{
  const dataAttribute=`data-${attribute.replace(/[A-Z]/g,letter=>'-'+letter.toLowerCase())}`;
  const button={dataset:{[attribute]:value},hasAttribute:name=>name===dataAttribute,closest(selector){return selector.split(',').includes(`[${dataAttribute}]`)?this:null}};
  query('#element-library').listeners.click({target:button});
};
clickLibrary('technique','dot-arrow');
const picker=query('#element-library').innerHTML;
assert.ok(!picker.includes('data-element='),'Retired curves must not appear in the dot-and-arrow picker');
assert.deepEqual([...picker.matchAll(/data-direction="([^"]+)"/g)].map(match=>Number(match[1])),dotArrowDirections,'Keep only the eight straight directions');
for(const rotation of dotArrowDirections){
  clickLibrary('direction',String(rotation));
  const saved=JSON.parse(drafts.get('trailnote-route-v1')).steps[0];
  assert.deepEqual(saved,{technique:'dot-arrow',rotation,note:'',distance:''},'Selecting a direction must save a straight dot-and-arrow step');
  assert.ok(query('#route-steps').innerHTML.includes(`d="${dotArrowLayers()[0].path}"`),'The added step must show the straight arrow');
}
clickLibrary('technique','eyes');
assert.ok(!query('#element-library').innerHTML.includes('data-element='),'Curves must not appear in the eyes picker');
clickLibrary('direction','90');
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].technique,'eyes');
clickLibrary('technique','junction');
clickLibrary('element','bend-left');
assert.ok(!JSON.parse(drafts.get('trailnote-route-v1')).steps[0].technique,'Situation sketches must keep their existing step format');
assert.ok(query('#route-steps').innerHTML.includes('class="junction step-junction"')&&query('#route-steps').innerHTML.includes('viewBox="-10 0 120 100"'),'Step junctions must use the wider rectangular preview tile');
clickLibrary('technique','input');
assert.match(query('#element-library').innerHTML,/data-numbered checked/,'New free text must count by default');
query('#element-library').listeners.change({target:{dataset:{numbered:''},checked:false}});
clickLibrary('addInput','');
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].numbered,false,'Adding free text must save the selected numbering option');
await query('#import-file').listeners.change({target:{files:[{text:async()=>serializeRoute({...inputRoute,steps:[inputRoute.steps[0],compassRoute.steps[0]]})}]}});
const editorNumbers=()=>[...query('#route-steps').innerHTML.matchAll(/class="step-number"[^>]*>([^<]+)</g)].map(match=>match[1]);
query('#route-steps').listeners.change({target:{dataset:{numbered:'',index:'0'},checked:false}});
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].numbered,false,'Changing numbering must save immediately');
assert.deepEqual(editorNumbers(),['–','1'],'Editor numbering must match the PDF');
assert.equal(query('#step-count').textContent,'1 stap','The summary must exclude unnumbered text');
assert.ok(query('#route-steps').innerHTML.includes('Koers van stap 1 in graden'),'Accessible labels must use the displayed step number');
query('#undo').listeners.click();
assert.deepEqual(editorNumbers(),['1','2'],'Undo must restore numbering');
query('#route-steps').listeners.change({target:{dataset:{numbered:'',index:'0'},checked:false}});
query('#route-steps').listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action:'duplicate',index:'0'}}:null}});
assert.deepEqual(editorNumbers(),['–','–','1'],'Duplicated text must retain its numbering option');
query('#route-steps').listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action:'up',index:'2'}}:null}});
assert.deepEqual(editorNumbers(),['–','1','–'],'Reordering must keep consecutive step numbers');
clickLibrary('technique','photo');
assert.ok(query('#element-library').innerHTML.includes('data-add-photo')&&query('#element-library').innerHTML.includes('image/png,image/jpeg'),'The photo picker must accept PNG and JPEG files');
assert.ok(query('#element-library').innerHTML.includes('data-photo-columns'),'New photos must offer a PDF width');
assert.match(query('#element-library').innerHTML,/data-numbered checked/,'New photos must count by default');
query('#element-library').listeners.change({target:{dataset:{numbered:''},checked:false}});
clickLibrary('technique','input');
assert.doesNotMatch(query('#element-library').innerHTML,/data-numbered checked/,'Photo settings must not change the free-text choice');
clickLibrary('technique','photo');
assert.doesNotMatch(query('#element-library').innerHTML,/data-numbered checked/,'The photo numbering choice must survive switching techniques');
await query('#import-file').listeners.change({target:{files:[{text:async()=>serializeRoute(photoRoute)}]}});
assert.ok(query('#route-steps').innerHTML.includes('data-photo-columns data-index="0"'),'Existing photo steps must offer a PDF width');
query('#route-steps').listeners.change({target:{dataset:{photoColumns:'',index:'0'},value:'3'}});
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].columns,3,'Changing photo width must save the draft immediately');
query('#undo').listeners.click();
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].columns,1,'Undo must restore the previous photo width');
query('#route-steps').listeners.change({target:{dataset:{photoColumns:'',index:'0'},value:'2'}});
query('#route-steps').listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action:'duplicate',index:'0'}}:null}});
assert.deepEqual(JSON.parse(drafts.get('trailnote-route-v1')).steps.map(step=>step.columns),[2,2],'Duplicating a photo must preserve its width');
query('#route-steps').listeners.change({target:{dataset:{numbered:'',index:'0'},checked:false}});
assert.deepEqual(editorNumbers(),['–','1'],'Photo numbering must skip unchecked photos in the editor');
assert.equal(query('#step-count').textContent,'1 stap');
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].numbered,false,'Photo numbering must be saved immediately');
query('#undo').listeners.click();
assert.deepEqual(editorNumbers(),['1','2'],'Undo must restore photo numbering');
query('#route-steps').listeners.change({target:{dataset:{numbered:'',index:'0'},checked:false}});
query('#route-steps').listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action:'duplicate',index:'0'}}:null}});
assert.deepEqual(editorNumbers(),['–','–','1'],'Duplicated photos must retain their numbering option');
query('#route-steps').listeners.change({target:{dataset:{photoColumns:'',index:'0'},value:'3'}});
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].numbered,false,'Changing photo width must retain its numbering option');
clickLibrary('technique','junction');
clickLibrary('roadCount','2');
clickLibrary('layout','straight');
assert.ok(query('#element-library').innerHTML.includes('data-element="turn-back"'),'The two-road picker must offer turning back');
clickLibrary('element','turn-back');
assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].element,'turn-back');
assert.ok(query('#route-steps').innerHTML.includes(`d="${turnBack.route}"`),'Selecting turn back must show the U-turn route');
clickLibrary('element','straight');
for(let count=1;count<=3;count++){
  query('#route-steps').listeners.click({target:{closest:selector=>selector==='[data-action]'?{dataset:{action:'landmark-add',index:'0'}}:null}});
  const saved=JSON.parse(drafts.get('trailnote-route-v1')).steps[0];
  assert.equal(saved.landmarks.length,count);
  assert.ok(saved.landmarks.every(landmark=>landmark.arm==='centre'),'Adding straight-road landmarks must always use the centre');
}
const straightCard=query('#route-steps').innerHTML.split('</article>')[0];
assert.match(straightCard,/data-landmark-field="arm"[^>]*><option value="centre" selected>Midden van de weg<\/option><\/select>/,'The placement picker must have one central road position');
assert.match(straightCard,/value="centre:left" selected>Links van de weg/,'Side landmarks must still offer the left side without upper or lower roads');
assert.match(straightCard,/value="centre:right" selected>Rechts van de weg/);
assert.match(straightCard,/class="button add-landmark"[^>]* disabled/,'One central and two roadside landmarks fill the straight road');
for(const count of [3,4,5]){
  clickLibrary('roadCount',String(count));
  const layouts=elements.filter(element=>roadCount(element)===count).filter((element,index,list)=>list.findIndex(candidate=>junctionLayoutKey(candidate)===junctionLayoutKey(element))===index);
  const pickerLayoutIds=[...query('#element-library').innerHTML.matchAll(/data-layout="([^"]+)"/g)].map(match=>match[1]);
  const pickerLayouts=pickerLayoutIds.map(id=>elements.find(element=>element.id===id));
  assert.equal(pickerLayouts.length,layouts.length,'Each junction shape must appear once in the picker');
  if(count===3)assert.equal(pickerLayouts[0].id,'t-left','The regular T-junction must be first');
  if(count===4)assert.equal(pickerLayouts[0].id,'cross-straight','The regular four-way crossing must be first');
  if(count===5)assert.equal(pickerLayouts[0].id,'five-hard-right','The regular five-way crossing must be first');
  if(count>=3)for(const [index,layout] of pickerLayouts.entries()){
    const mirrored=pickerLayouts.map((candidate,candidateIndex)=>({candidate,candidateIndex})).filter(({candidate})=>mirroredJunctionLayoutKey(candidate)===mirroredJunctionLayoutKey(layout));
    if(mirrored.length===2){const mirrorIndex=mirrored.find(({candidate})=>candidate.id!==layout.id).candidateIndex;assert.equal(Math.abs(index-mirrorIndex),1,'Mirrored junction shapes must be adjacent in the overview');assert.equal(Math.min(index,mirrorIndex)%2,0,'Mirrored junction shapes must share an overview row');if(index<mirrorIndex)assert.ok(junctionLateralBias(layout)<junctionLateralBias(mirrored[1].candidate),'The left mirrored variant must come before the right variant');}
  }
  for(const layout of layouts){
    assert.ok(query('#element-library').innerHTML.includes(`data-layout="${layout.id}"`),'Layouts must appear as shape choices under their road count');
    clickLibrary('layout',layout.id);
    const choices=elements.filter(element=>junctionLayoutKey(element)===junctionLayoutKey(layout));
    for(const element of choices)assert.ok(query('#element-library').innerHTML.includes(`data-element="${element.id}"`),'Every exit must be offered after choosing a junction shape');
    clickLibrary('element',choices[0].id);
    assert.equal(JSON.parse(drafts.get('trailnote-route-v1')).steps[0].element,choices[0].id,'Selecting an exit must save the chosen layout');
    assert.ok(query('#route-steps').innerHTML.includes(`d="${choices[0].roads}"`),'The editor must draw the selected angled roads');
  }
}
*/

const appSource = readFileSync('dist/app.js', 'utf8');
const indexSource = readFileSync('dist/index.html', 'utf8');
for (const component of ['RoadTypeEditor', 'LandmarkEditor', 'StepCard', 'RouteEditor', 'Toolbar', 'StepLibrary', 'PreviewPanel', 'App']) {
  assert.match(appSource, new RegExp(`const ${component} = defineComponent`), `${component} component is missing`);
}
assert.match(appSource, /createApp\(App\)\.mount\('#app'\)/);
assert.match(appSource, /wide \? '-20 -20 140 140'/);
assert.match(indexSource, /<div id="app"><\/div>/);
assert.doesNotMatch(appSource, /#element-library.*\.innerHTML|#route-steps.*\.innerHTML/);

console.log('Route-sheet geometry and component smoke tests passed.');
