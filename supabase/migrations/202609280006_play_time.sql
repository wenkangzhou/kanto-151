begin;
create table public.kanto_play_time (
  child_id uuid primary key references public.kanto_children(id) on delete cascade,
  enabled boolean not null default false,
  minutes integer not null default 20 check (minutes between 1 and 120),
  expires_at timestamptz,
  revision integer not null default 0,
  request_id uuid
);
alter table public.kanto_play_time enable row level security;
revoke all on public.kanto_play_time from public, anon, authenticated;
grant all on public.kanto_play_time to service_role;

create function public.kanto_play_time_state(p_child_id uuid) returns jsonb
language sql security definer set search_path = public as $$
  select jsonb_build_object('enabled',coalesce(t.enabled,false),'minutes',coalesce(t.minutes,20),
    'expiresAt',t.expires_at,'revision',coalesce(t.revision,0),'serverNow',clock_timestamp())
  from (select 1) seed left join kanto_play_time t on t.child_id=p_child_id;
$$;

create function public.kanto_control_play_time(p_child_id uuid,p_action text,p_minutes integer,p_expected integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t kanto_play_time;
begin
  if p_action is null or p_action not in ('start','lock','disable','configure') or p_minutes is null or p_minutes not between 1 and 120 or p_expected is null or p_expected < 0 or p_request_id is null then
    raise exception 'INVALID_INPUT';
  end if;
  perform 1 from kanto_children where id=p_child_id for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into kanto_play_time(child_id) values(p_child_id) on conflict do nothing;
  select * into t from kanto_play_time where child_id=p_child_id for update;
  -- A retried start never grants a fresh deadline.
  if t.request_id=p_request_id then return kanto_play_time_state(p_child_id); end if;
  if t.revision<>p_expected then raise exception 'PLAY_TIME_CHANGED'; end if;
  update kanto_play_time set
    enabled=case p_action when 'start' then true when 'lock' then true when 'disable' then false else enabled end,
    minutes=p_minutes,
    expires_at=case p_action when 'start' then clock_timestamp()+make_interval(mins=>p_minutes) when 'lock' then null when 'disable' then null else expires_at end,
    revision=revision+1,request_id=p_request_id
  where child_id=p_child_id;
  return kanto_play_time_state(p_child_id);
end;
$$;
revoke all on function public.kanto_play_time_state(uuid), public.kanto_control_play_time(uuid,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.kanto_play_time_state(uuid), public.kanto_control_play_time(uuid,text,integer,integer,uuid) to service_role;
notify pgrst, 'reload schema';
commit;
