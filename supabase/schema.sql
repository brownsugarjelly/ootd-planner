-- Wardrobe Planner — Supabase setup
-- Run this once in your Supabase project: Dashboard -> SQL Editor -> New query -> paste -> Run.
-- Safe to re-run: every statement uses IF NOT EXISTS / OR REPLACE / DROP-then-CREATE for policies.

-- 1. Tables ------------------------------------------------------------

create table if not exists clothing_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null default 'Untitled item',
  category text not null check (category in ('hijab','tops','bottoms','shoes','bag','accessories')),
  garment_type text,
  image_url text not null,
  original_image_url text,
  thumbnail_url text,
  primary_color text not null default '#B8B2A6',
  secondary_color text,
  material text,
  season text not null default 'all-season',
  occasion text[] not null default '{}',
  pattern text not null default 'solid',
  brand text,
  favorite boolean not null default false,
  archived boolean not null default false,
  notes text,
  tags text[] not null default '{}',
  ai_processed boolean not null default false,
  width integer not null default 600,
  height integer not null default 800,
  date_added timestamptz not null default now(),
  last_edited timestamptz not null default now()
);

create table if not exists outfits (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users (id) on delete cascade default auth.uid(),
  name text not null default 'Untitled outfit',
  layers jsonb not null default '{"hijab":[],"tops":[],"bottoms":[],"shoes":[],"bag":[],"accessories":[]}',
  background jsonb not null default '{"type":"solid","color":"#F5F2ED"}',
  thumbnail_url text,
  notes text,
  favorite boolean not null default false,
  date_created timestamptz not null default now(),
  date_edited timestamptz not null default now()
);

create table if not exists user_settings (
  owner_id uuid primary key references auth.users (id) on delete cascade default auth.uid(),
  data jsonb not null default '{}'
);

create index if not exists clothing_items_owner_idx on clothing_items (owner_id);
create index if not exists outfits_owner_idx on outfits (owner_id);

-- 2. Row Level Security -- every user can only ever see/change their own rows ---

alter table clothing_items enable row level security;
alter table outfits enable row level security;
alter table user_settings enable row level security;

drop policy if exists "clothing_items_owner_all" on clothing_items;
create policy "clothing_items_owner_all" on clothing_items
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "outfits_owner_all" on outfits;
create policy "outfits_owner_all" on outfits
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

drop policy if exists "user_settings_owner_all" on user_settings;
create policy "user_settings_owner_all" on user_settings
  for all using (auth.uid() = owner_id) with check (auth.uid() = owner_id);

-- 3. Storage bucket for clothing photos --------------------------------
-- Images are stored under a path like "<user id>/<file name>.png" so the
-- policies below can check that folder name against auth.uid().

insert into storage.buckets (id, name, public)
values ('wardrobe', 'wardrobe', true)
on conflict (id) do nothing;

drop policy if exists "wardrobe_public_read" on storage.objects;
create policy "wardrobe_public_read" on storage.objects
  for select using (bucket_id = 'wardrobe');

drop policy if exists "wardrobe_owner_write" on storage.objects;
create policy "wardrobe_owner_write" on storage.objects
  for insert with check (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "wardrobe_owner_update" on storage.objects;
create policy "wardrobe_owner_update" on storage.objects
  for update using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "wardrobe_owner_delete" on storage.objects;
create policy "wardrobe_owner_delete" on storage.objects
  for delete using (bucket_id = 'wardrobe' and (storage.foldername(name))[1] = auth.uid()::text);

-- Done. Your database and file storage are now ready for the app to use.
