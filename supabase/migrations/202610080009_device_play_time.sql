begin;
create table public.kanto_device_play_time (
 device_id uuid primary key references public.kanto_devices(id) on delete cascade,
 enabled boolean not null default false,
 minutes integer not null default 20 check(minutes between 1 and 120),
 expires_at timestamptz,
 revision integer not null default 0,
 request_id uuid,
 usage_day date not null default ((clock_timestamp() at time zone 'Asia/Shanghai')::date)
);
alter table public.kanto_device_play_time enable row level security;
revoke all on public.kanto_device_play_time from public,anon,authenticated;
grant all on public.kanto_device_play_time to service_role;
-- Preserve existing restrictions once, then each device evolves independently.
insert into public.kanto_device_play_time(device_id,enabled,minutes,expires_at,revision,usage_day)
select d.id,t.enabled,t.minutes,t.expires_at,t.revision,t.usage_day
from public.kanto_devices d join public.kanto_play_time t on t.child_id=d.child_id
where d.revoked_at is null and d.expires_at>clock_timestamp();

create function public.kanto_device_play_time_state(p_child_id uuid,p_device_id uuid,p_activate boolean default true) returns jsonb
language plpgsql security definer set search_path=public as $$
declare t kanto_device_play_time; sampled_at timestamptz; today date;
begin
 perform 1 from kanto_devices where id=p_device_id and child_id=p_child_id and revoked_at is null and expires_at>clock_timestamp() for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 insert into kanto_device_play_time(device_id) values(p_device_id) on conflict do nothing;
 select * into t from kanto_device_play_time where device_id=p_device_id for update;
 sampled_at:=clock_timestamp(); today:=(sampled_at at time zone 'Asia/Shanghai')::date;
 if p_activate and t.enabled and t.usage_day<today then
  update kanto_device_play_time set usage_day=today,expires_at=least(sampled_at+make_interval(mins=>minutes),(today+1)::timestamp at time zone 'Asia/Shanghai'),revision=revision+1
  where device_id=p_device_id returning * into t;
 end if;
 return jsonb_build_object('deviceId',p_device_id,'enabled',t.enabled,'minutes',t.minutes,'expiresAt',t.expires_at,'revision',t.revision,'serverNow',sampled_at,'usageDay',t.usage_day,'pendingDay',t.enabled and t.usage_day<today);
end;
$$;
create function public.kanto_control_device_play_time(p_child_id uuid,p_device_id uuid,p_action text,p_minutes integer,p_expected integer,p_request_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t kanto_device_play_time;
begin
  if p_action is null or p_action not in ('start','lock','disable','configure') or p_minutes is null or p_minutes not between 1 and 120 or p_expected is null or p_expected < 0 or p_request_id is null then
    raise exception 'INVALID_INPUT';
  end if;
  perform 1 from kanto_devices where id=p_device_id and child_id=p_child_id and revoked_at is null and expires_at>clock_timestamp() for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  insert into kanto_device_play_time(device_id) values(p_device_id) on conflict do nothing;
  select * into t from kanto_device_play_time where device_id=p_device_id for update;
  -- A retried start never grants a fresh deadline.
  if t.request_id=p_request_id then return kanto_device_play_time_state(p_child_id,p_device_id,false); end if;
  if t.revision<>p_expected then raise exception 'PLAY_TIME_CHANGED'; end if;
  update kanto_device_play_time set
    usage_day=case when p_action='configure' then usage_day else (clock_timestamp() at time zone 'Asia/Shanghai')::date end,
    enabled=case p_action when 'start' then true when 'lock' then true when 'disable' then false else enabled end,
    minutes=p_minutes,
    expires_at=case p_action when 'start' then least(clock_timestamp()+make_interval(mins=>p_minutes), (((clock_timestamp() at time zone 'Asia/Shanghai')::date+1)::timestamp at time zone 'Asia/Shanghai')) when 'lock' then null when 'disable' then null else expires_at end,
    revision=revision+1,request_id=p_request_id
  where device_id=p_device_id;
  return kanto_device_play_time_state(p_child_id,p_device_id,false);
end;
$$;
create function public.kanto_device_learning_save(p_child_id uuid,p_device_id uuid,p_expected integer,p_state jsonb,p_parent boolean default false) returns boolean
language plpgsql security definer set search_path='' as $$
declare t jsonb;
begin
 perform 1 from public.kanto_children where id=p_child_id for update;
 if not found then raise exception 'NOT_FOUND'; end if;
 if not p_parent then
   t:=public.kanto_device_play_time_state(p_child_id,p_device_id,true);
   if (t->>'enabled')::boolean and (t->>'expiresAt' is null or (t->>'expiresAt')::timestamptz<=clock_timestamp()) then raise exception 'PLAY_TIME_LOCKED'; end if;
 end if;
 insert into public.kanto_learning(child_id) values(p_child_id) on conflict do nothing;
 update public.kanto_learning set state=p_state,revision=revision+1 where child_id=p_child_id and revision=p_expected;
 return found;
end;
$$;
revoke all on function public.kanto_device_play_time_state(uuid,uuid,boolean) from public,anon,authenticated;
grant execute on function public.kanto_device_play_time_state(uuid,uuid,boolean) to service_role;
revoke all on function public.kanto_control_device_play_time(uuid,uuid,text,integer,integer,uuid) from public,anon,authenticated;
grant execute on function public.kanto_control_device_play_time(uuid,uuid,text,integer,integer,uuid) to service_role;
revoke all on function public.kanto_device_learning_save(uuid,uuid,integer,jsonb,boolean) from public,anon,authenticated;
grant execute on function public.kanto_device_learning_save(uuid,uuid,integer,jsonb,boolean) to service_role;
notify pgrst, 'reload schema';
commit;
