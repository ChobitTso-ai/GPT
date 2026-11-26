/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 秦／漢魏古城定位 v1.0
 * 城市尺度代表點；不作遺址導航或考古測量座標。
 */
export const qinXianyang = {
  name: "咸陽", lon: 108.86, lat: 34.41,
};

// UNESCO 1442-001 未央宮遺址；以宮址代表漢長安，不指今日西安市中心。
export const hanChangan = {
  name: "長安", lon: 108 + 51 / 60 + 26 / 3600, lat: 34 + 18 / 60 + 16 / 3600,
};

// UNESCO 1442-002 漢魏洛陽故城；與隋唐洛陽及今日市中心分開。
export const hanWeiLuoyang = {
  name: "洛陽", lon: 112 + 37 / 60 + 17 / 3600, lat: 34 + 43 / 60 + 52 / 3600,
};

export const mapSiteReferences = {
  qin: {
    name: "秦咸陽城考古：窯店與渭河北岸",
    url: "https://paper.people.com.cn/rmrb/pc/content/202506/27/content_30082791.html",
    note: "咸陽指渭河北岸窯店一帶的秦都宮殿區，不是今日咸陽市中心；108.86°E、34.41°N是本圖的概略代表點，並非官方公布的測量座標。",
  },
  hanWei: {
    name: "UNESCO：漢長安未央宮與漢魏洛陽故城位置",
    url: "https://whc.unesco.org/en/list/1442/maps/",
    note: "長安以漢長安城未央宮遺址、洛陽以漢魏洛陽故城的世界遺產代表點定位；不是今日市中心，也不表示整座古城的幾何中心。",
  },
};
