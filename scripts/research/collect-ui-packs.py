#!/usr/bin/env python3
"""Provenance-first HUD/UI acquisition. No downloaded binary is committed to Git.
Downloads are kept separate from reviewed, selected PNGs and from game builds.
"""
import hashlib
import io
import json
import os
import pathlib
import shutil
import sys
import time
import urllib.request
import zipfile
from datetime import datetime, timezone

DEST = pathlib.Path("artifacts/dungeon-zero-ui-intake")
RAW = DEST / "original-sources"
READY = DEST / "ready-to-evaluate"
INSPECTION = DEST / "inspection-only"
DEST.mkdir(parents=True, exist_ok=True)
for folder in (RAW, READY, INSPECTION):
    folder.mkdir(exist_ok=True)

SOURCES = [
    dict(id="kenney-fantasy-borders", creator="Kenney", license="CC0",
         upstream="https://opengameart.org/content/fantasy-ui-borders",
         official="https://kenney.nl/assets/fantasy-ui-borders",
         url="https://opengameart.org/sites/default/files/kenney_fantasy-ui-borders.zip",
         filename="kenney_fantasy-ui-borders.zip", form="zip", gate="ready",
         role="9-slice inventory, paper panels, dialogue window frames"),
    dict(id="kenney-rpg-ui", creator="Kenney", license="CC0",
         upstream="https://opengameart.org/content/ui-pack-rpg-extension",
         official="https://kenney.nl/assets/ui-pack-rpg-expansion",
         url="https://opengameart.org/sites/default/files/UIpack_RPG.zip",
         filename="UIpack_RPG.zip", form="zip", gate="ready",
         role="buttons, sliders, inventory and stat widgets"),
    dict(id="kenney-mobile-controls", creator="Kenney", license="CC0",
         upstream="https://opengameart.org/content/mobile-controls",
         official="https://kenney.nl/assets/mobile-controls",
         url="https://opengameart.org/sites/default/files/mobile-controls-1.0.zip",
         filename="mobile-controls-1.0.zip", form="zip", gate="ready",
         role="mobile on-screen attacks, dodge and touch controls"),
    dict(id="melle-fantasy-gui-1", creator="MELLE", license="CC0",
         upstream="https://opengameart.org/content/fantasy-gui-0",
         url="https://opengameart.org/sites/default/files/GUI%201.png",
         filename="GUI 1.png", form="png", gate="ready",
         role="fantasy button states, slot plates and HP colors"),
    dict(id="melle-fantasy-gui-2", creator="MELLE", license="CC0",
         upstream="https://opengameart.org/content/fantasy-gui-0",
         url="https://opengameart.org/sites/default/files/GUI%202.png",
         filename="GUI 2.png", form="png", gate="ready",
         role="secondary fantasy panel and decoration palette"),
    dict(id="systemg6-rpg-ui", creator="System G6/Qoma", license="CC0 page; embedded borrowed works require review",
         upstream="https://opengameart.org/content/rpg-ui-1",
         url="https://opengameart.org/sites/default/files/rpg_ui_0.7z",
         filename="rpg_ui_0.7z", form="7z", gate="inspection-only",
         role="MMORPG ornamental HUD, HP/MP bars and slots; upstream credits skull/scrolls"),
    dict(id="game-hud-mit", creator="Aron & Sharon / threejsassets", license="MIT",
         upstream="https://github.com/threejsassets/game-hud",
         url="https://github.com/threejsassets/game-hud/archive/refs/heads/main.zip",
         filename="game-hud-main.zip", form="zip", gate="inspection-only",
         role="60+ component HTML/CSS reference, fantasy skin and layout; keep MIT notice"),
]

def sha256(data):
    return hashlib.sha256(data).hexdigest()

def download(url):
    error = None
    for attempt in range(3):
        try:
            request = urllib.request.Request(url, headers={"User-Agent": "DungeonZero-UI-Intake/1.0 (research; public assets)", "Accept": "*/*"})
            with urllib.request.urlopen(request, timeout=55) as response:
                body = response.read(55 * 1024 * 1024 + 1)
                if len(body) > 55 * 1024 * 1024: raise ValueError("File too large >55 MiB")
                return body, response.geturl(), response.headers.get("content-type", "")
        except Exception as exc:
            error = exc
            time.sleep(attempt + 1)
    raise RuntimeError(str(error))

def valid(data, form):
    if form == "zip": return zipfile.is_zipfile(io.BytesIO(data))
    if form == "png": return data.startswith(bytes.fromhex("89504e470d0a1a0a"))
    if form == "7z": return data.startswith(bytes.fromhex("377abcaf271c"))
    return False

def extract_sample_pngs(data, item):
    chosen = []
    try:
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            files = [f for f in z.infolist()
                     if not f.is_dir() and f.filename.lower().endswith(".png")
                     and not f.filename.startswith("/") and ".." not in pathlib.PurePosixPath(f.filename).parts
                     and f.file_size < 5 * 1024 * 1024]
            # Prefer separated sprites over spritesheets for future CSS crop/mapping.
            files.sort(key=lambda f: ("sheet" in f.filename.lower(), len(f.filename), f.filename.lower()))
            for index, info in enumerate(files[:24]):
                payload = z.read(info)
                if not valid(payload, "png"): continue
                dst = READY / item["id"] / (str(index).zfill(2) + "-" + pathlib.Path(info.filename).name)
                dst.parent.mkdir(parents=True, exist_ok=True)
                dst.write_bytes(payload)
                chosen.append(str(dst.relative_to(DEST)))
            return {"archiveEntries": len(z.infolist()), "pngEntries": len(files),
                    "samplePng": chosen, "firstEntries": [f.filename for f in z.infolist()[:30]]}
    except Exception as exc:
        return {"archiveError": str(exc)}

results = []
for item in SOURCES:
    report = {key: item[key] for key in ("id", "creator", "license", "upstream", "url", "filename", "form", "gate", "role")}
    if item.get("official"): report["official"] = item["official"]
    try:
        contents, final_url, content_type = download(item["url"])
        if not valid(contents, item["form"]):
            raise ValueError("Unexpected binary signature/content type: " + str(content_type) + " URL " + final_url)
        path = (INSPECTION if item["gate"] == "inspection-only" else RAW) / item["filename"]
        path.write_bytes(contents)
        report.update(status="downloaded", bytes=len(contents), sha256=sha256(contents), saved=str(path.relative_to(DEST)),
                      resolvedUrl=final_url, contentType=content_type)
        if item["form"] == "zip":
            report.update(extract_sample_pngs(contents, item) if item["gate"] == "ready" else {})
        elif item["form"] == "png":
            path2 = READY / item["id"] / item["filename"].replace(" ", "_")
            path2.parent.mkdir(parents=True, exist_ok=True)
            shutil.copyfile(path, path2)
            report["samplePng"] = [str(path2.relative_to(DEST))]
    except Exception as exc:
        report.update(status="download-failed", error=str(exc))
    results.append(report)
    print(json.dumps({k: report.get(k) for k in ("id", "status", "bytes", "error", "pngEntries")}, ensure_ascii=False), flush=True)

# Explicit legal segregation: neither unreviewed System G6 nor reference-only
# MIT source can silently become game art.
summary = {
    "generatedAt": datetime.now(timezone.utc).isoformat(),
    "scope": "preparation only - not imported into game or published on Firebase",
    "officialPacksDownloaded": sum(r["status"] == "downloaded" for r in results),
    "readyLicensedPacksDownloaded": sum(r["status"] == "downloaded" and r["gate"] == "ready" for r in results),
    "criticalMissing": [r["id"] for r in results if r["gate"] == "ready" and r["status"] != "downloaded"],
    "items": results,
}
(DEST / "intake-manifest.json").write_text(json.dumps(summary, indent=2, ensure_ascii=False), encoding="utf-8")
(DEST / "README.md").write_text("""# Dungeon ZERO — HUD/UI original source intake (research package)

Every `original-sources/` file is an original downloaded pack (not a mock).
Every `ready-to-evaluate/` PNG is selected directly from those original CC0 archives;
the complete sources remain available to make more deliberate selections.
`inspection-only/` contains unintegrated candidates with additional restrictions:
System G6 RPG UI acknowledges third-party skull/scroll assets; review each before use.
Game HUD uses MIT; retain the included license, do not copy without preserving it.

`intake-manifest.json` captures original URLs, final redirects, actual sizes, SHA256,
download failures and file contents for ZIPs. Never treat a directory name alone
as proof of licensing. The candidate source pages were checked 2026-10-13.

Next implementation: confirm 9-slice border sprites and actual transparent PNG edges;
map existing classic HUD elements to source paths; review mobile tap targets >=44px,
desktop/mid-size/390px; keep game save schema v1 and current gameplay untouched.

Do not add entire raw packs to client/public or deploy from this package.
""", encoding="utf-8")

try:
    from PIL import Image, ImageOps, ImageDraw
    examples = [p for p in READY.rglob("*.png")]
    examples = examples[:72]
    tile_w, tile_h, columns = 185, 140, 6
    rows = (len(examples) + columns - 1) // columns
    if examples:
        sheet = Image.new("RGB", (columns * tile_w, rows * tile_h + 38), (25, 27, 34))
        pen = ImageDraw.Draw(sheet)
        pen.text((12, 12), "Dungeon ZERO / original licensed UI sprites / preview", fill=(240, 218, 165))
        for i, file in enumerate(examples):
            try:
                sprite = Image.open(file).convert("RGBA")
                sprite.thumbnail((160, 92))
                x = (i % columns) * tile_w + (tile_w - sprite.width)//2
                y = 38 + (i // columns)*tile_h + 6
                sheet.paste(sprite, (x, y), sprite)
                pen.text(((i % columns)*tile_w + 6, 38 + (i//columns)*tile_h + 105),
                         (file.parent.name[:12] + "/" + file.stem[:11]), fill=(210, 205, 183))
            except Exception:
                pass
        sheet.save(DEST / "candidate-contact-sheet.png")
        print("CONTACT SHEET:", len(examples), "pngs")
except Exception as exc:
    print("Preview unavailable:", exc)

# Packaged artifact should always report facts, even after partial network failures.
if summary["readyLicensedPacksDownloaded"] < 3:
    print("WARN: Fewer than 3 ready licensed packs fetched; investigate manifest", file=sys.stderr)
    sys.exit(1)
print("SOURCE INTAKE COMPLETE:", summary["officialPacksDownloaded"], "downloaded;",
      summary["readyLicensedPacksDownloaded"], "ready CC0")
