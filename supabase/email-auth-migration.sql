-- Run this only if you already applied the previous phone-auth PFC schema.
-- Safe migration to email/password authentication with post-verification profile setup.
alter table public.profiles alter column phone drop not null;
alter table public.profiles alter column display_name set default 'PFC Player';
alter table public.profiles add column if not exists full_name text;
alter table public.profiles add column if not exists username text;
create unique index if not exists profiles_username_unique on public.profiles(username) where username is not null;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path=public
as $$
begin
  insert into public.profiles(id, display_name)
  values(new.id, coalesce(new.raw_user_meta_data->>'display_name','PFC Player'))
  on conflict(id) do nothing;
  insert into public.user_roles(user_id,role) values(new.id,'player') on conflict do nothing;
  return new;
end;
$$;

-- Permit users to update only their own profile details; moderation fields remain protected.
revoke update on public.profiles from authenticated;
grant update(display_name, full_name, username, phone, avatar_url) on public.profiles to authenticated;
