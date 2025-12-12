-- Create trigger to send confirmation email on auth signup
create or replace function public.handle_new_user_signup()
returns void as $$
begin
  -- Call the Edge Function to send confirmation email
  -- This will be triggered when a new user signs up
  null;
end;
$$ language plpgsql security definer;

-- Create table to track sent emails (optional, for logging)
create table if not exists public.email_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  email text,
  type text,
  sent_at timestamp default now()
);

-- Grant permissions
alter table public.email_logs enable row level security;

create policy "Users can view own email logs"
  on public.email_logs for select
  using (auth.uid() = user_id);
