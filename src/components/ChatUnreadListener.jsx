import { useCallback, useEffect, useRef } from "react";
import { useZirhEvent } from "../api/useZirhEvent";
import { METHOD } from "../api/zirhrpc";
import {
  formatBufferToId,
  getStoredUnreadCounts,
  persistUnreadCounts,
  getTotalUnread,
  CHAT_CURRENT_USER_ID_KEY,
} from "../utils/chatUnread";

const DEFAULT_TITLE = "Kiberxavfsizlik markazi";

function applyFaviconAndTitle(total) {
  if (typeof document === "undefined") return;
  const link =
    document.querySelector('link[rel="icon"]') ||
    (() => {
      const el = document.createElement("link");
      el.rel = "icon";
      document.head.appendChild(el);
      return el;
    })();
  const originalHref =
    link.getAttribute("data-original-href") || link.href || "/logo.png";
  if (!link.getAttribute("data-original-href")) {
    link.setAttribute("data-original-href", originalHref);
  }

  if (total > 0) {
    document.title = `${DEFAULT_TITLE} | (${total})`;
    const size = 32;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");

    const drawBadgeOnFavicon = (img) => {
      if (img && img.width && img.height) {
        ctx.drawImage(img, 0, 0, size, size);
      } else {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, size, size);
      }
      // Badge pastki o'ngda, Vite ikonkasining ustida
      const badgeSize = 25;
      const cx = size - badgeSize / 2 + 3;
      const cy = size - badgeSize / 2 + 3;
      const r = badgeSize / 2;
      ctx.fillStyle = "#f2675c";
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
      // ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      const text = total > 99 ? "99+" : String(total);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, cx, cy);
      try {
        link.href = canvas.toDataURL("image/png");
      } catch (_) {}
    };

    const img = new Image();
    img.onload = () => drawBadgeOnFavicon(img);
    img.onerror = () => drawBadgeOnFavicon(null);
    img.src = originalHref;
  } else {
    document.title = defaultTitleRef;
    link.href = originalHref;
  }
}

let defaultTitleRef = DEFAULT_TITLE;

/**
 * ChatUnread
 * Barcha sahifalarda (chat sahifasi ochiq bo‘lmasa ham) kelayotgan xabarlar
 * bo‘yicha o‘qilmaganlar sonini localStorage, header/tab va favicon uchun yangilaydi.
 * Main layout ichida render qilinadi — favicon va tab sarlavhasi har qaysi sahifada ko‘rinadi.
 */
export function ChatUnreadListener() {
  const restoredRef = useRef(false);

  const handlePush = useCallback((data) => {
    if (data.methodId !== METHOD.CHAT_SEND_MSG_SERVER) return;

    const incomingConvId = formatBufferToId(data.params?.[1]);
    const senderId = formatBufferToId(data.params?.[2]);
    if (!incomingConvId) return;

    const currentUserId =
      localStorage.getItem(CHAT_CURRENT_USER_ID_KEY) || "";
    const isOwnMessage = currentUserId && senderId === currentUserId;
    if (isOwnMessage) return;

    const prev = getStoredUnreadCounts();
    const updated = {
      ...prev,
      [incomingConvId]: (prev[incomingConvId] || 0) + 1,
    };
    persistUnreadCounts(updated);

    const total = Object.values(updated).reduce(
      (s, n) => s + Number(n || 0),
      0,
    );
    window.dispatchEvent(
      new CustomEvent("chatUnreadTotal", { detail: { total } }),
    );
  }, []);

  useZirhEvent(null, handlePush);

  useEffect(() => {
    if (defaultTitleRef === DEFAULT_TITLE) {
      defaultTitleRef = document.title || DEFAULT_TITLE;
    }
    const total = getTotalUnread();
    applyFaviconAndTitle(total);

    const onChatUnread = (e) => {
      const total = e.detail?.total ?? getTotalUnread();
      applyFaviconAndTitle(total);
    };
    window.addEventListener("chatUnreadTotal", onChatUnread);

    return () => {
      if (restoredRef.current) return;
      restoredRef.current = true;
      document.title = defaultTitleRef;
      const link = document.querySelector('link[rel="icon"]');
      if (link) {
        link.href =
          link.getAttribute("data-original-href") || "/logo.png";
      }
      window.removeEventListener("chatUnreadTotal", onChatUnread);
    };
  }, []);

  return null;
}
