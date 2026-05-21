# PEAK — AI Study Platform

> Study smarter. Reach your peak.

PEAK is a full-stack AI-powered study platform built with Next.js, Clerk, Supabase, and the NVIDIA AI API (Llama 3.3 70B). Upload a PDF, paste your notes, or enter any topic — PEAK instantly generates structured notes and a quiz.

---

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Auth**: Clerk
- **Database**: Supabase (Postgres)
- **AI**: NVIDIA API (OpenAI-compatible) — `meta/llama-3.3-70b-instruct`
- **Styling**: Tailwind CSS
- **Deployment**: Vercel

---

## Setup

### 1. Clone and install
```bash
git clone https://github.com/Arsh90120/peak-study
cd peak-study
npm install
```

### 2. Set up Clerk
- Go to [clerk.com](https://clerk.com) and create a new application
- Copy your publishable key and secret key

### 3. Set up Supabase
- Go to [supabase.com](https://supabase.com) and create a new project
- Run the SQL in `supabase/schema.sql` in the Supabase SQL editor
- Copy your project URL, anon key, and service role key

### 4. Set up environment variables
```bash
cp .env.example .env.local
# Fill in all values in .env.local
```

### 5. Run locally
```bash
npm run dev
```

### 6. Deploy to Vercel
```bash
npm install -g vercel
vercel --prod
# Add all environment variables in Vercel dashboard under Settings > Environment Variables
```

Or connect your GitHub repo to Vercel and it deploys automatically on push.

---

## Environment Variables

See `.env.example` for all required variables.

| Variable | Where to get it |
|---|---|
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk dashboard |
| `CLERK_SECRET_KEY` | Clerk dashboard |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project settings |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase project settings |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase project settings |
| `NVIDIA_API_KEY` | [build.nvidia.com](https://build.nvidia.com) |

---

## Project Structure

```
src/
  app/
    page.tsx          # Landing page
    dashboard/        # User dashboard
    upload/           # New session flow
    notes/[id]/       # Notes viewer
    quiz/[id]/        # Quiz page
    api/
      generate/notes/ # AI notes generation
      generate/quiz/  # AI quiz generation
      parse-pdf/      # PDF parsing
      sessions/       # Session CRUD
  components/
    Navbar.tsx
    ThemeProvider.tsx
  lib/
    supabase.ts
    nvidia.ts
supabase/
  schema.sql          # Run this in Supabase SQL editor
```
