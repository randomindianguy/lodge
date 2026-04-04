-- Lodge MVP Supabase Schema
-- Run this in Supabase SQL Editor

-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- Lodges table
create table lodges (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  type text not null check (type in ('keep', 'build')),
  cadence text not null check (cadence in ('weekly', 'biweekly', 'monthly')),
  preferences text[] default '{}',
  keeper_name text not null,
  keeper_phone text not null,
  keeper_timezone text not null default 'America/New_York',
  created_at timestamptz default now()
);

-- Members table
create table members (
  id uuid default uuid_generate_v4() primary key,
  lodge_id uuid references lodges(id) on delete cascade,
  name text not null,
  phone text not null,
  timezone text not null default 'America/New_York',
  created_at timestamptz default now()
);

-- Gatherings table
create table gatherings (
  id uuid default uuid_generate_v4() primary key,
  lodge_id uuid references lodges(id) on delete cascade,
  activity text not null,
  reasoning text not null,
  details text,
  alternatives text[] default '{}',
  scheduled_at timestamptz,
  status text not null default 'draft' check (status in ('draft', 'invited', 'completed')),
  rating integer check (rating in (1, -1)),
  feedback text,
  created_at timestamptz default now()
);

-- RSVPs table
create table rsvps (
  id uuid default uuid_generate_v4() primary key,
  gathering_id uuid references gatherings(id) on delete cascade,
  member_id uuid references members(id) on delete cascade,
  response text not null default 'pending' check (response in ('yes', 'no', 'pending')),
  responded_at timestamptz,
  unique(gathering_id, member_id)
);

-- Ritual Blueprints table (Build mode)
create table ritual_blueprints (
  id uuid default uuid_generate_v4() primary key,
  lodge_id uuid references lodges(id) on delete cascade,
  routine text not null,
  city text not null,
  day_time text not null,
  group_size integer not null default 2,
  framing_copy text not null,
  session_scaffolding text[] default '{}',
  created_at timestamptz default now()
);

-- Join requests for Build mode shareable links
create table join_requests (
  id uuid default uuid_generate_v4() primary key,
  lodge_id uuid references lodges(id) on delete cascade,
  name text not null,
  phone text not null,
  status text not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  created_at timestamptz default now()
);

-- Indexes
create index idx_members_lodge on members(lodge_id);
create index idx_members_phone on members(phone);
create index idx_gatherings_lodge on gatherings(lodge_id);
create index idx_rsvps_gathering on rsvps(gathering_id);
create index idx_rsvps_member on rsvps(member_id);
create index idx_ritual_blueprints_lodge on ritual_blueprints(lodge_id);
create index idx_join_requests_lodge on join_requests(lodge_id);

-- Enable RLS (Row Level Security) - permissive for MVP
alter table lodges enable row level security;
alter table members enable row level security;
alter table gatherings enable row level security;
alter table rsvps enable row level security;
alter table ritual_blueprints enable row level security;
alter table join_requests enable row level security;

-- Permissive policies for MVP (no auth - demo mode)
create policy "Allow all on lodges" on lodges for all using (true) with check (true);
create policy "Allow all on members" on members for all using (true) with check (true);
create policy "Allow all on gatherings" on gatherings for all using (true) with check (true);
create policy "Allow all on rsvps" on rsvps for all using (true) with check (true);
create policy "Allow all on ritual_blueprints" on ritual_blueprints for all using (true) with check (true);
create policy "Allow all on join_requests" on join_requests for all using (true) with check (true);
