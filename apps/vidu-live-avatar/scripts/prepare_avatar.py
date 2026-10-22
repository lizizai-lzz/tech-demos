#!/usr/bin/env python3
"""Crop an avatar photo to the 1.2:1 half-body frame Vidu S2 accepts reliably.

Lesson learned: a full-length / revealing portrait with a "豆包AI生成"-style watermark was rejected
by Vidu's content audit (AuditSubmitIllegal). The same character cropped to a 1.2:1 landscape
half-body (shoulders up to chest, no midriff, no watermark) passed.

Logic (portrait input, H >= W/1.2): keep full width, height = W/1.2, crop bottom edge at
--bottom (default 0.65) of the image height -> head + shoulders + chest; the bottom of the image,
where generator watermarks usually sit, is always cut away. Landscape input (H < W/1.2): keep
full height minus the bottom --strip (watermark band) and centre-crop width to 1.2 x height.
Output: JPEG, EXIF stripped, long side <= --max-width.

    python scripts/prepare_avatar.py /path/to/photo.png --name zizai-demo \
        --out-dir ai-live-avatar/assets/avatars
Needs Pillow (use ai-live-avatar/.venv/bin/python, which setup.sh creates).
"""
import argparse, sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Pillow missing: run with ai-live-avatar/.venv/bin/python (setup.sh installs it)")

RATIO = 1.2


def crop_box(w: int, h: int, bottom: float, strip: float) -> tuple[int, int, int, int]:
    if h >= w / RATIO:  # portrait or square-ish: full width, half body
        ch = round(w / RATIO)
        b = min(round(h * bottom), round(h * (1 - strip)))
        b = max(b, ch)  # never above the top
        return 0, b - ch, w, b
    usable = round(h * (1 - strip))  # landscape: cut watermark band, centre the width
    cw = min(w, round(usable * RATIO))
    ch = round(cw / RATIO)
    left = (w - cw) // 2
    return left, usable - ch, left + cw, usable


def main() -> int:
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("image")
    ap.add_argument("--name", default="zizai-demo", help="profile key -> <name>.jpg")
    ap.add_argument("--out-dir", default="ai-live-avatar/assets/avatars")
    ap.add_argument("--bottom", type=float, default=0.65, help="bottom edge of the crop as a fraction of height (portrait)")
    ap.add_argument("--strip", type=float, default=0.06, help="bottom band always removed (watermark), fraction of height")
    ap.add_argument("--max-width", type=int, default=1440)
    a = ap.parse_args()
    src = Path(a.image).expanduser()
    if not src.is_file():
        sys.exit(f"not found: {src}")
    im = ImageOps.exif_transpose(Image.open(src)).convert("RGB")
    w, h = im.size
    box = crop_box(w, h, a.bottom, a.strip)
    out = im.crop(box)
    if out.width > a.max_width:
        out = out.resize((a.max_width, round(a.max_width / RATIO)), Image.LANCZOS)
    dest = Path(a.out_dir).expanduser() / f"{a.name}.jpg"
    dest.parent.mkdir(parents=True, exist_ok=True)
    out.save(dest, "JPEG", quality=92)  # no exif kwarg -> metadata dropped
    print(f"[avatar] {src.name} {w}x{h} -> crop {box} -> {dest} {out.width}x{out.height} (ratio {out.width / out.height:.2f})")
    print("[avatar] check by eye: single person, shoulders-to-chest, no midriff, no watermark/logo/text")
    return 0


if __name__ == "__main__":
    sys.exit(main())
