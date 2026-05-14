# Forum

一个 **Reddit 风格**的社区论坛，使用 **Next.js 14**（App Router）+ **Supabase**（Postgres + Auth）构建。无需自建服务器；前端部署到 Vercel，数据库和认证交给 Supabase 托管。

## 功能

- 邮箱 + 密码 注册/登录（Supabase Auth）
- 社区（类似 subreddit）：`c/<slug>`
- 文字帖 / 链接帖
- 树状嵌套评论（支持回复）
- 帖子和评论的 赞/踩 投票
- 通过 Postgres 视图自动聚合分数和评论数
- 行级安全策略（RLS）：所有人可读，仅作者可写

## 技术栈

| 层级 | 技术 |
|------|------|
| 前端框架 | Next.js 14 (App Router) + TypeScript |
| 样式 | Tailwind CSS |
| 后端 / 数据库 | Supabase (Postgres, Auth, RLS) |
| 部署 | Vercel（前端）+ Supabase（后端） |

## 快速开始

### 1. 创建 Supabase 项目

1. 到 [supabase.com](https://supabase.com) 注册并创建一个新项目。
2. 打开 **SQL Editor → New query**，把 [`supabase/schema.sql`](./supabase/schema.sql) 的内容粘贴进去并运行。
3. 打开 **Project Settings → API**，复制：
   - `Project URL`（项目地址）
   - `anon` public key（匿名公钥）
4. （可选，方便本地调试）在 **Authentication → Providers → Email** 里 **关闭「Confirm email」**，这样注册后不用验证邮箱就能直接登录。

### 2. 配置环境变量

```bash
cp .env.local.example .env.local
```

在 `.env.local` 中填入：

```
NEXT_PUBLIC_SUPABASE_URL=https://<你的项目ID>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<你的 anon key>
```

### 3. 安装 + 启动

```bash
npm install
npm run dev
```

打开 http://localhost:3000

### 4. 试玩

1. 点击右上角 **Log In** 注册一个账号。
2. 访问任意社区链接，如 `/c/general` — 登录用户首次访问时会自动创建社区。
3. 点击 **Create Post** 发帖，然后试试点赞和评论。

## 部署到生产

### 前端 → Vercel

1. 将此仓库推送到 GitHub。
2. 在 [vercel.com/new](https://vercel.com/new) 导入该仓库。
3. 添加两个环境变量：`NEXT_PUBLIC_SUPABASE_URL`、`NEXT_PUBLIC_SUPABASE_ANON_KEY`。
4. 点击 Deploy。

### Supabase Auth 回调地址

部署后，到 **Supabase → Authentication → URL Configuration** 添加你的生产域名：

- *Site URL*：`https://your-app.vercel.app`
- *Redirect URLs*：`https://your-app.vercel.app/auth/callback`

## 项目结构

```
.
├── supabase/
│   └── schema.sql              # 建表、视图、RLS、触发器
└── src/
    ├── middleware.ts            # Session 自动刷新
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts       # 浏览器端 client
    │   │   ├── server.ts       # 服务端 client
    │   │   └── middleware.ts   # Session 中间件
    │   └── types.ts            # 数据库类型
    ├── components/
    │   ├── Navbar.tsx           # 顶部导航栏
    │   ├── SignOutButton.tsx    # 退出按钮
    │   ├── PostCard.tsx         # 帖子卡片
    │   ├── VoteButtons.tsx      # 投票按钮
    │   ├── CommentForm.tsx      # 评论输入框
    │   └── CommentThread.tsx    # 树状评论渲染
    └── app/
        ├── layout.tsx
        ├── page.tsx                  # 首页 — 全站最新
        ├── globals.css
        ├── auth/callback/route.ts    # 邮件验证/OAuth 回调
        ├── login/page.tsx            # 登录/注册页
        ├── c/[slug]/
        │   ├── page.tsx              # 社区页
        │   └── submit/
        │       ├── page.tsx          # 发帖页
        │       └── SubmitForm.tsx
        └── post/[id]/page.tsx        # 帖子详情 + 评论
```

## 数据模型

```
auth.users (Supabase 认证)
   |
   v
profiles (1对1)       communities (社区)
   |                       |
   |                       v
   +------< posts <--------+
   |          |
   |          v
   +------< comments <--+ (parent_id 自引用)
   |          |
   v          v
   votes (目标 = 帖子 或 评论, 值 ∈ {-1, +1})
```

## 后续可做

- 🔥 热门 / 最佳排序算法（参考 Reddit 评分公式）
- 📝 Markdown 渲染（帖子和评论）
- 🖼 接入 Supabase Storage 上传图片
- ⚡️ Supabase Realtime 实时推送新评论
- 🛡 版主工具（置顶、锁帖、删帖、封禁）
- 🌐 GitHub / Google 第三方登录

## 许可证

MIT
