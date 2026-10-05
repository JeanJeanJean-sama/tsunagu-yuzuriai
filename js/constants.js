// =========================================================
// 選択肢（マスタデータ）
// 項目を増やす・名前を変えるときはこのファイルだけ直せばよい。
// id は保存データに残るので、一度使い始めたら変更しないこと（label は変更OK）。
// =========================================================

/** 投稿の種類 */
export const TYPES = [
  { id: 'give', label: 'ゆずります' },
  { id: 'want', label: 'さがしています' },
];

/** 品目カテゴリ */
export const CATEGORIES = [
  { id: 'medical-supply', label: '医療消耗品', hint: 'シリンジ、ガーゼ、固定テープ、アルコール綿など' },
  { id: 'tube-feeding', label: '経管栄養用品', hint: '栄養チューブ、カテーテル、イルリガートル、接続チューブなど' },
  { id: 'nutrition', label: '流動食・とろみ剤', hint: '食品扱いの流動食、ミキサー食材、とろみ剤など（医薬品の栄養剤は不可）' },
  { id: 'respiratory', label: '呼吸ケア用品', hint: '吸引カテーテル、人工鼻、カニューレ固定ひもなど' },
  { id: 'orthosis', label: '装具・福祉用具', hint: '短下肢装具、座位保持用品、バギー、入浴用品など' },
  { id: 'hygiene', label: 'おむつ・衛生用品', hint: '紙おむつ、尿とりパッド、清拭用品など' },
  { id: 'clothing', label: '衣類・生活用品', hint: '前開き肌着、胃ろうカバー、スタイなど' },
  { id: 'other', label: 'その他', hint: '' },
];

/** 医療ケア・障害の種類（絞り込み用タグ。複数選択） */
export const CARE_TAGS = [
  { id: 'ng-tube', label: '経鼻経管' },
  { id: 'gastrostomy', label: '胃ろう・腸ろう' },
  { id: 'tracheostomy', label: '気管切開' },
  { id: 'ventilator', label: '人工呼吸器' },
  { id: 'oxygen', label: '在宅酸素' },
  { id: 'suction', label: '吸引' },
  { id: 'catheterization', label: '導尿' },
  { id: 'ostomy', label: 'ストーマ' },
  { id: 'dysphagia', label: '摂食・嚥下' },
  { id: 'mobility', label: '肢体不自由' },
  { id: 'other', label: 'その他' },
];

/** 品物の状態 */
export const CONDITIONS = [
  { id: 'sealed', label: '未開封' },
  { id: 'opened-unused', label: '開封済み・未使用' },
  { id: 'used', label: '使用品（装具・用具など）' },
];

/** 受け渡し方法（複数選択） */
export const HANDOVER = [
  { id: 'hand', label: '手渡し' },
  { id: 'meeting', label: '会の集まりで' },
  { id: 'delivery', label: '郵送・宅配' },
];

/** 投稿の状態 */
export const STATUSES = [
  { id: 'open', label: '受付中' },
  { id: 'negotiating', label: '相談中' },
  { id: 'closed', label: '受け渡し済み' },
];

/** 相談メッセージの入力補助テンプレート */
export const MESSAGE_TEMPLATES = [
  { label: 'ゆずってほしい', text: 'はじめまして。こちらの品物をゆずっていただけないでしょうか。\n希望数量：\n' },
  { label: '受け渡し日の提案', text: '【受け渡し候補】\n・日時：\n・場所：\n・方法：手渡し／会の集まり／郵送\n' },
  { label: '数量の確認', text: '残りの数量と使用期限を教えていただけますか。' },
  { label: 'お礼', text: '無事に受け取りました。ありがとうございました！' },
];

export function labelOf(list, id) {
  const found = list.find((x) => x.id === id);
  return found ? found.label : '';
}
