begin;
create table public.kanto_learning (
 child_id uuid primary key references public.kanto_children(id) on delete cascade,
 revision integer not null default 0,
 state jsonb not null default '{}'::jsonb
);
alter table public.kanto_learning enable row level security;
revoke all on public.kanto_learning from public,anon,authenticated;
grant all on public.kanto_learning to service_role;

-- Keep previously equipped machine moves as permanent gifts before remapping 3+1.
insert into public.kanto_learning(child_id,state)
select child_id,jsonb_build_object('unlocked',jsonb_agg(distinct moves->3))
from public.kanto_move_presets where moves->3 <> 'null'::jsonb group by child_id;
update public.kanto_move_presets set moves=jsonb_build_array(moves->0,moves->1,moves->3,null);

-- BEGIN STARTER MACHINES
create or replace function public.kanto_starter_machines() returns jsonb language sql immutable set search_path='' as $rules$ select '{"1":["energy-ball","sludge-bomb"],"2":["energy-ball","sludge-bomb"],"3":["energy-ball","sludge-bomb"],"4":["fire-blast","echoed-voice"],"5":["fire-blast","echoed-voice"],"6":["fire-blast","aerial-ace"],"7":["scald","blizzard"],"8":["scald","blizzard"],"9":["scald","blizzard"],"10":[],"11":[],"12":["infestation","dream-eater"],"13":[],"14":[],"15":["u-turn","acrobatics"],"16":["aerial-ace","steel-wing"],"17":["aerial-ace","steel-wing"],"18":["aerial-ace","steel-wing"],"19":["facade","thief"],"20":["facade","thief"],"21":["facade","steel-wing"],"22":["facade","steel-wing"],"23":["poison-jab","brutal-swing"],"24":["poison-jab","brutal-swing"],"25":["charge-beam","brick-break"],"26":["wild-charge","brick-break"],"27":["bulldoze","aerial-ace"],"28":["bulldoze","aerial-ace"],"29":["poison-jab","aerial-ace"],"30":["poison-jab","aerial-ace"],"31":["bulldoze","aerial-ace"],"32":["sludge-bomb","facade"],"33":["sludge-bomb","facade"],"34":["bulldoze","brick-break"],"35":["dazzling-gleam","blizzard"],"36":["dazzling-gleam","blizzard"],"37":["flamethrower","dark-pulse"],"38":["fire-blast","dark-pulse"],"39":["facade","dazzling-gleam"],"40":["dazzling-gleam","blizzard"],"41":["acrobatics","facade"],"42":["acrobatics","facade"],"43":["energy-ball","sludge-bomb"],"44":["energy-ball","sludge-bomb"],"45":["energy-ball","sludge-bomb"],"46":["leech-life","aerial-ace"],"47":["leech-life","aerial-ace"],"48":["infestation","facade"],"49":["infestation","sludge-bomb"],"50":["bulldoze","aerial-ace"],"51":["bulldoze","aerial-ace"],"52":["facade","aerial-ace"],"53":["facade","aerial-ace"],"54":["scald","blizzard"],"55":["scald","blizzard"],"56":["brick-break","acrobatics"],"57":["brick-break","acrobatics"],"58":["flame-charge","aerial-ace"],"59":["flame-charge","aerial-ace"],"60":["waterfall","facade"],"61":["waterfall","brick-break"],"62":["brick-break","waterfall"],"63":["dream-eater","charge-beam"],"64":["dream-eater","charge-beam"],"65":["dream-eater","charge-beam"],"66":["brick-break","bulldoze"],"67":["brick-break","bulldoze"],"68":["brick-break","bulldoze"],"69":["energy-ball","facade"],"70":["energy-ball","facade"],"71":["poison-jab","facade"],"72":["scald","blizzard"],"73":["scald","blizzard"],"74":["bulldoze","brick-break"],"75":["bulldoze","brick-break"],"76":["bulldoze","brick-break"],"77":["fire-blast","facade"],"78":["fire-blast","facade"],"79":["dream-eater","scald"],"80":["dream-eater","blizzard"],"81":["charge-beam","flash-cannon"],"82":["charge-beam","hidden-power"],"83":["acrobatics","brutal-swing"],"84":["aerial-ace","steel-wing"],"85":["aerial-ace","payback"],"86":["waterfall","facade"],"87":["waterfall","blizzard"],"88":["poison-jab","explosion"],"89":["poison-jab","brick-break"],"90":["surf","explosion"],"91":["blizzard","surf"],"92":["sludge-bomb","dark-pulse"],"93":["sludge-bomb","dark-pulse"],"94":["sludge-bomb","dark-pulse"],"95":["bulldoze","brutal-swing"],"96":["dream-eater","brick-break"],"97":["dream-eater","brick-break"],"98":["scald","brick-break"],"99":["scald","brick-break"],"100":["thunder","hidden-power"],"101":["thunder","hidden-power"],"102":["dream-eater","hidden-power"],"103":["dream-eater","hidden-power"],"104":["bulldoze","aerial-ace"],"105":["bulldoze","aerial-ace"],"106":["low-sweep","bulldoze"],"107":["brick-break","bulldoze"],"108":["hidden-power","blizzard"],"109":["venoshock","explosion"],"110":["venoshock","explosion"],"111":["bulldoze","facade"],"112":["bulldoze","brick-break"],"113":["echoed-voice","blizzard"],"114":["energy-ball","hidden-power"],"115":["facade","aerial-ace"],"116":["scald","blizzard"],"117":["scald","blizzard"],"118":["scald","facade"],"119":["scald","facade"],"120":["scald","blizzard"],"121":["dream-eater","blizzard"],"122":["dazzling-gleam","charge-beam"],"123":["aerial-ace","brick-break"],"124":["blizzard","dream-eater"],"125":["charge-beam","focus-blast"],"126":["fire-blast","focus-blast"],"127":["brick-break","brutal-swing"],"128":["facade","bulldoze"],"129":[],"130":["waterfall","brutal-swing"],"131":["waterfall","blizzard"],"132":[],"133":["facade","shadow-ball"],"134":["scald","blizzard"],"135":["charge-beam","echoed-voice"],"136":["flame-charge","facade"],"137":["hidden-power","blizzard"],"138":["scald","blizzard"],"139":["scald","blizzard"],"140":["rock-slide","aerial-ace"],"141":["rock-slide","aerial-ace"],"142":["aerial-ace","rock-slide"],"143":["facade","brick-break"],"144":["blizzard","hidden-power"],"145":["charge-beam","aerial-ace"],"146":["fire-blast","hidden-power"],"147":["brutal-swing","facade"],"148":["brutal-swing","facade"],"149":["aerial-ace","brick-break"],"150":["dream-eater","blizzard"],"151":["dream-eater","acrobatics"]}'::jsonb; $rules$;
revoke all on function public.kanto_starter_machines() from public,anon,authenticated;
-- END STARTER MACHINES

create function public.kanto_learning_read(p_child_id uuid) returns jsonb
language sql security definer set search_path='' as $$
 select jsonb_build_object('revision',coalesce(t.revision,0),'state',coalesce(t.state,'{}'::jsonb),'serverNow',clock_timestamp())
 from (select 1) seed left join public.kanto_learning t on t.child_id=p_child_id;
$$;
create function public.kanto_learning_save(p_child_id uuid,p_expected integer,p_state jsonb,p_parent boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
declare t jsonb;
begin
 perform 1 from public.kanto_children where id=p_child_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if not p_parent then
   t:=public.kanto_play_time_state(p_child_id);
   if (t->>'enabled')::boolean and (t->>'expiresAt' is null or (t->>'expiresAt')::timestamptz<=clock_timestamp()) then raise exception 'PLAY_TIME_LOCKED'; end if;
 end if;
 insert into public.kanto_learning(child_id) values(p_child_id) on conflict do nothing;
 update public.kanto_learning set state=p_state,revision=revision+1 where child_id=p_child_id and revision=p_expected;
 return found;
end;
$$;
revoke all on function public.kanto_learning_read(uuid),public.kanto_learning_save(uuid,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.kanto_learning_read(uuid),public.kanto_learning_save(uuid,integer,jsonb,boolean) to service_role;



create or replace function public.kanto_inherit_moves() returns trigger
language plpgsql security definer set search_path = '' as $$
declare parent_id integer; previous_moves jsonb; next_moves jsonb := '[null,null,null,null]'::jsonb;
 rules jsonb; candidate jsonb; slot integer;
begin
 if new.method<>'evolution' then return new; end if;
 select (entry->>0)::integer into parent_id from jsonb_array_elements(public.kanto_rules()->'evolutions') entry where (entry->>1)::integer=new.pokemon_id;
 select moves into previous_moves from public.kanto_move_presets where child_id=new.child_id and pokemon_id=parent_id;
 if previous_moves is null then return new; end if;
 rules := public.kanto_move_rules()->new.pokemon_id::text;
 for slot in 0..3 loop
  candidate := previous_moves->slot;
  if candidate<>'null'::jsonb and ((rules->case when slot>=2 then 'machine' else 'level' end) ? (candidate #>> '{}')) then
   if slot>=2 and not ((public.kanto_starter_machines()->new.pokemon_id::text) ? (candidate #>> '{}')) and not coalesce((select (state->'unlocked') ? (candidate #>> '{}') from public.kanto_learning where child_id=new.child_id),false) then continue; end if;
   next_moves := jsonb_set(next_moves,array[slot::text],candidate);
  end if;
 end loop;
 insert into public.kanto_move_presets(child_id,pokemon_id,moves) values(new.child_id,new.pokemon_id,next_moves) on conflict do nothing;
 return new;
end $$;
revoke all on function public.kanto_inherit_moves() from public, anon, authenticated;


create or replace function public.kanto_set_moves(p_child_id uuid, p_pokemon_id integer, p_expected jsonb, p_moves jsonb) returns jsonb
language plpgsql security definer set search_path = '' as $$
declare current_moves jsonb; rules jsonb; candidate jsonb; slot integer;
begin
 perform 1 from public.kanto_children where id=p_child_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if not exists(select 1 from public.kanto_pokemon_collection where child_id=p_child_id and pokemon_id=p_pokemon_id) then raise exception 'TEAM_NOT_COLLECTED'; end if;
 if p_moves is null or jsonb_typeof(p_moves)<>'array' then raise exception 'INVALID_INPUT'; end if;
 if jsonb_array_length(p_moves)<>4 then raise exception 'INVALID_INPUT'; end if;
 rules := public.kanto_move_rules()->p_pokemon_id::text;
 if rules is null then raise exception 'INVALID_INPUT'; end if;
 for slot in 0..3 loop
  candidate := p_moves->slot;
  if candidate <> 'null'::jsonb and (jsonb_typeof(candidate)<>'string' or not ((rules->case when slot>=2 then 'machine' else 'level' end) ? (candidate #>> '{}'))) then raise exception 'INVALID_INPUT'; end if;
 end loop;
 if (select count(*) from jsonb_array_elements(p_moves) v where v<>'null'::jsonb) <>
    (select count(distinct v) from jsonb_array_elements(p_moves) v where v<>'null'::jsonb) then raise exception 'INVALID_INPUT'; end if;
 for slot in 2..3 loop
  candidate:=p_moves->slot;
  if candidate<>'null'::jsonb and not ((public.kanto_starter_machines()->p_pokemon_id::text) ? (candidate #>> '{}'))
    and not coalesce((select (state->'unlocked') ? (candidate #>> '{}') from public.kanto_learning where child_id=p_child_id),false) then raise exception 'MOVE_LOCKED'; end if;
 end loop;
 select moves into current_moves from public.kanto_move_presets where child_id=p_child_id and pokemon_id=p_pokemon_id;
 if current_moves is not distinct from p_moves then return public.kanto_snapshot(p_child_id); end if;
 if current_moves is distinct from p_expected then raise exception 'MOVES_CHANGED'; end if;
 insert into public.kanto_move_presets(child_id,pokemon_id,moves) values(p_child_id,p_pokemon_id,p_moves)
 on conflict(child_id,pokemon_id) do update set moves=excluded.moves;
 return public.kanto_snapshot(p_child_id);
end $$;
revoke all on function public.kanto_set_moves(uuid,integer,jsonb,jsonb) from public, anon, authenticated;
grant execute on function public.kanto_set_moves(uuid,integer,jsonb,jsonb) to service_role;

create or replace function public.kanto_snapshot(p_child_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
  'records',coalesce((select jsonb_agg(jsonb_build_object('pokemonId',pokemon_id,'acquiredAt',acquired_at,'reason',reason,'method',method) order by acquired_at,pokemon_id) from public.kanto_pokemon_collection where child_id=p_child_id),'[]'::jsonb),
  'tickets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',type,'reason',reason,'createdAt',created_at) order by created_at) from public.kanto_inventory where child_id=p_child_id and used_at is null),'[]'::jsonb),
  'inventory',jsonb_build_object('evolution',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='evolution' and used_at is null),'legendary',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='legendary' and used_at is null)),
  'source','supabase',
  'unlockedMoves',coalesce((select state->'unlocked' from public.kanto_learning where child_id=p_child_id),'[]'::jsonb),
  'movePresets',coalesce((select jsonb_object_agg(pokemon_id::text,moves) from public.kanto_move_presets where child_id=p_child_id),'{}'::jsonb),
  'team',coalesce((select jsonb_agg(pokemon_id order by slot) from public.kanto_team where child_id=p_child_id),'[]'::jsonb),
  'pendingReceipt',(select to_jsonb(r) from public.kanto_receipts r where r.child_id=p_child_id and r.acknowledged_at is null order by r.created_at limit 1)
 );
$$;

notify pgrst,'reload schema';
commit;
