// =========================================================
// データアクセス層の入口
// 画面（views/）は必ずこのファイルの `store` だけを使う。
// localStorage や Supabase を直接さわらないこと。
//
// どの実装も同じ関数（下の STORE_API）を持つ。
// 関数はすべて Promise を返す（Supabase などの通信版に差し替えても画面側を変えずに済むように）。
// =========================================================

import { CONFIG } from './config.js';
import { createLocalStore } from './stores/local-store.js';
import { createSupabaseStore } from './stores/supabase-store.js';

/**
 * 実装が持つべき関数の一覧（ドキュメント兼チェック用）。
 * 詳細は docs/ARCHITECTURE.md の「データ層の API」を参照。
 */
export const STORE_API = [
  'backendName',
  // 利用者
  'getCurrentUser', 'listUsers', 'switchUser', 'updateProfile',
  // 投稿
  'listListings', 'getListing', 'createListing', 'updateListing', 'deleteListing',
  // 相談（スレッド・メッセージ）
  'openThread', 'getThread', 'listThreadsByListing', 'listMyThreads',
  'listMessages', 'sendMessage',
  // データ管理（local モードのみ意味がある）
  'exportData', 'importData', 'resetDemo',
];

function createStore() {
  switch (CONFIG.BACKEND) {
    case 'supabase':
      return createSupabaseStore(CONFIG);
    case 'local':
    default:
      return createLocalStore({ storageKey: CONFIG.LOCAL_STORAGE_KEY });
  }
}

export const store = createStore();

for (const name of STORE_API) {
  if (typeof store[name] === 'undefined') {
    console.warn(`[store] ${name} が実装されていません`);
  }
}
