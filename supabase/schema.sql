-- PFC database foundation. Review and test all policies before production.
create extension if not exists pgcrypto;

create type public.account_status as enum ('active','restricted','suspended','banned');
create type public.app_role as enum ('owner','operator','moderator','player');
create type public.payment_status as enum ('pending','verified','rejected','refunded');
create type public.tournament_status as enum ('draft','open','paused','live','completed','cancelled');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  -- Email/password authentication is managed by Supabase Auth (auth.users).
  -- These fields are completed by the player after email verification.
  phone text unique,
  full_name text,
  username text unique,
  display_name text not null default 'PFC Player',
  avatar_url text,
  status public.account_status not null default 'active',
  status_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null default 'player',
  created_at timestamptz not null default now(),
  unique(user_id, role)
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text,
  description text,
  image_url text,
  active boolean not null default true,
  format text not null,
  winner_method text not null,
  duration_minutes integer not null default 10 check(duration_minutes > 0),
  time_limit_minutes integer not null default 10 check(time_limit_minutes > 0),
  min_players integer not null default 2 check(min_players > 0),
  max_players integer not null default 16 check(max_players >= min_players),
  tie_breaker text,
  rules text not null,
  rules_version integer not null default 1,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.tournaments (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games(id),
  title text not null,
  description text,
  entry_fee numeric(14,2) not null default 0 check(entry_fee >= 0),
  prize_pool numeric(14,2) not null default 0 check(prize_pool >= 0),
  currency char(3) not null default 'UGX',
  min_players integer not null default 2 check(min_players > 0),
  max_players integer not null default 16 check(max_players >= min_players),
  starts_at timestamptz,
  status public.tournament_status not null default 'draft',
  access text not null default 'public' check(access in ('public','invite_only')),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.registrations (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  user_id uuid not null references auth.users(id),
  status text not null default 'pending' check(status in ('pending','confirmed','waitlisted','cancelled','disqualified')),
  created_at timestamptz not null default now(),
  unique(tournament_id,user_id)
);

create table public.payments (
  id uuid primary key default gen_random_uuid(),
  reference_code text unique not null,
  user_id uuid not null references auth.users(id),
  tournament_id uuid not null references public.tournaments(id),
  amount numeric(14,2) not null check(amount >= 0),
  currency char(3) not null default 'UGX',
  status public.payment_status not null default 'pending',
  proof_path text,
  provider_reference text,
  review_note text,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  round_number integer,
  player_one uuid references auth.users(id),
  player_two uuid references auth.users(id),
  scheduled_at timestamptz,
  status text not null default 'scheduled',
  winner_id uuid references auth.users(id),
  created_at timestamptz not null default now()
);

create table public.scores (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid not null references public.tournaments(id),
  match_id uuid references public.matches(id),
  user_id uuid not null references auth.users(id),
  score numeric(16,3),
  evidence_path text,
  status text not null default 'pending' check(status in ('pending','verified','rejected','disputed')),
  submitted_at timestamptz not null default now(),
  verified_by uuid references auth.users(id),
  verified_at timestamptz
);

create table public.support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id),
  subject text not null,
  message text not null,
  status text not null default 'open' check(status in ('open','in_progress','resolved','closed')),
  assigned_to uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id),
  actor_role text,
  action text not null,
  entity_type text,
  entity_id text,
  details jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table public.platform_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default now()
);

create index on public.registrations(tournament_id,status);
create index on public.payments(status,created_at desc);
create index on public.tournaments(status,starts_at);
create index on public.audit_logs(created_at desc);
create index on public.support_tickets(status,created_at desc);

create or replace function public.has_role(allowed public.app_role[])
returns boolean language sql stable security definer set search_path = public
as $$
  select exists(select 1 from public.user_roles ur where ur.user_id = auth.uid() and ur.role = any(allowed));
$$;

create or replace function public.is_operator()
returns boolean language sql stable security definer set search_path = public
as $$
  select public.has_role(array['owner','operator','moderator']::public.app_role[]);
$$;

alter table public.profiles enable row level security;
alter table public.user_roles enable row level security;
alter table public.games enable row level security;
alter table public.tournaments enable row level security;
alter table public.registrations enable row level security;
alter table public.payments enable row level security;
alter table public.matches enable row level security;
alter table public.scores enable row level security;
alter table public.support_tickets enable row level security;
alter table public.audit_logs enable row level security;
alter table public.platform_settings enable row level security;

create policy "profiles readable by self or operators" on public.profiles for select
using (id = auth.uid() or public.is_operator());
create policy "players create own profile" on public.profiles for insert
with check (id = auth.uid());
create policy "players update own basic profile" on public.profiles for update
using (id = auth.uid())
with check (id = auth.uid());
-- Players may edit their own onboarding/profile fields, but not status or moderation fields.
revoke update on public.profiles from authenticated;
grant update(display_name, full_name, username, phone, avatar_url) on public.profiles to authenticated;

create policy "roles readable by self or owner" on public.user_roles for select
using (user_id = auth.uid() or public.has_role(array['owner']::public.app_role[]));
create policy "owner manages roles" on public.user_roles for all
using (public.has_role(array['owner']::public.app_role[]))
with check (public.has_role(array['owner']::public.app_role[]));

create policy "active games visible" on public.games for select
using (active = true or public.is_operator());
create policy "operators manage games" on public.games for all
using (public.is_operator()) with check (public.is_operator());

create policy "published tournaments visible" on public.tournaments for select
using (status <> 'draft' or public.is_operator());
create policy "operators manage tournaments" on public.tournaments for all
using (public.is_operator()) with check (public.is_operator());

create policy "players see own registrations and operators see all" on public.registrations for select
using (user_id = auth.uid() or public.is_operator());
-- Registration creation is performed through the server-side payment-reference RPC.
revoke insert on public.registrations from authenticated;
create policy "operators manage registrations" on public.registrations for update
using (public.is_operator()) with check (public.is_operator());

create policy "payments visible to owner or operators and payer" on public.payments for select
using (user_id = auth.uid() or public.is_operator());
-- Payment rows and unique references are created through the server-side RPC.
revoke insert on public.payments from authenticated;
create policy "operators review payments" on public.payments for update
using (public.is_operator()) with check (public.is_operator());

create policy "matches visible to participants or operators" on public.matches for select
using (player_one=auth.uid() or player_two=auth.uid() or public.is_operator());
create policy "operators manage matches" on public.matches for all
using (public.is_operator()) with check (public.is_operator());

create policy "scores visible to owner or operators and submitter" on public.scores for select
using (user_id=auth.uid() or public.is_operator());
create policy "players submit own scores" on public.scores for insert
with check (user_id=auth.uid());
create policy "operators verify scores" on public.scores for update
using (public.is_operator()) with check (public.is_operator());

create policy "ticket owner or operator reads" on public.support_tickets for select
using (user_id=auth.uid() or public.is_operator());
create policy "players create own tickets" on public.support_tickets for insert
with check (user_id=auth.uid());
create policy "operators update tickets" on public.support_tickets for update
using (public.is_operator()) with check (public.is_operator());

create policy "operators read audit" on public.audit_logs for select
using (public.is_operator());
create policy "authenticated append audit" on public.audit_logs for insert
with check (actor_id=auth.uid());

create policy "operators read settings" on public.platform_settings for select
using (public.is_operator());
create policy "owners manage settings" on public.platform_settings for all
using (public.has_role(array['owner']::public.app_role[]))
with check (public.has_role(array['owner']::public.app_role[]));

-- Create a minimal profile row after email registration. The player completes
-- full_name, username and phone in the in-app onboarding step after verification.
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
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();

-- Moderation RPC: reason required; only owner/operator can change player status.
create or replace function public.operator_set_player_status(target_user_id uuid,new_status public.account_status,action_reason text)
returns void language plpgsql security definer set search_path=public
as $$
begin
  if not public.has_role(array['owner','operator']::public.app_role[]) then raise exception 'Not authorised'; end if;
  if length(trim(coalesce(action_reason,''))) < 5 then raise exception 'A clear reason is required'; end if;
  update public.profiles set status=new_status,status_reason=trim(action_reason),updated_at=now() where id=target_user_id;
  insert into public.audit_logs(actor_id,actor_role,action,entity_type,entity_id,details)
  values(auth.uid(),'operator','player_status_changed','profile',target_user_id::text,jsonb_build_object('status',new_status,'reason',trim(action_reason)));
end;
$$;

-- Create a payment reference on the server, tied to the signed-in user and tournament.
create or replace function public.create_payment_reference(target_tournament_id uuid)
returns public.payments language plpgsql security definer set search_path=public
as $$
declare t public.tournaments; p public.payments; ref text;
begin
  select * into t from public.tournaments where id=target_tournament_id and status='open';
  if not found then raise exception 'Competition is not accepting entries'; end if;
  if not exists(select 1 from public.profiles where id=auth.uid() and status='active') then raise exception 'Account is not active'; end if;
  if (select count(*) from public.registrations where tournament_id=t.id and status in ('pending','confirmed')) >= t.max_players then raise exception 'Competition is full'; end if;
  ref := 'PFC-' || upper(substr(encode(gen_random_bytes(6),'hex'),1,8));
  insert into public.registrations(tournament_id,user_id,status) values(t.id,auth.uid(),'pending')
  on conflict(tournament_id,user_id) do nothing;
  insert into public.payments(reference_code,user_id,tournament_id,amount,currency)
  values(ref,auth.uid(),t.id,t.entry_fee,t.currency) returning * into p;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'payment_reference_created','payment',p.id::text,jsonb_build_object('reference',ref,'amount',t.entry_fee));
  return p;
end;
$$;

create or replace function public.player_attach_payment_proof(target_payment_id uuid,proof_storage_path text)
returns void language plpgsql security definer set search_path=public
as $$
declare p public.payments;
begin
  select * into p from public.payments where id=target_payment_id and user_id=auth.uid() and status='pending' for update;
  if not found then raise exception 'Payment record not found or no longer pending'; end if;
  if split_part(proof_storage_path,'/',1) <> auth.uid()::text then raise exception 'Invalid proof storage path'; end if;
  update public.payments set proof_path=proof_storage_path where id=target_payment_id;
  insert into public.audit_logs(actor_id,action,entity_type,entity_id,details)
  values(auth.uid(),'payment_proof_uploaded','payment',target_payment_id::text,jsonb_build_object('file_path',proof_storage_path));
end;
$$;

create or replace function public.operator_review_payment(target_payment_id uuid,decision public.payment_status,review_note text)
returns void language plpgsql security definer set search_path=public
as $$
declare p public.payments;
begin
  if not public.is_operator() then raise exception 'Not authorised'; end if;
  if decision not in ('verified','rejected') then raise exception 'Invalid review decision'; end if;
  if length(trim(coalesce(review_note,''))) < 5 then raise exception 'A review note is required'; end if;
  select * into p from public.payments where id=target_payment_id for update;
  if not found then raise exception 'Payment not found'; end if;
  update public.payments set status=decision,review_note=trim(review_note),reviewed_by=auth.uid(),reviewed_at=now() where id=target_payment_id;
  if decision='verified' then
    update public.registrations set status='confirmed' where tournament_id=p.tournament_id and user_id=p.user_id;
  end if;
  insert into public.audit_logs(actor_id,actor_role,action,entity_type,entity_id,details)
  values(auth.uid(),'operator','payment_reviewed','payment',target_payment_id::text,jsonb_build_object('decision',decision,'note',trim(review_note)));
end;
$$;

grant execute on function public.operator_set_player_status(uuid,public.account_status,text) to authenticated;
grant execute on function public.create_payment_reference(uuid) to authenticated;
grant execute on function public.operator_review_payment(uuid,public.payment_status,text) to authenticated;
grant execute on function public.player_attach_payment_proof(uuid,text) to authenticated;

-- Private payment proof storage. Create the private bucket `payment-proofs`
-- in Supabase Storage before applying these object policies.
create policy "players upload their own payment proofs"
on storage.objects for insert to authenticated
with check (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "players read their own payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and (storage.foldername(name))[1] = auth.uid()::text
);

create policy "operators read payment proofs"
on storage.objects for select to authenticated
using (
  bucket_id = 'payment-proofs'
  and public.is_operator()
);
