-- Create user_profiles table
create table if not exists public.user_profiles (
  id uuid primary key references auth.users(id),
  email text not null,
  display_name text,
  user_role text,
  worker_db_name text,
  instance_count integer default 0,
  one_note_details jsonb,
  neo4j_user_node jsonb,
  tldraw_preferences jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()),
  updated_at timestamp with time zone default timezone('utc'::text, now())
);

-- Set up RLS policies
alter table public.user_profiles enable row level security;

-- Allow users to read their own profile
create policy "Users can read own profile"
  on public.user_profiles for select
  using (auth.uid() = id);

-- Allow users to insert their own profile
create policy "Users can insert own profile"
  on public.user_profiles for insert
  with check (auth.uid() = id);

-- Allow users to update their own profile
create policy "Users can update own profile"
  on public.user_profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Grant necessary permissions
grant usage on schema public to postgres, anon, authenticated, service_role;
grant all privileges on public.user_profiles to postgres, service_role;
grant select, insert, update on public.user_profiles to authenticated; 