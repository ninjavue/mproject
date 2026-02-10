/**
 * Chat o'qilmaganlar soni uchun yordamchi.
 * Boshqa sahifada bo'lganda ham kelayotgan xabarlar bo'yicha
 * localStorage va header/tab yangilanishi uchun ishlatiladi.
 */

export const CHAT_UNREAD_STORAGE_KEY = "chat_unread_counts";
export const CHAT_CURRENT_USER_ID_KEY = "chat_current_user_id";

export function formatBufferToId(data) {
  if (!data) return null;
  const bufferArray = data.buffer
    ? Object.values(data.buffer)
    : Object.values(data);
  return bufferArray
    .map((value) => value.toString(16).padStart(2, "0"))
    .join("");
}

export function getStoredUnreadCounts() {
  try {
    const s = localStorage.getItem(CHAT_UNREAD_STORAGE_KEY);
    return s ? JSON.parse(s) : {};
  } catch {
    return {};
  }
}

export function persistUnreadCounts(obj) {
  try {
    localStorage.setItem(CHAT_UNREAD_STORAGE_KEY, JSON.stringify(obj));
  } catch (_) {}
}

export function getTotalUnread() {
  const obj = getStoredUnreadCounts();
  return Object.values(obj).reduce((s, n) => s + Number(n || 0), 0);
}
