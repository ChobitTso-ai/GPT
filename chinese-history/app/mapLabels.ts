/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 歷史圖冊標籤配置 v1.1
 */
export type MapLabel = { id: string; name: string; x: number; y: number; kind: "region" | "city" | "geography" };
export type PlacedMapLabel = MapLabel & { left: number; top: number; width: number; height: number; fontSize: number };

// 以顯示像素換算地圖座標，避免手機把文字一起縮成小字。
export function placeMapLabels(labels: MapLabel[], view: [number, number, number, number], scale: number): PlacedMapLabel[] {
  const [vx, vy, vw, vh] = view;
  const placed: PlacedMapLabel[] = [];
  const padding = 5 * scale;
  for (const label of labels) {
    if (label.x < vx || label.x > vx + vw || label.y < vy || label.y > vy + vh) continue;
    const fontSize = (label.kind === "region" ? 24 : 16) * scale;
    const width = label.name.length * fontSize * 1.25;
    const height = fontSize * 1.3;
    const offsets = label.kind === "region"
      ? [[-width / 2, -height / 2], [-width / 2, height], [-width / 2, -height * 2]]
      : [[9 * scale, -height], [9 * scale, 9 * scale], [-width - 9 * scale, -height], [-width - 9 * scale, 9 * scale], [-width / 2, -height * 2], [-width / 2, height]];
    const candidate = offsets.map(([dx, dy]) => ({ ...label,
      left: Math.max(vx + padding, Math.min(vx + vw - width - padding, label.x + dx)),
      top: Math.max(vy + padding, Math.min(vy + vh - height - padding, label.y + dy)),
      width, height, fontSize,
    })).find(box => placed.every(other => box.left + box.width + padding <= other.left || other.left + other.width + padding <= box.left || box.top + box.height + padding <= other.top || other.top + other.height + padding <= box.top));
    // 太密時保留城市星點與下方文字摘要，不在圖中強行疊字。
    if (candidate) placed.push(candidate);
  }
  return placed;
}
