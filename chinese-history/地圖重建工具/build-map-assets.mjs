/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 地圖資料重建工具 v1.4
 * 秦資料CC0，三國資料CC BY-SA；程式署名不覆蓋第三方資料授權。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";
import { rebuildQin } from "./qin-vector.mjs";
import { rebuildThree } from "./three-raster.mjs";
import { mapSiteReferences } from "../app/historicalMapSites.ts";
const sharp=createRequire(import.meta.url)("C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp");
const project=path.resolve(import.meta.dirname,".."),source=process.argv[2];
if(!source)throw new Error("請提供Natural Earth來源資料夾，或--snapshots-only只重建疆域資料");
const out=path.join(project,"public","maps-v18");
let terrainAudit;
if(source!=="--snapshots-only"){
 const terrain=path.join(source,"terrain","NE2_50M_SR_W","NE2_50M_SR_W.tif");
 const tfw=(await fs.readFile(path.join(path.dirname(terrain),"NE2_50M_SR_W.tfw"),"utf8")).trim().split(/\s+/).map(Number);
 const meta=await sharp(terrain).metadata();
 if(meta.width!==10800||meta.height!==5400||Math.abs(tfw[0]-1/30)>1e-8)throw new Error("來源地理配準不符預期");
 await fs.mkdir(out,{recursive:true});
 await sharp(terrain).extract({left:7500,top:990,width:2250,height:1230}).resize(2000,1200,{fit:"fill"}).modulate({saturation:.65,brightness:1.04}).webp({quality:88}).toFile(path.join(out,"china-relief.webp"));
 terrainAudit={width:meta.width,height:meta.height,worldFile:tfw};
}else{
 terrainAudit=JSON.parse(await fs.readFile(path.join(import.meta.dirname,"配準紀錄.json"),"utf8")).terrain;
}
const qin=await rebuildQin();
const three=await rebuildThree(path.join(import.meta.dirname,"來源","ThreeKingdoms262-3840.png"));
const riverSource=JSON.parse(await fs.readFile(path.join(import.meta.dirname,"來源","ne_10m_wei_river.geojson"),'utf8'));
const weiRiver=riverSource.features.find(f=>f.properties.name==='Wei'&&f.properties.featurecla==='River');
if(!weiRiver||weiRiver.geometry.type!=='MultiLineString')throw new Error('缺少渭河原始地理資料');
await fs.writeFile(path.join(project,'app','atlasReferenceRivers.json'),JSON.stringify({source:riverSource.source,sourceSha256:riverSource.sourceSha256,license:riverSource.license,rivers:weiRiver.geometry.coordinates.map(points=>({name:'渭河',points}))},null,2)+'\n');
const data={
 qin:{year:"秦代（西元前221–206年）",title:"秦帝國：山河與郡縣",note:"概括秦統一後逐步擴張的範圍，不代表前221年已同時控制全部地區。界線仍是歷史示意；河流作現代地理參照。",regions:[{key:"qin-period",name:"秦"}],geometry:{"qin-period":qin.geometry},labels:{"qin-period":[113,34]},capitals:["咸陽"],source:"https://commons.wikimedia.org/wiki/File:Qin_dynasty_territory.svg",credit:"Ian Remsen，2025；本專案依來源公開Albers參數還原經緯度、擷取大陸政治範圍；來源作者參考Li Feng（2013）第247頁",license:"CC0 1.0",licenseUrl:"https://creativecommons.org/publicdomain/zero/1.0/"},
 "three-kingdoms":{year:"西元262年",title:"三國山河：魏、蜀、吳",note:"同一時點的魏、蜀漢與孫吳郡級範圍示意。河西北緣超出來源圖幅，該段不畫政治邊線；河流及海岸作現代地理參照。",regions:[{key:"wei",name:"魏"},{key:"shu",name:"蜀"},{key:"wu",name:"吳"}],geometry:Object.fromEntries(Object.entries(three.geometry).map(([key,rings])=>[key,rings[0]])),extraGeometry:Object.fromEntries(Object.entries(three.geometry).map(([key,rings])=>[key,rings.slice(1)])),boundaryGeometry:three.boundaryGeometry,labels:{wei:[115,37.4],shu:[102.8,28],wu:[115.5,26.8]},capitals:["洛陽","成都","建業"],source:three.audit.source,credit:"Zhoudadudu，2023；本專案依州郡填色擷取輪廓、推定墨卡托配準並簡化；不是原作者CRS聲明或精密疆界",license:"CC BY-SA 4.0",licenseUrl:"https://creativecommons.org/licenses/by-sa/4.0/",cityReference:{name:"漢魏洛陽故城：官方遺址介紹",url:"https://www.ndrc.gov.cn/xwdt/ztzl/dyhgjwhgy/202209/t20220921_1335876_ext.html",note:"三國洛陽標記指漢魏洛陽故城附近，不是今日市中心；座標為圖冊尺度近似，不能用於遺址導航。"}}
};
data.qin.cityReference=mapSiteReferences.qin;
data.qin.note+=" 咸陽位於關中平原、渭河北岸。";
const threeScene=data['three-kingdoms'];
threeScene.cityReference=mapSiteReferences.hanWei;
threeScene.uncertainGeometry=three.uncertainGeometry;
threeScene.uncertainArea={name:'永昌郡',label:[98.6,24.4],note:'斜線區沿來源永昌郡範圍，提示西南界與控制程度仍待核對；不是認定全郡未受控制，也不能把色塊當作三國完整實控面積比例。'};
threeScene.note="西元262年的魏、蜀漢與孫吳郡級範圍示意。蜀西南永昌郡另以斜線提示待核；魏河西北緣有來源截界，未畫出西域的完整關係，不能據此比較三國完整實控面積。";
await fs.writeFile(path.join(project,"app","mapSnapshots.json"),JSON.stringify(data,null,2)+"\n");
await fs.writeFile(path.join(import.meta.dirname,"配準紀錄.json"),JSON.stringify({version:"1.4",bounds:{west:70,east:145,north:57,south:16},terrain:terrainAudit,qin:qin.audit,three:three.audit,limitation:"秦為原投影還原；三國已統一古城控制點，仍是郡級示意，永昌郡斜線僅提示待核；不是完整實控疆界或面積比例定稿。"},null,2)+"\n");
console.log(JSON.stringify({qinHoldoutSvgUnits:qin.audit.holdoutMaxSvgUnits,threeHainanMaxPixels:three.audit.holdoutHainan.coastMaxPixels,threeDunhuangPixels:three.audit.holdoutDunhuang.residualPixels}));
