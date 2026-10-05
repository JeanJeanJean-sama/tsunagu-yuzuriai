// =========================================================
// Supabase 版のデータ層（未実装・ひな形）
//
// 実装手順は docs/BACKEND_PLAN.md を参照。
// local-store.js と同じ関数・同じ戻り値の形にすること（画面側を変えずに切り替えるため）。
// 権限チェックはデータベース側の RLS で必ず行う（ブラウザ側のチェックは迂回できるため）。
// =========================================================

export function createSupabaseStore(/* config */) {
  const notYet = (name) => async () => {
    throw new Error(`Supabase 版の ${name} はまだ実装されていません（docs/BACKEND_PLAN.md 参照）`);
  };

  return {
    backendName: 'supabase',
    getCurrentUser: notYet('getCurrentUser'),
    listUsers: notYet('listUsers'),
    switchUser: notYet('switchUser'), // Supabase 版ではログイン／ログアウトに置き換わる
    updateProfile: notYet('updateProfile'),
    listListings: notYet('listListings'),
    getListing: notYet('getListing'),
    createListing: notYet('createListing'),
    updateListing: notYet('updateListing'),
    deleteListing: notYet('deleteListing'),
    openThread: notYet('openThread'),
    getThread: notYet('getThread'),
    listThreadsByListing: notYet('listThreadsByListing'),
    listMyThreads: notYet('listMyThreads'),
    listMessages: notYet('listMessages'),
    sendMessage: notYet('sendMessage'),
    exportData: notYet('exportData'),
    importData: notYet('importData'),
    resetDemo: notYet('resetDemo'),
  };
}
