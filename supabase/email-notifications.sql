-- Tyche transactional email queue.
-- Run this file once in Supabase Dashboard -> SQL Editor.
-- The queue contains only event identifiers; email content is assembled server-side.

create table if not exists public.tyche_email_jobs (
  id uuid primary key default gen_random_uuid(),
  event_type text not null check (event_type in (
    'report_saved',
    'lawyer_offer_received',
    'booking_confirmed',
    'booking_reminder_24h',
    'booking_reminder_1h',
    'booking_cancelled',
    'payment_received',
    'payment_failed'
  )),
  recipient_user_id uuid references public.profiles(id) on delete set null,
  entity_id text not null,
  scheduled_at timestamptz not null default now(),
  status text not null default 'pending' check (status in ('pending','processing','sent','failed')),
  attempts integer not null default 0,
  last_error text,
  sent_at timestamptz,
  created_at timestamptz not null default now(),
  unique (event_type, entity_id, recipient_user_id)
);

create index if not exists tyche_email_jobs_due_idx
  on public.tyche_email_jobs (scheduled_at, created_at)
  where status = 'pending';

alter table public.tyche_email_jobs enable row level security;
-- No client policies: only the server's service-role key can read or change email jobs.

create or replace function public.tyche_queue_email(
  p_event text,
  p_recipient uuid,
  p_entity text,
  p_at timestamptz default now()
) returns void
language plpgsql security definer set search_path = public as $$
begin
  if p_recipient is null or p_entity is null then return; end if;
  insert into public.tyche_email_jobs(event_type, recipient_user_id, entity_id, scheduled_at)
  values (p_event, p_recipient, p_entity, p_at)
  on conflict (event_type, entity_id, recipient_user_id) do nothing;
end;
$$;

-- Notify a client that their report has been saved. The email deliberately contains no report details.
create or replace function public.tyche_report_email_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  perform public.tyche_queue_email('report_saved', new.user_id, new.id, now());
  return new;
end;
$$;
drop trigger if exists tyche_report_email on public.reports;
create trigger tyche_report_email after insert on public.reports
for each row execute function public.tyche_report_email_trigger();

-- Notify the report owner when a lawyer sends an offer.
create or replace function public.tyche_bid_email_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare owner_id uuid;
begin
  if new.status <> 'pending' then return new; end if;
  select r.user_id into owner_id from public.reports r where r.id = new.report_id;
  perform public.tyche_queue_email('lawyer_offer_received', owner_id, new.id::text, now());
  return new;
end;
$$;
drop trigger if exists tyche_bid_email on public.bids;
create trigger tyche_bid_email after insert on public.bids
for each row execute function public.tyche_bid_email_trigger();

-- Notify both participants and queue reminders only when a booking becomes confirmed.
create or replace function public.tyche_booking_email_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  appointment_at timestamptz;
  lawyer_user uuid;
  newly_confirmed boolean := false;
begin
  if tg_op = 'INSERT' then
    newly_confirmed := new.status = 'confirmed';
  elsif tg_op = 'UPDATE' then
    newly_confirmed := new.status = 'confirmed' and old.status is distinct from 'confirmed';
  end if;

  if newly_confirmed then
    select l.user_id into lawyer_user from public.lawyers l where l.id = new.lawyer_id;
    perform public.tyche_queue_email('booking_confirmed', new.client_id, new.id, now());
    perform public.tyche_queue_email('booking_confirmed', lawyer_user, new.id, now());

    -- Interpret stored appointment date/time in Nigeria time.
    appointment_at := ((new.date::text || ' ' || new.time)::timestamp at time zone 'Africa/Lagos');
    if appointment_at > now() + interval '24 hours' then
      perform public.tyche_queue_email('booking_reminder_24h', new.client_id, new.id, appointment_at - interval '24 hours');
      perform public.tyche_queue_email('booking_reminder_24h', lawyer_user, new.id, appointment_at - interval '24 hours');
    end if;
    if appointment_at > now() + interval '1 hour' then
      perform public.tyche_queue_email('booking_reminder_1h', new.client_id, new.id, appointment_at - interval '1 hour');
      perform public.tyche_queue_email('booking_reminder_1h', lawyer_user, new.id, appointment_at - interval '1 hour');
    end if;
  end if;

  if tg_op = 'UPDATE' and new.status = 'cancelled' and old.status is distinct from 'cancelled' then
    select l.user_id into lawyer_user from public.lawyers l where l.id = new.lawyer_id;
    perform public.tyche_queue_email('booking_cancelled', new.client_id, new.id, now());
    perform public.tyche_queue_email('booking_cancelled', lawyer_user, new.id, now());
  end if;
  return new;
end;
$$;
drop trigger if exists tyche_booking_email_insert on public.bookings;
create trigger tyche_booking_email_insert after insert on public.bookings
for each row execute function public.tyche_booking_email_trigger();
drop trigger if exists tyche_booking_email_update on public.bookings;
create trigger tyche_booking_email_update after update of status on public.bookings
for each row execute function public.tyche_booking_email_trigger();

-- Payment receipt is queued only when the payment row actually changes to success.
create or replace function public.tyche_payment_email_trigger()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'success' and old.status is distinct from 'success' then
    perform public.tyche_queue_email('payment_received', new.user_id, new.reference, now());
  elsif new.status = 'failed' and old.status is distinct from 'failed' then
    perform public.tyche_queue_email('payment_failed', new.user_id, new.reference, now());
  end if;
  return new;
end;
$$;
drop trigger if exists tyche_payment_email on public.payments;
create trigger tyche_payment_email after update of status on public.payments
for each row execute function public.tyche_payment_email_trigger();
