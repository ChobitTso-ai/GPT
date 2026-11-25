/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 三國262年點陣輪廓重建 v1.1
 * 來源：Zhoudadudu，ThreeKingdoms262.png，CC BY-SA 4.0。
 * 墨卡托模型為控制點推定，不宣稱作者公開了原始CRS。
 */
import fs from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {createRequire} from 'node:module';
import {eastAsiaLand} from '../app/eastAsiaMap.ts';
import {hanChangan,hanWeiLuoyang} from '../app/historicalMapSites.ts';
const sharp=createRequire(import.meta.url)('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const rad=Math.PI/180;
const mercatorY=lat=>Math.log(Math.tan(Math.PI/4+lat*rad/2))/rad;
export const controls=[
 ['薊',2398.91,354.50,116.35,39.90],['姑臧',1188.93,578.93,102.64,37.93],
 ['晉陽',2056.41,599.86,112.44,37.73],['臨淄',2571,693.67,118.30,36.82],
 ['洛陽',2063.81,932.50,hanWeiLuoyang.lon,hanWeiLuoyang.lat],['長安',1736.98,972.95,hanChangan.lon,hanChangan.lat],
 ['成都',1316.82,1351.82,104.05,30.67],['建業',2609.81,1209.84,118.80,32.06],
 ['番禺',2127.20,2097.66,113.26,23.13],
];
export function fitMercator(points=controls){
 const n=points.length,mean=d=>points.reduce((s,p)=>s+d(p),0)/n;
 const a=mean(p=>p[3]),b=mean(p=>mercatorY(p[4])),px=mean(p=>p[1]),py=mean(p=>p[2]);
 const scale=points.reduce((s,p)=>s+(p[3]-a)*(p[1]-px)-(mercatorY(p[4])-b)*(p[2]-py),0)/points.reduce((s,p)=>s+(p[3]-a)**2+(mercatorY(p[4])-b)**2,0);
 return {scale,tx:px-scale*a,ty:py+scale*b};
}
export function toPixel([lon,lat],p=fitMercator()){return [p.scale*lon+p.tx,-p.scale*mercatorY(lat)+p.ty];}
export function toGeo([x,y],p=fitMercator()){return [(x-p.tx)/p.scale,(2*Math.atan(Math.exp((p.ty-y)/p.scale*rad))-Math.PI/2)/rad];}
const area=r=>r.reduce((s,p,i)=>{const q=r[(i+1)%r.length];return s+p[0]*q[1]-q[0]*p[1];},0)/2;
const bounds=r=>[Math.min(...r.map(p=>p[0])),Math.max(...r.map(p=>p[0])),Math.min(...r.map(p=>p[1])),Math.max(...r.map(p=>p[1]))];
const segmentDistance=(p,a,b)=>{const dx=b[0]-a[0],dy=b[1]-a[1],den=dx*dx+dy*dy,t=den?Math.max(0,Math.min(1,((p[0]-a[0])*dx+(p[1]-a[1])*dy)/den)):0;return Math.hypot(p[0]-a[0]-t*dx,p[1]-a[1]-t*dy);};
function openAtSourceCut(ring){
 const paths=[];let current=[];
 for(let i=0;i<ring.length-1;i++){
  const a=ring[i],b=ring[i+1];
  // 簡化可能把貼近圖框的短邊併成斜弦；兩端任一觸及截界即斷開。
  if(a[1]<=4||b[1]<=4){if(current.length>1)paths.push(current);current=[];continue;}
  if(!current.length)current.push(a);current.push(b);
 }
 if(current.length>1)paths.push(current);
 return paths;
}
function simplify(points,tolerance=1.2){
 if(points.length<3)return points;
 const a=points[0],b=points.at(-1),dx=b[0]-a[0],dy=b[1]-a[1],length=dx*dx+dy*dy;
 let max=0,index=0;
 for(let i=1;i<points.length-1;i++){
  const t=length?Math.max(0,Math.min(1,((points[i][0]-a[0])*dx+(points[i][1]-a[1])*dy)/length)):0;
  const d=Math.hypot(points[i][0]-a[0]-t*dx,points[i][1]-a[1]-t*dy);
  if(d>max){max=d;index=i;}
 }
 return max>tolerance?[...simplify(points.slice(0,index+1),tolerance).slice(0,-1),...simplify(points.slice(index),tolerance)]:[a,b];
}
function contours(labels,w,h,region){
 const stride=w+1,edges=new Map();
 const add=(a,b)=>{const existing=edges.get(a);if(existing)existing.push(b);else edges.set(a,[b]);};
 for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
  const i=y*w+x;if(labels[i]!==region)continue;
  const p=y*stride+x;
  if(labels[i-w]!==region)add(p,p+1);
  if(labels[i+1]!==region)add(p+1,p+1+stride);
  if(labels[i+w]!==region)add(p+1+stride,p+stride);
  if(labels[i-1]!==region)add(p+stride,p);
 }
 const result=[];
 while(edges.size){
  const first=edges.keys().next().value,ring=[];let current=first,previous=first-1;
  do{
   ring.push([current%stride,Math.floor(current/stride)]);
   const choices=edges.get(current);if(!choices?.length)throw new Error('輪廓未閉合');
   // 接角處優先右轉，使僅以角相接的區塊保持分開。
   const vx=current%stride-previous%stride,vy=Math.floor(current/stride)-Math.floor(previous/stride);
   const score=end=>{const dx=end%stride-current%stride,dy=Math.floor(end/stride)-Math.floor(current/stride);return vx*dy-vy*dx===1?3:vx*dx+vy*dy===1?2:1;};
   choices.sort((a,b)=>score(b)-score(a));
   const next=choices.shift();if(!choices.length)edges.delete(current);previous=current;current=next;
   if(ring.length>w*h)throw new Error('輪廓迴圈失效');
  }while(current!==first);
  ring.push(ring[0]);
  if(area(ring)>1000)result.push(simplify(ring));
 }
 return result.sort((a,b)=>area(b)-area(a));
}
export async function rebuildThree(sourceFile){
 const bytes=await fs.readFile(sourceFile);
 const sha256=createHash('sha256').update(bytes).digest('hex').toUpperCase();
 if(sha256!=='7B0A82EFB767F07072B57EED450BD1426B679B2C6060FF9F4AF7D5DA94BDE6D7')throw new Error('來源版本不符，需重新查核');
 const {data,info}=await sharp(bytes).removeAlpha().raw().toBuffer({resolveWithObject:true}),w=info.width,h=info.height;
 if(w!==3840||h!==2715)throw new Error('來源尺寸改變');
 // 16州填色：1魏、2蜀、3吳；不以現代行政區作歷史疆域。
 const palette=[['e9ffbe',1],['e8beff',1],['beffe8',1],['bee8ff',1],['ffbee8',1],['ffffbe',1],['cccccc',1],['f5f57a',1],['ffbebe',1],['ffebbe',1],['ffaa00',1],['ffd37f',3],['98e600',1],['d1ff73',3],['9ebbd7',2],['d7b09e',3]].map(([hex,id])=>({rgb:[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16)),id}));
 let labels=new Uint8Array(w*h);
 for(let i=0;i<labels.length;i++){
  const x=i%w,y=Math.floor(i/w);if(x<3||y<3||x>w-4||y>h-4||x>3100&&y>1400)continue; // 排除圖框、圖例；河西北緣另記來源截界。
  const pixel=[data[i*3],data[i*3+1],data[i*3+2]];
  let best=Infinity,id=0;for(const color of palette){const d=color.rgb.reduce((s,v,j)=>s+(v-pixel[j])**2,0);if(d<best){best=d;id=color.id;}}
  if(best<100)labels[i]=id;
 }
 // 只補灰黑邊線及標字造成的小孔；不向白底／海洋擴張。
 for(let pass=0;pass<3;pass++){
  const next=labels.slice();
  for(let y=1;y<h-1;y++)for(let x=1;x<w-1;x++){
   const i=y*w+x;if(labels[i]||x>3100&&y>1400)continue;
   const p=i*3,r=data[p],g=data[p+1],b=data[p+2];
   if(x<3||y<3||x>w-4||y>h-4||Math.min(r,g,b)>247||b>180&&g<150&&r<100)continue;
   const votes=[0,0,0,0];for(const j of [i-1,i+1,i-w,i+w])votes[labels[j]]++;
   let selected=0;for(let id=1;id<4;id++)if(votes[id]>votes[selected]||selected===0&&votes[id])selected=id;
   if(selected)next[i]=selected;
  }
  labels=next;
 }
 // 沿原圖既有永昌郡界辨識，不憑空畫實控界，也不把全郡宣稱為非實控區。
 // 嚴格沿益州底色洪水填充，黑色郡界作阻擋；不能用上方已補過邊線的 labels。
 const countyLabels=new Uint8Array(w*h),queue=new Int32Array(w*h);
 const seed=[750,1950],isYi=i=>[158,187,215].reduce((s,v,j)=>s+(v-data[i*3+j])**2,0)<100;
 const start=seed[1]*w+seed[0];
 if(!isYi(start))throw new Error('永昌郡來源種子不在益州底色');
 let tail=1;queue[0]=start;countyLabels[start]=1;
 for(let head=0;head<tail;head++){
  const i=queue[head],x=i%w,y=Math.floor(i/w);
  if(x<=0||x>=w-1||y<=0||y>=h-1)throw new Error('永昌郡辨識碰到來源圖框');
  for(const n of [i-1,i+1,i-w,i+w])if(!countyLabels[n]&&isYi(n)){
   countyLabels[n]=1;queue[tail++]=n;
  }
 }
 const countyRings=contours(countyLabels,w,h,1);
 if(countyRings.length!==1||tail<170000||tail>195000)throw new Error('永昌郡辨識越過郡界或不完整');
 const countyBounds=bounds(countyRings[0]);
 if(countyBounds[0]<575||countyBounds[1]>1165||countyBounds[2]<1570||countyBounds[3]>2295)throw new Error('永昌郡來源範圍失效');
 const pixelRings=Object.fromEntries(['wei','shu','wu'].map((key,i)=>[key,contours(labels,w,h,i+1)]));
 const calibration=fitMercator();
 const residuals=controls.map(p=>({name:p[0],pixels:Math.hypot(...toPixel(p.slice(3),calibration).map((v,i)=>v-p[i+1]))}));
 const hainan=pixelRings.wu.find(r=>{const b=bounds(r.map(p=>toGeo(p,calibration)));return b[0]>108&&b[1]<112&&b[2]>17&&b[3]<21;});
 if(!hainan)throw new Error('來源海南輪廓未識別');
 const naturalHainan=eastAsiaLand.map(r=>r.map(([x,y])=>[70+x*75/1000,57-y*41/600])).filter(r=>r.length>15&&r.every(([x,y])=>x>108&&x<112&&y>17&&y<21)).sort((a,b)=>b.length-a.length)[0];
 const predicted=bounds(naturalHainan.map(p=>toPixel(p,calibration))),observed=bounds(hainan);
 const holdoutHainanMaxPixels=Math.max(...predicted.map((v,i)=>Math.abs(v-observed[i])));
 const predictedCoast=naturalHainan.map(p=>toPixel(p,calibration));
 const nearest=(p,ring)=>Math.min(...ring.slice(1).map((b,i)=>segmentDistance(p,ring[i],b)));
 const coastDistances=[...hainan.map(p=>nearest(p,predictedCoast)),...predictedCoast.map(p=>nearest(p,hainan))];
 const holdoutCoastMaxPixels=Math.max(...coastDistances),holdoutCoastRmsePixels=Math.sqrt(coastDistances.reduce((s,v)=>s+v*v,0)/coastDistances.length);
 const dunhuang={name:'敦煌',sourcePixel:[484.25,325.5],approxLonLat:[94.66,40.14]};
 dunhuang.residualPixels=Math.hypot(...toPixel(dunhuang.approxLonLat,calibration).map((v,i)=>v-dunhuang.sourcePixel[i]));
 // 門檻先行固定；失敗就保留候選，不能輸出到網站。
 if(holdoutHainanMaxPixels>10||holdoutCoastMaxPixels>15||dunhuang.residualPixels>8||Math.max(...residuals.map(p=>p.pixels))>12)throw new Error('獨立配準檢核未通過');
 const audit={version:'1.0',source:'https://commons.wikimedia.org/wiki/File:ThreeKingdoms262.png',author:'Zhoudadudu，2023',license:'CC BY-SA 4.0',sha256,width:w,height:h,calibration,method:'推定標準球面墨卡托，單一等向縮放與平移；非作者原始CRS聲明',controls,residuals,holdoutDunhuang:dunhuang,holdoutHainan:{predicted,observed,maxPixels:holdoutHainanMaxPixels,coastMaxPixels:holdoutCoastMaxPixels,coastRmsePixels:holdoutCoastRmsePixels},sourceCut:'河西北緣與來源圖框相交；填色止於資料範圍，但該段不繪政治邊線，並在介面說明。',rings:Object.fromEntries(Object.entries(pixelRings).map(([k,r])=>[k,r.map(p=>({points:p.length,areaPixels:area(p),bounds:bounds(p.map(q=>toGeo(q,calibration)))}))])),limitation:'城市點為近似歷史位置；地理配準不代表疆界已獨立完成史學核對。小於1000像素的孤立色塊及內部湖泊／文字孔不作政治邊界；原圖為郡級範圍示意。'};
 const convert=p=>toGeo(p,calibration).map(v=>+v.toFixed(5));
 audit.version='1.1';
 audit.cityReference='https://whc.unesco.org/en/list/1442/maps/';
 audit.yongchang={seed,areaPixels:tail,boundsPixels:countyBounds,points:countyRings[0].length,note:'依原來源永昌郡底色與郡界辨識；全郡斜線只提示西南界／控制程度待核，不是新增國界或認定全郡未受控制。'};
 return {pixelRings,geometry:Object.fromEntries(Object.entries(pixelRings).map(([k,r])=>[k,r.map(p=>p.map(convert))])),boundaryGeometry:Object.fromEntries(Object.entries(pixelRings).map(([k,r])=>[k,r.flatMap(openAtSourceCut).map(line=>line.map(convert))])),uncertainGeometry:{shu:countyRings.map(r=>r.map(convert))},audit};
}
