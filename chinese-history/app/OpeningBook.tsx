"use client";

/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 古書開場 v2.2：米白書皮與已確認的左下頁角軟紙翻動。
 */
import { useEffect, useRef, useState } from "react";

type FlipEvent = { data: number | string };
type FlipBook = {
  on: (name: string, callback: (event: FlipEvent) => void) => void;
  loadFromImages: (images: string[]) => void;
  flipPrev: (corner: "bottom") => void;
  getCurrentPageIndex: () => number;
  destroy: () => void;
};
type FlipConstructor = new (host: HTMLElement, settings: Record<string, string | number | boolean>) => FlipBook;
const plate = "/opening-c-preview-v2/book-base-ivory.webp";
let libraryPromise: Promise<FlipConstructor> | null = null;

function loadLibrary(): Promise<FlipConstructor> {
  const get = () => (window as Window & { St?: { PageFlip: FlipConstructor } }).St?.PageFlip;
  const loaded = get();
  if (loaded) return Promise.resolve(loaded);
  if (!libraryPromise) {
    libraryPromise = new Promise<FlipConstructor>((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "/opening-c-preview-v2/vendor/page-flip-2.0.7.js";
      script.async = true;
      script.onload = () => {
        const Library = get();
        if (Library) resolve(Library);
        else reject(new Error("翻頁元件未就緒"));
      };
      script.onerror = () => reject(new Error("翻頁元件載入失敗"));
      document.head.append(script);
    }).catch(error => { libraryPromise = null; throw error; });
  }
  return libraryPromise;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("書頁素材載入失敗"));
    image.src = src;
  });
}

function paper(base: HTMLImageElement) {
  const surface = document.createElement("canvas");
  surface.width = 654; surface.height = 760;
  surface.getContext("2d")!.drawImage(base, base.width * .085, base.height * .135,
    base.width * .4, base.height * .73, 0, 0, 654, 760);
  return surface;
}

function vertical(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, size: number, step: number) {
  ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillStyle = "#275a50";
  ctx.font = size + 'px "DFKai-SB","Noto Serif TC",serif';
  Array.from(text).forEach((letter, index) => ctx.fillText(letter, x, y + index * step));
}

function border(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "#71997c55"; ctx.lineWidth = 2; ctx.strokeRect(34, 30, 586, 700);
}

function makePages(base: HTMLImageElement, mountains: HTMLImageElement, gate: HTMLImageElement, hero: HTMLImageElement) {
  // 尺寸、排字與構圖沿用使用者確認的米白書皮樣板。
  const chapter = paper(base), reverse = paper(base), title = paper(base), art = paper(base);
  let ctx = chapter.getContext("2d")!;
  border(ctx); ctx.textAlign = "center"; ctx.fillStyle = "#31594c";
  ctx.font = '30px "Microsoft JhengHei",sans-serif'; ctx.fillText("第 一 卷", 327, 110);
  ctx.font = '125px "DFKai-SB",serif'; ctx.fillText("秦", 327, 275);
  ctx.drawImage(hero, 68, 328, 518, 280);
  ctx.font = '34px "DFKai-SB",serif'; ctx.fillText("六國歸一", 327, 665);
  ctx.font = '23px "Microsoft JhengHei",sans-serif'; ctx.fillText("公元前221年", 327, 707);
  ctx = reverse.getContext("2d")!;
  border(ctx); ctx.textAlign = "center"; ctx.fillStyle = "#31594c";
  ctx.font = '39px "DFKai-SB",serif'; ctx.fillText("山河為卷", 327, 163); ctx.fillText("故事為路", 327, 225);
  ctx.drawImage(mountains, 50, 370, 554, 277);
  ctx = title.getContext("2d")!;
  border(ctx); vertical(ctx, "中國歷史", 430, 150, 94, 110); vertical(ctx, "冒險書", 270, 230, 46, 58);
  ctx.drawImage(mountains, 75, 590, 300, 150);
  ctx = art.getContext("2d")!;
  border(ctx); ctx.drawImage(mountains, 35, 70, 584, 375); ctx.drawImage(gate, 30, 440, 594, 225);
  return [chapter, reverse, title, art].map(surface => surface.toDataURL("image/png"));
}

export default function OpeningBook({ opening, onOpen, onComplete }: {
  opening: boolean;
  onOpen: () => void;
  onComplete: () => void;
}) {
  const host = useRef<HTMLDivElement>(null);
  const book = useRef<FlipBook | null>(null);
  const complete = useRef(onComplete);
  const started = useRef(false);
  const finishTimer = useRef<number | null>(null);
  const [ready, setReady] = useState(false);
  const [failed, setFailed] = useState(false);
  const [currentPage, setCurrentPage] = useState(2);

  useEffect(() => { complete.current = onComplete; }, [onComplete]);

  useEffect(() => {
    let disposed = false;
    let instance: FlipBook | null = null;
    let resizeObserver: ResizeObserver | null = null;
    const container = host.current;
    void Promise.all([
      loadLibrary(),
      loadImage(plate),
      loadImage("/opening-c-preview-v1/mountains.webp"),
      loadImage("/opening-c-preview-v1/gate-bridge.webp"),
      loadImage("/hero-qin-v3.png"),
    ]).then(async ([Library, base, mountains, gate, hero]) => {
      await document.fonts.ready;
      const pages = makePages(base, mountains, gate, hero);
      await Promise.all(pages.map(loadImage));
      if (disposed || !container) return;
      // 元件只管理容器，讓第三方元件自行建立及銷毀其內部節點。
      const mount = document.createElement("div");
      mount.className = "opening-page-host";
      mount.style.width = "1308px";
      mount.style.height = "760px";
      mount.style.transformOrigin = "top left";
      container.append(mount);
      const scaleBook = () => { mount.style.transform = `scale(${container.clientWidth / 1308})`; };
      scaleBook();
      resizeObserver = new ResizeObserver(scaleBook);
      resizeObserver.observe(container);
      instance = new Library(mount, {
        width: 654, height: 760, size: "fixed", minWidth: 90, maxWidth: 654,
        minHeight: 104, maxHeight: 760, usePortrait: false, autoSize: false,
        showCover: false, startPage: 2, drawShadow: true, maxShadowOpacity: .28,
        flippingTime: 2100, useMouseEvents: false, showPageCorners: false,
        disableFlipByClick: true, mobileScrollSupport: true,
      });
      book.current = instance;
      instance.on("init", () => { if (!disposed) setReady(true); });
      instance.on("flip", event => { if (!disposed) setCurrentPage(Number(event.data)); });
      instance.on("changeState", event => {
        if (!disposed && started.current && event.data === "read" && instance?.getCurrentPageIndex() === 0) {
          started.current = false;
          // 翻頁完成並短暫停留後才進入正文，不用猜測動畫結束時間。
          finishTimer.current = window.setTimeout(() => complete.current(), 320);
        }
      });
      instance.loadFromImages(pages);
    }).catch(() => { if (!disposed) setFailed(true); });

    return () => {
      disposed = true;
      if (finishTimer.current !== null) window.clearTimeout(finishTimer.current);
      book.current = null;
      resizeObserver?.disconnect();
      instance?.destroy();
      container?.replaceChildren();
    };
  }, []);

  useEffect(() => {
    if (!opening || started.current) return;
    if (failed || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      complete.current();
      return;
    }
    if (ready && book.current) {
      started.current = true;
      book.current.flipPrev("bottom");
    }
  }, [opening, ready, failed]);

  const disabled = opening || (!ready && !failed);
  return (
    <div className="book-scene" data-opening-ready={ready} data-opening-page={currentPage}>
      <button className="opening-book" type="button" onClick={onOpen}
        disabled={disabled} aria-busy={opening || (!ready && !failed)} aria-label="打開中國歷史冒險書">
        <img src={plate} width="1536" height="1024" alt="" draggable={false} fetchPriority="high" />
        <div className="opening-page-area" ref={host} aria-hidden="true" />
      </button>
      <button className="open-cta" type="button" onClick={onOpen} disabled={disabled}>
        <span>{opening ? "走進千年故事…" : !ready && !failed ? "準備書頁中…" : failed ? "開始閱讀" : "翻開第一卷"}</span>
        <small>從秦朝開始，探索21個時代</small>
      </button>
    </div>
  );
}

