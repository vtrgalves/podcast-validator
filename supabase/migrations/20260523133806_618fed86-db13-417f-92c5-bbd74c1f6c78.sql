
create table public.validations (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  description text not null,
  niche text,
  audience text,
  objective text,
  format text,
  attachments jsonb not null default '[]'::jsonb,
  status text not null default 'pending',
  report jsonb,
  score int
);
alter table public.validations enable row level security;
create policy "anyone can insert validations" on public.validations for insert with check (true);
create policy "anyone can read validations" on public.validations for select using (true);
create policy "anyone can update validations" on public.validations for update using (true);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  validation_id uuid references public.validations(id) on delete set null,
  name text not null,
  email text not null,
  whatsapp text,
  message text
);
alter table public.leads enable row level security;
create policy "anyone can insert leads" on public.leads for insert with check (true);

insert into storage.buckets (id, name, public) values ('attachments', 'attachments', false) on conflict do nothing;
create policy "anyone can upload attachments" on storage.objects for insert with check (bucket_id = 'attachments');
create policy "anyone can read attachments" on storage.objects for select using (bucket_id = 'attachments');
