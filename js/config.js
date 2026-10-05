// =========================================================
// 設定
// BACKEND を切り替えると、データの保存先が変わる。
//   'local'    : ブラウザ内（localStorage）に保存。試作・デモ用。
//                データはその端末・そのブラウザだけのもので、他の人には見えない。
//   'supabase' : Supabase に保存（未実装。docs/BACKEND_PLAN.md を参照）
// =========================================================

export const CONFIG = {
  BACKEND: 'local',

  // local モードで使う localStorage のキー。データ形式を変えたら番号を上げる。
  LOCAL_STORAGE_KEY: 'tsunagu-yuzuriai:v1',

  // Supabase に切り替えるときに設定する（公開してよい anon key のみ。service_role key は絶対に置かない）
  SUPABASE_URL: '',
  SUPABASE_ANON_KEY: '',
};
