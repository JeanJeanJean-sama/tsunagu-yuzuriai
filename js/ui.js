// =========================================================
// 画面共通の小さな道具
// 利用者が入力した文字を HTML に入れるときは、必ず esc() を通すこと（XSS 対策）。
// =========================================================

import { CATEGORIES, CARE_TAGS, CONDITIONS, HANDOVER, STATUSES, TYPES, labelOf } from './constants.js';

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function esc(value) {
  return String(value ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

export function fmtDate(value) {
  if (!value) return '';
  const d = value.length === 10 ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getFullYear()}/${d.getMonth() + 1}/${d.getDate()}`;
}

export function fmtDateTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${d.getMonth() + 1}/${d.getDate()} ${hh}:${mm}`;
}

/** 「3日前」のような相対表示 */
export function fmtAgo(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'たった今';
  if (min < 60) return `${min}分前`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}時間前`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}日前`;
  return fmtDate(value);
}

/** 期限が近い（日数）かどうか */
export function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(`${dateStr}T00:00:00`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target - today) / 86400000);
}

export const label = {
  type: (id) => labelOf(TYPES, id),
  category: (id) => labelOf(CATEGORIES, id),
  care: (id) => labelOf(CARE_TAGS, id),
  condition: (id) => labelOf(CONDITIONS, id),
  handover: (id) => labelOf(HANDOVER, id),
  status: (id) => labelOf(STATUSES, id),
};

export function typeBadge(type) {
  return `<span class="badge badge-${esc(type)}">${esc(label.type(type))}</span>`;
}

export function statusBadge(status) {
  return `<span class="badge badge-${esc(status)}">${esc(label.status(status))}</span>`;
}

export function careTagsHtml(tags = []) {
  return tags.map((t) => `<span class="tag">${esc(label.care(t))}</span>`).join('');
}

export function optionsHtml(list, selected, { empty } = {}) {
  const head = empty !== undefined ? `<option value="">${esc(empty)}</option>` : '';
  return head + list.map((x) =>
    `<option value="${esc(x.id)}"${x.id === selected ? ' selected' : ''}>${esc(x.label)}</option>`).join('');
}

let toastTimer;
export function toast(message) {
  const el = document.getElementById('toast');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove('show'), 2600);
}

export function navigate(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}
