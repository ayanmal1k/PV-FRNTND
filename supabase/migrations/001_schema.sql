create extension if not exists "pgcrypto";

do $$ begin
  create type user_role as enum ('USER', 'AGENT', 'AGENCY_ADMIN', 'ADMIN');
exception when duplicate_object then null; end $$;

do $$ begin
  create type listing_purpose as enum ('SALE', 'RENT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_category as enum ('RESIDENTIAL', 'COMMERCIAL', 'PLOT', 'PROJECT');
exception when duplicate_object then null; end $$;

do $$ begin
  create type property_status as enum ('DRAFT', 'PENDING', 'ACTIVE', 'REJECTED', 'SOLD', 'RENTED', 'EXPIRED');
exception when duplicate_object then null; end $$;

do $$ begin
  create type verification_status as enum ('UNVERIFIED', 'PENDING', 'VERIFIED', 'REJECTED');
exception when duplicate_object then null; end $$;

create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  phone text,
  first_name text not null default 'User',
  last_name text not null default '',
  avatar text,
  role user_role not null default 'USER',
  locale text not null default 'en',
  dark_mode boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists cities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  country text not null default 'Pakistan',
  latitude double precision,
  longitude double precision,
  featured boolean not null default false,
  image text,
  created_at timestamptz not null default now()
);

create table if not exists areas (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null,
  city_id uuid not null references cities(id) on delete cascade,
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  unique (city_id, slug)
);

create table if not exists property_types (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  category property_category not null,
  icon text
);

create table if not exists amenities (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  icon text,
  category text
);

create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo text,
  cover_image text,
  description text,
  email text not null,
  phone text not null,
  website text,
  address text,
  city_id uuid references cities(id),
  verified boolean not null default false,
  featured boolean not null default false,
  rating double precision not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  agency_id uuid references agencies(id) on delete set null,
  license_no text,
  bio text,
  languages jsonb not null default '[]'::jsonb,
  whatsapp text,
  verified boolean not null default false,
  featured boolean not null default false,
  rating double precision not null default 0,
  review_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  description text not null,
  purpose listing_purpose not null,
  category property_category not null,
  status property_status not null default 'PENDING',
  verification verification_status not null default 'UNVERIFIED',
  price numeric not null,
  price_per_unit numeric,
  currency text not null default 'PKR',
  rent_period text,
  bedrooms integer,
  bathrooms integer,
  area_size numeric not null,
  area_unit text not null default 'MARLA',
  address text not null,
  latitude double precision not null default 0,
  longitude double precision not null default 0,
  city_id uuid not null references cities(id),
  area_id uuid references areas(id),
  property_type_id uuid not null references property_types(id),
  agency_id uuid references agencies(id),
  agent_id uuid references agents(id),
  featured boolean not null default false,
  trending boolean not null default false,
  views integer not null default 0,
  ai_price_estimate numeric,
  roi_percent numeric,
  virtual_tour_url text,
  video_tour_url text,
  floor_plan_url text,
  furnishing_status text,
  possession_status text,
  built_year integer,
  floors_count integer,
  facing_direction text,
  meta_title text,
  meta_description text,
  published_at timestamptz,
  expires_at timestamptz,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists properties_search_idx on properties using gin (
  to_tsvector('english', title || ' ' || description || ' ' || address)
);
create index if not exists properties_status_idx on properties(status, purpose, category);
create index if not exists properties_city_idx on properties(city_id);

create table if not exists property_images (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  public_id text,
  sort_order integer not null default 0,
  is_primary boolean not null default false
);

create table if not exists property_videos (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  url text not null,
  type text not null default 'tour'
);

create table if not exists property_amenities (
  property_id uuid not null references properties(id) on delete cascade,
  amenity_id uuid not null references amenities(id) on delete cascade,
  primary key (property_id, amenity_id)
);

create table if not exists nearby_places (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references properties(id) on delete cascade,
  name text not null,
  type text not null,
  distance numeric not null,
  unit text not null default 'km'
);

create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text not null,
  developer text,
  city_id uuid references cities(id),
  area_id uuid references areas(id),
  cover_image text,
  images jsonb not null default '[]'::jsonb,
  min_price numeric,
  max_price numeric,
  handover text,
  featured boolean not null default false,
  status text not null default 'ONGOING',
  latitude double precision,
  longitude double precision,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);

create table if not exists saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  filters jsonb not null default '{}'::jsonb,
  alert boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text not null,
  phone text,
  subject text,
  body text not null,
  status text not null default 'NEW',
  whatsapp boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  name text not null,
  email text not null,
  phone text not null default '',
  source text not null default 'inquiry',
  status text not null default 'new',
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  excerpt text,
  content text not null,
  cover_image text,
  published boolean not null default false,
  tags jsonb not null default '[]'::jsonb,
  views integer not null default 0,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists area_guides (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  content text not null,
  city_id uuid references cities(id),
  area_id uuid references areas(id),
  cover_image text,
  avg_price numeric,
  property_count integer not null default 0,
  published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table profiles enable row level security;
alter table cities enable row level security;
alter table areas enable row level security;
alter table property_types enable row level security;
alter table amenities enable row level security;
alter table agencies enable row level security;
alter table agents enable row level security;
alter table properties enable row level security;
alter table property_images enable row level security;
alter table property_videos enable row level security;
alter table property_amenities enable row level security;
alter table nearby_places enable row level security;
alter table projects enable row level security;
alter table favorites enable row level security;
alter table saved_searches enable row level security;
alter table messages enable row level security;
alter table leads enable row level security;
alter table blog_posts enable row level security;
alter table area_guides enable row level security;

create or replace function is_admin()
returns boolean
language sql
stable
as $$
  select coalesce(auth.jwt()->'user_metadata'->>'role', '') = 'ADMIN'
$$;

create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into profiles (id, email, phone, first_name, last_name, role)
  values (
    new.id,
    new.email,
    new.phone,
    coalesce(new.raw_user_meta_data->>'firstName', 'User'),
    coalesce(new.raw_user_meta_data->>'lastName', ''),
    coalesce((new.raw_user_meta_data->>'role')::user_role, 'USER')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function handle_new_user();

create policy "public read cities" on cities for select using (true);
create policy "public read areas" on areas for select using (true);
create policy "public read property types" on property_types for select using (true);
create policy "public read amenities" on amenities for select using (true);
create policy "public read agencies" on agencies for select using (true);
create policy "public read agents" on agents for select using (true);
create policy "public read active properties" on properties for select using (status = 'ACTIVE' or is_admin() or created_by = auth.uid());
create policy "authenticated create properties" on properties for insert with check (auth.uid() = created_by);
create policy "owner or admin update properties" on properties for update using (is_admin() or created_by = auth.uid()) with check (is_admin() or created_by = auth.uid());
create policy "admin delete properties" on properties for delete using (is_admin());
create policy "public read property images" on property_images for select using (true);
create policy "authenticated create property images" on property_images for insert with check (auth.role() = 'authenticated');
create policy "owner or admin update property images" on property_images for update using (auth.role() = 'authenticated');
create policy "owner or admin delete property images" on property_images for delete using (auth.role() = 'authenticated');
create policy "public read property videos" on property_videos for select using (true);
create policy "public read property amenities" on property_amenities for select using (true);
create policy "public read nearby places" on nearby_places for select using (true);
create policy "public read projects" on projects for select using (true);
create policy "public read published blog posts" on blog_posts for select using (published = true or is_admin());
create policy "public read area guides" on area_guides for select using (published = true or is_admin());
create policy "users read own profile" on profiles for select using (id = auth.uid() or is_admin());
create policy "users update own profile" on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy "users read own favorites" on favorites for select using (user_id = auth.uid());
create policy "users create own favorites" on favorites for insert with check (user_id = auth.uid());
create policy "users delete own favorites" on favorites for delete using (user_id = auth.uid());
create policy "users read own saved searches" on saved_searches for select using (user_id = auth.uid());
create policy "public create messages" on messages for insert with check (true);
create policy "user/admin read messages" on messages for select using (user_id = auth.uid() or is_admin());
create policy "public create leads" on leads for insert with check (true);
create policy "admin read leads" on leads for select using (is_admin());
