// 設定：利用者の切り替え（試作版）・プロフィール・データ管理
import { esc, toast, navigate } from '../ui.js';

export async function settingsView(root, { store, refreshHeader }) {
  const [user, users] = await Promise.all([store.getCurrentUser(), store.listUsers()]);
  const isLocal = store.backendName === 'local';

  root.innerHTML = `
    <h1>設定</h1>

    ${isLocal ? `
    <section class="card stack">
      <h2 style="margin:0">利用者の切り替え（試作版のみ）</h2>
      <p class="muted small" style="margin:0">本番ではログインになります。試作版では、ここで会員を切り替えて、ゆずる側・もらう側の両方の画面を試せます。</p>
      <select id="user-select" aria-label="利用者">
        ${users.map((u) => `<option value="${esc(u.id)}"${u.id === user.id ? ' selected' : ''}>${esc(u.nickname)}（${esc(u.area)}）</option>`).join('')}
      </select>
    </section>` : ''}

    <section class="card stack" style="margin-top:16px">
      <h2 style="margin:0">プロフィール</h2>
      <form id="profile-form" class="form">
        <div class="field">
          <label for="nickname">ニックネーム</label>
          <input type="text" id="nickname" maxlength="20" value="${esc(user.nickname)}">
          <p class="hint">本名やお子さんのお名前は使わないでください。</p>
        </div>
        <div class="field">
          <label for="area">よく受け渡しできる地域</label>
          <input type="text" id="area" maxlength="30" value="${esc(user.area)}">
        </div>
        <div class="btn-row"><button class="btn btn-primary" type="submit">保存</button></div>
      </form>
    </section>

    ${isLocal ? `
    <section class="card stack" style="margin-top:16px">
      <h2 style="margin:0">データの管理（試作版のみ）</h2>
      <p class="muted small" style="margin:0">試作版のデータはこのブラウザの中だけにあります。書き出したファイルを別の端末で読み込むと、同じ内容を再現できます。</p>
      <div class="btn-row">
        <button class="btn" id="export-btn" type="button">データを書き出す（JSON）</button>
        <label class="btn" for="import-file">データを読み込む</label>
        <input type="file" id="import-file" accept="application/json,.json" style="position:absolute;left:-9999px">
        <button class="btn btn-danger" id="reset-btn" type="button">デモデータに戻す</button>
      </div>
    </section>` : ''}
  `;

  root.querySelector('#user-select')?.addEventListener('change', async (e) => {
    await store.switchUser(e.target.value);
    await refreshHeader();
    toast('利用者を切り替えました');
    navigate('#/settings');
  });

  root.querySelector('#profile-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await store.updateProfile({
        nickname: root.querySelector('#nickname').value,
        area: root.querySelector('#area').value,
      });
      await refreshHeader();
      toast('保存しました');
    } catch (err) { toast(err.message); }
  });

  root.querySelector('#export-btn')?.addEventListener('click', async () => {
    const data = await store.exportData();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `tsunagu-data-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });

  root.querySelector('#import-file')?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await store.importData(JSON.parse(await file.text()));
      await refreshHeader();
      toast('読み込みました');
      navigate('#/');
    } catch (err) { toast(err.message || '読み込めませんでした'); }
  });

  root.querySelector('#reset-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm = '1';
      btn.textContent = 'もう一度押すと元に戻します';
      setTimeout(() => { btn.dataset.confirm = ''; btn.textContent = 'デモデータに戻す'; }, 4000);
      return;
    }
    await store.resetDemo();
    await refreshHeader();
    toast('デモデータに戻しました');
    navigate('#/');
  });
}
