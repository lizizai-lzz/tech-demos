#!/usr/bin/env python3
"""Render ai-live-avatar/config.json from ../config.template.json (stdlib only).

Env overrides (all optional):
  PROFILE_KEY          profile id            (default: zizai-demo)
  PROFILE_NAME         display name          (default: 自在)
  VOICE                Vidu system voice id  (default: Qiao; list them via GET /api/voices)
  GREETING             greeting instruction  (default: generated from PROFILE_NAME)
  PERSONA_FILE         persona path relative to upstream dir (default: personas/zizai-demo.md)
  BUDGET_CREDITS       safety.budget_credits (default: 400  ≈ ¥12.5)
  MAX_SESSION_MINUTES  safety.max_session_minutes (default: 3)
  VIDU_ENV             vidu.env cn|global    (default: cn)

    python3 scripts/render_config.py ai-live-avatar/config.json [--force]
Refuses to overwrite an existing config.json unless --force (or FORCE_CONFIG=1).
No secrets are ever written into config.json; it only stores the key *file path*.
"""
import json, os, sys
from pathlib import Path

KIT = Path(__file__).resolve().parent.parent


def main() -> int:
    if len(sys.argv) < 2:
        print(__doc__); return 1
    out = Path(sys.argv[1])
    force = "--force" in sys.argv or os.environ.get("FORCE_CONFIG") == "1"
    if out.exists() and not force:
        print(f"[config] {out} exists, keeping it (FORCE_CONFIG=1 to re-render)")
        return 0
    cfg = json.loads((KIT / "config.template.json").read_text(encoding="utf-8"))
    tpl_key = cfg["avatar_profile"]
    prof = cfg["avatars"].pop(tpl_key)
    key = os.environ.get("PROFILE_KEY") or tpl_key
    name = os.environ.get("PROFILE_NAME") or prof["name"]
    prof["name"] = name
    prof["image"] = f"assets/avatars/{key}.jpg"
    prof["voice"] = os.environ.get("VOICE", prof["voice"])
    prof["persona_file"] = os.environ.get("PERSONA_FILE") or prof["persona_file"]
    if os.environ.get("GREETING"):
        prof["greeting_instruction"] = os.environ["GREETING"]
    elif name != "自在":
        prof["greeting_instruction"] = f"用一句很短的话热情打招呼，说自己是{name}，欢迎大家来看模拟直播。"
    cfg["avatars"][key] = prof
    cfg["avatar_profile"] = key
    cfg["safety"]["budget_credits"] = int(os.environ.get("BUDGET_CREDITS") or cfg["safety"]["budget_credits"])
    cfg["safety"]["max_session_minutes"] = int(os.environ.get("MAX_SESSION_MINUTES") or cfg["safety"]["max_session_minutes"])
    cfg["vidu"]["env"] = os.environ.get("VIDU_ENV") or cfg["vidu"]["env"]
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(cfg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    b = cfg["safety"]
    print(f"[config] wrote {out}: profile={key} name={name} voice={prof['voice']} "
          f"budget={b['budget_credits']} credits (≈¥{b['budget_credits'] * 0.03125:.2f}) max={b['max_session_minutes']}min")
    return 0


if __name__ == "__main__":
    sys.exit(main())
