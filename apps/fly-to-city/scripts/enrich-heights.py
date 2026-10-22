"""在 Overture 底图上补真实高度。

优先级：官方测量 > Overture height > 楼层数×3.2 > CMAB > CNBH > 启发式。
前三级已经写在 JSON 的 src 里。这一步只做后面的覆盖：

- 上海 / 北京：CMAB（IoU>0.5）替换启发式，CNBH-10m 分区平均再补剩下的启发式
- 香港：地政总署三维接口是网格场景，没有逐栋高度，改用 CNBH
- 东京新宿：PLATEAU CityGML measuredHeight（新宿区范围内）
- 纽约：Building Footprints height_roof（英尺→米）
- 巴黎：IGN BD TOPO 需要账号，保持 Overture / 楼层数

大文件放在 /tmp/height-data，不进仓库。先运行 scripts/fetch-height-sources.sh。
"""
from __future__ import annotations

import json
import math
import sys
import urllib.parse
import urllib.request
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DATA = ROOT / "public" / "data"
CACHE = Path("/tmp/height-data")

LANDMARKS = {
    "shanghai-lujiazui": (121.4998, 31.2397, 7000, CACHE / "cnbh-sh.tif", CACHE / "cmab-sh.zip"),
    "beijing-cbd": (116.459, 39.909, 7000, CACHE / "cnbh-bj.tif", CACHE / "cmab-bj.zip"),
    "hongkong-central": (114.158, 22.281, 7000, CACHE / "cnbh-hk.tif", None),
    "tokyo-shinjuku": (139.7006, 35.6896, 7000, None, None),
    "singapore-marina-bay": (103.859, 1.283, 7000, None, None),
    "sydney-opera": (151.2153, -33.8568, 7000, None, None),
    "nyc-midtown": (-73.981, 40.754, 7000, None, None),
    "paris-eiffel": (2.2945, 48.8584, 7000, None, None),
}

OFFICE = {"office", "commercial", "hotel", "public", "skyscraper", "hospital", "civic"}
HOME = {"house", "residential", "apartments", "dormitory"}
LOW = {"retail", "industrial", "warehouse", "agricultural", "garage", "shed"}
ORDER = ("plateau", "nyc", "overture", "floors", "cmab", "cnbh", "heuristic")


def meters_per_lng(lat: float) -> float:
    return 111320 * math.cos(math.radians(lat))


def bbox(lng: float, lat: float, extent: float):
    half = extent / 2
    dlat = half / 111320
    dlng = half / max(1.0, meters_per_lng(lat))
    return lng - dlng, lat - dlat, lng + dlng, lat + dlat


def to_ll(x: float, z: float, lng: float, lat: float):
    return lng + x / meters_per_lng(lat), lat - z / 111320


def ring_area(ring: list[list[float]]) -> float:
    a = 0.0
    for i, p in enumerate(ring):
        q = ring[(i + 1) % len(ring)]
        a += p[0] * q[1] - q[0] * p[1]
    return abs(a) / 2


def facade_for(use: str | None, height: float) -> int:
    key = (use or "").lower()
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


def point_in_ring(x: float, z: float, ring: list[list[float]]) -> bool:
    inside = False
    j = len(ring) - 1
    for i, p in enumerate(ring):
        q = ring[j]
        if (p[1] > z) != (q[1] > z):
            denom = q[1] - p[1]
            if abs(denom) > 1e-9:
                xcross = (q[0] - p[0]) * (z - p[1]) / denom + p[0]
                if x < xcross:
                    inside = not inside
        j = i
    return inside


def set_height(b: dict, h: float, src: str):
    h = max(2.0, min(700.0, float(h)))
    b["height"] = round(h, 2)
    b["levels"] = max(1, round(h / 3.5))
    b["src"] = src
    b["facade"] = facade_for(b.get("use"), h)


def apply_cnbh(buildings: list[dict], tif: Path, lng: float, lat: float, extent: float) -> int:
    if not tif.exists() or tif.stat().st_size < 1000:
        print(f"  跳过 CNBH：没有 {tif}")
        return 0
    import rasterio
    from pyproj import Transformer
    from rasterio.transform import rowcol, xy
    from rasterio.windows import Window, from_bounds
    from rasterio.warp import transform_bounds

    west, south, east, north = bbox(lng, lat, extent + 400)
    with rasterio.open(tif) as ds:
        crs = ds.crs
        bounds = (west, south, east, north)
        if crs and crs.to_epsg() not in (4326,):
            west, south, east, north = transform_bounds("EPSG:4326", crs, *bounds, densify_pts=21)
        window = from_bounds(west, south, east, north, transform=ds.transform)
        try:
            window = window.intersection(Window(0, 0, ds.width, ds.height))
        except Exception as e:
            print(f"  CNBH 范围对不上 {tif.name}：{e}")
            return 0
        if window.width < 2 or window.height < 2:
            print("  CNBH 窗口为空")
            return 0
        arr = ds.read(1, window=window)
        transform = ds.window_transform(window)
        nodata = ds.nodata
    to_raster = None
    to_wgs = None
    if crs and crs.to_epsg() not in (4326, None):
        to_raster = Transformer.from_crs("EPSG:4326", crs, always_xy=True)
        to_wgs = Transformer.from_crs(crs, "EPSG:4326", always_xy=True)

    def valid(v: float) -> bool:
        if v != v:
            return False
        if nodata is not None and abs(v - float(nodata)) < 1e-6:
            return False
        return 2.0 <= float(v) <= 700.0

    def world_of(col: float, row: float):
        mx, my = xy(transform, row, col, offset="center")
        if to_wgs:
            lon, la = to_wgs.transform(mx, my)
        else:
            lon, la = mx, my
        x = (lon - lng) * meters_per_lng(lat)
        z = -(la - lat) * 111320
        return x, z

    changed = 0
    height, width = arr.shape
    for b in buildings:
        if b.get("src") != "heuristic":
            continue
        ring = b["ring"]
        if len(ring) < 3:
            continue
        samples_xy = []
        for p in ring:
            lon, la = to_ll(p[0], p[1], lng, lat)
            if to_raster:
                mx, my = to_raster.transform(lon, la)
            else:
                mx, my = lon, la
            samples_xy.append((mx, my))
        cols = []
        rows = []
        for mx, my in samples_xy:
            rr, cc = rowcol(transform, mx, my)
            rows.append(rr)
            cols.append(cc)
        r0 = max(0, min(rows))
        r1 = min(height - 1, max(rows))
        c0 = max(0, min(cols))
        c1 = min(width - 1, max(cols))
        if r1 < r0 or c1 < c0:
            continue
        # 小脚印只采样中心，避免 10m 像元把塔楼抹平。
        vals = []
        area = ring_area(ring)
        if area < 900:
            cx = sum(p[0] for p in ring) / len(ring)
            cz = sum(p[1] for p in ring) / len(ring)
            lon, la = to_ll(cx, cz, lng, lat)
            if to_raster:
                mx, my = to_raster.transform(lon, la)
            else:
                mx, my = lon, la
            rr, cc = rowcol(transform, mx, my)
            if 0 <= rr < height and 0 <= cc < width and valid(float(arr[rr, cc])):
                vals.append(float(arr[rr, cc]))
        else:
            for r in range(r0, r1 + 1):
                for c in range(c0, c1 + 1):
                    v = float(arr[r, c])
                    if not valid(v):
                        continue
                    x, z = world_of(c, r)
                    if point_in_ring(x, z, ring):
                        vals.append(v)
        if not vals:
            continue
        set_height(b, sum(vals) / len(vals), "cnbh")
        changed += 1
    return changed


def web_mercator(lon: float, lat: float) -> tuple[float, float]:
    r = 20037508.342789244
    x = lon * r / 180.0
    y = math.log(math.tan((90.0 + lat) * math.pi / 360.0)) * r / math.pi
    return x, y


def shp_bounds(path: Path):
    import struct

    try:
        with path.open("rb") as f:
            f.seek(36)
            return struct.unpack("<4d", f.read(32))
    except OSError:
        return None


def boxes_overlap(a, b) -> bool:
    return not (a[2] < b[0] or a[0] > b[2] or a[3] < b[1] or a[1] > b[3])


def facade_from_function(fn: str | None, height: float) -> int | None:
    if not fn:
        return None
    key = str(fn).lower()
    if any(s in key for s in ("resid", "house", "apart", "dwell")):
        return 1
    if any(s in key for s in ("retail", "indust", "ware", "shop")):
        return 2
    if any(s in key for s in ("office", "public", "commer", "hotel", "mixed")):
        return 0 if height >= 24 else 2
    return None


def apply_cmab(buildings: list[dict], zip_path: Path, lng: float, lat: float, extent: float) -> int:
    if not zip_path.exists() or zip_path.stat().st_size < 1000:
        print(f"  跳过 CMAB：没有 {zip_path}")
        return 0
    import duckdb
    import zipfile

    unpack = CACHE / "unpack" / zip_path.stem
    shps = list(unpack.rglob("*.shp")) if unpack.exists() else []
    if not shps:
        unpack.mkdir(parents=True, exist_ok=True)
        with zipfile.ZipFile(zip_path) as zf:
            zf.extractall(unpack)
        shps = list(unpack.rglob("*.shp"))
    if not shps:
        print("  CMAB 压缩包里没有 shp")
        return 0
    # CMAB 的 shp 是 Web Mercator，而且一个城市拆成很多图幅。
    west, south, east, north = bbox(lng, lat, extent)
    x0, y0 = web_mercator(west, south)
    x1, y1 = web_mercator(east, north)
    env = (min(x0, x1), min(y0, y1), max(x0, x1), max(y0, y1))
    chosen = []
    for shp in shps:
        box = shp_bounds(shp)
        if box and boxes_overlap(box, env):
            chosen.append(shp)
    if not chosen:
        print(f"  CMAB 没有和图幅相交的 shp（共 {len(shps)} 个）")
        return 0
    print(f"  CMAB 图幅 {len(chosen)}/{len(shps)}")
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial;")
    con.execute("CREATE TABLE cmab (h DOUBLE, fn VARCHAR, geom GEOMETRY)")
    for shp in chosen:
        probe = con.execute(f"SELECT * FROM ST_Read('{shp.as_posix()}') LIMIT 0")
        cols = [d[0] for d in probe.description]
        height_col = next((c for c in cols if c.lower() in ("pred_h_r", "height")), None)
        if not height_col:
            print("  跳过无高度字段", shp.name, cols[:8])
            continue
        fn_col = next((c for c in cols if c.lower() == "function"), None)
        fn_sql = f'"{fn_col}"' if fn_col else "NULL"
        con.execute(
            f"""
            INSERT INTO cmab
            SELECT "{height_col}", {fn_sql}, geom
            FROM ST_Read('{shp.as_posix()}')
            WHERE "{height_col}" > 2
              AND ST_Intersects(geom, ST_MakeEnvelope({env[0]}, {env[1]}, {env[2]}, {env[3]}))
            """
        )
    n_cmab = con.execute("SELECT count(*) FROM cmab").fetchone()[0]
    print(f"  CMAB 范围内 {n_cmab} 栋")
    if not n_cmab:
        return 0
    values = []
    for i, b in enumerate(buildings):
        if b.get("src") not in ("heuristic", "cnbh"):
            continue
        ring = b["ring"]
        if len(ring) < 3:
            continue
        coords = []
        for x, z in ring:
            lon, la = to_ll(x, z, lng, lat)
            mx, my = web_mercator(lon, la)
            coords.append(f"{mx} {my}")
        coords.append(coords[0])
        wkt = "POLYGON((" + ", ".join(coords) + "))"
        values.append((i, wkt))
    if not values:
        return 0
    con.execute("CREATE TABLE bldg (idx INTEGER, geom GEOMETRY)")
    con.executemany("INSERT INTO bldg VALUES (?, ST_GeomFromText(?))", values)
    rows = con.execute(
        """
        SELECT b.idx, c.h, c.fn,
               ST_Area(ST_Intersection(b.geom, c.geom)) AS inter,
               ST_Area(ST_Union(b.geom, c.geom)) AS uni
        FROM bldg b
        JOIN cmab c ON ST_Intersects(b.geom, c.geom)
        """
    ).fetchall()
    best: dict[int, tuple[float, float, str | None]] = {}
    for idx, h, fn, inter, uni in rows:
        if not uni or uni <= 0 or h is None:
            continue
        iou = float(inter) / float(uni)
        if iou <= 0.5:
            continue
        prev = best.get(idx)
        if prev is None or iou > prev[0]:
            best[idx] = (iou, float(h), fn)
    for idx, (_, h, fn) in best.items():
        set_height(buildings[idx], h, "cmab")
        style = facade_from_function(fn, h)
        if style is not None:
            buildings[idx]["facade"] = style
            buildings[idx]["use"] = str(fn)[:24]
    return len(best)


def _epsg_from_gml(text: str) -> str | None:
    import re

    m = re.search(r"EPSG[:/]0?(\d{4,5})", text)
    return f"EPSG:{m.group(1)}" if m else None


def apply_plateau(buildings: list[dict], zip_path: Path, lng: float, lat: float) -> int:
    if not zip_path.exists() or zip_path.stat().st_size < 1000:
        print(f"  跳过 PLATEAU：没有 {zip_path.name}（CityGML 约 740MB）")
        return 0
    import zipfile
    from xml.etree import ElementTree as ET

    from pyproj import Transformer

    cell = 45.0
    grid: dict[tuple[int, int], list[int]] = defaultdict(list)
    for i, b in enumerate(buildings):
        ring = b["ring"]
        cx = sum(p[0] for p in ring) / len(ring)
        cz = sum(p[1] for p in ring) / len(ring)
        grid[(int(cx // cell), int(cz // cell))].append(i)

    def near(x: float, z: float):
        ix, iz = int(x // cell), int(z // cell)
        out = []
        for dx in (-1, 0, 1):
            for dz in (-1, 0, 1):
                out.extend(grid.get((ix + dx, iz + dz), ()))
        return out

    hits: dict[int, float] = {}
    transformer = None
    swap = None
    seen = 0
    with zipfile.ZipFile(zip_path) as zf:
        names = [n for n in zf.namelist() if n.lower().endswith(".gml") and "/bldg/" in n.lower()]
        if not names:
            print("  PLATEAU 压缩包里没有建筑 gml")
            return 0
        with zf.open(names[0]) as fh:
            head = fh.read(80_000).decode("utf-8", "replace")
        epsg = _epsg_from_gml(head) or "EPSG:6697"
        # 这批新宿 CityGML 的坐标已经是纬度、经度，不能按投影米去变换。
        transformer = None
        for name in names:
            with zf.open(name) as fh:
                preview = fh.read(500_000).decode("utf-8", "replace")
            import re

            m = re.search(r"(?:lowerCorner|posList)>\s*(-?\d+\.\d+)\s+(-?\d+\.\d+)", preview)
            if m:
                a, b = float(m.group(1)), float(m.group(2))
                plat, plon = (a, b) if abs(a) < 90 else (b, a)
                if abs(plon - lng) > 0.07 or abs(plat - lat) > 0.07:
                    continue
            with zf.open(name) as fh:
                for _, elem in ET.iterparse(fh, events=("end",)):
                    tag = elem.tag.split("}")[-1]
                    if tag not in ("Building", "BuildingPart"):
                        continue
                    h = None
                    pos = None
                    for child in elem.iter():
                        t = child.tag.split("}")[-1]
                        if h is None and t in ("measuredHeight", "height") and child.text:
                            try:
                                h = float(child.text.strip().split()[0])
                            except ValueError:
                                h = None
                        if pos is None and t == "posList" and child.text:
                            pos = child.text.split()
                        if h is not None and pos is not None:
                            break
                    elem.clear()
                    if h is None or h < 3 or h > 700 or not pos or len(pos) < 4:
                        continue
                    step = 3 if len(pos) % 3 == 0 else 2
                    xs = []
                    ys = []
                    for i in range(0, len(pos) - step + 1, step):
                        try:
                            xs.append(float(pos[i]))
                            ys.append(float(pos[i + 1]))
                        except ValueError:
                            continue
                    if not xs:
                        continue
                    mx, my = sum(xs) / len(xs), sum(ys) / len(ys)
                    if max(abs(mx), abs(my)) < 180:
                        # 新宿这套数据是纬度在前。
                        if abs(mx) <= 90 and abs(my) > 90:
                            lon, la = my, mx
                        else:
                            lon, la = mx, my
                    elif transformer is None:
                        continue
                    else:
                        if swap is None:
                            a_lon, a_lat = transformer.transform(mx, my)
                            b_lon, b_lat = transformer.transform(my, mx)
                            da = abs(a_lon - lng) + abs(a_lat - lat)
                            db = abs(b_lon - lng) + abs(b_lat - lat)
                            swap = db < da
                        if swap:
                            lon, la = transformer.transform(my, mx)
                        else:
                            lon, la = transformer.transform(mx, my)
                    if abs(lon - lng) > 0.08 or abs(la - lat) > 0.08:
                        continue
                    x = (lon - lng) * meters_per_lng(lat)
                    z = -(la - lat) * 111320
                    seen += 1
                    for idx in near(x, z):
                        if point_in_ring(x, z, buildings[idx]["ring"]):
                            prev = hits.get(idx, 0.0)
                            if h > prev:
                                hits[idx] = h
                            break
    for idx, h in hits.items():
        set_height(buildings[idx], h, "plateau")
    print(f"  PLATEAU 命中 {len(hits)} / 读到坐标 {seen}（{epsg}）")
    return len(hits)


def apply_nyc(buildings: list[dict], lng: float, lat: float, extent: float) -> int:
    import duckdb

    dest = CACHE / "nyc-midtown.geojson"
    if not dest.exists() or dest.stat().st_size < 1000:
        west, south, east, north = bbox(lng, lat, extent)
        where = f"height_roof > 6 AND within_box(the_geom, {north}, {west}, {south}, {east})"
        features = []
        offset = 0
        while offset <= 100000:
            q = urllib.parse.urlencode(
                {
                    "$select": "height_roof,the_geom",
                    "$where": where,
                    "$limit": "50000",
                    "$offset": str(offset),
                }
            )
            url = "https://data.cityofnewyork.us/resource/5zhs-2jue.json?" + q
            req = urllib.request.Request(url, headers={"User-Agent": "fly-to-city"})
            with urllib.request.urlopen(req, timeout=120) as resp:
                rows = json.load(resp)
            if not rows:
                break
            for row in rows:
                try:
                    h = float(row["height_roof"]) * 0.3048
                except (TypeError, ValueError, KeyError):
                    continue
                geom = row.get("the_geom")
                if not geom or h < 2:
                    continue
                features.append({"type": "Feature", "properties": {"h": round(h, 2)}, "geometry": geom})
            if len(rows) < 50000:
                break
            offset += 50000
        dest.write_text(json.dumps({"type": "FeatureCollection", "features": features}))
        print(f"  已下载纽约轮廓 {len(features)} 栋")
    con = duckdb.connect()
    con.execute("INSTALL spatial; LOAD spatial;")
    con.execute(f"CREATE TABLE nyc AS SELECT h, geom FROM ST_Read('{dest.as_posix()}')")
    pts = []
    for i, b in enumerate(buildings):
        ring = b["ring"]
        cx = sum(p[0] for p in ring) / len(ring)
        cz = sum(p[1] for p in ring) / len(ring)
        lon, la = to_ll(cx, cz, lng, lat)
        pts.append((i, lon, la))
    con.execute("CREATE TABLE pts (idx INTEGER, geom GEOMETRY)")
    con.executemany("INSERT INTO pts VALUES (?, ST_Point(?, ?))", pts)
    rows = con.execute(
        """
        SELECT pts.idx, max(nyc.h) AS h
        FROM pts
        JOIN nyc ON ST_Intersects(nyc.geom, pts.geom)
        GROUP BY pts.idx
        """
    ).fetchall()
    for idx, h in rows:
        if h and float(h) >= 2:
            set_height(buildings[idx], float(h), "nyc")
    return len(rows)


def print_stats(city_id: str, buildings: list[dict]):
    counts = Counter(b.get("src") or "unknown" for b in buildings)
    total = max(1, len(buildings))
    parts = "  ".join(f"{k} {counts[k] / total * 100:.0f}%" for k in ORDER if counts[k])
    extra = "  ".join(
        f"{k} {counts[k] / total * 100:.0f}%" for k in sorted(counts) if k not in ORDER and counts[k]
    )
    heights = [b["height"] for b in buildings] or [0]
    tail = f"  {extra}" if extra else ""
    print(f"{city_id}  {len(buildings)} 栋  最高 {max(heights):.0f}m  {parts}{tail}", flush=True)


def enrich_one(city_id: str):
    lng, lat, extent, tif, cmab = LANDMARKS[city_id]
    path = DATA / f"{city_id}.json"
    doc = json.loads(path.read_text())
    buildings = doc["buildings"]
    if cmab is not None:
        n = apply_cmab(buildings, cmab, lng, lat, extent)
        print(f"  CMAB 替换 {n}")
    if tif is not None:
        n = apply_cnbh(buildings, tif, lng, lat, extent)
        print(f"  CNBH 替换 {n}")
    if city_id == "tokyo-shinjuku":
        apply_plateau(buildings, CACHE / "plateau-shinjuku.zip", lng, lat)
    if city_id == "nyc-midtown":
        n = apply_nyc(buildings, lng, lat, extent)
        print(f"  纽约官方替换 {n}")
    if city_id == "paris-eiffel":
        print("  巴黎：IGN BD TOPO 需要账号，未覆盖，保留 Overture / 楼层数")
    if city_id == "hongkong-central":
        print("  香港：地政总署三维接口是网格，没有逐栋高度字段，只用 CNBH")
    doc["buildings"] = buildings
    path.write_text(json.dumps(doc, ensure_ascii=False, separators=(",", ":")))
    print_stats(city_id, buildings)


def main():
    want = [a for a in sys.argv[1:] if not a.startswith("-")]
    targets = want or list(LANDMARKS)
    for city_id in targets:
        if city_id not in LANDMARKS:
            print("未知城市", city_id)
            continue
        print(f"补高度 {city_id}…", flush=True)
        enrich_one(city_id)


if __name__ == "__main__":
    main()
