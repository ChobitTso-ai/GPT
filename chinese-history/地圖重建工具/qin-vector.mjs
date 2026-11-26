/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 秦代向量圖投影還原 v1.0
 * 來源資料：Ian Remsen，Qin dynasty territory.svg，CC0；程式署名不覆蓋資料權利。
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { eastAsiaLand } from "../app/eastAsiaMap.ts";

const rad = Math.PI / 180;
const eccentricity = Math.sqrt(0.0066943799901413165);
function q(phi) {
  const s = Math.sin(phi), es = eccentricity * s;
  return (1 - eccentricity ** 2) * (s / (1 - es ** 2) - Math.log((1 - es) / (1 + es)) / (2 * eccentricity));
}
const m = phi => Math.cos(phi) / Math.sqrt(1 - eccentricity ** 2 * Math.sin(phi) ** 2);
const n = (m(25 * rad) ** 2 - m(37 * rad) ** 2) / (q(37 * rad) - q(25 * rad));
const c = m(25 * rad) ** 2 + n * q(25 * rad);
const rho0 = Math.sqrt(c - n * q(30 * rad)) / n;
export function forwardAlbers([lon, lat]) {
  const rho = Math.sqrt(c - n * q(lat * rad)) / n, theta = n * (lon - 110) * rad;
  return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
}
export function inverseAlbers([x, y]) {
  const rho = Math.hypot(x, rho0 - y), target = (c - (rho * n) ** 2) / n;
  let lo = -Math.PI / 2, hi = Math.PI / 2;
  for (let i = 0; i < 65; i++) { const mid = (lo + hi) / 2; if (q(mid) < target) lo = mid; else hi = mid; }
  return [110 + Math.atan2(x, rho0 - y) / n / rad, (lo + hi) / 2 / rad];
}

// 此來源只用 M/L/H/V/C/S/Z；嚴格拒絕未支援命令，避免靜默誤讀路徑。
function ringsFromPath(d) {
  const tokens = d.match(/[A-Za-z]|[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g) ?? [];
  let i = 0, cmd, x = 0, y = 0, start = [0, 0], ring = [], control = null;
  const rings = [], counts = {m:2,l:2,h:1,v:1,c:6,s:4};
  const add = p => { [x,y] = p; ring.push(p); };
  while (i < tokens.length) {
    if (/^[A-Za-z]$/.test(tokens[i])) cmd = tokens[i++];
    const op = cmd?.toLowerCase(), relative = cmd === op;
    if (op === "z") { if (ring.length > 2) rings.push([...ring, start]); ring = []; [x,y] = start; control = null; cmd = null; continue; }
    if (!counts[op]) throw new Error(`來源路徑命令不支援：${cmd}`);
    const a = tokens.slice(i, i + counts[op]).map(Number); i += counts[op];
    if (a.length !== counts[op] || a.some(v => !Number.isFinite(v))) throw new Error("來源路徑截斷");
    const origin = [relative ? x : 0, relative ? y : 0];
    const point = (j) => [a[j] + origin[0], a[j+1] + origin[1]];
    if (op === "m") { if (ring.length > 2) rings.push(ring); ring = []; start = point(0); add(start); cmd = relative ? "l" : "L"; }
    else if (op === "l") add(point(0));
    else if (op === "h") add([a[0] + origin[0], y]);
    else if (op === "v") add([x, a[0] + origin[1]]);
    else {
      const p0 = [x,y], p1 = op === "c" ? point(0) : control ? [2*x-control[0],2*y-control[1]] : p0;
      const p2 = point(op === "c" ? 2 : 0), p3 = point(op === "c" ? 4 : 2);
      const steps = Math.max(4, Math.ceil((Math.hypot(p1[0]-x,p1[1]-y)+Math.hypot(p2[0]-p1[0],p2[1]-p1[1])+Math.hypot(p3[0]-p2[0],p3[1]-p2[1]))/2));
      for(let j=1;j<=steps;j++){const t=j/steps,u=1-t;add([u**3*p0[0]+3*u*u*t*p1[0]+3*u*t*t*p2[0]+t**3*p3[0],u**3*p0[1]+3*u*u*t*p1[1]+3*u*t*t*p2[1]+t**3*p3[1]]);}
      control = p2;
    }
    if (op !== "c" && op !== "s") control = null;
  }
  if (ring.length > 2) rings.push(ring);
  // SVG填色會隱式閉合；匯出地理環時將閉合點明確保存。
  return rings.map(r=>r[0][0]===r.at(-1)[0]&&r[0][1]===r.at(-1)[1]?r:[...r,r[0]]);
}
const bounds = points => [Math.min(...points.map(p=>p[0])),Math.max(...points.map(p=>p[0])),Math.min(...points.map(p=>p[1])),Math.max(...points.map(p=>p[1]))];
const area = points => Math.abs(points.reduce((s,p,i)=>{const next=points[(i+1)%points.length];return s+p[0]*next[1]-next[0]*p[1];},0)/2);
export async function rebuildQin() {
  const sourceFile = path.join(import.meta.dirname,"來源","Qin_dynasty_territory.svg");
  const svg = await fs.readFile(sourceFile,"utf8");
  if (/<(?:script|foreignObject)\b/i.test(svg)) throw new Error("來源含非地圖內容");
  const landGroup=svg.match(/<g\b[^>]*fill="#fafad1"[^>]*>([\s\S]*?)<\/g>/)?.[1];
  const political=svg.match(/<path\b[^>]*fill="#F5A93D"[^>]*d="([^"]+)"/)?.[1];
  if(!landGroup||!political)throw new Error("來源結構改變，需人工核對");
  const land=[...landGroup.matchAll(/<path\b[^>]*d="([^"]+)"/g)].flatMap(m=>ringsFromPath(m[1]));
  const island=(window)=>land.filter(r=>{const b=bounds(r);return b[0]>window[0]&&b[1]<window[1]&&b[2]>window[2]&&b[3]<window[3];}).sort((a,b)=>area(b)-area(a))[0];
  const hainan=island([330,510,1060,1240]),taiwan=island([800,960,790,1060]),jeju=island([1010,1120,440,530]);
  if(!hainan||!taiwan||!jeju)throw new Error("缺少校準與獨立核對島嶼");
  const geographic=eastAsiaLand.map(r=>r.map(([x,y])=>[70+x*75/1000,57-y*41/600]));
  const naturalIsland=window=>geographic.filter(r=>{const b=bounds(r);return b[0]>window[0]&&b[1]<window[1]&&b[2]>window[2]&&b[3]<window[3];}).sort((a,b)=>area(b)-area(a))[0];
  const nh=naturalIsland([108,112,17,21]),nt=naturalIsland([119,123,21,26]),nj=naturalIsland([125,128,32,35]);
  if(!nh||!nt||!nj)throw new Error("Natural Earth核對島嶼缺失");
  // 兩座相距較遠的島嶼中心定位；避免用單一小島的取樣誤差推估全圖比例。
  const rawH=bounds(nh.map(forwardAlbers).map(([x,y])=>[x,-y]));
  const rawT=bounds(nt.map(forwardAlbers).map(([x,y])=>[x,-y]));
  const center=b=>[(b[0]+b[1])/2,(b[2]+b[3])/2];
  const [rh,rt,ph,pt]=[rawH,rawT,bounds(hainan),bounds(taiwan)].map(center);
  const dr=rt.map((v,i)=>v-rh[i]),dp=pt.map((v,i)=>v-ph[i]);
  const scale=(dr[0]*dp[0]+dr[1]*dp[1])/(dr[0]**2+dr[1]**2);
  const calibration={scale,tx:(ph[0]+pt[0]-scale*(rh[0]+rt[0]))/2,ty:(ph[1]+pt[1]-scale*(rh[1]+rt[1]))/2};
  const toSvg=([x,y])=>[x*calibration.scale+calibration.tx,-y*calibration.scale+calibration.ty];
  const predictedJeju=bounds(nj.map(forwardAlbers).map(toSvg)),actualJeju=bounds(jeju);
  const holdoutError=Math.max(...predictedJeju.map((v,i)=>Math.abs(v-actualJeju[i])));
  if(holdoutError>4)throw new Error(`未參與擬合的濟州海岸定位不符：${holdoutError.toFixed(3)}SVG單位 `+JSON.stringify({calibration,predictedJeju,actualJeju}));
  const territory=ringsFromPath(political).sort((a,b)=>area(b)-area(a))[0];
  const geometry=territory.map(([x,y])=>inverseAlbers([(x-calibration.tx)/calibration.scale,-(y-calibration.ty)/calibration.scale]).map(v=>Number(v.toFixed(5))));
  return {geometry,audit:{version:"1.0",source:"https://commons.wikimedia.org/wiki/File:Qin_dynasty_territory.svg",author:"Ian Remsen",license:"CC0 1.0",projection:"Albers／WGS84橢球，中央經線110°、原點30°、標準緯線25°與37°",calibration,calibrationIslands:["海南現代海岸中心","台灣現代海岸中心"],holdoutIsland:"濟州現代海岸",holdoutMaxSvgUnits:holdoutError,predictedJeju,actualJeju,points:geometry.length,limitation:"核對的是投影定位，不是古代疆域史實；原圖為秦代時段概略範圍，不指定前210年。只取主要大陸範圍，未推定島嶼控制。"}};
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 const result=await rebuildQin(); console.log(JSON.stringify(result.audit,null,2));
}
