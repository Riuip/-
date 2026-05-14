# Forum

A Reddit-style community forum built with **Next.js 14** (App Router) and
**Supabase** (Postgres + Auth). Zero servers to manage; deploy the frontend to
Vercel and let Supabase host the database, auth, and APIs.

## Features

- Email + password auth (Supabase Auth)
- Communities (like subreddits): `c/<slug>`
- Text or link posts
- Tree-shaped comments with replies
- Up / down votes on posts and comments
- Score and comment-count via Postgres views
- Row Level Security: anyone can read, only authors can write

## Tech stack

| Layer        | Tool                                          |
|--------------|-----------------------------------------------|
| Framework    | Next.js 14 (App Router) + TypeScript          |
| Styling      | Tailwind CSS                                  |
| Backend / DB | Supabase (Postgres, Auth, RLS)                |
| Hosting      | Vercel (frontend) + Supabase (backend)        |

## Setup

### 1. Create a Supabase project

1. Sign up at [supabase.com](https://supabase.com) and create a new project.
2. Open **SQL Editor -> New query**, paste the contents of
   [`supabase/schema.sql`](./supabase/schema.sql) and run it.
3. Open **Project Settings -> API** and copy:
   - `Project URL`
   - `anon` public key
4. (Optional, dev convenience) **Authentication -> Providers -> Email** ->
   disable *Confirm email* so you can sign up without verifying your inbox.

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://<your-project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your anon key>
```

### 3. Install + run

```bash
npm install
npm run dev
```

Open http://localhost:3000

### 4. Try it out

1. Click **Log In** in the top right and create an account.
2. Visit any community URL, e.g. `/c/general` - it's auto-created on first
   visit by a logged-in user.
3. Click **Create Post**, then upvote / comment to your heart's content.

## Deploy

### Frontend on Vercel

1. Push this repo to GitHub.
2. Import the repo at [vercel.com/new](https://vercel.com/new).
3. Add the same two env vars (`NEXT_PUBLIC_SUPABASE_URL`,
   `NEXT_PUBLIC_SUPABASE_ANON_KEY`).
4. Deploy.

### Supabase Auth redirect URLs

After deploying, go to **Supabase -> Authentication -> URL Configuration** and
add your production URL (e.g. `https://your-app.vercel.app`) to:

- *Site URL*
- *Redirect URLs*: add `https://your-app.vercel.app/auth/callback`

## Project structure

```
.
├── supabase/
│   └── schema.sql              # Tables, views, RLS, triggers
└── src/
    ├── middleware.ts
    ├── lib/
    │   ├── supabase/
    │   │   ├── client.ts       # Browser client
    │   │   ├── server.ts       # Server client
    │   │   └── middleware.ts   # Session refresh
    │   └── types.ts
    ├── components/
    │   ├── Navbar.tsx
    │   ├── SignOutButton.tsx
    │   ├── PostCard.tsx
    │   ├── VoteButtons.tsx
    │   ├── CommentForm.tsx
    │   └── CommentThread.tsx
    └── app/
        ├── layout.tsx
        ├── page.tsx                  # Home feed
        ├── globals.css
        ├── auth/callback/route.ts
        ├── login/page.tsx
        ├── c/[slug]/
        │   ├── page.tsx              # Community
        │   └── submit/
        │       ├── page.tsx
        │       └── SubmitForm.tsx
        └── post/[id]/page.tsx        # Post detail + comments
```

## Database model

```
auth.users (Supabase Auth)
   |
   v
profiles (1-1)         communities
   |                       |
   |                       v
   +------< posts <--------+
   |          |
   |          v
   +------< comments <--+ (parent_id self-ref)
   |          |
   v          v
   votes (target = post OR comment, value in {-1, +1})
```

## Roadmap ideas

- Hot / Top sort orders (Reddit's score = log10(score) + age)
- Markdown rendering for posts and comments
- Rate limiting via Supabase Edge Functions
- Image uploads via Supabase Storage
- Realtime updates (Supabase channels) for new comments
- Mod tools (pinning, locking, deleting, banning per community)

## License

MIT
