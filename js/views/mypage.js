// マイページ：自分の投稿と、自分が参加している相談
import { esc, fmtDateTime } from '../ui.js';
import { listingCard } from './list.js';

export async function mypageView(root, { store }) {
  const user = await store.getCurrentUser();
  const [mine, threads] = await Promise.all([
    store.listListings({ ownerId: user.id, includeClosed: true }),
    store.listMyThreads(),
  ]);

  const active = mine.filter((l) => l.status !== 'closed');
  const closed = mine.filter((l) => l.status === 'closed');

  root.innerHTML = `
    <div class="page-head">
      <h1>マイページ</h1>
      <a class="btn" href="#/settings">${esc(user.nickname)} さん（設定）</a>
    </div>

    <h2>相談中のやり取り（${threads.length}件）</h2>
    ${threads.length ? `<ul class="thread-list">${threads.map((t) => `
      <li class="thread-item card"><a href="#/thread/${esc(t.id)}">
        <div><strong>${esc(t.listingTitle)}</strong></div>
        <div class="small muted">${t.ownerId === user.id ? 'あなたの投稿に' : 'あなたから'}・相手：${esc(t.otherName)}さん・${esc(fmtDateTime(t.updatedAt))}</div>
        <div class="last">${esc(t.lastMessage ? `${t.lastMessage.senderId === user.id ? 'あなた：' : ''}${t.lastMessage.body}` : '（まだメッセージはありません）')}</div>
      </a></li>`).join('')}</ul>` : '<p class="muted">まだやり取りはありません。</p>'}

    <h2>自分の投稿（${active.length}件）</h2>
    ${active.length ? `<div class="listing-grid">${active.map(listingCard).join('')}</div>` : '<p class="muted">受付中の投稿はありません。<a href="#/new">投稿する</a></p>'}

    ${closed.length ? `
      <details style="margin-top:20px">
        <summary>受け渡し済み（${closed.length}件）</summary>
        <div class="listing-grid" style="margin-top:12px">${closed.map(listingCard).join('')}</div>
      </details>` : ''}
  `;
}
