// =========================================================
// local モードのデータ層（localStorage 保存）
//
// ・データはこのブラウザの中だけに保存される（他の端末・他の人とは共有されない）
// ・権限チェック（自分の投稿だけ編集できる等）もここで行う。
//   Supabase 版では同じルールをデータベースの RLS（行レベルセキュリティ）で実現する。
// ・保存形式は docs/ARCHITECTURE.md の「データモデル」を参照。
// =========================================================

import { createSeedData } from '../seed.js';

const EDITABLE_LISTING_FIELDS = [
  'type', 'title', 'category', 'careTags', 'quantity', 'unit', 'condition', 'expiry',
  'area', 'handover', 'availableUntil', 'availability', 'note', 'status',
];

const STATUS_ORDER = { open: 0, negotiating: 1, closed: 2 };

function newId(prefix) {
  const rand = (globalThis.crypto && crypto.randomUUID)
    ? crypto.randomUUID()
    : `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}-${rand}`;
}

function clone(v) {
  return JSON.parse(JSON.stringify(v));
}

/** localStorage が使えない環境（プライベートモード等）ではメモリに保存する */
function resolveStorage(storage) {
  if (storage) return storage;
  try {
    const ls = globalThis.localStorage;
    const probe = '__tsunagu_probe__';
    ls.setItem(probe, '1');
    ls.removeItem(probe);
    return ls;
  } catch {
    const mem = new Map();
    return {
      getItem: (k) => (mem.has(k) ? mem.get(k) : null),
      setItem: (k, v) => mem.set(k, String(v)),
      removeItem: (k) => mem.delete(k),
      isMemoryFallback: true,
    };
  }
}

export class PermissionError extends Error {}
export class ValidationError extends Error {}

/**
 * 投稿の入力チェック。画面側でもチェックするが、データ層でも必ず確認する。
 * @returns {Record<string,string>} 項目名 → エラーメッセージ（空ならOK）
 */
export function validateListing(data) {
  const errors = {};
  if (!['give', 'want'].includes(data.type)) errors.type = '種類を選んでください';
  if (!data.title || !String(data.title).trim()) errors.title = '品名を入力してください';
  else if (String(data.title).length > 80) errors.title = '品名は80文字以内にしてください';
  if (!data.category) errors.category = 'カテゴリを選んでください';
  const q = Number(data.quantity);
  if (!Number.isFinite(q) || q <= 0) errors.quantity = '数量は1以上の数字で入力してください';
  if (!data.unit || !String(data.unit).trim()) errors.unit = '単位を入力してください（本、箱など）';
  if (!data.area || !String(data.area).trim()) errors.area = '受け渡しできる地域を入力してください';
  if (!Array.isArray(data.handover) || data.handover.length === 0) errors.handover = '受け渡し方法を1つ以上選んでください';
  if (data.note && String(data.note).length > 1000) errors.note = '補足は1000文字以内にしてください';
  return errors;
}

export function createLocalStore({ storageKey, storage, now = () => new Date() } = {}) {
  const backing = resolveStorage(storage);
  let db = load();

  function load() {
    try {
      const raw = backing.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.listings)) return parsed;
      }
    } catch (e) {
      console.warn('[local-store] 保存データを読み込めませんでした。デモデータで始めます。', e);
    }
    const seeded = createSeedData(now());
    persist(seeded);
    return seeded;
  }

  function persist(data = db) {
    try {
      backing.setItem(storageKey, JSON.stringify(data));
    } catch (e) {
      console.warn('[local-store] 保存に失敗しました', e);
    }
  }

  function nowIso() { return now().toISOString(); }
  function me() { return db.users.find((u) => u.id === db.currentUserId) || db.users[0] || null; }
  function userName(id) { return db.users.find((u) => u.id === id)?.nickname || '（退会した会員）'; }

  function withOwner(listing) {
    return { ...clone(listing), ownerName: userName(listing.ownerId) };
  }

  function requireUser() {
    const u = me();
    if (!u) throw new PermissionError('利用者が選ばれていません');
    return u;
  }

  function requireListing(id) {
    const l = db.listings.find((x) => x.id === id);
    if (!l) throw new Error('投稿が見つかりません');
    return l;
  }

  function requireParticipant(thread, user) {
    if (thread.ownerId !== user.id && thread.requesterId !== user.id) {
      throw new PermissionError('このやり取りには参加していません');
    }
  }

  function decorateThread(t) {
    const user = me();
    const listing = db.listings.find((l) => l.id === t.listingId);
    const msgs = db.messages.filter((m) => m.threadId === t.id).sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    const last = msgs[msgs.length - 1] || null;
    const otherId = user && t.ownerId === user.id ? t.requesterId : t.ownerId;
    return {
      ...clone(t),
      listingTitle: listing ? listing.title : '（削除された投稿）',
      listingType: listing ? listing.type : null,
      listingStatus: listing ? listing.status : 'closed',
      ownerName: userName(t.ownerId),
      requesterName: userName(t.requesterId),
      otherName: userName(otherId),
      lastMessage: last ? { body: last.body, createdAt: last.createdAt, senderId: last.senderId } : null,
      messageCount: msgs.length,
    };
  }

  return {
    backendName: 'local',
    isMemoryFallback: Boolean(backing.isMemoryFallback),

    // ---------------- 利用者 ----------------
    async getCurrentUser() {
      const u = me();
      return u ? clone(u) : null;
    },

    async listUsers() {
      return clone(db.users);
    },

    /** 試作版のみ：ログインの代わりに利用者を切り替える */
    async switchUser(userId) {
      if (!db.users.some((u) => u.id === userId)) throw new Error('その利用者は存在しません');
      db.currentUserId = userId;
      persist();
      return clone(me());
    },

    async updateProfile(patch) {
      const u = requireUser();
      if (patch.nickname !== undefined) {
        const n = String(patch.nickname).trim();
        if (!n) throw new ValidationError('ニックネームを入力してください');
        if (n.length > 20) throw new ValidationError('ニックネームは20文字以内にしてください');
        u.nickname = n;
      }
      if (patch.area !== undefined) u.area = String(patch.area).trim().slice(0, 30);
      persist();
      return clone(u);
    },

    // ---------------- 投稿 ----------------
    /**
     * @param {object} f 絞り込み条件
     *   type: 'all'|'give'|'want', category, careTag, q（キーワード）, area,
     *   includeClosed: boolean, ownerId
     */
    async listListings(f = {}) {
      const q = (f.q || '').trim().toLowerCase();
      const area = (f.area || '').trim();
      const items = db.listings.filter((l) => {
        if (f.ownerId && l.ownerId !== f.ownerId) return false;
        if (f.type && f.type !== 'all' && l.type !== f.type) return false;
        if (f.category && l.category !== f.category) return false;
        if (f.careTag && !(l.careTags || []).includes(f.careTag)) return false;
        if (!f.includeClosed && l.status === 'closed') return false;
        if (area && !(l.area || '').includes(area)) return false;
        if (q) {
          const hay = `${l.title} ${l.note} ${l.availability} ${l.area} ${l.unit}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        return true;
      });
      items.sort((a, b) =>
        (STATUS_ORDER[a.status] - STATUS_ORDER[b.status]) || b.updatedAt.localeCompare(a.updatedAt));
      return items.map(withOwner);
    },

    async getListing(id) {
      const l = db.listings.find((x) => x.id === id);
      return l ? withOwner(l) : null;
    },

    async createListing(data) {
      const user = requireUser();
      const errors = validateListing(data);
      if (Object.keys(errors).length) {
        const err = new ValidationError('入力内容を確認してください');
        err.fields = errors;
        throw err;
      }
      const t = nowIso();
      const listing = { id: newId('l'), status: 'open' };
      for (const k of EDITABLE_LISTING_FIELDS) if (data[k] !== undefined) listing[k] = clone(data[k]);
      listing.quantity = Number(listing.quantity);
      listing.careTags = listing.careTags || [];
      listing.ownerId = user.id;
      listing.createdAt = t;
      listing.updatedAt = t;
      db.listings.push(listing);
      persist();
      return withOwner(listing);
    },

    async updateListing(id, patch) {
      const user = requireUser();
      const l = requireListing(id);
      if (l.ownerId !== user.id) throw new PermissionError('自分の投稿だけ編集できます');
      const next = { ...l };
      for (const k of EDITABLE_LISTING_FIELDS) if (patch[k] !== undefined) next[k] = clone(patch[k]);
      next.quantity = Number(next.quantity);
      const errors = validateListing(next);
      if (Object.keys(errors).length) {
        const err = new ValidationError('入力内容を確認してください');
        err.fields = errors;
        throw err;
      }
      next.updatedAt = nowIso();
      Object.assign(l, next);
      persist();
      return withOwner(l);
    },

    async deleteListing(id) {
      const user = requireUser();
      const l = requireListing(id);
      if (l.ownerId !== user.id) throw new PermissionError('自分の投稿だけ削除できます');
      const threadIds = db.threads.filter((t) => t.listingId === id).map((t) => t.id);
      db.listings = db.listings.filter((x) => x.id !== id);
      db.threads = db.threads.filter((t) => t.listingId !== id);
      db.messages = db.messages.filter((m) => !threadIds.includes(m.threadId));
      persist();
      return true;
    },

    // ---------------- 相談（スレッド・メッセージ） ----------------
    /** 投稿者と「相談する」。既にあればそのスレッドを返す */
    async openThread(listingId) {
      const user = requireUser();
      const l = requireListing(listingId);
      if (l.ownerId === user.id) throw new PermissionError('自分の投稿には相談できません');
      let t = db.threads.find((x) => x.listingId === listingId && x.requesterId === user.id);
      if (!t) {
        if (l.status === 'closed') throw new PermissionError('受け渡し済みの投稿には新しく相談できません');
        const ts = nowIso();
        t = { id: newId('t'), listingId, ownerId: l.ownerId, requesterId: user.id, createdAt: ts, updatedAt: ts };
        db.threads.push(t);
        persist();
      }
      return decorateThread(t);
    },

    async getThread(id) {
      const user = requireUser();
      const t = db.threads.find((x) => x.id === id);
      if (!t) return null;
      requireParticipant(t, user);
      return decorateThread(t);
    },

    /** 投稿者だけが見られる：その投稿に来ている相談の一覧 */
    async listThreadsByListing(listingId) {
      const user = requireUser();
      const l = requireListing(listingId);
      const list = db.threads.filter((t) => t.listingId === listingId &&
        (l.ownerId === user.id || t.requesterId === user.id));
      return list.map(decorateThread).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async listMyThreads() {
      const user = requireUser();
      return db.threads
        .filter((t) => t.ownerId === user.id || t.requesterId === user.id)
        .map(decorateThread)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    },

    async listMessages(threadId) {
      const user = requireUser();
      const t = db.threads.find((x) => x.id === threadId);
      if (!t) throw new Error('やり取りが見つかりません');
      requireParticipant(t, user);
      return db.messages
        .filter((m) => m.threadId === threadId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
        .map((m) => ({ ...clone(m), senderName: m.senderId === 'system' ? 'お知らせ' : userName(m.senderId), isMine: m.senderId === user.id }));
    },

    async sendMessage(threadId, body) {
      const user = requireUser();
      const t = db.threads.find((x) => x.id === threadId);
      if (!t) throw new Error('やり取りが見つかりません');
      requireParticipant(t, user);
      const text = String(body || '').trim();
      if (!text) throw new ValidationError('メッセージを入力してください');
      if (text.length > 2000) throw new ValidationError('メッセージは2000文字以内にしてください');
      const ts = nowIso();
      const m = { id: newId('m'), threadId, senderId: user.id, body: text, createdAt: ts };
      db.messages.push(m);
      t.updatedAt = ts;
      persist();
      return { ...clone(m), senderName: user.nickname, isMine: true };
    },

    // ---------------- データ管理 ----------------
    async exportData() {
      return clone(db);
    },

    async importData(obj) {
      if (!obj || !Array.isArray(obj.users) || !Array.isArray(obj.listings) ||
          !Array.isArray(obj.threads) || !Array.isArray(obj.messages)) {
        throw new ValidationError('ファイルの形式が正しくありません');
      }
      db = clone(obj);
      if (!db.users.some((u) => u.id === db.currentUserId)) db.currentUserId = db.users[0]?.id || null;
      persist();
      return true;
    },

    async resetDemo() {
      db = createSeedData(now());
      persist();
      return true;
    },
  };
}
