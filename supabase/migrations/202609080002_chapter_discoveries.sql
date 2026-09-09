-- Run AFTER 202609080001_family_rewards.sql. Existing receipts remain unchanged
-- except for a nullable metadata column. No historical celebrations are guessed.
begin;
alter table public.kanto_receipts add column completed_chapter integer
  check (completed_chapter is null or (completed_chapter between 1 and 6 and kind='capture'));

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
      select id::integer into selected from jsonb_array_elements_text(public.kanto_rules()->'chapters'->(chapter-1)) id
      where not exists(select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=id::integer)
      order by random() limit 1;
    else
      select (entry->>0)::integer into selected from jsonb_array_elements(public.kanto_rules()->'exploration') entry
      where not exists(select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=(entry->>0)::integer)
      order by -ln(greatest(random(),0.000000001))/(entry->>1)::numeric limit 1;
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
notify pgrst, 'reload schema';
commit;
