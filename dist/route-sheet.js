const arrowAt = (x,y,angle) => ({arrow:'M-4.5 -2L0 0L-4.5 2',tip:{x,y,angle}});
const point = (angle,radius) => ({x:Number((50+Math.cos(angle*Math.PI/180)*radius).toFixed(2)),y:Number((50+Math.sin(angle*Math.PI/180)*radius).toFixed(2))});
function angledElement(id,group,name,angles,exit){
  // Leave room beyond the widest corner for bridges and upright roadside icons at any rotation.
  const radius=Math.max(40,...angles.flatMap(angle=>angles.filter(other=>other!==angle).map(other=>12/Math.tan(Math.abs(((other-angle+540)%360)-180)*Math.PI/360)+52)));
  // Keep every generated arm as long as the worst bridge-clearance extension needs.
  const roadExtension=60,throughExtension=27,exitRadius=radius+roadExtension,routeRadius=radius+throughExtension;
  const end=point(angles[exit],routeRadius*.85);
  return {id,group,name,radius,roadExtension,throughExtension,exit,roadPaths:Object.fromEntries(angles.map((angle,index)=>[index?'exit-'+index:'approach',index?`M${point(angle,exitRadius).x} ${point(angle,exitRadius).y}L50 50`:`M50 ${50+exitRadius}L50 50`])),roads:angles.slice(1).map(angle=>{const end=point(angle,exitRadius);return `M50 ${50+exitRadius}L50 50L${end.x} ${end.y}`;}).join(''),route:`M50 ${50+routeRadius*.85}L50 50L${end.x} ${end.y}`,...arrowAt(end.x,end.y,angles[exit]),arms:angles.map((angle,index)=>({id:index?'exit-'+index:'approach',...point(angle,radius-14),angle,end:point(angle,exitRadius)}))};
}
const radialElement = (id,count,name,exit) => angledElement(id,`${count}-way intersection`,name,Array.from({length:count},(_,index)=>90-index*360/count),exit);
export const elements = [
  {id:'t-left',group:'T-junction',name:'Turn left',roads:'M12 42H88M50 42V90',route:'M50 84V42H20',...arrowAt(20,42,180)},
  {id:'t-right',group:'T-junction',name:'Turn right',roads:'M12 42H88M50 42V90',route:'M50 84V42H80',...arrowAt(80,42,0)},
  {id:'cross-straight',group:'Crossroads',name:'Go straight',roads:'M50 10V90M10 50H90',route:'M50 84V18',...arrowAt(50,18,270)},
  {id:'cross-left',group:'Crossroads',name:'Turn left',roads:'M50 10V90M10 50H90',route:'M50 84V50H18',...arrowAt(18,50,180)},
  {id:'cross-right',group:'Crossroads',name:'Turn right',roads:'M50 10V90M10 50H90',route:'M50 84V50H82',...arrowAt(82,50,0)},
  {id:'fork-left',group:'Fork',name:'Keep left',roads:'M50 90V55L18 18M50 55L82 18',route:'M50 84V55L24 25',...arrowAt(24,25,229.09)},
  {id:'fork-right',group:'Fork',name:'Keep right',roads:'M50 90V55L18 18M50 55L82 18',route:'M50 84V55L76 25',...arrowAt(76,25,310.91)},
  {id:'side-left-straight',group:'Side road',name:'Pass left road',roads:'M50 10V90M10 50H50',route:'M50 84V18',...arrowAt(50,18,270)},
  {id:'side-right-straight',group:'Side road',name:'Pass right road',roads:'M50 10V90M50 50H90',route:'M50 84V18',...arrowAt(50,18,270)},
  {id:'side-left-turn',group:'Side road',name:'Turn left',roads:'M50 10V90M10 50H50',route:'M50 84V50H18',...arrowAt(18,50,180)},
  {id:'side-right-turn',group:'Side road',name:'Turn right',roads:'M50 10V90M50 50H90',route:'M50 84V50H82',...arrowAt(82,50,0)},
  {id:'bend-left',group:'Bends & paths',name:'Bend left',roads:'M50 90V60C50 46.2 38.8 35 25 35H0',route:'M50 84V60C50 46.2 38.8 35 25 35H18',...arrowAt(18,35,180)},
  {id:'bend-right',group:'Bends & paths',name:'Bend right',roads:'M50 90V60C50 46.2 61.2 35 75 35H100',route:'M50 84V60C50 46.2 61.2 35 75 35H82',...arrowAt(82,35,0)},
  {id:'straight',group:'Bends & paths',name:'Go straight',roads:'M50 10V90',route:'M50 84V18',...arrowAt(50,18,270)},
  {id:'turn-back',group:'Bends & paths',name:'Turn back',roads:'M50 10V90',route:'M50 84Q44 84 44 76V30A5.5 5.5 0 0 1 55 30V74',...arrowAt(55,74,90)},
  angledElement('angled-side-left-straight','Angled side road','Pass left road',[90,225,270],2),
  angledElement('angled-side-left-turn','Angled side road','Slight left',[90,225,270],1),
  angledElement('angled-side-right-straight','Angled side road','Pass right road',[90,270,315],1),
  angledElement('angled-side-right-turn','Angled side road','Slight right',[90,270,315],2),
  angledElement('angled-side-back-left-straight','Angled side road','Pass left road',[90,135,270],2),
  angledElement('angled-side-back-left-turn','Angled side road','Hard left',[90,135,270],1),
  angledElement('angled-side-back-right-straight','Angled side road','Pass right road',[90,270,45],1),
  angledElement('angled-side-back-right-turn','Angled side road','Hard right',[90,270,45],2),
  ...[
    ['angled-t-w-ne',[90,180,315],['Turn left','Slight right']],
    ['angled-t-w-se',[90,180,45],['Turn left','Hard right']],
    ['angled-t-nw-e',[90,225,0],['Slight left','Turn right']],
    ['angled-t-sw-e',[90,135,0],['Hard left','Turn right']],
    ['angled-t-w-nw',[90,180,225],['Turn left','Slight left']],
    ['angled-t-sw-w',[90,135,180],['Hard left','Turn left']],
    ['angled-t-ne-e',[90,315,0],['Slight right','Turn right']],
    ['angled-t-e-se',[90,0,45],['Turn right','Hard right']],
    ['angled-t-sw-ne',[90,135,315],['Hard left','Slight right']],
    ['angled-t-nw-se',[90,225,45],['Slight left','Hard right']],
  ].flatMap(([id,angles,names])=>names.map((name,index)=>angledElement(`${id}-${index+1}`,'Angled T-junction',name,angles,index+1))),
  angledElement('skew-cross-ne-sw-left','Skewed crossroads','Hard left',[90,135,270,315],1),
  angledElement('skew-cross-ne-sw-straight','Skewed crossroads','Go straight',[90,135,270,315],2),
  angledElement('skew-cross-ne-sw-right','Skewed crossroads','Slight right',[90,135,270,315],3),
  angledElement('skew-cross-straight-45-left','Skewed crossroads','Turn left',[90,180,0,315],1),
  angledElement('skew-cross-straight-right','Skewed crossroads','Turn right',[90,180,0,315],2),
  angledElement('skew-cross-straight-45-right','Skewed crossroads','Go straight 45° right',[90,180,0,315],3),
  angledElement('skew-cross-mirrored-right','Skewed crossroads','Turn right',[90,0,180,225],1),
  angledElement('skew-cross-mirrored-left','Skewed crossroads','Turn left',[90,0,180,225],2),
  angledElement('skew-cross-mirrored-straight-45-left','Skewed crossroads','Go straight 45° left',[90,0,180,225],3),
  angledElement('skew-cross-nw-se-left','Skewed crossroads','Slight left',[90,225,270,45],1),
  angledElement('skew-cross-nw-se-straight','Skewed crossroads','Go straight',[90,225,270,45],2),
  angledElement('skew-cross-nw-se-right','Skewed crossroads','Hard right',[90,225,270,45],3),
  angledElement('four-right-first','4-way intersection','First road right',[90,0,-45,-90],1),
  angledElement('four-right-second','4-way intersection','Second road right',[90,0,-45,-90],2),
  angledElement('four-right-straight','4-way intersection','Go straight',[90,0,-45,-90],3),
  angledElement('four-left-first','4-way intersection','First road left',[90,180,225,270],1),
  angledElement('four-left-second','4-way intersection','Second road left',[90,180,225,270],2),
  angledElement('four-left-straight','4-way intersection','Go straight',[90,180,225,270],3),
  angledElement('three-fork-left','Three-way fork','Keep left',[90,225,270,315],1),
  angledElement('three-fork-straight','Three-way fork','Go straight',[90,225,270,315],2),
  angledElement('three-fork-right','Three-way fork','Keep right',[90,225,270,315],3),
  radialElement('five-hard-right',5,'Hard right',1),
  radialElement('five-slight-right',5,'Slight right',2),
  radialElement('five-slight-left',5,'Slight left',3),
  radialElement('five-hard-left',5,'Hard left',4),
  radialElement('six-hard-right',6,'Hard right',1),
  radialElement('six-slight-right',6,'Slight right',2),
  radialElement('six-straight',6,'Go straight',3),
  radialElement('six-slight-left',6,'Slight left',4),
  radialElement('six-hard-left',6,'Hard left',5),
];
// Fill the 45-degree grid while preserving existing layout IDs and saved landmark arms.
const gridExits=[[135,'Hard left'],[180,'Turn left'],[225,'Slight left'],[270,'Go straight'],[315,'Slight right'],[0,'Turn right'],[45,'Hard right']];
const existingLayouts=new Set(elements.map(junctionLayoutKey));
for(let mask=0;mask<1<<gridExits.length;mask++){
  const exits=gridExits.filter((_,index)=>mask&(1<<index));
  if(exits.length!==3&&exits.length!==4)continue;
  const angles=[90,...exits.map(([angle])=>angle)];
  const id=`angled-${angles.length}-way-${exits.map(([angle])=>angle).join('-')}`;
  const choices=exits.map(([,name],index)=>angledElement(`${id}-${index+1}`,`${angles.length}-way intersection`,name,angles,index+1));
  if(!existingLayouts.has(junctionLayoutKey(choices[0])))elements.push(...choices);
}
const lineColor='#000000',bridgeMarkerScale=.55;
export const landmarkTypes = [
  {id:'bridge',name:'Bridge',fixedSize:true,scale:bridgeMarkerScale,over:'M-10 -27V-23H10V-27M-10 27V23H10V27'},
  {id:'parking',name:'Parking area',upright:true,fixedSize:true,offset:24,under:[{path:'M-10.8-12H10.8Q12-12 12-10.8V10.8Q12 12 10.8 12H-10.8Q-12 12-12 10.8V-10.8Q-12-12-10.8-12Z',width:0,color:lineColor,fill:lineColor}],over:[{path:'M.06-.45C2.77-.45 3.32-1.77 3.32-2.82C3.32-3.94 2.88-5.26.06-5.26H-2.94V-.45ZM-2.94 8.66H-6.1V-8.36H1.12C4.55-8.36 6.53-6.01 6.53-2.91C6.53-.23 4.89 2.51 1.14 2.51H-2.94Z',width:0,color:'#fff',fill:'#fff'}]},
  {id:'bridleway',name:'Bridleway',upright:true,fixedSize:true,along:16,approachAlong:20,over:[
    {path:'M 0 -14 A 14 14 0 1 1 0 14 A 14 14 0 1 1 0 -14 Z',width:0,scale:.75,color:'#fff',fill:'#fff',skipDiagonalRoute:true},
    {path:'M 0 7.1 L 0.33 7.05 L 0.66 6.99 L 0.98 6.92 L 1.28 6.85 L 1.58 6.77 L 1.86 6.68 L 2.14 6.58 L 2.41 6.47 L 2.67 6.36 L 2.92 6.23 L 3.16 6.11 L 3.39 5.97 L 3.61 5.83 L 3.83 5.67 L 4.03 5.52 L 4.22 5.35 L 4.41 5.18 L 4.58 5.01 L 4.75 4.82 L 4.9 4.63 L 5.19 4.24 L 5.44 3.82 L 5.65 3.38 L 5.83 2.92 L 5.96 2.45 L 6.07 1.95 L 6.13 1.44 L 6.16 0.92 L 6.16 0.38 L 6.12 -0.18 L 6.04 -0.74 L 5.92 -1.31 L 5.78 -1.9 L 5.59 -2.49 L 5.37 -3.08 L 5.12 -3.69 L 4.83 -4.29 L 4.5 -4.9 L 4.14 -5.51 L 3.75 -6.13 L 3.32 -6.74 L 2.85 -7.35 C 2.18 -8.88 3.86 -11 6.31 -9.93 C 7.79 -9.18 5.29 -8.6 5.91 -7.32 C 8.98 -3.78 10.02 2.12 8.96 5.38 C 7.91 8.63 4.92 10.71 0 11 C -4.92 10.71 -7.91 8.63 -8.96 5.38 C -10.02 2.12 -8.98 -3.78 -5.91 -7.32 C -5.29 -8.6 -7.79 -9.18 -6.31 -9.93 C -3.86 -11 -2.18 -8.88 -2.85 -7.35 C -7.99 -0.86 -7.24 6.16 0 7.1 Z',width:0,scale:.75,color:lineColor,fill:lineColor,fillRule:'evenodd'},
    {path:'M 7.5 -1.75 L 7.46 -1.75 L 7.43 -1.75 L 7.39 -1.74 L 7.36 -1.74 L 7.32 -1.73 L 7.29 -1.72 L 7.26 -1.71 L 7.23 -1.7 L 7.2 -1.68 L 7.16 -1.67 L 7.14 -1.65 L 7.11 -1.63 L 7.08 -1.61 L 7.05 -1.59 L 7.03 -1.57 L 7 -1.54 L 6.98 -1.52 L 6.96 -1.49 L 6.94 -1.47 L 6.92 -1.44 L 6.9 -1.41 L 6.88 -1.38 L 6.87 -1.35 L 6.85 -1.32 L 6.84 -1.29 L 6.83 -1.26 L 6.82 -1.22 L 6.81 -1.19 L 6.81 -1.15 L 6.8 -1.12 L 6.8 -1.08 L 6.8 -1.05 C 6.8 -0.66 7.11 -0.34 7.5 -0.34 C 7.89 -0.34 8.2 -0.66 8.2 -1.05 C 8.2 -1.44 7.89 -1.75 7.5 -1.75 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M 7.6 2.23 L 7.56 2.23 L 7.52 2.24 L 7.47 2.24 L 7.43 2.25 L 7.39 2.26 L 7.35 2.27 L 7.31 2.29 L 7.27 2.3 L 7.23 2.32 L 7.19 2.34 L 7.16 2.36 L 7.12 2.38 L 7.09 2.41 L 7.05 2.43 L 7.02 2.46 L 6.99 2.49 L 6.97 2.52 L 6.94 2.55 L 6.91 2.58 L 6.89 2.61 L 6.87 2.65 L 6.84 2.69 L 6.83 2.72 L 6.81 2.76 L 6.79 2.8 L 6.78 2.84 L 6.77 2.88 L 6.76 2.92 L 6.75 2.97 L 6.74 3.01 L 6.74 3.05 L 6.74 3.1 C 6.74 3.57 7.13 3.96 7.6 3.96 C 8.08 3.96 8.47 3.57 8.47 3.1 C 8.47 2.62 8.08 2.23 7.6 2.23 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M 5.37 6.27 L 5.32 6.27 L 5.27 6.27 L 5.22 6.28 L 5.18 6.29 L 5.13 6.3 L 5.08 6.31 L 5.04 6.33 L 5 6.34 L 4.96 6.36 L 4.91 6.38 L 4.87 6.41 L 4.84 6.43 L 4.8 6.46 L 4.76 6.48 L 4.73 6.51 L 4.7 6.55 L 4.66 6.58 L 4.63 6.61 L 4.61 6.65 L 4.58 6.69 L 4.55 6.72 L 4.53 6.76 L 4.51 6.81 L 4.49 6.85 L 4.47 6.89 L 4.46 6.93 L 4.45 6.98 L 4.44 7.03 L 4.43 7.07 L 4.42 7.12 L 4.42 7.17 L 4.42 7.22 C 4.42 7.74 4.84 8.17 5.37 8.17 C 5.89 8.17 6.32 7.74 6.32 7.22 C 6.32 6.69 5.89 6.27 5.37 6.27 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M 6.42 -4.88 L 6.39 -4.88 L 6.35 -4.88 L 6.32 -4.87 L 6.28 -4.87 L 6.25 -4.86 L 6.21 -4.85 L 6.18 -4.84 L 6.15 -4.83 L 6.12 -4.81 L 6.09 -4.8 L 6.06 -4.78 L 6.03 -4.76 L 6 -4.74 L 5.98 -4.72 L 5.95 -4.7 L 5.93 -4.68 L 5.9 -4.65 L 5.88 -4.63 L 5.86 -4.6 L 5.84 -4.57 L 5.82 -4.54 L 5.8 -4.52 L 5.79 -4.48 L 5.77 -4.45 L 5.76 -4.42 L 5.75 -4.39 L 5.74 -4.36 L 5.73 -4.32 L 5.73 -4.29 L 5.72 -4.25 L 5.72 -4.22 L 5.72 -4.18 C 5.72 -3.79 6.03 -3.48 6.42 -3.48 C 6.81 -3.48 7.13 -3.79 7.13 -4.18 C 7.13 -4.57 6.81 -4.88 6.42 -4.88 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M -7.5 -1.75 L -7.54 -1.75 L -7.57 -1.75 L -7.61 -1.74 L -7.64 -1.74 L -7.68 -1.73 L -7.71 -1.72 L -7.74 -1.71 L -7.77 -1.7 L -7.81 -1.68 L -7.84 -1.67 L -7.87 -1.65 L -7.89 -1.63 L -7.92 -1.61 L -7.95 -1.59 L -7.97 -1.57 L -8 -1.54 L -8.02 -1.52 L -8.04 -1.49 L -8.06 -1.47 L -8.08 -1.44 L -8.1 -1.41 L -8.12 -1.38 L -8.14 -1.35 L -8.15 -1.32 L -8.16 -1.29 L -8.17 -1.26 L -8.18 -1.22 L -8.19 -1.19 L -8.2 -1.15 L -8.2 -1.12 L -8.2 -1.08 L -8.2 -1.05 C -8.2 -0.66 -7.89 -0.34 -7.5 -0.34 C -7.11 -0.34 -6.8 -0.66 -6.8 -1.05 C -6.8 -1.44 -7.11 -1.75 -7.5 -1.75 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M -7.6 2.23 L -7.65 2.23 L -7.69 2.24 L -7.74 2.24 L -7.78 2.25 L -7.82 2.26 L -7.86 2.27 L -7.9 2.29 L -7.94 2.3 L -7.98 2.32 L -8.01 2.34 L -8.05 2.36 L -8.09 2.38 L -8.12 2.41 L -8.15 2.43 L -8.18 2.46 L -8.21 2.49 L -8.24 2.52 L -8.27 2.55 L -8.3 2.58 L -8.32 2.61 L -8.34 2.65 L -8.36 2.69 L -8.38 2.72 L -8.4 2.76 L -8.41 2.8 L -8.43 2.84 L -8.44 2.88 L -8.45 2.92 L -8.46 2.97 L -8.46 3.01 L -8.47 3.05 L -8.47 3.1 C -8.47 3.57 -8.08 3.96 -7.6 3.96 C -7.13 3.96 -6.74 3.57 -6.74 3.1 C -6.74 2.62 -7.13 2.23 -7.6 2.23 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M -5.37 6.27 L -5.42 6.27 L -5.46 6.27 L -5.51 6.28 L -5.56 6.29 L -5.6 6.3 L -5.65 6.31 L -5.69 6.33 L -5.74 6.34 L -5.78 6.36 L -5.82 6.38 L -5.86 6.41 L -5.9 6.43 L -5.93 6.46 L -5.97 6.48 L -6.01 6.51 L -6.04 6.55 L -6.07 6.58 L -6.1 6.61 L -6.13 6.65 L -6.15 6.69 L -6.18 6.72 L -6.2 6.76 L -6.22 6.81 L -6.24 6.85 L -6.26 6.89 L -6.27 6.93 L -6.29 6.98 L -6.3 7.03 L -6.31 7.07 L -6.31 7.12 L -6.31 7.17 L -6.32 7.22 C -6.32 7.74 -5.89 8.17 -5.37 8.17 C -4.84 8.17 -4.42 7.74 -4.42 7.22 C -4.42 6.69 -4.84 6.27 -5.37 6.27 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M -6.42 -4.88 L -6.46 -4.88 L -6.5 -4.88 L -6.53 -4.87 L -6.57 -4.87 L -6.6 -4.86 L -6.63 -4.85 L -6.66 -4.84 L -6.7 -4.83 L -6.73 -4.81 L -6.76 -4.8 L -6.79 -4.78 L -6.82 -4.76 L -6.84 -4.74 L -6.87 -4.72 L -6.9 -4.7 L -6.92 -4.68 L -6.94 -4.65 L -6.97 -4.63 L -6.99 -4.6 L -7.01 -4.57 L -7.03 -4.54 L -7.04 -4.52 L -7.06 -4.48 L -7.07 -4.45 L -7.08 -4.42 L -7.1 -4.39 L -7.1 -4.36 L -7.11 -4.32 L -7.12 -4.29 L -7.12 -4.25 L -7.13 -4.22 L -7.13 -4.18 C -7.13 -3.79 -6.81 -3.48 -6.42 -3.48 C -6.03 -3.48 -5.72 -3.79 -5.72 -4.18 C -5.72 -4.57 -6.03 -4.88 -6.42 -4.88 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
    {path:'M 0 8 L -0.06 8 L -0.11 8.01 L -0.16 8.01 L -0.22 8.02 L -0.27 8.03 L -0.32 8.05 L -0.37 8.06 L -0.42 8.08 L -0.47 8.1 L -0.51 8.13 L -0.56 8.15 L -0.6 8.18 L -0.64 8.21 L -0.68 8.24 L -0.72 8.28 L -0.76 8.31 L -0.79 8.35 L -0.83 8.39 L -0.86 8.43 L -0.89 8.47 L -0.92 8.52 L -0.94 8.56 L -0.97 8.61 L -0.99 8.65 L -1.01 8.7 L -1.02 8.75 L -1.04 8.8 L -1.05 8.86 L -1.06 8.91 L -1.07 8.96 L -1.07 9.02 L -1.07 9.07 C -1.07 9.66 -0.59 10.14 0 10.14 C 0.59 10.14 1.07 9.66 1.07 9.07 C 1.07 8.48 0.59 8 0 8 Z',width:0,scale:.75,color:'#fff',fill:'#fff'},
  ]},
  {id:'water',name:'Body of water',upright:true,fixedSize:true,offset:27,under:[{path:'M-10-3Q-7-5-4-3T2-3T8-3M-10 3Q-7 1-4 3T2 3T8 3',width:1,color:lineColor}]},
];
export const sidedLandmarkTypes = ['parking','water'];
export const translations = {
  en: {
    'arm.Centre':'Middle of road',
    'element.Turn back':'Turn back',
    'group.Angled side road':'Angled side road','group.Angled T-junction':'Angled T-junction','group.Skewed crossroads':'Skewed crossroads',
    'technique.clock':'Clock','time':'Time','technique.quiz':'Quiz question','guide.clock':'First draw the clock hands for the given time. Point the short hand north; the long hand shows your walking direction.','technique.input':'Free text','technique.photo':'Photo','input.value':'Text','step.numbered':'Count in step numbering','step.unnumbered':'without a number','input.placeholder':'e.g. 52.0907, 5.1214 or cross the zebra crossing','guide.input':'Enter free text, such as coordinates or an instruction.','photo.file':'Choose a PNG or JPG photo','photo.change':'Replace photo','photo.width':'Width in PDF','photo.fullWidth':'full width','photo.placeholder':'Choose a PNG or JPG photo','photo.invalid':'Choose a PNG or JPG photo.','guide.photo':'Use a photo as the route instruction.','quiz.question':'Question','quiz.questionPlaceholder':'e.g. How many legs does a spider have?','quiz.answer':'Answer {letter}','quiz.addAnswer':'Add answer','quiz.removeAnswer':'Remove answer {letter}','quiz.answers':'{count} answers','quiz.required':'Enter a question and fill in every answer.','guide.quiz':'Answer the question. The first road on your left is A; continue clockwise with B, C, D, etc. Take the road matching your answer. Count the road you arrived on last.',
    'meta.title':'hike-generator — Hike route builder','meta.description':'Build a hiking route one intersection at a time. Create clear, illustrated instructions and print your route on A4.',
    'brand.builder':'ROUTE BUILDER','language':'Language','darkMode':'Use dark mode','lightMode':'Use light mode','undo':'Undo','newRoute':'New route','exportRoute':'Export route','importRoute':'Import route','routeExported':'Route file downloaded','routeImported':'Route imported','routeImportFailed':'Could not import route. {error}','downloadPdf':'Download PDF','preparingPdf':'Preparing PDF…',
    'building.title':'Add step','addRouteItem':'Add step','insertRouteItem':'Add step after step {number}','insertRouteItemBefore':'Add step before step {number}','close':'Close','technique':'Route technique','technique.junction':'Situation sketch','technique.compass':'Compass bearing','technique.fraction':'Fractions','technique.dot-arrow':'Dot and arrow','technique.eyes':'Eyes','element.Hairpin left':'Hairpin left','element.Hairpin right':'Hairpin right','element.S-bend left':'S-bend left','element.S-bend right':'S-bend right','direction.0':'Go straight','direction.45':'Slight right','direction.90':'Turn right','direction.135':'Hard right','direction.180':'Turn back','direction.225':'Hard left','direction.270':'Turn left','direction.315':'Slight left','bearing':'Bearing','bearingLabel':'Bearing for step {number} in degrees','numerator':'Numerator','denominator':'Denominator','fractionLabel':'Fraction for step {number}','addCompass':'Add','roadCount':'Number of roads','roadCountOption':'{count} roads','roadLayout':'Road layout','junctionShape':'Junction shape','routeExit':'Choose the road to take','direction':'Your direction','roadEdges':'Road edges','approachHelp':'The dot marks where you enter the junction. Follow the arrow to your exit.',
    'routeName':'Route name','untitled':'Untitled hike','distancePrompt':'Add distances as you go','start':'START','startPlaceholder':'Start note','finish':'FINISH','finishPlaceholder':'Finish note',
    'printPreview':'Print preview A4','pdfOptions':'PDF options','includeTechniqueGuide':'Explain route techniques','printNote':'Six consistent diagrams per A4 sheet. Numbered automatically, ready to print.','printableRoute':'Printable route','intersectionLibrary':'Step library','routeEditor':'Route editor',
    'step':'step','steps':'steps','page':'page','pages':'pages','distanceTotal':'{distance} m of noted distances','added':'Step {number} added','duplicated':'Step {number} duplicated','removed':'Step removed.','undone':'Last change undone','newReady':'New route started.','newConfirm':'Start a new route? The current route will be removed.','pdfReady':'Your A4 route sheet is ready','pdfFailed':'Could not create the PDF. {error}','saveFailed':'Your browser could not save this draft. Download your PDF before leaving.','loadFailed':'The saved draft could not be loaded. This route is temporary.','stepLimit':'A route can contain up to 300 steps.',
    'moveUp':'Move step {number} up','moveDown':'Move step {number} down','duplicateStep':'Duplicate step {number}','removeStep':'Remove step {number}','distance':'Distance (m)','distancePlaceholder':'e.g. 200','distanceLabel':'Distance to step {number} in metres','note':'Landmark or note','notePlaceholder':'e.g. After the wooden bridge','noteLabel':'Note for step {number}',
    'rotateLeft':'Rotate step {number} counterclockwise by 45 degrees','rotateRight':'Rotate step {number} clockwise by 45 degrees','rotation':'Rotation {degrees} degrees','rotateLeftTitle':'Rotate 45° counterclockwise','rotateRightTitle':'Rotate 45° clockwise',
    'roadTypes':'Road types','standardRoads':'Regular roads','faintPath':'Faint path','markFaintPath':'Mark {road} as a faint path','landmarks':'Landmarks','add':'Add','item':'Item','roadArm':'Road arm','position':'Position','side.left':'Left side of road','side.right':'Right side of road','itemLabel':'Item for landmark {landmark} on step {step}','armLabel':'Road arm for landmark {landmark} on step {step}','positionLabel':'Position for landmark {landmark} on step {step}','removeLandmark':'Remove landmark {landmark} from step {step}','addLandmark':'Add landmark','landmarkHelp':'Place one element on the road and one on each side.',
    'guide.title':'Route technique guide','guide.junction':'Enter the junction at the dot and follow the arrow to the correct exit.','guide.dot-arrow':'Follow the line from the dot to the arrow. Read it relative to your walking direction: up means straight ahead.','guide.eyes':'Walk in the direction the eyes are looking. Read it relative to your walking direction: looking up means straight ahead, looking down means turn back.','guide.compass':'Follow the given compass bearing. 0° is north, 90° east, 180° south and 270° west.','guide.fraction':'The numerator selects the road; the denominator is the total number of roads. Include the road you arrived on and count from left to right.','guide.pageLabel':'Route technique guide. {techniques}','pdf.credits':'created with hike-generator by Wouter van der Ven','pdf.page':'PAGE {page} / {pages}','pdf.noSteps':'Add a step before downloading.',
    'group.T-junction':'T-junction','group.Crossroads':'Crossroads','group.Fork':'Fork','group.Side road':'Side road','group.Bends & paths':'Bends & paths','group.4-way intersection':'4-way intersection','group.Three-way fork':'Three-way fork','group.5-way intersection':'5-way intersection','group.6-way intersection':'6-way intersection',
    'element.Turn left':'Turn left','element.Turn right':'Turn right','element.Go straight':'Go straight','element.Go straight 45° right':'Go straight 45° right','element.Go straight 45° left':'Go straight 45° left','element.Keep left':'Keep left','element.Keep right':'Keep right','element.Pass left road':'Pass left road','element.Pass right road':'Pass right road','element.Bend left':'Bend left','element.Bend right':'Bend right','element.First road right':'First road right','element.Second road right':'Second road right','element.First road left':'First road left','element.Second road left':'Second road left','element.Hard right':'Hard right','element.Slight right':'Slight right','element.Slight left':'Slight left','element.Hard left':'Hard left',
    'landmark.bridge':'Bridge','landmark.parking':'Parking area','landmark.bridleway':'Bridleway','landmark.water':'Body of water',
    'arm.Right':'Right road','arm.Lower-right':'Lower-right road','arm.Bottom':'Bottom road','arm.Lower-left':'Lower-left road','arm.Left':'Left road','arm.Upper-left':'Upper-left road','arm.Top':'Top road','arm.Upper-right':'Upper-right road','arm.entry':' (entry)',
    'previewLabel':'A4 page {page} of {pages}. {steps}'
  },
  nl: {
    'arm.Centre':'Midden van de weg',
    'element.Turn back':'Omkeren',
    'group.Angled side road':'Schuine zijweg','group.Angled T-junction':'Schuine T-splitsing','group.Skewed crossroads':'Schuin kruispunt',
    'technique.clock':'Klok','time':'Tijd','technique.quiz':'Quizvraag','guide.clock':'Teken eerst zelf de wijzers bij de gegeven tijd. Richt de kleine wijzer naar het noorden; de grote wijzer geeft je looprichting aan.','technique.input':'Vrije tekst','technique.photo':'Foto','input.value':'Tekst','step.numbered':'Meetellen in stapnummering','step.unnumbered':'zonder nummer','input.placeholder':'bijv. 52.0907, 5.1214 of steek het zebrapad over','guide.input':'Vul vrije tekst in, bijvoorbeeld coördinaten of een instructie.','photo.file':'Kies een PNG- of JPG-foto','photo.change':'Foto vervangen','photo.width':'Breedte in PDF','photo.fullWidth':'volledige breedte','photo.placeholder':'Kies een PNG- of JPG-foto','photo.invalid':'Kies een PNG- of JPG-foto.','guide.photo':'Gebruik een foto als route-instructie.','quiz.question':'Vraag','quiz.questionPlaceholder':'bijv. Hoeveel poten heeft een spin?','quiz.answer':'Antwoord {letter}','quiz.addAnswer':'Antwoord toevoegen','quiz.removeAnswer':'Antwoord {letter} verwijderen','quiz.answers':'{count} antwoorden','quiz.required':'Vul de vraag en alle antwoorden in.','guide.quiz':'Beantwoord de vraag. De eerste weg aan je linkerhand is A; ga met de klok mee verder met B, C, D, enz. Neem de weg van jouw antwoord. De aankomstweg telt als laatste mee.',
    'meta.title':'hike-generator — Wandelroutebouwer','meta.description':'Bouw stap voor stap een wandelroute met duidelijke kruispunttekeningen en print deze op A4.',
    'brand.builder':'ROUTEBOUWER','language':'Taal','darkMode':'Donkere modus gebruiken','lightMode':'Lichte modus gebruiken','undo':'Ongedaan maken','newRoute':'Nieuwe route','exportRoute':'Route exporteren','importRoute':'Route importeren','routeExported':'Routebestand gedownload','routeImported':'Route geïmporteerd','routeImportFailed':'Route kon niet worden geïmporteerd. {error}','downloadPdf':'PDF downloaden','preparingPdf':'PDF voorbereiden…',
    'building.title':'Stap toevoegen','addRouteItem':'Stap toevoegen','insertRouteItem':'Stap toevoegen na stap {number}','insertRouteItemBefore':'Stap toevoegen vóór stap {number}','close':'Sluiten','technique':'Routetechniek','technique.junction':'Kruispunten','technique.compass':'Graden schieten','technique.fraction':'Breuken','technique.dot-arrow':'Bolletje-pijltje','technique.eyes':'Oogjes','element.Hairpin left':'Haarspeld links','element.Hairpin right':'Haarspeld rechts','element.S-bend left':'S-bocht links','element.S-bend right':'S-bocht rechts','direction.0':'Rechtdoor','direction.45':'Schuin rechts','direction.90':'Rechtsaf','direction.135':'Scherp rechts','direction.180':'Terug','direction.225':'Scherp links','direction.270':'Linksaf','direction.315':'Schuin links','bearing':'Koers in graden','bearingLabel':'Koers van stap {number} in graden','numerator':'Teller','denominator':'Noemer','fractionLabel':'Breuk bij stap {number}','addCompass':'Toevoegen','roadCount':'Aantal wegen','roadCountOption':'{count} wegen','roadLayout':'Weg-layout','junctionShape':'Kruispuntvorm','routeExit':'Te nemen weg','direction':'Jouw richting','roadEdges':'Wegkanten','approachHelp':'De stip geeft aan waar je het kruispunt opkomt. Volg de pijl naar de uitgang.',
    'routeName':'Routenaam','untitled':'Naamloze wandeling','distancePrompt':'Voeg desgewenst afstanden toe','start':'START','startPlaceholder':'Opmerking bij het startpunt','finish':'EIND','finishPlaceholder':'Opmerking bij het eindpunt',
    'printPreview':'Afdrukvoorbeeld A4','pdfOptions':'PDF-opties','includeTechniqueGuide':'Uitleg routetechnieken','printNote':'Zes consistente tekeningen per A4. Automatisch genummerd en klaar om te printen.','printableRoute':'Printbare route','intersectionLibrary':'Stappenbibliotheek','routeEditor':'Routebewerker',
    'step':'stap','steps':'stappen','page':'pagina','pages':'pagina’s','distanceTotal':'{distance} m aan opgegeven afstanden','added':'Stap {number} toegevoegd','duplicated':'Stap {number} gedupliceerd','removed':'Stap verwijderd.','undone':'Laatste wijziging ongedaan gemaakt','newReady':'Nieuwe route gestart.','newConfirm':'Nieuwe route starten? De huidige route wordt verwijderd.','pdfReady':'Je A4-routeblad is klaar','pdfFailed':'De PDF kon niet worden gemaakt. {error}','saveFailed':'Je browser kon dit concept niet opslaan. Download je PDF voordat je de pagina verlaat.','loadFailed':'Het opgeslagen concept kon niet worden geladen. Deze route is tijdelijk.','stepLimit':'Een route kan maximaal 300 stappen bevatten.',
    'moveUp':'Verplaats stap {number} omhoog','moveDown':'Verplaats stap {number} omlaag','duplicateStep':'Dupliceer stap {number}','removeStep':'Verwijder stap {number}','distance':'Afstand (m)','distancePlaceholder':'bijv. 200','distanceLabel':'Afstand tot stap {number} in meters','note':'Opmerking','notePlaceholder':'bijv. Na de houten brug','noteLabel':'Opmerking bij stap {number}',
    'rotateLeft':'Draai stap {number} 45 graden linksom','rotateRight':'Draai stap {number} 45 graden rechtsom','rotation':'Draaiing {degrees} graden','rotateLeftTitle':'Draai 45° linksom','rotateRightTitle':'Draai 45° rechtsom',
    'roadTypes':'Wegtypen','standardRoads':'Normale wegen','faintPath':'Hazenpaadje','markFaintPath':'Markeer {road} als hazenpaadje','landmarks':'Route-elementen','add':'Toevoegen','item':'Element','roadArm':'Wegtak','position':'Plaatsing','side.left':'Links van de weg','side.right':'Rechts van de weg','itemLabel':'Element {landmark} bij stap {step}','armLabel':'Wegtak voor element {landmark} bij stap {step}','positionLabel':'Plaatsing van element {landmark} bij stap {step}','removeLandmark':'Verwijder element {landmark} van stap {step}','addLandmark':'Element toevoegen','landmarkHelp':'Plaats één element op de weg en één aan elke wegkant.',
    'guide.title':'Uitleg routetechnieken','guide.junction':'Kom bij de stip het kruispunt op en volg de pijl naar de juiste uitgang.','guide.dot-arrow':'Volg de lijn vanaf het bolletje naar de pijl. Lees de richting vanuit je looprichting: omhoog is rechtdoor.','guide.eyes':'Loop in de richting waarin de ogen kijken, vanuit je eigen looprichting. Omhoog kijken betekent rechtdoor; omlaag kijken betekent terug.','guide.compass':'Loop in de aangegeven kompasrichting. 0° is noord, 90° oost, 180° zuid en 270° west.','guide.fraction':'De teller geeft aan welke weg je neemt; de noemer is het totale aantal wegen. Tel de aankomstweg mee en tel van links naar rechts.','guide.pageLabel':'Uitleg routetechnieken. {techniques}','pdf.credits':'Gemaakt met https://vandervenwouter.github.io/hike-generator','pdf.page':'PAGINA {page} / {pages}','pdf.noSteps':'Voeg een stap toe voordat je downloadt.',
    'group.T-junction':'T-splitsing','group.Crossroads':'Kruispunt','group.Fork':'Vorksplitsing','group.Side road':'Zijweg','group.Bends & paths':'Bochten en paden','group.4-way intersection':'Viersprong','group.Three-way fork':'Drievoudige vorksplitsing','group.5-way intersection':'Vijfsprong','group.6-way intersection':'Zessprong',
    'element.Turn left':'Linksaf','element.Turn right':'Rechtsaf','element.Go straight':'Rechtdoor','element.Go straight 45° right':'Rechtdoor, 45° rechts','element.Go straight 45° left':'Rechtdoor, 45° links','element.Keep left':'Links aanhouden','element.Keep right':'Rechts aanhouden','element.Pass left road':'Linkerzijweg voorbij','element.Pass right road':'Rechterzijweg voorbij','element.Bend left':'Bocht naar links','element.Bend right':'Bocht naar rechts','element.First road right':'Eerste weg rechts','element.Second road right':'Tweede weg rechts','element.First road left':'Eerste weg links','element.Second road left':'Tweede weg links','element.Hard right':'Scherp rechts','element.Slight right':'Schuin rechts','element.Slight left':'Schuin links','element.Hard left':'Scherp links',
    'landmark.bridge':'Brug','landmark.parking':'Parkeerplaats','landmark.bridleway':'Ruiterpad','landmark.water':'Water',
    'arm.Right':'Rechterweg','arm.Lower-right':'Weg rechtsonder','arm.Bottom':'Onderste weg','arm.Lower-left':'Weg linksonder','arm.Left':'Linkerweg','arm.Upper-left':'Weg linksboven','arm.Top':'Bovenste weg','arm.Upper-right':'Weg rechtsboven','arm.entry':' (ingang)',
    'previewLabel':'A4-pagina {page} van {pages}. {steps}'
  }
};
export function translate(language,key,values={}){
  const template=(translations[language]??translations.en)[key]??translations.en[key]??key;
  return template.replace(/\{(\w+)\}/g,(_,name)=>values[name]??'');
}
export const elementName = (element,language='en') => translate(language,`element.${element.name}`);
export const groupName = (element,language='en') => translate(language,`group.${element.group}`);
export const landmarkName = (landmark,language='en') => translate(language,`landmark.${landmark.id}`);
export function roadArms(element){
  if(element.arms)return element.arms;
  const approach={id:'approach',x:50,y:76,angle:90,end:{x:50,y:90}};
  const ahead={id:'ahead',x:50,y:24,angle:270,end:{x:50,y:10}};
  const left={id:'left',x:24,y:50,angle:180,end:{x:12,y:50}};
  const right={id:'right',x:76,y:50,angle:0,end:{x:88,y:50}};
  if(element.id.startsWith('t-'))return [approach,{...left,y:42,end:{x:12,y:42}},{...right,y:42,end:{x:88,y:42}}];
  if(element.id.startsWith('cross-'))return [approach,left,ahead,right];
  if(element.id.startsWith('fork-'))return [approach,{...left,x:28,y:30,angle:229.15,end:{x:18,y:18}},{...right,x:72,y:30,angle:310.85,end:{x:82,y:18}}];
  if(element.id.startsWith('side-left-'))return [approach,left,ahead];
  if(element.id.startsWith('side-right-'))return [approach,ahead,right];
  if(element.id==='bend-left')return [approach,{...left,x:21,y:35,end:{x:0,y:35}}];
  if(element.id==='bend-right')return [approach,{...right,x:79,y:35,end:{x:100,y:35}}];
  return [approach,ahead];
}
export const roadCount = element => roadArms(element).length;
export function junctionLayoutKey(element){return roadArms(element).map(arm=>(arm.angle%360+360)%360).sort((a,b)=>a-b).join(',');}
export function mirroredJunctionLayoutKey(element){
  const mirror={arms:roadArms(element).map(arm=>({...arm,angle:180-arm.angle}))};
  return [junctionLayoutKey(element),junctionLayoutKey(mirror)].sort().join('|');
}
// Weight upper arms more strongly so balanced 45-degree layouts still get a left/right order.
export const junctionLateralBias = element => roadArms(element).reduce((sum,arm)=>{const radians=arm.angle*Math.PI/180;return sum+Math.cos(radians)*(1-Math.sin(radians))**2},0);
// Keep separate positions only for old drafts whose landmarks would overlap in the centre.
export const landmarkArms = (element,placements=[]) => element.id==='straight'&&!placements.some(p=>['approach','ahead'].includes(p?.arm))?[{id:'centre',x:50,y:50,angle:270}]:roadArms(element);
export const roadArmLabel = (arm,rotation=0,language='en') => arm.id==='centre'?translate(language,'arm.Centre'):translate(language,`arm.${['Right','Lower-right','Bottom','Lower-left','Left','Upper-left','Top','Upper-right'][((Math.round((arm.angle+rotation)/45)%8)+8)%8]}`)+(arm.id==='approach'?translate(language,'arm.entry'):'');
const junctionScale = element => 40/((element.radius??40)+(element.throughExtension??0));
const routeArmFor = element => roadArms(element).find(arm=>Math.abs(((arm.angle-(element.tip?.angle??NaN)+540)%360)-180)<.01);
const bridgeRoadClearance=14;
const parkingRoadClearance=11.5,parkingFitMin=-30,parkingFitMax=130;
export function armGeometry(element,arm,scale=junctionScale(element)){
  const radians=arm.angle*Math.PI/180,
    direction={x:Math.cos(radians),y:Math.sin(radians)},
    distance=Math.hypot(arm.x-50,arm.y-50),
    end=arm.end??point(arm.angle,distance+(element.radius?14+(element.exit===roadArms(element).indexOf(arm)?element.roadExtension:element.throughExtension??0):40-distance)),
    endDistance=Math.hypot(end.x-50,end.y-50),tip=element.tip,
    tipDistance=tip?Math.hypot(tip.x-50,tip.y-50):0;
  return {arm,scale,radians,direction,distance,end,endDistance,tip,tipDistance,route:routeArmFor(element)?.id===arm.id};
}
function markerFits(geometry,distance){
  const {scale,direction,radians}=geometry,
    x=50+direction.x*distance*scale,y=50+direction.y*distance*scale,
    halfX=(Math.abs(Math.cos(radians))*10+Math.abs(Math.sin(radians))*27)*bridgeMarkerScale,
    halfY=(Math.abs(Math.sin(radians))*10+Math.abs(Math.cos(radians))*27)*bridgeMarkerScale;
  return x-halfX>=3&&x+halfX<=97&&y-halfY>=3&&y+halfY<=97;
}
function bridgeClear(geometry,arms,distance){
  const {scale,direction,radians}=geometry,
    center={x:50+direction.x*distance*scale,y:50+direction.y*distance*scale},normal={x:-Math.sin(radians),y:Math.cos(radians)},halfAlong=10*bridgeMarkerScale,halfAcross=27*bridgeMarkerScale;
  for(const other of arms){
    if(other.id===geometry.arm.id)continue;
    const difference=Math.abs(((other.angle-geometry.arm.angle+540)%360)-180);
    if(difference>170)continue;
    const angle=other.angle*Math.PI/180,directionOther={x:Math.cos(angle),y:Math.sin(angle)},end=Math.hypot(other.end.x-50,other.end.y-50)*scale,projections=[];
    for(const along of [-halfAlong,halfAlong])for(const across of [-halfAcross,halfAcross]){
      const x=center.x+direction.x*along+normal.x*across,y=center.y+direction.y*along+normal.y*across;
      projections.push({along:(x-50)*directionOther.x+(y-50)*directionOther.y,across:(x-50)*-directionOther.y+(y-50)*directionOther.x});
    }
    const alongMin=Math.min(...projections.map(point=>point.along)),alongMax=Math.max(...projections.map(point=>point.along)),acrossMin=Math.min(...projections.map(point=>point.across)),acrossMax=Math.max(...projections.map(point=>point.across));
    if(alongMax>=0&&alongMin<=end&&acrossMin<=bridgeRoadClearance&&acrossMax>=-bridgeRoadClearance)return false;
  }
  return true;
}
export function bridgeGeometry(element,arm,scale=junctionScale(element)){
  const geometry=armGeometry(element,arm,scale);
  if(arm.id==='centre')return {geometry,along:0,start:0,end:0,extension:0};
  const arms=roadArms(element);
  const target=geometry.route
    ?Math.max(geometry.endDistance-6/scale,geometry.tipDistance+4/scale)
    :geometry.endDistance-6/scale;
  let low=geometry.distance,high=Math.max(target,geometry.distance)+200;
  for(let i=0;i<24;i++){
    const middle=(low+high)/2;
    if(markerFits(geometry,middle))low=middle;else high=middle;
  }
  const step=2/scale;
  let markerDistance=Math.min(target,low);
  for(let candidate=markerDistance;candidate<=low;candidate+=step){
    if(bridgeClear(geometry,arms,candidate)){markerDistance=candidate;break;}
    markerDistance=Math.min(candidate+step,low);
  }
  const requiredEnd=Math.max(geometry.endDistance,markerDistance+10/scale),roadStart=geometry.endDistance-geometry.distance;
  // Overlap the existing road layers far enough to hide the extension cap completely.
  return {geometry,along:markerDistance-geometry.distance,start:Math.max(0,roadStart-12/scale),end:requiredEnd-geometry.distance,extension:Math.max(0,requiredEnd-geometry.endDistance)};
}
function roadsideMarkerCenter(geometry,side,distance,offset){
  const normal={x:-Math.sin(geometry.radians),y:Math.cos(geometry.radians)},sideOffset=offset/geometry.scale*side;
  return {x:50+geometry.direction.x*distance*geometry.scale+normal.x*sideOffset*geometry.scale,y:50+geometry.direction.y*distance*geometry.scale+normal.y*sideOffset*geometry.scale};
}
function roadsideMarkerFits(geometry,side,distance,config){
  const center=roadsideMarkerCenter(geometry,side,distance,config.offset),halfX=config.halfX,halfY=config.halfY;
  return center.x-halfX>=parkingFitMin&&center.x+halfX<=parkingFitMax&&center.y-halfY>=parkingFitMin&&center.y+halfY<=parkingFitMax;
}
function roadsideClear(geometry,arms,side,distance,config){
  const center=roadsideMarkerCenter(geometry,side,distance,config.offset);
  for(const other of arms){
    if(other.id===geometry.arm.id)continue;
    const angle=other.angle*Math.PI/180,direction={x:Math.cos(angle),y:Math.sin(angle)},end=Math.hypot(other.end.x-50,other.end.y-50)*geometry.scale,projections=[];
    for(const x of [-config.halfX,config.halfX])for(const y of [-config.halfY,config.halfY]){
      const px=center.x+x,py=center.y+y;
      projections.push({along:(px-50)*direction.x+(py-50)*direction.y,across:(px-50)*-direction.y+(py-50)*direction.x});
    }
    const alongMin=Math.min(...projections.map(point=>point.along)),alongMax=Math.max(...projections.map(point=>point.along)),acrossMin=Math.min(...projections.map(point=>point.across)),acrossMax=Math.max(...projections.map(point=>point.across));
    if(alongMax>=0&&alongMin<=end+Math.max(config.halfX,config.halfY)&&acrossMin<=parkingRoadClearance&&acrossMax>=-parkingRoadClearance)return false;
  }
  return true;
}
function roadsideGeometry(element,arm,side,scale,config){
  const geometry=armGeometry(element,arm,scale),sideSign=(side==='left'?-1:1)*(arm.id==='approach'?-1:1),arms=roadArms(element);
  let low=geometry.distance,high=geometry.distance+200;
  for(let i=0;i<24;i++){
    const middle=(low+high)/2;
    if(roadsideMarkerFits(geometry,sideSign,middle,config))low=middle;else high=middle;
  }
  const step=2/scale;
  let markerDistance=geometry.distance;
  for(let candidate=geometry.distance;candidate<=low;candidate+=step){
    if(roadsideClear(geometry,arms,sideSign,candidate,config)){markerDistance=candidate;break;}
    markerDistance=Math.min(candidate+step,low);
  }
  const requiredEnd=Math.max(geometry.endDistance,markerDistance+18/scale),roadStart=geometry.endDistance-geometry.distance;
  return {geometry,along:markerDistance-geometry.distance,start:Math.max(0,roadStart-12/scale),end:requiredEnd-geometry.distance,extension:Math.max(0,requiredEnd-geometry.endDistance)};
}
export const parkingGeometry=(element,arm,side='right',scale=junctionScale(element))=>roadsideGeometry(element,arm,side,scale,{offset:24,halfX:12,halfY:12});
export const waterGeometry=(element,arm,side='right',scale=junctionScale(element))=>roadsideGeometry(element,arm,side,scale,{offset:27,halfX:10,halfY:3});
export function junctionOffset(element,placements=[]){
  const scale=junctionScale(element),half=11.5/scale,arms=roadArms(element);
  let minX=50,maxX=50,minY=50,maxY=50;
  const add=(point,extraX=0,extraY=extraX)=>{minX=Math.min(minX,point.x-extraX);maxX=Math.max(maxX,point.x+extraX);minY=Math.min(minY,point.y-extraY);maxY=Math.max(maxY,point.y+extraY);};
  for(const arm of arms){
    const angle=arm.angle*Math.PI/180,edgeX=Math.abs(Math.sin(angle))*half,edgeY=Math.abs(Math.cos(angle))*half;
    add(arm.end??arm,edgeX,edgeY);add({x:50,y:50},edgeX,edgeY);
  }
  if(element.tip)add(element.tip,5/scale);
  for(const placement of placements.filter(item=>['bridge','parking','bridleway','water'].includes(item.type))){
    const arm=arms.find(candidate=>candidate.id===placement.arm);if(!arm)continue;
    if(placement.type==='bridleway'){
      const along=bridlewayAlong(element,arm,scale),angle=arm.angle*Math.PI/180;
      add({x:arm.x+Math.cos(angle)*along,y:arm.y+Math.sin(angle)*along},10.5/scale);
      if(arm.id===routeArmFor(element)?.id){
        const end=along+14;
        add({x:arm.x+Math.cos(angle)*end,y:arm.y+Math.sin(angle)*end},Math.abs(Math.sin(angle))*half,Math.abs(Math.cos(angle))*half);
      }
      continue;
    }
    const geometry=placement.type==='bridge'?bridgeGeometry(element,arm,scale):placement.type==='parking'?parkingGeometry(element,arm,placement.side,scale):waterGeometry(element,arm,placement.side,scale),distance=geometry.geometry.distance+geometry.along,angle=geometry.geometry.radians;
    if(placement.type==='bridge')add({x:50+Math.cos(angle)*distance,y:50+Math.sin(angle)*distance},(Math.abs(Math.cos(angle))*10+Math.abs(Math.sin(angle))*27)*bridgeMarkerScale/scale,(Math.abs(Math.sin(angle))*10+Math.abs(Math.cos(angle))*27)*bridgeMarkerScale/scale);
    else {const config=placement.type==='parking'?{offset:24,halfX:12,halfY:12}:{offset:27,halfX:10,halfY:3},side=(placement.side==='left'?-1:1)*(arm.id==='approach'?-1:1);add(roadsideMarkerCenter(geometry.geometry,side,distance,config.offset),config.halfX/scale,config.halfY/scale);}
    if(geometry.extension)add({x:50+geometry.geometry.direction.x*(geometry.geometry.endDistance+geometry.extension),y:50+geometry.geometry.direction.y*(geometry.geometry.endDistance+geometry.extension)},edgeXFor(angle,half),edgeYFor(angle,half));
  }
  const fitShift=placements.some(placement=>placement.type==='bridleway'&&placement.arm==='approach')?-6:0;
  return {x:(50-(minX+maxX)/2)*scale,y:(50-(minY+maxY)/2)*scale-fitShift};
}
const edgeXFor=(angle,half)=>Math.abs(Math.sin(angle))*half;
const edgeYFor=(angle,half)=>Math.abs(Math.cos(angle))*half;
function bridlewayAlong(element,arm,scale=junctionScale(element)){
  if(arm.id==='approach')return 50+((element.radius??40)+(element.throughExtension??0))*.85-arm.y+12/scale;
  const routeArm=routeArmFor(element);
  return arm.id===routeArm?.id?Math.hypot((element.tip?.x??arm.x)-arm.x,(element.tip?.y??arm.y)-arm.y)+12/scale:0;
}
function landmarkLayers(element,placements,phase,scale=junctionScale(element),faintArms=[]){
  return placements.flatMap(placement=>{
    const arm=landmarkArms(element,placements).find(arm=>arm.id===placement.arm);
    const type=landmarkTypes.find(type=>type.id===placement.type);
    const source=phase==='under'?type.under:type.over;
    const radians=arm.angle*Math.PI/180;
    const layers=(source===undefined?[]:Array.isArray(source)?source:[{path:source,width:1,color:lineColor}]).filter(layer=>!(layer.skipApproach&&arm.id==='approach'));
    const side=type.offset?(placement.side==='left'?-1:1)*(arm.id==='approach'?-1:1):1,offset=side*(type.offset??0)/scale,along=placement.type==='bridleway'?bridlewayAlong(element,arm,scale):placement.type==='bridge'?bridgeGeometry(element,arm,scale).along:placement.type==='parking'?parkingGeometry(element,arm,placement.side,scale).along:placement.type==='water'?waterGeometry(element,arm,placement.side,scale).along:type.along??0;
    return layers.map(layer=>({...layer,cap:'butt',x:arm.x+Math.cos(radians)*along-Math.sin(radians)*offset,y:arm.y+Math.sin(radians)*along+Math.cos(radians)*offset,angle:arm.angle,upright:type.upright,fixedSize:layer.fixedSize||type.fixedSize,scale:layer.scale??type.scale}));
  });
}
function roadPath(element,armId){
  if(element.roadPaths?.[armId])return element.roadPaths[armId];
  if(element.id.startsWith('t-'))return {approach:'M50 90V42',left:'M12 42H50',right:'M50 42H88'}[armId];
  if(element.id.startsWith('cross-'))return {approach:'M50 90V50',left:'M10 50H50',ahead:'M50 50V10',right:'M50 50H90'}[armId];
  if(element.id.startsWith('fork-'))return {approach:'M50 90V55',left:'M50 55L18 18',right:'M50 55L82 18'}[armId];
  if(element.id.startsWith('side-left-'))return {approach:'M50 90V50',left:'M10 50H50',ahead:'M50 50V10'}[armId];
  if(element.id.startsWith('side-right-'))return {approach:'M50 90V50',ahead:'M50 50V10',right:'M50 50H90'}[armId];
  if(element.id==='bend-left')return {approach:'M50 90V60C50 46.2 38.8 35 25 35',left:'M25 35H0'}[armId];
  if(element.id==='bend-right')return {approach:'M50 90V60C50 46.2 61.2 35 75 35',right:'M75 35H100'}[armId];
  if(element.id==='straight'||element.id==='turn-back')return {approach:'M50 90V50',ahead:'M50 50V10',centre:'M50 90V10'}[armId];
}
function staticRoadEdgePaths(element,armId){
  if(element.id==='straight'||element.id==='turn-back'){
    return armId==='approach'?['M39 90V50','M61 90V50']:['M39 50V10','M61 50V10'];
  }
  if(element.id==='bend-left'){
    if(armId==='left')return ['M25 24H0','M25 46H0'];
    return ['M61 90V60C61 40.12 45.12 24 25 24H0','M39 90V60C39 52.27 32.73 46 25 46H0'];
  }
  if(element.id==='bend-right'){
    if(armId==='right')return ['M75 24H100','M75 46H100'];
    return ['M39 90V60C39 40.12 54.88 24 75 24H100','M61 90V60C61 52.27 67.27 46 75 46H100'];
  }
  return [];
}
function roadEdgeGeometry(element,arm,scale=1){
  if(['bend-left','bend-right','straight','turn-back'].includes(element.id))return [];
  const centre=element.id.startsWith('t-')?{x:50,y:42}:element.id.startsWith('fork-')?{x:50,y:55}:{x:50,y:50},arms=roadArms(element);
  const extension=element.radius?element.roadExtension:(element.exit===arms.indexOf(arm)?element.roadExtension:(element.throughExtension&&Number.isInteger(arm.angle/90)?element.throughExtension:0)),[defaultStart,end]=element.radius?[22-element.radius,14+extension]:element.id.startsWith('fork-')?(arm.id==='approach'?[-21,14]:[-34,16]):[-18,18];
  const edgeHalf=11/scale,joins={negative:[],positive:[]},distance=Math.hypot(arm.x-centre.x,arm.y-centre.y);
  for(const other of arms){
    if(other.id===arm.id)continue;
    const difference=((other.angle-arm.angle+540)%360)-180;
    if(Math.abs(difference)===180)continue;
    joins[difference>0?'positive':'negative'].push(Number((edgeHalf/Math.tan(Math.abs(difference)*Math.PI/360)-distance).toFixed(2)));
  }
  const negativeStart=joins.negative.length?Math.max(...joins.negative):defaultStart,positiveStart=joins.positive.length?Math.max(...joins.positive):defaultStart;
  return {edgeHalf,end,negativeStart,positiveStart,start:Math.max(negativeStart,positiveStart)};
}
function roadEdgeLayers(paths,arm,faint){
  return paths.map(path=>({path,width:1,color:lineColor,cap:'butt',x:arm.x,y:arm.y,angle:arm.angle,road:true,joinEdge:true,...(faint?{dash:[5,4],faintEdge:true}:{})}));
}
function roadEndMasks(element){
  return roadArms(element).map(arm=>{
    const dx=arm.end.x-50,dy=arm.end.y-50,length=Math.hypot(dx,dy),normal={x:-dy/length*12,y:dx/length*12};
    return {path:`M${arm.end.x-normal.x} ${arm.end.y-normal.y}L${arm.end.x+normal.x} ${arm.end.y+normal.y}`,width:2,color:'#fff',cap:'butt',x:0,y:0,angle:0,road:true,roadEndMask:true};
  });
}
function roadLayers(element,faintArms=[]){
  const special=['bend-left','bend-right','straight','turn-back'].includes(element.id);
  const base=special?[{path:element.roads,width:23,color:'#fff',cap:'butt',x:0,y:0,angle:0,road:true}]:[
    {path:element.roads,width:23,color:lineColor,cap:'butt',x:0,y:0,angle:0,road:true},
    {path:element.roads,width:21,color:'#fff',cap:'butt',x:0,y:0,angle:0,road:true},
    ...roadEndMasks(element),
  ];
  if(!special)return base;
  const edgePaths=['straight','turn-back'].includes(element.id)?['M39 10V90M61 10V90']:staticRoadEdgePaths(element,'approach');
  const edges=edgePaths.map(path=>({path,width:1,color:lineColor,cap:'butt',x:0,y:0,angle:0,road:true,joinEdge:true}));
  const faint=roadArms(element).filter(arm=>faintArms.includes(arm.id)).flatMap(arm=>[
    {path:roadPath(element,arm.id),width:23,color:'#fff',cap:'butt',x:0,y:0,angle:0,road:true,faintRoadInterior:true},
    ...staticRoadEdgePaths(element,arm.id).map(path=>({path,width:1,color:lineColor,cap:'butt',x:0,y:0,angle:0,road:true,joinEdge:true,dash:[5,4],faintEdge:true})),
  ]);
  return [...base,...edges,...faint];
}
function faintRoadLayers(element,arm,paths,geometry){
  const interiorPath=geometry?(()=>{
    const radians=arm.angle*Math.PI/180,start=geometry.faintStart??geometry.start,end=geometry.end;
    return `M${arm.x+Math.cos(radians)*start} ${arm.y+Math.sin(radians)*start}L${arm.x+Math.cos(radians)*end} ${arm.y+Math.sin(radians)*end}`;
  })():roadPath(element,arm.id);
  return [
    {path:interiorPath,width:23,color:'#fff',cap:'butt',x:0,y:0,angle:0,road:true,faintRoadInterior:true},
    ...roadEdgeLayers(paths,arm,true),
  ];
}
function roadJoinLayers(element,faintArms=[],scale=1){
  if(['bend-left','bend-right','straight','turn-back'].includes(element.id))return [];
  const arms=roadArms(element);
  return arms.flatMap(arm=>{
    const geometry=roadEdgeGeometry(element,arm,scale);
    if(!faintArms.includes(arm.id))return roadEdgeLayers([
      `M${geometry.negativeStart} -${geometry.edgeHalf}H${geometry.end}`,
      `M${geometry.positiveStart} ${geometry.edgeHalf}H${geometry.end}`,
    ],arm,false);
    const edgeStarts=Number.isInteger(arm.angle/90)?[geometry.start,geometry.start]:[geometry.negativeStart,geometry.positiveStart];
    return faintRoadLayers(element,arm,[
      `M${edgeStarts[0]} -${geometry.edgeHalf}H${geometry.end}`,
      `M${edgeStarts[1]} ${geometry.edgeHalf}H${geometry.end}`,
    ],{...geometry,faintStart:Number.isInteger(arm.angle/90)?geometry.start:Math.min(...edgeStarts)});
  });
}
function bridgeExtensionLayers(element,placements=[],faintArms=[],scale=junctionScale(element)){
  return placements.filter(placement=>['bridge','parking','water'].includes(placement.type)).flatMap(placement=>{
    const arm=roadArms(element).find(candidate=>candidate.id===placement.arm);
    if(!arm)return[];
    const geometry=placement.type==='bridge'?bridgeGeometry(element,arm,scale):placement.type==='parking'?parkingGeometry(element,arm,placement.side,scale):waterGeometry(element,arm,placement.side,scale);
    if(!geometry.extension)return[];
    const faint=faintArms.includes(arm.id),edgeGeometry=roadEdgeGeometry(element,arm,scale),edgeStart=faint&&edgeGeometry.start!==undefined?edgeGeometry.start:geometry.start;
    const edgeHalf=11/scale,edges=`M${edgeStart} -${edgeHalf}H${geometry.end}M${edgeStart} ${edgeHalf}H${geometry.end}`;
    return [
      {path:`M${geometry.start} 0H${geometry.end}`,width:23,color:'#fff',cap:'butt',x:arm.x,y:arm.y,angle:arm.angle,bridgeExtension:placement.type==='bridge',parkingExtension:placement.type==='parking',waterExtension:placement.type==='water'},
      {path:edges,width:1,color:lineColor,cap:'butt',x:arm.x,y:arm.y,angle:arm.angle,bridgeExtension:placement.type==='bridge',parkingExtension:placement.type==='parking',waterExtension:placement.type==='water',...(faint?{dash:[5,4]}:{})},
    ];
  });
}
export const layerRotation = (layer,rotation=0) => (layer.upright?-rotation:(layer.angle??0))+(layer.rotationOffset??0);
// Landmarks and roads share their geometry in the SVG editor and PDF renderer.
export function junctionLayers(element,placements=[],faintArms=[]){
  const radius=(element.radius??40)+(element.throughExtension??0),scale=40/radius;
  const entryY=50+radius*.85;
  const approachBridleway=placements.some(placement=>placement.type==='bridleway'&&placement.arm==='approach'),fitShift=approachBridleway?-6:0;
  const routeArm=routeArmFor(element);
  const bridlewayExtensions=placements.filter(placement=>placement.type==='bridleway').flatMap(placement=>{
    const arm=landmarkArms(element,placements).find(candidate=>candidate.id===placement.arm);
    if(!arm||(arm.id!=='approach'&&arm.id!==routeArm?.id))return[];
    const end=bridlewayAlong(element,arm,scale)+14,edgeHalf=11/scale,faint=faintArms.includes(arm.id),edgeGeometry=roadEdgeGeometry(element,arm,scale),start=faint&&edgeGeometry.start!==undefined?edgeGeometry.start:8;
    return [
      {path:`M${start} 0H${end}`,width:23,color:'#fff',cap:'butt',x:arm.x,y:arm.y,angle:arm.angle,roadExtension:true},
      {path:`M${start} -${edgeHalf}H${end}M${start} ${edgeHalf}H${end}`,width:1,color:lineColor,cap:'butt',x:arm.x,y:arm.y,angle:arm.angle,roadExtension:true,...(faint?{dash:[5,4]}:{})},
    ];
  });
  const layers=[
    ...roadLayers(element,faintArms),
    ...bridgeExtensionLayers(element,placements,faintArms,scale),
    ...roadJoinLayers(element,faintArms,scale),
    ...bridlewayExtensions,
    ...landmarkLayers(element,placements.filter(placement=>['parking','water'].includes(placement.type)),'under',scale),
    {path:element.route,width:2.5,color:lineColor,cap:'round'},
    {path:element.arrow,...element.tip,width:2.5,color:lineColor,cap:'round',fixedSize:true},
    ...landmarkLayers(element,placements,'over',scale,faintArms),
    {path:'M-3 0a3 3 0 1 0 6 0a3 3 0 1 0-6 0',x:50,y:entryY,width:0,color:lineColor,fill:lineColor,fixedSize:true},
  ];
  // Fit positions to the canvas, but keep ink, arrowheads, dots and dashes at their printed size.
  return layers.map(layer=>{
    const sizeScale=layer.fixedSize?(layer.scale??1):(layer.scale??1)*scale;
    return {...layer,x:50+((layer.x??0)-50)*scale,y:50+((layer.y??0)-50)*scale+fitShift,scale:sizeScale,width:layer.width/sizeScale,...(layer.dash?{dash:layer.dash.map(length=>length/sizeScale)}:{})};
  });
}
export function junctionDiagramScale(element,placements=[]){
  const offset=junctionOffset(element,placements),layers=junctionLayers(element,placements),bounds=[0,100,0,100];
  const include=(x,y,halfX,halfY)=>{bounds[0]=Math.min(bounds[0],x+offset.x-halfX);bounds[1]=Math.max(bounds[1],x+offset.x+halfX);bounds[2]=Math.min(bounds[2],y+offset.y-halfY);bounds[3]=Math.max(bounds[3],y+offset.y+halfY);};
  for(const layer of layers){
    if(!layer.upright&&layer.path!==landmarkTypes[0].over)continue;
    const marker=layer.path===landmarkTypes[0].over?{x:5.5,y:14.85}:layer.path.startsWith('M 0 -14')?{x:10.5,y:10.5}:layer.path.startsWith('M-10.8')?{x:12,y:12}:{x:10,y:3};
    include(layer.x??50,layer.y??50,marker.x,marker.y);
  }
  return Math.min(1,100/(bounds[1]-bounds[0]),100/(bounds[3]-bounds[2]));
}
export const dotArrowDirections = [0,45,90,135,180,225,270,315];
// Retired picker shapes remain readable in saved routes.
export const dotArrowShapes = [
  ...['bend-left','bend-right'].map(id=>elements.find(element=>element.id===id)),
  {id:'hairpin-left',name:'Hairpin left',route:'M50 84V36Q50 18 32 18T14 36V76',...arrowAt(14,76,90)},
  {id:'hairpin-right',name:'Hairpin right',route:'M50 84V36Q50 18 68 18T86 36V76',...arrowAt(86,76,90)},
  {id:'s-bend-left',name:'S-bend left',route:'M50 84C50 65 26 65 26 48S74 31 74 14',...arrowAt(74,14,270)},
  {id:'s-bend-right',name:'S-bend right',route:'M50 84C50 65 74 65 74 48S26 31 26 14',...arrowAt(26,14,270)},
];
// Keep previously saved shapes, but render only their route, arrow and dot.
export const dotArrowShape = id => dotArrowShapes.find(shape=>shape.id===id)??elements.find(element=>element.id===id);
export function dotArrowLayers(element){
  if(element)return junctionLayers(element).filter(layer=>layer.path===element.route||layer.path===element.arrow||layer.fill);
  return [
    {path:'M50 84V14M42 22L50 14L58 22',width:4,color:lineColor,cap:'round'},
    {path:'M44 84a6 6 0 1 0 12 0a6 6 0 1 0-12 0',width:0,color:lineColor,fill:lineColor},
  ];
}
export function eyesLayers(rotation=0){
  const angle=rotation*Math.PI/180;
  return [
    {path:'M17 50a15 22 0 1 0 30 0a15 22 0 1 0-30 0M53 50a15 22 0 1 0 30 0a15 22 0 1 0-30 0',width:3,color:lineColor,fill:'#fff',cap:'round'},
    {path:'M26 50a6 6 0 1 0 12 0a6 6 0 1 0-12 0M62 50a6 6 0 1 0 12 0a6 6 0 1 0-12 0',x:Number((Math.sin(angle)*7).toFixed(2)),y:Number((-Math.cos(angle)*12).toFixed(2)),width:0,color:lineColor,fill:lineColor},
  ];
}
export function compassLayers(bearing=0){
  const tip=point(bearing-90,28),tail=point(bearing+90,13),base=point(bearing-90,20),normal=bearing*Math.PI/180;
  const left={x:Number((base.x+Math.cos(normal)*5).toFixed(2)),y:Number((base.y+Math.sin(normal)*5).toFixed(2))};
  const right={x:Number((base.x-Math.cos(normal)*5).toFixed(2)),y:Number((base.y-Math.sin(normal)*5).toFixed(2))};
  return [
    {path:'M50 13A37 37 0 1 1 49.99 13',width:3,color:lineColor,cap:'round'},
    {path:'M50 13V20M87 50H80M50 87V80M13 50H20',width:3,color:lineColor,cap:'butt'},
    {path:'M46 8V1L54 8V1',width:2.5,color:lineColor,cap:'round'},
    {path:`M${tail.x} ${tail.y}L${tip.x} ${tip.y}`,width:4,color:lineColor,cap:'round'},
    {path:`M${left.x} ${left.y}L${tip.x} ${tip.y}L${right.x} ${right.y}`,width:4,color:lineColor,cap:'round'},
  ];
}
export function clockLayers(){
  const ticks=Array.from({length:12},(_,index)=>{
    const angle=(index*30-90)*Math.PI/180, inner=index%3===0?37:39;
    return `M${(50+Math.cos(angle)*inner).toFixed(2)} ${(50+Math.sin(angle)*inner).toFixed(2)}L${(50+Math.cos(angle)*44).toFixed(2)} ${(50+Math.sin(angle)*44).toFixed(2)}`;
  }).join('');
  return [
    {path:'M50 6A44 44 0 1 1 49.99 6',width:2.5,color:lineColor},
    {path:ticks,width:2,color:lineColor},
    {path:'M47 50a3 3 0 1 0 6 0a3 3 0 1 0-6 0',width:0,color:lineColor,fill:lineColor},
  ];
}
export const rotateStep = (step,degrees) => {step.rotation=((step.rotation??0)+degrees+360)%360;};
export const blankRoute = () => ({title:'',start:'',finish:'',includeTechniqueExplanation:false,includeCredits:true,steps:[]});
export const stepsPerPage = 15;
export const quizLetter = index => String.fromCharCode(65+index);
export function stepNumbers(route){
  let number=0;
  return route.steps.map(step=>['input','photo'].includes(step.technique)&&step.numbered===false?null:++number);
}
const quizHeight = step => 9+Math.ceil(step.answers.length/2)*6+(step.note.trim()?6:0);
const stepColumns = step => step.technique==='photo'?(step.columns??1):1;
// Scale the original 54 by 25 mm photo area with the selected column width.
const photoHeight = step => 15+25*(stepColumns(step)*62-8)/54;
export const junctionCardHeight = step => {
  const element=elements.find(element=>element.id===step.element),hasNote=step.note.trim()!=='',baseScale=hasNote?.28:.36;
  const margin=4,diagramHeight=100*baseScale/junctionDiagramScale(element,step.landmarks);
  return Math.max(hasNote?46:44,margin*2+diagramHeight);
};
export function routePages(route){
  const pages=[[]];let used=0;
  for(let start=0;start<route.steps.length;){
    const steps=[];let columns=0;
    for(let index=start;index<route.steps.length;index++){
      const step=route.steps[index];
      if(columns+stepColumns(step)>3)break;
      steps.push(step);columns+=stepColumns(step);
    }
    // ponytail: reserve maximum card heights; measure rows if denser quiz pages are needed.
    const height=Math.max(40,...steps.map(step=>step.technique==='photo'?photoHeight(step)+2:step.technique==='quiz'?quizHeight(step)+2:(!step.technique||step.technique==='junction')?junctionCardHeight(step):0));
    if(pages.at(-1).length&&(used+height>218||pages.at(-1).length===stepsPerPage/3)){pages.push([]);used=0;}
    pages.at(-1).push({start,steps});used+=height;start+=steps.length;
  }
  return pages;
}
export const pageCount = route => routePages(route).length;
export function routeTechniques(route){
  return [...new Set(route.steps.map(step=>step.technique??'junction').filter(technique=>technique!=='input'))];
}
export const documentPageCount = route => pageCount(route)+(route.includeTechniqueExplanation&&routeTechniques(route).length?1:0);
export const serializeRoute = route => JSON.stringify({format:'hike-generator-route',version:1,route:validateRoute(route)},null,2);
const photoImageCache=new Map();
const photoPattern=/^data:image\/(?:png|jpeg);base64,[A-Za-z0-9+/]+={0,2}$/;
export function preloadPhotos(route){
  const sources=[...new Set(route.steps.filter(step=>step.technique==='photo').map(step=>step.image))];
  if(typeof Image==='undefined')return Promise.resolve();
  return Promise.all(sources.map(source=>{
    if(photoImageCache.has(source))return photoImageCache.get(source);
    return new Promise(resolve=>{const image=new Image();image.onload=()=>resolve(image);image.onerror=()=>resolve(null);image.src=source;photoImageCache.set(source,image);});
  }));
}
function drawPhoto(ctx,source,x,y,width,height,label='Photo'){
  const image=photoImageCache.get(source);
  if(image?.complete&&image.naturalWidth){
    const scale=Math.min(width/image.naturalWidth,height/image.naturalHeight),drawWidth=image.naturalWidth*scale,drawHeight=image.naturalHeight*scale;
    ctx.drawImage(image,x+(width-drawWidth)/2,y+(height-drawHeight)/2,drawWidth,drawHeight);return;
  }
  ctx.strokeStyle='#000000';ctx.lineWidth=.5;ctx.strokeRect(x,y,width,height);ctx.fillStyle='#000000';ctx.font='700 3px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';fillCanvasText(ctx,label,x+width/2,y+height/2);ctx.textAlign='left';ctx.textBaseline='top';
}
export function parseRoute(text){
  if(typeof text!=='string'||text.length>1_000_000)throw Error('Invalid route file.');
  const value=JSON.parse(text);
  if(value&&typeof value==='object'&&'format' in value){
    if(value.format!=='hike-generator-route'||value.version!==1)throw Error('Unsupported route file.');
    return validateRoute(value.route);
  }
  return validateRoute(value);
}
export function validateRoute(value){
  if(!value || typeof value!=='object') throw Error('Invalid route.');
  for(const [key,max] of [['title',80],['start',100],['finish',100]]) if(typeof value[key]!=='string'||value[key].length>max) throw Error(`Invalid ${key}.`);
  const includeTechniqueExplanation=value.includeTechniqueExplanation??false;
  const includeCredits=value.includeCredits??true;
  if(typeof includeTechniqueExplanation!=='boolean'||typeof includeCredits!=='boolean')throw Error('Invalid PDF options.');
  if(!Array.isArray(value.steps)||value.steps.length>300) throw Error('A route can contain up to 300 steps.');
  const steps=value.steps.map(step=>{
    if(!step || typeof step.note!=='string' || step.note.length>160 || typeof step.distance!=='string' || (step.distance!==''&&!/^\d{1,6}$/.test(step.distance))) throw Error('Invalid route instruction.');
    if(step.technique==='compass'){
      if(!Number.isInteger(step.bearing)||step.bearing<0||step.bearing>359)throw Error('Choose a bearing from 0 to 359 degrees.');
      return {technique:'compass',bearing:step.bearing,note:step.note,distance:step.distance};
    }
    if(step.technique==='fraction'){
      if(!Number.isInteger(step.numerator)||!Number.isInteger(step.denominator)||step.numerator<1||step.denominator<2||step.denominator>99||step.numerator>step.denominator)throw Error('Choose a valid fraction.');
      return {technique:'fraction',numerator:step.numerator,denominator:step.denominator,note:step.note,distance:step.distance};
    }
    if(step.technique==='clock'){
      if(typeof step.time!=='string'||!/^([01]\d|2[0-3]):[0-5]\d$/.test(step.time))throw Error('Choose a time in 24-hour format.');
      return {technique:'clock',time:step.time,note:step.note,distance:step.distance};
    }
    if(step.technique==='quiz'){
      if(typeof step.question!=='string'||step.question.length>160||!Array.isArray(step.answers)||step.answers.length<2||step.answers.length>6||Array.from(step.answers).some(answer=>typeof answer!=='string'||answer.length>80))throw Error('Enter a question and 2 to 6 answers.');
      return {technique:'quiz',question:step.question,answers:[...step.answers],note:step.note,distance:step.distance};
    }
    const numbered=step.numbered===undefined?true:step.numbered;
    if(['input','photo'].includes(step.technique)&&typeof numbered!=='boolean')throw Error('Invalid step numbering option.');
    if(step.technique==='input'){
      const value=step.value===undefined?'':step.value;
      if(typeof value!=='string'||value.length>160)throw Error('Invalid input.');
      return {technique:'input',value,numbered,note:step.note,distance:step.distance};
    }
    if(step.technique==='photo'){
      if(typeof step.image!=='string'||!photoPattern.test(step.image))throw Error('Choose a PNG or JPG photo.');
      const columns=step.columns===undefined?1:step.columns;
      if(![1,2,3].includes(columns))throw Error('Choose a photo width of 1, 2 or 3 columns.');
      return {technique:'photo',image:step.image,columns,numbered,note:step.note,distance:step.distance};
    }
    if(step.technique!==undefined&&!['junction','dot-arrow','eyes'].includes(step.technique))throw Error('Invalid route technique.');
    const rotation=step.rotation===undefined?0:step.rotation;
    if(!dotArrowDirections.includes(rotation))throw Error('Invalid intersection rotation.');
    if(step.technique==='eyes')return {technique:'eyes',rotation,note:step.note,distance:step.distance};
    if(step.technique==='dot-arrow'){
      if(step.element!==undefined&&!dotArrowShape(step.element))throw Error('Invalid dot-and-arrow shape.');
      return {technique:'dot-arrow',rotation,note:step.note,distance:step.distance,...(step.element===undefined?{}:{element:step.element})};
    }
    if(!elements.some(e=>e.id===step.element))throw Error('Invalid route instruction.');
    const element=elements.find(element=>element.id===step.element),arms=roadArms(element);
    const savedLandmarks=step.landmarks===undefined?[]:step.landmarks;
    if(!Array.isArray(savedLandmarks))throw Error('Choose valid landmarks.');
    const migratedFaintArms=savedLandmarks.filter(landmark=>landmark?.type==='faint-path').map(landmark=>landmark.arm);
    const savedFaintArms=step.faintArms===undefined?[]:step.faintArms;
    if(!Array.isArray(savedFaintArms)||new Set(savedFaintArms).size!==savedFaintArms.length)throw Error('Choose valid road arms for faint paths.');
    const faintArms=[...new Set([...savedFaintArms,...migratedFaintArms])];
    if(faintArms.length>arms.length||!faintArms.every(id=>arms.some(arm=>arm.id===id)))throw Error('Choose valid road arms for faint paths.');
    let landmarks=savedLandmarks.filter(landmark=>!['steps','faint-path','gate','railway','bench'].includes(landmark?.type));
    if(element.id==='straight'&&landmarks.every(p=>p&&arms.some(arm=>arm.id===p.arm))&&new Set(landmarks.map(p=>sidedLandmarkTypes.includes(p.type)?p.side??'right':'road')).size===landmarks.length)landmarks=landmarks.map(p=>({...p,arm:'centre'}));
    const placementArms=landmarkArms(element,landmarks);
    if(landmarks.length>placementArms.length*3)throw Error('Use one landmark per road position.');
    const occupied=new Set();
    const placements=landmarks.map(landmark=>{
      if(!landmark||!landmarkTypes.some(type=>type.id===landmark.type)||!placementArms.some(arm=>arm.id===landmark.arm))throw Error('Choose an available road position for each landmark.');
      const side=sidedLandmarkTypes.includes(landmark.type)?(landmark.side??'right'):undefined;
      if(side&&!['left','right'].includes(side))throw Error('Choose a side of the road for this element.');
      const slot=`${landmark.arm}:${side??'road'}`;
      if(occupied.has(slot))throw Error('Choose an available road position for each landmark.');
      occupied.add(slot);return side?{type:landmark.type,arm:landmark.arm,side}:{type:landmark.type,arm:landmark.arm};
    });
    return {element:step.element,note:step.note,distance:step.distance,rotation,faintArms,landmarks:placements};
  });
  return {title:value.title,start:value.start,finish:value.finish,includeTechniqueExplanation,includeCredits:true,steps};
}
function wrap(ctx,text,width){
  const lines=[];
  for(const paragraph of String(text).split('\n')){
    let line='';
    for(const word of paragraph.split(/\s+/)){
      const next=line?`${line} ${word}`:word;
      if(ctx.measureText(next).width<=width){line=next;continue;}
      if(line){lines.push(line);line='';}
      for(const char of word){if(line&&ctx.measureText(line+char).width>width){lines.push(line);line='';}line+=char;}
    }
    lines.push(line);
  }
  return lines;
}
function fillCanvasText(ctx,value,x,y){
  if(!ctx.setTransform||!ctx.canvas?.width){ctx.fillText(value,x,y);return;}
  const scale=ctx.canvas.width/210,font=ctx.font.replace(/(\d+(?:\.\d+)?)px/g,(_,size)=>`${Number(size)*scale}px`);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.font=font;ctx.fillText(value,x*scale,y*scale);ctx.restore();
}
function drawLayers(ctx,Path,layers,rotation=0){
  for(const layer of layers){
    ctx.save();ctx.translate(layer.x??0,layer.y??0);ctx.rotate(layerRotation(layer,rotation)*Math.PI/180);ctx.scale(layer.scale??1,(layer.scale??1)*(layer.scaleY??1));
    ctx.lineWidth=layer.width;ctx.strokeStyle=layer.color==='#fff'?'#fff':'#000000';ctx.fillStyle=layer.fill==='#fff'?'#fff':'#000000';ctx.lineCap=layer.cap;ctx.setLineDash(layer.dash??[]);
    const path=new Path(layer.path);if(layer.fill)ctx.fill(path,layer.fillRule??'nonzero');if(layer.width)ctx.stroke(path);ctx.restore();
  }
}
export function drawTechniqueGuide(canvas,route,scale=3,Path=Path2D,language='en'){
  canvas.width=210*scale;canvas.height=297*scale;
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,210,297);ctx.textBaseline='top';ctx.lineCap='round';ctx.lineJoin='round';
  function text(value,x,y,size=3.5,weight=400,color='#000000',width=118,maxLines=8){ctx.fillStyle='#000000';ctx.font=`${weight} ${size}px Arial, sans-serif`;wrap(ctx,value,width).slice(0,maxLines).forEach((line,i)=>fillCanvasText(ctx,line,x,y+i*size*1.35));}
  text(translate(language,'guide.title'),14,13,7,700,'#000000',182,2);
  const techniques=routeTechniques(route),stride=Math.min(70,240/techniques.length),height=stride-10;
  techniques.forEach((technique,index)=>{
    const y=37+index*stride,step=route.steps.find(item=>(item.technique??'junction')===technique);
    ctx.strokeStyle='#000000';ctx.lineWidth=.25;ctx.strokeRect(14,y,182,height);
    ctx.save();
    if(technique==='fraction'||technique==='quiz'){ctx.fillStyle='#000000';ctx.font='700 12px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';fillCanvasText(ctx,technique==='quiz'?'A B C':`${step.numerator}/${step.denominator}`,40,y+height/2);}
    else if(technique==='photo'){const photoSize=Math.min(36,height-4);drawPhoto(ctx,step.image,40-photoSize/2,y+height/2-photoSize/2,photoSize,photoSize);}
    else if(technique==='input'){ctx.strokeStyle='#000000';ctx.lineWidth=1;ctx.strokeRect(22,y+height/2-6,36,12);ctx.fillStyle='#000000';ctx.font='700 8px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';fillCanvasText(ctx,'Aa',40,y+height/2);}
    else{
      const size=Math.min(44,height-4);ctx.translate(40-size/2,y+(height-size)/2);ctx.scale(size/100,size/100);
      if(technique==='junction'||technique==='dot-arrow'){const element=technique==='dot-arrow'?dotArrowShape(step.element):elements.find(element=>element.id===step.element),offset=technique==='junction'?junctionOffset(element,step.landmarks):{x:0,y:0};ctx.translate(50,50);ctx.rotate((step.rotation??0)*Math.PI/180);ctx.translate(-50+offset.x,-50+offset.y);drawLayers(ctx,Path,technique==='dot-arrow'?dotArrowLayers(element):junctionLayers(element,step.landmarks,step.faintArms),step.rotation??0);}
      else drawLayers(ctx,Path,technique==='eyes'?eyesLayers(step.rotation):technique==='compass'?compassLayers(step.bearing):clockLayers());
    }
    ctx.restore();ctx.textAlign='left';ctx.textBaseline='top';
    text(translate(language,`technique.${technique}`),70,y+4,4,700,'#000000',112,1);
    text(translate(language,`guide.${technique}`),70,y+11,3.1,400,'#000000',112,7);
  });
  ctx.strokeStyle='#000000';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(14,281);ctx.lineTo(196,281);ctx.stroke();
  if(route.includeCredits)text(translate(language,'pdf.credits'),14,285,2.7,400,'#000000',140,1);
  text(translate(language,'pdf.page',{page:1,pages:documentPageCount(route)}),175,285,2.7,700,'#000000',21,1);
  return canvas;
}
// The same drawing renders the preview and the 305 dpi PDF: no second layout to drift.
export function drawSheet(canvas,route,pageIndex,scale=3,Path=Path2D,language='en'){
  canvas.width=210*scale;canvas.height=297*scale;
  const ctx=canvas.getContext('2d');ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.fillRect(0,0,210,297);
  ctx.textBaseline='top';ctx.lineCap='round';ctx.lineJoin='round';
  function text(value,x,y,size=3.5,weight=400,color='#000000',width=182,maxLines=100,minSize=2.5){
    ctx.fillStyle='#000000';ctx.font=`${weight} ${size}px Arial, sans-serif`;
    let lines=wrap(ctx,value,width);
    while(lines.length>maxLines&&size>minSize){size-=.2;ctx.font=`${weight} ${size}px Arial, sans-serif`;lines=wrap(ctx,value,width);}
    lines=lines.slice(0,maxLines);
    lines.forEach((line,i)=>fillCanvasText(ctx,line,x,y+i*size*1.35));
  }
  function rule(x,y,w,color='#000000'){ctx.strokeStyle='#000000';ctx.lineWidth=.25;ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+w,y);ctx.stroke();}
  function endpoint(label,note,y){const top=ctx.textBaseline,baseline=y+3.4;ctx.textBaseline='alphabetic';text(label,14,baseline,2.8,700);if(note.trim())text(note.replace(/\s+/g,' '),26,baseline,3.4,400,'#000000',170,2);ctx.textBaseline=top;}
  const title=route.title.replace(/\s+/g,' ').trim(),startY=title?28:13;
  if(title)text(title,14,13,7,700,'#000000',182,2);
  if(pageIndex===0)endpoint(translate(language,'start'),route.start,startY);
  const numbers=stepNumbers(route);
  let y=pageIndex===0?startY+13:title?34:13;
  for(const {start,steps} of routePages(route)[pageIndex]){
    const cards=steps.map(step=>{
      const note=step.note.replace(/\s+/g,' ').trim();
      ctx.font='400 2px Arial, sans-serif';
      const lines=note?Math.min(wrap(ctx,note,52).length,4):0;
      const junction=!step.technique||step.technique==='junction';
      return {step,note,lines,height:step.technique==='photo'?photoHeight(step):step.technique==='quiz'?quizHeight(step):junction?junctionCardHeight(step):lines?25.5+lines*2.7:25};
    });
    let column=0;
    cards.forEach(({step,note,lines,height},index)=>{
      const number=numbers[start+index];
      const quiz=step.technique==='quiz',input=step.technique==='input',photo=step.technique==='photo',compass=step.technique==='compass',clock=step.technique==='clock',fraction=step.technique==='fraction',dotArrow=step.technique==='dot-arrow',eyes=step.technique==='eyes',junction=!step.technique||step.technique==='junction',e=quiz||input||photo||compass||clock||fraction||eyes?null:dotArrow?dotArrowShape(step.element):elements.find(e=>e.id===step.element),x=14+column*62,width=stepColumns(step)*62-4;
      column+=stepColumns(step);
      ctx.strokeStyle='#000000';ctx.lineWidth=.25;ctx.strokeRect(x,y,width,height);
      if(quiz){
        const title=`${number}. ${step.question.replace(/\s+/g,' ').trim()}${step.distance?` · ${step.distance} m`:''}`;
        text(title,x+2,y+2,2.6,700,'#000000',54,4,.8);
        step.answers.forEach((answer,index)=>text(`${quizLetter(index)}. ${answer.replace(/\s+/g,' ').trim()}`,x+2+(index%2)*27,y+10+Math.floor(index/2)*6,1.8,400,'#000000',25,4,.5));
        if(note)text(note,x+2,y+height-4,2,400,'#000000',54,2,.5);
        return;
      }
      if(input){
        text(`${number===null?'':`${number}. `}${step.value.trim()}`,x+2,y+2,2.6,700,'#000000',54,4,.8);
        if(note)text(note,x+2,y+height-4,2,400,'#000000',54,2,.5);
        return;
      }
      if(number!==null)text(`${number}.`,x+2,y+2,3.3,700);
      if(compass)text(`${step.bearing}°`,x+40,y+2,2.8,700,'#000000',16);
      else if(clock)text(step.time,x+40,y+2,2.8,700,'#000000',16);
      else if(step.distance!=='')text(`${step.distance} m`,x+width-20,y+2,2.6,400,'#000000',18);
      if(photo){
        drawPhoto(ctx,step.image,x+2,y+7,width-4,height-15);
        if(note)text(note,x+2,y+height-4,2,400,'#000000',width-4,2,.5);
        return;
      }
      ctx.save();
      if(fraction){ctx.fillStyle='#000000';ctx.font='700 8px Arial, sans-serif';ctx.textAlign='center';ctx.textBaseline='middle';fillCanvasText(ctx,`${step.numerator}/${step.denominator}`,x+29,y+12.5);}
      else{
        const diagramScale=junction?(note ? .28 : .36):.21;
        ctx.translate(x+29-diagramScale*50,y+(height-diagramScale*100)/2);ctx.scale(diagramScale,diagramScale);
        if(!compass&&!clock&&!eyes){const offset=junction?junctionOffset(e,step.landmarks):{x:0,y:0};ctx.translate(50,50);ctx.rotate((step.rotation??0)*Math.PI/180);ctx.translate(-50+offset.x,-50+offset.y);}
        drawLayers(ctx,Path,compass?compassLayers(step.bearing):clock?clockLayers():eyes?eyesLayers(step.rotation):dotArrow?dotArrowLayers(e):junctionLayers(e,step.landmarks,step.faintArms),step.rotation??0);
      }
      ctx.restore();
      if(note)text(note,x+2,y+(junction?height-(lines?(lines-1)*2.7+4:4):24.2),2,400,'#000000',54,4);
    });
    y+=Math.max(...cards.map(card=>card.height))+2;
  }
  if(pageIndex===pageCount(route)-1)endpoint(translate(language,'finish'),route.finish,Math.min(y+2,267));
  const pageOffset=route.includeTechniqueExplanation&&routeTechniques(route).length?1:0;
  rule(14,281,182);if(route.includeCredits)text(translate(language,'pdf.credits'),14,285,2.7,400,'#000000',140,1);text(translate(language,'pdf.page',{page:pageIndex+1+pageOffset,pages:documentPageCount(route)}),175,285,2.7,700,'#000000',21,1);
  return canvas;
}
export async function createPDF(route,makeCanvas=()=>document.createElement('canvas'),Path=Path2D,language='en'){
  route=validateRoute(route);
  if(!route.steps.length) throw Error(translate(language,'pdf.noSteps'));
  if(route.steps.some(step=>step.technique==='quiz'&&(!step.question.trim()||step.answers.some(answer=>!answer.trim()))))throw Error(translate(language,'quiz.required'));
  await preloadPhotos(route);
  const {PDFDocument}=await import('./vendor/pdf-lib.js');
  const pdf=await PDFDocument.create();if(route.title.trim())pdf.setTitle(route.title.trim());pdf.setCreator('hike-generator');
  async function addCanvas(canvas){const image=await pdf.embedPng(canvas.toDataURL('image/png'));pdf.addPage([595.27559,841.88976]).drawImage(image,{x:0,y:0,width:595.27559,height:841.88976});canvas.width=canvas.height=0;}
  if(route.includeTechniqueExplanation&&routeTechniques(route).length)await addCanvas(drawTechniqueGuide(makeCanvas(),route,12,Path,language));
  for(let i=0;i<pageCount(route);i++){
    await addCanvas(drawSheet(makeCanvas(),route,i,12,Path,language));
  }
  return pdf.save();
}
