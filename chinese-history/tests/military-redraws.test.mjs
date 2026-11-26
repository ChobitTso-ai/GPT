// © 2026 Tso KY - All Rights Reserved
// Protected against reverse engineering and unauthorized modification
// v1.0：百科新圖引用、來源、原圖與網頁圖完整性檢查。
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../', import.meta.url);
const manifest = JSON.parse(await readFile(new URL('app/militaryRedraws.json', root), 'utf8'));
const record = JSON.parse(await readFile(new URL('百科重繪素材紀錄.json', root), 'utf8'));

test('每張採用插畫都有獨立引用、可讀說明及兩個來源', () => {
  const entries = Object.entries(manifest).flatMap(([era, cards]) =>
    Object.entries(cards).map(([card, art]) => ({ era, card, ...art })));
  assert.equal(entries.length, record.adoptedMilitaryCards);
  assert.equal(record.assets.length, entries.length);
  assert.equal(new Set(entries.map(art => art.src)).size, entries.length);
  for (const art of entries) {
    assert(art.alt.length >= 20);
    assert(art.caption.includes('想像復原'));
    assert(art.note.includes('示意'));
    assert.equal(art.sources.length, 2);
    for (const source of art.sources) assert.equal(new URL(source.url).protocol, 'https:');
    const asset = record.assets.find(item => item.era === art.era && item.card === art.card);
    assert(asset, `${art.era}/${art.card} 缺少素材紀錄`);
    assert.equal(`/${asset.web.replace(/^public\//, '')}`, art.src);
  }
  assert(!manifest.qin['步兵軍陣']?.note.includes('弩機'), '步兵不得沿用弩兵專屬說明');
});

test('原圖及網頁圖可辨識且與紀錄的大小和SHA256一致', async () => {
  const hashes = [];
  for (const asset of record.assets) {
    for (const [field, bytes, hash] of [
      ['original', 'originalBytes', 'originalSha256'], ['web', 'webBytes', 'webSha256'],
    ]) {
      const data = await readFile(new URL(asset[field], root));
      assert.equal(data.length, asset[bytes], asset[field]);
      assert.equal(createHash('sha256').update(data).digest('hex').toUpperCase(), asset[hash]);
      if (field === 'original') {
        assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
        assert.deepEqual([data.readUInt32BE(16), data.readUInt32BE(20)], asset.originalSize);
        hashes.push(asset[hash]);
      } else {
        assert.equal(data.toString('ascii', 0, 4), 'RIFF');
        assert.equal(data.toString('ascii', 8, 12), 'WEBP');
      }
    }
  }
  assert.equal(new Set(hashes).size, hashes.length, '新圖不得只是重複檔案改名');
});

test('秦四卡完整採用且戰車不冒充精密御用車復原', () => {
  assert.deepEqual(Object.keys(manifest.qin).sort(), ['秦弩與齊射', '四馬戰車', '步兵軍陣', '道路與烽燧'].sort());
  const chariot = manifest.qin['四馬戰車'];
  assert(chariot.alt.includes('四匹馬') && chariot.alt.includes('內側兩匹'));
  assert(chariot.note.includes('兩服兩驂') && chariot.note.includes('不是御用車'));
  assert(!chariot.src.includes('qin-chariot-v2') && !chariot.src.includes('qin-chariot-v3'));
  assert.equal(new Set(Object.values(manifest.qin).map(art => art.src)).size, 4);
});
