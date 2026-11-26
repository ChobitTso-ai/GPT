/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 圖冊顯示投影與重建資產測試 v1.0
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { projectAtlas, unprojectAtlas, atlasProjection } from '../app/atlasProjection.ts';

test('圖冊Albers全東亞往返、同經線北向與等積比例不拉伸', () => {
  for (let lon = 70; lon <= 145; lon += 2.5) for (let lat = 16; lat <= 57; lat += 2.5) {
    const p = unprojectAtlas(...projectAtlas(lon, lat));
    assert(Math.abs(p[0] - lon) < 1e-8 && Math.abs(p[1] - lat) < 1e-8);
  }
  const a = projectAtlas(105, 30), b = projectAtlas(105, 40);
  assert.equal(a[0], b[0]); assert(b[1] < a[1]);
  const localArea = (lon, lat) => {
    const o = projectAtlas(lon, lat), e = projectAtlas(lon + .0001, lat), n = projectAtlas(lon, lat + .0001);
    return Math.abs((e[0] - o[0]) * (n[1] - o[1]) - (e[1] - o[1]) * (n[0] - o[0]));
  };
  const e2 = .0066943799901413165;
  const earthArea = lat => { const p = lat * Math.PI / 180; return Math.cos(p) / (1 - e2 * Math.sin(p) ** 2) ** 2; };
  const reference = localArea(105, 35) / earthArea(35);
  for (const [lon, lat] of [[80, 25], [95, 45], [120, 20], [130, 50]]) {
    assert(Math.abs(localArea(lon, lat) / earthArea(lat) / reference - 1) < .00001);
  }
  assert.deepEqual(atlasProjection.standardParallels, [25, 47]);
});

test('新底板可驗雜湊，來源保留且不是虛構高程模型', async () => {
  const record = JSON.parse(await readFile(new URL('../地圖重建工具/圖冊底板紀錄.json', import.meta.url), 'utf8'));
  for (const [file, hash] of [[record.output, record.sha256], [record.sourceFile, record.sourceSha256]]) {
    const data = await readFile(new URL(`../${file}`, import.meta.url));
    assert.equal(createHash('sha256').update(data).digest('hex').toUpperCase(), hash);
    if (file === record.output) assert.equal(data.length, record.bytes);
  }
  assert.deepEqual([record.width, record.height], [2400, 1680]);
  assert(record.limitation.includes('不是古代地貌'));
  assert.equal(record.projection.centralMeridian, 105);
  assert.equal(record.projection.ellipsoid, 'WGS84');
});

test('海岸線只取海岸要素、保留主要島嶼，不描出內陸接縫', async () => {
  const coast = JSON.parse(await readFile(new URL('../app/atlasCoast.json', import.meta.url), 'utf8'));
  const source = await readFile(new URL('../地圖重建工具/來源/ne_50m_coastline.geojson', import.meta.url));
  assert.equal(createHash('sha256').update(source).digest('hex').toUpperCase(), coast.sourceSha256);
  assert.equal(coast.featureClass, 'Coastline');
  assert(JSON.parse(source).features.every(f => f.properties.featurecla === 'Coastline'));
  const points = coast.lines.flat();
  assert(points.length > 1000);
  assert(!points.some(([lon, lat]) => lon > 80 && lon < 103 && lat > 28 && lat < 40), '內陸不能出現海岸線');
  assert(!points.some(([lon, lat]) => lon > 100 && lon < 120 && lat > 42 && lat < 49), '不畫蒙古附近的現代國界');
  for (const [w, e, s, n] of [[108, 112, 17, 21], [119, 123, 21, 26]]) {
    assert(points.filter(([lon, lat]) => lon > w && lon < e && lat > s && lat < n).length > 5);
  }
});
