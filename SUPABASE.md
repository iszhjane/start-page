# Supabase 同步配置

启用跨设备同步需要配置 Supabase 项目。

## 1. 创建 Supabase 项目

前往 [supabase.com](https://supabase.com) 注册并创建一个新项目。创建完成后记录以下信息：

- **Project URL** — 位于 Settings → API → Project URL
- **anon public key** — 位于 Settings → API → anon public

## 2. 配置环境变量

在项目根目录创建 `.env` 文件（参考 `.env.example`）：

```ini
PUBLIC_SUPABASE_URL=https://你的项目ID.supabase.co
PUBLIC_SUPABASE_ANON_KEY=你的anon密钥
```

在 **Auth → Settings → General** 关闭 **"Confirm email"**（否则未验证邮箱的用户无法登录）。

## 3. 在 SQL Editor 中执行（完整可覆盖）

在 Supabase Dashboard 的 **SQL Editor** 中执行以下 SQL：

```sql
-- ===========================================
-- 同步表结构（完整覆盖版）
-- ===========================================

-- 删除旧表（会清空已同步的数据，本地浏览器数据不受影响）
drop table if exists public.bookmarks cascade;
drop table if exists public.categories cascade;
drop table if exists public.workflows cascade;
drop table if exists public.user_settings cascade;

-- 书签表
create table if not exists public.bookmarks (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  href text not null,
  title text not null,
  category_id text not null default '',
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists bookmarks_user_idx on public.bookmarks(user_id);

-- 分组表
create table if not exists public.categories (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  "order" int not null,
  builtin boolean not null default false,
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists categories_user_idx on public.categories(user_id);

-- 工作流表
create table if not exists public.workflows (
  id text primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  bookmark_ids text[] not null default '{}',
  urls text[] not null default '{}',
  created_at bigint not null,
  updated_at timestamptz not null default now()
);
create index if not exists workflows_user_idx on public.workflows(user_id);

-- 用户设置表
create table if not exists public.user_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  theme_mode text not null default 'light',
  theme_style text not null default 'default',
  bookmark_sort text not null default 'alpha',
  search_engine text not null default 'google',
  custom_search_name text,
  custom_search_url text,
  updated_at timestamptz not null default now()
);

-- 开启 RLS
alter table public.bookmarks enable row level security;
alter table public.categories enable row level security;
alter table public.workflows enable row level security;
alter table public.user_settings enable row level security;

-- 策略：用户只能读写自己的数据
drop policy if exists "user own" on public.bookmarks;
create policy "user own" on public.bookmarks
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.categories;
create policy "user own" on public.categories
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.workflows;
create policy "user own" on public.workflows
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "user own" on public.user_settings;
create policy "user own" on public.user_settings
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

## 4. 部署到平台

任意静态托管平台均可部署。

### Vercel

1. Fork 本仓库到你的 GitHub
2. 在 [Vercel](https://vercel.com) 中点击 **Add New → Project** → 选 fork 的仓库
3. 在 **Environment Variables** 添加：
   - `PUBLIC_SUPABASE_URL` → Supabase 项目 URL
   - `PUBLIC_SUPABASE_ANON_KEY` → Supabase anon key
4. 点击 **Deploy**
5. 后续代码推送自动重新部署

### Netlify

1. 在 [Netlify](https://netlify.com) 点击 **Add new site → Import an existing project**
2. 连接你的 GitHub 仓库
3. Build command: `npm run build`
4. Publish directory: `dist`
5. 在 **Environment variables** 添加 `PUBLIC_SUPABASE_URL` 和 `PUBLIC_SUPABASE_ANON_KEY`
6. 点击 **Deploy**

### Cloudflare Pages

1. 在 [Cloudflare Pages](https://pages.cloudflare.com/) 点击 **Create a project → Connect to Git**
2. 选你的 GitHub 仓库
3. Framework preset: **Astro**
4. 在 **Environment variables (advanced)** 添加 `PUBLIC_SUPABASE_URL` 和 `PUBLIC_SUPABASE_ANON_KEY`
5. 点击 **Save and Deploy**

## 5. 完成

重启开发服务器：

```bash
npm run dev
```

打开设置 → 同步面板。如果之前显示"未配置"，现在应该可以看到登录/注册按钮。

点击**注册**创建账号 → **登录** → 自动开始同步。

## 同步原理

- **首次同步**：登录后首次同步会从云端拉取数据覆盖本地，再推送本地数据
- **后续同步**：本地优先，每次数据变更后自动推送本地数据到云端（800ms 防抖）
- **本地优先策略**：登录状态下，本地始终是数据主源，云端跟随本地
- **RLS 隔离**：每个用户只能读写自己的数据，不会互相干扰
- **手动同步**：可在同步面板点击"立即同步"强制执行
- **离线检测**：浏览器离线时自动暂停同步，恢复连接后自动重试

## 常见问题

### 数据安全？别人注册会覆盖我的数据吗？

不会。RLS 策略 `auth.uid() = user_id` 保证了数据完全隔离。每个用户的数据都绑定自己的 `user_id`，无法读写其他人的数据。

### 不配置 Supabase 还能用吗？

能。所有功能（书签、主题、工作流、快捷键）都基于 `localStorage`，只是没有跨设备同步。完全离线可用。

### 清浏览器数据会怎样？

本地数据丢失，但登录后首次同步会从 Supabase 拉回。
