/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 秦圖投影回歸測試 v1.0
 */
import test from "node:test";
import assert from "node:assert/strict";
import {readFile} from "node:fs/promises";
import { forwardAlbers, inverseAlbers, rebuildQin } from "../地圖重建工具/qin-vector.mjs";
import {qinXianyang} from '../app/historicalMapSites.ts';

test("Albers在完整東亞視窗可往返還原經緯度",()=>{
 for(let lon=70;lon<=145;lon+=5)for(let lat=16;lat<=57;lat+=4){
  const restored=inverseAlbers(forwardAlbers([lon,lat]));
  assert(Math.abs(restored[0]-lon)<1e-8);
  assert(Math.abs(restored[1]-lat)<1e-8);
 }
});
test("秦圖來源定位通過未參與擬合的海岸檢核",async()=>{
 const {geometry,audit}=await rebuildQin();
 assert(audit.holdoutMaxSvgUnits<=4);
 assert.equal(audit.holdoutIsland,"濟州現代海岸");
 assert(geometry.length>1000);
 assert.deepEqual(geometry[0],geometry.at(-1));
 assert(geometry.every(([lon,lat])=>Number.isFinite(lon)&&Number.isFinite(lat)&&lon>70&&lon<145&&lat>16&&lat<57));
 const inside=([x,y])=>{let result=false;for(let i=0,j=geometry.length-1;i<geometry.length;j=i++){
  const [xi,yi]=geometry[i],[xj,yj]=geometry[j];
  if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)result=!result;
 }return result;};
 assert(inside([qinXianyang.lon,qinXianyang.lat]),"秦都宮殿區應位於大陸主要範圍內");
 assert(!inside([121,23.7]),"不推定台灣控制權");
 assert(!inside([109.5,19.2]),"不推定海南控制權");
 const snapshots=JSON.parse(await readFile(new URL("../app/mapSnapshots.json",import.meta.url),"utf8"));
 assert.equal(snapshots.qin.license,"CC0 1.0");
 assert(snapshots.qin.year.includes("221–206"));
 assert(!snapshots.qin.year.includes("210"),"不得將時段來源誤標為前210年定點");
 assert.deepEqual(snapshots.qin.geometry["qin-period"],geometry);
 assert.equal(snapshots["three-kingdoms"].year,"西元262年");
});
