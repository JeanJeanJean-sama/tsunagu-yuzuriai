// 相談のやり取り（メッセージ）画面
import { MESSAGE_TEMPLATES } from '../constants.js';
import { esc, fmtDateTime, label, typeBadge, statusBadge, toast, navigate } from '../ui.js';

export async function threadView(root, { store }, id) {
  let thread;
  try {
    thread = await store.getThread(id);
  } catch (e) {
    root.innerHTML = `<div class="empty"><p>${esc(e.message)}</p><p class="small">（試作版では、右上の利用者を切り替えると相手側の画面も確認できます）</p><a class="btn" href="#/me">マイページへ</a></div>`;
    return;
  }
  if (!thread) {
    root.innerHTML = '<div class="empty"><p>やり取りが見つかりません。</p><a class="btn" href="#/me">マイページへ</a></div>';
    return;
  }
  const user = await store.getCurrentUser();
  const isOwner = thread.ownerId === user.id;

  root.innerHTML = `
    <a class="back-link" href="#/me">← マイページへ</a>
    <div class="card stack">
      <div class="badges">${thread.listingType ? typeBadge(thread.listingType) : ''}${statusBadge(thread.listingStatus)}</div>
      <h1 style="margin:0;font-size:19px"><a href="#/item/${esc(thread.listingId)}">${esc(thread.listingTitle)}</a></h1>
      <p class="muted small" style="margin:0">${esc(thread.ownerName)}さん（投稿者）と ${esc(thread.requesterName)}さんのやり取り</p>
      ${isOwner && thread.listingStatus !== 'closed' ? `
        <div class="btn-row">
          ${thread.listingStatus === 'open' ? '<button class="btn btn-small" data-status="negotiating" type="button">この人と相談中にする</button>' : ''}
          <button class="btn btn-small" data-status="closed" type="button">受け渡し済みにする</button>
        </div>` : ''}
    </div>

    <div class="messages" id="messages" aria-live="polite"></div>

    <form class="composer" id="composer">
      <div class="template-chips" aria-label="定型文">
        ${MESSAGE_TEMPLATES.map((t, i) => `<button class="btn btn-small" type="button" data-tpl="${i}">${esc(t.label)}</button>`).join('')}
      </div>
      <label class="visually-hidden" for="body" style="position:absolute;left:-9999px">メッセージ</label>
      <textarea id="body" name="body" maxlength="2000" placeholder="${esc(thread.otherName)}さんへのメッセージ" rows="3"></textarea>
      <div class="btn-row"><button class="btn btn-primary" type="submit">送信</button></div>
    </form>
  `;

  const list = root.querySelector('#messages');
  const textarea = root.querySelector('#body');

  async function renderMessages() {
    const msgs = await store.listMessages(id);
    list.innerHTML = msgs.length
      ? msgs.map((m) => `
        <div class="msg ${m.isMine ? 'msg-me' : ''}">
          <div class="msg-head">${esc(m.isMine ? 'あなた' : m.senderName)}・${esc(fmtDateTime(m.createdAt))}</div>
          <div class="msg-body">${esc(m.body)}</div>
        </div>`).join('')
      : '<div class="msg msg-system">まだメッセージはありません。定型文を使って話しかけてみましょう。</div>';
  }

  root.querySelectorAll('[data-tpl]').forEach((b) => b.addEventListener('click', () => {
    const tpl = MESSAGE_TEMPLATES[Number(b.dataset.tpl)];
    textarea.value = textarea.value ? `${textarea.value}\n${tpl.text}` : tpl.text;
    textarea.focus();
  }));

  root.querySelectorAll('[data-status]').forEach((b) => b.addEventListener('click', async () => {
    try {
      await store.updateListing(thread.listingId, { status: b.dataset.status });
      await store.sendMessage(id, `（投稿の状態を「${label.status(b.dataset.status)}」にしました）`);
      toast(`「${label.status(b.dataset.status)}」にしました`);
      navigate(`#/thread/${id}`);
    } catch (e) { toast(e.message); }
  }));

  root.querySelector('#composer').addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
      await store.sendMessage(id, textarea.value);
      textarea.value = '';
      await renderMessages();
      list.lastElementChild?.scrollIntoView({ block: 'nearest' });
    } catch (err) { toast(err.message); }
  });

  await renderMessages();
}
