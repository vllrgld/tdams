import assert from 'node:assert/strict';
import { writeFile } from 'node:fs/promises';

const target = await fetch('http://127.0.0.1:9337/json/new?about:blank', {method:'PUT'}).then(r=>r.json());
const socket = new WebSocket(target.webSocketDebuggerUrl);
await new Promise((resolve,reject)=>{socket.addEventListener('open',resolve,{once:true});socket.addEventListener('error',reject,{once:true});});
let sequence=0;
const pending=new Map();
const errors=[];
socket.addEventListener('message',event=>{
 const message=JSON.parse(event.data);
 if(message.method==='Runtime.exceptionThrown') errors.push(message.params.exceptionDetails.exception?.description || message.params.exceptionDetails.text);
 if(!message.id) return;
 const request=pending.get(message.id);if(!request)return;
 pending.delete(message.id);clearTimeout(request.timeout);
 message.error?request.reject(new Error(JSON.stringify(message.error))):request.resolve(message.result);
});
function call(method,params={}) {const id=++sequence;return new Promise((resolve,reject)=>{const timeout=setTimeout(()=>{pending.delete(id);reject(new Error(`CDP timeout: ${method}`));},30000);pending.set(id,{resolve,reject,timeout});socket.send(JSON.stringify({id,method,params}));});}
async function evaluate(expression){const result=await call('Runtime.evaluate',{expression,returnByValue:true,awaitPromise:true});if(result.exceptionDetails)throw new Error(JSON.stringify(result.exceptionDetails));return result.result.value;}
const settle=async(ms=1000)=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(expression,timeout=90000){const end=Date.now()+timeout;while(Date.now()<end){if(await evaluate(expression))return;await settle(300);}throw new Error(`Timed out: ${expression}; ${await evaluate('document.body.innerText')}`);}
async function capture(name){if(process.env.ARCHIVE_REVIEW_CAPTURE_DISABLED)return;const viewport=await evaluate('Boolean(document.querySelector("canvas, [data-archive-drawer-controls], [role=dialog]"))');const result=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:!viewport});await writeFile(new URL(`./${name}.png`,import.meta.url),Buffer.from(result.data,'base64'));console.log(`Captured ${name}`);}
const click=selector=>evaluate(`document.querySelector(${JSON.stringify(selector)}).click()`);
const untilSelector=(selector,exists=true)=>until(`document.querySelector(${JSON.stringify(selector)}) ${exists?'!==':'==='} null`);
const card=(index)=>`document.getElementById('cabinet-review-cabinet-${index}')`;
const drawer=(index,number)=>`${card(index)}.querySelector('[aria-label="Drawers in ${index ? 'Land records cabinet' : 'Tax declaration cabinet'}"]').querySelectorAll('button')[${number}]`;
async function openDrawer(index,number=0){await evaluate(`${drawer(index,number)}.click()`);await settle(600);await evaluate(`[...${card(index)}.querySelectorAll('button')].find(button=>button.textContent.includes('View inside')).click()`);await until('document.querySelectorAll("[data-procedural-filing-item]").length === 16 || document.querySelector("[data-procedural-drawer-view]")?.textContent.includes("This drawer is empty.")');await settle(900);}
async function closeDrawer(){await click('[aria-label="Back to cabinet"]');await untilSelector('[data-procedural-drawer-view]',false);await settle(400);}
async function switchView(value,zoomed=false){await evaluate(`[...document.querySelector('${zoomed?'[data-archive-drawer-controls]':'section[aria-label="Archive cabinets"]'}').querySelectorAll('button')].find(button=>button.textContent === '${value}').click()`);await settle(1200);}
review: try {
 await call('Page.enable');await call('Runtime.enable');
 if(process.env.ARCHIVE_REVIEW_STARTUP_ONLY) await call('Page.addScriptToEvaluateOnNewDocument',{source:`(()=>{window.cabinetStartup=[];const seen=new WeakSet();const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){const context=original.call(this,type,...args);if(type==='webgl2'&&context&&!seen.has(context)){seen.add(context);const entry={canvas:this,created:performance.now(),firstDraw:null};window.cabinetStartup.push(entry);for(const name of['drawElements','drawArrays']){const draw=context[name];context[name]=function(...values){entry.firstDraw??=performance.now();return draw.apply(this,values);};}}return context;};})()`});
 await call('Page.bringToFront');
 await call('Emulation.setFocusEmulationEnabled',{enabled:true});
 await call('Emulation.setDeviceMetricsOverride',{width:process.env.ARCHIVE_REVIEW_SCROLL_ONLY?390:1440,height:process.env.ARCHIVE_REVIEW_SCROLL_ONLY?844:1000,deviceScaleFactor:1,mobile:Boolean(process.env.ARCHIVE_REVIEW_SCROLL_ONLY)});
 await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:process.env.ARCHIVE_REVIEW_PERF_ONLY||process.env.ARCHIVE_REVIEW_NORMAL_MOTION?'no-preference':'reduce'}]});
 await call('Page.navigate',{url:process.env.ARCHIVE_REVIEW_PLACEMENT_ONLY?'http://127.0.0.1:5174/procedural-cabinet.html':process.env.ARCHIVE_REVIEW_COLOR_ONLY?'http://127.0.0.1:5174/procedural-archive.html?color=warm_ivory':process.env.ARCHIVE_REVIEW_SCROLL_ONLY?'http://127.0.0.1:5174/procedural-archive.html?count=6':process.env.ARCHIVE_REVIEW_LEVER_ONLY?'http://127.0.0.1:5174/lever-arch.html?mode=preview':process.env.ARCHIVE_REVIEW_CACHE_LEVER?'http://127.0.0.1:5174/lever-arch.html':'http://127.0.0.1:5174/procedural-archive.html'});
 await until('document.documentElement.dataset.reviewReady === "true" && document.querySelector("canvas") !== null');await settle(5000);
 await until('Array.from(window.reviewRoots.values()).every(root=>root.store.getState().gl.info.render.calls > 0)');
 console.log(JSON.stringify(await evaluate(`Array.from(window.reviewRoots.values()).map(root=>{const state=root.store.getState(); const model=state.scene.getObjectByName('procedural-cabinet'); return {size:state.size,zoom:state.camera.zoom,camera:state.camera.position, model:!!model, visible:model?.visible,children:model?.children.filter(child=>child.visible).length,frames:state.internal.frames,active:state.internal.active};})`)));
 assert.deepEqual(await evaluate('window.reviewErrors'),[]);
 if(process.env.ARCHIVE_REVIEW_PLACEMENT_ONLY) {
  const state=`(()=>{const s=Array.from(window.reviewRoots.values())[0].store.getState();const root=s.scene.getObjectByName('procedural-cabinet');const outlines=[];root.traverse(o=>{if(o.name==='selected-drawer-outline'&&o.visible)outlines.push(o.name);});return{outlines,open:root.getObjectByName('drawer-drawer-1').position.z};})()`;
  await until(`(${state}).open>0`);assert.deepEqual((await evaluate(state)).outlines,[]);
  await capture('archive-placement-no-highlight-desktop');
  await click('[aria-label="Rotate cabinet left"]');await settle(1500);assert.deepEqual((await evaluate(state)).outlines,[]);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1000);await capture('archive-placement-no-highlight-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: selected archive-location drawer stays open without a blue outline; rotation and desktop/mobile layout preserved.');break review;
 }
 if(process.env.ARCHIVE_REVIEW_LOCK_ONLY) {
  await capture('cabinet-lock-desktop');
  const detail=await call('Page.captureScreenshot',{format:'png',clip:{x:280,y:315,width:100,height:85,scale:4}});
  await writeFile(new URL('./cabinet-lock-detail.png',import.meta.url),Buffer.from(detail.data,'base64'));
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: rendered cabinet header and keyhole detail without browser errors.');break review;
 }
 if(process.env.ARCHIVE_REVIEW_COLOR_ONLY) {
  const paints = `Array.from(window.reviewRoots.values()).map(root=>{const s=root.store.getState();const colors={};s.scene.traverse(part=>{if(part.isMesh&&!Array.isArray(part.material)&&part.material.name.startsWith('cabinet-'))colors[part.material.name]=part.material.color.getHexString();});return{id:s.gl.domElement.closest('[id^="cabinet-"]')?.id,drawer:!!s.gl.domElement.closest('[data-procedural-drawer-view]'),connected:s.gl.domElement.isConnected,colors};}).filter(s=>s.connected)`;
  await until(`(${paints}).filter(s=>s.colors['cabinet-front-paint']).length===2`);
  const initial=await evaluate(paints);
  assert.equal(initial.find(s=>s.id==='cabinet-review-cabinet-0').colors['cabinet-front-paint'],'d8ceb7');
  assert.equal(initial.find(s=>s.id==='cabinet-review-cabinet-1').colors['cabinet-front-paint'],'b4bbbf');
  assert.equal(await evaluate('document.querySelectorAll("[data-css-cabinet-body]").length'),0);
  await capture('cabinet-colors-desktop');
  await openDrawer(0);await until(`(${paints}).find(s=>s.drawer)?.colors['cabinet-front-paint']==='d8ceb7'`);await capture('cabinet-colors-drawer');await closeDrawer();
  await switchView('Current view');await untilSelector('[data-css-cabinet-body]');
  const css=await evaluate('Array.from(document.querySelectorAll(".cabinet-vector-front")).map(node=>getComputedStyle(node).backgroundColor)');
  assert.equal(css.length,8);assert.deepEqual(css.slice(0,4),css.slice(4));
  await call('Page.navigate',{url:'http://127.0.0.1:5174/procedural-archive.html?manage=1'});
  await until('document.documentElement.dataset.reviewReady==="true"&&document.querySelector("main h1")?.textContent==="Cabinets"');
  await evaluate('Array.from(document.querySelectorAll("button")).find(b=>b.textContent.includes("Add cabinet")).click()');
  await untilSelector('[role="dialog"] canvas');await until(`(${paints}).some(s=>s.colors['cabinet-front-paint']==='b4bbbf')`);
  await click('input[value="warm_ivory"]');await until(`(${paints}).some(s=>s.colors['cabinet-front-paint']==='d8ceb7')`);
  assert.equal(await evaluate('document.querySelector("input[value=warm_ivory]").checked'),true);
  assert.equal(await evaluate('document.querySelectorAll("[data-css-cabinet-body]").length'),0);
  await capture('cabinet-color-picker-desktop');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1200);await capture('cabinet-color-picker-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate('document.documentElement.classList.add("dark")');await settle(500);await capture('cabinet-color-picker-dark');
  await click('input[value="steel_grey"]');await until(`(${paints}).some(s=>s.colors['cabinet-front-paint']==='b4bbbf')`);
  await evaluate('Array.from(document.querySelector("[role=dialog]").querySelectorAll("button")).find(b=>b.textContent==="Cancel").click()');await untilSelector('[role="dialog"]',false);
  await until('Array.from(window.reviewRoots.values()).every(r=>!r.store.getState().gl.domElement.isConnected)');
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: separate 3D finishes; matching zoomed drawer; CSS unchanged; live colour picker; desktop/mobile/dark layout; preview cleanup.');break review;
 }
 if(process.env.ARCHIVE_REVIEW_SCROLL_ONLY) {
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('window.scrollTo(0,0)');await settle(1600);
  await until(`${card(0)}.querySelector('canvas')!==null`);
  await evaluate(`${card(0)}.querySelector('[aria-label="Rotate cabinet left"]').click();${drawer(0,0)}.click();undefined`);await settle(1200);
  await until(`(()=>{const canvas=${card(0)}.querySelector('canvas');const state=window.reviewRoots.get(canvas)?.store.getState();return state&&state.internal.frames===0&&Math.abs(state.scene.getObjectByName('procedural-cabinet').rotation.y+Math.PI/6)<0.001&&state.scene.getObjectByName('drawer-review-drawer-0-0').position.z>0;})()`,45000);
  await evaluate(`(()=>{const canvas=${card(0)}.querySelector('canvas');const state=window.reviewRoots.get(canvas).store.getState();window.scrollFirst={canvas,renderer:state.gl,rotation:state.scene.getObjectByName('procedural-cabinet').rotation.y,drawer:state.scene.getObjectByName('drawer-review-drawer-0-0').position.z};})()`);
  await capture('cabinet-scroll-before');
  assert.equal(await evaluate(`${card(1)}.querySelector('canvas')!==null`),true);
  assert.equal(await evaluate(`${card(5)}.querySelector('canvas')===null`),true);
  await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/cabinet-startup.ts')).name;const {scheduleCabinetStartup}=await import(url);window.scrollCancelRelease=scheduleCabinetStartup(()=>{window.scrollCancelBlocked=true;},100);})()`);await until('window.scrollCancelBlocked===true');
  await evaluate(`${card(3)}.scrollIntoView({block:'center'});undefined`);await settle(600);assert.equal(await evaluate(`${card(3)}.querySelector('canvas')===null`),true);
  await evaluate('window.scrollTo(0,0)');await settle(600);await evaluate('window.scrollCancelRelease();undefined');await settle(1000);
  assert.equal(await evaluate(`${card(3)}.querySelector('canvas')===null`),true);
  await evaluate(`${card(3)}.scrollIntoView({block:'center'});undefined`);await until(`${card(3)}.querySelector('canvas')!==null`);
  await until(`window.reviewRoots.get(window.scrollFirst.canvas)?.store.getState().frameloop==='never'`);
  const frames=await evaluate('window.scrollFirst.renderer.info.render.frame');await settle(500);assert.equal(await evaluate('window.scrollFirst.renderer.info.render.frame'),frames);
  await evaluate('window.scrollTo(0,0)');await settle(1200);
  assert.equal(await evaluate(`${card(0)}.querySelector('canvas')===window.scrollFirst.canvas`),true);
  assert.ok(await evaluate(`Math.abs(window.reviewRoots.get(window.scrollFirst.canvas).store.getState().scene.getObjectByName('procedural-cabinet').rotation.y-window.scrollFirst.rotation)<0.001`));
  await evaluate(`${card(3)}.scrollIntoView({block:'center'});undefined`);await until(`window.reviewRoots.get(window.scrollFirst.canvas)?.store.getState().frameloop==='never'`);
  await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/cabinet-view-cache.ts')).name;const {cabinetViewCache}=await import(url);window.scrollPressure=Array.from({length:12},()=>{const entry=cabinetViewCache.register(()=>{});entry.update(true,true);return entry;});})()`);
  await until(`${card(0)}.querySelector('canvas')===null && ${card(0)}.querySelector('[data-cabinet-snapshot]')?.naturalWidth>0`);
  await until('window.scrollFirst.renderer.getContext().isContextLost()');
  await evaluate(`window.scrollSnapshotUrl=${card(0)}.querySelector('[data-cabinet-snapshot]').src;window.scrollPressure.forEach(entry=>entry.release());undefined`);
  await evaluate(`(async()=>{const url=performance.getEntriesByType('resource').find(e=>e.name.includes('/cabinet-startup.ts')).name;const {scheduleCabinetStartup}=await import(url);window.scrollQueueRelease=scheduleCabinetStartup(()=>{window.scrollQueueBlocked=true;},100);})()`);await until('window.scrollQueueBlocked===true');
  await evaluate('window.scrollTo(0,0)');await settle(800);
  assert.equal(await evaluate(`${card(0)}.querySelector('canvas')===null`),true);
  assert.equal(await evaluate(`getComputedStyle(${card(0)}.querySelector('[data-cabinet-snapshot]')).visibility`),'visible');
  await capture('cabinet-scroll-evicted-preview');
  await evaluate('window.scrollQueueRelease();undefined');await until(`${card(0)}.querySelector('canvas')!==null && getComputedStyle(${card(0)}.querySelector('[data-cabinet-snapshot]')).visibility==='hidden'`,180000);
  const restored=await evaluate(`(()=>{const canvas=${card(0)}.querySelector('canvas');const scene=window.reviewRoots.get(canvas).store.getState().scene;return{recreated:canvas!==window.scrollFirst.canvas,rotation:scene.getObjectByName('procedural-cabinet').rotation.y,drawer:scene.getObjectByName('drawer-review-drawer-0-0').position.z};})()`);
  assert.equal(restored.recreated,true);assert.ok(Math.abs(restored.rotation-await evaluate('window.scrollFirst.rotation'))<0.001);assert.ok(Math.abs(restored.drawer-await evaluate('window.scrollFirst.drawer'))<0.001);
  await capture('cabinet-scroll-restored');
  if(process.env.ARCHIVE_REVIEW_NATIVE_ONLY) {
   assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
   console.log('Passed native normal-motion scrolling: nearby preload; far rows deferred; stale preload cancellation; warm renderer/angle/drawer retention; rendering stops offscreen; bounded eviction/context disposal; saved frame; settled cold restoration.');break review;
  }
  await switchView('Current view');await until('window.reviewRoots.size===0');assert.equal(await evaluate('fetch(window.scrollSnapshotUrl).then(()=>false,()=>true)'),true);
  await switchView('3D model');await until(`${card(0)}.querySelector('canvas')!==null`);await settle(1600);
  await evaluate(`window.scrollZoomCanvas=${card(0)}.querySelector('canvas');[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click();undefined`);await untilSelector('[data-procedural-drawer-view]');await settle(1400);
  await click('[aria-label="Back to cabinet"]');await untilSelector('[data-archive-drawer-controls]',false);await settle(900);
  assert.equal(await evaluate(`${card(0)}.querySelector('canvas')===window.scrollZoomCanvas`),true);
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await evaluate(`${card(3)}.scrollIntoView({block:'center'});undefined`);await settle(2000);await capture('cabinet-scroll-desktop-rows');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: nearby preload; distant lazy load; warm scroll renderer/angle/drawer retention; offscreen frames stop; pressure eviction/context disposal; raster fallback; cold restore; snapshot URL cleanup; CSS switch; zoom return; desktop/mobile rows.');break review;
 }
 if(process.env.ARCHIVE_REVIEW_DRAWER_MOTION_ONLY) {
  const normal=Boolean(process.env.ARCHIVE_REVIEW_NORMAL_MOTION);
  const reopen=async()=>{await evaluate(`[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click()`);await untilSelector('[data-procedural-drawer-view]');};
  const sample=`(()=>{const el=document.querySelector('[data-procedural-drawer-cache]').parentElement;const style=getComputedStyle(el);return{opacity:Number(style.opacity),scale:new DOMMatrixReadOnly(style.transform).a};})()`;
  const pointerClick=async(point)=>{await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});};
  const corner=()=>evaluate(`(()=>{const r=document.querySelector('[data-procedural-drawer-view] canvas').getBoundingClientRect();return{x:r.left+8,y:r.top+8};})()`);
  await evaluate(`(()=>{window.drawerAnimations=[];const animate=Element.prototype.animate;Element.prototype.animate=function(keyframes,options){if(this.firstElementChild?.hasAttribute('data-procedural-drawer-cache')){const values=name=>Array.isArray(keyframes)?keyframes.map(frame=>frame[name]).filter(value=>value!==undefined):keyframes[name];window.drawerAnimations.push({opacity:values('opacity'),transform:values('transform'),duration:options?.duration});}return animate.call(this,keyframes,options);};})()`);
  await openDrawer(0);await settle(900);
  const resting=await evaluate(sample);assert.equal(resting.opacity,1);assert.ok(Math.abs(resting.scale-1)<0.001);
  await evaluate(`window.motionCanvas=document.querySelector('[data-procedural-drawer-view] canvas');undefined`);
  await capture(`drawer-motion-${normal?'normal':'reduced'}-desktop`);
  // The front panel is inside the drawer, and must not dismiss the closeup.
  await pointerClick(await evaluate(`(()=>{const r=document.querySelector('[data-procedural-drawer-view] canvas').getBoundingClientRect();return{x:r.left+r.width/2,y:r.bottom-38};})()`));
  assert.equal(await evaluate(`Boolean(document.querySelector('[data-archive-drawer-controls]'))`),true);
  if(normal) {
   await click('[data-procedural-filing-item="2"]');await untilSelector('[aria-label="Close book"]');
   await pointerClick(await corner());assert.equal(await evaluate(`Boolean(document.querySelector('[aria-label="Close book"]'))`),true);
   await click('[aria-label="Close book"]');await untilSelector('[aria-label="Close book"]',false);await settle(700);
  }
  await pointerClick(await corner());await untilSelector('[data-archive-drawer-controls]',false);await settle(1300);
  assert.equal(await evaluate(`getComputedStyle(window.motionCanvas.closest('[inert]')).visibility`),'hidden');
  assert.equal(await evaluate(`[...window.reviewRoots.values()].find(r=>r.store.getState().gl.domElement===window.motionCanvas).store.getState().frameloop`),'never');
  const entrance=await evaluate(`new Promise(resolve=>{const samples=[];const start=performance.now();[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click();function frame(){samples.push(${sample});if(performance.now()-start<1100)requestAnimationFrame(frame);else resolve({samples,reduced:matchMedia('(prefers-reduced-motion: reduce)').matches});}requestAnimationFrame(frame);})`);
  console.log('Entrance',JSON.stringify(entrance));
  if(normal) {
   assert.equal(entrance.reduced,false);
   const animations=await evaluate('window.drawerAnimations');
   assert.ok(animations.some(a=>a.opacity?.[0]===0&&a.opacity.at(-1)===1&&a.duration===450),JSON.stringify(animations));
   assert.ok(animations.some(a=>String(a.transform?.[0]).includes('scale(0.8)')&&a.transform.at(-1)==='scale(1)'&&a.duration>0&&Number.isFinite(a.duration)),JSON.stringify(animations));
   console.log('Verified native fade and zoom animations');
  }
  else {assert.equal(entrance.reduced,true);assert.ok(entrance.samples.every(s=>s.scale===1));}
  await until(`(${sample}).opacity===1`);assert.ok(Math.abs((await evaluate(sample)).scale-1)<0.001);
  assert.equal(await evaluate(`document.querySelector('[data-procedural-drawer-view] canvas')===window.motionCanvas`),true);
  if(!normal) {
   await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1200);await capture('drawer-motion-reduced-mobile');
   assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
   await pointerClick(await corner());await untilSelector('[data-archive-drawer-controls]',false);await settle(700);
   assert.equal(await evaluate(`[...window.reviewRoots.values()].find(r=>r.store.getState().gl.domElement===window.motionCanvas).store.getState().frameloop`),'never');
   assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
   console.log('Passed: reduced motion has no zoom movement; warm canvas reuse; panel protection; desktop/mobile outside dismissal; hidden cache paused.');break review;
  }
  const interrupted=await evaluate(`new Promise(resolve=>{document.querySelector('[aria-label="Back to cabinet"]').click();setTimeout(()=>{const exiting=${sample};[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click();resolve(exiting);},120);})`);
  if(normal) console.log('Interrupted close/reopen',JSON.stringify(interrupted));
  await until(`(${sample}).opacity===1`);
  assert.equal(await evaluate(`window.motionCanvas.closest('[inert]')===null`),true);
  await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Escape',code:'Escape',windowsVirtualKeyCode:27});await untilSelector('[data-archive-drawer-controls]',false);await settle(1000);
  await reopen();await settle(1200);await switchView('Current view',true);assert.equal(await evaluate(`document.querySelector('[data-procedural-drawer-cache]')===null`),true);await switchView('3D model',true);await untilSelector('[data-procedural-drawer-view]');await settle(1800);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1200);await capture(`drawer-motion-${normal?'normal':'reduced'}-mobile`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await pointerClick(await corner());await untilSelector('[data-archive-drawer-controls]',false);await settle(1000);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: fade/zoom entrance and exit; interrupted close/reopen; outside dismissal; panel and reader click protection; Back and Escape; warm idle cache; CSS/native switch; mobile; reduced motion:',!normal);
  break review;
 }
 if(process.env.ARCHIVE_REVIEW_STARTUP_ONLY) {
  await until('document.querySelectorAll("section[aria-label=\\"Archive cabinets\\"] canvas").length===2');await settle(1200);
  await until('Array.from(window.reviewRoots.values()).filter(root=>{const s=root.store.getState();return s.gl.domElement.isConnected&&s.gl.info.render.calls>0&&s.scene.getObjectByName("procedural-cabinet");}).length===2');
  const assertNativeCabinetsOnly=async()=>assert.equal(await evaluate('document.querySelectorAll("[data-css-cabinet-body]").length'),0,'Native cabinets must not mount hidden CSS cabinets');
  await assertNativeCabinetsOnly();
  assert.equal(await evaluate(`performance.getEntriesByType('resource').some(e=>e.name.includes('procedural-drawer-view')||e.name.includes('CSS3DRenderer'))`),false);
  const shared=await evaluate(`(()=>{const models=[...window.reviewRoots.values()].map(r=>r.store.getState()).filter(s=>s.gl.domElement.isConnected).map(s=>s.scene.getObjectByName('procedural-cabinet')).filter(Boolean);const parts=models.map(root=>{const out=[];root.traverse(o=>{if(o.isMesh)out.push(o);});return out;});return{models:models.length,meshes:parts[0].length,shared:parts[0].every((m,i)=>m.geometry===parts[1][i].geometry),independentMaterials:parts[0].every((m,i)=>m.material!==parts[1][i].material)};})()`);
  assert.equal(shared.models,2);assert.equal(shared.shared,true);assert.equal(shared.independentMaterials,true);
  const startup=await evaluate(`window.cabinetStartup.filter(e=>e.canvas.isConnected).map(e=>({created:e.created,firstDraw:e.firstDraw}))`);
  assert.equal(startup.length,2);assert.ok(startup[1].created>startup[0].created);assert.ok(startup[1].created>=startup[0].firstDraw,JSON.stringify(startup));
  console.log('Startup',JSON.stringify({shared,startup,drawerModuleDeferred:true}));await capture('cabinet-startup-desktop');
  await openDrawer(0);await capture('cabinet-startup-drawer');
  await assertNativeCabinetsOnly();
  assert.equal(await evaluate(`performance.getEntriesByType('resource').some(e=>e.name.includes('procedural-drawer-view'))`),true);
  await evaluate('window.startupDrawerCanvas=document.querySelector("[data-procedural-drawer-view] canvas");undefined');
  await click('[data-procedural-filing-item="2"]');await untilSelector('[aria-label="Close book"]');await click('[aria-label="Close book"]');await untilSelector('[aria-label="Close book"]',false);
  await closeDrawer();await evaluate(`[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click()`);await untilSelector('[data-procedural-drawer-view]');
  assert.equal(await evaluate('document.querySelector("[data-procedural-drawer-view] canvas")===window.startupDrawerCanvas'),true);
  await closeDrawer();await evaluate(`${drawer(0,0)}.click()`);await untilSelector('[data-procedural-drawer-cache]',false);
  await evaluate(`${drawer(0,1)}.click()`);await settle(700);
  assert.equal(await evaluate(`${drawer(0,1)}.getAttribute('aria-expanded')`),'true');assert.equal(await evaluate(`${drawer(1,1)}.getAttribute('aria-expanded')`),'false');
  await evaluate(`${drawer(0,1)}.click()`);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await evaluate('window.scrollTo(0,0)');await settle(1200);await capture('cabinet-startup-mobile');
  await evaluate(`${card(1)}.scrollIntoView({block:'center'})`);await settle(1800);await until(`${card(1)}.querySelector('canvas')!==null`);await capture('cabinet-startup-mobile-second');
  await evaluate('window.scrollTo(0,0)');await settle(1800);await until(`${card(0)}.querySelector('canvas')!==null`);
  await switchView('Current view');await until('document.querySelectorAll("canvas").length===0');
  assert.equal(await evaluate('document.querySelectorAll("[data-css-cabinet-body]").length'),2);
  await switchView('3D model');await until('document.querySelector("canvas")!==null');await settle(1200);
  await assertNativeCabinetsOnly();
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: Strict Mode; shared geometry/independent materials and drawers; staggered contexts; deferred drawer import; reader/return; warm drawer; mobile scroll release/resume; CSS switch.');
  break review;
 }
 if(process.env.ARCHIVE_REVIEW_DRAWER_CACHE_ONLY) {
  const lever=Boolean(process.env.ARCHIVE_REVIEW_CACHE_LEVER);
  if(lever) {
   await click('[aria-label="Drawers in Assessment files cabinet"] button');await settle(500);
   await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click()`);
   await untilSelector('[data-procedural-drawer-view]');await settle(1200);
  } else await openDrawer(0);
  await evaluate(`(()=>{const s=[...window.reviewRoots.values()].map(r=>r.store.getState()).find(s=>s.gl.domElement.closest('[data-procedural-drawer-view]'));window.cachedDrawerRenderer=s.gl;window.cachedDrawerCanvas=s.gl.domElement;window.cachedDrawerScene=s.scene;window.cachedDrawerEnvironment=s.scene.environment;window.cacheEnvironmentDisposed=false;s.scene.environment.addEventListener('dispose',()=>window.cacheEnvironmentDisposed=true);window.cacheFrames=0;const render=s.gl.render;s.gl.render=function(...args){window.cacheFrames++;return render.apply(this,args);};})()`);
  const before=await evaluate(`(()=>{const s=[...window.reviewRoots.values()].map(r=>r.store.getState()).find(s=>s.gl===window.cachedDrawerRenderer);const root=s.scene.getObjectByName('procedural-cabinet');let all=0,visible=0;root.traverse(o=>{if(o.isMesh)all++;});root.traverseVisible(o=>{if(o.isMesh)visible++;});return{all,visible,calls:s.gl.info.render.calls,triangles:s.gl.info.render.triangles,memory:s.gl.info.memory};})()`);
  console.log('Cached drawer baseline',JSON.stringify(before));assert.equal(before.visible,7);assert.equal(before.all,11);
  await capture(`drawer-cache-${lever?'lever':'books'}-desktop`);
  if(process.env.ARCHIVE_REVIEW_CACHE_CLEANUP_ONLY) {
   await closeDrawer();
   await click('[aria-label="Drawers in Assessment files cabinet"] button');
   await untilSelector('[data-procedural-drawer-cache]',false);
   await until('[...window.reviewRoots.values()].every(root=>root.store.getState().gl !== window.cachedDrawerRenderer)');
   assert.equal(await evaluate('window.cachedDrawerRenderer.getContext().isContextLost()'),true);
   assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
   console.log('Passed: closing the selected drawer releases the cached renderer, its scene and graphics context.');
   break review;
  }
  for(let repeat=0;repeat<3;repeat++) {
   await closeDrawer();await until(`window.cachedDrawerCanvas.closest('[data-procedural-drawer-cache]') !== null && [...window.reviewRoots.values()].find(r=>r.store.getState().gl===window.cachedDrawerRenderer)?.store.getState().frameloop==='never'`);
   assert.equal(await evaluate(`window.cachedDrawerCanvas.closest('[inert]') !== null`),true);
   const frames=await evaluate('window.cacheFrames');await settle(700);assert.equal(await evaluate('window.cacheFrames'),frames);
   await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click()`);
   await untilSelector('[data-procedural-drawer-view]');await settle(700);
   assert.equal(await evaluate(`document.querySelector('[data-procedural-drawer-view] canvas')===window.cachedDrawerCanvas`),true);
   assert.equal(await evaluate(`[...window.reviewRoots.values()].some(r=>{const s=r.store.getState();return s.gl===window.cachedDrawerRenderer&&s.scene===window.cachedDrawerScene&&s.scene.environment===window.cachedDrawerEnvironment&&s.frameloop==='demand'})`),true);
   assert.equal(await evaluate('document.querySelectorAll("[data-procedural-drawer-cache]").length'),1);
  }
  const itemSelector=lever?'[data-procedural-filing-item="2"]':'[data-procedural-filing-item="2"]';
  await click(itemSelector);await untilSelector(lever?'[aria-label="Close lever arch file"]':'[aria-label="Close book"]');await settle(500);
  await click(lever?'[aria-label="Close lever arch file"]':'[aria-label="Close book"]');await untilSelector(lever?'[aria-label="Close lever arch file"]':'[aria-label="Close book"]',false);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(900);await capture(`drawer-cache-${lever?'lever':'books'}-mobile`);
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await closeDrawer();await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await settle(500);
  if(lever) await click('[aria-label="Drawers in Assessment files cabinet"] button');
  else await evaluate(`${drawer(0,0)}.click()`);
  await untilSelector('[data-procedural-drawer-cache]',false);
  assert.equal(await evaluate('window.cachedDrawerCanvas.isConnected'),false);
  await until('[...window.reviewRoots.values()].every(root=>root.store.getState().gl !== window.cachedDrawerRenderer)');
  assert.equal(await evaluate('window.cachedDrawerRenderer.getContext().isContextLost()'),true);
  if(!lever) {
   await openDrawer(1);await capture('drawer-cache-folders-desktop');await closeDrawer();
   await evaluate(`${drawer(1,0)}.click()`);await untilSelector('[data-procedural-drawer-cache]',false);
   await openDrawer(0,1);await capture('drawer-cache-empty-desktop');await closeDrawer();
   await switchView('Current view');await untilSelector('[data-procedural-drawer-cache]',false);
  }
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: selected drawer only; same canvas/renderer/environment on three reopens; hidden renderer idle/inert; item reader/return; mobile resize; selection/view cleanup.');
  break review;
 }
 if(process.env.ARCHIVE_REVIEW_CSS_PARITY_ONLY) {
  await capture('css-parity-native-reference');
  await switchView('Current view');
  await untilSelector('[data-css-cabinet-body]');
  await capture('css-parity-desktop');
  const front='#cabinet-review-cabinet-0 .cabinet-vector-front';
  const facePoint=()=>evaluate(`(()=>{const r=document.querySelector('${front}').getBoundingClientRect();return{x:r.x+r.width/2,y:r.y+r.height/2};})()`);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...await facePoint()});await settle(1000);
  await capture('css-parity-hover');
  await click(front);await settle(1200);
  assert.equal(await evaluate(`document.querySelector('${front}').getAttribute('aria-expanded')`),'true');
  await capture('css-parity-open');
  await until(`document.querySelector('#cabinet-review-cabinet-0 button[data-drawer-interior]').disabled === false`);
  await click('#cabinet-review-cabinet-0 button[data-drawer-interior]');
  await untilSelector('[data-archive-drawer-controls]');await settle(1300);
  await capture('css-parity-zoomed-drawer');
  assert.equal(await evaluate('document.querySelectorAll("[data-book-visual]").length'),16);
  await click('[aria-label="Back to cabinet"]');await untilSelector('[data-archive-drawer-controls]',false);await settle(1000);
  await click(front);await settle(1000);
  assert.equal(await evaluate(`document.querySelector('${front}').getAttribute('aria-expanded')`),'false');
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',x:10,y:10});await settle(900);
  await evaluate('document.documentElement.classList.add("dark")');await capture('css-parity-dark');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1000);
  await capture('css-parity-mobile-dark');
  await evaluate('document.documentElement.classList.remove("dark")');await capture('css-parity-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await click(front);await settle(1200);await capture('css-parity-mobile-open');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await evaluate(`document.querySelector('${front}').focus()`);
  assert.equal(await evaluate(`document.activeElement===document.querySelector('${front}')`),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);
  await call('Page.navigate',{url:'http://127.0.0.1:5174/procedural-cabinet.html?closed=1'});
  await untilSelector('canvas');await settle(3000);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Current view').click()`);await settle(900);
  await capture('css-parity-upload-mobile');
  await evaluate('window.setReviewDrawer("drawer-1")');await settle(1200);await capture('css-parity-upload-mobile-open');
  await call('Emulation.setDeviceMetricsOverride',{width:1440,height:1000,deviceScaleFactor:1,mobile:false});await settle(700);
  await capture('css-parity-upload-desktop-open');
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('CSS cabinet parity: desktop/mobile, light/dark, hover/open/close, keyboard focus and upload placement passed.');
  break review;
 }
 if(process.env.ARCHIVE_REVIEW_LEVER_ONLY) {
  const navigate=async(mode)=>{await call('Page.navigate',{url:`http://127.0.0.1:5174/lever-arch.html${mode?'?mode='+mode:''}`});await until('document.documentElement.dataset.reviewReady === "true"');await settle(4000);};
  if(!process.env.ARCHIVE_REVIEW_LEVER_DRAWER_ONLY) {
  await capture('lever-arch-preview-closed');
  await evaluate(`document.querySelector('[data-lever-arch-preview] [role=group]').focus()`);
  for(let i=0;i<4;i++)await call('Input.dispatchKeyEvent',{type:'keyDown',key:'ArrowLeft',code:'ArrowLeft'});
  await settle(1400);await capture('lever-arch-preview-spine');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Reset view').click()`);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Open cover').click()`);await settle(2200);await capture('lever-arch-preview-open');
  await navigate('add');
  await click('[aria-label="Add filing item to Drawer 2"]');await untilSelector('[role=dialog]');
  await click('input[value=lever_arch]');await settle(1600);await capture('lever-arch-add-dialog');
  assert.equal(await evaluate('document.querySelector("input[value=lever_arch]").checked'),true);
  await navigate('manage');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('Assessment 01')).click()`);await settle(1600);await capture('lever-arch-management');
  }
  await navigate('');await untilSelector('canvas');
  await click('[aria-label="Drawers in Assessment files cabinet"] button');await settle(500);
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.includes('View inside')).click()`);
  await untilSelector('[data-procedural-drawer-view]');await settle(2500);await capture('lever-arch-drawer-desktop');
  assert.equal(await evaluate('document.querySelectorAll("[data-procedural-filing-item]").length'),16);
  const firstPoint=await evaluate(`(()=>{const state=[...window.reviewRoots.values()].map(r=>r.store.getState()).find(s=>s.scene.getObjectByName('lever-arch-drawer-contents'));const root=state.scene.getObjectByName('lever-arch-drawer-contents');const label=root.getObjectByName('spine-label');const point=label.getWorldPosition(state.camera.position.clone()).project(state.camera);const r=state.gl.domElement.getBoundingClientRect();return{x:r.x+(point.x+1)*r.width/2,y:r.y+(1-point.y)*r.height/2};})()`);
  await call('Input.dispatchMouseEvent',{type:'mouseMoved',...firstPoint});await settle(500);
  await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...firstPoint});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...firstPoint});
  await untilSelector('[aria-label="Close lever arch file"]');await settle(1600);await capture('lever-arch-reader');
  await click('[aria-label="Close lever arch file"]');await untilSelector('[aria-label="Close lever arch file"]',false);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1800);await capture('lever-arch-drawer-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  await switchView('Current view',true);
  await settle(1600);await capture('lever-arch-css-drawer-mobile');
  const cssCards=await evaluate(`[...document.querySelectorAll('[data-book-visual] .bg-stone-100 span')].map(e=>{const r=e.getBoundingClientRect();return{x:r.x,y:r.y,right:r.right,bottom:r.bottom};})`);
  assert.equal(cssCards.length,16);assert.ok(cssCards.every(r=>r.x>=8&&r.right<=382&&r.y>=80&&r.bottom<=832),JSON.stringify(cssCards));
  await navigate('preview');await settle(1200);await capture('lever-arch-preview-mobile');
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent==='Open cover').click()`);await settle(2200);await capture('lever-arch-preview-open-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth<=innerWidth'),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed lever arch closed/open/rotation, add dialog type selection, management preview, sixteen native instances, native selection/reader/return, CSS fallback and mobile fit.');break review;
 }
 if (process.env.ARCHIVE_REVIEW_PERF_ONLY) {
  const label=process.env.ARCHIVE_PERF_LABEL || 'sample';
  const report={label,views:[],animation:[],idle:[]};
  async function profile(){await evaluate(`(()=>{window.reviewRenderSamples??=[];window.reviewProfiled??=new WeakSet();for(const root of window.reviewRoots.values()){const state=root.store.getState(),gl=state.gl;if(!gl.domElement.isConnected||window.reviewProfiled.has(gl))continue;window.reviewProfiled.add(gl);const render=gl.render;gl.render=function(...args){const start=performance.now();const result=render.apply(this,args);window.reviewRenderSamples.push({view:this.domElement.closest('[data-procedural-drawer-view]')?'drawer':'cabinet',calls:this.info.render.calls,triangles:this.info.render.triangles,ms:performance.now()-start});return result;};}})()`);}
  async function snapshot(name){await settle(1500);await profile();await evaluate(`[...window.reviewRoots.values()].forEach(root=>{const state=root.store.getState();if(state.gl.domElement.isConnected)state.invalidate();})`);await settle(1000);report.views.push({name,data:await evaluate(`[...window.reviewRoots.values()].map(root=>{const s=root.store.getState();if(!s.gl.domElement.isConnected)return null;let meshes=0;s.scene.traverseVisible(o=>{if(o.isMesh)meshes++;});return{view:s.gl.domElement.closest('[data-procedural-drawer-view]')?'drawer':'cabinet',calls:s.gl.info.render.calls,triangles:s.gl.info.render.triangles,memory:s.gl.info.memory,programs:s.gl.info.programs?.length,meshes,dpr:s.viewport.dpr,shadowAutoUpdate:s.gl.shadowMap.autoUpdate};}).filter(Boolean)`)});await capture(`performance-${label}-${name}`);const frames=await evaluate('window.reviewRenderSamples.length');await settle(600);report.idle.push({name,extraFrames:(await evaluate('window.reviewRenderSamples.length'))-frames});}
  await snapshot('cabinet');
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await settle(500);await evaluate('window.reviewRenderSamples=[]');
  await evaluate(`${card(0)}.querySelector('[aria-label="Rotate cabinet right"]').click()`);await settle(2200);report.animation=await evaluate('window.reviewRenderSamples');
  await evaluate(`[...${card(0)}.querySelectorAll('button')].find(b=>b.textContent.includes('Reset view')).click()`);await settle(2200);
  await openDrawer(0);await snapshot('books');
  await evaluate('window.reviewRenderSamples=[]');await evaluate('document.querySelector("[data-procedural-filing-item=\\"1\\"]").focus()');await settle(800);report.bookHover=await evaluate('window.reviewRenderSamples');
  await closeDrawer();await openDrawer(1);await snapshot('folders');
  await evaluate('window.reviewRenderSamples=[]');await evaluate('document.querySelector("[data-procedural-filing-item=\\"1001\\"]").focus()');await settle(800);report.folderHover=await evaluate('window.reviewRenderSamples');
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  await writeFile(new URL(`./performance-${label}.json`,import.meta.url),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_TURN_ONLY) {
  const state=`[...window.reviewRoots.values()].map(root=>root.store.getState()).find(state=>state.gl.domElement.isConnected&&state.scene.getObjectByName('drawer-review-drawer-0-0'))`;
  const model=`(${state}).scene.getObjectByName('procedural-cabinet')`;
  const angle=()=>evaluate(`${model}.rotation.y`);
  const turn=async(count)=>{for(let i=0;i<count;i++){await evaluate(`${card(0)}.querySelector('[aria-label="Rotate cabinet right"]').click()`);await settle(150);}};
  async function fit(){const result=await evaluate(`(()=>{const state=${state};const model=${model};model.updateMatrixWorld(true);let max=0;model.traverseVisible(object=>{if(!object.geometry)return;object.geometry.computeBoundingBox();const b=object.geometry.boundingBox;for(const x of[b.min.x,b.max.x])for(const y of[b.min.y,b.max.y])for(const z of[b.min.z,b.max.z]){const p=object.localToWorld(state.camera.position.clone().set(x,y,z)).project(state.camera);max=Math.max(max,Math.abs(p.x),Math.abs(p.y));}});return{max,zoom:state.camera.zoom};})()`);assert.ok(result.max<0.98,JSON.stringify(result));return result;}
  await fit();await capture('cabinet-refined-front');
  for(const name of['quarter','rear','other-side']){await turn(3);await settle(500);await fit();await capture(`cabinet-refined-${name}`);}
  await turn(2);await settle(500);const before=await angle();
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await settle(400);
  await evaluate(`[...${card(0)}.querySelectorAll('button')].find(button=>button.textContent.includes('Reset view')).click()`);
  await settle(100);const during=await angle();assert.ok(during>before && during<before+Math.PI/6+0.001,JSON.stringify({before,during}));
  await until(`Math.abs(Math.sin(${model}.rotation.y)) < 0.001 && Math.cos(${model}.rotation.y)>0.999`);await settle(500);await fit();
  await evaluate(`${drawer(0,3)}.click()`);await settle(1500);await turn(3);await settle(2200);await fit();await capture('cabinet-refined-open-turn');
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1800);await fit();await capture('cabinet-refined-mobile-turn');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: front/quarter/rear/other side; shortest reset with normal motion; open drawer stays framed while turning; desktop/mobile fit; no browser errors.');
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_PERSPECTIVE_ONLY) {
  async function checkCamera(){const result=await evaluate(`(()=>{const state=[...window.reviewRoots.values()].map(root=>root.store.getState()).find(state=>state.gl.domElement.isConnected&&state.gl.domElement.closest('[data-procedural-drawer-view]'));if(!state)return null;const direction=state.camera.getWorldDirection(state.camera.position.clone());return{perspective:state.camera.isPerspectiveCamera,tilt:Math.atan2(-direction.y,-direction.z)*180/Math.PI,view:state.camera.view};})()`);assert.equal(result?.perspective,true);assert.ok(Math.abs(result.tilt-52)<0.001);}
  async function nativeClick(point){await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
  await openDrawer(0);await checkCamera();await capture('archive-perspective-books');
  const bookPoint=await evaluate(`(()=>{const rect=document.querySelector('[data-procedural-filing-item="1"] .book-cover-linen.bottom-full').getBoundingClientRect();return{x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()`);
  await nativeClick(bookPoint);await untilSelector('[aria-labelledby="open-book-title"]');
  await click('[aria-label="Close book"]');await untilSelector('[aria-labelledby="open-book-title"]',false);await settle(700);
  await switchView('Current view',true);await until('document.querySelector(".cabinet-pull-closeup") !== null');await capture('archive-perspective-css-reference');
  await switchView('3D model',true);await untilSelector('[data-procedural-drawer-view]');await checkCamera();await closeDrawer();
  await openDrawer(1);await checkCamera();await capture('archive-perspective-folders');
  const folderPoint=await evaluate(`(()=>{const rect=document.querySelector('[data-procedural-filing-item="1001"] [data-folder-tab-front] span').getBoundingClientRect();return{x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()`);
  await nativeClick(folderPoint);await untilSelector('[aria-label="Close folder"]');await click('[aria-label="Close folder"]');await untilSelector('[aria-label="Close folder"]',false);await settle(700);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});await settle(1500);await checkCamera();await capture('archive-perspective-folders-mobile');
  await closeDrawer();await openDrawer(0);await checkCamera();await capture('archive-perspective-books-mobile');
  await closeDrawer();await evaluate(`${drawer(0,0)}.click()`);await settle(2200);await capture('performance-after-cabinet-mobile');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: CSS52deg perspective; desktop/mobile books/folders fit; native first-book/first-folder selection; current/model switch; no JS errors/overflow.');
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_HOVER_ONLY) {
  const cabinetState=`[...window.reviewRoots.values()].map(root=>root.store.getState()).find(state=>state.gl.domElement.isConnected&&state.scene.getObjectByName('drawer-review-drawer-0-0'))`;
  const firstDrawer=`(${cabinetState}).scene.getObjectByName('drawer-review-drawer-0-0')`;
  async function facePoint(){return evaluate(`(()=>{const state=${cabinetState};const drawer=${firstDrawer};const point=drawer.localToWorld(state.camera.position.clone().set(0,0,1.48)).project(state.camera);const rect=state.gl.domElement.getBoundingClientRect();return{x:rect.x+(point.x+1)*rect.width/2,y:rect.y+(1-point.y)*rect.height/2};})()`);}
  const moveAway=()=>call('Input.dispatchMouseEvent',{type:'mouseMoved',x:20,y:20});
  const moveOver=async()=>call('Input.dispatchMouseEvent',{type:'mouseMoved',...await facePoint()});
  async function insidePoint(){return evaluate(`(()=>{const state=${cabinetState};const point=state.scene.getObjectByName('drawer-interior-target').getWorldPosition(state.camera.position.clone()).project(state.camera);const rect=state.gl.domElement.getBoundingClientRect();return{x:rect.x+(point.x+1)*rect.width/2,y:rect.y+(1-point.y)*rect.height/2};})()`);}
  const moveInside=async()=>call('Input.dispatchMouseEvent',{type:'mouseMoved',...await insidePoint()});
  async function clickInside(){const point=await insidePoint();await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
  async function clickFace(){const point=await facePoint();await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});}
  await moveOver();
  await until(`${firstDrawer}.position.z > 0.3 && ${firstDrawer}.position.z < 0.34`);
  assert.equal(await evaluate(`${drawer(0,0)}.getAttribute('aria-expanded')`),'false');
  await capture('archive-drawer-hover');
  await moveAway();await until(`${firstDrawer}.position.z === 0`);
  await moveOver();await until(`${firstDrawer}.position.z > 0.3`);
  await clickFace();await until(`${firstDrawer}.position.z > 2.29`);
  assert.equal(await evaluate(`${drawer(0,0)}.getAttribute('aria-expanded')`),'true');
  assert.equal(await evaluate(`(${cabinetState}).scene.getObjectByName('selected-drawer-outline').visible`),false);
  await capture('archive-drawer-no-outline');
  await clickFace();await until(`${firstDrawer}.position.z === 0`);
  assert.equal(await evaluate('document.querySelector("[data-procedural-drawer-view]")'),null);
  assert.equal(await evaluate(`${drawer(0,0)}.getAttribute('aria-expanded')`),'false');
  await clickFace();await until(`${firstDrawer}.position.z > 2.29`);
  await moveInside();
  await until(`(${cabinetState}).scene.getObjectByName('drawer-interior-fill').material.opacity === 0.4`);
  assert.equal(await evaluate(`(${cabinetState}).gl.domElement.style.cursor`),'zoom-in');
  await capture('archive-drawer-interior-hover');
  await moveAway();await until(`(${cabinetState}).scene.getObjectByName('drawer-interior-fill').material.opacity === 0`);
  await clickInside();await untilSelector('[data-procedural-drawer-view]');await settle(1000);
  assert.equal(await evaluate(`[...window.reviewRoots.values()].filter(root=>root.store.getState().gl.domElement.isConnected).some(root=>{let visible=false;root.store.getState().scene.traverse(object=>{if(object.name==='selected-drawer-outline'&&object.visible)visible=true;});return visible;})`),false);
  await capture('archive-drawer-preview-no-outline');
  await closeDrawer();await evaluate(`${drawer(0,0)}.click()`);await moveAway();await until(`${firstDrawer}.position.z === 0`);
  await call('Emulation.setEmulatedMedia',{features:[{name:'prefers-reduced-motion',value:'no-preference'}]});await settle(300);
  await moveOver();await until(`${firstDrawer}.position.z > 0.3 && ${firstDrawer}.position.z < 0.34`);
  await moveAway();await until(`${firstDrawer}.position.z === 0`);
  await clickFace();await until(`(${cabinetState}).scene.getObjectByName('drawer-interior-target').visible === true`);
  await evaluate(`${card(0)}.querySelector('[aria-label="Rotate cabinet right"]').click()`);
  await until(`Math.abs((${cabinetState}).scene.getObjectByName('procedural-cabinet').rotation.y - Math.PI/6) < 0.001`);
  await moveInside();await until(`(${cabinetState}).scene.getObjectByName('drawer-interior-fill').material.opacity === 0.4`);
  await clickInside();await untilSelector('[data-procedural-drawer-view]');
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);assert.deepEqual(errors,[]);
  console.log('Passed: native hover peek/return; front click opens/closes; interior hover blue/zoom cursor/leave clears; interior click zooms; no front/closeup outline; normal/reduced motion and rotated cabinet.');
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_SCALE_ONLY) {
  async function assertModelFits() {
   const bounds=await evaluate(`Array.from(window.reviewRoots.values()).map(root=>{const state=root.store.getState();const model=state.scene.getObjectByName('procedural-cabinet');if(!model)return null;const bounds={minX:Infinity,maxX:-Infinity,minY:Infinity,maxY:-Infinity};model.updateMatrixWorld(true);model.traverseVisible(object=>{if(!object.geometry)return;object.geometry.computeBoundingBox();const box=object.geometry.boundingBox;for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){const point=state.camera.position.clone().set(x,y,z);object.localToWorld(point);point.project(state.camera);bounds.minX=Math.min(bounds.minX,point.x);bounds.maxX=Math.max(bounds.maxX,point.x);bounds.minY=Math.min(bounds.minY,point.y);bounds.maxY=Math.max(bounds.maxY,point.y);}});return{height:state.size.height,...bounds};}).filter(Boolean)`);
   for(const bound of bounds){assert.equal(bound.height,448);assert.ok(bound.minX>=-1&&bound.maxX<=1&&bound.minY>=-1&&bound.maxY<=1,JSON.stringify(bound));}
   console.log(JSON.stringify(bounds));
  }
  await assertModelFits();await capture('archive-scale-desktop');
  await evaluate(`${drawer(0,3)}.click()`);await settle(1200);
  await assertModelFits();await capture('archive-scale-open');
  await evaluate(`${drawer(0,3)}.click()`);
  await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
  await settle(1500);await assertModelFits();await capture('archive-scale-mobile');
  await evaluate(`${drawer(0,3)}.click()`);await settle(1200);
  await assertModelFits();await capture('archive-scale-mobile-open');
  assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
  assert.deepEqual(await evaluate('window.reviewErrors'),[]);
  console.log('Archive sizing checked: 40% taller than original, desktop/mobile closed/open models fit, no horizontal overflow or browser errors.');
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_DEBUG) {
  console.log(JSON.stringify(await evaluate(`Array.from(window.reviewRoots.values()).map(root=>{const s=root.store.getState();let counts={};s.scene.traverse(o=>counts[o.type]=(counts[o.type]||0)+1);return {counts,camera:{position:s.camera.position,rotation:s.camera.rotation,zoom:s.camera.zoom,near:s.camera.near,far:s.camera.far,projection:s.camera.projectionMatrix.elements},renderer:s.gl.info,contextLost:s.gl.getContext().isContextLost(),dom:{rect:s.gl.domElement.getBoundingClientRect().toJSON(),width:s.gl.domElement.width,height:s.gl.domElement.height},models:s.scene.children.map(o=>({name:o.name,type:o.type,visible:o.visible,position:o.position,scale:o.scale}))};})`)));
  const firstCapture=await call('Page.captureScreenshot',{format:'png',captureBeyondViewport:false});
  await writeFile(new URL('./archive-first-viewport.png',import.meta.url),Buffer.from(firstCapture.data,'base64'));
  await capture('archive-before-invalidate');
  await evaluate('Array.from(window.reviewRoots.values()).forEach(root=>root.store.getState().invalidate())');
  await settle(1000);
  await capture('archive-after-invalidate');
  await evaluate('Array.from(window.reviewRoots.values()).forEach(root=>{const s=root.store.getState(); s.gl.render(s.scene,s.camera);})');
  await capture('archive-after-render');
  break review;
 }
 if (process.env.ARCHIVE_REVIEW_CAPTURE_ONLY) await settle(20000);
 await capture('archive-model');
 if (!process.env.ARCHIVE_REVIEW_CAPTURE_ONLY) {
 if (!process.env.ARCHIVE_REVIEW_FROM_FOLDERS) {
 await openDrawer(0);
 await capture('archive-drawer-books');
 assert.equal(await evaluate('document.querySelectorAll("[data-procedural-filing-item]").length'),16);
 const point=await evaluate(`(()=>{const rect=document.querySelector('[data-procedural-filing-item="1"] .book-cover-linen.bottom-full').getBoundingClientRect();return{x:rect.x+rect.width/2,y:rect.y+rect.height/2};})()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...point});await settle(200);
 await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...point});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...point});
 await untilSelector('[aria-labelledby="open-book-title"]');await settle(700);
 await capture('archive-book-viewer');
 await click('[aria-label="Close book"]');
 await untilSelector('[aria-labelledby="open-book-title"]',false);
 await switchView('Current view',true);
 await until('document.querySelector(".cabinet-pull-closeup") !== null');
 await capture('archive-drawer-current');
 await switchView('3D model',true);
 await until('document.querySelectorAll("[data-procedural-filing-item]").length === 16');
 await closeDrawer();
 assert.equal(await evaluate(`${drawer(0,0)}.getAttribute('aria-expanded')`),'true');
 }
 if (!process.env.ARCHIVE_REVIEW_BOOKS_ONLY) {
 await openDrawer(1);
 await capture('archive-drawer-folders');
 const folderPoint=await evaluate(`(()=>{const rect=document.querySelector('[data-procedural-filing-item="1001"]').getBoundingClientRect();return{x:rect.x+rect.width*.75,y:rect.top+4};})()`);
 await call('Input.dispatchMouseEvent',{type:'mouseMoved',...folderPoint});
 await call('Input.dispatchMouseEvent',{type:'mousePressed',button:'left',clickCount:1,...folderPoint});
 await call('Input.dispatchMouseEvent',{type:'mouseReleased',button:'left',clickCount:1,...folderPoint});
 await untilSelector('[aria-label="Close folder"]');
 await click('[aria-label="Close folder"]');await untilSelector('[aria-label="Close folder"]',false);
 await settle(600);
 await until('document.querySelector("[data-procedural-filing-item]").checkVisibility()');
 await evaluate('document.querySelector("[data-procedural-filing-item]").focus()');
 await until('document.activeElement?.getAttribute("data-procedural-filing-item") === "1001"');
 console.log(JSON.stringify(await evaluate(`({focus:document.activeElement?.getAttribute('data-procedural-filing-item'),label:document.activeElement?.getAttribute('aria-label')})`)));
 await call('Input.dispatchKeyEvent',{type:'keyDown',key:'Enter',code:'Enter',windowsVirtualKeyCode:13,text:'\r',unmodifiedText:'\r'});
 await call('Input.dispatchKeyEvent',{type:'keyUp',key:'Enter',code:'Enter',windowsVirtualKeyCode:13});
 await untilSelector('[aria-label="Close folder"]');await settle(700);
 await capture('archive-folder-viewer');
 await click('[aria-label="Close folder"]');
 await untilSelector('[aria-label="Close folder"]',false);
 await closeDrawer();
 await openDrawer(0,1);
 await capture('archive-drawer-empty');
 await closeDrawer();
 await switchView('Current view');
 assert.equal(await evaluate('document.querySelectorAll("canvas").length'),0);
 await capture('archive-current');
 await switchView('3D model');
 await until('document.querySelector("canvas") !== null');await settle(2500);
 await evaluate('document.documentElement.classList.add("dark")');await settle(300);
 await capture('archive-model-dark');
 await evaluate('document.documentElement.classList.remove("dark")');
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate('window.scrollTo(0,0)');await settle(1200);
 await capture('archive-mobile');
 assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
 await openDrawer(0);
 await capture('archive-drawer-mobile');
 assert.equal(await evaluate('document.documentElement.scrollWidth <= innerWidth'),true);
 assert.deepEqual(await evaluate('window.reviewErrors'),[]);
 assert.deepEqual(errors,[]);
 await call('Page.navigate',{url:'http://127.0.0.1:5174/procedural-cabinet.html'});
 await until('document.documentElement.dataset.reviewReady === "true" && document.querySelector("canvas") !== null');await settle(2500);
 await capture('archive-upload-preview');
 assert.deepEqual(await evaluate('window.reviewErrors'),[]);
 }
 } else {
 await call('Emulation.setDeviceMetricsOverride',{width:390,height:844,deviceScaleFactor:1,mobile:true});
 await evaluate('window.scrollTo(0,0)');await settle(20000);
 await capture('archive-mobile');
 assert.deepEqual(await evaluate('window.reviewErrors'),[]);
 }
 console.log(JSON.stringify({passed:true,checks:process.env.ARCHIVE_REVIEW_CAPTURE_ONLY?['settled desktop cabinets','settled mobile cabinet']:process.env.ARCHIVE_REVIEW_BOOKS_ONLY?['canvas book click','current closeup switch','drawer selection retained']:['folder mouse selection','keyboard folder open','empty drawer','dark mode','mobile fit','upload preview'],errors}));
} catch(error) {
 if(process.env.ARCHIVE_REVIEW_SCROLL_ONLY) console.log('Scroll diagnostics',JSON.stringify(await evaluate(`Array.from(window.reviewRoots.values()).map(r=>{const s=r.store.getState();return{card:s.gl.domElement.closest('[id^="cabinet-"]')?.id,rotation:s.scene.getObjectByName('procedural-cabinet')?.rotation.y,drawer:s.scene.getObjectByName('drawer-review-drawer-0-0')?.position.z,frames:s.internal.frames,frameloop:s.frameloop,calls:s.gl.info.render.frame};})`).catch(()=>null)));
 await capture('archive-error').catch(()=>{});
 console.error(error);process.exitCode=1;
} finally {
 await call('Browser.close').catch(()=>{});socket.close();
}
