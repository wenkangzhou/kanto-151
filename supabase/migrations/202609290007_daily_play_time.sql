begin;
-- Preserve today's active/locked state when upgrading an existing family.
alter table public.kanto_play_time add column usage_day date not null default ((now() at time zone 'Asia/Shanghai')::date);

create or replace function public.kanto_play_time_state(p_child_id uuid) returns jsonb
language plpgsql security definer set search_path = public as $$
declare t kanto_play_time; sampled_at timestamptz; today date;
begin
  select * into t from kanto_play_time where child_id=p_child_id for update;
  sampled_at := clock_timestamp();
  today := (sampled_at at time zone 'Asia/Shanghai')::date;
  if t.enabled and t.usage_day < today then
    update kanto_play_time set usage_day=today,
      expires_at=least(sampled_at+make_interval(mins=>minutes), (today+1)::timestamp at time zone 'Asia/Shanghai'),
      revision=revision+1
    where child_id=p_child_id returning * into t;
  end if;
  return jsonb_build_object('enabled',coalesce(t.enabled,false),'minutes',coalesce(t.minutes,20),
    'expiresAt',t.expires_at,'revision',coalesce(t.revision,0),'serverNow',sampled_at,'usageDay',t.usage_day);
end;
$$;

-- Applies to explicit parent starts as well as automatic daily renewal.
create function public.kanto_play_time_day_stamp() returns trigger
language plpgsql set search_path = public as $$
begin
  if new.request_id is distinct from old.request_id then
    new.usage_day := (clock_timestamp() at time zone 'Asia/Shanghai')::date;
    if new.expires_at is not null then
      new.expires_at := least(new.expires_at, (new.usage_day+1)::timestamp at time zone 'Asia/Shanghai');
    end if;
  end if;
  return new;
end;
$$;
create trigger kanto_play_time_day_stamp before update on public.kanto_play_time
for each row execute function public.kanto_play_time_day_stamp();
revoke all on function public.kanto_play_time_day_stamp() from public,anon,authenticated;
notify pgrst, 'reload schema';
commit;
