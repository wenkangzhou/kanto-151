-- Apply after 001 and 002, before deploying the anime-route application.
-- Collection, tickets, reward codes and receipt results are preserved.
begin;
alter table public.kanto_receipts add column route_version text not null default 'game-v1'
  check (route_version in ('game-v1','anime-v1'));
alter table public.kanto_receipts alter column route_version set default 'anime-v1';

-- BEGIN GENERATED RULES
-- Gameplay IDs only, generated from repository JSON. No Pokémon metadata table.
create or replace function public.kanto_rules() returns jsonb language sql immutable set search_path = '' as $rules$
 select '{"chapters":[[25,16,19,21,52,23,109,113,10,13,127],[74,95,35,41,46,120,86,118,27,104],[1,43,4,7,98,129],[79,72,116,92,63,56,60,69,102,114,54,96,32,37,48,100,66,106,107],[29,58,81,88,50,77,111,128,115,90,132,133,143,123,125,39],[138,140,142,83,108,126,122,84]],"evolutions":[[1,2],[2,3],[4,5],[5,6],[7,8],[8,9],[10,11],[11,12],[13,14],[14,15],[16,17],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[30,31],[32,33],[33,34],[35,36],[37,38],[39,40],[41,42],[43,44],[44,45],[46,47],[48,49],[50,51],[52,53],[54,55],[56,57],[58,59],[60,61],[61,62],[63,64],[64,65],[66,67],[67,68],[69,70],[70,71],[72,73],[74,75],[75,76],[77,78],[79,80],[81,82],[84,85],[86,87],[88,89],[90,91],[92,93],[93,94],[96,97],[98,99],[100,101],[102,103],[104,105],[109,110],[111,112],[116,117],[118,119],[120,121],[129,130],[133,134],[133,135],[133,136],[138,139],[140,141],[147,148],[148,149]],"exploration":[[147,1],[137,1],[124,1],[131,1]]}'::jsonb;
$rules$;
-- END GENERATED RULES

create or replace function public.kanto_redeem(p_child_id uuid,p_code text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare reward public.kanto_reward_codes%rowtype; chapter integer; selected integer; ticket uuid; receipt public.kanto_receipts%rowtype;
begin
  -- All collection mutations lock the child FIRST. Different codes cannot race.
  perform 1 from public.kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into reward from public.kanto_reward_codes where child_id=p_child_id and code=p_code for update;
  if not found then raise exception 'INVALID_CODE'; end if;
  -- A successful prior result is returned even after its original expiry date.
  if reward.redeemed_at is not null then
    select * into receipt from public.kanto_receipts where id=reward.receipt_id;
    return to_jsonb(receipt);
  end if;
  if reward.revoked_at is not null or reward.expires_at<=now() then raise exception 'EXPIRED_CODE'; end if;
  if reward.type='capture' then
    chapter := public.kanto_current_chapter(p_child_id);
    if chapter<=6 then
      select id::integer into selected from jsonb_array_elements_text(public.kanto_rules()->'chapters'->(chapter-1)) with ordinality as candidates(id,position)
      where not exists(select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=id::integer)
      order by position limit 1;
    else
      select (entry->>0)::integer into selected from jsonb_array_elements(public.kanto_rules()->'exploration') with ordinality as candidates(entry,position)
      where not exists(select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=(entry->>0)::integer)
      order by position limit 1;
    end if;
    if selected is null then raise exception 'CAPTURE_POOL_EMPTY'; end if;
    insert into public.kanto_receipts(child_id,kind,pokemon_id,reason) values(p_child_id,'capture',selected,reward.reason) returning * into receipt;
    insert into public.kanto_pokemon_collection(child_id,pokemon_id,method,reason,receipt_id) values(p_child_id,selected,'capture',reward.reason,receipt.id);
    insert into public.kanto_story_progress(child_id,chapter) values(p_child_id,public.kanto_current_chapter(p_child_id))
      on conflict(child_id) do update set chapter=excluded.chapter,updated_at=now();
    -- Persist the exact chapter completion on this receipt while holding the child lock.
    if chapter <= 6 and public.kanto_current_chapter(p_child_id) > chapter then
      update public.kanto_receipts set completed_chapter=chapter where id=receipt.id returning * into receipt;
    end if;
  else
    insert into public.kanto_inventory(child_id,reward_id,type,reason) values(p_child_id,reward.id,reward.type,reward.reason) returning id into ticket;
    insert into public.kanto_receipts(child_id,kind,ticket_id,reason) values(p_child_id,reward.type||'-ticket',ticket,reward.reason) returning * into receipt;
  end if;
  update public.kanto_reward_codes set redeemed_at=now(),receipt_id=receipt.id where id=reward.id;
  return to_jsonb(receipt);
end $$;

revoke all on function public.kanto_redeem(uuid,text) from public, anon, authenticated;
grant execute on function public.kanto_redeem(uuid,text) to service_role;

-- Recompute the route pointer only; old encounters and their chapter celebrations keep their version.
update public.kanto_story_progress set chapter=public.kanto_current_chapter(child_id),updated_at=now();
revoke all on function public.kanto_rules() from public, anon, authenticated;
grant execute on function public.kanto_rules() to service_role;
notify pgrst, 'reload schema';
commit;
