/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 知識冒險島 v1.0：角色、建築與清單共用同一份入口資料。
 */
import { courseLinks } from './course-links.js';
const VERSION = 'v1.0';
const places = [
  { id: 'history', name: '歷史館', icon: '🏯', short: '翻開歷史，遇見不同時代', description: '走進古老的故事，看看不同時代的人怎麼生活、發明與改變世界。', course: '穿越中國帝制時代', detail: '互動古書、朝代探索與軍事百科，將從這裡進入。', tint: '#f9e3cc', x: -6, z: 1, color: 0xc96845, kind: 'history' },
  { id: 'science', name: '科學工坊', icon: '🔬', short: '動手試試，找到為什麼', description: '從一個小問題開始，透過觀察、實驗與比較，發現生活中的科學。', course: '自然與科學探索', detail: '未來放入實驗活動、自然知識與互動模擬。', tint: '#dfedfa', x: 1, z: -6, color: 0x668fbd, kind: 'science' },
  { id: 'ai', name: 'AI研究所', icon: '🤖', short: '認識AI，也學會保護自己', description: '認識人工智慧能做什麼，練習提問、查證與辨認網路中的可疑訊息。', course: 'AI與防詐課程', detail: '未來從這裡跟著課程，一步一步學習與練習。', tint: '#dcefe8', x: -1, z: 6, color: 0x64a79d, kind: 'ai' },
  { id: 'world', name: '探險港口', icon: '🧭', short: '帶著好奇心，認識世界', description: '看看遠方的地形、動物、城市與文化，從小島出發認識更大的世界。', course: '世界地理與文化', detail: '未來放入地理探索、旅遊課程與文化故事。', tint: '#e3edf8', x: 6, z: -1, color: 0x537da9, kind: 'world' },
  { id: 'reading', name: '閱讀樹屋', icon: '📚', short: '找一個故事，慢慢看', description: '爬上安靜的小樹屋，讀故事、找知識，留下今天新發現的事。', course: '故事與生活知識', detail: '未來放入適合孩子閱讀的故事與知識文章。', tint: '#e9edce', x: 5, z: 5, color: 0x9e754c, kind: 'reading' },
];
const $ = id => document.getElementById(id);
const dialog = $('place-dialog');
const list = $('place-list');
const labels = new Map();
let previousFocus = null;
let currentPlace = null;
let nearby = null;
const input = new Set();
let THREE, scene, camera, renderer, character;
const buildings = [];
let sceneReady = false;

function openPlace(id) {
  const place = places.find(p => p.id === id);
  if (!place || dialog.open) return;
  input.clear();
  previousFocus = document.activeElement;
  currentPlace = place;
  dialog.dataset.place = id;
  $('dialog-icon').textContent = place.icon;
  $('dialog-icon').style.background = place.tint;
  $('dialog-title').textContent = place.name;
  $('dialog-description').textContent = place.description;
  $('course-card').replaceChildren();
  const title = document.createElement('strong'); title.textContent = place.course;
  const detail = document.createElement('p'); detail.textContent = place.detail;
  const status = document.createElement('span'); status.className = 'preparing'; status.textContent = '內容準備中';
  $('course-card').append(title, detail, status);
  if (typeof courseLinks[id] === 'string') {
    const destination = new URL(courseLinks[id], document.baseURI);
    if (destination.origin === location.origin) {
      const link = document.createElement('a');
      link.className = 'primary-button course-link';
      link.href = destination.href;
      link.textContent = '開始探索';
      status.remove();
      $('course-card').append(link);
    }
  }
  dialog.showModal();
  $('dialog-close').focus();
  window.dispatchEvent(new CustomEvent('island:navigate', { detail: { id } }));
}
function closePlace() { dialog.close(); }
dialog.addEventListener('close', () => { currentPlace = null; if (previousFocus?.isConnected) previousFocus.focus(); });
$('dialog-close').addEventListener('click', closePlace);
$('back-to-island').addEventListener('click', closePlace);
dialog.addEventListener('click', event => { const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closePlace(); });
function toggleList(show) { list.hidden = !show; $('list-toggle').setAttribute('aria-expanded', String(show)); if (show) { input.clear(); $('list-close').focus(); } else $('list-toggle').focus(); }
$('list-toggle').addEventListener('click', () => toggleList(list.hidden));
$('list-close').addEventListener('click', () => toggleList(false));
$('nearby-enter').addEventListener('click', () => { if (nearby) openPlace(nearby.id); });

for (const place of places) {
  const item = document.createElement('button');
  item.className = 'list-item'; item.dataset.place = place.id; item.style.setProperty('--tint', place.tint);
  const icon = document.createElement('span'); icon.className = 'place-icon'; icon.textContent = place.icon; icon.setAttribute('aria-hidden', 'true');
  const info = document.createElement('span'); const title = document.createElement('strong'); title.textContent = place.name;
  const description = document.createElement('small'); description.textContent = place.short;
  info.append(title, description); item.append(icon, info); item.addEventListener('click', () => openPlace(place.id));
  $('list-items').append(item);
  const label = document.createElement('button'); label.className = 'place-label'; label.dataset.place = place.id; label.setAttribute('aria-label', '進入' + place.name);
  const symbol = document.createElement('span'); symbol.textContent = place.icon; symbol.setAttribute('aria-hidden', 'true'); label.append(symbol, document.createTextNode(place.name));
  label.addEventListener('click', () => openPlace(place.id)); label.hidden = true; $('labels').append(label); labels.set(place.id, label);
}

const keyMap = { ArrowUp: 'up', w: 'up', W: 'up', ArrowDown: 'down', s: 'down', S: 'down', ArrowLeft: 'left', a: 'left', A: 'left', ArrowRight: 'right', d: 'right', D: 'right' };
window.addEventListener('keydown', event => {
  if (event.key === 'Escape' && !list.hidden && !dialog.open) { toggleList(false); return; }
  if (dialog.open || !list.hidden || ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement?.tagName)) return;
  if (keyMap[event.key]) { event.preventDefault(); input.add(keyMap[event.key]); }
  if (event.key === 'Enter' && nearby && document.activeElement?.tagName !== 'BUTTON' && document.activeElement?.tagName !== 'A') { event.preventDefault(); openPlace(nearby.id); }
});
window.addEventListener('keyup', event => { if (keyMap[event.key]) input.delete(keyMap[event.key]); });
window.addEventListener('blur', () => input.clear());
document.addEventListener('visibilitychange', () => { if (document.hidden) input.clear(); });
for (const button of document.querySelectorAll('[data-move]')) {
  const end = () => { input.delete(button.dataset.move); button.classList.remove('pressed'); };
  button.addEventListener('pointerdown', event => { if (dialog.open || !list.hidden) return; event.preventDefault(); button.setPointerCapture(event.pointerId); input.add(button.dataset.move); button.classList.add('pressed'); });
  button.addEventListener('pointerup', end); button.addEventListener('pointercancel', end); button.addEventListener('lostpointercapture', end);
}

try {
  THREE = await import('https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.js');
  initScene();
} catch (error) {
  console.error('小島無法載入', error);
  $('loading').hidden = true; $('scene-error').hidden = false;
}

function initScene() {
  const host = $('scene');
  scene = new THREE.Scene();
  camera = new THREE.OrthographicCamera(-15, 15, 10, -10, .1, 150);
  camera.position.set(21, 24, 21); camera.lookAt(0, .8, 0);
  renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 1.6));
  renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.2;
  host.append(renderer.domElement);
  scene.add(new THREE.HemisphereLight(0xfff4df, 0x699f99, 2.5));
  const sun = new THREE.DirectionalLight(0xfff2d4, 3.3); sun.position.set(-9, 20, 9); sun.castShadow = true;
  sun.shadow.mapSize.set(2048, 2048); Object.assign(sun.shadow.camera, { left: -17, right: 17, top: 17, bottom: -17, near: 1, far: 65 }); sun.shadow.normalBias = .035; sun.shadow.bias = -.0002; scene.add(sun);

  const mats = new Map();
  function material(color) { if (!mats.has(color)) mats.set(color, new THREE.MeshStandardMaterial({ color, roughness: .92, metalness: 0 })); return mats.get(color); }
  function box(parent, x, y, z, w, h, d, color, cast = true) {
    const mesh = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material(color)); mesh.position.set(x, y, z); mesh.castShadow = cast; mesh.receiveShadow = true; parent.add(mesh); return mesh;
  }
  function cylinder(parent, x, y, z, r, h, color, sides = 8) { const mesh = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, sides), material(color)); mesh.position.set(x, y, z); mesh.castShadow = true; mesh.receiveShadow = true; parent.add(mesh); return mesh; }

  // 地形是可步行的積木小島；外圈沙灘與岩層提供清楚的邊界。
  const ground = new THREE.Group(); scene.add(ground);
  const grass = [0x94b56a, 0x9ebc74, 0xa8bf79, 0x96b36a, 0xadc484];
  const land = new Set();
  const hash = (x, z) => { const n = Math.sin(x * 37.13 + z * 97.17 + 8.2) * 45831.33; return n - Math.floor(n); };
  function pathDistance(x, z) {
    let distance = 100;
    for (const place of places) { const len2 = place.x * place.x + place.z * place.z; const t = Math.max(0, Math.min(.78, (x * place.x + z * place.z) / len2)); distance = Math.min(distance, Math.hypot(x - place.x * t, z - place.z * t)); }
    return distance;
  }
  for (let x = -10; x <= 10; x++) for (let z = -10; z <= 10; z++) {
    const r = Math.hypot(x, z); if (r > 10 + hash(x, z) * .55) continue;
    const beach = r > 8.9;
    const top = beach ? .72 : 1;
    box(ground, x, -.58, z, 1, 2.1, 1, beach ? 0xb9b093 : 0x80998a, false);
    box(ground, x, top - .22, z, 1.01, .44, 1.01, beach ? 0xe7d3a1 : grass[Math.floor(hash(x, z) * grass.length)], false);
    if (!beach) land.add(x + ',' + z);
    if (!beach && pathDistance(x, z) < .52) box(ground, x, 1.025, z, .98, .07, .98, 0xe0c99b, false);
    if (r > 9.4 && hash(x + 8, z) > .75) box(ground, x, .78, z, .7, .4, .65, 0x9baea3);
  }
  box(scene, 0, 1.11, 0, 2.3, .17, 2.3, 0xe7d5aa, false);

  // 海面與短小波紋使用幾何形狀，首頁不需要額外下載圖片或模型。
  const sea = new THREE.Mesh(new THREE.PlaneGeometry(120, 120), new THREE.MeshStandardMaterial({ color: 0x8bcdd8, roughness: .5, transparent: true, opacity: .45 }));
  sea.rotation.x = -Math.PI / 2; sea.position.y = -1.45; sea.receiveShadow = true; scene.add(sea);
  const ripples = [];
  for (let i = 0; i < 42; i++) {
    const a = i * 2.3999, r = 12.7 + (i % 6) * 2.2;
    const ripple = box(scene, Math.cos(a) * r, -1.39, Math.sin(a) * r, .5 + (i % 3) * .25, .022, .065, 0xc5e9e9, false);
    ripple.rotation.y = -.4; ripples.push(ripple);
  }

  function tree(x, z, scale = 1) {
    const group = new THREE.Group(); group.position.set(x, 1, z); group.scale.setScalar(scale); scene.add(group);
    box(group, 0, .65, 0, .34, 1.3, .34, 0x96774a);
    box(group, 0, 1.7, 0, 1.45, 1.05, 1.3, 0x648b4f);
    box(group, -.2, 2.3, .05, 1.04, .6, 1.05, 0x82a85c);
    box(group, .45, 1.82, .13, .72, .65, .9, 0x739952);
  }
  [[-7,-4,.9],[-4,-7,.8],[4,-7,.9],[-7,4,.8],[7,3,.8],[1,8,.7],[-4,7,.7],[7,-4,.65]].forEach(p => tree(...p));
  for (const [x,z] of [[-2,-6],[-7,-1],[3,-3],[7,1],[-4,4],[-3,7],[2,7]]) {
    for (let j = 0; j < 3; j++) { box(scene, x + j * .19, 1.19, z + (j % 2) * .24, .07, .36, .07, 0x739553, false); box(scene, x + j * .19, 1.4, z + (j % 2) * .24, .17, .13, .17, j % 2 ? 0xf1cb63 : 0xf8e8be); }
  }

  function commonHouse(group, color) {
    box(group, 0, .13, 0, 3.3, .26, 2.8, 0xc3ac80);
    box(group, 0, 1.08, 0, 2.5, 1.9, 2.15, 0xffefcc);
    box(group, 0, .6, 1.09, .65, 1.2, .08, 0x6e5740);
    for (const x of [-.8,.8]) { box(group, x, 1.14, 1.1, .48, .6, .08, 0x64858c); box(group, x, 1.14, 1.16, .06, .63, .05, 0xe6d8b7); }
    for (let j = 0; j < 4; j++) box(group, 0, 2.08 + j * .2, 0, 3.2 - j * .43, .23, 2.7 - j * .35, color);
  }
  for (const place of places) {
    const group = new THREE.Group(); group.position.set(place.x, 1.08, place.z); scene.add(group);
    if (place.kind === 'history') {
      commonHouse(group, 0xba6546);
      for (const x of [-1.2,1.2]) box(group, x, 1.05, 1.2, .15, 1.95, .15, 0xa9513b);
      box(group, 0, 1.84, 1.24, 1.35, .36, .1, 0x825b3b); cylinder(group, 0, 2.99, 0, .16, .18, 0xe6bd66);
    } else if (place.kind === 'science') {
      commonHouse(group, 0x6d96b3);
      box(group, -.7, 2.92, .1, .5, .5, .5, 0xe8e2c7);
      const scope = cylinder(group, -.7, 3.35, .1, .18, .9, 0x4c6c80); scope.rotation.z = -.65;
      box(group, 1.35, .55, 0, .44, .8, .75, 0x95b9c0);
    } else if (place.kind === 'ai') {
      box(group, 0, .12, 0, 3.2, .24, 2.7, 0xc7bfa3);
      box(group, 0, 1.17, 0, 2.55, 2.1, 2.2, 0xe5eee0);
      box(group, 0, 2.35, 0, 2.9, .3, 2.55, 0x6baba1);
      box(group, 0, 1.58, 1.13, 1.8, .78, .09, 0x3f6266);
      for (const x of [-.48,.48]) box(group, x, 1.64, 1.2, .23, .3, .08, 0xc3e8df);
      box(group, 0, .55, 1.14, .62, 1.1, .1, 0x6e8f84);
      cylinder(group, 0, 2.8, 0, .055, .6, 0x607976); box(group, 0, 3.15, 0, .25, .25, .25, 0xf1bf64);
      for (const x of [-1.48,1.48]) box(group, x, 1.55, 0, .28, .7, .5, 0x91bdb1);
    } else if (place.kind === 'world') {
      box(group, 0, .12, 0, 3, .24, 2.6, 0xc6ad7f); box(group, -.55, .8, 0, 1.5, 1.35, 1.9, 0xf7e4bf);
      box(group, -.55, 1.6, 0, 1.9, .22, 2.2, 0x668aa7); box(group, -.55, .55, 1, .5, 1.1, .1, 0x765c43);
      cylinder(group, .8, 1.5, -.3, .48, 2.8, 0xffefd0); cylinder(group, .8, 1.6, -.3, .49, .36, 0xbb6446);
      cylinder(group, .8, 2.95, -.3, .62, .22, 0x4e7493); box(group, .8, 3.25, -.3, .63, .43, .63, 0xf4d189);
      cylinder(group, .8, 3.56, -.3, .75, .16, 0x5a7b95);
      for (let j=0;j<4;j++) box(group, 2+j*.48, -.08, -.3, .47, .15, 1, 0xa98b61);
    } else {
      box(group, 0, .9, 0, .65, 1.8, .65, 0x8c6b43);
      box(group, 0, 1.3, 0, 3.2, .25, 2.6, 0xae8754); box(group, 0, 2, 0, 2.3, 1.3, 1.8, 0xe3c28f);
      box(group, 0, 2.88, 0, 2.9, .35, 2.3, 0x729c53); box(group, -.2, 3.3, -.12, 2, .5, 1.9, 0x84ac61);
      box(group, 0, 1.93, .96, .65, 1.15, .08, 0x755d41);
      for (let j=0;j<5;j++) box(group, .1, .15+j*.22, 1.3-j*.08, .65, .1, .3, 0xb18d5f);
      box(group, -.82, 1.94, .98, .6, .5, .1, 0x7b6952);
      for (let j=0;j<3;j++) box(group, -1.02+j*.19, 1.95, 1.06, .12, .38, .11, [0xcc805c,0x6f99a2,0xd3b65a][j]);
    }
    group.traverse(object => { object.userData.placeId = place.id; }); buildings.push(group);
    place.group = group;
  }

  character = new THREE.Group(); character.position.set(0, 1.13, 1); scene.add(character);
  const body = new THREE.Group(); character.add(body);
  box(body, 0, .72, 0, .52, .56, .36, 0xe9b955);
  box(body, 0, 1.22, 0, .5, .5, .46, 0xe6b48b);
  box(body, 0, 1.49, -.01, .6, .16, .56, 0xf3d681); box(body, 0, 1.4, .28, .58, .07, .25, 0xe5ba5a);
  for (const x of [-.12,.12]) box(body, x, 1.25, .24, .055, .075, .025, 0x4e443b);
  box(body, 0, .76, -.24, .39, .45, .2, 0xbf6a4a);
  const leftArm = box(body, -.36, .72, 0, .18, .53, .2, 0xdba87f); const rightArm = box(body, .36, .72, 0, .18, .53, .2, 0xdba87f);
  const leftLeg = box(body, -.15, .28, 0, .21, .42, .25, 0x586c76); const rightLeg = box(body, .15, .28, 0, .21, .42, .25, 0x586c76);
  box(body, -.15, .08, .08, .25, .14, .4, 0x6d5a45); box(body, .15, .08, .08, .25, .14, .4, 0x6d5a45);
  // 腳下光圈只用來辨識角色位置，不表示完成課程或獲得分數。
  const ring = new THREE.Mesh(new THREE.RingGeometry(.49,.58,32), new THREE.MeshBasicMaterial({color:0xfff3b1,side:THREE.DoubleSide,transparent:true,opacity:.9})); ring.rotation.x=-Math.PI/2; ring.position.y=.018; character.add(ring);

  function resize() {
    const width=host.clientWidth, height=host.clientHeight;
    const aspect=width/height;
    const compact=width<700&&width/height>.7;
    const span=width<700?(compact?31:24.5):39;
    camera.left=-span/2;camera.right=span/2;camera.top=span/aspect/2;camera.bottom=-span/aspect/2;
    camera.setViewOffset(width,height,0,width<700?(compact?-height*.16:-height*.045):-height*.07,width,height);
    camera.updateProjectionMatrix();camera.updateMatrixWorld(true);renderer.setSize(width,height);updateLabels();
  }
  function updateLabels() {
    const width=host.clientWidth,height=host.clientHeight;
    for(const place of places){const point=new THREE.Vector3(place.x,4.4,place.z).project(camera);const label=labels.get(place.id);const offsetX=width<360?(place.id==='history'||place.id==='ai'?-7:place.id==='science'||place.id==='world'?7:0):0;const offsetY=width<700&&place.id==='reading'?24:0;label.style.left=((point.x*.5+.5)*width+offsetX)+'px';label.style.top=((-point.y*.5+.5)*height+offsetY)+'px';label.hidden=false;}
  }
  window.addEventListener('resize',resize);resize();
  const raycaster=new THREE.Raycaster(), pointer=new THREE.Vector2();let pointerStart=null;
  renderer.domElement.addEventListener('pointerdown',event=>{pointerStart={x:event.clientX,y:event.clientY};});
  renderer.domElement.addEventListener('pointerup',event=>{
    if(!pointerStart||Math.hypot(event.clientX-pointerStart.x,event.clientY-pointerStart.y)>12||dialog.open||!list.hidden)return;
    const rect=renderer.domElement.getBoundingClientRect();pointer.set((event.clientX-rect.left)/rect.width*2-1,-(event.clientY-rect.top)/rect.height*2+1);
    raycaster.setFromCamera(pointer,camera);const hits=raycaster.intersectObjects(buildings,true);if(hits.length)openPlace(hits[0].object.userData.placeId);pointerStart=null;
  });
  function canStand(x,z){if(!land.has(Math.round(x)+','+Math.round(z)))return false;return !places.some(p=>Math.abs(x-p.x)<1.85&&Math.abs(z-p.z)<1.6);}
  let previous=performance.now(), walkTime=0;
  function tick(now){
    const dt=Math.min((now-previous)/1000,.04);previous=now;
    let sx=(input.has('right')?1:0)-(input.has('left')?1:0),sy=(input.has('down')?1:0)-(input.has('up')?1:0);
    if(dialog.open||!list.hidden){sx=0;sy=0;}
    const moving=sx!==0||sy!==0;
    if(moving){const norm=Math.hypot(sx,sy);sx/=norm;sy/=norm;const dx=(sx+sy)*Math.SQRT1_2,dz=(-sx+sy)*Math.SQRT1_2;const nx=character.position.x+dx*3.5*dt,nz=character.position.z+dz*3.5*dt;
      if(canStand(nx,character.position.z))character.position.x=nx;if(canStand(character.position.x,nz))character.position.z=nz;
      character.rotation.y=Math.atan2(dx,dz);walkTime+=dt*10;
    }
    const swing=moving?Math.sin(walkTime)*.48:0;leftArm.rotation.x=swing;rightArm.rotation.x=-swing;leftLeg.rotation.x=-swing;rightLeg.rotation.x=swing;body.position.y=moving?Math.abs(Math.sin(walkTime))*.055:0;
    let nearest=null,min=3.35;for(const place of places){const d=Math.hypot(character.position.x-place.x,character.position.z-place.z);if(d<min){min=d;nearest=place;}}
    if(nearby?.id!==nearest?.id){nearby=nearest;for(const place of places)labels.get(place.id).classList.toggle('near',place.id===nearby?.id);$('nearby-enter').hidden=!nearby;$('walk-tip').hidden=Boolean(nearby);if(nearby)$('nearby-enter').textContent='進入'+nearby.name;}
    if(!matchMedia('(prefers-reduced-motion: reduce)').matches)ripples.forEach((r,i)=>{r.position.y=-1.39+Math.sin(now*.00065+i)*.018;});
    $('island').dataset.playerX=character.position.x.toFixed(3);$('island').dataset.playerZ=character.position.z.toFixed(3);$('island').dataset.nearby=nearby?.id||'';
    renderer.render(scene,camera);requestAnimationFrame(tick);
  }
  sceneReady=true;$('loading').hidden=true;requestAnimationFrame(tick);
  // 僅提供無個資的瀏覽器 QA 狀態，不改變角色或課程資料。
  Object.defineProperty(window,'islandState',{get:()=>({version:VERSION,ready:sceneReady,position:{x:character.position.x,z:character.position.z},nearby:nearby?.id||null,opened:currentPlace?.id||null,places:places.map(p=>({id:p.id,name:p.name,x:p.x,z:p.z}))})});
}
