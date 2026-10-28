-- Car Rescue BD: shared mechanic wallet + service payment ledger
-- Deploy this migration to make wallet/commission settlement shared across devices.

create extension if not exists pgcrypto;

create table if not exists public.mechanic_wallets (
  mechanic_id text primary key,
  balance numeric(12,2) not null default 1000,
  updated_at timestamptz not null default now()
);

create table if not exists public.service_payment_ledger (
  id uuid primary key default gen_random_uuid(),
  request_id text not null unique,
  mechanic_id text not null,
  amount numeric(12,2) not null,
  commission numeric(12,2) not null,
  payment_method text not null check (payment_method in ('bkash', 'nagad', 'card', 'cash')),
  wallet_deducted numeric(12,2) not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists service_payment_ledger_mechanic_idx
  on public.service_payment_ledger(mechanic_id, created_at desc);

alter table public.mechanic_wallets enable row level security;
alter table public.service_payment_ledger enable row level security;

drop policy if exists mechanic_wallets_select_own on public.mechanic_wallets;
create policy mechanic_wallets_select_own
  on public.mechanic_wallets
  for select
  to authenticated
  using (mechanic_id = auth.uid()::text);

drop policy if exists payment_ledger_select_own on public.service_payment_ledger;
create policy payment_ledger_select_own
  on public.service_payment_ledger
  for select
  to authenticated
  using (mechanic_id = auth.uid()::text);

create or replace function public.get_mechanic_wallet(p_mechanic_id text)
returns table (mechanic_id text, balance numeric, blocked boolean)
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_mechanic_id is null or length(trim(p_mechanic_id)) = 0 then
    raise exception 'mechanic_id is required';
  end if;

  insert into public.mechanic_wallets (mechanic_id, balance)
  values (p_mechanic_id, 1000)
  on conflict (mechanic_id) do nothing;

  return query
  select mw.mechanic_id,
         mw.balance,
         (mw.balance <= 100)::boolean as blocked
  from public.mechanic_wallets mw
  where mw.mechanic_id = p_mechanic_id;
end;
$$;

create or replace function public.recharge_mechanic_wallet(p_mechanic_id text, p_amount numeric)
returns table (mechanic_id text, balance numeric, blocked boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  next_balance numeric(12,2);
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if auth.uid()::text <> p_mechanic_id then
    raise exception 'You may only recharge your own mechanic wallet';
  end if;

  if p_amount is null or p_amount <= 0 then
    raise exception 'Recharge amount must be greater than 0';
  end if;

  insert into public.mechanic_wallets (mechanic_id, balance)
  values (p_mechanic_id, 1000)
  on conflict (mechanic_id) do nothing;

  update public.mechanic_wallets
  set balance = balance + round(p_amount, 2), updated_at = now()
  where mechanic_wallets.mechanic_id = p_mechanic_id
  returning balance into next_balance;

  return query
  select p_mechanic_id,
         next_balance,
         (next_balance <= 100)::boolean;
end;
$$;

create or replace function public.record_service_payment(
  p_request_id text,
  p_mechanic_id text,
  p_total_amount numeric,
  p_payment_method text,
  p_commission_rate numeric default 0.10
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  existing public.service_payment_ledger%rowtype;
  current_wallet numeric(12,2);
  total_amount numeric(12,2);
  commission numeric(12,2);
  wallet_deducted numeric(12,2) := 0;
  wallet_after numeric(12,2);
  mechanic_earning numeric(12,2);
  already_recorded boolean := false;
begin
  if auth.uid() is null then
    raise exception 'Authentication required';
  end if;

  if p_request_id is null or length(trim(p_request_id)) = 0 then
    raise exception 'request_id is required';
  end if;

  if p_mechanic_id is null or length(trim(p_mechanic_id)) = 0 then
    raise exception 'mechanic_id is required';
  end if;

  if p_total_amount is null or p_total_amount <= 0 then
    raise exception 'Invalid service bill amount';
  end if;

  if p_payment_method not in ('bkash', 'nagad', 'card', 'cash') then
    raise exception 'Unsupported payment method';
  end if;

  total_amount := round(p_total_amount, 2);
  commission := round(total_amount * greatest(0, coalesce(p_commission_rate, 0.10)), 2);
  mechanic_earning := greatest(0, total_amount - commission);

  select * into existing
  from public.service_payment_ledger
  where request_id = p_request_id
  limit 1;

  if found then
    already_recorded := true;
    select mw.balance into wallet_after
    from public.mechanic_wallets mw
    where mw.mechanic_id = existing.mechanic_id;

    return jsonb_build_object(
      'success', true,
      'already_recorded', true,
      'total_amount', existing.amount,
      'commission', existing.commission,
      'mechanic_earning', greatest(0, existing.amount - existing.commission),
      'wallet_deducted', existing.wallet_deducted,
      'wallet_balance_after', coalesce(wallet_after, 1000),
      'payment_method', existing.payment_method
    );
  end if;

  insert into public.mechanic_wallets (mechanic_id, balance)
  values (p_mechanic_id, 1000)
  on conflict (mechanic_id) do nothing;

  select mw.balance into current_wallet
  from public.mechanic_wallets mw
  where mw.mechanic_id = p_mechanic_id
  for update;

  wallet_after := current_wallet;

  if p_payment_method = 'cash' then
    if current_wallet <= 100 then
      raise exception 'Mechanic wallet is blocked at ৳%. Recharge above ৳100.', current_wallet;
    end if;

    if current_wallet < commission then
      raise exception 'Mechanic wallet ৳% cannot cover platform fee ৳%.', current_wallet, commission;
    end if;

    wallet_deducted := commission;
    wallet_after := round(current_wallet - commission, 2);

    update public.mechanic_wallets
    set balance = wallet_after, updated_at = now()
    where mechanic_wallets.mechanic_id = p_mechanic_id;
  end if;

  insert into public.service_payment_ledger (
    request_id,
    mechanic_id,
    amount,
    commission,
    payment_method,
    wallet_deducted
  ) values (
    p_request_id,
    p_mechanic_id,
    total_amount,
    commission,
    p_payment_method,
    wallet_deducted
  );

  return jsonb_build_object(
    'success', true,
    'already_recorded', already_recorded,
    'total_amount', total_amount,
    'commission', commission,
    'mechanic_earning', mechanic_earning,
    'wallet_deducted', wallet_deducted,
    'wallet_balance_after', wallet_after,
    'payment_method', p_payment_method
  );
end;
$$;

grant execute on function public.get_mechanic_wallet(text) to authenticated;
grant execute on function public.recharge_mechanic_wallet(text, numeric) to authenticated;
grant execute on function public.record_service_payment(text, text, numeric, text, numeric) to authenticated;
