import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import {runInNewContext} from 'node:vm';
import * as hikeSheet from './dist/hike-sheet.js';
import {quizLetter,hikePages,stepNumbers,createPDF,junctionLayoutKey,mirroredJunctionLayoutKey,junctionLateralBias} from './dist/hike-sheet.js';
import {elements,blankHike,validateHike,pageCount,documentPageCount,hikeTechniques,stepsPerPage,rotateStep,roadArms,landmarkArms,roadCount,roadArmLabel,landmarkTypes,sidedLandmarkTypes,junctionLayers,junctionOffset,junctionDiagramScale,junctionCardHeight,compassLayers,clockLayers,dotArrowDirections,dotArrowShapes,dotArrowShape,dotArrowLayers,eyesLayers,stripkaartHeight,stripkaartCardHeight,stripkaartLayers,layerRotation,translations,translate,elementName,groupName,landmarkName,serializeHike,parseHike,drawSheet,drawTechniqueGuide,bridgeGeometry,parkingGeometry,waterGeometry} from './dist/hike-sheet.js';

const lucide=createRequire(import.meta.url)('./dist/vendor/lucide.js');
for(const name of ['Signpost','Undo2','FilePlus2','FileUp','FileJson2','FileDown','FileText','ListOrdered','Copy','ArrowUp','Navigation','Route','Compass','Divide','ArrowLeft','Flag','ArrowUpRight','Camera','Plus','Check','Trash2','RotateCcw','RotateCw','ArrowDown','ChevronDown','Settings2','X'])assert.ok(lucide[name],`Missing Lucide icon: ${name}`);

const hike=blankHike();
assert.equal(pageCount(hike),1);
assert.equal(documentPageCount(hike),1);
assert.equal(new Set(elements.map(e=>e.id)).size,elements.length);
assert.deepEqual([...new Set(elements.map(roadCount))].sort(),[2,3,4,5,6],'The intersection chooser must offer every supported road count');
// KRUISPUNTEN.md: the complete approach dot must remain visible after every rotation.
for(const element of elements){
  const layers=junctionLayers(element),dot=layers.at(-1),scale=dot.scale??1;
  const start=element.route.match(/^M(-?[\d.]+) (-?[\d.]+)/);
  const routeLayer=layers.find(layer=>layer.path===element.route);
  const radius=Number(dot.path.match(/a([\d.]+) /)[1])*scale;
  const arrow=layers.find(layer=>layer.path===element.arrow),roads=layers.filter(layer=>layer.road);
  assert.ok(Math.abs(routeLayer.width*(routeLayer.scale??1)-2.5)<1e-9,`${element.id}: hike ink must have the same visible width at every zoom`);
  assert.ok(roads.some(layer=>layer.path===element.roads&&layer.color==='#fff'&&layer.width*(layer.scale??1)>=20),`${element.id}: the road interior must remain white`);
  const roadBase=roads.filter(layer=>layer.path===element.roads);
  assert.ok(roadBase.some(layer=>layer.color==='#000000')?Math.abs((roadBase.find(layer=>layer.color==='#000000').width-roadBase.find(layer=>layer.color==='#fff').width)*(roadBase[0].scale??1)/2-1)<1e-9:roads.some(layer=>Math.abs(layer.width*(layer.scale??1)-1)<1e-9),`${element.id}: road edges must retain their one-unit ink width`);
  assert.equal(radius,3,`${element.id}: approach dots must have the same visible radius`);
  assert.equal(arrow.path,'M-4.5 -2L0 0L-4.5 2','Every junction must use the same arrowhead geometry');
  assert.equal(arrow.scale,1,'Arrowheads must keep their size when the road geometry shrinks');
  assert.equal(arrow.width,2.5);
  assert.equal(dot.fill,'#000000',`${element.id}: a hike needs a filled approach dot`);
  assert.ok(Math.hypot(dot.x-((routeLayer.x??0)+Number(start[1])*(routeLayer.scale??1)),dot.y-((routeLayer.y??0)+Number(start[2])*(routeLayer.scale??1)))<.01,`${element.id}: the dot must be centred on the hike start`);
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
for(const element of elements){hike.steps.push({element:element.id,note:'After the bridge',distance:'200',rotation:0,faintArms:[],landmarks:[]});}
assert.deepEqual(validateHike(hike),hike);
assert.deepEqual(parseHike(serializeHike(hike)),hike,'Exported hikes must survive an import round trip');
assert.deepEqual(JSON.parse(serializeHike(hike)),{format:'hike-generator-hike',version:1,hike},'New exports must use the hike envelope');
const compassHike={...blankHike(),steps:[{technique:'compass',bearing:237,note:'Walk on this bearing',distance:''}]};
assert.deepEqual(validateHike(compassHike),compassHike,'A compass bearing must be a complete hike item');
assert.deepEqual(parseHike(serializeHike(compassHike)),compassHike,'Compass items must survive export and import');
for(const bearing of [-1,360,1.5,'90',null])assert.throws(()=>validateHike({...compassHike,steps:[{...compassHike.steps[0],bearing}]}));
const clockHike={...blankHike(),steps:[{technique:'clock',time:'15:30',note:'Draw the hands',distance:''}]};
assert.deepEqual(validateHike(clockHike),clockHike,'A clock time must be a complete hike item');
assert.deepEqual(parseHike(serializeHike(clockHike)),clockHike,'Clock items must survive export and import');
for(const time of ['24:00','15:60','3:30',90,null])assert.throws(()=>validateHike({...clockHike,steps:[{...clockHike.steps[0],time}]}));
assert.equal(clockLayers().length,3,'A clock must render as an empty face with hour marks and a centre dot');
assert.throws(()=>validateHike({...compassHike,steps:[{...compassHike.steps[0],technique:'unknown'}]}));
assert.notEqual(compassLayers(0).at(-1).path,compassLayers(90).at(-1).path,'The compass arrow must follow the selected bearing');
assert.ok(compassLayers(359).every(layer=>Number.isFinite(layer.width)&&layer.color==='#000000'),'Compass lines must use the hike ink color');
const fractionHike={...blankHike(),steps:[{technique:'fraction',numerator:3,denominator:4,note:'Third road out of four',distance:''}]};
const inputHike={...blankHike(),steps:[{technique:'input',value:'Steek nu het zebrapad over',numbered:true,note:'',distance:''}]};
const photoData='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';
const photoHike={...blankHike(),steps:[{technique:'photo',image:photoData,columns:1,numbered:true,note:'Look for this landmark',distance:''}]};
const stripkaartHike={...blankHike(),steps:[{technique:'stripkaart',points:[{left:1,right:1,faintRoads:['right-0']},{left:0,right:2,faintRoads:[]},{left:2,right:0,faintRoads:['left-1']}],endMarker:'arrow',note:'Follow the line upward',distance:''}]};
assert.deepEqual(validateHike(stripkaartHike),stripkaartHike,'A stripkaart must remain one hike step with editable points');
assert.deepEqual(parseHike(serializeHike(stripkaartHike)),stripkaartHike,'Stripkaart points must survive export and import');
assert.equal(validateHike({...stripkaartHike,steps:[{...stripkaartHike.steps[0],endMarker:undefined}]}).steps[0].endMarker,'arrow','Existing stripkaarten must default to an arrowhead');
const stripkaartSideRoads=layers=>layers.filter(layer=>/^M50 [\d.]+L/.test(layer.path));
assert.equal(stripkaartSideRoads(stripkaartLayers(stripkaartHike.steps[0].points)).length,6,'A stripkaart must render each marked side road');
const styledStripkaartRoads=stripkaartSideRoads(stripkaartLayers([{left:1,right:1,faintRoads:['left-0']}])),faintStripkaartRoad=styledStripkaartRoads.find(layer=>layer.dash),regularStripkaartRoad=styledStripkaartRoads.find(layer=>!layer.dash);
assert.deepEqual([faintStripkaartRoad.width,faintStripkaartRoad.cap,faintStripkaartRoad.dash],[2.5,'butt',[5,4]],'Stripkaart hazenpaadjes must be as thick as regular stripkaart roads');
assert.deepEqual([regularStripkaartRoad.width,regularStripkaartRoad.cap],[2.5,'round'],'Regular stripkaart roads must keep the shared hike-line weight');
const equalLengthRoads=stripkaartSideRoads(stripkaartLayers([{left:1,right:1,faintRoads:['left-0']}])).map(layer=>Math.abs(Number(layer.path.match(/L([\d.]+)/)[1])-50));
assert.deepEqual(equalLengthRoads,[22,22],'Regular and faint stripkaart side roads must have the same extended length');
for(const endMarker of ['arrow','none','bar'])assert.deepEqual(parseHike(serializeHike({...stripkaartHike,steps:[{...stripkaartHike.steps[0],endMarker}]})).steps[0].endMarker,endMarker,'Every stripkaart end marking must survive export and import');
assert.ok(stripkaartLayers(stripkaartHike.steps[0].points,'arrow').some(layer=>layer.path==='M44 20L50 14L56 20'),'The default stripkaart must end in an arrowhead');
const unmarkedStripkaartLayers=stripkaartLayers(stripkaartHike.steps[0].points,'none');
const barredStripkaartLayers=stripkaartLayers(stripkaartHike.steps[0].points,'bar');
assert.ok(!unmarkedStripkaartLayers.some(layer=>layer.path==='M44 20L50 14L56 20'||layer.path==='M22 14H78'),'A stripkaart may end without a marker');
assert.equal(unmarkedStripkaartLayers[0].path,barredStripkaartLayers[0].path,'An unmarked stripkaart must end at the same height as the wide-bar variant');
assert.ok(barredStripkaartLayers.some(layer=>layer.path==='M22 14H78'),'A stripkaart may end in a wide horizontal line');
assert.deepEqual(validateHike({...stripkaartHike,steps:[{...stripkaartHike.steps[0],points:[{left:1,right:0}]}]}).steps[0].points[0].faintRoads,[],'Existing stripkaarten must load with regular side roads');
const pairedStripkaartRoads=stripkaartSideRoads(stripkaartLayers([{left:2,right:2,faintRoads:['left-0','right-1']}]));
assert.ok(pairedStripkaartRoads.every(layer=>{const [,startY,endX,endY]=layer.path.match(/^M50 ([\d.]+)L([\d.]+) ([\d.]+)$/);return Math.abs(Number(endY)-Number(startY))<Math.abs(Number(endX)-50);}),'Two side roads must use a compact angle below 45 degrees');
assert.equal(Math.max(...pairedStripkaartRoads.map(layer=>Number(layer.path.match(/ ([\d.]+)$/)[1])))-Math.min(...pairedStripkaartRoads.map(layer=>Number(layer.path.match(/ ([\d.]+)$/)[1]))),18,'A paired side-road fan must stay compact');
assert.equal(new Set(pairedStripkaartRoads.map(layer=>layer.path.match(/^M50 ([\d.]+)L/)[1])).size,1,'Roads from one junction must share one point on the arrow body');
assert.equal(stripkaartHeight([{left:1,right:0,faintRoads:[]}]),100,'A short stripkaart keeps the original arrow height');
const spacedStripkaartPoints=[{left:1,right:1,faintRoads:[]},{left:0,right:2,faintRoads:[]},{left:2,right:0,faintRoads:[]}];
assert.equal(stripkaartHeight(spacedStripkaartPoints),132,'The arrow must grow by one junction interval per additional split');
const printableStripkaartStep={...stripkaartHike.steps[0],points:Array.from({length:6},()=>({left:1,right:1,faintRoads:[]})),note:''};
assert.equal(stripkaartCardHeight({...printableStripkaartStep,points:printableStripkaartStep.points.slice(0,1)}),40,'A short stripkaart PDF card keeps the standard row height');
assert.equal(stripkaartCardHeight(printableStripkaartStep),4+stripkaartHeight(printableStripkaartStep.points)*.32,'A stripkaart PDF card must grow instead of shrinking its figure');
assert.equal(stripkaartCardHeight({...printableStripkaartStep,points:Array.from({length:50},()=>({left:1,right:1,faintRoads:[]}))}),216,'A stripkaart card must stay within one printable page');
const spacedStripkaartRoads=stripkaartSideRoads(stripkaartLayers(spacedStripkaartPoints)),splitOrigins=[...new Set(spacedStripkaartRoads.map(layer=>Number(layer.path.match(/^M50 ([\d.]+)L/)[1])))].sort((a,b)=>a-b);
assert.deepEqual(splitOrigins,[38,66,94],'Splits must keep a fixed vertical interval as the arrow grows');
const splitRanges=splitOrigins.map(origin=>spacedStripkaartRoads.filter(layer=>Number(layer.path.match(/^M50 ([\d.]+)L/)[1])===origin).flatMap(layer=>[origin,Number(layer.path.match(/ ([\d.]+)$/)[1])])).map(values=>({min:Math.min(...values),max:Math.max(...values)}));
assert.ok(splitRanges.every((range,index)=>index===0||splitRanges[index-1].max<range.min),'Side-road fans from neighbouring splits must not overlap');
const crowdedStripkaartLayers=stripkaartSideRoads(stripkaartLayers([{left:1,right:0,faintRoads:[]},{left:4,right:0,faintRoads:[]}]));
const crowdedStripkaartY=crowdedStripkaartLayers.flatMap(layer=>{const [,startY,,endY]=layer.path.match(/^M50 ([\d.]+)L([\d.]+) ([\d.]+)$/);return [Number(startY),Number(endY)];});
assert.ok(Math.min(...crowdedStripkaartY)>20&&Math.max(...crowdedStripkaartY)<stripkaartHeight([{},{}])-20,'Stripkaart junctions must stay between the arrowhead and start dot');
for(const points of [[],[{left:5,right:0}],[{left:0,right:5}],[{left:1,right:0,faintRoads:['left-1']}],[{left:1,right:0,faintRoads:['left-0','left-0']}]])assert.throws(()=>validateHike({...stripkaartHike,steps:[{...stripkaartHike.steps[0],points}]}));
for(const endMarker of ['',null,'line','wide'])assert.throws(()=>validateHike({...stripkaartHike,steps:[{...stripkaartHike.steps[0],endMarker}]}));
assert.equal(translate('nl','technique.input'),'Vrije tekst');
assert.equal(translate('nl','technique.junction'),'Kruispunten');
assert.equal(translate('nl','technique.photo'),'Foto');
assert.equal(translate('nl','startPlaceholder'),'Opmerking bij het startpunt');
assert.equal(translate('nl','finish'),'EIND');
assert.equal(translate('nl','finishPlaceholder'),'Opmerking bij het eindpunt');
assert.deepEqual(validateHike(inputHike),inputHike,'Free text steps must be complete hike items');
assert.deepEqual(parseHike(serializeHike(inputHike)),inputHike,'Free text must survive export and import');
assert.deepEqual(validateHike({...inputHike,steps:[{...inputHike.steps[0],numbered:undefined}]}),inputHike,'Existing free text must remain numbered');
const unnumberedInput={...inputHike.steps[0],numbered:false};
assert.deepEqual(parseHike(serializeHike({...inputHike,steps:[unnumberedInput]})).steps[0],unnumberedInput,'Unnumbered text must survive export and import');
for(const numbered of [null,0,1,'false'])assert.throws(()=>validateHike({...inputHike,steps:[{...inputHike.steps[0],numbered}]}));
assert.deepEqual(stepNumbers(blankHike()),[]);
assert.deepEqual(stepNumbers({...inputHike,steps:[unnumberedInput,unnumberedInput]}),[null,null],'A hike may consist entirely of unnumbered text');
assert.deepEqual(stepNumbers({...compassHike,steps:[{...compassHike.steps[0],numbered:false}]}),[1],'Other hike techniques must still count in numbering');
for(const value of [null,42,'x'.repeat(161)])assert.throws(()=>validateHike({...inputHike,steps:[{...inputHike.steps[0],value}]}));
assert.deepEqual(validateHike(photoHike),photoHike,'Photo steps must be complete hike items');
assert.deepEqual(parseHike(serializeHike(photoHike)),photoHike,'Photos must survive export and import');
assert.deepEqual(validateHike({...photoHike,steps:[{...photoHike.steps[0],numbered:undefined}]}),photoHike,'Existing photos must remain numbered');
for(const numbered of [null,0,1,'false'])assert.throws(()=>validateHike({...photoHike,steps:[{...photoHike.steps[0],numbered}]}));
const unnumberedPhoto={...photoHike.steps[0],numbered:false};
assert.deepEqual(stepNumbers({...photoHike,steps:[unnumberedPhoto,unnumberedInput,photoHike.steps[0],compassHike.steps[0]]}),[null,null,1,2],'Photos and text must share the same numbering rules');
assert.deepEqual(validateHike({...photoHike,steps:[{...photoHike.steps[0],columns:undefined}]}),photoHike,'Existing photos must default to one column');
for(const columns of [1,2,3]){
  const sizedPhoto={...photoHike,steps:[{...photoHike.steps[0],columns}]};
  assert.deepEqual(parseHike(serializeHike(sizedPhoto)),sizedPhoto,'Photo widths must survive export and import');
  const unnumbered={...photoHike,steps:[{...unnumberedPhoto,columns}]};
  assert.deepEqual(parseHike(serializeHike(unnumbered)),unnumbered,'All photo widths must retain their numbering option');
}
for(const columns of [0,4,-1,1.5,'2',null])assert.throws(()=>validateHike({...photoHike,steps:[{...photoHike.steps[0],columns}]}));
for(const image of ['', 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==', 'data:image/png;base64,not base64'])assert.throws(()=>validateHike({...photoHike,steps:[{...photoHike.steps[0],image}]}));
const quizHike={...blankHike(),steps:[{technique:'quiz',question:'How many legs does a spider have?',answers:['Six','Eight','Ten','Twelve'],note:'Count clockwise',distance:'200'}]};
assert.ok(lucide.CircleHelp,'The quiz technique needs its picker icon');
assert.equal(translate('nl','technique.quiz'),'Quizvraag');
assert.deepEqual(parseHike(serializeHike(quizHike)),quizHike,'Quiz questions and answer order must survive export and import');
assert.deepEqual(Array.from({length:6},(_,i)=>quizLetter(i)).join(''),'ABCDEF','Answer letters must run from A through F');
for(const fields of [{question:null},{question:'x'.repeat(161)},{answers:null},{answers:[]},{answers:['Only one']},{answers:Array(7).fill('Answer')},{answers:['Valid',42]},{answers:['Valid','x'.repeat(81)]},{answers:Array(2)}])assert.throws(()=>validateHike({...quizHike,steps:[{...quizHike.steps[0],...fields}]}));
for(const count of [2,6])assert.equal(parseHike(serializeHike({...quizHike,steps:[{...quizHike.steps[0],answers:Array(count).fill('Answer')}]})).steps[0].answers.length,count,'Both quiz answer limits must survive export and import');
const unfinishedQuiz={...quizHike,steps:[{...quizHike.steps[0],question:'',answers:['','']}]};
assert.deepEqual(parseHike(serializeHike(unfinishedQuiz)),unfinishedQuiz,'Unfinished quiz edits must survive saving and reloading a draft');
await assert.rejects(()=>createPDF(unfinishedQuiz,()=>{throw Error('Must validate before rendering');},class{},'nl'),/Vul de vraag/);
assert.deepEqual(validateHike(fractionHike),fractionHike,'A fraction must be a complete hike item');
assert.deepEqual(parseHike(serializeHike(fractionHike)),fractionHike,'Fraction items must survive export and import');
for(const values of [{numerator:0},{numerator:5},{numerator:1.5},{numerator:'3'},{denominator:1},{denominator:100},{denominator:'4'}])assert.throws(()=>validateHike({...fractionHike,steps:[{...fractionHike.steps[0],...values}]}));
const dotArrowHike={...blankHike(),steps:dotArrowDirections.map(rotation=>({technique:'dot-arrow',rotation,note:'Follow the arrow',distance:''}))};
const eyesHike={...blankHike(),steps:dotArrowDirections.map(rotation=>({technique:'eyes',rotation,note:'Follow the eyes',distance:''}))};
assert.ok(lucide.Eye,'The eyes technique needs its picker icon');
assert.equal(translate('nl','technique.eyes'),'Oogjes');
assert.deepEqual(parseHike(serializeHike(eyesHike)),eyesHike,'All eye directions must survive export and import');
assert.equal(validateHike({...blankHike(),steps:[{technique:'eyes',note:'',distance:''}]}).steps[0].rotation,0);
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateHike({...eyesHike,steps:[{...eyesHike.steps[0],rotation}]}));
const gazeOffsets=[[0,-12],[4.95,-8.49],[7,0],[4.95,8.49],[0,12],[-4.95,8.49],[-7,0],[-4.95,-8.49]];
eyesHike.steps.forEach((step,index)=>{
  const [outlines,pupils]=eyesLayers(step.rotation);
  assert.deepEqual(outlines,eyesLayers(0)[0],'Eyes must stay upright in every direction');
  assert.ok(pupils.x===gazeOffsets[index][0]&&pupils.y===gazeOffsets[index][1],'Both pupils must look in the selected walking direction');
});
const eyesStep=structuredClone(eyesHike.steps[0]);
rotateStep(eyesStep,-45);assert.equal(eyesStep.rotation,315);
rotateStep(eyesStep,45);assert.equal(eyesStep.rotation,0);
assert.deepEqual(parseHike(serializeHike(dotArrowHike)),dotArrowHike,'All dot-and-arrow directions must survive export and import');
assert.equal(validateHike({...blankHike(),steps:[{technique:'dot-arrow',note:'',distance:''}]}).steps[0].rotation,0,'Dot and arrow should default to straight ahead');
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateHike({...dotArrowHike,steps:[{...dotArrowHike.steps[0],rotation}]}));
const dotArrowShapeHike={...blankHike(),steps:[...dotArrowShapes,...elements].map(element=>({technique:'dot-arrow',element:element.id,rotation:90,note:'Take the marked exit',distance:''}))};
assert.deepEqual(parseHike(serializeHike(dotArrowShapeHike)),dotArrowShapeHike,'Curves and legacy shapes must retain their shape and rotation on export and import');
for(const element of ['unknown','',null,42])assert.throws(()=>validateHike({...dotArrowHike,steps:[{...dotArrowHike.steps[0],element}]}));
for(const element of [...dotArrowShapes,...elements]){
  const layers=dotArrowLayers(element);
  assert.equal(layers.length,3,'Every curve and legacy shape must render only the hike, arrowhead and dot');
  assert.ok(!layers.some(layer=>layer.path===element.roads),'Dot and arrow must never show side roads, including previously saved shapes');
  assert.ok(layers.some(layer=>layer.path===element.route&&Math.abs(layer.width*(layer.scale??1)-2.5)<1e-9),'The selected hike should remain clearly marked');
  assert.ok(layers.some(layer=>layer.path===element.arrow),'Every layout must retain the arrow for its chosen exit');
  assert.ok(layers.at(-1).fill==='#000000'&&layers.at(-1).y>50,'The approach dot must stay below the junction');
  assert.ok(layers.every(layer=>layer.color==='#000000'&&layer.width*(layer.scale??1)<=2.5+1e-9),'Dot-and-arrow shapes should use consistent ink and stroke widths');
}
assert.equal(dotArrowShapes.length,6,'Keep retired curves readable in saved hikes');
for(const shape of dotArrowShapes){
  assert.match(shape.route,/[QC]/,'Retired curves must keep their saved path');
  assert.notEqual(elementName(shape,'nl'),`element.${shape.name}`,'Every curve needs a translated name');
}
const dotArrowStep=structuredClone(dotArrowHike.steps[0]);
rotateStep(dotArrowStep,-45);assert.equal(dotArrowStep.rotation,315);
rotateStep(dotArrowStep,90);assert.equal(dotArrowStep.rotation,45);
assert.equal(translate('nl','technique.dot-arrow'),'Bolletje-pijltje');
for(const rotation of dotArrowDirections)assert.notEqual(translate('nl',`direction.${rotation}`),`direction.${rotation}`);
for(const invalid of ['{','null','[]','42',JSON.stringify(hike),JSON.stringify({format:'other',version:1,hike}),JSON.stringify({format:'hike-generator-hike',version:2,hike}),'x'.repeat(1_000_001)])assert.throws(()=>parseHike(invalid));
assert.equal(stepsPerPage,15);
assert.equal(pageCount(hike),25);
assert.deepEqual(hikePages(hike).flatMap(page=>page.flatMap(row=>row.steps)),hike.steps,'Pagination must preserve every hike step in order');
assert.equal(pageCount({...hike,steps:hike.steps.slice(0,12)}),1);
assert.equal(pageCount({...hike,steps:hike.steps.slice(0,13)}),2);
const rects=[],printed=[],positions=[],ctx={scale(){},fillRect(){},fillText(value,x,y){printed.push(value);positions.push({value,x,y})},beginPath(){},moveTo(){},lineTo(){},stroke(){},save(){},translate(){},rotate(){},restore(){},setLineDash(){},arc(){},fill(){},strokeRect(...args){rects.push(args)},measureText(value){return {width:value.length}}};
const stripkaartPdfRects=[],stripkaartPdfScales=[];
drawSheet({getContext:()=>({...ctx,scale(x,y){stripkaartPdfScales.push([x,y])},strokeRect(...args){stripkaartPdfRects.push(args)}})},{...blankHike(),steps:[printableStripkaartStep]},0,1,class{constructor(value){this.value=value}});
assert.equal(stripkaartPdfRects[0][3],stripkaartCardHeight(printableStripkaartStep),'The rendered PDF card must use the calculated stripkaart height');
assert.ok(stripkaartPdfScales.some(([x,y])=>x===.32&&y===.32),'A growing stripkaart PDF card must preserve the readable drawing scale');
const stripkaartPdfPaths=[];
drawSheet({getContext:()=>({...ctx,stroke(path){if(path)stripkaartPdfPaths.push(path.value)},strokeRect(){}})},{...blankHike(),steps:[{...printableStripkaartStep,endMarker:'bar'}]},0,1,class{constructor(value){this.value=value}});
assert.ok(stripkaartPdfPaths.includes('M22 14H78'),'The PDF must use the selected stripkaart end marking');
const pagedStripkaartHike={...blankHike(),steps:Array(9).fill(printableStripkaartStep)};
assert.equal(pageCount(pagedStripkaartHike),2,'Growing stripkaart cards must participate in PDF pagination');
for(let page=0;page<pageCount(pagedStripkaartHike);page++)drawSheet({getContext:()=>({...ctx,strokeRect(x,y,width,height){assert.ok(y+height<267,'A growing stripkaart card must stay above the finish and footer')}})},pagedStripkaartHike,page,1,class{});
const turnBack=elements.find(element=>element.id==='turn-back');
const turnBackHike=validateHike({...blankHike(),steps:[{element:turnBack.id,note:'Keer om bij de uitkijktoren.',distance:'',rotation:90}]});
assert.equal(roadCount(turnBack),2,'Turning back must be available under two roads');
assert.equal(elementName(turnBack,'nl'),'Omkeren');
const angledStraightRight=elements.find(element=>element.id==='skew-cross-straight-45-right');
assert.equal(roadCount(angledStraightRight),4,'The 45-degree straight-right layout must be a four-way intersection');
assert.equal(elementName(angledStraightRight,'nl'),'Rechtdoor, 45° rechts');
const angledStraightLeft=elements.find(element=>element.id==='skew-cross-mirrored-straight-45-left');
assert.deepEqual(roadArms(angledStraightLeft).map(arm=>arm.angle),[90,0,180,225],'The mirrored 45-degree layout must swap the diagonal side');
assert.equal(elementName(angledStraightLeft,'nl'),'Rechtdoor, 45° links');
assert.deepEqual(parseHike(serializeHike(turnBackHike)),turnBackHike,'The turn-back instruction, rotation and note must survive saving');
const turnBackPaths=[],turnBackNotes=[];
drawSheet({getContext:()=>({...ctx,strokeRect(){},stroke(path){if(path)turnBackPaths.push(path.value)},fill(path){turnBackPaths.push(path.value)},fillText(value){turnBackNotes.push(value)}})},turnBackHike,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(turnBackPaths,junctionLayers(turnBack).map(layer=>layer.path),'The printed turn-back symbol must match the editor');
assert.ok(turnBackNotes.includes(turnBackHike.steps[0].note),'The turn-back destination must appear in the printed note');
const firstPagePrinted=[],secondPagePrinted=[],multiPageHike={...hike,start:'Trailhead',finish:'Campsite',steps:hike.steps.slice(0,stepsPerPage+1)};
drawSheet({getContext:()=>({...ctx,fillText(value){firstPagePrinted.push(value)},strokeRect(){}})},multiPageHike,0,1,class{});
drawSheet({getContext:()=>({...ctx,fillText(value){secondPagePrinted.push(value)},strokeRect(){}})},multiPageHike,1,1,class{});
assert.ok(!firstPagePrinted.includes('FINISH')&&!firstPagePrinted.includes('Campsite'),'FINISH must only appear on the last hike page');
assert.ok(!firstPagePrinted.includes('CONTINUE')&&!firstPagePrinted.some(value=>String(value).startsWith('Next:')),'Continuation pages must not use a continuation heading');
assert.ok(!secondPagePrinted.includes('START')&&!secondPagePrinted.includes('Trailhead'),'A continuation page must not repeat the start instructions');
assert.ok(secondPagePrinted.includes('FINISH')&&secondPagePrinted.includes('Campsite'),'The last hike page must include the finish instructions');
const endpointText=[];
drawSheet({getContext:()=>({...ctx,fillText(value,x,y){endpointText.push({value,y,baseline:this.textBaseline})},strokeRect(){}})},{...blankHike(),start:'Trailhead',finish:'Campsite',steps:[hike.steps[0]]},0,1,class{});
for(const [label,note] of [['START','Trailhead'],['FINISH','Campsite']]){const labelText=endpointText.find(item=>item.value===label),noteText=endpointText.find(item=>item.value===note);assert.equal(labelText.y,noteText.y,`${label} and its note must share a baseline`);assert.equal(labelText.baseline,'alphabetic',`${label} must use baseline alignment`);}
const titledEndpoint=[];
drawSheet({getContext:()=>({...ctx,fillText(value,x,y){titledEndpoint.push({value,y})},strokeRect(){}})},{...blankHike(),title:'Weekendwandeling',start:'Trailhead',steps:[hike.steps[0]]},0,1,class{});
assert.equal(titledEndpoint.find(item=>item.value==='START').y,31.4,'The PDF title should leave a compact gap before the start note');
drawSheet({getContext:()=>ctx},{...blankHike(),steps:[{...hike.steps[0],note:''},{...hike.steps[0],note:'Short note'}]},0,1,class{});
assert.equal(rects[0][3],44,'A junction without a note should leave equal vertical margins around its enlarged diagram');
assert.ok(rects[1][3]>rects[0][3],'A hike item should only grow when its note needs space');
const paddingRects=[],paddingText=[];
drawSheet({getContext:()=>({...ctx,strokeRect(...args){paddingRects.push(args)},fillText(value,x,y){paddingText.push({value,x,y})}})},{...blankHike(),steps:[{...hike.steps[0],note:''},{...hike.steps[0],note:'Short note'}]},0,1,class{});
assert.equal(paddingText.find(item=>item.value==='1.').y-paddingRects[0][1],2,'Every regular hike item must start with 2 mm padding');
const shortNote=paddingText.find(item=>item.value==='Short note');
assert.equal(paddingRects[1][1]+paddingRects[1][3]-(shortNote.y+2),2,'Every regular hike item must end with 2 mm padding');
assert.ok(printed.includes('START')&&!printed.includes('Start point'),'The PDF must render START without inventing a description');
assert.ok(printed.includes('FINISH')&&!printed.includes('Finish point'),'The PDF must render FINISH without inventing a description');
assert.ok(!printed.includes('Untitled hike'),'An empty hike title must not render a PDF placeholder');
assert.ok(!printed.includes('2 hike items'),'The PDF must not show the hike-item count');
assert.ok(positions.find(item=>item.value==='FINISH').y>rects[1][1]+rects[1][3]&&positions.find(item=>item.value==='FINISH').y<267,'FINISH must follow the last hike-item row');
for(const flavor of ['HIKE-GENERATOR / ROUTE SHEET','READ LEFT TO RIGHT, TOP TO BOTTOM','Start at the dot and follow the arrow','Dot = your approach. Follow the dark arrow.'])assert.ok(!printed.some(line=>line.includes(flavor)),'PDF must not render flavor text');
drawSheet({getContext:()=>ctx},compassHike,0,1,class{});
assert.ok(printed.includes('237°'),'The PDF must print the exact compass bearing');
drawSheet({getContext:()=>ctx},fractionHike,0,1,class{});
assert.ok(printed.includes('3/4'),'The PDF must print the exact hike fraction');
drawSheet({getContext:()=>ctx},inputHike,0,1,class{});
assert.ok(printed.includes('1. Steek nu het zebrapad over'),'The PDF must print free text steps with their number');
const mixedNumberingHike={...blankHike(),steps:[unnumberedInput,compassHike.steps[0],unnumberedInput,inputHike.steps[0],quizHike.steps[0],...Array(9).fill(hike.steps[0]),unnumberedInput,unnumberedInput,fractionHike.steps[0],photoHike.steps[0]]};
assert.deepEqual(stepNumbers(mixedNumberingHike),[null,1,null,2,3,4,5,6,7,8,9,10,11,12,null,null,13,14],'Numbering must skip consecutive free text and continue across pages');
const numberedText=[];
for(let page=0;page<pageCount(mixedNumberingHike);page++)drawSheet({getContext:()=>({...ctx,fillText(value){numberedText.push(value)}})},mixedNumberingHike,page,1,class{});
assert.deepEqual(numberedText.flatMap(value=>String(value).match(/^(\d+)\.(?: |$)/)?.slice(1).map(Number)??[]),Array.from({length:14},(_,i)=>i+1),'All rendered techniques must use continuous numbering across pages');
assert.equal(numberedText.filter(value=>value===unnumberedInput.value).length,4,'Unnumbered text must remain visible without a numeric prefix');
drawSheet({getContext:()=>ctx},photoHike,0,1,class{});
assert.ok(printed.includes('Photo'),'The PDF must render photo steps');
const mixedPhotoHike={...blankHike(),title:'Photo widths',steps:[photoHike.steps[0],hike.steps[0],{...photoHike.steps[0],columns:2},quizHike.steps[0],{...photoHike.steps[0],columns:3},inputHike.steps[0],hike.steps[0],{...photoHike.steps[0],columns:2},hike.steps[0]]};
assert.deepEqual(hikePages(mixedPhotoHike).map(rows=>rows.map(row=>[row.start,row.steps.length])),[[[0,2],[2,2],[4,1]],[[5,2],[7,2]]],'Wide photos must wrap without filling gaps with later hike steps');
assert.deepEqual(hikePages(mixedPhotoHike).flatMap(rows=>rows.flatMap(row=>row.steps)),mixedPhotoHike.steps,'Pagination must preserve every step in hike order');
const photoNumbers=[],photoAreas=[];
for(let page=0;page<pageCount(mixedPhotoHike);page++){
  const boxes=[],draws=[];
  drawSheet({getContext:()=>({...ctx,strokeRect(...args){if([58,120,182].includes(args[2]))boxes.push(args);else photoAreas.push(args)},fillText(value,x,y){draws.push({value,x,y});const match=String(value).match(/^(\d+)\. /)||String(value).match(/^(\d+)\.$/);if(match)photoNumbers.push(Number(match[1]));}})},mixedPhotoHike,page,1,class{});
  assert.ok(boxes.every(([x,y,width,height])=>x>=14&&x+width<=196&&y+height<267),'All photo sizes must fit inside the printable page');
  for(let i=1;i<boxes.length;i++){
    const [x,y]=boxes[i],[previousX,previousY,previousWidth,previousHeight]=boxes[i-1];
    assert.ok(y===previousY?x>=previousX+previousWidth+4:y>=previousY+previousHeight+2,'Wide photos must not overlap adjacent or following cards');
  }
  for(const {value,x,y} of draws.filter(draw=>draw.value==='Look for this landmark'))assert.ok(boxes.some(([bx,by,width,height])=>x>=bx&&x<bx+width&&y>by&&y+2<=by+height),'Photo notes must stay inside their resized card');
  if(page===0)assert.deepEqual(boxes.map(([x,,width])=>[x,width]),[[14,58],[76,58],[14,120],[138,58],[14,182]],'Photos must span the selected columns while neighbours retain their size');
}
assert.deepEqual(photoNumbers,mixedPhotoHike.steps.map((_,i)=>i+1),'Numbering must count steps, not occupied columns');
assert.deepEqual(photoAreas.map(([, ,width])=>width),[54,116,178,116],'The photo itself must grow with the card');
assert.ok(photoAreas.every(([, ,width,height])=>Math.abs(width/height-54/25)<1e-9),'The photo area must grow proportionally');
const unnumberedPhotoHike={...mixedPhotoHike,steps:mixedPhotoHike.steps.map(step=>step.technique==='photo'||step.technique==='input'?{...step,numbered:false}:step)};
assert.deepEqual(hikePages(unnumberedPhotoHike).map(rows=>rows.map(row=>row.start)),hikePages(mixedPhotoHike).map(rows=>rows.map(row=>row.start)),'Unnumbered photos must keep the same column and page layout');
const unnumberedPhotoText=[],unnumberedPhotoBoxes=[];
for(let page=0;page<pageCount(unnumberedPhotoHike);page++)drawSheet({getContext:()=>({...ctx,fillText(value){unnumberedPhotoText.push(value)},strokeRect(...args){if([58,120,182].includes(args[2]))unnumberedPhotoBoxes.push(args)}})},unnumberedPhotoHike,page,1,class{});
assert.deepEqual(unnumberedPhotoText.flatMap(value=>String(value).match(/^(\d+)\.(?: |$)/)?.slice(1).map(Number)??[]),[1,2,3,4],'Only counted steps may print a number, continuously across photo pages');
assert.ok(!unnumberedPhotoText.some(value=>String(value).includes('null')),'Unnumbered photos must not print a placeholder number');
assert.equal(unnumberedPhotoText.filter(value=>value==='Photo').length,4,'All unnumbered photos must still render');
assert.equal(unnumberedPhotoText.filter(value=>value===photoHike.steps[0].note).length,4,'Unnumbered photos must keep their notes');
assert.deepEqual(unnumberedPhotoBoxes.map(([, ,width])=>width),[58,58,120,58,182,58,58,120,58],'Photo widths must not change when numbering is disabled');
for(const columns of [1,2,3]){
  const repeatedPhotos={...photoHike,title:'Photo pagination',steps:Array(16).fill({...photoHike.steps[0],columns})};
  assert.equal(hikePages(repeatedPhotos).flatMap(rows=>rows.flatMap(row=>row.steps)).length,16);
  for(let page=0;page<pageCount(repeatedPhotos);page++)drawSheet({getContext:()=>({...ctx,strokeRect(x,y,width,height){assert.ok(x+width<=196&&y+height<267,'Repeated wide photos must leave room for the finish and footer')}})},repeatedPhotos,page,1,class{});
}
drawSheet({getContext:()=>ctx},quizHike,0,1,class{});
assert.ok(printed.includes('1. How many legs does a spider have? · 200 m'),'The PDF must combine the step number, quiz question and optional distance');
for(const value of ['A. Six','B. Eight','C. Ten','D. Twelve'])assert.ok(printed.includes(value),'The PDF must include each lettered answer');
const compactQuizRects=[];
drawSheet({getContext:()=>({...ctx,strokeRect(...args){compactQuizRects.push(args)}})},{...blankHike(),steps:[{...quizHike.steps[0],note:''},hike.steps[0],fractionHike.steps[0]]},0,1,class{});
assert.deepEqual(compactQuizRects.slice(0,3).map(([x,y,width])=>[x,y,width]),[[14,26,58],[76,26,58],[138,26,58]],'A quiz question must share the same three-column PDF row as other hike techniques');
assert.equal(compactQuizRects[0][3],21,'A four-answer quiz must use 2 mm top and bottom padding');
const maxQuiz={...quizHike.steps[0],question:'W'.repeat(160),answers:Array(6).fill('W'.repeat(80)),note:'W'.repeat(160)};
const wordyQuiz={...maxQuiz,question:Array(4).fill('W'.repeat(39)).join(' '),note:Array(3).fill('W'.repeat(52)).join(' ')};
const mixedQuizHike={...blankHike(),includeCredits:false,title:'Mixed hike',steps:[...Array(14).fill(hike.steps[0]),maxQuiz,...Array(16).fill(hike.steps[0]),wordyQuiz]};
assert.deepEqual(hikePages(mixedQuizHike).flatMap(rows=>rows.flatMap(row=>row.steps)),mixedQuizHike.steps,'Pagination must preserve every step in order');
const quizNumbers=[];
for(let page=0;page<pageCount(mixedQuizHike);page++){
  const boxes=[],draws=[];
  const quizContext={...ctx,measureText(value){return {width:value.length*parseFloat(this.font.match(/[\d.]+px/)[0])}},strokeRect(...args){boxes.push(args)},fillText(value,x,y){draws.push({value,x,y,font:this.font});const number=String(value).match(/^(\d+)(?:\.|$)/)?.[1];if(number&&x%62===16)quizNumbers.push(Number(number));}};
  drawSheet({getContext:()=>quizContext},mixedQuizHike,page,1,class{});
  assert.ok(boxes.every(([,y,,height])=>y+height<=267),'Even six long answers must stay above the finish and footer');
  assert.ok(boxes.every(([, ,width])=>width===58),'Every PDF hike item must use one third of the row');
  for(const draw of draws.filter(draw=>draw.value.includes('W')||/^[A-F]\./.test(draw.value)))assert.ok(boxes.some(([x,y,width,height])=>draw.x>=x&&draw.x<=x+width&&draw.y>y&&draw.y+parseFloat(draw.font.slice(4))<y+height),'Quiz content must fit inside its card');
  if(draws.some(draw=>draw.value.includes('W'))){assert.ok(draws.some(draw=>draw.value.startsWith('F.')),'The final answer must never be truncated');assert.equal(draws.reduce((count,draw)=>count+(draw.value.match(/W/g)??[]).length,0),hikePages(mixedQuizHike)[page].flatMap(row=>row.steps).filter(step=>step.technique==='quiz').reduce((count,step)=>count+([step.question,...step.answers,step.note].join('').match(/W/g)??[]).length,0),'Every character of maximum-length quiz content must be printed');}
}
assert.deepEqual(quizNumbers,mixedQuizHike.steps.map((_,i)=>i+1),'Printed numbering must remain continuous across mixed quiz pages');
const dotArrowPaths=[],dotArrowRotations=[];
drawSheet({getContext:()=>({...ctx,stroke(path){if(path)dotArrowPaths.push(path.value)},fill(path){dotArrowPaths.push(path.value)},rotate(angle){dotArrowRotations.push(angle)}})},dotArrowHike,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowPaths,dotArrowHike.steps.flatMap(()=>dotArrowLayers().map(layer=>layer.path)),'Every dot-and-arrow PDF symbol must use the shared arrow and dot without junction roads');
for(const rotation of dotArrowDirections)assert.ok(dotArrowRotations.includes(rotation*Math.PI/180),'The PDF must preserve each dot-and-arrow direction');
const dotArrowShapePaths=[];
const shapeCanvas={getContext:()=>({...ctx,stroke(path){if(path)dotArrowShapePaths.push(path.value)},fill(path){dotArrowShapePaths.push(path.value)}})};
for(let page=0;page<pageCount(dotArrowShapeHike);page++)drawSheet(shapeCanvas,dotArrowShapeHike,page,1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowShapePaths,dotArrowShapeHike.steps.flatMap(step=>dotArrowLayers(dotArrowShape(step.element)).map(layer=>layer.path)),'PDF pages must retain every selected curve and omit side roads');
dotArrowShapePaths.length=0;
drawTechniqueGuide(shapeCanvas,{...dotArrowShapeHike,includeTechniqueExplanation:true},1,class{constructor(value){this.value=value}});
assert.deepEqual(dotArrowShapePaths,dotArrowLayers(dotArrowShapes[0]).map(layer=>layer.path),'The explanation must illustrate the actual chosen layout');
const eyeDraws=[],eyeRotations=[];
let eyeTranslation;
const eyesCanvas={getContext:()=>({...ctx,fillText(){},translate(x,y){eyeTranslation=[x+0,y+0]},rotate(angle){eyeRotations.push(angle)},fill(path){if(this.fillStyle==='#000000')eyeDraws.push({path:path.value,offset:eyeTranslation})}})};
drawSheet(eyesCanvas,eyesHike,0,1,class{constructor(value){this.value=value}});
assert.deepEqual(eyeDraws,eyesHike.steps.map((step,index)=>({path:eyesLayers(step.rotation)[1].path,offset:gazeOffsets[index]})),'The preview and PDF must draw all eight gazes');
eyeDraws.length=0;
drawTechniqueGuide(eyesCanvas,{...eyesHike,steps:[eyesHike.steps[5]],includeTechniqueExplanation:true},1,class{constructor(value){this.value=value}});
assert.deepEqual(eyeDraws,[{path:eyesLayers(225)[1].path,offset:gazeOffsets[5]}],'The guide must illustrate the chosen gaze');
assert.ok(eyeRotations.every(angle=>angle===0),'Printed eyes must remain upright; only pupils move');
const guideHike={...blankHike(),includeTechniqueExplanation:true,includeCredits:true,steps:[hike.steps[0],compassHike.steps[0],fractionHike.steps[0],dotArrowHike.steps[2],eyesHike.steps[1],quizHike.steps[0],inputHike.steps[0],photoHike.steps[0]]};
const creditsBeforeGuide=printed.filter(value=>value==='created with hike-generator by Wouter van der Ven').length;
assert.deepEqual(hikeTechniques(guideHike),['junction','compass','fraction','dot-arrow','eyes','quiz','photo'],'The guide must omit free-text steps and list the other techniques once, in hike order');
assert.equal(documentPageCount(guideHike),2,'The technique guide must add one A4 page');
assert.deepEqual(parseHike(serializeHike(guideHike)),guideHike,'The PDF option must survive export and import');
const guideRects=[];
const guidePrintedStart=printed.length;
drawTechniqueGuide({getContext:()=>({...ctx,strokeRect(...args){guideRects.push(args)}})},guideHike,1,class{});
const guidePrinted=printed.slice(guidePrintedStart);
assert.equal(guideRects.length,8);
assert.ok(guideRects.every(([,y,,height])=>y+height<281),'All six explanations must fit above the A4 footer');
assert.ok(guidePrinted.includes('Quiz question')&&guidePrinted.some(value=>value.includes('clockwise')),'The guide must explain how quiz answers map to roads');
drawSheet({getContext:()=>ctx},guideHike,0,1,class{});
assert.ok(printed.includes('Route technique guide')&&printed.includes('Situation sketch')&&printed.includes('Compass bearing')&&printed.includes('Fractions')&&printed.includes('Dot and arrow')&&printed.includes('Eyes')&&!printed.includes('Free text')&&printed.includes('Photo'),'The guide must explain every used technique except free text');
assert.ok(printed.includes('PAGE 1 / 2')&&printed.includes('PAGE 2 / 2'),'Guide and hike pages must share continuous page numbers');
assert.equal(printed.filter(value=>value==='created with hike-generator by Wouter van der Ven').length-creditsBeforeGuide,2,'Credits must appear in every PDF footer');
for(const invalid of [{element:'unknown'},{distance:'-1'},{distance:'1.5'},{note:'x'.repeat(161)}]){
  assert.throws(()=>validateHike({...hike,steps:[{...hike.steps[0],...invalid}]}));
}
assert.throws(()=>validateHike({...hike,steps:Array(301).fill(hike.steps[0])}));
assert.throws(()=>validateHike({...hike,title:'x'.repeat(81)}));
assert.throws(()=>validateHike(null));
const {includeTechniqueExplanation:discardedGuide,includeCredits:discardedCredits,...oldHike}=hike;
assert.equal(validateHike(oldHike).includeTechniqueExplanation,false,'Old hike files must keep the guide disabled');
assert.equal(validateHike(oldHike).includeCredits,true,'Credits must stay enabled for old hike files');
assert.equal(validateHike({...hike,includeCredits:false}).includeCredits,true,'Credits must stay enabled');
assert.throws(()=>validateHike({...hike,includeTechniqueExplanation:'yes'}));
assert.throws(()=>validateHike({...hike,includeCredits:'yes'}));
assert.equal(hike.steps.length,elements.length,'Validation must not mutate the original hike');
const legacy={...hike,steps:[{element:'t-left',note:'Existing draft',distance:'200'}]};
assert.equal(validateHike(legacy).steps[0].rotation,0,'Old drafts should load without rotation');
assert.deepEqual(validateHike(legacy).steps[0].faintArms,[],'Old drafts should load with regular roads');
assert.deepEqual(validateHike(legacy).steps[0].landmarks,[],'Old drafts should load without landmarks');
const straight=elements.find(element=>element.id==='straight'),straightStep=hike.steps.find(step=>step.element==='straight');
assert.equal(roadCount(straight),2,'A straight road must stay in the two-road picker');
assert.deepEqual(landmarkArms(straight),[{id:'centre',x:50,y:50,angle:270}],'Straight-road landmarks must use one central position');
for(const arm of ['approach','ahead']){
  const migrated=validateHike({...blankHike(),steps:[{...straightStep,rotation:90,faintArms:['approach'],landmarks:[{type:'bridge',arm},{type:'parking',arm,side:'left'},{type:'water',arm,side:'right'}]}]});
  assert.deepEqual(migrated.steps[0].landmarks,[{type:'bridge',arm:'centre'},{type:'parking',arm:'centre',side:'left'},{type:'water',arm:'centre',side:'right'}],'Old upper and lower placements must move to the centre while keeping their side');
  assert.deepEqual(migrated.steps[0].faintArms,['approach'],'Road-type choices must survive landmark migration');
  assert.deepEqual(parseHike(serializeHike(migrated)),migrated,'Central placements and rotation must survive saving');
  const layers=junctionLayers(straight,migrated.steps[0].landmarks);
  assert.ok(layers.some(layer=>layer.path===landmarkTypes[0].over&&layer.x===50&&layer.y===50),'The bridge must span the centre of the road');
  for(const rotation of dotArrowDirections)assert.equal(roadArmLabel(landmarkArms(straight)[0],rotation,'nl'),'Midden van de weg','Rotating the road must not reintroduce upper and lower placement labels');
}
assert.deepEqual(validateHike({...blankHike(),steps:[{...straightStep,landmarks:[{type:'railway',arm:'ahead'}]}]}).steps[0].landmarks,[],'Old railway elements must be removed from saved hikes');
assert.throws(()=>validateHike({...blankHike(),steps:[{...straightStep,landmarks:[{type:'parking',arm:'right',side:'right'},{type:'water',arm:'right',side:'right'}]}]}),'Only one landmark may occupy the same side of a road');
assert.throws(()=>validateHike({...blankHike(),steps:[{...hike.steps[0],landmarks:[{type:'bridge',arm:'centre'}]}]}),'Junctions must still require a real road arm');
const rotated=structuredClone(hike);
rotateStep(rotated.steps[0],-45);
assert.equal(rotated.steps[0].rotation,315);
assert.equal(rotated.steps[1].rotation,0,'Rotating one step must not rotate its neighbour');
assert.equal(validateHike(JSON.parse(JSON.stringify(rotated))).steps[0].rotation,315,'Rotation must survive draft save and reload');
rotateStep(rotated.steps[0],45);
assert.equal(rotated.steps[0].rotation,0);
for(let i=0;i<8;i++)rotateStep(rotated.steps[0],45);
assert.equal(rotated.steps[0].rotation,0,'Eight rotations should restore the original orientation');
for(const rotation of [-45,360,22.5,1,'90',null])assert.throws(()=>validateHike({...hike,steps:[{...hike.steps[0],rotation}]}));
const bridge=validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'bridge',arm:'right'}]}]});
rotateStep(bridge.steps[0],90);
assert.deepEqual(bridge.steps[0].landmarks,[{type:'bridge',arm:'right'}],'Rotation must keep a landmark attached to its road arm');
assert.deepEqual(validateHike(JSON.parse(JSON.stringify(bridge))),bridge,'Landmarks must survive save and reload');
assert.deepEqual(landmarkTypes.map(type=>type.id),['bridge','parking','bridleway','water']);
assert.deepEqual(sidedLandmarkTypes,['parking','water'],'Only roadside landmarks should offer left/right placement');
assert.deepEqual(validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'bridleway',arm:'right',side:'left'}]}]}).steps[0].landmarks,[{type:'bridleway',arm:'right'}],'Bridleway placements should be normalized onto the road');
assert.deepEqual(validateHike({...hike,steps:[{...hike.steps[0],landmarks:[{type:'steps',arm:'right'}]}]}).steps[0].landmarks,[],'Retired stair elements should be removed from saved hikes');
assert.deepEqual(validateHike({...blankHike(),steps:[{...hike.steps[1],landmarks:[{type:'bench',arm:'right'}]}]}).steps[0].landmarks,[],'Old bench elements must be removed from saved hikes');
const leftWater=validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'water',arm:'right',side:'left'}]}]}).steps[0];
assert.equal(junctionLayers(elements[1],leftWater.landmarks).filter(layer=>layer.x===76&&layer.y===15).length,1,'Water should render with padding on either side of a road arm');
const right=roadArms(elements[1]).find(arm=>arm.id==='right');
assert.equal(roadArmLabel(right),'Right road');
assert.equal(roadArmLabel(right,90),'Bottom road','Placement labels must follow the visible rotation');
assert.equal(translate('nl','downloadPdf'),'PDF downloaden');
assert.equal(translate('nl','importHike'),'Hike importeren als JSON');
assert.equal(translate('nl','exportHike'),'Hike exporteren als JSON');
assert.equal(translate('en','input.placeholder'),'e.g. cross the zebra crossing');
assert.equal(translate('nl','input.placeholder'),'bijv. steek het zebrapad over');
assert.equal(translate('en','notePlaceholder'),'e.g. Cross at the zebra crossing');
assert.equal(translate('nl','notePlaceholder'),'bijv. Oversteken via het zebrapad');
assert.equal(translate('en','pdf.credits'),'created with hike-generator by Wouter van der Ven');
assert.equal(translate('nl','pdf.credits'),'Gemaakt met https://vandervenwouter.github.io/hike-generator');
assert.ok(!Object.hasOwn(translations.nl,'darkMode')&&!Object.hasOwn(translations.nl,'lightMode'),'Theme-toggle translations must be removed');
assert.equal(translate('nl','printPreview'),'Afdrukvoorbeeld A4');
assert.equal(translate('nl','addCompass'),'Toevoegen');
assert.equal(translate('nl','addHikeItem'),'Stap toevoegen');
assert.equal(translate('nl','insertHikeItem',{number:2}),'Stap toevoegen na stap 2');
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
    assert.ok(Math.abs(angle-roadArms(element)[element.exit].angle)<.01,'Every angled T hike must lead to its selected road');
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
    assert.ok(Math.abs(exitAngle-exits[index])<.01,'The hike arrow must point into the chosen exit');
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
const radialBridge={...hike.steps[0],element:sixWay.id,landmarks:[{type:'bridge',arm:'exit-5'}]};
assert.deepEqual(validateHike({...hike,steps:[radialBridge]}).steps[0],radialBridge,'Landmarks must remain available on every six-way road arm');
assert.ok(!roadArms(fiveWay).map(arm=>roadArmLabel(arm)).some(label=>label.includes('undefined')),'Angled road arms need readable position labels');
assert.equal(landmarkName(landmarkTypes[0],'nl'),'Brug');
assert.equal(landmarkTypes.find(type=>type.id==='bridge').under,undefined,'A bridge must not include water');
const bridgeType=landmarkTypes.find(type=>type.id==='bridge');
assert.equal(bridgeType.over,'M-16 -30L-11 -25H11L16 -30M-16 30L-11 25H11L16 30','Bridge markings must use horizontal bars with outward diagonal ends');
assert.ok(Math.abs(32*bridgeType.scale-18)<.5,'Bridge markings must be as wide as the water icon');
assert.ok(25*bridgeType.scale-11.5>2,'Bridge markings must keep visible space outside the road edges');
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
assert.ok(faintEdges.every(layer=>faintPathLayers.indexOf(layer)<routeIndex),'The hike arrow must render above the dashed edges');
const straightFaintLayers=junctionLayers(elements.find(element=>element.id==='straight'),[],['approach']);
assert.equal(straightFaintLayers.filter(layer=>layer.faintEdge).length,2,'A straight hazenpaadje should dash both sides of the road');
assert.ok(straightFaintLayers.filter(layer=>layer.faintEdge).every(layer=>layer.width<2),'A straight hazenpaadje must keep its white road interior');
for(const id of ['straight','turn-back']){
  const capFreeLayers=junctionLayers(elements.find(element=>element.id===id));
  assert.ok(capFreeLayers.some(layer=>layer.road&&layer.path==='M39 10V90M61 10V90'&&layer.width===1),'Two-road edges must be redrawn as open longitudinal edges');
  assert.ok(!capFreeLayers.some(layer=>layer.path===elements.find(element=>element.id===id).roads&&layer.color==='#000000'),'Two-road edges must not retain a capped black centreline');
}
for(const [id,edge] of [['bend-left','M61 90V60C61 40.12 45.12 24 25 24H0'],['bend-right','M39 90V60C39 40.12 54.88 24 75 24H100']]){
  assert.ok(junctionLayers(elements.find(element=>element.id===id)).some(layer=>layer.path===edge),'Bend edges must use the shared smooth turn geometry');
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
const faintBridge={...hike.steps[1],faintArms:['right'],landmarks:[{type:'bridge',arm:'right'}]};
assert.deepEqual(validateHike({...hike,steps:[faintBridge]}).steps[0],faintBridge,'A faint road must still accept hike elements');
const migratedFaintPath=validateHike({...hike,steps:[{...hike.steps[1],faintArms:undefined,landmarks:[{type:'faint-path',arm:'right'}]}]}).steps[0];
assert.deepEqual(migratedFaintPath.faintArms,['right'],'Saved hazenpaadjes must migrate from hike elements to road types');
assert.deepEqual(migratedFaintPath.landmarks,[],'Migrated hazenpaadjes must disappear from hike elements');
assert.deepEqual(validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'gate',arm:'right'}]}]}).steps[0].landmarks,[],'Saved gates must disappear from hike elements');
for(const faintArms of [['unknown'],['right','right'],null])assert.throws(()=>validateHike({...hike,steps:[{...hike.steps[1],faintArms}]}));
assert.equal(roadArmLabel(right,90,'nl'),'Onderste weg');
const rightBridgeLayer=junctionLayers(elements[1],bridge.steps[0].landmarks).find(layer=>layer.path===landmarkTypes[0].over);
assert.ok(rightBridgeLayer.x>elements[1].tip.x&&rightBridgeLayer.x<94&&rightBridgeLayer.y===42,'A right-hand bridge must move behind the hike arrow while keeping its full marker visible');
const bridgeRoadExtension=junctionLayers(elements[1],[{type:'bridge',arm:'left'}],['left']).filter(layer=>layer.bridgeExtension);
assert.equal(bridgeRoadExtension.length,2,'A bridge with too little road space must extend both road layers');
const leftBridgeGeometry=bridgeGeometry(elements[1],roadArms(elements[1]).find(arm=>arm.id==='left'));
const tRight=elements.find(element=>element.id==='t-right'),tRightBridgeLayers=junctionLayers(tRight,[{type:'bridge',arm:'right'}]),tRightRoadEnd=tRightBridgeLayers.findIndex(layer=>layer.path===tRight.roads&&layer.color==='#fff');
assert.ok(tRightBridgeLayers.findIndex(layer=>layer.bridgeExtension)>tRightRoadEnd,'A bridge extension must mask the original road end cap');
assert.ok(bridgeRoadExtension.some(layer=>layer.path===`M${leftBridgeGeometry.start} 0H${leftBridgeGeometry.end}`)&&bridgeRoadExtension.every(layer=>layer.path.includes(`H${leftBridgeGeometry.end}`)),'The bridge road extension must be derived from the arm endpoint and shifted marker');
assert.ok(bridgeRoadExtension.some(layer=>layer.width===23&&layer.color==='#fff')&&bridgeRoadExtension.some(layer=>layer.width===1&&layer.dash?.join(',')==='5,4'),'A bridge extension must retain the selected road type without a transverse cap');
assert.ok(junctionLayers(elements[1],[{type:'bridge',arm:'left'}],['left']).some(layer=>layer.path===landmarkTypes[0].over&&layer.x>18&&layer.x<19&&layer.y===42),'A bridge must shift farther along a non-hike hazenpaadje arm');
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
assert.equal(layerRotation(parkingIconLayers[0],90),-90,'Parking should counter-rotate with the hike block');
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
assert.ok(straightAheadBridgeGeometry.extension>0,'A bridge beside an acute side road must extend its selected road to reach a clear position');
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
const diagonalBridgeElement=elements.find(element=>element.id==='skew-cross-ne-sw-left'),diagonalBridgeLayers=junctionLayers(diagonalBridgeElement,[{type:'bridge',arm:'exit-1'}]),diagonalBridge=diagonalBridgeLayers.find(layer=>layer.path===landmarkTypes[0].over),diagonalArm=roadArms(diagonalBridgeElement).find(arm=>arm.id==='exit-1'),diagonalBridgeGeometry=bridgeGeometry(diagonalBridgeElement,diagonalArm),diagonalScale=40/(diagonalBridgeElement.radius+diagonalBridgeElement.throughExtension),diagonalArmX=50+(diagonalArm.x-50)*diagonalScale,diagonalArmY=50+(diagonalArm.y-50)*diagonalScale;
assert.ok((diagonalBridge.x-50)*(diagonalArmX-50)+(diagonalBridge.y-50)*(diagonalArmY-50)>(diagonalArmX-50)**2+(diagonalArmY-50)**2,'A diagonal hike bridge should move outward toward the extended road');
assert.ok((diagonalBridgeGeometry.geometry.endDistance+diagonalBridgeGeometry.extension-diagonalBridgeGeometry.geometry.distance-diagonalBridgeGeometry.along)*diagonalScale>=16*bridgeType.scale,'A diagonal hike bridge must keep road beneath its full marker width');
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
drawSheet({getContext:()=>crowdedContext},{...blankHike(),steps:[{element:'cross-straight',note:'',distance:'',rotation:0,landmarks:crowdedBridleways,faintArms:[]}]},0,1,class{});
assert.ok(Math.abs(crowdedTranslations[0][1]-(26+(junctionCardHeight({element:'cross-straight',note:'',landmarks:crowdedBridleways})-36)/2))<1e-9,'Crowded junctions must be vertically centred inside their taller PDF card');
assert.equal(bridlewayIconLayers.filter(layer=>layer.fill==='#000000').length,1,'The bridleway marker should use one clear horseshoe silhouette');
assert.equal(bridlewayIconLayers[0].fill,'#fff','The bridleway marker should have a white clearance halo');
const horseshoePath=bridlewayIconLayers.find(layer=>layer.fill==='#000000').path;
assert.equal(bridlewayIconLayers.find(layer=>layer.fill==='#000000').fillRule,'evenodd','The source horseshoe vector should preserve its even-odd fill rule');
assert.ok(horseshoePath.startsWith('M 0 7.1 L 0.33 7.05')&&horseshoePath.includes('C 7.91 8.63 4.92 10.71 0 11'),'The bridleway marker should use the supplied horseshoe vector');
assert.ok(bridlewayIconLayers.every(layer=>layer.scale===.75),'The bridleway icon should match the parking icon footprint');
assert.ok(bridlewayIconLayers.every(layer=>layer.x===92&&layer.y===42),'Bridleway markers should sit in the extended road arm after the hike arrow');
assert.ok(bridlewayLayers.some(layer=>layer.roadExtension&&layer.color==='#000000'),'Bridleway markers should extend their road arm with open road edges beyond the hike arrow');
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
assert.ok(angledBridleway.filter(layer=>layer.upright).every(layer=>Math.abs(layer.x-angledBridlewayArm.x)<1e-6&&layer.y<40),'Bridleway markers on non-hike angled arms should stay at the road end');
assert.ok(!angledBridleway.some(layer=>layer.path==='M8 0H24'),'Non-hike angled arms should not receive a hike-arrow extension');
const angledRouteBridleway=junctionLayers(elements.find(element=>element.id==='angled-side-right-turn'),[{type:'bridleway',arm:'exit-2'}]);
assert.ok(angledRouteBridleway.filter(layer=>layer.upright).every(layer=>layer.x>70&&layer.y<30),'Bridleway markers on 45-degree hike arms should sit after the arrow');
assert.ok(angledRouteBridleway.filter(layer=>layer.upright).every(layer=>layer.scale===.75),'45-degree hike bridleways should keep the readable icon size');
assert.ok(angledRouteBridleway.some(layer=>layer.path.startsWith('M 0 -14')),'45-degree hike markers should retain their clearance halo after the arrow');
const angledExtensionLayers=angledRouteBridleway.filter(layer=>layer.roadExtension),angledExtensionEdges=angledExtensionLayers.filter(layer=>layer.color==='#000000');
assert.equal(angledExtensionLayers.length,2,'A hike bridleway should add an interior and open edge layer after the arrow');
assert.equal(angledExtensionEdges.length,1,'A bridleway road extension should combine its two open edges without a centre cap');
assert.ok(Math.abs(angledExtensionEdges[0].width*angledExtensionEdges[0].scale-1)<1e-9,'A bridleway road extension must keep one-unit edge ink');
assert.ok(Math.abs(angledExtensionLayers.find(layer=>layer.color==='#fff').width*angledExtensionLayers.find(layer=>layer.color==='#fff').scale-23)<1e-9,'A bridleway road extension must keep the white road interior');
for(const element of elements){
  const routeArm=roadArms(element).find(arm=>Math.abs(((arm.angle-(element.tip?.angle??NaN)+540)%360)-180)<.01);
  if(!routeArm)continue;
  const layers=junctionLayers(element,[{type:'bridleway',arm:routeArm.id}]),icon=layers.find(layer=>layer.upright&&layer.fill==='#000000'),arrow=layers.find(layer=>layer.path===element.arrow),radians=routeArm.angle*Math.PI/180;
  assert.ok((icon.x-arrow.x)*Math.cos(radians)+(icon.y-arrow.y)*Math.sin(radians)>0,`${element.id}: a hike bridleway must be after the arrow`);
}
assert.equal(layerRotation(bridlewayIconLayers[0],90),-90,'Bridleway markers should counter-rotate with the hike block');
const sharedArm=validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'bridge',arm:'left'},{type:'water',arm:'left',side:'right'},{type:'parking',arm:'left',side:'left'}]}]}).steps[0];
assert.equal(sharedArm.landmarks.length,3,'A road arm should allow an element on the road and one on each side');
assert.throws(()=>validateHike({...hike,steps:[{...hike.steps[1],landmarks:[{type:'water',arm:'left',side:'right'},{type:'parking',arm:'left',side:'right'}]}]}),'Two landmarks may not occupy the same side of a road arm');
assert.ok(junctionLayers(elements[1],[{type:'water',arm:'right',side:'right'}]).filter(layer=>layer.upright).every(layer=>layerRotation(layer,90)===-90),'Water lines must stay horizontal when the hike block rotates');
const waterBelowBridge=junctionLayers(elements[1],[{type:'bridge',arm:'right'},{type:'water',arm:'right',side:'right'}]);
assert.ok(waterBelowBridge.findIndex(layer=>layer.upright)>waterBelowBridge.findIndex(layer=>layer.path===elements[1].roads&&layer.color==='#fff')&&waterBelowBridge.findIndex(layer=>layer.upright)<waterBelowBridge.findIndex(layer=>layer.path===landmarkTypes[0].over),'Water must render above the road and below other hike elements');
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
      const bridgePosition=bridgeGeometry(element,arm),markerDistance=(bridgePosition.geometry.distance+bridgePosition.along)*bridgePosition.geometry.scale,otherEnd=Math.hypot(other.end.x-50,other.end.y-50)*bridgePosition.geometry.scale,projections=[];
      for(const along of [-16*scale,16*scale])for(const across of [-30*scale,30*scale]){
        const x=markerDistance+along;
        projections.push({along:x*Math.cos(gap)+across*Math.sin(gap),across:x*Math.sin(gap)-across*Math.cos(gap)});
      }
      assert.ok(Math.max(...projections.map(point=>point.along))<0||Math.min(...projections.map(point=>point.along))>otherEnd||Math.min(...projections.map(point=>point.across))>14||Math.max(...projections.map(point=>point.across))< -14,`${element.id}: bridge markers must move beyond every neighbouring road corridor`);
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
  assert.ok(Math.abs(dot.y-(50+(routeStart-50)*geometryScale))<.01,'The approach dot must stay connected to the hike arrow');
  const arrow=junctionLayers(element).find(layer=>layer.path===element.arrow),end=element.route.match(/L(-?[\d.]+) (-?[\d.]+)$/);
  assert.ok(Math.hypot(arrow.x-(50+(Number(end[1])-50)*geometryScale),arrow.y-(50+(Number(end[2])-50)*geometryScale))<.01,'The fixed-size arrowhead must stay attached to its scaled hike');
}
for(const landmarks of [[{type:'bridge',arm:'ahead'}],[{type:'unknown',arm:'right'}],[{type:'parking',arm:'right',side:'right'},{type:'water',arm:'right',side:'right'}],null]){
  assert.throws(()=>validateHike({...hike,steps:[{...hike.steps[1],landmarks}]}));
}
for(const element of elements){
  for(const arm of landmarkArms(element)){
    for(const type of landmarkTypes){
      const step={...hike.steps[0],element:element.id,landmarks:[{type:type.id,arm:arm.id,...(sidedLandmarkTypes.includes(type.id)?{side:'right'}:{})}]};
      assert.deepEqual(validateHike({...hike,steps:[step]}).steps[0],step);
      const layers=junctionLayers(element,step.landmarks);
      assert.ok(layers.every(layer=>Number.isFinite(layer.width)));
      assert.ok(layers.every(layer=>['#000000','#fff'].includes(layer.color)&&(!layer.fill||['#000000','#fff'].includes(layer.fill))),'Every junction line must use the same ink color');
    }
  }
}

const appSource = readFileSync('dist/app.js', 'utf8');
const indexSource = readFileSync('dist/index.html', 'utf8');
const hikeSheetSource = readFileSync('dist/hike-sheet.js', 'utf8');
const styleSource = readFileSync('dist/style.css', 'utf8');
for (const component of ['RoadTypeEditor', 'LandmarkEditor', 'StepCard', 'HikeEditor', 'Toolbar', 'StepLibrary', 'PreviewPanel', 'App']) {
  assert.match(appSource, new RegExp(`const ${component} = defineComponent`), `${component} component is missing`);
}
assert.match(appSource, /createApp\(App\)\.mount\('#app'\)/);
assert.doesNotMatch(appSource, /filter\(count => count < 6\)/,'The six-way intersection must remain available in the picker');
assert.doesNotMatch(indexSource, /data-theme|theme-toggle|toggle-theme/,'Theme state must not be present in the document');
assert.match(indexSource, /<meta name="theme-color" content="#101612">/,'Browser chrome must use the fixed dark background');
assert.doesNotMatch(appSource, /theme-toggle|toggle-theme|toggleTheme|hike-generator-theme|prefers-color-scheme|dataset\.theme|applyTheme/,'Light/dark state and controls must be removed');
assert.doesNotMatch(appSource, /quiz-help|guide\.(clock|input|photo|quiz|stripkaart)/,'Step builder help text must not be rendered');
assert.doesNotMatch(appSource, /<label>\{\{ t\('quiz\.question'\) \}\}<textarea/,'Quiz questions must not use a visible label wrapper');
assert.equal((appSource.match(/data-field="question" :aria-label="t\('quiz\.question'\)"/g) ?? []).length,2,'Quiz question textareas must keep an accessible name');
assert.doesNotMatch(appSource, /<label>\{\{ t\('input\.value'\) \}\}<input class="free-text-input"/,'The free-text builder must not show a redundant field label');
assert.match(appSource, /id="input-value" :aria-label="t\('input\.value'\)"/,'The free-text builder input must keep an accessible name');
assert.match(hikeSheetSource, /text\(translate\(language,`guide\.\$\{technique\}`\),70,y\+11/,'PDF technique explanations must remain visible');
assert.doesNotMatch(styleSource, /data-theme|prefers-color-scheme/,'Theme selectors must be removed from the stylesheet');
assert.match(appSource, /<section class="landmark-editor road-type-editor"><h4 class="editor-heading">/,'Junction road types must remain visible without a details toggle');
assert.match(appSource, /<section class="landmark-editor"><h4 class="editor-heading">\{\{ t\('landmarks'\) \}\}<\/h4>/,'Route elements must remain visible without a step number or details toggle');
assert.ok(appSource.indexOf('<LandmarkEditor') < appSource.indexOf('class="step-fields step-note-fields"'),'The note field must follow junction controls, as it does for every other step type');
assert.match(appSource, /box = '0 0 100 100'/,'Junction previews must use the same drawing area and line scale as the other techniques');
assert.match(indexSource, /<div id="app"><\/div>/);
assert.doesNotMatch(appSource, /#element-library.*\.innerHTML|#hike-steps.*\.innerHTML/);
assert.match(appSource, /class="app-footer footer"/);
assert.match(appSource, /data-insert-index="0"/);
assert.match(appSource, /insertHikeItemBefore/);
assert.doesNotMatch(appSource, /structuredClone\(draft\./,'Reactive draft values must be copied without cloning Vue proxies');
assert.match(appSource, /class="stripkaart-layout"/,'The stripkaart builder needs a grouped editor and live preview');
assert.match(appSource, /viewBox="12 0 76 \$\{stripkaartHeight\(points\)\}"/,'The stripkaart preview must use the shared variable arrow height and a tight horizontal crop');
assert.match(appSource, /class="stripkaart-point"[^]*?<select/,'Stripkaart points must use the app\'s select controls');
assert.equal((appSource.match(/v-for="count in \[0, 1, 2, 3, 4\]"/g)??[]).length,4,'Both stripkaart editors must limit left and right side roads to four');
assert.match(appSource, /field: 'stripkaart-point-faint'/,'Stripkaart side roads must expose faint-path controls');
assert.equal((appSource.match(/class="stripkaart-faint-column"/g)??[]).length,4,'Left and right faint-path controls must have separate columns in both stripkaart editors');
assert.equal((appSource.match(/class="stripkaart-end-marker"/g)??[]).length,2,'Both stripkaart editors must expose the end-marking dropdown');
assert.match(appSource, /endMarker: draft\.stripkaartEndMarker/,'New stripkaarten must save the selected end marking');
assert.equal((appSource.match(/class="button primary add-step-button"[^>]*data-add-/g)??[]).length,7,'Every special-technique step button must use the shared full-width style');
assert.match(styleSource, /\.builder-stage \.add-step-button\{grid-column:1\/-1;width:100%;margin-top:14px\}/,'Step add buttons must sit below the builder content at full width');
assert.match(styleSource, /\.stripkaart-layout\{display:grid;grid-template-columns:144px minmax\(0,1fr\);gap:12px;align-items:stretch/,'The stripkaart preview must leave enough width for its controls');
assert.match(styleSource, /\.step-card \.junction\{[^}]*background:#fff/,'Step preview tiles must use a white background');
assert.match(styleSource, /\.element-grid\{display:grid;grid-template-columns:1fr 1fr;gap:8px;margin-top:10px\}/);
assert.match(appSource, /https:\/\/www\.linkedin\.com\/in\/wouter-van-der-ven\//);
assert.match(appSource, /https:\/\/github\.com\/vandervenwouter\/hike-generator/);

const loadSavedHikes=(storage,failWrites=false)=>{
  const mounted=[],events=new Map();let app;
  runInNewContext(appSource.replace(/^import[^\n]+\n/gm,''),{
    ...hikeSheet,structuredClone,AbortController,setTimeout(){},clearTimeout(){},
    createApp:component=>({mount(){app=component.setup();mounted.forEach(callback=>callback());}}),
    defineComponent:component=>component,reactive:value=>value,toRaw:value=>value,ref:value=>({value}),computed:get=>({get value(){return get();}}),
    watch(){},onMounted:callback=>mounted.push(callback),onUpdated(){},onBeforeUnmount(){},nextTick:callback=>{callback?.();return Promise.resolve();},
    document:{documentElement:{},querySelector:()=>null},window:{addEventListener:(name,callback)=>events.set(name,callback)},
    localStorage:{getItem:key=>storage.get(key)??null,setItem:(key,value)=>{if(failWrites)throw Error('Storage full');storage.set(key,value);}}
  });
  return {state:app.state,save:()=>events.get('pagehide')()};
};
const savedFirst={...inputHike,title:'First hike'},savedSecond={...compassHike,title:'Second hike'};
const savedStore={version:1,activeId:'hike-2',hikes:Object.fromEntries([savedFirst,savedSecond].map((hike,index)=>{const id=`hike-${index+1}`;return [id,{id,title:hike.title,hike:serializeHike(hike)}];}))};
const storage=new Map([['trailnote-hikes-v1',JSON.stringify(savedStore)]]),loaded=loadSavedHikes(storage);
assert.deepEqual(JSON.parse(JSON.stringify(loaded.state)),savedSecond,'Storage must restore the active hike and all its steps');
loaded.state.title='Updated hike';loaded.save();
const saved=JSON.parse(storage.get('trailnote-hikes-v1'));
assert.equal(saved.activeId,'hike-2','Saving must retain the active hike ID');
assert.deepEqual(parseHike(saved.hikes['hike-1'].hike),savedFirst,'Saving must retain inactive hikes');
assert.deepEqual(JSON.parse(JSON.stringify(loadSavedHikes(storage).state)),{...savedSecond,title:'Updated hike'},'Changed hikes must survive saving and reloading');
const beforeFailedSave=new Map(storage),failedSave=loadSavedHikes(storage,true);
failedSave.state.title='Unsaved change';failedSave.save();
assert.deepEqual(storage,beforeFailedSave,'A failed save must preserve the stored hikes');

console.log('Hike-sheet geometry, component and storage tests passed.');
