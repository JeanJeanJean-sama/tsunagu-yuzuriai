# 本番化の計画（Supabase）

## なぜ必要か

GitHub Pages は「作り置きのファイルを配る」だけなので、次のことができません。

| 必要なこと | GitHub Pages だけ | Supabase を足すと |
|---|---|---|
| 投稿を全員で共有する | ×（各自のブラウザ内だけ） | ○ データベースに保存 |
| 会員だけが見られるようにする | ×（URL を知れば誰でも見える） | ○ ログイン＋権限管理 |
| 相談を当事者2人だけに見せる | × | ○ RLS（行レベルセキュリティ） |
| 新着メッセージの即時表示 | × | ○ Realtime |
| 写真の保存 | × | ○ Storage |

Supabase は、データベース（PostgreSQL）・ログイン・ファイル保存をまとめて提供するサービスで、数十人規模なら無料プランで収まる見込みです。
（無料プランの条件は変わることがあるので、始める時点で公式サイトを確認してください。しばらく使われないと一時停止される条件があったはずなので、その点も確認。）
Firebase でも同じことはできますが、表の形のデータと権限ルールを SQL で書ける Supabase を第一候補にしています（DECISIONS.md 参照）。

画面は引き続き GitHub Pages に置き、データだけ Supabase に置く構成です。

## 手順

1. supabase.com でプロジェクトを作る（リージョンは Tokyo）。
2. SQL Editor で下の SQL を実行する。
3. Authentication → Providers で Email（マジックリンク）を有効化。**新規登録は無効**にして、管理者が招待する運用にする。
4. Authentication → URL Configuration に GitHub Pages の URL を登録。
5. `js/config.js` に `SUPABASE_URL` と `SUPABASE_ANON_KEY`（公開用キー）を入れ、`BACKEND: 'supabase'` にする。
   **service_role キーは絶対にリポジトリに入れない。**
6. `js/stores/supabase-store.js` を実装する。Supabase の JS ライブラリはビルドなしで使えるよう CDN の ES モジュール版を読み込む
   （例：`import { createClient } from 'https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2/+esm'`）。
7. 戻り値の形を local-store と同じにする（`ownerName` などはビューかクエリの結合で作る）。
8. 2人分のテスト用アカウントで、ARCHITECTURE.md の「権限のルール」1〜5 を手で確認する。

## SQL（たたき台）

```sql
-- 会員プロフィール（auth.users と 1対1）
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  nickname text not null check (char_length(nickname) between 1 and 20),
  area text not null default '' check (char_length(area) <= 30),
  created_at timestamptz not null default now()
);

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references public.profiles(id) on delete cascade,
  type text not null check (type in ('give','want')),
  title text not null check (char_length(title) between 1 and 80),
  category text not null,
  care_tags text[] not null default '{}',
  quantity integer not null check (quantity > 0),
  unit text not null check (char_length(unit) between 1 and 20),
  condition text not null default 'sealed',
  expiry date,
  area text not null check (char_length(area) between 1 and 30),
  handover text[] not null check (cardinality(handover) > 0),
  availability text not null default '' check (char_length(availability) <= 100),
  available_until date,
  note text not null default '' check (char_length(note) <= 1000),
  status text not null default 'open' check (status in ('open','negotiating','closed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.threads (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings(id) on delete cascade,
  owner_id uuid not null references public.profiles(id) on delete cascade,
  requester_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (listing_id, requester_id),
  check (owner_id <> requester_id)
);

create table public.messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.threads(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete cascade,
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.listings enable row level security;
alter table public.threads  enable row level security;
alter table public.messages enable row level security;

-- profiles：ログインした会員は全員のニックネームを見られる。編集は本人のみ
create policy "profiles_read"   on public.profiles for select to authenticated using (true);
create policy "profiles_update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

-- listings：会員は全件閲覧。作成・編集・削除は本人のみ
create policy "listings_read"   on public.listings for select to authenticated using (true);
create policy "listings_insert" on public.listings for insert to authenticated with check (owner_id = auth.uid());
create policy "listings_update" on public.listings for update to authenticated using (owner_id = auth.uid()) with check (owner_id = auth.uid());
create policy "listings_delete" on public.listings for delete to authenticated using (owner_id = auth.uid());

-- threads：当事者のみ閲覧。作成は相談する本人が、受付中/相談中の他人の投稿に対してのみ
create policy "threads_read" on public.threads for select to authenticated
  using (auth.uid() in (owner_id, requester_id));
create policy "threads_insert" on public.threads for insert to authenticated
  with check (
    requester_id = auth.uid()
    and exists (
      select 1 from public.listings l
      where l.id = listing_id and l.owner_id = threads.owner_id
        and l.owner_id <> auth.uid() and l.status <> 'closed'
    )
  );

-- messages：当事者のみ閲覧・送信
create policy "messages_read" on public.messages for select to authenticated
  using (exists (select 1 from public.threads t where t.id = thread_id and auth.uid() in (t.owner_id, t.requester_id)));
create policy "messages_insert" on public.messages for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.threads t where t.id = thread_id and auth.uid() in (t.owner_id, t.requester_id))
  );

-- メッセージ送信時にスレッドの updated_at を更新
create function public.touch_thread() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.threads set updated_at = new.created_at where id = new.thread_id;
  return new;
end $$;
create trigger messages_touch_thread after insert on public.messages
  for each row execute function public.touch_thread();

-- 投稿の更新時刻
create function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;
create trigger listings_touch before update on public.listings
  for each row execute function public.touch_updated_at();
```

> この SQL は**たたき台**です。実行前に、ARCHITECTURE.md の権限ルールと食い違いがないか、2つのテスト用アカウントで必ず確認してください。

## 対応表（local → Supabase）

| local-store | Supabase |
|---|---|
| `switchUser` | ログイン／ログアウト（`supabase.auth.signInWithOtp` / `signOut`） |
| `listUsers` | 管理者画面でのみ使う。一般画面からは呼ばない |
| `ownerId` などの camelCase | テーブルは snake_case。store の中で変換する |
| `exportData` / `importData` / `resetDemo` | 本番では使わない（管理者向けに別途検討） |
