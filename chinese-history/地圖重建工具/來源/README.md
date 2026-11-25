# 秦代向量來源與使用界線

## 2026-11-01 古城、渭河與三國西南待核區補正

- 秦咸陽城宮殿區：秦都考古項目原領隊許衛紅的現場訪談及考古介紹明列窯店與渭河北岸，https://paper.people.com.cn/rmrb/pc/content/202506/27/content_30082791.html 。本圖108.86°E／34.41°N為窯店宮殿區的概略代表點，不能宣稱為該報或官方公布的測量座標；不再用現代咸陽市中心108.70／34.33。
- 漢長安與漢魏洛陽：UNESCO世界遺產1442-001／002的地理資料，https://whc.unesco.org/en/list/1442/maps/ ，分別N34°18′16″ E108°51′26″與N34°43′52″ E112°37′17″。以未央宮／古城遺產代表點作圖冊定位，不宣稱為整城中心。`app/historicalMapSites.ts`共用於三國配準與介面；舊108.86／34.26及108.94／34.34兩組長安點不再混用於三國樣板。其他時代仍需各別核對，不能把漢城與隋唐城混用。
- 現代渭河子集 `ne_10m_wei_river.geojson`：Natural Earth官方維護者GeoJSON，https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_10m_rivers_lake_centerlines.geojson ，官方介紹 https://www.naturalearthdata.com/downloads/10m-physical-vectors/10m-rivers-lake-centerlines/ ，公有領域條款 https://www.naturalearthdata.com/about/terms-of-use/ 。原下載全檔7,307,743 bytes，SHA256 `BB854A900ECBD3B408DF46D5E16E3E0F974BA55993F9D8B5C26E855273C0905A`，留中央本輪暫存；正式子集只保留name=Wei、featurecla=River的一個原始要素／273點，未移動河道。子集SHA256 `88222E53D0F61152E7A776C282800FA3B3350A6DCB4D3193BC18FDB072608782`。`build-map-assets.mjs --snapshots-only`可由本子集重建網站河流JSON，不依賴中央全檔或舊母區；只表示現代參照，不是復原的秦漢河道。
- 永昌郡：仍使用下方既有262年CC BY-SA來源，未下載／描摹新圖。在固定來源像素[750,1950]沿益州原底色洪水辨識，以黑色郡界作阻擋，182,240個來源像素；外輪廓371點，來源包圍框[582,1159,1577,2289]。固定數量與範圍閘門防止串通鄰郡。網站將該郡從一般填色扣出，斜線提示西南界／控制程度待核；不是把全郡判定為未受控制，也不是新增實控疆界。保留原政治外輪廓與同年三國，不能由這張局部行政範圍計算完整國土比例。
- 三國配準更新：最大城市殘差7.473來源像素，敦煌3.548、海南外框6.023、雙向海岸最大12.817；原閘門12／8／10／15未放寬。改善的是古城控制點與地理配準，不是史學疆界已獲認證。舊數值在下方作歷史紀錄保留，現值見配準紀錄.json v1.4。

- 檔案：`Qin_dynasty_territory.svg`，Ian Remsen／Remsense，2025；原檔原樣保存。
- 原圖與授權：https://commons.wikimedia.org/wiki/File:Qin_dynasty_territory.svg ，CC0 1.0（https://creativecommons.org/publicdomain/zero/1.0/）。
- 原檔URL：https://upload.wikimedia.org/wikipedia/commons/c/c2/Qin_dynasty_territory.svg
- SHA256：`C37BEFE576D20479EB9DFDE09179B562A17E918734812E256274642BDE6F75D5`。
- 來源頁公開Albers參數：中央經線110°、原點緯度30°、標準緯線25°及37°。本專案按WGS84橢球還原，以既有Natural Earth現代海岸定位SVG縮放和平移。
- 原作者將政治範圍及古代海岸調整的參考列為Li Feng（2013）《Early China: A Social and Cultural History》第247頁，DOI 10.1017/CBO9781139034395。本專案沒有複製該書圖版，也未逐頁核對該書；不得宣稱完成獨立學術疆域驗證。
- 原圖標秦代前221–206年，不是前210年定點。本專案也採明確時段，說明為統一後逐步擴張範圍，不暗示前221年已同時控制全圖。
- 只匯出主要大陸政治填色環，其他小島仍作地理背景，不據此推定古代控制權。秦輪廓不再由舊CC BY-SA 3.0點陣圖外推；三國資料仍依其CC BY-SA 4.0授權，詳見專案地圖資料查核紀錄。

## 重建與檢查

### 秦／三國圖冊顯示底板（2026-10-23）

- 本輪改變的是**顯示投影與圖層構圖**，不是重新認證或改寫兩張政治範圍。`app/atlasProjection.ts`使用WGS84 Albers，中央經線105°、原點35°、標準緯線25°／47°，畫布1000×700；與秦原來源SVG的110°／30°／25°／37°參數不同，兩階段不可混用。政治來源先還原成經緯度，再與海岸、河流、城市一起轉為圖冊顯示座標。
- `node 地圖重建工具/build-atlas-plate.mjs`從正式 `public/maps-v18/china-relief.webp`重投影，雙線性取樣，僅將原有明暗轉為暖色陰影，不臆造高程、等高線或古代地貌；海域由陸地遮罩排除，不再顯示海底紋理。輸出 `china-atlas-albers.webp` 2400×1680／207,626 bytes，完整SHA與來源範圍見 `地圖重建工具/圖冊底板紀錄.json`。舊WebP保持原樣，重建不依賴退役母區或中央大TIF。
- `ne_50m_coastline.geojson`是Natural Earth官方維護者公開領域的海岸線資料，官方介紹：https://www.naturalearthdata.com/downloads/50m-physical-vectors/50m-coastline/ ；原始下載：https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_50m_coastline.geojson 。SHA256 `271F1C4C1908312BAC6B29D158EA1356544BEAFC129F260005300913AA5EA283`。只使用featurecla=Coastline及LineString／MultiLineString，擷取東亞95線／3567點至 `app/atlasCoast.json`；沒有下載現代國界、省界或九段線。
- 首次畫面自檢發現舊陸地相鄰環描邊形成內陸接縫，已撤下該描邊，改接真正海岸線，不以現代行政界冒充歷史地理。原陸地環僅合用為填色／遮罩，不畫其內部邊線。海岸資料在來源圖幅外斷開，不沿裁切框封口；只表示現代地理參照，不表示古代主權。
- `tests/atlas-projection.test.mjs`檢查顯示投影往返、局部等積比例、來源／輸出SHA、海岸要素型別、內陸無海岸接縫、海南及台灣輪廓存在。這些不是歷史疆界或使用者美術驗收。

在專案以Node 24執行 `node 地圖重建工具/qin-vector.mjs` 可只輸出秦圖定位稽核；執行 `node 地圖重建工具/build-map-assets.mjs <Natural Earth來源資料夾>` 可重建地形與兩張樣板。完整重建的來源資料夾須有原始TIF及TFW，來源下載位置見專案地圖資料查核紀錄。

用海南、台灣海岸中心定位，另以未參與擬合的濟州海岸核對；濟州外框最大差異約1.483個SVG座標單位。此為地理定位檢核，不是古代海岸、政治邊界或島嶼主權精度。單用海南小島外框擬合的試驗誤差約11.5單位，已退回，不使用該比例。

`tests/qin-projection.test.mjs`檢查東亞範圍投影往返、獨立海岸定位、地理環閉合及都城／島嶼誤填色；不取代人工史實查核。來源若換版、元素改變或定位核對失敗，程式應停止，不能放寬門檻硬上。

## 三國262年來源（2026-10-23 10時採用）

- `ThreeKingdoms262-3840.png`為Commons官方3840×2715縮圖，Zhoudadudu（2023）原創郡縣圖；https://commons.wikimedia.org/wiki/File:ThreeKingdoms262.png ，CC BY-SA 4.0：https://creativecommons.org/licenses/by-sa/4.0/ 。原作者說明參考《中國歷史地圖集》與HydroSHEDS；本專案未取入該圖集書頁、作者網站GeoJSON或其他未明授權材料。
- 原縮圖URL：https://thumb.wikimedia.org/wikipedia/commons/thumb/4/45/ThreeKingdoms262.png/3840px-ThreeKingdoms262.png 。2,044,861 bytes，SHA256 `7B0A82EFB767F07072B57EED450BD1426B679B2C6060FF9F4AF7D5DA94BDE6D7`，由上輪中央研究候選原樣複製，SHA一致。
- `three-raster.mjs`按原州郡16色分成同年魏、蜀、吳，補微小字孔／邊線，不向白底海洋擴張；擷取外輪廓並以1.2來源像素容差簡化。採用魏1726點、蜀822點、吳大陸1429點與海南140點；資料改編仍依CC BY-SA 4.0。海南是此特定來源的表示，不可泛化其他時代島嶼控制權。
- 九個近似歷史城市位置擬合「標準球面墨卡托＋單一縮放及平移」，不是任意多項式，也不是作者提供的原CRS。公式參考PROJ官方Web Mercator說明：https://proj.org/en/stable/operations/projections/webmerc.html 。完整控制點、參數、殘差及限制在上層配準紀錄.json；城市位置只作約略定位，不宣稱精密考古座標。
- 不參與擬合的敦煌約差3.109來源像素；海南外框最大差6.600像素、雙向海岸距離最大13.225像素、RMSE4.720像素。預設閘門依序為8、10、15像素，沒有因失敗放寬。這只支持示意尺度地理定位，不是古代疆界精度；不能直接與舊配準的「度」比較。
- 河西北緣觸及來源圖框，填色止於資料範圍；渲染另用開放政治邊線，省略碰到截界的線段並明示限制，不將閉合填色或簡化後斜弦當作北界。不足1000像素的孤立色塊，以及內湖／標字孔洞不作額外政治疆界。海岸／河道仍是現代底圖參照。
- 僅重建兩場景：`node 地圖重建工具/build-map-assets.mjs --snapshots-only`，不需來源大TIF；完整地形重建仍用前述Natural Earth來源資料夾。新流程不會覆寫回舊三國多項式。`tests/three-projection.test.mjs`檢查往返、獨立定位、同年三國、閉環／海南／台灣及來源截界不誤閉合；仍待獨立史學校核，不當作疆界定稿。
