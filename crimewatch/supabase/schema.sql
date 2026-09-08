-- CrimeWatch ZA — core schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role text not null default 'resident' check (role in ('resident', 'moderator', 'admin')),
  suburb text,
  created_at timestamptz not null default now()
);

alter table profiles enable row level security;

create policy "Profiles are viewable by everyone"
  on profiles for select using (true);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, new.raw_user_meta_data ->> 'full_name');
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- ---------------------------------------------------------------------------
-- Incidents
-- ---------------------------------------------------------------------------
create table if not exists incidents (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  description text not null,
  category text not null check (category in (
    'hijacking', 'burglary', 'theft', 'assault', 'robbery',
    'vandalism', 'suspicious_activity', 'other'
  )),
  severity text not null check (severity in ('low', 'medium', 'high')),
  status text not null default 'reported' check (status in (
    'reported', 'verified', 'resolved', 'false_report'
  )),
  latitude double precision not null,
  longitude double precision not null,
  address text,
  reporter_id uuid references auth.users(id) on delete set null,
  verified_by uuid references auth.users(id) on delete set null,
  media_urls text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx on incidents (created_at desc);
create index if not exists incidents_location_idx on incidents (latitude, longitude);

alter table incidents enable row level security;

create policy "Incidents are publicly readable"
  on incidents for select using (true);

create policy "Authenticated users can report incidents"
  on incidents for insert
  with check (auth.uid() = reporter_id or reporter_id is null);

create policy "Moderators can update incident status"
  on incidents for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('moderator', 'admin')
    )
  );

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists incidents_set_updated_at on incidents;
create trigger incidents_set_updated_at
  before update on incidents
  for each row execute procedure set_updated_at();

-- If you already ran this schema before media_urls existed:
--   alter table incidents add column if not exists media_urls text[] not null default '{}';

alter publication supabase_realtime add table incidents;

-- ---------------------------------------------------------------------------
-- Storage: evidence photos/videos attached to a report
-- ---------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'incident-media', 'incident-media', true, 15728640,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/quicktime']
)
on conflict (id) do nothing;

create policy "Incident media is publicly readable"
  on storage.objects for select
  using (bucket_id = 'incident-media');

create policy "Anyone can upload incident media"
  on storage.objects for insert
  with check (bucket_id = 'incident-media');

-- ---------------------------------------------------------------------------
-- Articles: true-crime content section (Brooklyn's part)
-- ---------------------------------------------------------------------------
create table if not exists articles (
  id uuid primary key default uuid_generate_v4(),
  title text not null,
  slug text not null unique,
  body text not null,
  cover_image_url text,
  published boolean not null default false,
  author_id uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists articles_published_idx on articles (published, created_at desc);

alter table articles enable row level security;

-- Published articles are public; unpublished drafts are only visible to
-- their author and to moderators/admins (so drafts can be reviewed)
create policy "Published articles are publicly readable"
  on articles for select
  using (
    published = true
    or auth.uid() = author_id
    or exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('moderator', 'admin')
    )
  );

-- Only moderators/admins can write articles (matches RequireModerator gate
-- on the /articles/new route in the app)
create policy "Moderators can create articles"
  on articles for insert
  with check (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('moderator', 'admin')
    )
  );

create policy "Moderators can update articles"
  on articles for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('moderator', 'admin')
    )
  );

drop trigger if exists articles_set_updated_at on articles;
create trigger articles_set_updated_at
  before update on articles
  for each row execute procedure set_updated_at();

-- ---------------------------------------------------------------------------
-- Alerts (Phase 3) — decided: 2km radius, all severities, push + SMS,
-- opt-in only. These are the profile columns the frontend (AlertSettings.tsx)
-- reads/writes. Brooklyn: your Edge Function trigger, VAPID keys, and SMS
-- provider wiring go below this, in their own section once built.
-- ---------------------------------------------------------------------------
alter table profiles add column if not exists watch_lat double precision;
alter table profiles add column if not exists watch_lng double precision;
alter table profiles add column if not exists alerts_enabled boolean not null default false;
alter table profiles add column if not exists push_subscription jsonb;

-- Users can only see/edit their own watch area, consent, and subscription —
-- covered by the existing "Users can update their own profile" policy above,
-- since it applies to all columns on the row. No new policy needed.
