-- =============================================================================
-- Tyche — Supabase schema, security rules (RLS) and storage policies
--
-- Run this ONCE in Supabase → SQL Editor → New query → paste → Run.
-- It is safe to re-run: everything is created "if not exists" / "or replace".
--
-- Privacy model
--   • Clients own their reports + evidence. Nobody else can read the reports table.
--   • Approved lawyers see shared reports only through the `case_board` view,
--     which never includes the reporter's account id, name, email or phone.
--   • A booked lawyer can also see a report the client attached to that booking.
--   • Bookings + payments are only created by the server (service role), so
--     prices can't be tampered with in the browser.
--   • Admins are profiles with role = 'admin' (set by hand — see bottom).
-- =============================================================================

create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- Tables
-- -----------------------------------------------------------------------------

create table if not exists public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  name        text not null default '',
  email       text,
  phone       text,
  role        text not null default 'client' check (role in ('client', 'lawyer', 'admin')),
  state       text,
  suspended   boolean not null default false,
  created_at  timestamptz not null default now()
);

create table if not exists public.lawyers (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null unique references public.profiles (id) on delete cascade,
  slug                 text not null unique,
  name                 text not null,
  title                text not null default 'Barrister & Solicitor',
  state                text not null default 'Lagos',
  city                 text not null default '',
  year_called          int,
  scn                  text,            -- Supreme Court enrolment number (private)
  nba_branch           text,
  areas                text[] not null default '{}',
  languages            text[] not null default '{English}',
  bio                  text not null default '',
  consult_fee          int not null default 0 check (consult_fee >= 0),
  consult_free         boolean not null default false,
  booking_fee          int not null default 0 check (booking_fee >= 0),
  booking_free         boolean not null default false,
  session_mins         int not null default 30,
  days                 text[] not null default '{Mon,Tue,Wed,Thu,Fri}',
  time_from            text not null default '09:00',
  time_to              text not null default '17:00',
  channels             text[] not null default '{call,chat,meet}',
  meet_link            text,            -- the lawyer's standing Google Meet link
  licence_path         text,            -- storage path in the "licences" bucket (private)
  status               text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  rating               numeric(2,1) not null default 5.0,
  reviews              int not null default 0,
  responds             text not null default 'within a day',
  hue                  int not null default 280,
  subaccount_code      text,            -- Paystack subaccount (private)
  payout_bank          text,
  payout_account_name  text,
  payout_last4         text,
  created_at           timestamptz not null default now()
);

create table if not exists public.reports (
  id                  text primary key default ('TY-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  user_id             uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  alias               text not null,
  category            text not null,
  setting             text not null,
  when_text           text,
  state               text,
  relation            text,
  description         text not null,
  wants               text[] not null default '{}',
  share_with_lawyers  boolean not null default true,
  hide_name           boolean not null default true,
  authorities         text[] not null default '{}',
  hidden              boolean not null default false,  -- set by admins (moderation)
  created_at          timestamptz not null default now()
);

create table if not exists public.evidence (
  id          uuid primary key default gen_random_uuid(),
  report_id   text not null references public.reports (id) on delete cascade,
  user_id     uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  name        text not null,
  kind        text not null check (kind in ('image', 'audio', 'video', 'doc')),
  size        bigint not null default 0,
  path        text not null,   -- "<user_id>/<report_id>/<file>" in the "evidence" bucket
  created_at  timestamptz not null default now()
);

create table if not exists public.bids (
  id          uuid primary key default gen_random_uuid(),
  report_id   text not null references public.reports (id) on delete cascade,
  lawyer_id   uuid not null references public.lawyers (id) on delete cascade,
  kind        text not null check (kind in ('consultation', 'booking')),
  fee         int not null default 0 check (fee >= 0),
  free        boolean not null default false,
  message     text not null,
  status      text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at  timestamptz not null default now(),
  unique (report_id, lawyer_id)
);

create table if not exists public.bookings (
  id                  text primary key default ('BK-' || upper(substr(md5(gen_random_uuid()::text), 1, 6))),
  client_id           uuid not null references public.profiles (id) on delete cascade,
  lawyer_id           uuid not null references public.lawyers (id) on delete cascade,
  client_name         text not null,
  kind                text not null check (kind in ('consultation', 'booking')),
  date                date not null,
  time                text not null,
  channel             text not null check (channel in ('call', 'chat', 'meet')),
  fee                 int not null default 0,
  status              text not null default 'pending_payment'
                        check (status in ('pending_payment', 'confirmed', 'completed', 'cancelled')),
  report_id           text references public.reports (id) on delete set null,
  bid_id              uuid references public.bids (id) on delete set null,
  meet_link           text,
  note                text,            -- client's first message, posted once payment clears
  paystack_reference  text unique,
  paid_at             timestamptz,
  created_at          timestamptz not null default now()
);

create table if not exists public.payments (
  id               uuid primary key default gen_random_uuid(),
  reference        text not null unique,
  purpose          text not null check (purpose in ('booking', 'community')),
  user_id          uuid references public.profiles (id) on delete set null,
  booking_id       text references public.bookings (id) on delete set null,
  amount           int not null,            -- naira
  tyche_share      int not null default 0,  -- naira
  lawyer_share     int not null default 0,  -- naira
  subaccount_code  text,
  status           text not null default 'pending' check (status in ('pending', 'success', 'failed')),
  raw              jsonb,
  created_at       timestamptz not null default now()
);

create table if not exists public.messages (
  id          uuid primary key default gen_random_uuid(),
  booking_id  text not null references public.bookings (id) on delete cascade,
  sender_id   uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  body        text not null check (length(body) between 1 and 4000),
  created_at  timestamptz not null default now()
);

create table if not exists public.community_members (
  user_id     uuid primary key references public.profiles (id) on delete cascade,
  name        text not null,
  phone       text not null,
  state       text,
  heard       text,
  status      text not null default 'pending' check (status in ('pending', 'active', 'expired')),
  reference   text,
  joined_at   timestamptz,
  expires_at  timestamptz,
  created_at  timestamptz not null default now()
);

create table if not exists public.admin_log (
  id     bigserial primary key,
  at     timestamptz not null default now(),
  actor  uuid default auth.uid(),
  text   text not null
);

-- Columns added after first release (safe to re-run)
alter table public.bookings add column if not exists note text;

create index if not exists reports_user_idx        on public.reports (user_id);
create index if not exists reports_open_idx        on public.reports (created_at desc) where share_with_lawyers and not hidden;
create index if not exists evidence_report_idx     on public.evidence (report_id);
create index if not exists bids_report_idx         on public.bids (report_id);
create index if not exists bids_lawyer_idx         on public.bids (lawyer_id);
create index if not exists bookings_client_idx     on public.bookings (client_id);
create index if not exists bookings_lawyer_idx     on public.bookings (lawyer_id, date);
create index if not exists messages_booking_idx    on public.messages (booking_id, created_at);

-- -----------------------------------------------------------------------------
-- Helper functions (security definer = can look past RLS, return only booleans)
-- -----------------------------------------------------------------------------

create or replace function public.is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin' and not suspended);
$$;

create or replace function public.is_suspended() returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select suspended from profiles where id = auth.uid()), false);
$$;

create or replace function public.my_lawyer_id() returns uuid
language sql stable security definer set search_path = public as $$
  select id from lawyers where user_id = auth.uid();
$$;

create or replace function public.is_approved_lawyer() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from lawyers l join profiles p on p.id = l.user_id
    where l.user_id = auth.uid() and l.status = 'approved' and not p.suspended
  );
$$;

create or replace function public.owns_report(rid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from reports where id = rid and user_id = auth.uid());
$$;

-- Open for bids: shared by the client and not hidden by moderators.
create or replace function public.report_is_open(rid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from reports where id = rid and share_with_lawyers and not hidden);
$$;

-- A lawyer may read a report if it's on the case board, or the client attached it to a paid booking with them.
create or replace function public.lawyer_can_view_report(rid text) returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_approved_lawyer() and (
    public.report_is_open(rid)
    or exists (
      select 1 from bookings b
      where b.report_id = rid and b.lawyer_id = public.my_lawyer_id() and b.status in ('confirmed', 'completed')
    )
  );
$$;

create or replace function public.is_booking_participant(bid text) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from bookings b
    where b.id = bid and b.status in ('confirmed', 'completed')
      and (b.client_id = auth.uid() or b.lawyer_id = public.my_lawyer_id())
  );
$$;

-- Public counter for the community page (no personal data).
create or replace function public.community_count() returns int
language sql stable security definer set search_path = public as $$
  select count(*)::int from community_members where status = 'active' and (expires_at is null or expires_at > now());
$$;

-- Which of a lawyer's upcoming slots are taken (dates/times only — no personal data).
create or replace function public.taken_slots(lid uuid) returns table (date date, "time" text)
language sql stable security definer set search_path = public as $$
  select b.date, b.time from bookings b
  where b.lawyer_id = lid and b.date >= current_date
    and (b.status in ('confirmed', 'completed') or (b.status = 'pending_payment' and b.created_at > now() - interval '30 minutes'));
$$;

-- -----------------------------------------------------------------------------
-- Triggers
-- -----------------------------------------------------------------------------

-- Create a profile for every new auth user. Role can only be client or lawyer here.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, name, email, phone, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    new.raw_user_meta_data ->> 'phone',
    case when new.raw_user_meta_data ->> 'role' = 'lawyer' then 'lawyer' else 'client' end
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users may edit their own name/phone/state, never role or suspension.
create or replace function public.guard_profile() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new.role := old.role;
    new.suspended := old.suspended;
    new.email := old.email;
  end if;
  return new;
end $$;
drop trigger if exists guard_profile on public.profiles;
create trigger guard_profile before update on public.profiles for each row execute function public.guard_profile();

-- Lawyers can't approve themselves or change ratings / payout codes.
create or replace function public.guard_lawyer() returns trigger
language plpgsql as $$
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if tg_op = 'INSERT' then
      new.status := 'pending';
      new.rating := 5.0;
      new.reviews := 0;
      new.subaccount_code := null;
      new.payout_bank := null;
      new.payout_account_name := null;
      new.payout_last4 := null;
      new.user_id := auth.uid();
    else
      new.status := old.status;
      new.rating := old.rating;
      new.reviews := old.reviews;
      new.subaccount_code := old.subaccount_code;
      new.payout_bank := old.payout_bank;
      new.payout_account_name := old.payout_account_name;
      new.payout_last4 := old.payout_last4;
      new.user_id := old.user_id;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_lawyer on public.lawyers;
create trigger guard_lawyer before insert or update on public.lawyers for each row execute function public.guard_lawyer();

-- When a lawyer profile is created, mark the account as a lawyer.
create or replace function public.lawyer_role() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  update profiles set role = 'lawyer' where id = new.user_id and role = 'client';
  return new;
end $$;
drop trigger if exists lawyer_role on public.lawyers;
create trigger lawyer_role after insert on public.lawyers for each row execute function public.lawyer_role();

-- Clients may only change a bid's status; lawyers may only edit their own pending offer.
create or replace function public.guard_bid() returns trigger
language plpgsql as $$
declare st text := new.status;
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    if public.owns_report(old.report_id) then
      if st not in ('accepted', 'declined', 'pending') then st := old.status; end if;
      new := old;
      new.status := st;
    else
      -- the lawyer: can edit message/fee while pending, never the status or target
      new.status := old.status;
      new.report_id := old.report_id;
      new.lawyer_id := old.lawyer_id;
      if old.status <> 'pending' then new := old; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_bid on public.bids;
create trigger guard_bid before update on public.bids for each row execute function public.guard_bid();

-- Booking participants may only set the Meet link; lawyers may also mark it completed.
create or replace function public.guard_booking() returns trigger
language plpgsql as $$
declare link text := new.meet_link; st text := new.status;
begin
  if current_user in ('authenticated', 'anon') and not public.is_admin() then
    new := old;
    if old.lawyer_id = public.my_lawyer_id() then
      new.meet_link := link;
      if st = 'completed' and old.status = 'confirmed' then new.status := 'completed'; end if;
    end if;
  end if;
  return new;
end $$;
drop trigger if exists guard_booking on public.bookings;
create trigger guard_booking before update on public.bookings for each row execute function public.guard_booking();

-- -----------------------------------------------------------------------------
-- Row level security
-- -----------------------------------------------------------------------------

alter table public.profiles          enable row level security;
alter table public.lawyers           enable row level security;
alter table public.reports           enable row level security;
alter table public.evidence          enable row level security;
alter table public.bids              enable row level security;
alter table public.bookings          enable row level security;
alter table public.payments          enable row level security;
alter table public.messages          enable row level security;
alter table public.community_members enable row level security;
alter table public.admin_log         enable row level security;

-- profiles
drop policy if exists "profiles: read own or admin" on public.profiles;
create policy "profiles: read own or admin" on public.profiles for select using (id = auth.uid() or public.is_admin());
drop policy if exists "profiles: update own or admin" on public.profiles;
create policy "profiles: update own or admin" on public.profiles for update using (id = auth.uid() or public.is_admin());

-- lawyers (full row: owner + admin; everyone else uses the lawyer_directory view)
drop policy if exists "lawyers: read own or admin" on public.lawyers;
create policy "lawyers: read own or admin" on public.lawyers for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "lawyers: create own" on public.lawyers;
create policy "lawyers: create own" on public.lawyers for insert with check (user_id = auth.uid() and not public.is_suspended());
drop policy if exists "lawyers: update own or admin" on public.lawyers;
create policy "lawyers: update own or admin" on public.lawyers for update using (user_id = auth.uid() or public.is_admin());

-- reports
drop policy if exists "reports: owner or admin read" on public.reports;
create policy "reports: owner or admin read" on public.reports for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reports: owner create" on public.reports;
create policy "reports: owner create" on public.reports for insert with check (user_id = auth.uid() and not public.is_suspended());
drop policy if exists "reports: owner or admin update" on public.reports;
create policy "reports: owner or admin update" on public.reports for update using (user_id = auth.uid() or public.is_admin());
drop policy if exists "reports: owner delete" on public.reports;
create policy "reports: owner delete" on public.reports for delete using (user_id = auth.uid());

-- evidence
drop policy if exists "evidence: owner or admin read" on public.evidence;
create policy "evidence: owner or admin read" on public.evidence for select using (user_id = auth.uid() or public.is_admin());
drop policy if exists "evidence: owner create" on public.evidence;
create policy "evidence: owner create" on public.evidence for insert with check (user_id = auth.uid() and public.owns_report(report_id));
drop policy if exists "evidence: owner delete" on public.evidence;
create policy "evidence: owner delete" on public.evidence for delete using (user_id = auth.uid());

-- bids
drop policy if exists "bids: read" on public.bids;
create policy "bids: read" on public.bids for select
  using (lawyer_id = public.my_lawyer_id() or public.owns_report(report_id) or public.is_admin());
drop policy if exists "bids: approved lawyers create" on public.bids;
create policy "bids: approved lawyers create" on public.bids for insert
  with check (public.is_approved_lawyer() and lawyer_id = public.my_lawyer_id() and public.report_is_open(report_id) and status = 'pending');
drop policy if exists "bids: update" on public.bids;
create policy "bids: update" on public.bids for update
  using (lawyer_id = public.my_lawyer_id() or public.owns_report(report_id) or public.is_admin());

-- bookings (inserts only via the server)
drop policy if exists "bookings: participants read" on public.bookings;
create policy "bookings: participants read" on public.bookings for select
  using (client_id = auth.uid() or lawyer_id = public.my_lawyer_id() or public.is_admin());
drop policy if exists "bookings: participants update" on public.bookings;
create policy "bookings: participants update" on public.bookings for update
  using (lawyer_id = public.my_lawyer_id() or public.is_admin());

-- payments (server writes; users read their own)
drop policy if exists "payments: own or admin" on public.payments;
create policy "payments: own or admin" on public.payments for select using (user_id = auth.uid() or public.is_admin());

-- messages
drop policy if exists "messages: participants read" on public.messages;
create policy "messages: participants read" on public.messages for select
  using (public.is_booking_participant(booking_id) or public.is_admin());
drop policy if exists "messages: participants send" on public.messages;
create policy "messages: participants send" on public.messages for insert
  with check (sender_id = auth.uid() and public.is_booking_participant(booking_id) and not public.is_suspended());

-- community (server writes)
drop policy if exists "community: own or admin" on public.community_members;
create policy "community: own or admin" on public.community_members for select using (user_id = auth.uid() or public.is_admin());

-- admin log
drop policy if exists "admin_log: admin" on public.admin_log;
create policy "admin_log: admin" on public.admin_log for all using (public.is_admin()) with check (public.is_admin());

-- -----------------------------------------------------------------------------
-- Safe views (run as the view owner, filtered + column-limited)
-- -----------------------------------------------------------------------------

-- Approved lawyers, public fields only. Readable by everyone, including logged-out visitors.
create or replace view public.lawyer_directory as
  select l.id, l.slug, l.name, l.title, l.state, l.city, l.year_called, l.areas, l.languages, l.bio,
         l.consult_fee, l.consult_free, l.booking_fee, l.booking_free, l.session_mins, l.days,
         l.time_from, l.time_to, l.channels, l.rating, l.reviews, l.responds, l.hue,
         (l.subaccount_code is not null) as payout_ready
  from public.lawyers l
  join public.profiles p on p.id = l.user_id
  where l.status = 'approved' and not p.suspended;

-- Anonymised case board for approved lawyers. Never exposes who filed the report.
create or replace view public.case_board as
  select r.id, r.created_at, r.alias, r.category, r.setting, r.when_text, r.state, r.relation,
         r.description, r.wants, r.authorities, r.share_with_lawyers
  from public.reports r
  where public.lawyer_can_view_report(r.id);

create or replace view public.case_evidence as
  select e.id, e.report_id, e.name, e.kind, e.size, e.path
  from public.evidence e
  where public.lawyer_can_view_report(e.report_id);

revoke all on public.lawyer_directory, public.case_board, public.case_evidence from anon, authenticated;
grant select on public.lawyer_directory to anon, authenticated;
grant select on public.case_board, public.case_evidence to authenticated;
grant execute on function public.community_count() to anon, authenticated;
grant execute on function public.taken_slots(uuid) to anon, authenticated;

-- -----------------------------------------------------------------------------
-- Storage buckets + policies
-- -----------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values ('evidence', 'evidence', false) on conflict (id) do nothing;
insert into storage.buckets (id, name, public) values ('licences', 'licences', false) on conflict (id) do nothing;

drop policy if exists "evidence files: owner upload" on storage.objects;
create policy "evidence files: owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "evidence files: read" on storage.objects;
create policy "evidence files: read" on storage.objects for select to authenticated
  using (
    bucket_id = 'evidence' and (
      (storage.foldername(name))[1] = auth.uid()::text
      or public.lawyer_can_view_report((storage.foldername(name))[2])
      or public.is_admin()
    )
  );

drop policy if exists "evidence files: owner delete" on storage.objects;
create policy "evidence files: owner delete" on storage.objects for delete to authenticated
  using (bucket_id = 'evidence' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "licence files: owner upload" on storage.objects;
create policy "licence files: owner upload" on storage.objects for insert to authenticated
  with check (bucket_id = 'licences' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "licence files: owner or admin read" on storage.objects;
create policy "licence files: owner or admin read" on storage.objects for select to authenticated
  using (bucket_id = 'licences' and ((storage.foldername(name))[1] = auth.uid()::text or public.is_admin()));

-- -----------------------------------------------------------------------------
-- Realtime (live messages + incoming offers)
-- -----------------------------------------------------------------------------

do $$
begin
  begin alter publication supabase_realtime add table public.messages; exception when others then null; end;
  begin alter publication supabase_realtime add table public.bids; exception when others then null; end;
  begin alter publication supabase_realtime add table public.bookings; exception when others then null; end;
end $$;

-- =============================================================================
-- Make yourself an admin (run AFTER you've signed up on the site with this email):
--
--   update public.profiles set role = 'admin' where email = 'you@example.com';
-- =============================================================================
