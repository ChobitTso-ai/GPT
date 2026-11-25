"use client";

/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 中國歷史冒險書 v1.8
 */

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { eastAsiaLand, eastAsiaRivers, type MapPoint } from "./eastAsiaMap";
import { projectAtlas, unprojectAtlas } from "./atlasProjection";
import atlasCoastData from "./atlasCoast.json";
import atlasReferenceRivers from "./atlasReferenceRivers.json";
import { qinXianyang, hanChangan, hanWeiLuoyang } from "./historicalMapSites";
import snapshotData from "./mapSnapshots.json";
import { placeMapLabels, type MapLabel } from "./mapLabels";
import redrawData from "./militaryRedraws.json";
import equipmentRedrawData from "./equipmentRedraws.json";
import OpeningBook from "./OpeningBook";

const militaryRedraws: Record<string, Record<string, {src: string; alt: string; caption: string; note: string; sources: {name: string; url: string}[]}>> = redrawData;
const equipmentRedraws: Record<string, {src: string; alt: string; caption: string; representativeEra: string; note: string; sources: {name: string; url: string}[]}> = equipmentRedrawData;

type MapSnapshot = {
  year: string; title: string; note: string;
  regions: Array<{key: string; name: string}>;
  geometry: Record<string, [number, number][]>;
  extraGeometry?: Record<string, [number, number][][]>;
  boundaryGeometry?: Record<string, [number, number][][]>;
  uncertainGeometry?: Record<string, [number, number][][]>;
  uncertainArea?: {name: string; label: [number, number]; note: string};
  labels: Record<string, [number, number]>;
  capitals: string[]; source: string; credit: string; license: string; licenseUrl: string;
  cityReference?: {name: string; url: string; note: string};
};
const mapSnapshots = snapshotData as unknown as Record<string, MapSnapshot>;
const atlasPoint = ([x, y]: readonly [number, number]) => projectAtlas(70 + x * 75 / 1000, 57 - y * 41 / 600);
const atlasLand = eastAsiaLand.map(ring => ring.map(atlasPoint));
const atlasRivers = [
  ...eastAsiaRivers.map(river => ({ ...river, points: river.points.map(atlasPoint) })),
  ...atlasReferenceRivers.rivers.map(river => ({name: river.name, points: river.points.map(([lon, lat]) => projectAtlas(lon, lat))})),
];
const atlasCoast = atlasCoastData.lines.map(line => line.map(([lon, lat]) => projectAtlas(lon, lat)));

type Era = {
  id: string;
  name: string;
  years: string;
  mark: string;
  summary: string;
  remember: string;
  people: string;
  gear: string;
  kind: "chapter" | "timeline" | "parallel";
};

const eras: Era[] = [
  {
    id: "qin",
    name: "秦",
    years: "西元前 221–206",
    mark: "秦",
    summary: "秦始皇結束戰國局面，建立中國歷史上第一個統一的中央集權帝國。",
    remember: "統一文字、貨幣、度量衡與車軌，讓廣大地區更容易治理與交流。",
    people: "秦始皇、李斯、蒙恬",
    gear: "弩、戰車、步兵軍陣、烽燧",
    kind: "chapter",
  },
  {
    id: "chu-han",
    name: "楚漢相爭",
    years: "西元前 206–202",
    mark: "楚漢",
    summary: "秦亡後，項羽與劉邦爭奪天下，最後劉邦勝出。",
    remember: "鴻門宴、垓下之戰與四面楚歌，都發生在這段短而精彩的轉折期。",
    people: "劉邦、項羽、韓信、張良",
    gear: "騎兵、弓弩、糧道與軍隊調度",
    kind: "chapter",
  },
  {
    id: "western-han",
    name: "西漢",
    years: "西元前 202–西元 9",
    mark: "漢",
    summary: "劉邦建立漢朝；到漢武帝時，國力強盛，對外交流範圍大增。",
    remember: "張騫出使西域，後來形成連接東西方的絲路網絡。",
    people: "漢高祖、漢武帝、張騫、司馬遷",
    gear: "騎兵、漢弩、邊塞烽火",
    kind: "chapter",
  },
  {
    id: "xin",
    name: "新朝",
    years: "9–23",
    mark: "新",
    summary: "王莽取代漢朝建立新朝，改革激烈，統治時間很短。",
    remember: "它雖短暫，卻是西漢和東漢之間不能漏掉的一段。",
    people: "王莽",
    gear: "沿用漢代軍制與弓弩",
    kind: "timeline",
  },
  {
    id: "eastern-han",
    name: "東漢",
    years: "25–220",
    mark: "漢",
    summary: "劉秀重建漢朝；後期地方勢力坐大，逐漸走向群雄割據。",
    remember: "造紙術改進、班超經營西域；末年則成為三國故事的序幕。",
    people: "光武帝劉秀、蔡倫、班超",
    gear: "弓弩、騎兵、邊塞防禦",
    kind: "timeline",
  },
  {
    id: "three-kingdoms",
    name: "三國：魏、蜀、吳",
    years: "220–280",
    mark: "三國",
    summary: "曹魏、蜀漢、孫吳三方並立，真實歷史比小說更複雜。",
    remember: "赤壁之戰發生在三國正式建立之前；《三國演義》則是明代成書的歷史小說。",
    people: "曹操、劉備、孫權、諸葛亮",
    gear: "戰船、火攻、連弩、木牛流馬",
    kind: "chapter",
  },
  {
    id: "western-jin",
    name: "西晉",
    years: "266–316",
    mark: "晉",
    summary: "司馬炎建立西晉，並在 280 年結束三國分立。",
    remember: "統一沒有維持很久，之後北方再度陷入動盪。",
    people: "晉武帝司馬炎",
    gear: "騎兵、弓弩、重裝部隊",
    kind: "timeline",
  },
  {
    id: "east-jin-sixteen",
    name: "東晉・十六國",
    years: "317–420／304–439",
    mark: "分",
    summary: "東晉立足南方；北方則有許多政權先後或同時存在。",
    remember: "這不是一條單線王朝，而是南北並行、政權頻繁更替的時代。",
    people: "司馬睿、祖逖、苻堅、謝安",
    gear: "重裝騎兵、馬鎧、淝水之戰",
    kind: "parallel",
  },
  {
    id: "north-south",
    name: "南北朝",
    years: "420–589",
    mark: "南北",
    summary: "南方宋、齊、梁、陳更替；北方也經歷北魏、東西魏與北齊北周。",
    remember: "長期分裂也帶來民族交流、佛教藝術與制度變化。",
    people: "劉裕、拓跋燾、孝文帝",
    gear: "具裝騎兵、馬鎧、弓騎兵",
    kind: "parallel",
  },
  {
    id: "sui",
    name: "隋",
    years: "581–618",
    mark: "隋",
    summary: "楊堅結束長期南北分裂，再次統一中國。",
    remember: "隋朝短暫，但大運河與制度建設深刻影響後來的唐朝。",
    people: "隋文帝楊堅、隋煬帝楊廣",
    gear: "府兵、騎兵、攻城器械",
    kind: "timeline",
  },
  {
    id: "tang",
    name: "唐",
    years: "618–907",
    mark: "唐",
    summary: "唐朝國際交流活躍，長安匯聚各地商旅、宗教與文化。",
    remember: "玄奘真的曾前往印度求法；孫悟空則是後世小說中的角色。",
    people: "李淵、唐太宗、武則天、玄奘",
    gear: "騎兵、騎射、陌刀、攻城器械",
    kind: "chapter",
  },
  {
    id: "five-ten",
    name: "五代十國",
    years: "907–979",
    mark: "五代",
    summary: "北方五代快速更替，南方與其他地區則有多個政權並存。",
    remember: "五代是後梁、後唐、後晉、後漢、後周；十國是統稱，不代表永遠剛好十國同時存在。",
    people: "朱溫、李存勗、郭威、柴榮",
    gear: "騎兵、弓弩、城防戰",
    kind: "parallel",
  },
  {
    id: "liao",
    name: "遼",
    years: "916–1125",
    mark: "遼",
    summary: "契丹建立的遼朝，長期與北宋等政權並存。",
    remember: "宋代的中國並非只有宋朝，北方還有強大的遼。",
    people: "耶律阿保機、蕭太后",
    gear: "契丹騎兵、騎射",
    kind: "parallel",
  },
  {
    id: "northern-song",
    name: "北宋",
    years: "960–1127",
    mark: "宋",
    summary: "趙匡胤建立北宋，城市、商業、印刷與科技高度發展。",
    remember: "宋朝軍事並非只有弱小一面；它擁有龐大軍隊，也發展火藥武器與水軍。",
    people: "宋太祖趙匡胤、包拯、沈括",
    gear: "火藥箭、床弩、投石機、戰船",
    kind: "chapter",
  },
  {
    id: "western-xia",
    name: "西夏",
    years: "1038–1227",
    mark: "夏",
    summary: "党項建立的西夏位於西北，與宋、遼、金長期互動。",
    remember: "它有自己的文字，也是宋代多政權並立版圖的重要一塊。",
    people: "李元昊",
    gear: "騎兵、山地與沙漠作戰",
    kind: "parallel",
  },
  {
    id: "jin",
    name: "金",
    years: "1115–1234",
    mark: "金",
    summary: "女真建立金朝，先滅遼，後攻入北宋首都。",
    remember: "金與南宋南北對峙，最後又面對蒙古崛起。",
    people: "完顏阿骨打、金太宗",
    gear: "女真騎兵、重裝騎兵",
    kind: "parallel",
  },
  {
    id: "southern-song",
    name: "南宋",
    years: "1127–1279",
    mark: "宋",
    summary: "北宋滅亡後，宋室南遷，以臨安為都，海上貿易與水軍興盛。",
    remember: "南宋與金、蒙古先後對峙，也留下岳飛等人物故事。",
    people: "宋高宗、岳飛、文天祥",
    gear: "水軍、海鶻船、火槍與火藥彈",
    kind: "chapter",
  },
  {
    id: "mongol",
    name: "蒙古帝國",
    years: "1206 起",
    mark: "蒙古",
    summary: "鐵木真統一蒙古諸部，被尊為成吉思汗，蒙古勢力迅速擴張。",
    remember: "成吉思汗建立蒙古帝國；正式建立元朝的是他的孫子忽必烈。",
    people: "成吉思汗、窩闊台、蒙哥",
    gear: "騎射、複合弓、驛站與快速行軍",
    kind: "chapter",
  },
  {
    id: "yuan",
    name: "元",
    years: "1271–1368",
    mark: "元",
    summary: "忽必烈定國號為元，後來完成對南宋的征服。",
    remember: "元朝疆域廣闊，陸路與海路交流頻繁，也建立發達驛站系統。",
    people: "元世祖忽必烈、郭守敬",
    gear: "騎兵、回回砲、火器、水軍",
    kind: "chapter",
  },
  {
    id: "ming",
    name: "明",
    years: "1368–1644",
    mark: "明",
    summary: "朱元璋建立明朝；鄭和船隊遠航，火器與海防也持續發展。",
    remember: "《三國演義》《西遊記》《水滸傳》等重要小說都在明代成書或定型。",
    people: "明太祖朱元璋、明成祖朱棣、鄭和、戚繼光",
    gear: "火銃、佛郎機砲、戰船、鴛鴦陣",
    kind: "chapter",
  },
  {
    id: "qing",
    name: "清",
    years: "1644–1912",
    mark: "清",
    summary: "清朝入關後統治中國近三百年，晚期面對內亂、列強與現代化挑戰。",
    remember: "1900 年八國聯軍進入北京，之後清政府被迫簽訂《辛丑條約》；1912 年清朝結束。",
    people: "努爾哈赤、皇太極、康熙帝、林則徐",
    gear: "八旗騎兵、火槍火砲、北洋水師鐵甲艦",
    kind: "chapter",
  },
];

const eraGuideMarks: Record<string, string> = {
  qin: "秦",
  "chu-han": "楚漢",
  "western-han": "西漢",
  xin: "新",
  "eastern-han": "東漢",
  "three-kingdoms": "魏蜀吳",
  "western-jin": "西晉",
  "east-jin-sixteen": "東晉十六國",
  "north-south": "南北朝",
  sui: "隋",
  tang: "唐",
  "five-ten": "五代十國",
  liao: "遼",
  "northern-song": "北宋",
  "western-xia": "西夏",
  jin: "金",
  "southern-song": "南宋",
  mongol: "蒙古",
  yuan: "元",
  ming: "明",
  qing: "清",
};

const storyHighlights = [
  {
    era: "秦",
    number: "01",
    title: "一個皇帝，如何統一六國？",
    text: "從戰國七雄到天下一統，看看秦始皇如何建立全新的帝國制度。",
    color: "red",
  },
  {
    era: "楚漢",
    number: "02",
    title: "劉邦與項羽，誰會得到天下？",
    text: "一位善於用人，一位勇猛無比；勝負不只由力氣決定。",
    color: "gold",
  },
  {
    era: "三國",
    number: "03",
    title: "赤壁真的像小說寫的一樣嗎？",
    text: "沿著長江看水戰，再把正史記載與《三國演義》的精彩改編分開。",
    color: "blue",
  },
  {
    era: "唐／明",
    number: "04",
    title: "玄奘與孫悟空，誰是真實人物？",
    text: "唐代玄奘的真實旅行，如何在明代變成神魔小說《西遊記》。",
    color: "jade",
  },
  {
    era: "蒙古",
    number: "05",
    title: "蒙古騎兵為何移動得這麼快？",
    text: "騎射、複合弓、備用馬與驛站，組成草原軍隊的速度祕密。",
    color: "brown",
  },
  {
    era: "晚清",
    number: "06",
    title: "八國聯軍為什麼來到北京？",
    text: "從義和團、清政府到列強利益，用多方視角理解 1900 年的危機。",
    color: "ink",
  },
];

const weapons = [
  {
    icon: "🏹",
    name: "秦弩",
    era: "秦・漢",
    type: "遠射",
    text: "弩利用機械結構扣住弦，讓士兵較容易瞄準與齊射。",
  },
  {
    icon: "🐎",
    name: "騎射",
    era: "漢・唐・蒙古",
    type: "速度",
    text: "騎手在馬上射箭，需要高超技術；蒙古軍隊更把速度與調度發揮到極致。",
  },
  {
    icon: "🛞",
    name: "木牛流馬",
    era: "三國",
    type: "補給",
    text: "史書記載諸葛亮曾用木牛流馬運糧，但它的確切構造至今仍沒有定論。",
  },
  {
    icon: "🐘",
    name: "大象兵",
    era: "小說與亞洲史",
    type: "真假辨識",
    text: "戰象在亞洲歷史上確實存在；《三國演義》的南中象兵情節不能直接當成戰役實錄。",
  },
  {
    icon: "🚢",
    name: "水軍戰船",
    era: "三國・宋・明",
    type: "水戰",
    text: "從長江水戰到海上航行，戰船的船體、槳帆與火器不斷演變。",
  },
  {
    icon: "🔥",
    name: "火藥武器",
    era: "宋",
    type: "科技轉折",
    text: "火藥由燃燒與爆炸用途逐步進入戰場，出現火箭、火槍與火藥彈。",
  },
  {
    icon: "💥",
    name: "火銃與火砲",
    era: "元・明・清",
    type: "火器",
    text: "金屬管形火器逐漸成熟，也受到跨地域技術交流影響。",
  },
  {
    icon: "⚓",
    name: "鐵甲戰艦",
    era: "晚清",
    type: "近代海軍",
    text: "北洋水師擁有大型鐵甲艦，顯示晚清已開始建立近代海軍。",
  },
  {
    icon: "🛡️",
    name: "坦克",
    era: "1916 起・時間軸外",
    type: "彩蛋",
    text: "坦克第一次投入戰場已是清朝結束後。它會成為通往下一個時代的彩蛋。",
  },
];

const extraWeapons = [
  {
    icon: "🐴",
    name: "四馬戰車",
    era: "商周・戰國・秦",
    type: "車戰",
    text: "中國古代確實使用戰車；秦始皇陵銅車馬採四馬駕車，是研究秦代車馬結構的重要考古資料。",
  },
  {
    icon: "🔥",
    name: "烽火臺",
    era: "秦・漢",
    type: "軍事通訊",
    text: "邊塞以煙火等信號快速傳遞警報，背後還需要堡壘、道路與守軍共同運作。",
  },
  {
    icon: "🐎",
    name: "具裝騎兵",
    era: "魏晉南北朝",
    type: "重裝兵種",
    text: "騎手和戰馬都披上護甲，衝擊力強，但裝備昂貴、行動和補給負擔也更大。",
  },
  {
    icon: "🏇",
    name: "唐代騎兵",
    era: "隋・唐",
    type: "機動兵種",
    text: "騎兵能快速偵察、追擊與側翼行動，仍須與步兵、弓弩和後勤互相配合。",
  },
  {
    icon: "🪨",
    name: "牽引式投石機",
    era: "隋唐・宋",
    type: "攻城器械",
    text: "多人拉繩使長臂甩動，把石彈投向城防目標；操作需要協調與測距。",
  },
  {
    icon: "🚢",
    name: "車船",
    era: "南朝・宋",
    type: "水軍科技",
    text: "以人力帶動槳輪推進，適合江河水戰；不同時代的車船大小與用途並不完全相同。",
  },
  {
    icon: "🏗️",
    name: "回回砲",
    era: "蒙古・元",
    type: "攻城科技",
    text: "大型配重式投石機由跨地域工程技術傳入，蒙古攻城軍在襄陽等戰事中使用。",
  },
  {
    icon: "🛡️",
    name: "狼筅與藤牌",
    era: "明",
    type: "協同陣法",
    text: "戚繼光軍隊把長短兵器、盾牌與火器編組配合，重點是隊員彼此掩護。",
  },
  {
    icon: "🎯",
    name: "晚清近代槍械",
    era: "晚清",
    type: "軍事近代化",
    text: "晚清軍隊逐步採用後膛步槍、連發武器與近代砲兵，但訓練、制度和補給同樣重要。",
  },
];

type MilitaryItem = {
  name: string;
  category: string;
  text: string;
  sheet: 1 | 2 | 3 | 4 | 5;
  sprite: number;
};

const militaryItem = (
  name: string,
  category: string,
  text: string,
  sheet: 1 | 2,
  sprite: number,
): MilitaryItem => ({ name, category, text, sheet, sprite });

type MilitaryMotion = "shoot" | "gallop" | "charge" | "transport" | "signal" | "sail" | "fire" | "siege" | "formation" | "remount" | "relay" | "command" | "fortify";

type MilitaryVisual = {
  sheet: 1 | 2 | 3 | 4 | 5;
  sprite: number;
  motion: MilitaryMotion;
};

const militaryVisualByName: Record<string, MilitaryVisual> = {
  四馬戰車: { sheet: 2, sprite: 1, motion: "charge" },
  道路與烽燧: { sheet: 2, sprite: 2, motion: "signal" },
  邊塞烽火: { sheet: 2, sprite: 2, motion: "signal" },
  堡塞烽燧: { sheet: 2, sprite: 2, motion: "signal" },
  木牛流馬: { sheet: 1, sprite: 3, motion: "transport" },
  複合弓: { sheet: 3, sprite: 1, motion: "shoot" },
  馬群與備用馬: { sheet: 3, sprite: 2, motion: "remount" },
  多馬輪換: { sheet: 3, sprite: 2, motion: "remount" },
  攻城工程隊: { sheet: 3, sprite: 3, motion: "siege" },
  步兵軍陣: { sheet: 3, sprite: 4, motion: "formation" },
  步兵長兵器: { sheet: 3, sprite: 4, motion: "formation" },
  弓箭與長兵器: { sheet: 3, sprite: 4, motion: "formation" },
  狼筅與藤牌: { sheet: 2, sprite: 8, motion: "formation" },
  糧道調度: { sheet: 3, sprite: 5, motion: "transport" },
  屯田與運糧: { sheet: 3, sprite: 5, motion: "transport" },
  驛路與軍糧: { sheet: 3, sprite: 5, motion: "transport" },
  城防與軍需: { sheet: 3, sprite: 5, motion: "transport" },
  山地與沙漠堡寨: { sheet: 3, sprite: 6, motion: "fortify" },
  騎兵與驛站: { sheet: 3, sprite: 7, motion: "relay" },
  駱駝與馬匹補給: { sheet: 3, sprite: 8, motion: "transport" },
  南北面軍事體制: { sheet: 3, sprite: 9, motion: "command" },
  徵兵與動員: { sheet: 3, sprite: 9, motion: "command" },
  地方武裝興起: { sheet: 3, sprite: 9, motion: "command" },
  府兵與步騎: { sheet: 3, sprite: 9, motion: "command" },
  淝水調度: { sheet: 3, sprite: 9, motion: "command" },
  長江防線: { sheet: 1, sprite: 5, motion: "sail" },
  攻城器械: { sheet: 2, sprite: 5, motion: "siege" },
  弓騎兵: { sheet: 3, sprite: 1, motion: "shoot" },
  強弩與床弩: { sheet: 1, sprite: 1, motion: "shoot" },
  牽引式投石機: { sheet: 2, sprite: 5, motion: "siege" },
  車船與槳輪: { sheet: 2, sprite: 6, motion: "sail" },
  襄陽城防: { sheet: 2, sprite: 7, motion: "siege" },
  回回砲: { sheet: 2, sprite: 7, motion: "siege" },
  長城與九邊: { sheet: 3, sprite: 6, motion: "signal" },
  北洋水師鐵甲艦: { sheet: 1, sprite: 8, motion: "sail" },
  後膛槍與機關槍: { sheet: 2, sprite: 9, motion: "shoot" },
};

const cavalrySpriteByEra: Record<string, number> = {
  "chu-han": 1,
  "western-han": 2,
  xin: 2,
  "eastern-han": 3,
  "western-jin": 4,
  "east-jin-sixteen": 5,
  "north-south": 5,
  sui: 6,
  tang: 7,
  "five-ten": 9,
  liao: 10,
  "western-xia": 11,
  jin: 12,
  mongol: 13,
  yuan: 14,
  ming: 15,
  qing: 16,
};

const eraMilitaryVisuals: Record<string, Record<string, MilitaryVisual>> = {
  "chu-han": { 騎兵追擊: { sheet: 4, sprite: 1, motion: "gallop" } },
  "western-han": { 漢代騎兵: { sheet: 4, sprite: 2, motion: "gallop" } },
  xin: { 騎兵與步兵: { sheet: 4, sprite: 2, motion: "gallop" } },
  "eastern-han": { 邊軍騎兵: { sheet: 4, sprite: 3, motion: "gallop" } },
  "three-kingdoms": { 火攻: { sheet: 5, sprite: 1, motion: "fire" } },
  "western-jin": { 重裝騎兵: { sheet: 4, sprite: 4, motion: "charge" } },
  "east-jin-sixteen": { 具裝騎兵: { sheet: 4, sprite: 5, motion: "charge" } },
  "north-south": {
    具裝騎兵: { sheet: 4, sprite: 5, motion: "charge" },
    馬鎧與騎具: { sheet: 4, sprite: 4, motion: "charge" },
  },
  sui: { 騎兵長槍: { sheet: 4, sprite: 6, motion: "charge" } },
  tang: {
    唐代騎兵: { sheet: 4, sprite: 7, motion: "charge" },
    弓騎與複合弓: { sheet: 4, sprite: 8, motion: "shoot" },
  },
  "five-ten": { 北方騎兵: { sheet: 4, sprite: 9, motion: "gallop" } },
  liao: { 契丹騎兵: { sheet: 4, sprite: 10, motion: "gallop" } },
  "western-xia": { 党項騎兵: { sheet: 4, sprite: 11, motion: "gallop" } },
  jin: {
    女真騎兵: { sheet: 4, sprite: 12, motion: "gallop" },
    重裝騎兵: { sheet: 4, sprite: 5, motion: "charge" },
  },
  mongol: { 蒙古騎射: { sheet: 4, sprite: 13, motion: "shoot" } },
  yuan: { 騎兵與驛站: { sheet: 4, sprite: 14, motion: "relay" } },
  qing: { 八旗騎射: { sheet: 4, sprite: 16, motion: "shoot" } },
};

function resolveMilitaryVisual(eraId: string, item: MilitaryItem, index: number): MilitaryVisual {
  const eraSpecific = eraMilitaryVisuals[eraId]?.[item.name];
  if (eraSpecific) return eraSpecific;
  const exact = militaryVisualByName[item.name];
  if (exact) return exact;
  if (/具裝|重裝/.test(item.name)) return { sheet: 2, sprite: 3, motion: "charge" };
  if (/火銃|火砲|火槍|火藥/.test(item.name)) return { sheet: 1, sprite: /火銃|火砲/.test(item.name) ? 7 : 6, motion: "fire" };
  if (/水軍|戰船|船隊|渡江|鐵甲艦/.test(item.name)) return { sheet: 1, sprite: 5, motion: "sail" };
  if (/城|關|堡|塞|防線/.test(item.name)) return { sheet: 3, sprite: 6, motion: "fortify" };
  if (/糧|補給|糧運|屯田|道路/.test(item.name)) return { sheet: 3, sprite: 5, motion: "transport" };
  if (/軍陣|步兵|軍事體制|動員|調度/.test(item.name)) return { sheet: 3, sprite: index % 2 === 0 ? 4 : 9, motion: index % 2 === 0 ? "formation" : "command" };
  if (/攻城|投石|砲/.test(item.name)) return { sheet: 2, sprite: 5, motion: "siege" };
  if (/騎|馬/.test(item.name)) {
    return { sheet: 4, sprite: cavalrySpriteByEra[eraId] ?? 7, motion: "gallop" };
  }
  if (/弓|弩|射/.test(item.name)) return { sheet: 1, sprite: 1, motion: "shoot" };
  const fallbacks: MilitaryVisual[] = [
    { sheet: 3, sprite: 4, motion: "formation" },
    { sheet: 3, sprite: 5, motion: "transport" },
    { sheet: 3, sprite: 6, motion: "fortify" },
    { sheet: 3, sprite: 9, motion: "command" },
  ];
  return fallbacks[index % fallbacks.length];
}

const militaryByEra: Record<string, MilitaryItem[]> = {
  qin: [
    militaryItem("秦弩與齊射", "遠射武器", "弩機讓士兵能先扣住弓弦再瞄準，適合編組齊射。", 1, 1),
    militaryItem("四馬戰車", "車戰兵種", "秦代仍使用戰車，但步兵與騎兵的重要性已持續上升。", 2, 1),
    militaryItem("步兵軍陣", "兵種協同", "持戈、矛、弓弩的部隊需要依命令保持隊形與距離。", 1, 1),
    militaryItem("道路與烽燧", "通訊後勤", "道路、關塞與警報系統讓命令、軍糧和消息能遠距移動。", 2, 2),
  ],
  "chu-han": [
    militaryItem("騎兵追擊", "機動兵種", "騎兵適合追擊、偵察與截斷退路，但不能取代所有步兵。", 1, 2),
    militaryItem("弓弩部隊", "遠射武器", "楚漢軍隊承接秦代弓弩傳統，用遠射支援正面部隊。", 1, 1),
    militaryItem("攻城與守城", "城防", "天下分裂時，各方常要面對城池、關隘與渡口的爭奪。", 2, 5),
    militaryItem("糧道調度", "後勤", "韓信等將領的勝負不只靠交戰，也取決於糧道、渡河與兵力調動。", 1, 3),
  ],
  "western-han": [
    militaryItem("漢代騎兵", "機動兵種", "漢武帝時對北方作戰更重視騎兵、馬匹與長距離行軍。", 1, 2),
    militaryItem("漢弩", "遠射武器", "弩是漢軍常見遠射裝備，能配合步兵和守城作戰。", 1, 1),
    militaryItem("邊塞烽火", "軍事通訊", "烽燧、障塞與戍卒構成邊塞警戒網絡。", 2, 2),
    militaryItem("屯田與運糧", "後勤", "邊地屯田和糧草運輸，是軍隊長期駐守的重要基礎。", 1, 3),
  ],
  xin: [
    militaryItem("延續漢代弓弩", "制度延續", "新朝軍事裝備大致承接漢代，並非突然換成全新武器。", 1, 1),
    militaryItem("徵兵與動員", "軍隊制度", "大規模改革與各地衝突，使徵兵和地方動員壓力增加。", 2, 4),
    militaryItem("騎兵與步兵", "兵種協同", "騎兵負責機動，步兵仍是控制城池與地面的重要力量。", 1, 2),
    militaryItem("城池與糧運", "後勤城防", "短期內多方起兵，城池、糧倉與道路成為爭奪重點。", 1, 3),
  ],
  "eastern-han": [
    militaryItem("邊軍騎兵", "邊防兵種", "東漢面對北方與西域局勢，仍需騎兵與邊塞部隊。", 1, 2),
    militaryItem("弓弩與步兵", "遠射武器", "弓弩搭配步兵，是守城與野戰的重要組合。", 1, 1),
    militaryItem("堡塞烽燧", "軍事通訊", "邊地堡塞以烽火和驛路傳遞警報與命令。", 2, 2),
    militaryItem("地方武裝興起", "軍事變化", "東漢末年地方軍事力量坐大，逐漸形成群雄割據。", 2, 4),
  ],
  "three-kingdoms": [
    militaryItem("江河戰船", "水軍", "長江流域使戰船、操舟與水上補給成為關鍵能力。", 1, 5),
    militaryItem("火攻", "戰術", "火船載著薪草等引火物，借風逼近敵方船隊；成敗仍取決於風向、船位和時機。", 1, 6),
    militaryItem("連弩與弓弩", "遠射武器", "諸葛連弩的形制與使用仍有討論，網站會標示史料和復原差異。", 1, 1),
    militaryItem("木牛流馬", "後勤", "史書記載諸葛亮以木牛流馬運糧，但確切構造沒有定論。", 1, 3),
  ],
  "western-jin": [
    militaryItem("重裝騎兵", "機動兵種", "魏晉時期人馬護甲逐步發展，重裝騎兵更受重視。", 2, 3),
    militaryItem("弓弩步兵", "遠射武器", "西晉軍隊延續魏晉弓弩和步兵作戰傳統。", 1, 1),
    militaryItem("滅吳水軍", "水軍", "西晉完成統一時，沿長江推進與水軍配合十分重要。", 1, 5),
    militaryItem("城防與內亂", "城防", "統一後的內戰使首都、關隘和城池再次成為軍事焦點。", 2, 5),
  ],
  "east-jin-sixteen": [
    militaryItem("具裝騎兵", "重裝兵種", "北方政權廣泛發展人馬披甲的重裝騎兵。", 2, 3),
    militaryItem("長江防線", "地理防禦", "東晉依靠長江與水軍守住南方核心地區。", 1, 5),
    militaryItem("淝水調度", "戰術", "淝水之戰顯示兵力多不一定獲勝，隊形與指揮同樣關鍵。", 2, 4),
    militaryItem("多國城塞", "城防", "北方多政權更替頻繁，城池和要塞常被反覆爭奪。", 2, 5),
  ],
  "north-south": [
    militaryItem("具裝騎兵", "重裝兵種", "北朝重裝騎兵是此時代最醒目的軍事形象之一。", 2, 3),
    militaryItem("馬鎧與騎具", "裝備", "馬鎧保護戰馬，但重量、成本和耐力都是限制。", 2, 3),
    militaryItem("南朝水軍", "水軍", "南方河網密集，戰船與渡江能力特別重要。", 2, 6),
    militaryItem("山城與江防", "城防", "山地、江河和城塞共同形成南北對峙的防線。", 2, 5),
  ],
  sui: [
    militaryItem("府兵與步騎", "軍隊制度", "隋代整合北朝軍事傳統，以步兵和騎兵共同作戰。", 2, 4),
    militaryItem("騎兵長槍", "機動兵種", "騎兵適合快速推進，但仍需要步兵和補給支援。", 2, 4),
    militaryItem("大型戰船", "水軍", "統一南方與遠征都需要船隊、造船和水路運輸。", 2, 6),
    militaryItem("攻城器械", "攻城", "投石機等器械用於攻打城牆和壓制守軍。", 2, 5),
  ],
  tang: [
    militaryItem("唐代騎兵", "機動兵種", "騎兵能偵察、衝擊和追擊，是唐軍重要組成。", 2, 4),
    militaryItem("弓騎與複合弓", "遠射兵種", "馬上射箭需要長期訓練，也受草原軍事文化影響。", 1, 2),
    militaryItem("步兵長兵器", "步兵裝備", "長槍與長刀類武器可維持距離，配合隊形作戰。", 2, 8),
    militaryItem("驛路與軍糧", "後勤", "廣大疆域中的軍隊依靠驛站、道路和糧運才能持續行動。", 1, 3),
  ],
  "five-ten": [
    militaryItem("北方騎兵", "機動兵種", "北方五代更替快速，騎兵與軍鎮力量影響政權興亡。", 2, 4),
    militaryItem("南方水軍", "水軍", "南方諸國河湖眾多，水軍是守土和爭奪航道的重要力量。", 2, 6),
    militaryItem("城鎮軍事化", "城防", "軍鎮、城牆和關隘在多國並存時更顯重要。", 2, 5),
    militaryItem("弓弩步兵", "遠射武器", "弓弩仍是守城和野戰常見裝備。", 1, 1),
  ],
  liao: [
    militaryItem("契丹騎兵", "機動兵種", "遼軍擅長騎馬機動，能快速集結與轉移。", 1, 2),
    militaryItem("複合弓", "遠射武器", "複合弓體積較短，適合騎乘時使用。", 1, 2),
    militaryItem("馬群與備用馬", "後勤", "草原軍隊的速度背後，需要大量馬匹和牧養能力。", 1, 2),
    militaryItem("南北面軍事體制", "制度", "遼朝治理不同地區時採取不同制度，軍事組織也有差異。", 2, 3),
  ],
  "northern-song": [
    militaryItem("強弩與床弩", "遠射武器", "宋軍重視弩，較大型弩具可用於城防。", 1, 1),
    militaryItem("牽引式投石機", "攻城器械", "多人拉繩甩動長臂，用來投射石彈。", 2, 5),
    militaryItem("早期火藥武器", "科技轉折", "火箭、火球等武器顯示火藥逐步進入軍事用途。", 1, 6),
    militaryItem("城防與軍需", "防禦後勤", "龐大常備軍需要武器製造、糧餉和城防體系維持。", 1, 3),
  ],
  "western-xia": [
    militaryItem("党項騎兵", "機動兵種", "西夏軍隊善用西北地形與騎兵機動。", 1, 2),
    militaryItem("弓騎兵", "遠射兵種", "騎射適合偵察、襲擾和快速撤離。", 1, 2),
    militaryItem("山地與沙漠堡寨", "地形城防", "乾燥地區的水源、道路與堡寨會直接影響行軍。", 2, 2),
    militaryItem("駱駝與馬匹補給", "後勤", "西北遠距行動需要適應乾旱環境的運輸與補給。", 1, 3),
  ],
  jin: [
    militaryItem("女真騎兵", "機動兵種", "金軍早期以高機動騎兵聞名，但軍隊也包含步兵等兵種。", 1, 2),
    militaryItem("重裝騎兵", "重裝兵種", "人馬披甲能提高防護，代價是更重、更昂貴。", 2, 3),
    militaryItem("弓箭與長兵器", "兵種協同", "騎射、長槍與步兵需要依情況配合。", 2, 4),
    militaryItem("攻城與火器", "攻城科技", "金與宋長期交戰，也逐步接觸和使用火藥武器。", 1, 6),
  ],
  "southern-song": [
    militaryItem("江海水軍", "水軍", "南宋以長江和沿海為重要防線，水軍地位突出。", 2, 6),
    militaryItem("車船與槳輪", "水軍科技", "槳輪船能在部分水域提供不同於風帆的推進方式。", 2, 6),
    militaryItem("火槍與火藥彈", "火藥武器", "南宋文獻記錄多種燃燒、爆炸與管形火器。", 1, 6),
    militaryItem("襄陽城防", "城防攻守", "城牆、水路、投石機與補給共同影響長期攻防。", 2, 7),
  ],
  mongol: [
    militaryItem("蒙古騎射", "遠射兵種", "騎手能在高速移動中射箭，是蒙古軍的重要能力。", 1, 2),
    militaryItem("複合弓", "遠射武器", "短小而有力的複合弓適合馬上使用。", 1, 2),
    militaryItem("多馬輪換", "機動後勤", "騎手準備多匹馬輪換，能減少單匹馬的負擔。", 1, 2),
    militaryItem("攻城工程隊", "攻城科技", "蒙古軍吸收各地工程人才，並非只靠騎兵作戰。", 2, 7),
  ],
  yuan: [
    militaryItem("回回砲", "攻城器械", "配重式投石機代表跨地域技術交流，也改變城池攻防。", 2, 7),
    militaryItem("騎兵與驛站", "機動通訊", "騎兵速度需要驛站、道路和補給網絡支撐。", 1, 2),
    militaryItem("火銃", "早期火器", "元代出土火銃顯示金屬管形火器逐步發展。", 1, 7),
    militaryItem("水軍與渡江", "水軍", "完成對南宋征服需要船隊、渡江與江海作戰能力。", 1, 5),
  ],
  ming: [
    militaryItem("火銃與火砲", "火器", "明軍大量使用不同尺寸的火器，也持續改良製造與操練。", 1, 7),
    militaryItem("狼筅與藤牌", "步兵協同", "戚繼光部隊把長短兵器與盾牌編組，強調小隊合作。", 2, 8),
    militaryItem("長城與九邊", "邊防", "長城不是單一牆面，而是城堡、關口、烽燧與駐軍系統。", 2, 2),
    militaryItem("戰船與海防", "水軍", "明代既有鄭和船隊，也面對沿海防禦和倭寇問題。", 1, 5),
  ],
  qing: [
    militaryItem("八旗騎射", "軍隊制度", "清初八旗重視騎射傳統，也包含不同族群與多種兵種。", 1, 2),
    militaryItem("火槍與火砲", "火器", "清軍沿用並發展火器，但不同時期訓練和裝備差異很大。", 1, 7),
    militaryItem("北洋水師鐵甲艦", "近代海軍", "晚清建立近代艦隊，鐵甲艦背後還需要港口、維修與訓練。", 1, 8),
    militaryItem("後膛槍與機關槍", "近代化", "晚清已出現近代槍械；科技差距也涉及制度、工業和補給。", 2, 9),
  ],
};

type QuizItem = {
  id: string;
  question: string;
  options: string[];
  answer: "正確" | "錯誤";
  explain: string;
};

const originalQuiz: QuizItem[] = [
  {
    id: "novel-journey-west",
    question: "《西遊記》的孫悟空曾和唐代玄奘一起旅行。",
    options: ["正確", "錯誤"],
    answer: "錯誤",
    explain: "玄奘是真實人物；孫悟空是後來小說塑造的角色。",
  },
  {
    id: "mongol-yuan",
    question: "成吉思汗和忽必烈建立的是完全相同的政權。",
    options: ["正確", "錯誤"],
    answer: "錯誤",
    explain: "成吉思汗建立蒙古帝國；忽必烈後來定國號為元。",
  },
  {
    id: "tank-1900",
    question: "坦克在八國聯軍進入北京時已經參戰。",
    options: ["正確", "錯誤"],
    answer: "錯誤",
    explain: "八國聯軍事件在 1900 年；坦克首次投入戰場是在 1916 年。",
  },
];

const eraQuiz: QuizItem[] = eras.flatMap((era, index) => {
  const nextEra = eras[(index + 1) % eras.length];
  const previousEra = eras[Math.max(0, index - 1)];
  const firstPerson = era.people.split("、")[0];
  const firstGear = era.gear.split("、")[0];
  const chronologyQuestion =
    index < eras.length - 1
      ? `${era.name}比${nextEra.name}更早出現。`
      : `${era.name}比${previousEra.name}更晚開始。`;

  return [
    {
      id: `${era.id}-years-right`,
      question: `${era.name}在時間軸上的年代是「${era.years}」。`,
      options: ["正確", "錯誤"],
      answer: "正確",
      explain: `${era.name}在本站主時間軸標示為${era.years}。`,
    },
    {
      id: `${era.id}-chronology`,
      question: chronologyQuestion,
      options: ["正確", "錯誤"],
      answer: "正確",
      explain:
        index < eras.length - 1
          ? `${era.name}在完整時間軸上排在${nextEra.name}之前。`
          : `${era.name}在時間軸上排在${previousEra.name}之後。`,
    },
    {
      id: `${era.id}-person`,
      question: `${firstPerson}是認識${era.name}時的重要人物之一。`,
      options: ["正確", "錯誤"],
      answer: "正確",
      explain: `${era.name}篇章列出的關鍵人物包括${era.people}。`,
    },
    {
      id: `${era.id}-gear`,
      question: `「${firstGear}」可以用來認識${era.name}的軍事或科技。`,
      options: ["正確", "錯誤"],
      answer: "正確",
      explain: `${era.name}篇章列出的軍事與科技包括${era.gear}。`,
    },
    {
      id: `${era.id}-years-wrong`,
      question: `${era.name}的年代其實是「${nextEra.years}」。`,
      options: ["正確", "錯誤"],
      answer: "錯誤",
      explain: `${era.name}的正確時間軸標示是${era.years}；題目中的年代屬於${nextEra.name}。`,
    },
  ];
});

const quizBank = [...originalQuiz, ...eraQuiz];

function drawQuizRound(): QuizItem[] {
  return [...quizBank]
    .sort(() => Math.random() - 0.5)
    .slice(0, 3);
}

type MapProfile = {
  mode: string;
  title: string;
  note: string;
  regions: Array<{ key: string; name: string }>;
};

const mapProfiles: Record<string, MapProfile> = {
  unified: {
    mode: "unified",
    title: "統一王朝的核心範圍",
    note: "以黃河、長江流域為主要核心；實際疆界會隨年代改變。",
    regions: [{ key: "unified", name: "統一政權" }],
  },
  three: {
    mode: "three",
    title: "魏、蜀、吳三方並立",
    note: "魏在北方、蜀在西南、吳在長江中下游與東南。",
    regions: [
      { key: "wei", name: "魏" },
      { key: "shu", name: "蜀" },
      { key: "wu", name: "吳" },
    ],
  },
  northSouth: {
    mode: "north-south",
    title: "南北政權長期並存",
    note: "北方常有多個政權更替，南方政權以長江流域為核心。",
    regions: [
      { key: "north", name: "北方政權" },
      { key: "south", name: "南方政權" },
    ],
  },
  fragmented: {
    mode: "fragmented",
    title: "多個政權同時存在",
    note: "這些時代不能畫成單一王朝；地圖像拼圖一樣不斷重組。",
    regions: [
      { key: "fragment-a", name: "北方" },
      { key: "fragment-b", name: "關中" },
      { key: "fragment-c", name: "江南" },
      { key: "fragment-d", name: "西南" },
    ],
  },
  songLiao: {
    mode: "song-liao",
    title: "宋、遼、西夏等政權並存",
    note: "北方是遼或後來的金，西北有西夏，宋在中原或南方。",
    regions: [
      { key: "liao", name: "遼／金" },
      { key: "xixia", name: "西夏" },
      { key: "song", name: "宋" },
    ],
  },
  mongol: {
    mode: "mongol",
    title: "蒙古勢力由北方擴張",
    note: "1206 年蒙古帝國建立；忽必烈在 1271 年定國號為元。",
    regions: [
      { key: "mongol", name: "蒙古" },
      { key: "south-song", name: "南宋" },
    ],
  },
  yuan: {
    mode: "yuan",
    title: "元朝完成對南宋的征服",
    note: "1271 年國號為元，1279 年南宋結束；地圖範圍遠大於三國時代。",
    regions: [{ key: "yuan", name: "元" }],
  },
  ming: {
    mode: "ming",
    title: "明朝以北京、南京為重要中心",
    note: "北方長城、東南海防與西南治理都是明代重要課題。",
    regions: [{ key: "ming", name: "明" }],
  },
  qing: {
    mode: "qing",
    title: "清軍由東北入關",
    note: "1644 年吳三桂開山海關、清軍入關；之後統治範圍逐步擴大。",
    regions: [
      { key: "qing-core", name: "清朝統治範圍" },
      { key: "northeast", name: "東北" },
    ],
  },
};

const eraMap: Record<string, keyof typeof mapProfiles> = {
  qin: "unified",
  "chu-han": "fragmented",
  "western-han": "unified",
  xin: "unified",
  "eastern-han": "unified",
  "three-kingdoms": "three",
  "western-jin": "unified",
  "east-jin-sixteen": "northSouth",
  "north-south": "northSouth",
  sui: "unified",
  tang: "unified",
  "five-ten": "fragmented",
  liao: "songLiao",
  "northern-song": "songLiao",
  "western-xia": "songLiao",
  jin: "songLiao",
  "southern-song": "songLiao",
  mongol: "mongol",
  yuan: "yuan",
  ming: "ming",
  qing: "qing",
};

const historicalRegionCoordinates: Record<string, Array<[number, number]>> = {
  unified: [[98, 40], [107, 43], [118, 41], [122, 34], [118, 25], [108, 23], [102, 28], [98, 34]],
  wei: [[99, 41], [109, 43], [121, 40], [119, 32], [111, 30], [104, 33]],
  shu: [[101, 33], [108, 32], [109, 26], [103, 25], [98, 29]],
  wu: [[108, 31], [119, 33], [122, 27], [117, 23], [108, 25]],
  north: [[96, 42], [109, 45], [122, 41], [119, 33], [106, 32], [99, 35]],
  south: [[103, 32], [119, 33], [122, 25], [109, 22], [99, 27]],
  "fragment-a": [[100, 42], [111, 44], [121, 39], [116, 34], [105, 35]],
  "fragment-b": [[103, 36], [111, 37], [110, 32], [103, 32]],
  "fragment-c": [[109, 31], [121, 33], [121, 24], [110, 24]],
  "fragment-d": [[98, 31], [106, 31], [106, 24], [99, 25]],
  liao: [[105, 46], [121, 47], [126, 41], [118, 37], [108, 39]],
  xixia: [[99, 40], [107, 40], [106, 34], [99, 34]],
  song: [[106, 36], [119, 37], [122, 28], [117, 23], [105, 25]],
  mongol: [[91, 50], [111, 55], [128, 48], [122, 41], [106, 42]],
  "south-song": [[105, 32], [121, 33], [121, 24], [108, 23]],
  yuan: [[87, 49], [116, 55], [132, 48], [128, 37], [120, 24], [104, 23], [92, 31]],
  ming: [[98, 41], [111, 44], [122, 41], [122, 25], [109, 22], [100, 28]],
  "qing-core": [[79, 46], [93, 53], [123, 53], [132, 44], [124, 25], [108, 21], [91, 29]],
  northeast: [[118, 48], [130, 50], [134, 43], [124, 39], [118, 42]],
};

type HistoricalCity = { name: string; lon: number; lat: number };

const historicalCitiesByEra: Record<string, readonly HistoricalCity[]> = {
  qin: [qinXianyang],
  "chu-han": [
    qinXianyang,
    { name: "彭城", lon: 117.18, lat: 34.26 },
    { name: "滎陽", lon: 113.38, lat: 34.79 },
  ],
  "western-han": [
    { name: "長安", lon: 108.94, lat: 34.34 },
    { name: "洛陽", lon: 112.45, lat: 34.62 },
  ],
  xin: [{ name: "常安", lon: 108.94, lat: 34.34 }],
  "eastern-han": [
    { name: "洛陽", lon: 112.45, lat: 34.62 },
    { name: "長安", lon: 108.94, lat: 34.34 },
  ],
  "three-kingdoms": [
    hanWeiLuoyang,
    hanChangan,
    { name: "成都", lon: 104.07, lat: 30.67 },
    { name: "建業", lon: 118.8, lat: 32.06 },
  ],
  "western-jin": [{ name: "洛陽", lon: 112.45, lat: 34.62 }],
  "east-jin-sixteen": [
    { name: "建康", lon: 118.8, lat: 32.06 },
    { name: "長安", lon: 108.94, lat: 34.34 },
  ],
  "north-south": [
    { name: "建康", lon: 118.8, lat: 32.06 },
    { name: "平城", lon: 113.3, lat: 40.08 },
    { name: "洛陽", lon: 112.45, lat: 34.62 },
  ],
  sui: [
    { name: "大興城", lon: 108.94, lat: 34.34 },
    { name: "東都洛陽", lon: 112.45, lat: 34.62 },
  ],
  tang: [
    { name: "長安", lon: 108.94, lat: 34.34 },
    { name: "東都洛陽", lon: 112.45, lat: 34.62 },
  ],
  "five-ten": [
    { name: "汴州", lon: 114.3, lat: 34.8 },
    { name: "洛陽", lon: 112.45, lat: 34.62 },
    { name: "金陵", lon: 118.8, lat: 32.06 },
  ],
  liao: [
    { name: "上京臨潢府", lon: 118.9, lat: 43.9 },
    { name: "南京析津府", lon: 116.4, lat: 39.9 },
  ],
  "northern-song": [{ name: "東京開封府", lon: 114.3, lat: 34.8 }],
  "western-xia": [{ name: "興慶府", lon: 106.23, lat: 38.49 }],
  jin: [
    { name: "中都", lon: 116.4, lat: 39.9 },
    { name: "南京開封府", lon: 114.3, lat: 34.8 },
  ],
  "southern-song": [{ name: "臨安", lon: 120.16, lat: 30.25 }],
  mongol: [{ name: "哈拉和林", lon: 102.84, lat: 47.2 }],
  yuan: [{ name: "大都", lon: 116.4, lat: 39.9 }],
  ming: [
    { name: "南京", lon: 118.8, lat: 32.06 },
    { name: "北京", lon: 116.4, lat: 39.9 },
    { name: "西安府", lon: 108.94, lat: 34.34 },
  ],
  qing: [
    { name: "北京", lon: 116.4, lat: 39.9 },
    { name: "盛京", lon: 123.43, lat: 41.8 },
  ],
};

function projectLonLat(lon: number, lat: number): MapPoint {
  return [((lon - 70) / 75) * 1000, ((57 - lat) / 41) * 600];
}

function svgPath(
  points: readonly (readonly [number, number])[],
  close = false,
) {
  if (points.length === 0) return "";
  const commands = points.map(([x, y], index) => `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`);
  return `${commands.join(" ")}${close ? " Z" : ""}`;
}

type TransitionName = "yuan" | "qing";

const mapLabelAnchors: Record<string, [number, number]> = {
  unified: [112, 36.5], wei: [114, 37.5], shu: [103.5, 28], wu: [116, 27.5],
  north: [112, 39], south: [112, 27], "fragment-a": [113, 39],
  "fragment-b": [106, 34.5], "fragment-c": [117, 26.5], "fragment-d": [101, 27],
  liao: [118, 43], xixia: [102.5, 37], song: [115, 29], mongol: [110, 48],
  "south-song": [114, 27], yuan: [110, 40], ming: [113, 33], "qing-core": [102, 39],
  northeast: [126, 45],
};

function HistoryMap({
  eraId,
  eraName,
  activeTransition,
  transitionRun,
}: {
  eraId: string;
  eraName: string;
  activeTransition: TransitionName | null;
  transitionRun: number;
}) {
  const template = mapProfiles[eraMap[eraId] ?? "unified"];
  const snapshot = mapSnapshots[eraId];
  const isAtlas = Boolean(snapshot);
  const project = isAtlas ? projectAtlas : projectLonLat;
  const landShapes = isAtlas ? atlasLand : eastAsiaLand;
  const rivers = isAtlas ? atlasRivers : eastAsiaRivers;
  const mapHeight = isAtlas ? 700 : 600;
  const profile = snapshot ? { ...snapshot, mode: eraId } : template.mode === "unified"
    ? { ...template, title: `${eraName}核心範圍示意`, regions: [{ key: "unified", name: eraName }] }
    : template;
  const regionCoordinates = (key: string) => snapshot?.geometry[key] ?? historicalRegionCoordinates[key];
  const regionRings = (key: string) => [regionCoordinates(key), ...(snapshot?.extraGeometry?.[key] ?? [])];
  const mapId = useId().replace(/:/g, "");
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState<[number, number]>([0, 0]);
  const [selectedRegion, setSelectedRegion] = useState<string | null>(null);
  const [showCities, setShowCities] = useState(true);
  const mapFrame = useRef<HTMLDivElement>(null);
  const [frameSize, setFrameSize] = useState<[number, number]>([1000, 600]);
  useEffect(() => {
    const frame = mapFrame.current;
    if (!frame) return;
    const observer = new ResizeObserver(([entry]) => setFrameSize([entry.contentRect.width, entry.contentRect.height]));
    observer.observe(frame);
    return () => observer.disconnect();
  }, []);
  const regionPoints = profile.regions.flatMap((region) =>
    regionRings(region.key).flat().map(([lon, lat]) => project(lon, lat)));
  const minX = Math.min(...regionPoints.map(([x]) => x));
  const maxX = Math.max(...regionPoints.map(([x]) => x));
  const minY = Math.min(...regionPoints.map(([, y]) => y));
  const maxY = Math.max(...regionPoints.map(([, y]) => y));
  // 初始視窗聚焦當前政權；轉場保留完整東亞範圍，避免裁掉路線。
  const aspect = isAtlas ? Math.max(.6, Math.min(1.1, frameSize[1] / frameSize[0])) : .6;
  const baseWidth = activeTransition ? 1000 : Math.min(1000, Math.max(isAtlas ? 420 : 480, maxX - minX + 85, (maxY - minY + 85) / aspect));
  const baseHeight = Math.min(mapHeight, baseWidth * aspect);
  const centerX = activeTransition ? 500 : (minX + maxX) / 2;
  const centerY = activeTransition ? mapHeight / 2 : (minY + maxY) / 2;
  const width = baseWidth / zoom;
  const height = baseHeight / zoom;
  const viewX = Math.max(0, Math.min(1000 - width, centerX - width / 2 + pan[0]));
  const viewY = Math.max(0, Math.min(mapHeight - height, centerY - height / 2 + pan[1]));
  const regionNames = profile.regions.map((region) => region.name);
  const move = (dx: number, dy: number) => setPan([
    viewX + dx * width - (centerX - width / 2),
    viewY + dy * height - (centerY - height / 2),
  ]);
  const resetView = () => { setZoom(1); setPan([0, 0]); setSelectedRegion(null); };
  const historicalCities = historicalCitiesByEra[eraId] ?? [];
  const labelScale = Math.max(width / Math.max(1, frameSize[0]), height / Math.max(1, frameSize[1]));
  const labelRequests: MapLabel[] = snapshot ? [
    ...(showCities ? historicalCities.filter(city => frameSize[0] >= 600 || zoom > 1 || snapshot.capitals.includes(city.name)).map(city => {
      const [x, y] = project(city.lon, city.lat);
      return {id: city.name, name: city.name, x, y, kind: "city" as const};
    }) : []),
    ...(frameSize[0] >= 600 || zoom > 1 ? profile.regions : []).map(region => {
      const [x, y] = project(...snapshot.labels[region.key]);
      return {id: region.key, name: region.name, x, y, kind: "region" as const};
    }),
    ...(frameSize[0] >= 600 ? [
      { name: "青藏高原", lon: 94, lat: 33 }, { name: "四川盆地", lon: 105.5, lat: 30.5 },
      { name: "秦嶺", lon: 106.6, lat: 33.5 }, { name: "黃河", lon: 109, lat: 38 },
      { name: "渭河", lon: 107.3, lat: 34.4 },
      { name: "長江", lon: 115.7, lat: 30.4 }, { name: "東海", lon: 125.5, lat: 27.5 },
      { name: "南海", lon: 115, lat: 18.5 },
    ].concat(snapshot.uncertainArea ? [{name: snapshot.uncertainArea.name, lon: snapshot.uncertainArea.label[0], lat: snapshot.uncertainArea.label[1]}] : []).map(place => { const [x, y] = project(place.lon, place.lat);
      return {id: `geo-${place.name}`, name: place.name, x, y, kind: "geography" as const};
    }) : []),
  ] : [];
  const placedLabels = placeMapLabels(labelRequests, [viewX, viewY, width, height], labelScale);
  const northPosition: MapPoint = [viewX + width - 33 * labelScale, viewY + 47 * labelScale];
  const northGeo = isAtlas ? unprojectAtlas(...northPosition) : [105, 35];
  const northTip = project(northGeo[0], northGeo[1] + .1);
  const northAngle = isAtlas ? Math.atan2(northTip[0] - northPosition[0], northPosition[1] - northTip[1]) * 180 / Math.PI : 0;
  const mapTransition: TransitionName | null =
    eraId === "mongol"
      ? "yuan"
      : eraId === "ming"
        ? "qing"
        : null;
  const isPlaying = mapTransition !== null && activeTransition === mapTransition;
  const yuanRoute = svgPath([
    projectLonLat(108, 48),
    projectLonLat(111, 43),
    projectLonLat(116.4, 39.9),
    projectLonLat(118.8, 32.1),
    projectLonLat(120.2, 30.2),
  ]);
  const qingRoute = svgPath([
    projectLonLat(125, 43),
    projectLonLat(122.5, 41.5),
    projectLonLat(119.75, 40),
    projectLonLat(116.4, 39.9),
  ]);
  const activeRoute = mapTransition === "yuan" ? yuanRoute : qingRoute;

  return (
    <div className={`map-panel${isAtlas ? " map-atlas" : ""}`} aria-label={`${eraName}歷史範圍示意地圖`}>
      <div className="map-heading">
        <div>
          <span className="map-kicker">歷史地理圖冊 · {eraName}</span>
          <strong>{profile.title}</strong><span className="map-period">{snapshot?.year ?? eras.find((era) => era.id === eraId)?.years} · {snapshot ? "重繪樣板，疆界待校核" : "舊概略範圍，待重繪"}</span>
        </div>
        {mapTransition && (
          <span className="map-transition-hint">
            下一時代：{mapTransition === "yuan" ? "蒙古軍南下，元朝建立" : "明末清軍通過山海關"}
          </span>
        )}
      </div>
      <div className="map-toolbar" aria-label="地圖操作">
        <div className="map-zoom-controls">
          <button type="button" aria-label="放大地圖" disabled={zoom >= 3} onClick={() => setZoom((value) => Math.min(3, value + .5))}>＋</button>
          <output aria-live="polite">{Math.round(zoom * 100)}%</output>
          <button type="button" aria-label="縮小地圖" disabled={zoom <= 1} onClick={() => setZoom((value) => Math.max(1, value - .5))}>−</button>
          <button type="button" onClick={resetView}>重設視圖</button>
        </div>
        <button type="button" aria-pressed={showCities} onClick={() => setShowCities(!showCities)}>{showCities ? "隱藏地名" : "顯示地名"}</button>
      </div>
      <p className="map-orientation" aria-label="地圖方向">{isAtlas ? "山河與都城" : "北 ↑"} <span>歷史範圍示意</span></p>
      <div className="map-canvas real-geo-map" ref={mapFrame} tabIndex={0}
        role="group" aria-label="歷史地圖；放大後可用方向鍵移動，Home重設視圖"
        onKeyDown={(event) => {
          const directions: Record<string, [number, number]> = { ArrowLeft: [-.15, 0], ArrowRight: [.15, 0], ArrowUp: [0, -.15], ArrowDown: [0, .15] };
          if (event.key === "Home") { event.preventDefault(); resetView(); }
          else if (zoom > 1 && directions[event.key]) {
            event.preventDefault(); move(...directions[event.key]);
          }
        }}>
        <svg viewBox={`${viewX} ${viewY} ${width} ${height}`} role="img" aria-label={`${eraName}在東亞真實地理上的歷史範圍示意`}>
          <defs>
            <clipPath id={`land-${mapId}`} clipPathUnits="userSpaceOnUse">
              {landShapes.map((ring, index) => <path d={svgPath(ring, true)} key={index} />)}
            </clipPath>
            <pattern id={`water-${mapId}`} width="24" height="24" patternUnits="userSpaceOnUse">
              <path d="M0 12 Q6 9 12 12 T24 12" fill="none" stroke="#709eaa" strokeWidth=".35" opacity=".2" />
            </pattern>
            {snapshot?.uncertainArea && <pattern id={`uncertain-${mapId}`} width={8 * labelScale} height={8 * labelScale} patternUnits="userSpaceOnUse">
              <path d={`M${-2 * labelScale} ${2 * labelScale} L${2 * labelScale} ${-2 * labelScale} M0 ${8 * labelScale} L${8 * labelScale} 0 M${6 * labelScale} ${10 * labelScale} L${10 * labelScale} ${6 * labelScale}`} fill="none" stroke="#927443" strokeWidth={.8 * labelScale} opacity=".65" />
            </pattern>}
          </defs>
          <rect className="map-ocean" width="1000" height={mapHeight} />
          {!isAtlas && <rect width="1000" height={mapHeight} fill={`url(#water-${mapId})`} />}
          <g className="map-land-shapes" aria-hidden="true">
            {landShapes.map((ring, index) => (
              <path d={svgPath(ring, true)} key={`land-${index}`} />
            ))}
          </g>
          <image className="map-relief" href={isAtlas ? "/maps-v18/china-atlas-albers.webp" : "/maps-v18/china-relief.webp"} x="0" y="0" width="1000" height={mapHeight} preserveAspectRatio="none" clipPath={isAtlas ? `url(#land-${mapId})` : undefined} aria-hidden="true" />
          <g className={`historical-regions map-${profile.mode}`} clipPath={`url(#land-${mapId})`}>
            {profile.regions.map((region) => {
              const coordinates = regionCoordinates(region.key);
              if (!coordinates) throw new Error(`地圖缺少區域資料：${region.key}`);
              const fillPath = regionRings(region.key).map(ring => svgPath(ring.map(([lon, lat]) => project(lon, lat)), true)).join(" ");
              const boundary = snapshot?.boundaryGeometry?.[region.key];
              const uncertainPath = (snapshot?.uncertainGeometry?.[region.key] ?? []).map(ring => svgPath(ring.map(([lon, lat]) => project(lon, lat)), true)).join(" ");
              return (
                <g className={`geo-region geo-region-${region.key} ${selectedRegion && selectedRegion !== region.key ? "is-muted" : ""} ${selectedRegion === region.key ? "is-selected" : ""}`} key={region.key}>
                  {uncertainPath && <defs><clipPath id={`range-${mapId}-${region.key}`} clipPathUnits="userSpaceOnUse"><path d={fillPath} /></clipPath></defs>}
                  <path className={boundary ? "map-range-fill" : undefined} d={uncertainPath ? `${fillPath} ${uncertainPath}` : fillPath} fillRule="evenodd" clipPath={uncertainPath ? `url(#range-${mapId}-${region.key})` : undefined} />
                  {uncertainPath && <path className="map-uncertain-fill" d={uncertainPath} clipPath={`url(#range-${mapId}-${region.key})`} style={{fill: `url(#uncertain-${mapId})`, fillOpacity: 1, stroke: "none"}}><title>{snapshot?.uncertainArea?.note}</title></path>}
                  {boundary && <path className="map-boundary" d={boundary.map(line => svgPath(line.map(([lon, lat]) => project(lon, lat)))).join(" ")} />}

                </g>
              );
            })}
          </g>
          <g className="map-rivers" aria-hidden="true">
            {rivers.map((river, index) => <path d={svgPath(river.points)} data-river={river.name} key={`${river.name}-${index}`} />)}
          </g>
          {isAtlas && <g className="atlas-coast" aria-hidden="true">{atlasCoast.map((line, index) => <path d={svgPath(line)} key={index} />)}</g>}
          <g className="map-region-labels" aria-hidden="true" display={snapshot ? "none" : undefined}>
            {profile.regions.map((region) => {
              const anchor = snapshot?.labels[region.key] ?? mapLabelAnchors[region.key];
              if (!anchor) return null;
              const [x, y] = project(...anchor);
              return <text key={region.key} x={x} y={y}>{region.name}</text>;
            })}
          </g>
          <g className="map-geography-labels" aria-hidden="true" display={isAtlas ? "none" : undefined}>
            {[
              {name:"青藏高原",point:projectLonLat(91,33)},
              {name:"秦嶺",point:projectLonLat(107,33.5)},
              {name:"四川盆地",point:projectLonLat(104,29.5)},
              {name:"黃河",point:projectLonLat(109,38)},
              {name:"長江",point:projectLonLat(115.7,30.4)},
            ].filter(({point:[x,y]}) => x > viewX + 40 && x < viewX + width - 40 && y > viewY + 20 && y < viewY + height - 20)
              .map(({name,point:[x,y]}) => <text key={name} x={x} y={y}>{name}</text>)}
          </g>
          <g className={`map-city-labels ${zoom > 1 ? "is-zoomed" : ""}`} visibility={showCities ? "visible" : "hidden"}>
            {historicalCities.map((city) => {
              const [x, y] = project(city.lon, city.lat);
              return (
                <g key={city.name} className={snapshot && !snapshot.capitals.includes(city.name) ? "non-capital" : ""} transform={`translate(${x} ${y})`}>
                  {snapshot?.capitals.includes(city.name)
                    ? <path className="capital-star" transform={`scale(${labelScale})`} d="M0,-7 L2,-2 L7,-2 L3,1 L4,6 L0,3 L-4,6 L-3,1 L-7,-2 L-2,-2 Z" />
                    : <circle r="5" />}
                  {!snapshot && <text x="9" y={city.name === "洛陽" ? "20" : "-9"}>{city.name}</text>}
                </g>
              );
            })}
          </g>
          {snapshot && <g className="map-readable-labels" aria-hidden="true">
            {placedLabels.map(label => <g key={label.id}>
              {label.kind === "city" && <line x1={label.x} y1={label.y} x2={Math.max(label.left, Math.min(label.x, label.left + label.width))} y2={label.top + label.height / 2} />}
              <text data-label-kind={label.kind} x={label.left + label.width / 2} y={label.top + label.height / 2}
                style={{fontSize: label.fontSize}}>{label.name}</text>
            </g>)}
          </g>}
          {isAtlas && <g className="atlas-compass" transform={`translate(${northPosition.join(" ")}) scale(${labelScale}) rotate(${northAngle})`} aria-hidden="true">
            <path d="M0,9 L0,-20 M-5,-11 L0,-20 L5,-11" />
            <text x="0" y="-28">北</text>
          </g>}
          {eraId === "ming" && (
            <g className="great-wall-pass">
              <path d={svgPath([[106.2, 38.5], [110.1, 40], [113, 40.2], [116, 40.6], [119.75, 40]].map(([lon, lat]) => projectLonLat(lon, lat)))} />
              <text x="535" y="220">長城防線</text>
              <g transform={`translate(${projectLonLat(119.75, 40).join(" ")})`}>
                <circle className={isPlaying ? "pass-pulse" : ""} r="9" />
                <path className="pass-fort" d="M-10,5 L-10,-5 L-5,-5 L-5,-11 L5,-11 L5,-5 L10,-5 L10,5 Z" />
                <text x="14" y="5">山海關</text>
              </g>
            </g>
          )}
          {mapTransition && (
            <g className={`map-transition-overlay ${isPlaying ? "playing" : ""}`}>
              <path className="map-transition-route" d={activeRoute} />
              {isPlaying && (
                <g key={`${mapTransition}-${transitionRun}`} className="map-animated-rider">
                  <svg x="-54" y="-72" width="108" height="92" viewBox={mapTransition === "yuan" ? "0 0 887 887" : "887 0 887 887"}>
                    <image href="/map-riders-v2.png" width="1774" height="887" />
                  </svg>
                  <animateMotion dur={mapTransition === "yuan" ? "5.8s" : "4.8s"} fill="freeze" path={activeRoute} />
                </g>
              )}
            </g>
          )}
          <text className="map-north" x="934" y="42">北 ↑</text>
          <text className="map-sea-label" x="815" y="410">東海</text>
        </svg>
      </div>
      {zoom > 1 && <div className="map-pan-controls" aria-label="移動地圖">
        <button type="button" onClick={() => move(-.2, 0)} aria-label="向西移動">← 西</button>
        <button type="button" onClick={() => move(0, -.2)} aria-label="向北移動">↑ 北</button>
        <button type="button" onClick={() => move(0, .2)} aria-label="向南移動">↓ 南</button>
        <button type="button" onClick={() => move(.2, 0)} aria-label="向東移動">東 →</button>
      </div>}
      <div className="map-legend" aria-label="選擇政權">
        {profile.regions.map((region) => <button type="button" key={region.key}
          className={`legend-${region.key}`} aria-pressed={selectedRegion === region.key}
          onClick={() => setSelectedRegion(selectedRegion === region.key ? null : region.key)}>
          <i aria-hidden="true" />{region.name}
        </button>)}
      </div>
      <div className="map-reading-guide" aria-live="polite">
        <strong>{selectedRegion ? profile.regions.find((region) => region.key === selectedRegion)?.name : "讀圖線索"}</strong>
        <p>{profile.note}</p>
        {snapshot?.uncertainArea && <p className="map-uncertainty-note"><i aria-hidden="true" />斜線：永昌郡西南界待核，不表示整郡都未受控制。</p>}
        <span>主要城市：{historicalCities.map((city) => city.name).join("、") || "本圖未標示"}。</span>
      </div>
      <details className="map-source-note"><summary>圖冊說明與資料來源</summary>
        <p>以真實地理底圖呈現{regionNames.join("、")}的概略位置。邊界會隨年代改變，本圖用來辨認相對位置，不代表精密疆界或現代國界。</p>
        <p>海岸與河流使用公開領域地理資料，代表現代地理參照，不代表古代河道與海岸完全相同。</p>
        {isAtlas && <p>圖冊底板採Albers等積圓錐投影；海岸、地形、河流、城市與歷史範圍使用同一座標轉換。北向標依所在經線計算，暖色陰影不作高程讀值。</p>}
        {!snapshot && <p>本節仍沿用舊概略範圍，尚未依明確代表年份重建。章節年代不是全圖各地同時受控的證據；並存政權、都城與邊界仍待逐一核對。</p>}
        {snapshot && <p>歷史輪廓：<a href={snapshot.source} target="_blank" rel="noreferrer">{snapshot.credit}</a>（<a href={snapshot.licenseUrl} target="_blank" rel="noreferrer">{snapshot.license}</a>）。本圖依原圖重新描繪、簡化並近似配準，非精密疆界；星形表示此時點的都城。</p>}
        {snapshot?.cityReference && <p>{snapshot.cityReference.note} <a href={snapshot.cityReference.url} target="_blank" rel="noreferrer">{snapshot.cityReference.name}</a></p>}
        {snapshot?.uncertainArea && <p>{snapshot.uncertainArea.note}</p>}
      </details>
      {mapTransition && (
        <p className="map-transition-caption">
          {mapTransition === "yuan"
            ? "蒙古帝國建立後持續向南發展；1271 年忽必烈定國號為元，1279 年南宋結束。按「下一時代」觀看轉場。"
            : "明朝末年，1644 年李自成攻入北京後，吳三桂與清軍聯合，清軍經山海關進入關內。按「下一時代」觀看轉場，再進入清朝。"}
        </p>
      )}
    </div>
  );
}

// 只調整橫向清單，不把讀者從目前段落拉走。
function centerSelectedEra(container: HTMLDivElement | null) {
  const active = container?.querySelector<HTMLElement>('[aria-pressed="true"], [aria-selected="true"]');
  if (!container || !active) return;
  const offset = active.getBoundingClientRect().left - container.getBoundingClientRect().left;
  container.scrollTo({ left: container.scrollLeft + offset - (container.clientWidth - active.clientWidth) / 2, behavior: "instant" });
}

export default function Home() {
  const transitionTimer = useRef<number | null>(null);
  const openingRequested = useRef(false);
  const entryHeading = useRef<HTMLHeadingElement>(null);
  const timelineTrack = useRef<HTMLDivElement>(null);
  const militaryTabs = useRef<HTMLDivElement>(null);
  const [entered, setEntered] = useState(false);
  const [opening, setOpening] = useState(false);
  const [selectedEraId, setSelectedEraId] = useState("qin");
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [quizRound, setQuizRound] = useState<QuizItem[]>(() => quizBank.slice(0, 3));
  const [selectedMilitaryEraId, setSelectedMilitaryEraId] = useState("qin");
  const [activeTransition, setActiveTransition] = useState<"yuan" | "qing" | null>(null);
  const [transitionRun, setTransitionRun] = useState(0);

  const selectedEra = useMemo(
    () => eras.find((era) => era.id === selectedEraId) ?? eras[0],
    [selectedEraId],
  );
  const selectedMilitaryEra = useMemo(
    () => eras.find((era) => era.id === selectedMilitaryEraId) ?? eras[0],
    [selectedMilitaryEraId],
  );
  const selectedMilitaryItems =
    militaryByEra[selectedMilitaryEraId] ?? militaryByEra.qin;
  const selectedEraIndex = eras.findIndex((era) => era.id === selectedEra.id);
  const previousEra = selectedEraIndex > 0 ? eras[selectedEraIndex - 1] : null;
  const nextEra = selectedEraIndex < eras.length - 1 ? eras[selectedEraIndex + 1] : null;
  const selectedEraGuideMark = eraGuideMarks[selectedEra.id];
  const upcomingTransition: TransitionName | null =
    selectedEra.id === "mongol" ? "yuan" : selectedEra.id === "ming" ? "qing" : null;
  const completedQuiz = Object.keys(answers).length === quizRound.length;
  const score = quizRound.reduce(
    (total, item, index) => total + (answers[index] === item.answer ? 1 : 0),
    0,
  );

  useEffect(() => {
    if (!entered) return;
    window.scrollTo({ top: 0, behavior: "instant" });
    entryHeading.current?.focus({ preventScroll: true });
  }, [entered]);
  useEffect(() => {
    if (!entered) return;
    centerSelectedEra(timelineTrack.current);
    centerSelectedEra(militaryTabs.current);
  }, [entered, selectedEraId, selectedMilitaryEraId]);

  function openBook() {
    if (openingRequested.current) return;
    openingRequested.current = true;
    setOpening(true);
    setQuizRound(drawQuizRound());
    setAnswers({});
  }

  function chooseEra(id: string) {
    if (transitionTimer.current !== null) {
      window.clearTimeout(transitionTimer.current);
      transitionTimer.current = null;
    }
    setSelectedEraId(id);
    setSelectedMilitaryEraId(id);
    setActiveTransition(null);
    window.setTimeout(() => {
      document
        .getElementById("era-detail")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 50);
  }

  function playTransition(name: "yuan" | "qing") {
    setActiveTransition(name);
    setTransitionRun((current) => current + 1);
  }

  function advanceEra() {
    if (!nextEra || activeTransition) return;
    if (!upcomingTransition) {
      chooseEra(nextEra.id);
      return;
    }

    playTransition(upcomingTransition);
    const duration = upcomingTransition === "yuan" ? 6000 : 5000;
    transitionTimer.current = window.setTimeout(() => {
      transitionTimer.current = null;
      chooseEra(nextEra.id);
    }, duration);
  }

  function changeQuizRound() {
    setQuizRound(drawQuizRound());
    setAnswers({});
  }

  if (!entered) {
    return (
      <main className={`book-stage ${opening ? "is-opening" : ""}`}>
        <div className="stars" aria-hidden="true" />
        <div className="stage-copy">
          <p className="eyebrow light">穿越中國帝制時代</p>
          <h1>翻開歷史，<br />喚醒千年故事</h1>
          <p className="stage-lead">
            皇帝、軍師、騎射、戰船與火砲——<br />
            每一頁，都藏著下一個謎題。
          </p>
        </div>

        <OpeningBook opening={opening} onOpen={openBook} onComplete={() => setEntered(true)} />
        <p className="version-mark">v1.8</p>
      </main>
    );
  }

  return (
    <main className="site-shell">
      <header className="topbar">
        <a className="brand" href="#top" aria-label="回到首頁">
          <span className="brand-seal" aria-hidden="true">史</span>
          <span>
            <strong>中國歷史冒險書</strong>
            <small>帝制時代 · v1.8</small>
          </span>
        </a>
        <nav aria-label="主要導覽">
          <a href="#timeline">朝代長河</a>
          <a href="#stories">重點篇章</a>
          <a href="#arsenal">武器圖鑑</a>
          <a href="#quiz">真假挑戰</a>
        </nav>
      </header>

      <section className="hero" id="top">
        <div className="hero-ink" aria-hidden="true">秦</div>
        <div className="hero-copy">
          <p className="eyebrow">你的第一站 · 西元前 221 年</p>
          <h1 ref={entryHeading} tabIndex={-1}>六國歸一，<br /><em>帝制時代從這裡展開。</em></h1>
          <p>
            秦始皇統一六國後，文字、貨幣與度量衡都有了共同標準。
            但這個強大的王朝，為什麼只維持十多年？
          </p>
          <nav className="reading-route" aria-label="互動書閱讀路線">
            <a href="#timeline"><span className="reading-step-number" aria-hidden="true">01</span><span><strong>選朝代</strong><small>人物山河</small></span></a>
            <a href="#arsenal"><span className="reading-step-number" aria-hidden="true">02</span><span><strong>看軍事</strong><small>軍事百科</small></span></a>
            <a href="#quiz"><span className="reading-step-number" aria-hidden="true">03</span><span><strong>答三題</strong><small>真假挑戰</small></span></a>
          </nav>
        </div>
        <div className="hero-art hero-qin-illustration" aria-label="精緻秦代弩手與戈兵歷史插圖">
          <p>西元前 221</p>
        </div>
      </section>

      <section className="timeline-section" id="timeline">
        <div className="section-heading">
          <div>
            <p className="eyebrow">完整主線 · 一段也不跳過</p>
            <h2>兩千年的朝代長河</h2>
          </div>
          <p className="section-intro">
            遇到南北並立或多國共存，時間軸會特別標示。點選任一時代，
            看人物、特色與軍事科技。
          </p>
        </div>

        <div className="legend" aria-label="時間軸圖例">
          <span><i className="legend-dot chapter" />重點篇章</span>
          <span><i className="legend-dot timeline" />時代節點</span>
          <span><i className="legend-dot parallel" />並存政權</span>
        </div>

        <div className="timeline-track" ref={timelineTrack} role="group" aria-label="秦至清朝代時間軸">
          {eras.map((era, index) => {
            const guideMark = eraGuideMarks[era.id];
            return (
              <button
                className={`era-card ${era.kind} ${selectedEraId === era.id ? "active" : ""}`}
                type="button"
                key={era.id}
                onClick={() => chooseEra(era.id)}
                aria-pressed={selectedEraId === era.id}
                aria-label={`${era.name}，${era.years}，本站導覽印記`}
              >
                <span className="era-index">{String(index + 1).padStart(2, "0")}</span>
                <span className={`era-mark era-guide-seal guide-length-${Math.min(guideMark.length, 5)}`} aria-hidden="true">
                  <span>{guideMark}</span>
                </span>
                <strong>{era.name}</strong>
                <span className="era-motif-label">導覽印記</span>
                <small>{era.years}</small>
              </button>
            );
          })}
        </div>
        <p className="motif-note">※ 方印是本站為辨認朝代設計的導覽圖形，不是古代國徽、官印或出土文物；真實文物會在各篇章另外介紹。</p>

        <article className="era-detail" id="era-detail">
          <nav className="era-pager" aria-label="切換上一個或下一個時代">
            <button type="button" disabled={!previousEra || activeTransition !== null} onClick={() => previousEra && chooseEra(previousEra.id)}>
              <span>← 上一時代</span>
              <strong>{previousEra ? previousEra.name : "已是第一站"}</strong>
            </button>
            <div className="era-jump">
              <label htmlFor="reading-era">第 {selectedEraIndex + 1} 站 · 共 {eras.length} 站</label>
              <select id="reading-era" aria-label="選擇閱讀朝代" value={selectedEraId}
                disabled={activeTransition !== null} onChange={event => chooseEra(event.target.value)}>
                {eras.map((era, index) => <option value={era.id} key={era.id}>{String(index + 1).padStart(2, "0")} · {era.name}</option>)}
              </select>
            </div>
            <button type="button" disabled={!nextEra || activeTransition !== null} onClick={advanceEra}>
              <span>{activeTransition ? "轉場播放中…" : upcomingTransition ? "播放轉場，再到下一時代 →" : "下一時代 →"}</span>
              <strong>{nextEra ? nextEra.name : "帝制時代終點"}</strong>
            </button>
          </nav>
          <div className="era-information">
            <div className="detail-lead">
              <div className="detail-stamp detail-guide-seal" aria-label={`${selectedEra.name}本站導覽印記`}>
                <strong>{selectedEraGuideMark}</strong>
                <small>本站導覽印記</small>
              </div>
              <div className="detail-main">
                <div className="detail-title">
                  <span className={`kind-pill ${selectedEra.kind}`}>
                    {selectedEra.kind === "chapter"
                      ? "重點篇章"
                      : selectedEra.kind === "parallel"
                        ? "並存政權"
                        : "時代節點"}
                  </span>
                  <p>{selectedEra.years}</p>
                  <h3>{selectedEra.name}</h3>
                </div>
                <p className="detail-summary">{selectedEra.summary}</p>
              </div>
            </div>
            <div className="detail-grid">
              <div>
                <span>💡 今天記住</span>
                <p>{selectedEra.remember}</p>
              </div>
              <div>
                <span>👤 關鍵人物</span>
                <p>{selectedEra.people}</p>
              </div>
              <div>
                <span>⚔️ 軍事與科技</span>
                <p>{selectedEra.gear}</p>
              </div>
            </div>
          </div>
          <HistoryMap key={selectedEra.id}
            eraId={selectedEra.id}
            eraName={selectedEra.name}
            activeTransition={activeTransition}
            transitionRun={transitionRun}
          />
        </article>
      </section>

      <section className="stories-section" id="stories">
        <div className="section-heading light-heading">
          <div>
            <p className="eyebrow light">先看預告，再回書中找答案</p>
            <h2>六個不能錯過的篇章</h2>
          </div>
          <p className="section-intro">
            每篇只揭開故事的第一扇門，完整冒險要留給家裡的歷史書。
          </p>
        </div>
        <div className="story-grid">
          {storyHighlights.map((story) => (
            <article className={`story-card ${story.color}`} key={story.number}>
              <div className="story-meta">
                <span>{story.number}</span>
                <small>{story.era}</small>
              </div>
              <h3>{story.title}</h3>
              <p>{story.text}</p>
              <span className="story-prompt">故事待你翻書解鎖 ↗</span>
            </article>
          ))}
        </div>
        <aside className="truth-banner">
          <span className="truth-icon">真？</span>
          <div>
            <p className="eyebrow">史實辨識站</p>
            <h3>小說很精彩，歷史更值得追問</h3>
            <p>
              網站會用「史書記載」「歷史小說」「構造未明」三種標籤，
              告訴你哪些有證據、哪些是後人改編。
            </p>
          </div>
          <div className="truth-tags">
            <span>史書記載</span>
            <span>歷史小說</span>
            <span>仍有爭議</span>
          </div>
        </aside>
      </section>

      <section className="arsenal-section" id="arsenal">
        <div className="section-heading">
          <div>
            <p className="eyebrow">工程、速度與戰術</p>
            <h2>歷代軍事科技圖鑑</h2>
          </div>
          <p className="section-intro">
            不只看誰打贏，更要看武器怎麼運作、糧草怎麼送到，以及科技如何改變戰場。
          </p>
        </div>
        <div className="military-browser">
          <div className="military-picker">
            <label htmlFor="military-era">直接選擇軍事時代</label>
            <select id="military-era" aria-label="選擇軍事百科朝代" value={selectedMilitaryEraId}
              onChange={event => setSelectedMilitaryEraId(event.target.value)}>
              {eras.map((era, index) => <option value={era.id} key={era.id}>{String(index + 1).padStart(2, "0")} · {era.name}</option>)}
            </select>
          </div>
          <div className="military-tabs" ref={militaryTabs} role="tablist" aria-label="選擇要查看軍事資料的時代">
            {eras.map((era) => (
              <button
                type="button"
                role="tab"
                id={`military-tab-${era.id}`}
                aria-controls="military-era-panel"
                aria-selected={selectedMilitaryEraId === era.id}
                tabIndex={selectedMilitaryEraId === era.id ? 0 : -1}
                className={selectedMilitaryEraId === era.id ? "active" : ""}
                key={era.id}
                onClick={() => setSelectedMilitaryEraId(era.id)}
                onKeyDown={event => {
                  const current = eras.findIndex(item => item.id === era.id);
                  const next = event.key === "ArrowRight" ? (current + 1) % eras.length
                    : event.key === "ArrowLeft" ? (current - 1 + eras.length) % eras.length
                    : event.key === "Home" ? 0 : event.key === "End" ? eras.length - 1 : null;
                  if (next === null) return;
                  event.preventDefault();
                  setSelectedMilitaryEraId(eras[next].id);
                  document.getElementById(`military-tab-${eras[next].id}`)?.focus({ preventScroll: true });
                }}
              >
                {era.name}
              </button>
            ))}
          </div>
          <div className="military-era-panel" id="military-era-panel" role="tabpanel"
            aria-labelledby={`military-tab-${selectedMilitaryEraId}`} tabIndex={0}>
            <header className="military-era-heading">
              <div>
                <span>{selectedMilitaryEra.years}</span>
                <h3><span className="military-title-part">{selectedMilitaryEra.name}</span><span className="military-title-part">軍事百科</span></h3>
                <p>兵種、武器、戰術、城防與後勤——至少四個角度理解這個時代。</p>
              </div>
              <button type="button" onClick={() => chooseEra(selectedMilitaryEra.id)}>
                回到「{selectedMilitaryEra.name}」朝代介紹 ↑
              </button>
            </header>
            <div className="military-item-grid">
              {selectedMilitaryItems.map((item, index) => {
                const itemKey = `${selectedMilitaryEraId}-${item.name}-${index}`;
                const visual = resolveMilitaryVisual(selectedMilitaryEraId, item, index);
                const redraw = militaryRedraws[selectedMilitaryEraId]?.[item.name];
                const spriteClass = visual.sheet === 4
                  ? `cavalry-sprite-${visual.sprite}`
                  : `sprite-${visual.sprite}`;
                return (
                  <article
                    className={`military-item static-card ${redraw ? "is-redrawn" : ""}`}
                    key={itemKey}
                  >
                    {redraw ? <img className="military-redraw" src={redraw.src} alt={redraw.alt} width="1200" height="800" loading="lazy" decoding="async" /> : <div
                      className={`weapon-art military-visual sheet-${visual.sheet} ${spriteClass}`}
                      aria-hidden="true"
                    />}
                    <div className="military-item-copy">
                      <span>{item.category}</span>
                      <h4>{item.name}</h4>
                      <p>{item.text}</p>
                      <small>{redraw?.caption ?? "靜態圖解"}</small>
                      {redraw && <details className="military-art-sources"><summary>插畫參考</summary>
                        <p>{redraw.note}</p>
                        {redraw.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.name}</a>)}
                      </details>}
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>

        <div className="atlas-subheading">
          <p className="eyebrow">跨朝代比較</p>
          <h3>18 件代表裝備與軍事科技</h3>
          <p>同一種技術可能跨越多個朝代；比較它們如何延續、改變或被新技術取代。</p>
        </div>
        <div className="weapon-grid">
          {[...weapons, ...extraWeapons].map((weapon, index) => {
            const redraw = equipmentRedraws[weapon.name];
            return (
            <article
              className={`weapon-card static-card ${redraw ? "is-redrawn" : ""}`}
              key={weapon.name}
            >
              {redraw ? <img className="equipment-redraw" src={redraw.src} alt={redraw.alt} width="1200" height="800" loading="lazy" decoding="async" /> : <div
                className={`weapon-art sheet-${index < 9 ? 1 : 2} sprite-${(index % 9) + 1}`}
                aria-hidden="true"
              />}
              <div className="weapon-copy">
                <div className="weapon-title">
                  <span>{weapon.era}</span>
                  <small>{weapon.type}</small>
                </div>
                <h3>{weapon.name}</h3>
                <p>{weapon.text}</p>
                {redraw && <p className="equipment-era">插圖代表：{redraw.representativeEra}</p>}
                <span className="weapon-play">{redraw?.caption ?? "靜態圖解"}</span>
                {redraw && <details className="equipment-art-sources"><summary>插畫參考</summary>
                  <p>{redraw.note}</p>
                  {redraw.sources.map(source => <a href={source.url} key={source.url} target="_blank" rel="noreferrer">{source.name}</a>)}
                </details>}
              </div>
            </article>
            );
          })}
        </div>
      </section>

      <section className="quiz-section" id="quiz">
        <div className="quiz-heading">
          <div>
            <p className="eyebrow light">歷史偵探考驗</p>
            <h2>史實，還是小說？</h2>
            <p>題庫共 {quizBank.length} 題，每回隨機抽三題；答完還能換一組。</p>
          </div>
          <button className="quiz-refresh" type="button" onClick={changeQuizRound}>↻ 換三題</button>
        </div>
        <div className="quiz-list">
          {quizRound.map((item, index) => {
            const chosen = answers[index];
            return (
              <article className="quiz-card" key={item.id}>
                <span className="quiz-number">{index + 1}</span>
                <h3>{item.question}</h3>
                <div className="quiz-options">
                  {item.options.map((option) => (
                    <button
                      type="button"
                      key={option}
                      className={
                        chosen === option
                          ? option === item.answer
                            ? "correct"
                            : "wrong"
                          : ""
                      }
                      onClick={() =>
                        setAnswers((current) => ({
                          ...current,
                          [index]: option,
                        }))
                      }
                      aria-pressed={chosen === option}
                    >
                      {option}
                    </button>
                  ))}
                </div>
                {chosen && (
                  <p className={`quiz-explain ${chosen === item.answer ? "is-correct" : ""}`}>
                    {chosen === item.answer ? "答對了！" : "再看仔細！"} {item.explain}
                  </p>
                )}
              </article>
            );
          })}
        </div>
        <div className={`score-card ${completedQuiz ? "visible" : ""}`} aria-live="polite">
          {completedQuiz ? (
            <>
              <span>完成挑戰</span>
              <strong>{score} / {quizRound.length}</strong>
              <p>{score === quizRound.length ? "滿分歷史偵探！" : "線索都找到了，再試一次就會更厲害。"}</p>
            </>
          ) : (
            <p>完成三題，取得你的歷史偵探分數。</p>
          )}
        </div>
      </section>

      <section className="next-chapter">
        <p className="eyebrow">未完待續</p>
        <h2>歷史不只是年代，<br />是一本等你追下去的故事。</h2>
        <p>下一步會把你家中的整套書，逐冊連接到對應篇章。</p>
        <a href="#timeline">再選一個朝代探索 ↑</a>
      </section>

      <footer>
        <div>
          <strong>中國歷史冒險書 v1.8</strong>
          <p>穿越中國帝制時代 · 給小小歷史探險家的互動入口</p>
        </div>
        <div className="copyright">
          <p>© 2026 Tso KY - All Rights Reserved</p>
          <p>Protected against reverse engineering and unauthorized modification</p>
        </div>
      </footer>
    </main>
  );
}
