-- One private MVP workspace per signed-in owner. Properties and Loans are
-- stored together so payments and their invoice IDs are saved atomically.
create table if not exists public.business_workspaces (
  owner_id uuid primary key references auth.users(id) on delete cascade,
  data jsonb not null,
  revision integer not null default 1 check (revision > 0),
  updated_at timestamptz not null default now(),
  constraint workspace_shape check (
    data->>'version' = '1'
    and jsonb_typeof(data->'rooms') = 'array'
    and jsonb_typeof(data->'tenants') = 'array'
    and jsonb_typeof(data->'payments') = 'array'
    and jsonb_typeof(data->'maintenance') = 'array'
    and jsonb_typeof(data->'complaints') = 'array'
    and jsonb_typeof(data->'clients') = 'array'
    and jsonb_typeof(data->'loans') = 'array'
    and jsonb_typeof(data->'repayments') = 'array'
    and jsonb_typeof(data->'settings') = 'object'
    and data ?& array['version','rooms','tenants','payments','maintenance','complaints','clients','loans','repayments','settings']
  )
);
alter table public.business_workspaces enable row level security;
revoke all on public.business_workspaces from anon;
grant select, insert, update on public.business_workspaces to authenticated;
drop policy if exists "Owners can read their workspace" on public.business_workspaces;
create policy "Owners can read their workspace" on public.business_workspaces for select to authenticated using ((select auth.uid()) = owner_id);
drop policy if exists "Owners can create their workspace" on public.business_workspaces;
create policy "Owners can create their workspace" on public.business_workspaces for insert to authenticated with check ((select auth.uid()) = owner_id);
drop policy if exists "Owners can update their workspace" on public.business_workspaces;
create policy "Owners can update their workspace" on public.business_workspaces for update to authenticated using ((select auth.uid()) = owner_id) with check ((select auth.uid()) = owner_id);

-- Compare revisions so an old tab cannot silently overwrite newer records.
create or replace function public.save_business_workspace(expected_revision integer, next_data jsonb)
returns table(revision integer, updated_at timestamptz)
language plpgsql security invoker set search_path = public
as $$
declare
  current_owner uuid := auth.uid();
  changed integer;
begin
  if current_owner is null then raise exception 'Sign in to save live records.' using errcode = '42501'; end if;
  if expected_revision = 0 then
    return query insert into public.business_workspaces as w (owner_id, data, revision)
      values (current_owner, next_data, 1)
      on conflict (owner_id) do nothing
      returning w.revision, w.updated_at;
  else
    return query update public.business_workspaces as w
      set data = next_data, revision = w.revision + 1, updated_at = now()
      where w.owner_id = current_owner and w.revision = expected_revision
      returning w.revision, w.updated_at;
  end if;
  get diagnostics changed = row_count;
  if changed = 0 then raise exception 'This workspace changed in another tab. Reload live records and try again.' using errcode = '40001'; end if;
end;
$$;
revoke all on function public.save_business_workspace(integer, jsonb) from public, anon;
grant execute on function public.save_business_workspace(integer, jsonb) to authenticated;
