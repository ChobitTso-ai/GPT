// © 2026 Tso KY - All Rights Reserved
// Protected against reverse engineering and unauthorized modification
// v1.0：裝備主圖、代表時代及跨軍事卡重用檢查。
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
const root=new URL('../',import.meta.url);
const read=async p=>JSON.parse(await readFile(new URL(p,root),'utf8'));
const map=await read('app/equipmentRedraws.json'),reg=await read('百科重繪素材紀錄.json');
const military=await read('app/militaryRedraws.json');
test('採用裝備逐件有代表時代、獨立主圖、來源與復原界線',()=>{
 assert.equal(Object.keys(map).length,reg.adoptedEquipment);
 assert.equal(reg.equipmentAssets.length,reg.adoptedEquipment);
 const usedMilitary=new Set(Object.values(military).flatMap(cs=>Object.values(cs).map(a=>a.src)));
 const names=['秦弩','騎射','木牛流馬','大象兵','水軍戰船','火藥武器','火銃與火砲','鐵甲戰艦','坦克','四馬戰車','烽火臺','具裝騎兵','唐代騎兵','牽引式投石機','車船','回回砲','狼筅與藤牌','晚清近代槍械'];
 for(const [name,a] of Object.entries(map)){
  assert(names.includes(name));assert(a.alt.length>=20);assert(a.representativeEra.length>=4);
  assert(a.caption.includes('想像復原'));assert(a.note.includes('示意'));assert.equal(a.sources.length,2);
  for(const s of a.sources)assert.equal(new URL(s.url).protocol,'https:');
  const r=reg.equipmentAssets.find(x=>x.card===name);assert(r,name+'缺素材紀錄');
  assert.equal(a.src,'/'+r.web.replace(/^public\//,''));assert.equal(a.representativeEra,r.representativeEra);
  assert(!usedMilitary.has(a.src),name+'重用軍事卡主圖');
 }
 assert.equal(new Set(Object.values(map).map(x=>x.src)).size,reg.adoptedEquipment);
});
test('裝備原圖與WebP真實存在、SHA符合且不與軍事主圖精確重複',async()=>{
 const all=[...reg.assets,...reg.equipmentAssets];
 for(const r of reg.equipmentAssets){
  for(const [field,bytes,sha] of [['original','originalBytes','originalSha256'],['web','webBytes','webSha256']]){
   const b=await readFile(new URL(r[field],root));assert.equal(b.length,r[bytes]);assert.equal(createHash('sha256').update(b).digest('hex').toUpperCase(),r[sha]);
   if(field==='original'){assert.equal(b.subarray(0,8).toString('hex'),'89504e470d0a1a0a');assert.deepEqual([b.readUInt32BE(16),b.readUInt32BE(20)],r.originalSize);}
   else {assert.equal(b.toString('ascii',0,4),'RIFF');assert.equal(b.toString('ascii',8,12),'WEBP');}
  }
 }
 for(const field of ['originalSha256','webSha256'])assert.equal(new Set(all.map(x=>x[field])).size,all.length,field+'有重複主圖');
});

