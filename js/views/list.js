// 一覧（さがす）画面
import { CATEGORIES, CARE_TAGS } from '../constants.js';
import { esc, fmtAgo, label, typeBadge, statusBadge, careTagsHtml, optionsHtml, daysUntil, fmtDate } from '../ui.js';

// 画面を移動しても絞り込み条件を覚えておく
const filter = { type: 'all', category: '', careTag: '', q: '', includeClosed: false };

export function listingCard(l) {
  const until = daysUntil(l.availableUntil);
  const untilText = l.availableUntil
    ? `${fmtDate(l.availableUntil)}まで${until !== null && until >= 0 && until <= 7 ? '（まもなく）' : ''}`
    : '';
  return `
    <a class="card listing-card${l.status === 'closed' ? ' is-closed' : ''}" href="#/item/${esc(l.id)}">
      <div class="badges">${typeBadge(l.type)}${statusBadge(l.status)}<span class="badge">${esc(label.category(l.category))}</span></div>
      <h3>${esc(l.title)}</h3>
      <div>${careTagsHtml(l.careTags)}</div>
      <ul class="listing-meta">
        <li><span class="k">数量</span><span class="v"><span class="qty">${esc(l.quantity)}</span> ${esc(l.unit)}${l.condition ? `・${esc(label.condition(l.condition))}` : ''}</span></li>
        <li><span class="k">地域</span><span class="v">${esc(l.area)}</span></li>
        ${l.availability || untilText ? `<li><span class="k">受け渡し</span><span class="v">${esc([l.availability, untilText].filter(Boolean).join(' / '))}</span></li>` : ''}
        <li><span class="k">投稿者</span><span class="v">${esc(l.ownerName)}・${esc(fmtAgo(l.updatedAt))}</span></li>
      </ul>
    </a>`;
}

export async function listView(root, { store }) {
  root.innerHTML = `
    <div class="page-head">
      <h1>さがす</h1>
      <a class="btn btn-primary" href="#/new">＋ 投稿する</a>
    </div>

    <section class="filters" aria-label="絞り込み">
      <div class="segmented" role="group" aria-label="種類">
        <button type="button" data-type="all">すべて</button>
        <button type="button" data-type="give">ゆずります</button>
        <button type="button" data-type="want">さがしています</button>
      </div>
      <div class="filter-row">
        <select id="f-category" aria-label="カテゴリ">${optionsHtml(CATEGORIES, filter.category, { empty: 'カテゴリ：すべて' })}</select>
        <select id="f-care" aria-label="医療ケアの種類">${optionsHtml(CARE_TAGS, filter.careTag, { empty: '医療ケア：すべて' })}</select>
      </div>
      <div class="filter-row-3">
        <input type="search" id="f-q" placeholder="キーワード（例：シリンジ、8Fr、北部）" value="${esc(filter.q)}" aria-label="キーワード">
        <label class="choice"><input type="checkbox" id="f-closed"${filter.includeClosed ? ' checked' : ''}> 受け渡し済みも表示</label>
      </div>
    </section>

    <p class="result-count" id="count" aria-live="polite"></p>
    <div class="listing-grid" id="results"></div>
  `;

  const results = root.querySelector('#results');
  const count = root.querySelector('#count');

  function syncTypeButtons() {
    root.querySelectorAll('[data-type]').forEach((b) =>
      b.setAttribute('aria-pressed', String(b.dataset.type === filter.type)));
  }

  async function update() {
    const items = await store.listListings(filter);
    count.textContent = `${items.length}件`;
    results.innerHTML = items.length
      ? items.map(listingCard).join('')
      : `<div class="empty" style="grid-column:1/-1">
           <p>条件に合う投稿はまだありません。</p>
           <a class="btn" href="#/new">「さがしています」を投稿する</a>
         </div>`;
  }

  root.querySelectorAll('[data-type]').forEach((b) => b.addEventListener('click', () => {
    filter.type = b.dataset.type;
    syncTypeButtons();
    update();
  }));
  root.querySelector('#f-category').addEventListener('change', (e) => { filter.category = e.target.value; update(); });
  root.querySelector('#f-care').addEventListener('change', (e) => { filter.careTag = e.target.value; update(); });
  root.querySelector('#f-closed').addEventListener('change', (e) => { filter.includeClosed = e.target.checked; update(); });
  let t;
  root.querySelector('#f-q').addEventListener('input', (e) => {
    clearTimeout(t);
    t = setTimeout(() => { filter.q = e.target.value; update(); }, 200);
  });

  syncTypeButtons();
  await update();
}
