-- PEAK Study Platform — Supabase Schema
-- Run this in your Supabase SQL editor

create extension if not exists "uuid-ossp";

create table if not exists sessions (
  id uuid primary key default uuid_generate_v4(),
  user_id text not null,
  title text not null,
  input_type text not null check (input_type in ('pdf', 'text', 'topic')),
  raw_content text,
  notes jsonb,
  quiz jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists sessions_user_id_idx on sessions(user_id);
create index if not exists sessions_created_at_idx on sessions(created_at desc);

-- RLS: users can only access their own sessions
alter table sessions enable row level security;

create policy "Users can read own sessions"
  on sessions for select
  using (user_id = requesting_user_id());

create policy "Users can insert own sessions"
  on sessions for insert
  with check (user_id = requesting_user_id());

-- Note: For server-side inserts via service role key, RLS is bypassed automatically
