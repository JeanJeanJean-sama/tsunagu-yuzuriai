// データ層のテスト。実行：node --test tests/
// ブラウザなしで動く（localStorage の代わりにメモリを渡している）。
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLocalStore, validateListing } from '../js/stores/local-store.js';

function memoryStorage() {
  const m = new Map();
  return { getItem: (k) => (m.has(k) ? m.get(k) : null), setItem: (k, v) => m.set(k, v), removeItem: (k) => m.delete(k) };
}

function newStore() {
  return createLocalStore({ storageKey: 'test', storage: memoryStorage() });
}

const valid = {
  type: 'give', title: 'テスト用シリンジ', category: 'medical-supply', careTags: ['gastrostomy'],
  quantity: '5', unit: '本', condition: 'sealed', area: '市内', handover: ['hand'],
};

test('初回はデモデータが入る', async () => {
  const s = newStore();
  const items = await s.listListings({ includeClosed: true });
  assert.ok(items.length > 0);
  assert.ok(items[0].ownerName);
});

test('受け渡し済みは標準では一覧に出ない', async () => {
  const s = newStore();
  const open = await s.listListings();
  assert.ok(open.every((l) => l.status !== 'closed'));
});

test('種類・カテゴリ・医療ケア・キーワードで絞り込める', async () => {
  const s = newStore();
  assert.ok((await s.listListings({ type: 'want' })).every((l) => l.type === 'want'));
  assert.ok((await s.listListings({ category: 'orthosis' })).every((l) => l.category === 'orthosis'));
  assert.ok((await s.listListings({ careTag: 'suction' })).every((l) => l.careTags.includes('suction')));
  const hit = await s.listListings({ q: '8fr' });
  assert.equal(hit.length, 1);
});

test('投稿を作成・編集・削除できる', async () => {
  const s = newStore();
  const created = await s.createListing(valid);
  assert.equal(created.quantity, 5);
  assert.equal(created.status, 'open');
  const updated = await s.updateListing(created.id, { quantity: 3, status: 'negotiating' });
  assert.equal(updated.quantity, 3);
  assert.equal(updated.status, 'negotiating');
  await s.deleteListing(created.id);
  assert.equal(await s.getListing(created.id), null);
});

test('入力チェック', () => {
  assert.deepEqual(validateListing(valid), {});
  const e = validateListing({ ...valid, title: '', quantity: 0, handover: [] });
  assert.ok(e.title && e.quantity && e.handover);
});

test('他人の投稿は編集・削除できない', async () => {
  const s = newStore();
  const created = await s.createListing(valid);
  await s.switchUser('u-haru');
  await assert.rejects(() => s.updateListing(created.id, { title: 'x' }), /自分の投稿/);
  await assert.rejects(() => s.deleteListing(created.id), /自分の投稿/);
});

test('相談スレッド：作成・メッセージ・第三者は見られない', async () => {
  const s = newStore();
  const created = await s.createListing(valid); // さくらママの投稿
  await assert.rejects(() => s.openThread(created.id), /自分の投稿/);

  await s.switchUser('u-haru');
  const t = await s.openThread(created.id);
  const again = await s.openThread(created.id);
  assert.equal(t.id, again.id, '同じ人が2回相談しても同じスレッド');
  await s.sendMessage(t.id, 'ゆずってください');

  await s.switchUser('u-sakura');
  const msgs = await s.listMessages(t.id);
  assert.equal(msgs.length, 1);
  assert.equal(msgs[0].isMine, false);
  assert.equal((await s.listThreadsByListing(created.id)).length, 1);

  await s.switchUser('u-midori');
  await assert.rejects(() => s.listMessages(t.id), /参加していません/);
  await assert.rejects(() => s.sendMessage(t.id, 'x'), /参加していません/);
});

test('投稿を削除するとスレッドとメッセージも消える', async () => {
  const s = newStore();
  const created = await s.createListing(valid);
  await s.switchUser('u-haru');
  const t = await s.openThread(created.id);
  await s.sendMessage(t.id, 'hi');
  await s.switchUser('u-sakura');
  await s.deleteListing(created.id);
  const data = await s.exportData();
  assert.ok(!data.threads.some((x) => x.id === t.id));
  assert.ok(!data.messages.some((m) => m.threadId === t.id));
});

test('書き出し→読み込みで復元できる', async () => {
  const a = newStore();
  await a.createListing(valid);
  const dump = await a.exportData();
  const b = newStore();
  await b.importData(dump);
  assert.equal((await b.listListings({ includeClosed: true })).length, dump.listings.length);
  await assert.rejects(() => b.importData({ foo: 1 }), /形式/);
});
