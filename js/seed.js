// =========================================================
// デモ用の初期データ（local モードで初回表示時・「デモデータに戻す」で使う）
// 人物・内容はすべて架空。
// =========================================================

const DAY = 24 * 60 * 60 * 1000;

function iso(base, offsetDays, hour = 10) {
  const d = new Date(base.getTime() + offsetDays * DAY);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function dateOnly(base, offsetDays) {
  const d = new Date(base.getTime() + offsetDays * DAY);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function createSeedData(now = new Date()) {
  const users = [
    { id: 'u-sakura', nickname: 'さくらママ', area: '市内北部' },
    { id: 'u-haru', nickname: 'はるパパ', area: '市内中央' },
    { id: 'u-midori', nickname: 'みどり', area: '隣町' },
    { id: 'u-kota', nickname: 'こうたママ', area: '市内南部' },
    { id: 'u-yui', nickname: 'ゆいの母', area: '市内中央' },
  ];

  const listings = [
    {
      id: 'l-001', type: 'give', title: 'カテーテルチップシリンジ 50mL',
      category: 'medical-supply', careTags: ['gastrostomy', 'ng-tube'],
      quantity: 20, unit: '本', condition: 'sealed', expiry: dateOnly(now, 400),
      area: '市内北部', handover: ['hand', 'meeting'],
      availableUntil: dateOnly(now, 30), availability: '平日15時以降、土曜午前',
      note: 'メーカー変更で余りました。個包装・未開封です。',
      status: 'open', ownerId: 'u-sakura', createdAt: iso(now, -2), updatedAt: iso(now, -2),
    },
    {
      id: 'l-002', type: 'give', title: '経鼻栄養チューブ 8Fr',
      category: 'tube-feeding', careTags: ['ng-tube'],
      quantity: 6, unit: '本', condition: 'sealed', expiry: dateOnly(now, 200),
      area: '市内中央', handover: ['hand', 'delivery'],
      availableUntil: '', availability: '土日ならいつでも。郵送の場合は送料のみご負担ください。',
      note: 'サイズアップしたため使わなくなりました。',
      status: 'negotiating', ownerId: 'u-haru', createdAt: iso(now, -5), updatedAt: iso(now, -1),
    },
    {
      id: 'l-003', type: 'give', title: 'とろみ調整食品（スティック 3g）',
      category: 'nutrition', careTags: ['dysphagia'],
      quantity: 2, unit: '箱（50本入）', condition: 'sealed', expiry: dateOnly(now, 120),
      area: '隣町', handover: ['meeting'],
      availableUntil: dateOnly(now, 21), availability: '次回の定例会でお渡しします',
      note: '食品扱いの市販品です。',
      status: 'open', ownerId: 'u-midori', createdAt: iso(now, -1), updatedAt: iso(now, -1),
    },
    {
      id: 'l-004', type: 'give', title: '短下肢装具（子ども用・右）',
      category: 'orthosis', careTags: ['mobility'],
      quantity: 1, unit: '足', condition: 'used', expiry: '',
      area: '市内南部', handover: ['hand'],
      availableUntil: '', availability: '平日の夕方なら相談できます',
      note: '足長 約17cm。成長で合わなくなりました。装具は体に合わせて調整が必要なので、使う前に必ず担当の先生・装具士さんに相談してください。',
      status: 'open', ownerId: 'u-kota', createdAt: iso(now, -8), updatedAt: iso(now, -8),
    },
    {
      id: 'l-005', type: 'give', title: '吸引カテーテル 10Fr',
      category: 'respiratory', careTags: ['suction', 'tracheostomy'],
      quantity: 1, unit: '箱（50本入）', condition: 'opened-unused', expiry: dateOnly(now, 300),
      area: '市内中央', handover: ['hand', 'meeting'],
      availableUntil: dateOnly(now, 14), availability: '水・金の午後',
      note: '箱は開けましたが中身は個包装のままで、残り38本です。',
      status: 'open', ownerId: 'u-yui', createdAt: iso(now, -3), updatedAt: iso(now, -3),
    },
    {
      id: 'l-006', type: 'want', title: '胃ろうボタン用 延長チューブ（ボーラス用）',
      category: 'tube-feeding', careTags: ['gastrostomy'],
      quantity: 2, unit: '本', condition: 'sealed', expiry: '',
      area: '市内北部', handover: ['hand', 'meeting', 'delivery'],
      availableUntil: '', availability: '急ぎではありません',
      note: '次の受診まで少し足りなくなりそうです。同じ規格のものをお持ちの方がいれば。',
      status: 'open', ownerId: 'u-sakura', createdAt: iso(now, -4), updatedAt: iso(now, -4),
    },
    {
      id: 'l-007', type: 'want', title: '座位保持クッション（幼児用）',
      category: 'orthosis', careTags: ['mobility'],
      quantity: 1, unit: '個', condition: 'used', expiry: '',
      area: '市内南部', handover: ['hand'],
      availableUntil: '', availability: '土日',
      note: 'お試しで使ってみたいので、使わなくなったものがあれば教えてください。',
      status: 'open', ownerId: 'u-kota', createdAt: iso(now, -6), updatedAt: iso(now, -6),
    },
    {
      id: 'l-008', type: 'give', title: '紙おむつ テープ Sサイズ',
      category: 'hygiene', careTags: [],
      quantity: 3, unit: 'パック', condition: 'sealed', expiry: '',
      area: '市内中央', handover: ['hand', 'meeting'],
      availableUntil: '', availability: '',
      note: '',
      status: 'closed', ownerId: 'u-haru', createdAt: iso(now, -20), updatedAt: iso(now, -12),
    },
  ];

  const threads = [
    { id: 't-001', listingId: 'l-002', ownerId: 'u-haru', requesterId: 'u-sakura', createdAt: iso(now, -3), updatedAt: iso(now, -1, 20) },
    { id: 't-002', listingId: 'l-001', ownerId: 'u-sakura', requesterId: 'u-midori', createdAt: iso(now, -1, 12), updatedAt: iso(now, -1, 12) },
  ];

  const messages = [
    { id: 'm-001', threadId: 't-001', senderId: 'u-sakura', body: 'はじめまして。経鼻チューブ、3本ほどゆずっていただけないでしょうか。', createdAt: iso(now, -3, 9) },
    { id: 'm-002', threadId: 't-001', senderId: 'u-haru', body: 'もちろんです！今週末の土曜、午前中に中央公民館でいかがですか？', createdAt: iso(now, -2, 19) },
    { id: 'm-003', threadId: 't-001', senderId: 'u-sakura', body: '【受け渡し候補】\n・日時：土曜 10:30\n・場所：中央公民館 入口\n・方法：手渡し\nこちらでお願いします。', createdAt: iso(now, -1, 20) },
    { id: 'm-004', threadId: 't-002', senderId: 'u-midori', body: 'シリンジ、5本いただけると助かります。定例会のときに受け取れますか？', createdAt: iso(now, -1, 12) },
  ];

  return { users, listings, threads, messages, currentUserId: 'u-sakura' };
}
