// 投稿フォーム（新規・編集）
import { TYPES, CATEGORIES, CARE_TAGS, CONDITIONS, HANDOVER } from '../constants.js';
import { esc, optionsHtml, toast, navigate } from '../ui.js';

function checkboxes(name, list, selected = []) {
  return list.map((x) => `
    <label class="choice"><input type="checkbox" name="${name}" value="${esc(x.id)}"${selected.includes(x.id) ? ' checked' : ''}> ${esc(x.label)}</label>`).join('');
}

function radios(name, list, selected) {
  return list.map((x) => `
    <label class="choice"><input type="radio" name="${name}" value="${esc(x.id)}"${x.id === selected ? ' checked' : ''}> ${esc(x.label)}</label>`).join('');
}

export async function formView(root, { store }, id) {
  const user = await store.getCurrentUser();
  let l = {
    type: 'give', title: '', category: '', careTags: [], quantity: '', unit: '',
    condition: 'sealed', expiry: '', area: user?.area || '', handover: ['hand'],
    availableUntil: '', availability: '', note: '',
  };
  const isEdit = Boolean(id);
  if (isEdit) {
    const found = await store.getListing(id);
    if (!found) throw new Error('投稿が見つかりません');
    if (found.ownerId !== user?.id) throw new Error('自分の投稿だけ編集できます');
    l = found;
  }

  root.innerHTML = `
    <a class="back-link" href="${isEdit ? `#/item/${esc(id)}` : '#/'}">← 戻る</a>
    <h1>${isEdit ? '投稿を編集' : '投稿する'}</h1>

    <div class="notice" style="margin-bottom:16px">
      <p><strong>投稿の前に確認してください</strong></p>
      <ul>
        <li>処方薬・医薬品扱いの栄養剤（処方で出ているもの）は投稿できません。</li>
        <li>医療消耗品は、未開封・個包装のもの・使用期限内のものに限ります。</li>
        <li>お子さんのお名前・病院名・住所などは書かないでください。</li>
      </ul>
      <p><a href="#/rules">ゆずりあいのルールを読む</a></p>
    </div>

    <form class="form card" id="listing-form" novalidate>
      <div class="field">
        <span class="label">種類<span class="req">必須</span></span>
        <div class="choice-group">${radios('type', TYPES, l.type)}</div>
        <p class="field-error" data-err="type"></p>
      </div>

      <div class="field">
        <label for="title">品名<span class="req">必須</span></label>
        <input type="text" id="title" name="title" maxlength="80" value="${esc(l.title)}" placeholder="例：カテーテルチップシリンジ 50mL" required>
        <p class="hint">サイズ・規格（Fr、mL など）も書くと探しやすくなります。</p>
        <p class="field-error" data-err="title"></p>
      </div>

      <div class="field">
        <label for="category">カテゴリ<span class="req">必須</span></label>
        <select id="category" name="category" required>${optionsHtml(CATEGORIES, l.category, { empty: '選んでください' })}</select>
        <p class="hint" id="category-hint"></p>
        <p class="field-error" data-err="category"></p>
      </div>

      <div class="field">
        <span class="label">関係する医療ケア（あてはまるものすべて）</span>
        <div class="choice-group">${checkboxes('careTags', CARE_TAGS, l.careTags)}</div>
      </div>

      <div class="field">
        <span class="label">数量<span class="req">必須</span></span>
        <div class="inline-2">
          <input type="number" id="quantity" name="quantity" min="1" step="1" inputmode="numeric" value="${esc(l.quantity)}" aria-label="数量" placeholder="例：20">
          <input type="text" id="unit" name="unit" maxlength="20" value="${esc(l.unit)}" aria-label="単位" placeholder="本／箱／袋 など" list="unit-list">
          <datalist id="unit-list"><option value="本"><option value="個"><option value="枚"><option value="箱"><option value="袋"><option value="パック"><option value="足"></datalist>
        </div>
        <p class="field-error" data-err="quantity"></p>
        <p class="field-error" data-err="unit"></p>
      </div>

      <div class="field">
        <span class="label">品物の状態</span>
        <div class="choice-group">${radios('condition', CONDITIONS, l.condition)}</div>
      </div>

      <div class="field">
        <label for="expiry">使用期限・賞味期限</label>
        <input type="date" id="expiry" name="expiry" value="${esc(l.expiry)}">
        <p class="hint">期限があるものは入力してください。</p>
      </div>

      <div class="field">
        <label for="area">受け渡しできる地域<span class="req">必須</span></label>
        <input type="text" id="area" name="area" maxlength="30" value="${esc(l.area)}" placeholder="例：市内北部、〇〇駅周辺">
        <p class="hint">住所ではなく、おおまかな地域にしてください。</p>
        <p class="field-error" data-err="area"></p>
      </div>

      <div class="field">
        <span class="label">受け渡し方法<span class="req">必須</span></span>
        <div class="choice-group">${checkboxes('handover', HANDOVER, l.handover)}</div>
        <p class="field-error" data-err="handover"></p>
      </div>

      <div class="field">
        <label for="availability">受け渡しの都合</label>
        <input type="text" id="availability" name="availability" maxlength="100" value="${esc(l.availability)}" placeholder="例：平日15時以降、土曜午前">
      </div>

      <div class="field">
        <label for="availableUntil">いつまで受け付けるか</label>
        <input type="date" id="availableUntil" name="availableUntil" value="${esc(l.availableUntil)}">
      </div>

      <div class="field">
        <label for="note">補足</label>
        <textarea id="note" name="note" maxlength="1000" placeholder="余った理由、メーカー、箱の状態など">${esc(l.note)}</textarea>
        <p class="field-error" data-err="note"></p>
      </div>

      <div class="btn-row">
        <button class="btn btn-primary" type="submit">${isEdit ? '保存する' : '投稿する'}</button>
        <a class="btn" href="${isEdit ? `#/item/${esc(id)}` : '#/'}">やめる</a>
      </div>
    </form>
  `;

  const form = root.querySelector('#listing-form');
  const catSel = form.querySelector('#category');
  const catHint = form.querySelector('#category-hint');
  const showHint = () => { catHint.textContent = CATEGORIES.find((c) => c.id === catSel.value)?.hint || ''; };
  catSel.addEventListener('change', showHint);
  showHint();

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    form.querySelectorAll('[data-err]').forEach((el) => { el.textContent = ''; });
    const fd = new FormData(form);
    const data = {
      type: fd.get('type'),
      title: String(fd.get('title') || '').trim(),
      category: fd.get('category'),
      careTags: fd.getAll('careTags'),
      quantity: fd.get('quantity'),
      unit: String(fd.get('unit') || '').trim(),
      condition: fd.get('condition'),
      expiry: fd.get('expiry') || '',
      area: String(fd.get('area') || '').trim(),
      handover: fd.getAll('handover'),
      availability: String(fd.get('availability') || '').trim(),
      availableUntil: fd.get('availableUntil') || '',
      note: String(fd.get('note') || '').trim(),
    };
    try {
      const saved = isEdit ? await store.updateListing(id, data) : await store.createListing(data);
      toast(isEdit ? '保存しました' : '投稿しました');
      navigate(`#/item/${saved.id}`);
    } catch (err) {
      if (err.fields) {
        for (const [k, msg] of Object.entries(err.fields)) {
          const el = form.querySelector(`[data-err="${k}"]`);
          if (el) el.textContent = msg;
        }
        form.querySelector('.field-error:not(:empty)')?.closest('.field')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      toast(err.message);
    }
  });
}
