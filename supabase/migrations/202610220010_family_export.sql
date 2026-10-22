-- A single statement gives all sections the same database snapshot.
-- Credentials, PIN hashes, pairing codes and rate-limit buckets are deliberately excluded.
begin;
create function public.kanto_export_family(p_child_id uuid) returns jsonb
language sql stable security definer set search_path='' as $$
select jsonb_build_object(
'family', (select jsonb_build_object('id',f.id,'name',f.name,'created_at',f.created_at) from public.kanto_families f join public.kanto_children c on c.family_id=f.id where c.id=p_child_id),
'child', (select to_jsonb(c) from public.kanto_children c where c.id=p_child_id),
'reward_codes', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_reward_codes t where t.child_id=p_child_id),
'inventory', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_inventory t where t.child_id=p_child_id),
'receipts', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_receipts t where t.child_id=p_child_id),
'pokemon_collection', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_pokemon_collection t where t.child_id=p_child_id),
'story_progress', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_story_progress t where t.child_id=p_child_id),
'legendary_progress', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_legendary_progress t where t.child_id=p_child_id),
'team', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_team t where t.child_id=p_child_id),
'move_presets', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_move_presets t where t.child_id=p_child_id),
'learning', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_learning t where t.child_id=p_child_id),
'play_time', (select coalesce(jsonb_agg(to_jsonb(t) order by to_jsonb(t)::text),'[]'::jsonb) from public.kanto_play_time t where t.child_id=p_child_id),
'devices', (select coalesce(jsonb_agg(jsonb_build_object('id',d.id,'child_id',d.child_id,'name',d.name,'created_at',d.created_at,'expires_at',d.expires_at,'revoked_at',d.revoked_at) order by d.id),'[]'::jsonb) from public.kanto_devices d where d.child_id=p_child_id),
'device_play_time', (select coalesce(jsonb_agg(to_jsonb(t) order by t.device_id),'[]'::jsonb) from public.kanto_device_play_time t join public.kanto_devices d on d.id=t.device_id where d.child_id=p_child_id)
);
$$;
revoke all on function public.kanto_export_family(uuid) from public,anon,authenticated;
grant execute on function public.kanto_export_family(uuid) to service_role;
commit;
