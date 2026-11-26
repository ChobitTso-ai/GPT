/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 歷史圖冊標籤回歸測試 v1.0
 */
import test from "node:test";
import assert from "node:assert/strict";
import { placeMapLabels } from "../app/mapLabels.ts";

test("手機、桌機與放大後，標籤保持16像素以上且不重疊", () => {
  const labels = [
    {id:"wei",name:"魏",x:570,y:270,kind:"region"},
    {id:"shu",name:"蜀",x:440,y:420,kind:"region"},
    {id:"wu",name:"吳",x:610,y:440,kind:"region"},
    {id:"luoyang",name:"洛陽",x:560,y:320,kind:"city"},
    {id:"chengdu",name:"成都",x:460,y:380,kind:"city"},
    {id:"jianye",name:"建業",x:650,y:350,kind:"city"},
  ];
  for (const pixels of [273, 328, 1060]) for (const zoom of [1, 1.5, 3]) {
    const view = [575 - 225 / zoom, 350 - 150 / zoom, 450 / zoom, 300 / zoom];
    const scale = view[2] / pixels;
    const result = placeMapLabels(labels, view, scale);
    assert(result.length > 0);
    for (const a of result) {
      assert(a.fontSize / scale >= 16);
      assert(a.left >= view[0] && a.top >= view[1]);
      assert(a.left + a.width <= view[0] + view[2]);
      assert(a.top + a.height <= view[1] + view[3]);
      for (const b of result) if (a !== b) assert(a.left + a.width <= b.left || b.left + b.width <= a.left || a.top + a.height <= b.top || b.top + b.height <= a.top);
    }
  }
});

test("視窗外文字不出現；密集文字不強制堆疊", () => {
  const labels = Array.from({length:20}, (_,i)=>({id:String(i),name:"成都",x:50,y:50,kind:"city"}));
  const result = placeMapLabels([...labels,{id:"out",name:"長安",x:200,y:200,kind:"city"}], [0,0,100,100], 1);
  assert(result.length < 20);
  assert(!result.some(label=>label.id === "out"));
});
