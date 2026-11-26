/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 歷史圖冊底板重建 v1.0
 * Natural Earth公開領域地形重投影；不生成虛構山脈或政治疆界。
 */
import fs from 'node:fs/promises';
import path from 'node:path';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { unprojectAtlas, atlasProjection } from '../app/atlasProjection.ts';
const sharp = createRequire(import.meta.url)('C:/Users/user/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/sharp');
const project = path.resolve(import.meta.dirname, '..');
const input = path.join(project, 'public/maps-v18/china-relief.webp');
const { data: source, info } = await sharp(input).removeAlpha().raw().toBuffer({ resolveWithObject: true });
if (info.width !== 2000 || info.height !== 1200) throw Error('既有地形地理配準尺寸改變，須重新核對');
const width = 2400, height = 1680, pixels = Buffer.alloc(width * height * 4);
let sampled = 0;
for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
  const [lon, lat] = unprojectAtlas((x + .5) * 1000 / width, (y + .5) * 700 / height);
  const sx = (lon - 70) / 75 * info.width - .5, sy = (57 - lat) / 41 * info.height - .5;
  if (sx < 0 || sy < 0 || sx >= info.width - 1 || sy >= info.height - 1) continue;
  const ix = Math.floor(sx), iy = Math.floor(sy), fx = sx - ix, fy = sy - iy;
  const rgb = [0, 1, 2].map(channel => {
    const a = source[(iy * info.width + ix) * 3 + channel];
    const b = source[(iy * info.width + ix + 1) * 3 + channel];
    const c = source[((iy + 1) * info.width + ix) * 3 + channel];
    const d = source[((iy + 1) * info.width + ix + 1) * 3 + channel];
    return (a * (1 - fx) + b * fx) * (1 - fy) + (c * (1 - fx) + d * fx) * fy;
  });
  // 只將既有地形明暗轉成暖色陰影，不把色值當成高程或繪製假等高線。
  const shade = rgb[0] * .25 + rgb[1] * .65 + rgb[2] * .1 - 195;
  const i = (y * width + x) * 4;
  pixels[i] = Math.max(0, Math.min(255, 239 + shade * .32));
  pixels[i + 1] = Math.max(0, Math.min(255, 233 + shade * .36));
  pixels[i + 2] = Math.max(0, Math.min(255, 214 + shade * .42));
  pixels[i + 3] = 255; sampled++;
}
const output = path.join(project, 'public/maps-v18/china-atlas-albers.webp');
await sharp(pixels, { raw: { width, height, channels: 4 } }).webp({ quality: 88, alphaQuality: 100 }).toFile(output);
const data = await fs.readFile(output), original = await fs.readFile(input);
const coastFile = path.join(import.meta.dirname, '來源/ne_50m_coastline.geojson');
const coastSource = await fs.readFile(coastFile);
const coastGeo = JSON.parse(coastSource.toString('utf8'));
const coastLines = [];
for (const feature of coastGeo.features) {
  if (feature.properties.featurecla !== 'Coastline') throw Error('海岸資料混入其他要素');
  const { type, coordinates } = feature.geometry;
  if (!['LineString', 'MultiLineString'].includes(type)) throw Error('海岸線型別改變');
  for (const line of type === 'LineString' ? [coordinates] : coordinates) {
    let part = [];
    const flush = () => { if (part.length > 1) coastLines.push(part); part = []; };
    for (const [lon, lat] of line) {
      if (lon >= 70 && lon <= 145 && lat >= 16 && lat <= 57) part.push([lon, lat]);
      else flush();
    }
    flush();
  }
}
const coast = {
  source: 'https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_coastline.geojson',
  license: '公開領域', featureClass: 'Coastline',
  sourceSha256: createHash('sha256').update(coastSource).digest('hex').toUpperCase(),
  lines: coastLines,
};
await fs.writeFile(path.join(project, 'app/atlasCoast.json'), JSON.stringify(coast) + '\n');
const audit = {
  version: '1.0', projection: atlasProjection, output: 'public/maps-v18/china-atlas-albers.webp',
  width, height, bytes: data.length, sha256: createHash('sha256').update(data).digest('hex').toUpperCase(),
  source: 'https://www.naturalearthdata.com/downloads/50m-raster-data/50m-natural-earth-2/',
  license: '公開領域', sourceFile: 'public/maps-v18/china-relief.webp',
  sourceSha256: createHash('sha256').update(original).digest('hex').toUpperCase(),
  sourceBounds: { west: 70, east: 145, north: 57, south: 16 },
  sampledPixels: sampled,
  coast: { source: coast.source, sourceSha256: coast.sourceSha256, featureClass: coast.featureClass,
    lines: coastLines.length, points: coastLines.reduce((sum, line) => sum + line.length, 0),
    note: '使用真正海岸線，不描邊相鄰陸地環，避免顯示現代行政邊線；圖幅外斷線，不沿裁切框封口。' },
  method: 'WGS84 Albers反投影取樣、雙線性內插、暖色明暗；網站依同投影海岸遮罩去除海底紋理。',
  limitation: '理想化現代地形陰影，不是古代地貌、高程模型或歷史疆界證據；來源之外不補畫地形。',
};
await fs.writeFile(path.join(import.meta.dirname, '圖冊底板紀錄.json'), JSON.stringify(audit, null, 2) + '\n');
console.log(JSON.stringify(audit));
