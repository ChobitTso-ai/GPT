/**
 * © 2026 Tso KY - All Rights Reserved
 * Protected against reverse engineering and unauthorized modification
 * 中國歷史冒險書 v1.8：GitHub Pages 靜態掛載。
 */
import { createRoot } from "react-dom/client";
import HistoryBook from "../app/page";
import "../app/globals.css";

createRoot(document.getElementById("root")!).render(<HistoryBook />);
