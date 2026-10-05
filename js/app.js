// =========================================================
// アプリの入口：画面の切り替え（ハッシュルーティング）
// URL の # 以降で画面を決める。GitHub Pages でもサーバー設定なしで動く。
//   #/            一覧（さがす）
//   #/item/:id    投稿の詳細
//   #/new         新規投稿
//   #/edit/:id    投稿の編集
//   #/thread/:id  相談のやり取り
//   #/me          マイページ
//   #/rules       ルール
//   #/settings    設定（試作版：利用者切り替え・データ管理）
// =========================================================

import { store } from './store.js';
import { esc } from './ui.js';
import { listView } from './views/list.js';
import { detailView } from './views/detail.js';
import { formView } from './views/form.js';
import { threadView } from './views/thread.js';
import { mypageView } from './views/mypage.js';
import { rulesView } from './views/rules.js';
import { settingsView } from './views/settings.js';

const routes = [
  { re: /^#?\/?$/, nav: 'list', view: listView },
  { re: /^#\/item\/([\w-]+)$/, nav: 'list', view: detailView },
  { re: /^#\/new$/, nav: 'new', view: (root, ctx) => formView(root, ctx, null) },
  { re: /^#\/edit\/([\w-]+)$/, nav: 'new', view: formView },
  { re: /^#\/thread\/([\w-]+)$/, nav: 'me', view: threadView },
  { re: /^#\/me$/, nav: 'me', view: mypageView },
  { re: /^#\/rules$/, nav: 'rules', view: rulesView },
  { re: /^#\/settings$/, nav: '', view: settingsView },
];

const main = document.getElementById('main');

async function refreshHeader() {
  const user = await store.getCurrentUser();
  const chip = document.getElementById('user-chip');
  chip.textContent = user ? `${user.nickname} さん` : '利用者を選ぶ';

  const banner = document.getElementById('prototype-banner');
  if (store.backendName === 'local') {
    banner.innerHTML = store.isMemoryFallback
      ? '試作版：このブラウザでは保存ができないため、ページを閉じると内容が消えます。'
      : '試作版：データはこの端末のブラウザの中だけに保存されます（他の人には見えません）。';
  } else {
    banner.textContent = '';
  }
}

async function render() {
  const hash = location.hash || '#/';
  const route = routes.find((r) => r.re.test(hash));

  document.querySelectorAll('[data-nav]').forEach((a) => {
    a.classList.toggle('active', route && a.dataset.nav === route.nav);
    if (route && a.dataset.nav === route.nav) a.setAttribute('aria-current', 'page');
    else a.removeAttribute('aria-current');
  });

  await refreshHeader();
  const ctx = { store, refreshHeader };

  if (!route) {
    main.innerHTML = '<div class="empty"><p>ページが見つかりません。</p><a class="btn" href="#/">一覧へ戻る</a></div>';
    return;
  }

  const params = hash.match(route.re).slice(1);
  try {
    await route.view(main, ctx, ...params);
  } catch (err) {
    console.error(err);
    main.innerHTML = `<div class="empty"><p>${esc(err.message || 'エラーが発生しました')}</p><a class="btn" href="#/">一覧へ戻る</a></div>`;
  }
  window.scrollTo(0, 0);
  main.focus({ preventScroll: true });
}

window.addEventListener('hashchange', render);
render();
