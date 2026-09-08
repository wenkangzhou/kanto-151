-- Kanto 151 / phase 2. Run once in Supabase SQL Editor as the project owner.
-- This migration creates only Kanto-owned objects; all changes are transactional.
begin;

create table public.kanto_families (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  name text not null check (length(name) between 1 and 40),
  pin_hash text not null,
  auth_version integer not null default 1,
  created_at timestamptz not null default now()
);
create table public.kanto_children (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null unique references public.kanto_families(id),
  name text not null check (length(name) between 1 and 30),
  created_at timestamptz not null default now()
);
create table public.kanto_devices (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.kanto_children(id),
  token_hash text not null unique check (length(token_hash) = 64),
  name text not null default '家庭设备',
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '180 days',
  revoked_at timestamptz
);
create table public.kanto_pairing_codes (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.kanto_children(id),
  code_hash text not null unique,
  expires_at timestamptz not null default now() + interval '15 minutes',
  used_at timestamptz
);
create table public.kanto_rate_limits (
  bucket text primary key,
  attempts integer not null,
  window_start timestamptz not null
);
create table public.kanto_reward_codes (
  id uuid primary key, -- browser's stable request UUID makes creation retry-safe
  child_id uuid not null references public.kanto_children(id),
  code text not null check (code ~ '^[0-9]{6}$'),
  type text not null check (type in ('capture','evolution','legendary')),
  reason text not null default '' check (length(reason) <= 160),
  created_at timestamptz not null default now(),
  expires_at timestamptz not null default now() + interval '30 days',
  redeemed_at timestamptz,
  revoked_at timestamptz,
  receipt_id uuid,
  unique(child_id,code)
);
create table public.kanto_inventory (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.kanto_children(id),
  reward_id uuid not null unique references public.kanto_reward_codes(id),
  type text not null check (type in ('evolution','legendary')),
  reason text not null,
  created_at timestamptz not null default now(),
  used_at timestamptz,
  receipt_id uuid
);
create table public.kanto_receipts (
  id uuid primary key default gen_random_uuid(),
  child_id uuid not null references public.kanto_children(id),
  kind text not null check (kind in ('capture','evolution-ticket','legendary-ticket','evolution','legendary','mew')),
  pokemon_id integer check (pokemon_id between 1 and 151),
  from_pokemon_id integer check (from_pokemon_id between 1 and 151),
  ticket_id uuid references public.kanto_inventory(id),
  reason text not null default '',
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);
alter table public.kanto_reward_codes add foreign key (receipt_id) references public.kanto_receipts(id);
alter table public.kanto_inventory add foreign key (receipt_id) references public.kanto_receipts(id);
create table public.kanto_pokemon_collection (
  child_id uuid not null references public.kanto_children(id),
  pokemon_id integer not null check (pokemon_id between 1 and 151),
  method text not null check (method in ('capture','evolution','legendary')),
  reason text not null default '',
  acquired_at timestamptz not null default now(),
  receipt_id uuid unique references public.kanto_receipts(id),
  primary key(child_id,pokemon_id)
);
create table public.kanto_story_progress (
  child_id uuid primary key references public.kanto_children(id),
  chapter integer not null default 1 check (chapter between 1 and 7),
  updated_at timestamptz not null default now()
);
create table public.kanto_legendary_progress (
  child_id uuid not null references public.kanto_children(id),
  pokemon_id integer not null check (pokemon_id in (144,145,146,150,151)),
  receipt_id uuid not null references public.kanto_receipts(id),
  primary key(child_id,pokemon_id)
);
create index on public.kanto_receipts(child_id,created_at);
create index on public.kanto_reward_codes(child_id,created_at desc);
create index on public.kanto_inventory(child_id,type) where used_at is null;
create index on public.kanto_devices(child_id) where revoked_at is null;

-- Browser Supabase keys have no table or RPC permissions. Next.js checks the
-- opaque device session / short-lived parent session, then uses the server key.
-- No permissive policies are installed: anonymous/authenticated access is denied.
do $$ declare t text; begin
  foreach t in array array['kanto_families','kanto_children','kanto_devices','kanto_pairing_codes','kanto_rate_limits','kanto_reward_codes','kanto_inventory','kanto_receipts','kanto_pokemon_collection','kanto_story_progress','kanto_legendary_progress'] loop
    execute format('alter table public.%I enable row level security',t);
    execute format('revoke all on public.%I from public, anon, authenticated',t);
    execute format('grant all on public.%I to service_role',t);
  end loop;
end $$;

-- BEGIN GENERATED RULES
-- Gameplay IDs only, generated from repository JSON. No Pokémon metadata table.
create function public.kanto_rules() returns jsonb language sql immutable set search_path = '' as $rules$
 select '{"chapters":[[1,4,7,16,19],[10,13,25,43,46],[27,35,41,74,39],[54,60,72,98,129],[52,58,63,66,133],[77,81,92,111,147]],"evolutions":[[1,2],[2,3],[4,5],[5,6],[7,8],[8,9],[10,11],[11,12],[13,14],[14,15],[16,17],[17,18],[19,20],[21,22],[23,24],[25,26],[27,28],[29,30],[30,31],[32,33],[33,34],[35,36],[37,38],[39,40],[41,42],[43,44],[44,45],[46,47],[48,49],[50,51],[52,53],[54,55],[56,57],[58,59],[60,61],[61,62],[63,64],[64,65],[66,67],[67,68],[69,70],[70,71],[72,73],[74,75],[75,76],[77,78],[79,80],[81,82],[84,85],[86,87],[88,89],[90,91],[92,93],[93,94],[96,97],[98,99],[100,101],[102,103],[104,105],[109,110],[111,112],[116,117],[118,119],[120,121],[129,130],[133,134],[133,135],[133,136],[138,139],[140,141],[147,148],[148,149]],"exploration":[[21,10],[23,10],[29,10],[32,10],[37,10],[48,10],[50,10],[56,10],[69,10],[79,10],[83,3],[84,10],[86,10],[88,10],[90,10],[95,3],[96,10],[100,10],[102,3],[104,10],[106,3],[107,3],[108,3],[109,10],[113,1],[114,3],[115,3],[116,10],[118,10],[120,10],[122,3],[123,3],[124,3],[125,3],[126,3],[127,3],[128,3],[131,1],[132,3],[137,3],[138,3],[140,3],[142,3],[143,1]]}'::jsonb;
$rules$;
-- END GENERATED RULES

create function public.kanto_current_chapter(p_child_id uuid) returns integer
language plpgsql stable set search_path = '' as $$
declare chapter jsonb; index integer := 0;
begin
  for chapter in select value from jsonb_array_elements(public.kanto_rules()->'chapters') loop
    index := index + 1;
    if exists (select 1 from jsonb_array_elements_text(chapter) id where not exists (
      select 1 from public.kanto_pokemon_collection c where c.child_id=p_child_id and c.pokemon_id=id::integer
    )) then return index; end if;
  end loop;
  return 7;
end $$;

create function public.kanto_rate_limit(p_bucket text,p_limit integer,p_seconds integer) returns boolean
language plpgsql volatile security definer set search_path = '' as $$
declare used integer;
begin
  if p_limit < 1 or p_seconds < 1 or length(p_bucket)>200 then return false; end if;
  insert into public.kanto_rate_limits as r(bucket,attempts,window_start) values(p_bucket,1,clock_timestamp())
  on conflict(bucket) do update set
    attempts=case when r.window_start < clock_timestamp()-make_interval(secs=>p_seconds) then 1 else r.attempts+1 end,
    window_start=case when r.window_start < clock_timestamp()-make_interval(secs=>p_seconds) then clock_timestamp() else r.window_start end
  returning attempts into used;
  delete from public.kanto_rate_limits where window_start < now()-interval '2 days';
  return used <= p_limit;
end $$;

create function public.kanto_setup(p_family_name text,p_child_name text,p_pin_hash text,p_token_hash text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare family uuid; child uuid; device uuid;
begin
  perform pg_advisory_xact_lock(15142751);
  if exists(select 1 from public.kanto_families) then raise exception 'ALREADY_SETUP'; end if;
  if p_pin_hash !~ '^scrypt:' then raise exception 'INVALID_INPUT'; end if;
  insert into public.kanto_families(name,pin_hash) values(p_family_name,p_pin_hash) returning id into family;
  insert into public.kanto_children(family_id,name) values(family,p_child_name) returning id into child;
  insert into public.kanto_story_progress(child_id) values(child);
  insert into public.kanto_devices(child_id,token_hash,name) values(child,p_token_hash,'家长的设备') returning id into device;
  return device;
end $$;

create function public.kanto_recover(p_pin_hash text,p_token_hash text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare family uuid; child uuid; device uuid;
begin
  select id into family from public.kanto_families for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_pin_hash !~ '^scrypt:' then raise exception 'INVALID_INPUT'; end if;
  update public.kanto_families set pin_hash=p_pin_hash,auth_version=auth_version+1 where id=family;
  select id into child from public.kanto_children where family_id=family;
  insert into public.kanto_devices(child_id,token_hash,name) values(child,p_token_hash,'恢复的家长设备') returning id into device;
  return device;
end $$;

create function public.kanto_pair(p_code_hash text,p_token_hash text,p_name text) returns uuid
language plpgsql volatile security definer set search_path = '' as $$
declare pairing public.kanto_pairing_codes%rowtype; device uuid;
begin
  select * into pairing from public.kanto_pairing_codes where code_hash=p_code_hash for update;
  if not found or pairing.used_at is not null or pairing.expires_at<=now() then raise exception 'INVALID_PAIRING'; end if;
  insert into public.kanto_devices(child_id,token_hash,name) values(pairing.child_id,p_token_hash,p_name) returning id into device;
  update public.kanto_pairing_codes set used_at=now() where id=pairing.id;
  return device;
end $$;

create function public.kanto_create_reward(p_child_id uuid,p_request_id uuid,p_type text,p_reason text) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare reward public.kanto_reward_codes%rowtype; new_code text; attempt integer;
begin
  perform 1 from public.kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into reward from public.kanto_reward_codes where id=p_request_id;
  if found then
    if reward.child_id<>p_child_id or reward.type<>p_type or reward.reason<>p_reason then raise exception 'REQUEST_CONFLICT'; end if;
    return to_jsonb(reward);
  end if;
  if p_type not in ('capture','evolution','legendary') or length(p_reason)>160 then raise exception 'INVALID_INPUT'; end if;
  for attempt in 1..30 loop
    new_code := lpad(((('x'||substr(replace(gen_random_uuid()::text,'-',''),1,8))::bit(32)::bigint)%1000000)::text,6,'0');
    if not exists(select 1 from public.kanto_reward_codes where child_id=p_child_id and code=new_code) then
      insert into public.kanto_reward_codes(id,child_id,code,type,reason) values(p_request_id,p_child_id,new_code,p_type,p_reason) returning * into reward;
      return to_jsonb(reward);
    end if;
  end loop;
  raise exception 'TRY_AGAIN';
end $$;

create function public.kanto_redeem(p_child_id uuid,p_code text) returns jsonb
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
  else
    insert into public.kanto_inventory(child_id,reward_id,type,reason) values(p_child_id,reward.id,reward.type,reward.reason) returning id into ticket;
    insert into public.kanto_receipts(child_id,kind,ticket_id,reason) values(p_child_id,reward.type||'-ticket',ticket,reward.reason) returning * into receipt;
  end if;
  update public.kanto_reward_codes set redeemed_at=now(),receipt_id=receipt.id where id=reward.id;
  return to_jsonb(receipt);
end $$;

create function public.kanto_use_ticket(p_child_id uuid,p_ticket_id uuid,p_target integer) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare ticket public.kanto_inventory%rowtype; receipt public.kanto_receipts%rowtype; parent integer; count integer;
begin
  perform 1 from public.kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select * into ticket from public.kanto_inventory where id=p_ticket_id and child_id=p_child_id for update;
  if not found then raise exception 'INVALID_TICKET'; end if;
  if ticket.used_at is not null then
    select * into receipt from public.kanto_receipts where id=ticket.receipt_id;
    if receipt.pokemon_id<>p_target then raise exception 'TICKET_USED'; end if;
    return to_jsonb(receipt);
  end if;
  if exists(select 1 from public.kanto_pokemon_collection where child_id=p_child_id and pokemon_id=p_target) then raise exception 'ALREADY_COLLECTED'; end if;
  if ticket.type='evolution' then
    select (entry->>0)::integer into parent from jsonb_array_elements(public.kanto_rules()->'evolutions') entry where (entry->>1)::integer=p_target;
    if parent is null or not exists(select 1 from public.kanto_pokemon_collection where child_id=p_child_id and pokemon_id=parent) then raise exception 'EVOLUTION_LOCKED'; end if;
  else
    select count(*) into count from public.kanto_pokemon_collection where child_id=p_child_id;
    if not ((p_target=144 and count>=60) or (p_target=145 and count>=80) or (p_target=146 and count>=100)
      or (p_target=150 and count>=140 and public.kanto_current_chapter(p_child_id)=7)) then raise exception 'LEGENDARY_LOCKED'; end if;
  end if;
  insert into public.kanto_receipts(child_id,kind,pokemon_id,from_pokemon_id,ticket_id,reason)
    values(p_child_id,ticket.type,p_target,parent,ticket.id,ticket.reason) returning * into receipt;
  insert into public.kanto_pokemon_collection(child_id,pokemon_id,method,reason,receipt_id) values(p_child_id,p_target,ticket.type,ticket.reason,receipt.id);
  if ticket.type='legendary' then insert into public.kanto_legendary_progress values(p_child_id,p_target,receipt.id); end if;
  update public.kanto_inventory set used_at=now(),receipt_id=receipt.id where id=ticket.id;
  return to_jsonb(receipt);
end $$;

create function public.kanto_meet_mew(p_child_id uuid) returns jsonb
language plpgsql volatile security definer set search_path = '' as $$
declare receipt public.kanto_receipts%rowtype;
begin
  perform 1 from public.kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  select r.* into receipt from public.kanto_receipts r join public.kanto_pokemon_collection c on c.receipt_id=r.id where c.child_id=p_child_id and c.pokemon_id=151;
  if found then return to_jsonb(receipt); end if;
  if (select count(*) from public.kanto_pokemon_collection where child_id=p_child_id and pokemon_id<>151)<>150 then raise exception 'MEW_LOCKED'; end if;
  insert into public.kanto_receipts(child_id,kind,pokemon_id,reason) values(p_child_id,'mew',151,'每一份努力，都让我们离这最后的相遇更近一步。') returning * into receipt;
  insert into public.kanto_pokemon_collection(child_id,pokemon_id,method,reason,receipt_id) values(p_child_id,151,'legendary',receipt.reason,receipt.id);
  insert into public.kanto_legendary_progress values(p_child_id,151,receipt.id);
  return to_jsonb(receipt);
end $$;

-- Snapshot uses one SQL statement / MVCC snapshot, so inventory and collection agree.
create function public.kanto_snapshot(p_child_id uuid) returns jsonb
language sql stable security definer set search_path = '' as $$
 select jsonb_build_object(
  'records',coalesce((select jsonb_agg(jsonb_build_object('pokemonId',pokemon_id,'acquiredAt',acquired_at,'reason',reason,'method',method) order by acquired_at,pokemon_id) from public.kanto_pokemon_collection where child_id=p_child_id),'[]'::jsonb),
  'tickets',coalesce((select jsonb_agg(jsonb_build_object('id',id,'type',type,'reason',reason,'createdAt',created_at) order by created_at) from public.kanto_inventory where child_id=p_child_id and used_at is null),'[]'::jsonb),
  'inventory',jsonb_build_object('evolution',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='evolution' and used_at is null),'legendary',(select count(*) from public.kanto_inventory where child_id=p_child_id and type='legendary' and used_at is null)),
  'source','supabase',
  'pendingReceipt',(select to_jsonb(r) from public.kanto_receipts r where r.child_id=p_child_id and r.acknowledged_at is null order by r.created_at limit 1)
 );
$$;

-- Revoke default PUBLIC EXECUTE on every Kanto function, including helper functions.
do $$ declare f record; begin
  for f in select p.oid::regprocedure as signature from pg_proc p join pg_namespace n on n.oid=p.pronamespace where n.nspname='public' and p.proname like 'kanto_%' loop
    execute format('revoke all on function %s from public, anon, authenticated',f.signature);
    execute format('grant execute on function %s to service_role',f.signature);
  end loop;
end $$;
notify pgrst, 'reload schema';
commit;
