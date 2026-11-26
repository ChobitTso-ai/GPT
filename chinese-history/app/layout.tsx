/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 中國歷史冒險書 v1.7
 */

import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://china-history-adventure.tsoky.chatgpt.site"),
  title: "中國歷史冒險書 v1.7｜穿越中國帝制時代",
  description:
    "給十歲孩子的互動中國歷史入口：完整秦至清朝代時間軸、人物故事、軍事科技與史實辨識。",
  openGraph: {
    title: "中國歷史冒險書",
    description: "穿越中國帝制時代：地圖、故事與軍事科技的互動探險。",
    images: [{ url: "/og-v2.png", width: 1733, height: 907 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "中國歷史冒險書",
    description: "穿越中國帝制時代：地圖、故事與軍事科技的互動探險。",
    images: ["/og-v2.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant">
      <body>{children}</body>
    </html>
  );
}
