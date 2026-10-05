// 投稿の詳細画面
import { STATUSES } from '../constants.js';
import { esc, fmtDate, fmtAgo, fmtDateTime, label, typeBadge, statusBadge, careTagsHtml, optionsHtml, daysUntil, toast, navigate } from '../ui.js';

function row(k, v) {
  return v ? `<tr><th scope="row">${esc(k)}</th><td>${v}</td></tr>` : '';
}

export async function detailView(root, { store }, id) {
  const [l, user] = await Promise.all([store.getListing(id), store.getCurrentUser()]);
  if (!l) {
    root.innerHTML = '<div class="empty"><p>この投稿は見つかりませんでした（削除された可能性があります）。</p><a class="btn" href="#/">一覧へ戻る</a></div>';
    return;
  }
  const isOwner = user && l.ownerId === user.id;
  const threads = await store.listThreadsByListing(id);
  const myThread = !isOwner ? threads.find((t) => t.requesterId === user?.id) : null;

  const expDays = daysUntil(l.expiry);
  const expiryText = l.expiry
    ? `${esc(fmtDate(l.expiry))}${expDays !== null && expDays < 0 ? ' <strong style="color:var(--danger)">（期限切れ）</strong>' : expDays !== null && expDays <= 30 ? '（期限が近いです）' : ''}`
    : '';

  let side;
  if (isOwner) {
    side = `
      <div class="card stack">
        <div>
          <label class="label" for="status-select"><strong>状態を変更</strong></label>
          <select id="status-select">${optionsHtml(STATUSES, l.status)}</select>
          <p class="hint">相談が決まったら「相談中」、渡し終えたら「受け渡し済み」にしてください。</p>
        </div>
        <div class="btn-row">
          <a class="btn" href="#/edit/${esc(l.id)}">編集する</a>
          <button class="btn btn-danger" id="delete-btn" type="button">削除</button>
        </div>
      </div>
      <div class="card">
        <h2 style="margin-top:0">届いている相談（${threads.length}件）</h2>
        ${threads.length ? `<ul class="thread-list">${threads.map((t) => `
          <li class="thread-item"><a href="#/thread/${esc(t.id)}">
            <strong>${esc(t.requesterName)}</strong> さん <span class="muted small">${esc(fmtDateTime(t.updatedAt))}</span>
            <div class="last">${esc(t.lastMessage ? t.lastMessage.body : '（まだメッセージはありません）')}</div>
          </a></li>`).join('')}</ul>` : '<p class="muted small">まだ相談はありません。</p>'}
      </div>`;
  } else if (myThread) {
    side = `
      <div class="card stack">
        <p style="margin:0">この投稿について <strong>${esc(l.ownerName)}</strong> さんと相談しています。</p>
        <a class="btn btn-primary" href="#/thread/${esc(myThread.id)}">やり取りを開く</a>
      </div>`;
  } else if (l.status === 'closed') {
    side = '<div class="card"><p style="margin:0">この投稿は受け渡しが終わりました。</p></div>';
  } else {
    side = `
      <div class="card stack">
        <p style="margin:0">${l.type === 'give' ? 'ゆずってほしい' : '持っている'}ときは、投稿者に相談してみましょう。数量や受け渡しの日時はメッセージで決めます。</p>
        <button class="btn btn-primary" id="consult-btn" type="button">${esc(l.ownerName)} さんに相談する</button>
        <p class="hint">住所や電話番号は、受け渡しが決まってから必要な分だけ伝えましょう。</p>
      </div>`;
  }

  root.innerHTML = `
    <a class="back-link" href="#/">← 一覧へ戻る</a>
    <div class="detail-layout">
      <article class="card">
        <div class="detail-head">
          <div class="badges">${typeBadge(l.type)}${statusBadge(l.status)}</div>
          <h1 style="margin:0">${esc(l.title)}</h1>
          <div>${careTagsHtml(l.careTags)}</div>
        </div>
        <table class="detail-table">
          ${row('カテゴリ', esc(label.category(l.category)))}
          ${row('数量', `<span class="qty">${esc(l.quantity)}</span> ${esc(l.unit)}`)}
          ${row('状態', esc(label.condition(l.condition)))}
          ${row('使用期限', expiryText)}
          ${row('地域', esc(l.area))}
          ${row('受け渡し方法', esc((l.handover || []).map(label.handover).join('、')))}
          ${row('受け渡しの都合', esc(l.availability))}
          ${row('受付期限', l.availableUntil ? `${esc(fmtDate(l.availableUntil))}まで` : '')}
          ${row('補足', l.note ? `<div class="note-text">${esc(l.note)}</div>` : '')}
          ${row('投稿者', `${esc(l.ownerName)}（${esc(fmtAgo(l.updatedAt))}に更新）`)}
        </table>
        ${l.category === 'orthosis' ? '<p class="notice" style="margin-top:12px">装具・福祉用具は体に合わせた調整が必要です。使う前に担当の医師・PT・装具士さんに相談してください。</p>' : ''}
      </article>
      <aside class="side-actions">${side}</aside>
    </div>
  `;

  root.querySelector('#consult-btn')?.addEventListener('click', async () => {
    try {
      const t = await store.openThread(l.id);
      navigate(`#/thread/${t.id}`);
    } catch (e) { toast(e.message); }
  });

  root.querySelector('#status-select')?.addEventListener('change', async (e) => {
    try {
      await store.updateListing(l.id, { status: e.target.value });
      toast(`「${label.status(e.target.value)}」にしました`);
      navigate(`#/item/${l.id}`);
    } catch (err) { toast(err.message); }
  });

  root.querySelector('#delete-btn')?.addEventListener('click', async (e) => {
    const btn = e.currentTarget;
    // ブラウザの確認ダイアログは使わず、2回押しで確定する
    if (btn.dataset.confirm !== '1') {
      btn.dataset.confirm = '1';
      btn.textContent = 'もう一度押すと削除します';
      setTimeout(() => { btn.dataset.confirm = ''; btn.textContent = '削除'; }, 4000);
      return;
    }
    try {
      await store.deleteListing(l.id);
      toast('投稿を削除しました');
      navigate('#/me');
    } catch (err) { toast(err.message); }
  });
}
