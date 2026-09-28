"""Generate USUM level-50 3+1 learnsets from cached PokeAPI CSVs.

Only direct attacks with positive fixed base power are supported. The practice
engine normalizes these to one power-40 hit, without move-specific effects.
"""
import csv, io, json, urllib.request, hashlib
from pathlib import Path
root = Path(__file__).resolve().parents[1]
cache = Path('/tmp/kanto-battle-cache'); cache.mkdir(exist_ok=True)
def rows(name):
    file = cache / (name + '.csv')
    if not file.exists():
        with urllib.request.urlopen('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/' + name + '.csv', timeout=120) as response:
            file.write_bytes(response.read())
    return list(csv.DictReader(io.StringIO(file.read_text())))
types = {r['id']: r['identifier'] for r in rows('types')}
names = {r['move_id']: r['name'] for r in rows('move_names') if r['local_language_id'] == '12'}
all_moves = rows('moves')
moves = {r['id']: {'id': r['identifier'], 'name': names[r['id']], 'type': types[r['type_id']], 'category': {'2': 'physical', '3': 'special'}[r['damage_class_id']]}
         for r in all_moves if r['id'] in names and r['damage_class_id'] in ['2', '3'] and r['power'] and int(r['power']) > 0}
learnsets = {str(i): {'level': {}, 'machine': {}} for i in range(1, 152)}
for r in rows('pokemon_moves'):
    if r['pokemon_id'] not in learnsets or r['version_group_id'] != '18' or r['move_id'] not in moves:
        continue
    source = 'level' if r['pokemon_move_method_id'] == '1' and int(r['level']) <= 50 else 'machine' if r['pokemon_move_method_id'] == '4' else None
    if source:
        pool = learnsets[r['pokemon_id']][source]
        move = {**moves[r['move_id']], **({'level': int(r['level'])} if source == 'level' else {})}
        if move['id'] not in pool or source == 'level' and move['level'] < pool[move['id']]['level']:
            pool[move['id']] = move
for pools in learnsets.values():
    for source in ['level', 'machine']:
        pools[source] = sorted(pools[source].values(), key=lambda m: (m.get('level', 0), m['id']))
metadata = {'ruleset': 'usum-50-v1', 'versionGroupId': 18, 'version': '究极之日／究极之月', 'level': 50,
            'source': 'https://github.com/PokeAPI/pokeapi/tree/master/data/v2/csv',
            'sha256': {name: hashlib.sha256((cache/(name+'.csv')).read_bytes()).hexdigest() for name in ['types', 'move_names', 'moves', 'pokemon_moves']}}
(root/'src/data/battle-learnsets.json').write_text(json.dumps({'meta': metadata, 'pokemon': learnsets}, ensure_ascii=False, indent=2)+'\n')
# Keep the compact default list for scripts generating voice previews/manifests.
pokemon = json.loads((root/'src/data/pokemon.json').read_text())
def rank(p, m):
    stat = 'attack' if m['category'] == 'physical' else 'special-attack'
    return (m['type'] not in p['types'], -p['stats'][stat], -m.get('level', 0), m['id'])
defaults = {}
for p in pokemon:
    pools = learnsets[str(p['id'])]
    level = sorted(pools['level'], key=lambda m: rank(p, m))[:3]
    machine = sorted((m for m in pools['machine'] if m['id'] not in {x['id'] for x in level}), key=lambda m: (m['type'] in {x['type'] for x in level}, *rank(p, m)))[:1]
    defaults[str(p['id'])] = level + machine or [{'id':'struggle','name':'挣扎','type':'normal','category':'physical','fallback':True}]
(root/'src/data/battle-moves.json').write_text(json.dumps(defaults, ensure_ascii=False, indent=2)+'\n')
exceptions = [f"| {p['id']:03} {p['name']} | {len(learnsets[str(p['id'])]['level'])} | {len(learnsets[str(p['id'])]['machine'])} |" for p in pokemon if len(learnsets[str(p['id'])]['level']) < 3]
report = '# 50 级招式覆盖统计\n\n固定版本：究极之日／究极之月（version_group_id=18）。来源和文件校验值见 battle-learnsets.json。\n\n范围：升级方式 1 且等级 ≤50（含初始／进化时等级 0），学习器方式 4；不含教学、遗传及跨版本记录。只收录正数固定基础威力的物理／特殊攻击，不收录变化、固定伤害、反击及不定威力招式。练习模式统一为一次威力 40 的攻击，不模拟命中、PP、连击、反伤等附加机制。\n\n默认升级招式按本系优先、适合自身攻击能力优先、学习等级较高优先，最后按招式 ID 稳定排序，取最多三个；学习器位优先增加一种尚未覆盖的属性，其余同上。不要求升级招式属性互不相同；相同招式不重复装备。双方使用相同合法池，敌方使用默认配置。\n\n## 升级攻击招式不足三个的伙伴\n\n| 伙伴 | 升级攻击数 | 学习器攻击数 |\n|---|---:|---:|\n'+'\n'.join(exceptions)+'\n\n铁甲蛹、铁壳蛹、百变怪使用挣扎兜底。凯西虽然没有升级攻击招式，但可以使用一个学习器攻击招式。槽位不足不跨来源补齐，不继承其他形态的招式池。\n'
(root/'docs/battle-learnsets.md').write_text(report)
print('Generated 151 species; exceptions:', len(exceptions), 'unique moves:',len({m['id'] for pools in learnsets.values() for pool in pools.values() for m in pool}))
