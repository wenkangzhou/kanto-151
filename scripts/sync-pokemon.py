"""Development-only importer. The app never calls PokéAPI at runtime."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data/.cache"
CACHE.mkdir(parents=True, exist_ok=True)
ART = ROOT / "public/pokemon"
ART.mkdir(parents=True, exist_ok=True)

def download(url, target):
    if target.exists():
        return target.read_bytes()
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Kanto151-static-data-import/1.0"})
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
            target.write_bytes(data)
            return data
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)

def fetch(i):
    pokemon = json.loads(download(f"https://pokeapi.co/api/v2/pokemon/{i}/", CACHE / f"pokemon-{i}.json"))
    species = json.loads(download(f"https://pokeapi.co/api/v2/pokemon-species/{i}/", CACHE / f"species-{i}.json"))
    source = pokemon["sprites"]["other"]["official-artwork"]["front_default"]
    download(source, ART / f"{i}.png")
    names = {n["language"]["name"]: n["name"] for n in species["names"]}
    descriptions = [v["flavor_text"] for v in species["flavor_text_entries"] if v["language"]["name"] == "zh-hans"]
    description = descriptions[-1].replace("\n", "").replace("\f", "") if descriptions else "每一次相遇，都是新的发现。"
    types = [v["type"]["name"] for v in pokemon["types"]]
    era = [t for t in types if t != "steel"]
    era = ["normal" if t == "fairy" else t for t in era]
    if i == 122:
        era = ["psychic"]
    parent = species["evolves_from_species"]
    parent_id = int(parent["url"].strip("/").split("/")[-1]) if parent else None
    if parent_id and parent_id > 151:
        parent_id = None
    return {
        "id": i, "name": names["zh-hans"], "traditionalName": names["zh-hant"],
        "englishName": names["en"], "types": types, "kantoEraTypes": era,
        "stats": {s["stat"]["name"]: s["base_stat"] for s in pokemon["stats"]},
        "height": pokemon["height"] / 10, "weight": pokemon["weight"] / 10,
        "description": description, "evolvesFrom": parent_id,
        "artwork": f"/pokemon/{i}.png", "artworkSource": source,
        "category": "legendary" if i in [144, 145, 146, 150, 151] else "evolution" if parent_id else "exploration",
        "rarity": "veryRare" if pokemon["base_experience"] and pokemon["base_experience"] > 180 else "rare" if species["capture_rate"] < 100 else "common"
    }

if __name__ == "__main__":
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        records = list(executor.map(fetch, range(1, 152)))
    descriptions = json.loads((ROOT / "src/data/descriptions.json").read_text())
    for record in records:
        record["description"] = descriptions.get(str(record["id"]), record["description"])
    chapters = [
        {"id": 1, "name": "真新镇的初次相遇", "location": "真新镇 · 1 号道路", "description": "从家门口出发，认识最初的伙伴。", "pokemonIds": [1, 4, 7, 16, 19]},
        {"id": 2, "name": "常青森林的秘密", "location": "常青森林", "description": "拨开叶子，听听森林里的小小声音。", "pokemonIds": [10, 13, 25, 43, 46]},
        {"id": 3, "name": "月见山的星光", "location": "尼比市 · 月见山", "description": "沿着山路，寻找岩石和星光中的朋友。", "pokemonIds": [27, 35, 41, 74, 39]},
        {"id": 4, "name": "水边的冒险日记", "location": "华蓝市 · 枯叶市", "description": "在河岸与港口，发现不一样的生活。", "pokemonIds": [54, 60, 72, 98, 129]},
        {"id": 5, "name": "城市里的新朋友", "location": "玉虹市 · 金黄市", "description": "再繁忙的城市，也藏着有趣的相遇。", "pokemonIds": [52, 58, 63, 66, 133]},
        {"id": 6, "name": "通往远方的勇气", "location": "浅红市 · 红莲岛", "description": "带着好奇心，去看看更远的关都。", "pokemonIds": [77, 81, 92, 111, 147]}
    ]
    story_ids = {i for c in chapters for i in c["pokemonIds"]}
    for record in records:
        if record["id"] in story_ids:
            assert record["category"] == "exploration"
            record["category"] = "story"
    (ROOT / "src/data/pokemon.json").write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "src/data/chapters.json").write_text(json.dumps(chapters, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "src/data/provenance.json").write_text(json.dumps({"importedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(), "source": "https://pokeapi.co/docs/v2", "count": len(records), "note": "Default forms only. Current main-series types and base stats; assets and metadata stored locally."}, indent=2) + "\n")
    print(f"Saved {len(records)} Pokémon, artwork files, and {len(chapters)} chapters.")
