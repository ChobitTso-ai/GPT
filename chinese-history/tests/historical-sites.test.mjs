/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 古城與渭河的地理關係回歸 v1.0
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {qinXianyang,hanChangan,hanWeiLuoyang} from '../app/historicalMapSites.ts';

test('秦都宮殿區與漢長安分處渭河兩側，未混用今日咸陽或西安點位',async()=>{
 const data=JSON.parse(await readFile(new URL('../app/atlasReferenceRivers.json',import.meta.url),'utf8'));
 const points=data.rivers.flatMap(r=>r.points);
 const crossings=points.slice(1).flatMap((b,i)=>{
  const a=points[i],lon=qinXianyang.lon;
  if((a[0]<=lon&&lon<b[0])||(b[0]<=lon&&lon<a[0]))return [a[1]+(b[1]-a[1])*(lon-a[0])/(b[0]-a[0])];
  return [];
 });
 assert(crossings.length>0,'渭河須經過古都附近經度');
 assert(crossings.every(lat=>lat<qinXianyang.lat&&lat>hanChangan.lat),'古都須在河流正確一側');
 assert(qinXianyang.lon>108.8&&qinXianyang.lon<108.9&&qinXianyang.lat>34.4);
 // UNESCO 世界遺產 1442-001／002 公布的代表點，僅作圖冊定位。
 assert(Math.abs(hanChangan.lon-108.8572222222)<1e-8);
 assert(Math.abs(hanChangan.lat-34.3044444444)<1e-8);
 assert(Math.abs(hanWeiLuoyang.lon-112.6213888889)<1e-8);
 assert(Math.abs(hanWeiLuoyang.lat-34.7311111111)<1e-8);
});

test('渭河資料保留來源原始折線，不為迎合古城移動河道',async()=>{
 const source=JSON.parse(await readFile(new URL('../地圖重建工具/來源/ne_10m_wei_river.geojson',import.meta.url),'utf8'));
 const displayed=JSON.parse(await readFile(new URL('../app/atlasReferenceRivers.json',import.meta.url),'utf8'));
 assert.equal(source.license,'Public domain');
 assert.equal(source.features.length,1);
 assert.equal(source.features[0].properties.name,'Wei');
 assert.equal(source.features[0].geometry.type,'MultiLineString');
 assert.deepEqual(displayed.rivers.map(r=>r.points),source.features[0].geometry.coordinates);
 assert(displayed.rivers.flatMap(r=>r.points).length>250);
 assert.equal(new URL(displayed.source).hostname,'raw.githubusercontent.com');
});
