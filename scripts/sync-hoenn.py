"""Import a static, read-only original Hoenn Pokédex. No runtime API calls."""
import concurrent.futures
import datetime
import json
from pathlib import Path
import time
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
CACHE = ROOT / "data/.cache/hoenn"
ART = ROOT / "public/hoenn/pokemon"
OUTPUT = ROOT / "src/data/hoenn-pokemon.json"
DESCRIPTION_OVERRIDES = json.loads((ROOT / "scripts/hoenn-description-overrides.json").read_text())
NAME_OVERRIDES = {312: "负电拍拍"}
CACHE.mkdir(parents=True, exist_ok=True)
ART.mkdir(parents=True, exist_ok=True)


def download(url, target):
    if target.exists():
        return target.read_bytes()
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "Kanto151-Hoenn-preview/1.0"})
            with urllib.request.urlopen(request, timeout=45) as response:
                data = response.read()
            target.write_bytes(data)
            return data
        except Exception:
            if attempt == 3:
                raise
            time.sleep(attempt + 1)


def english_description(species):
    entries = {entry["version"]["name"]: entry["flavor_text"] for entry in species["flavor_text_entries"] if entry["language"]["name"] == "en"}
    text = next((entries[version] for version in ("emerald", "ruby", "sapphire") if version in entries), None)
    if text is None:
        raise ValueError(f"Missing English Hoenn description for {species['id']}")
    name = next(entry["name"] for entry in species["names"] if entry["language"]["name"] == "en")
    return " ".join(text.replace("\u00ad", "").replace("-\n", "-").replace("\n", " ").replace("\f", " ").split()).replace("POKéMON", "Pokémon").replace(name.upper(), name)


def fetch(number):
    pokemon = json.loads(download(f"https://pokeapi.co/api/v2/pokemon/{number}/", CACHE / f"pokemon-{number}.json"))
    species = json.loads(download(f"https://pokeapi.co/api/v2/pokemon-species/{number}/", CACHE / f"species-{number}.json"))
    assert pokemon["id"] == species["id"] == number
    artwork_source = pokemon["sprites"]["other"]["official-artwork"]["front_default"]
    download(artwork_source, ART / f"{number}.png")
    names = {entry["language"]["name"]: entry["name"] for entry in species["names"]}
    descriptions = [entry["flavor_text"] for entry in species["flavor_text_entries"] if entry["language"]["name"] == "zh-hans"]
    genera = {entry["language"]["name"]: entry["genus"] for entry in species["genera"]}
    parent = species["evolves_from_species"]
    parent_id = int(parent["url"].strip("/").split("/")[-1]) if parent else None
    if parent_id and parent_id > 386:
        parent_id = None
    return {
        "id": number,
        "name": NAME_OVERRIDES.get(number, names["zh-hans"]),
        "traditionalName": names["zh-hant"],
        "englishName": names["en"],
        "genus": genera["zh-hans"],
        "types": [entry["type"]["name"] for entry in pokemon["types"]],
        "stats": {entry["stat"]["name"]: entry["base_stat"] for entry in pokemon["stats"]},
        "description": descriptions[-1].replace("\n", "").replace("\f", "") if descriptions else DESCRIPTION_OVERRIDES.get(str(number), f"{names['zh-hans']}是{genera['zh-hans']}。"),
        "englishDescription": english_description(species),
        "evolvesFrom": parent_id,
        "height": pokemon["height"] / 10,
        "weight": pokemon["weight"] / 10,
        "artwork": f"/hoenn/pokemon/{number}.png",
        "artworkSource": artwork_source,
    }


if __name__ == "__main__":
    generation = json.loads(download("https://pokeapi.co/api/v2/generation/3/", CACHE / "generation-3.json"))
    ids = sorted(int(item["url"].strip("/").split("/")[-1]) for item in generation["pokemon_species"])
    assert ids == list(range(252, 387)), "Hoenn preview expects the 135 newly introduced species"
    regional = json.loads(download("https://pokeapi.co/api/v2/pokedex/4/", CACHE / "original-hoenn.json"))
    entries = sorted(regional["pokemon_entries"], key=lambda item: item["entry_number"])
    regional_ids = [int(item["pokemon_species"]["url"].strip("/").split("/")[-1]) for item in entries]
    assert len(regional_ids) == 202 and len(set(regional_ids)) == 202
    assert set(ids).issubset(regional_ids) and all(1 <= number <= 386 for number in regional_ids)
    with concurrent.futures.ThreadPoolExecutor(max_workers=8) as executor:
        records = list(executor.map(fetch, ids))
    OUTPUT.write_text(json.dumps(records, ensure_ascii=False, indent=2) + "\n")
    (ROOT / "src/data/hoenn-regional-order.json").write_text(json.dumps(regional_ids, indent=2) + "\n")
    (ROOT / "src/data/hoenn-provenance.json").write_text(json.dumps({
        "importedAt": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "source": "https://pokeapi.co/docs/v2",
        "generation": "generation-iii",
        "regionalPokedex": "hoenn",
        "count": len(records),
        "note": "Default forms and current types; evolution parents beyond the original 386 are omitted. Artwork is stored locally. Preview data is separate from all collection records."
    }, indent=2) + "\n")
    print(f"Saved {len(records)} Hoenn Pokémon and their artwork.")
