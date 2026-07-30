-- CrimeWatch ZA — core schema
-- Run this in the Supabase SQL editor (Project > SQL Editor > New query)

create extension if not exists "uuid-ossp";

-- ---------------------------------------------------------------------------
-- Profiles: one row per authenticated user, extends Supabase auth.users
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

-- Auto-create a profile row whenever a new user signs up
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
-- Incidents: the core reporting table. Realtime is enabled on this below.
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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists incidents_created_at_idx on incidents (created_at desc);
create index if not exists incidents_location_idx on incidents (latitude, longitude);

alter table incidents enable row level security;

-- Anyone (including anonymous visitors) can read incident reports
create policy "Incidents are publicly readable"
  on incidents for select using (true);

-- Only authenticated users can submit a report, and only as themselves
create policy "Authenticated users can report incidents"
  on incidents for insert
  with check (auth.uid() = reporter_id or reporter_id is null);

-- Only moderators/admins can update status (verify, resolve, dismiss)
create policy "Moderators can update incident status"
  on incidents for update
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role in ('moderator', 'admin')
    )
  );

-- Keep updated_at current
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

-- ---------------------------------------------------------------------------
-- Realtime: broadcast every insert/update/delete on incidents to subscribers
-- ---------------------------------------------------------------------------
alter publication supabase_realtime add table incidents;
