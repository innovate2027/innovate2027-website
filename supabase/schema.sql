-- INNOVATE 2027 team-event registration schema. Run in Supabase SQL Editor.
create extension if not exists pgcrypto;
create table if not exists public.registrations (
 id uuid primary key default gen_random_uuid(),
 registration_code text unique not null,
 team_name text not null,
 team_leader_name text not null,
 team_leader_email text not null,
 team_leader_phone text not null,
 team_leader_index integer not null default 0,
 participant_type text not null check (participant_type in ('Student','Faculty','Startup','Industry')),
 institution text not null,
 department text,
 event_interest text not null check (event_interest in ('Innovation Challenge Hackathon','Idea Pitch','Project Expo','Student Startup Showcase')),
 team_members jsonb not null check (jsonb_typeof(team_members)='array' and jsonb_array_length(team_members) between 1 and 3),
 submission_file_path text,
 amount_paise integer not null default 30000 check (amount_paise=30000),
 currency text not null default 'INR',
 payment_status text not null default 'pending' check (payment_status in ('pending','paid','failed','refunded')),
 razorpay_order_id text unique,
 razorpay_payment_id text unique,
 attendance_verified boolean not null default false,
 created_at timestamptz not null default now(),
 paid_at timestamptz,
 constraint event_submission_required check (
  (event_interest='Innovation Challenge Hackathon' and submission_file_path is null) or
  (event_interest in ('Idea Pitch','Project Expo','Student Startup Showcase') and submission_file_path is not null)
 )
);
create index if not exists registrations_created_at_idx on public.registrations(created_at desc);
create index if not exists registrations_payment_status_idx on public.registrations(payment_status);
create index if not exists registrations_email_idx on public.registrations(lower(team_leader_email));
alter table public.registrations enable row level security;
revoke all on public.registrations from anon, authenticated;

-- Create a PRIVATE Storage bucket for participant uploads (5 MB limit).
insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('event-submissions','event-submissions',false,5242880,array[
 'application/vnd.ms-powerpoint',
 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
 'application/pdf'
]) on conflict (id) do update set public=false,file_size_limit=5242880,allowed_mime_types=excluded.allowed_mime_types;
-- Server routes use the Supabase service-role key. Never expose that key in browser code.
