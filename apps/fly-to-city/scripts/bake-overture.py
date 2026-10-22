"""用 Overture Maps 2026-10-21.0 重写各地标建筑轮廓与基础高度。

高度优先级的前半段在这里完成：Overture height > num_floors*3.2 > 启发式。
官方测量、CMAB、CNBH 由 enrich-heights.py 覆盖，不在这一步下载。
运行时读 height / ring / levels / facade，src 只用于统计。
"""
from __future__ import annotations

import json
import math
import sys
from collections import Counter, defaultdict
from pathlib import Path

import duckdb

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"
RELEASE = "s3://overturemaps-us-west-2/release/2026-10-21.0"
BUILDING = f"{RELEASE}/theme=buildings/type=building/*"
PARTS = f"{RELEASE}/theme=buildings/type=building_part/*"

LANDMARKS = [
    ("shanghai-lujiazui", 121.4998, 31.2397, 7000),
    ("beijing-cbd", 116.459, 39.909, 7000),
    ("hongkong-central", 114.158, 22.281, 7000),
    ("tokyo-shinjuku", 139.7006, 35.6896, 7000),
    ("singapore-marina-bay", 103.859, 1.283, 7000),
    ("sydney-opera", 151.2153, -33.8568, 7000),
    ("nyc-midtown", -73.981, 40.754, 7000),
    ("paris-eiffel", 2.2945, 48.8584, 7000),
]

HEUR = {
    "house": 8,
    "residential": 18,
    "apartments": 24,
    "commercial": 28,
    "retail": 12,
    "industrial": 12,
    "office": 48,
    "hotel": 36,
    "education": 16,
    "public": 18,
    "agricultural": 6,
    "skyscraper": 140,
}

OFFICE = {"office", "commercial", "hotel", "public", "skyscraper", "hospital", "civic"}
HOME = {"house", "residential", "apartments", "dormitory"}
LOW = {"retail", "industrial", "warehouse", "agricultural", "garage", "shed"}


def meters_per_lng(lat: float) -> float:
    return 111320 * math.cos(math.radians(lat))


def bbox(lng: float, lat: float, extent: float):
    half = extent / 2
    dlat = half / 111320
    dlng = half / meters_per_lng(lat)
    return lng - dlng, lat - dlat, lng + dlng, lat + dlat


def to_local(lng: float, lat: float, clng: float, clat: float):
    x = (lng - clng) * meters_per_lng(clat)
    z = -(lat - clat) * 111320
    return x, z


def ring_area(ring: list[list[float]]) -> float:
    a = 0.0
    for i, p in enumerate(ring):
        q = ring[(i + 1) % len(ring)]
        a += p[0] * q[1] - q[0] * p[1]
    return abs(a) / 2


def exterior(geo: dict) -> list[list[float]] | None:
    t = geo.get("type")
    coords = geo.get("coordinates")
    if t == "Polygon" and coords:
        return coords[0]
    if t == "MultiPolygon" and coords:
        best = None
        best_a = -1.0
        for poly in coords:
            if not poly:
                continue
            a = ring_area([[p[0], p[1]] for p in poly[0]])
            if a > best_a:
                best_a = a
                best = poly[0]
        return best
    return None


def facade_for(subtype: str | None, klass: str | None, height: float) -> int:
    key = (subtype or klass or "").lower()
    if key in HOME:
        return 1
    if key in LOW:
        return 2
    if key in OFFICE:
        return 0 if height >= 24 else 2
    if height >= 48:
        return 0
    if height <= 14:
        return 2
    return 1


def resolve(height, floors, subtype, klass) -> tuple[float, str, int]:
    levels = None
    if floors is not None:
        try:
            n = int(floors)
            if n >= 1:
                levels = n
        except (TypeError, ValueError):
            levels = None
    if height is not None and float(height) >= 2:
        h = min(float(height), 700.0)
        src = "overture"
    elif levels is not None:
        h = min(levels * 3.2, 700.0)
        src = "floors"
    else:
        key = (subtype or klass or "").lower()
        h = float(HEUR.get(key, 14))
        src = "heuristic"
    if levels is None:
        levels = max(1, round(h / 3.5))
    return h, src, levels


def connect():
    con = duckdb.connect()
    con.execute("INSTALL httpfs; INSTALL spatial;")
    con.execute("LOAD httpfs; LOAD spatial;")
    con.execute("SET s3_region='us-west-2';")
    return con


def fetch(con, west, south, east, north):
    q = f"""
    SELECT id, height, num_floors, class, subtype,
           ST_AsGeoJSON(ST_Force2D(geometry)) AS geo
    FROM read_parquet('{BUILDING}', hive_partitioning=1)
    WHERE bbox.xmax > {west} AND bbox.xmin < {east}
      AND bbox.ymax > {south} AND bbox.ymin < {north}
      AND (is_underground IS NULL OR NOT is_underground)
    """
    return con.execute(q).fetchall()


def fetch_parts(con, west, south, east, north):
    q = f"""
    SELECT id, building_id, height, num_floors,
           ST_AsGeoJSON(ST_Force2D(geometry)) AS geo
    FROM read_parquet('{PARTS}', hive_partitioning=1)
    WHERE bbox.xmax > {west} AND bbox.xmin < {east}
      AND bbox.ymax > {south} AND bbox.ymin < {north}
      AND height >= 12
    """
    try:
        return con.execute(q).fetchall()
    except Exception as e:
        print(f"  建筑部件查询跳过：{e}", flush=True)
        return []


def make_building(bid, height, floors, klass, subtype, geo_s, lng, lat, half):
    geo = json.loads(geo_s)
    ring_ll = exterior(geo)
    if not ring_ll or len(ring_ll) < 4:
        return None
    ring = [list(to_local(p[0], p[1], lng, lat)) for p in ring_ll]
    if ring[0] == ring[-1]:
        ring = ring[:-1]
    if len(ring) < 3:
        return None
    cx = sum(p[0] for p in ring) / len(ring)
    cz = sum(p[1] for p in ring) / len(ring)
    if abs(cx) > half or abs(cz) > half:
        return None
    h, src, levels = resolve(height, floors, subtype, klass)
    return {
        "id": bid,
        "ring": [[round(p[0], 2), round(p[1], 2)] for p in ring],
        "height": round(h, 2),
        "levels": levels,
        "facade": facade_for(subtype, klass, h),
        "use": (subtype or klass or "")[:24],
        "src": src,
        "dist": math.hypot(cx, cz),
        "area": ring_area(ring),
    }


def bake_one(con, city_id: str, lng: float, lat: float, extent: float):
    path = DATA / f"{city_id}.json"
    if not path.exists():
        print(f"跳过 {city_id}：没有现成 JSON")
        return
    west, south, east, north = bbox(lng, lat, extent)
    rows = fetch(con, west, south, east, north)
    half = extent / 2
    buildings = []
    for bid, height, floors, klass, subtype, geo_s in rows:
        b = make_building(bid, height, floors, klass, subtype, geo_s, lng, lat, half)
        if b:
            buildings.append(b)

    # 最高的一批必须留下，避免 3200 栋上限按查询顺序裁掉塔楼。
    ranked = sorted(buildings, key=lambda b: -b["height"])
    tall_ids = {b["id"] for b in ranked[:500]}
    rest = sorted((b for b in buildings if b["id"] not in tall_ids), key=lambda b: b["dist"])
    kept = ranked[:500] + rest
    kept = kept[:3200]
    kept_ids = {b["id"] for b in kept}

    pw, ps, pe, pn = bbox(lng, lat, 2200)
    part_rows = fetch_parts(con, pw, ps, pe, pn)
    parts_by_parent: dict[str, list] = defaultdict(list)
    for pid, parent, height, floors, geo_s in part_rows:
        if parent not in kept_ids:
            continue
        b = make_building(pid, height, floors, None, None, geo_s, lng, lat, half)
        if b:
            parts_by_parent[parent].append(b)

    final = []
    replaced = 0
    for b in kept:
        parts = parts_by_parent.get(b["id"]) or []
        part_area = sum(p["area"] for p in parts)
        if parts and part_area > b["area"] * 0.35:
            for p in parts:
                p["facade"] = b["facade"]
                p["use"] = b["use"]
                final.append(p)
            replaced += 1
        else:
            final.append(b)
    if len(final) > 3400:
        must = [b for b in final if b["height"] >= 60]
        filler = sorted((b for b in final if b["height"] < 60), key=lambda b: b["dist"])
        final = (must + filler)[:3400]

    for b in final:
        b.pop("dist", None)
        b.pop("area", None)
        if not b.get("use"):
            b.pop("use", None)

    doc = json.loads(path.read_text())
    doc["buildings"] = final
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    counts = Counter(b["src"] for b in final)
    total = max(1, len(final))
    order = ("overture", "floors", "heuristic")
    parts = "  ".join(f"{k} {counts[k] / total * 100:.0f}%" for k in order if counts[k])
    heights = [b["height"] for b in final] or [0]
    print(
        f"{city_id}  建筑 {len(final)}/{len(buildings)}  部件替换 {replaced}  最高 {max(heights):.0f}m  {parts}",
        flush=True,
    )


def main():
    want = [a for a in sys.argv[1:] if not a.startswith("-")]
    targets = [t for t in LANDMARKS if not want or t[0] in want]
    con = connect()
    for city_id, lng, lat, extent in targets:
        print(f"查询 Overture {city_id}…", flush=True)
        bake_one(con, city_id, lng, lat, extent)


if __name__ == "__main__":
    main()
