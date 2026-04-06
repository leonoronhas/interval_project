create extension if not exists "uuid-ossp";

create table public.customers (
  id          uuid primary key default uuid_generate_v4(),
  account_id  text unique not null,
  full_name   text not null,
  email       text not null,
  phone       text,
  plan        text not null,
  amount_due  numeric(10,2) not null,
  due_date    date not null,
  status      text not null default 'pending',
  created_at  timestamptz default now()
);

create table public.outreach_log (
  id              uuid primary key default uuid_generate_v4(),
  customer_id     uuid references public.customers(id) on delete cascade,
  type            text not null,
  mode            text not null,
  generated_text  text not null,
  verified        boolean default false,
  violations      jsonb,
  created_by      uuid references auth.users(id),
  created_at      timestamptz default now()
);

alter table public.customers enable row level security;
alter table public.outreach_log enable row level security;

create policy "Authenticated users can view customers"
  on public.customers for select to authenticated using (true);

create policy "Authenticated users can view outreach log"
  on public.outreach_log for select to authenticated using (true);

create policy "Authenticated users can insert outreach log"
  on public.outreach_log for insert to authenticated with check (auth.uid() = created_by);

insert into public.customers (account_id, full_name, email, phone, plan, amount_due, due_date, status) values
  ('ACC-1001', 'Sarah Chen',     'sarah.chen@email.com',    '(801) 555-0142', 'Premium Annual',    189.00, '2026-04-10', 'pending'),
  ('ACC-1002', 'James Okafor',   'james.okafor@email.com',  '(801) 555-0287', 'Basic Monthly',      29.99, '2026-03-28', 'pending'),
  ('ACC-1003', 'Maria Santos',   'maria.santos@email.com',  '(801) 555-0364', 'Standard Monthly',   79.50, '2026-04-01', 'contacted'),
  ('ACC-1004', 'Derek Williams', 'derek.w@email.com',       '(801) 555-0491', 'Premium Monthly',   149.99, '2026-04-15', 'pending'),
  ('ACC-1005', 'Priya Nambiar',  'priya.n@email.com',       '(801) 555-0523', 'Basic Annual',       59.00, '2026-03-22', 'pending'),
  ('ACC-1006', 'Tom Kowalski',   'tom.k@email.com',         '(801) 555-0618', 'Enterprise',        499.00, '2026-04-20', 'resolved'),
  ('ACC-1007', 'Angela Reeves',  'angela.r@email.com',      '(801) 555-0734', 'Standard Monthly',   79.50, '2026-04-05', 'pending'),
  ('ACC-1008', 'Liang Zhou',     'liang.z@email.com',       '(801) 555-0856', 'Basic Monthly',      29.99, '2026-03-30', 'contacted');
