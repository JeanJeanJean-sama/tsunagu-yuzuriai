# 仕組みとデータの形（ARCHITECTURE）

## 全体像

```
[ブラウザ]
  index.html
    └ js/app.js ………… URL の #/... を見て、どの画面を出すか決める
         └ js/views/*.js …… 各画面。データは store 経由でだけ扱う
              └ js/store.js …… config.js の BACKEND を見て実装を選ぶ
                   ├ stores/local-store.js    （今）localStorage に保存
                   └ stores/supabase-store.js （次）Supabase に保存
```

- GitHub Pages は「ファイルを配るだけ」の仕組みなので、**データの保存・共有・ログインはできない**。
- 試作版ではブラウザ内に保存して画面を確かめる。本番版では Supabase（データベース・ログイン・権限管理を提供する外部サービス）を使う予定。
- 画面側（views）はどちらの保存先でも同じコードで動くように、`store` の関数だけを使う。

## 画面とURL

| URL | ファイル | 内容 |
|---|---|---|
| `#/` | views/list.js | 一覧・絞り込み |
| `#/item/:id` | views/detail.js | 投稿の詳細。投稿者なら状態変更・編集・削除・届いた相談一覧 |
| `#/new` / `#/edit/:id` | views/form.js | 投稿フォーム |
| `#/thread/:id` | views/thread.js | 相談のメッセージ |
| `#/me` | views/mypage.js | 自分の投稿・相談 |
| `#/rules` | views/rules.js | ルール（たたき台） |
| `#/settings` | views/settings.js | プロフィール、試作版の利用者切り替え・データ管理 |

## データモデル

### users（会員）
| 項目 | 型 | 説明 |
|---|---|---|
| id | string | |
| nickname | string | 20文字以内。本名は使わない |
| area | string | よく受け渡しできる地域（おおまか） |

### listings（投稿）
| 項目 | 型 | 説明 |
|---|---|---|
| id | string | |
| type | `give` \| `want` | ゆずります／さがしています |
| title | string | 品名（80文字以内） |
| category | string | `constants.js` の CATEGORIES の id |
| careTags | string[] | CARE_TAGS の id（複数） |
| quantity | number | 1以上 |
| unit | string | 本・箱など |
| condition | string | CONDITIONS の id |
| expiry | `YYYY-MM-DD` \| '' | 使用期限・賞味期限 |
| area | string | 受け渡しできる地域 |
| handover | string[] | HANDOVER の id（1つ以上） |
| availability | string | 受け渡しの都合（自由記述） |
| availableUntil | `YYYY-MM-DD` \| '' | いつまで受け付けるか |
| note | string | 補足（1000文字以内） |
| status | `open` \| `negotiating` \| `closed` | 受付中／相談中／受け渡し済み |
| ownerId | string | 投稿者 |
| createdAt / updatedAt | ISO 文字列 | |

### threads（相談）
投稿1件 × 相談する人1人 につき1つ。
| 項目 | 型 | 説明 |
|---|---|---|
| id | string | |
| listingId | string | |
| ownerId | string | 投稿者 |
| requesterId | string | 相談した人 |
| createdAt / updatedAt | ISO 文字列 | updatedAt は最後のメッセージ時刻 |

### messages（メッセージ）
| 項目 | 型 | 説明 |
|---|---|---|
| id | string | |
| threadId | string | |
| senderId | string | |
| body | string | 2000文字以内 |
| createdAt | ISO 文字列 | |

## 権限のルール（どの実装でも守る）

1. 投稿の一覧・詳細は、会員なら誰でも見られる。
2. 投稿の編集・削除・状態変更は、**投稿者本人だけ**。
3. 自分の投稿には相談できない。受け渡し済みの投稿には新しく相談できない。
4. 相談（スレッド）とメッセージは、**その投稿者と相談した人の2人だけ**が見られる・書ける。
5. 投稿を削除すると、その投稿の相談とメッセージも消える。

`tests/local-store.test.mjs` でこのルールを確認している。Supabase 版では RLS で同じことを実装する。

## データ層の API（`store`）

すべて Promise を返す。画面に返す投稿には `ownerName`、スレッドには `listingTitle` `otherName` `lastMessage` などの表示用項目が付く。

| 関数 | 説明 |
|---|---|
| `getCurrentUser()` | ログイン中の会員 |
| `listUsers()` | 会員一覧（試作版の切り替え用） |
| `switchUser(id)` | 試作版のみ。本番ではログイン／ログアウトに置き換える |
| `updateProfile({nickname, area})` | |
| `listListings({type, category, careTag, q, area, includeClosed, ownerId})` | 並び順：受付中→相談中→済み、その中で更新が新しい順 |
| `getListing(id)` | 無ければ null |
| `createListing(data)` / `updateListing(id, patch)` | 入力エラー時は `err.fields` に項目別メッセージ |
| `deleteListing(id)` | |
| `openThread(listingId)` | 相談を始める。既にあればそれを返す |
| `getThread(id)` / `listThreadsByListing(listingId)` / `listMyThreads()` | |
| `listMessages(threadId)` / `sendMessage(threadId, body)` | 各メッセージに `senderName` `isMine` が付く |
| `exportData()` / `importData(obj)` / `resetDemo()` | 試作版のみ |
