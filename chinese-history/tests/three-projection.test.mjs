/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 三國圖重建測試 v1.0
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {toGeo,toPixel,rebuildThree} from '../地圖重建工具/three-raster.mjs';
import {hanChangan,hanWeiLuoyang} from '../app/historicalMapSites.ts';
test('推定墨卡托在東亞範圍單調且可往返',()=>{
 for(let lon=70;lon<=145;lon+=5)for(let lat=16;lat<=57;lat+=4){
  const point=toGeo(toPixel([lon,lat]));
  assert(Math.abs(point[0]-lon)<1e-9&&Math.abs(point[1]-lat)<1e-9);
  assert(toPixel([lon+1,lat])[0]>toPixel([lon,lat])[0]);
  assert(toPixel([lon,lat+1])[1]<toPixel([lon,lat])[1]);
 }
});
test('三國獨立定位、同時點輪廓、海南及來源截界可重建',async()=>{
 const source=fileURLToPath(new URL('../地圖重建工具/來源/ThreeKingdoms262-3840.png',import.meta.url));
 const r=await rebuildThree(source);
 assert(r.audit.holdoutDunhuang.residualPixels<=8);
 assert(r.audit.holdoutHainan.maxPixels<=10);
 assert(r.audit.holdoutHainan.coastMaxPixels<=15);
 assert.deepEqual(Object.values(r.geometry).map(rings=>rings.length),[1,1,2]);
 const inside=(point,ring)=>{let result=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){
  const a=ring[i],b=ring[j];if((a[1]>point[1])!==(b[1]>point[1])&&point[0]<(b[0]-a[0])*(point[1]-a[1])/(b[1]-a[1])+a[0])result=!result;
 }return result;};
 for(const [key,point] of [['wei',[hanWeiLuoyang.lon,hanWeiLuoyang.lat]],['shu',[104.07,30.67]],['wu',[118.8,32.06]]]){
  assert(r.geometry[key].some(ring=>inside(point,ring)),`${key}缺少都城`);
 }
 for(const rings of Object.values(r.geometry))for(const ring of rings){
  assert.deepEqual(ring[0],ring.at(-1));
  assert(ring.every(([lon,lat])=>lon>90&&lon<131&&lat>16&&lat<44));
 }
 assert(inside([109.5,19.2],r.geometry.wu[1]),'海南依本圖來源呈現，不憑現代國界推定');
 assert(!r.geometry.wu.some(ring=>inside([121,23.7],ring)),'不虛構台灣控制權');
 const cutLatitude=Math.max(...r.geometry.wei.flatMap(ring=>ring.map(p=>p[1])));
 assert.notDeepEqual(r.boundaryGeometry.wei[0][0],r.boundaryGeometry.wei[0].at(-1),'裁切處的政治邊線必須斷開');
 assert(r.boundaryGeometry.wei.flat().every(p=>p[1]<cutLatitude),'不得以簡化後的斜弦封閉圖框');
 for(const line of r.boundaryGeometry.wei)for(let i=1;i<line.length;i++){
  assert(!(line[i-1][1]===cutLatitude&&line[i][1]===cutLatitude),'來源圖框不得畫成政治邊界');
 }
 const snapshot=JSON.parse(await readFile(new URL('../app/mapSnapshots.json',import.meta.url),'utf8'))['three-kingdoms'];
 assert.equal(snapshot.year,'西元262年');
 assert.equal(snapshot.source,r.audit.source);
 assert.equal(snapshot.license,'CC BY-SA 4.0');
 assert(snapshot.cityReference.note.includes('漢魏洛陽故城'));
 assert.equal(new URL(snapshot.cityReference.url).hostname,'whc.unesco.org');
 assert.deepEqual(snapshot.uncertainGeometry,r.uncertainGeometry);
 assert.equal(r.uncertainGeometry.shu.length,1);
 assert(inside([99.17,25.12],r.uncertainGeometry.shu[0]),'永昌郡示意須含保山一帶');
 assert(!inside([104.07,30.67],r.uncertainGeometry.shu[0]),'不得把成都或全蜀塗成待核區');
 assert(r.audit.yongchang.areaPixels>170000&&r.audit.yongchang.areaPixels<195000,'來源郡界不能與鄰郡串通');
 const changanControl=r.audit.controls.find(p=>p[0]==='長安');
 assert.deepEqual(changanControl.slice(3),[hanChangan.lon,hanChangan.lat]);
 for(const [key,rings] of Object.entries(r.geometry)){
  assert.deepEqual(snapshot.geometry[key],rings[0]);
  assert.deepEqual(snapshot.extraGeometry[key],rings.slice(1));
 }
 assert.deepEqual(snapshot.boundaryGeometry,r.boundaryGeometry);
});
