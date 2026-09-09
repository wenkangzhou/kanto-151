-- Run after 003. Existing collections, rewards and progress are preserved.
-- Unselected Pokémon remain in the Pokémon Center; no automatic team selection.
begin;
create table public.kanto_team (
  child_id uuid not null references public.kanto_children(id),
  slot smallint not null check (slot between 1 and 6),
  pokemon_id integer not null,
  primary key(child_id, slot),
  unique(child_id, pokemon_id),
  foreign key(child_id, pokemon_id) references public.kanto_pokemon_collection(child_id, pokemon_id)
);
alter table public.kanto_team enable row level security;
revoke all on public.kanto_team from public, anon, authenticated;
grant all on public.kanto_team to service_role;

create function public.kanto_set_team(p_child_id uuid, p_expected integer[], p_team integer[]) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_team integer[];
begin
  -- All collection/team mutations lock the child first.
  perform 1 from public.kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_team is null or p_expected is null or cardinality(p_team)>6 or cardinality(p_expected)>6
    or coalesce(array_ndims(p_team),1)<>1 or coalesce(array_ndims(p_expected),1)<>1
    or exists(select 1 from unnest(p_team) id where id is null or id not between 1 and 151)
    or (select count(distinct id) from unnest(p_team) id)<>cardinality(p_team)
    then raise exception 'INVALID_INPUT'; end if;
  if exists(select 1 from unnest(p_team) id where not exists(
    select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=id
  )) then raise exception 'TEAM_NOT_COLLECTED'; end if;
  select coalesce(array_agg(pokemon_id order by slot),'{}'::integer[]) into current_team
    from public.kanto_team where child_id=p_child_id;
  -- A retry after a lost response is harmless. A stale device cannot overwrite a newer selection.
  if current_team=p_team then return public.kanto_snapshot(p_child_id); end if;
  if current_team<>p_expected then raise exception 'TEAM_CHANGED'; end if;
  delete from public.kanto_team where child_id=p_child_id;
  insert into public.kanto_team(child_id,slot,pokemon_id)
    select p_child_id, ordinal::smallint, id from unnest(p_team) with ordinality as chosen(id,ordinal);
  return public.kanto_snapshot(p_child_id);
end $$;
revoke all on function public.kanto_set_team(uuid,integer[],integer[]) from public, anon, authenticated;
grant execute on function public.kanto_set_team(uuid,integer[],integer[]) to service_role;

create or replace function public.kanto_snapshot(p_child_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
  'records',coalesce((select jsonb_agg(jsonb_build_object('pokemonId',pokemon_id,'acquiredAt',acquired_at,'reason',reason,'method',method) order by acquired_at,pokemon_id) from public.kanto_pokemon_collection where child_id=p_child_id),'[]'::jsonb),
  'tickets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',type,'reason',reason,'createdAt',created_at) order by created_at) from public.kanto_inventory where child_id=p_child_id and used_at is null),'[]'::jsonb),
  'inventory',jsonb_build_object('evolution',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='evolution' and used_at is null),'legendary',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='legendary' and used_at is null)),
  'source','supabase',
  'team',coalesce((select jsonb_agg(pokemon_id order by slot) from public.kanto_team where child_id=p_child_id),'[]'::jsonb),
  'pendingReceipt',(select to_jsonb(r) from public.kanto_receipts r where r.child_id=p_child_id and r.acknowledged_at is null order by r.created_at limit 1)
 );
$$;

notify pgrst, 'reload schema';
commit;
