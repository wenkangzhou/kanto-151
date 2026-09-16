"""Cache PokeAPI CSV source; select up to three simple moves from actual learnsets."""
import csv, io, json, urllib.request
from pathlib import Path
root=Path(__file__).resolve().parents[1]
cache=Path('/tmp/kanto-battle-cache');cache.mkdir(exist_ok=True)
def rows(name):
    file=cache/(name+'.csv')
    if not file.exists():
        with urllib.request.urlopen('https://raw.githubusercontent.com/PokeAPI/pokeapi/master/data/v2/csv/'+name+'.csv', timeout=120) as r:file.write_bytes(r.read())
    return csv.DictReader(io.StringIO(file.read_text()))
types={r['id']:r['identifier'] for r in rows('types')}
names={r['move_id']:r['name'] for r in rows('move_names') if r['local_language_id']=='12'}
preferred='tackle scratch pound quick-attack ember water-gun vine-whip razor-leaf thunder-shock confusion gust peck wing-attack bite bug-bite poison-sting acid rock-throw mud-slap powder-snow ice-shard lick dragon-breath fairy-wind disarming-voice metal-claw karate-chop low-kick swift psychic surf thunderbolt flamethrower absorb struggle'.split()
moves={r['id']:{'id':r['identifier'],'name':names[r['id']],'type':types[r['type_id']]} for r in rows('moves') if r['identifier'] in preferred}
learnable={str(i):{} for i in range(1,152)}
for r in rows('pokemon_moves'):
    if r['pokemon_id'] in learnable and r['move_id'] in moves:
        learnable[r['pokemon_id']].setdefault(r['move_id'],{'versionGroupId':int(r['version_group_id']),'learnMethodId':int(r['pokemon_move_method_id'])})
result={}
for p in json.loads((root/'src/data/pokemon.json').read_text()):
    candidates=list(learnable[str(p['id'])])
    candidates.sort(key=lambda n:(moves[n]['type'] not in p['types'],preferred.index(moves[n]['id'])))
    chosen=[];seen=set()
    for n in candidates:
        if moves[n]['type'] not in seen:
            chosen.append({**moves[n],**learnable[str(p['id'])][n]});seen.add(moves[n]['type'])
        if len(chosen)==3:break
    if not chosen:chosen=[{'id':'struggle','name':'挣扎','type':'normal','fallback':True}]
    result[str(p['id'])]=chosen
(root/'src/data/battle-moves.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n')
print('Saved',len(result),'species')
