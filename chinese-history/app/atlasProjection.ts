/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 中國大陸歷史圖冊投影 v1.0
 * WGS84 Albers：中央經線105°、原點35°、標準緯線25°／47°。
 * 本檔只處理圖冊顯示，不改寫來源歷史範圍或推定現代國界。
 */
import type { MapPoint } from './eastAsiaMap';

const rad = Math.PI / 180;
const e2 = 0.0066943799901413165, e = Math.sqrt(e2);
const q = (phi: number) => {
  const s = Math.sin(phi), es = e * s;
  return (1 - e2) * (s / (1 - es * es) - Math.log((1 - es) / (1 + es)) / (2 * e));
};
const m2 = (phi: number) => Math.cos(phi) ** 2 / (1 - e2 * Math.sin(phi) ** 2);
const n = (m2(25 * rad) - m2(47 * rad)) / (q(47 * rad) - q(25 * rad));
const c = m2(25 * rad) + n * q(25 * rad);
const rho0 = Math.sqrt(c - n * q(35 * rad)) / n;
function forward(lon: number, lat: number): MapPoint {
  const rho = Math.sqrt(c - n * q(lat * rad)) / n, theta = n * (lon - 105) * rad;
  return [rho * Math.sin(theta), rho0 - rho * Math.cos(theta)];
}

// 對稱的圖冊地理視窗；以同一比例縮放兩軸，避免拉寬大陸。
const edge: MapPoint[] = [];
for (let lon = 72; lon <= 142; lon += 1) edge.push(forward(lon, 16), forward(lon, 56));
for (let lat = 16; lat <= 56; lat += 1) edge.push(forward(72, lat), forward(142, lat));
const left = Math.min(...edge.map(p => p[0])), right = Math.max(...edge.map(p => p[0]));
const bottom = Math.min(...edge.map(p => p[1])), top = Math.max(...edge.map(p => p[1]));
const scale = Math.min(1000 / (right - left), 700 / (top - bottom));
const cx = (left + right) / 2, cy = (bottom + top) / 2;
export function projectAtlas(lon: number, lat: number): MapPoint {
  const [x, y] = forward(lon, lat);
  return [500 + (x - cx) * scale, 350 - (y - cy) * scale];
}
export function unprojectAtlas(x: number, y: number): MapPoint {
  const px = (x - 500) / scale + cx, py = (350 - y) / scale + cy;
  const rho = Math.hypot(px, rho0 - py), target = (c - (rho * n) ** 2) / n;
  let phi = Math.asin(Math.max(-1, Math.min(1, target / 2)));
  for (let i = 0; i < 8; i++) {
    const derivative = 2 * (1 - e2) * Math.cos(phi) / (1 - e2 * Math.sin(phi) ** 2) ** 2;
    const correction = (q(phi) - target) / derivative;
    phi -= correction;
    if (Math.abs(correction) < 1e-12) break;
  }
  return [105 + Math.atan2(px, rho0 - py) / n / rad, phi / rad];
}
export const atlasProjection = {
  version: '1.0', width: 1000, height: 700, centralMeridian: 105,
  originLatitude: 35, standardParallels: [25, 47], ellipsoid: 'WGS84',
  reference: 'https://proj.org/en/stable/operations/projections/aea.html',
};
