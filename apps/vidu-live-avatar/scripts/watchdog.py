#!/usr/bin/env python3
"""Credit-safety watchdog for ai-live-avatar (stdlib only).

Start this FIRST, then start the session. It polls the server every second and calls
POST /api/session/stop when:
  * billing has started (status waiting_stage/live) and no video-received signal
    ("舞台页收到数字人画面", logged when the stage page reports event=remote_video, i.e. a <video>
    was attached) arrives within --video-timeout seconds (default 20);
  * total billed/live time reaches --hard-limit seconds (default 90), video or not;
  * the session sits in creating/connecting longer than --prelive-limit seconds (default 60).
It prints one short reason line and exits. If the session ends by itself it just exits.

    python3 watchdog.py                      # waits for a session to start, then guards it
    python3 watchdog.py --video-timeout 20 --hard-limit 90 --wait 600
Exit codes: 0 session ended by itself, 2 watchdog stopped it, 3 nothing started within --wait, 4 server unreachable.
"""
import argparse, json, sys, time, urllib.request

VIDEO_MSG = "舞台页收到数字人画面"
BILLING = ("waiting_stage", "live")
PRELIVE = ("creating", "connecting")


def get(base, path, timeout=3):
    with urllib.request.urlopen(base + path, timeout=timeout) as r:
        return json.loads(r.read())


def stop(base):
    req = urllib.request.Request(base + "/api/session/stop", data=b"{}", method="POST",
                                 headers={"Content-Type": "application/json"})
    for _ in range(3):
        try:
            with urllib.request.urlopen(req, timeout=10) as r:
                return json.loads(r.read()).get("status")
        except Exception as e:  # noqa: BLE001
            err = e
            time.sleep(0.5)
    return f"stop failed: {err}"


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--base", default="http://127.0.0.1:28900")
    ap.add_argument("--video-timeout", type=float, default=20)
    ap.add_argument("--hard-limit", type=float, default=90)
    ap.add_argument("--prelive-limit", type=float, default=60)
    ap.add_argument("--wait", type=float, default=0, help="give up if no session starts within N s (0 = wait forever)")
    a = ap.parse_args()
    t0 = time.time()
    pre_since = live_since = None
    video_at = None
    fails = 0
    print(f"[watchdog] armed: video<= {a.video_timeout:.0f}s, hard limit {a.hard_limit:.0f}s, polling {a.base}", flush=True)
    while True:
        try:
            s = get(a.base, "/api/state")
            fails = 0
        except Exception as e:  # noqa: BLE001
            fails += 1
            if fails >= 5:
                # Can't reach the server: try a stop anyway in case it is just slow, then bail.
                print(f"[watchdog] server unreachable ({e}); attempted stop: {stop(a.base)}", flush=True)
                sys.exit(4)
            time.sleep(1); continue
        st, now = s.get("status"), time.time()
        if st in PRELIVE:
            pre_since = pre_since or now
            if now - pre_since >= a.prelive_limit:
                print(f"[watchdog] STOP: stuck in {st} for {now - pre_since:.0f}s -> {stop(a.base)}", flush=True); sys.exit(2)
        elif st in BILLING:
            if live_since is None:
                # count from the server's billing clock when it is already running
                live_since = now - float(s.get("elapsed") or 0)
                print(f"[watchdog] billing started (status={st}, mode={s.get('mode')}, live_id={s.get('live_id')})", flush=True)
            if video_at is None:
                try:
                    for e in get(a.base, "/api/logs?n=300"):
                        if e.get("message") == VIDEO_MSG and e.get("t", 0) >= live_since - 5:
                            video_at = e["t"]
                            print(f"[watchdog] video received after {video_at - live_since:.1f}s ({e.get('data')})", flush=True)
                            break
                except Exception:  # noqa: BLE001
                    pass
            live = now - live_since
            if video_at is None and live >= a.video_timeout:
                print(f"[watchdog] STOP: no '{VIDEO_MSG}' within {a.video_timeout:.0f}s of billing start -> {stop(a.base)}", flush=True); sys.exit(2)
            if live >= a.hard_limit:
                print(f"[watchdog] STOP: hard limit {a.hard_limit:.0f}s reached -> {stop(a.base)}", flush=True); sys.exit(2)
        elif live_since is not None or pre_since is not None:
            print(f"[watchdog] session ended on its own (status={st}, reason={s.get('end_reason')}); exiting", flush=True); sys.exit(0)
        elif a.wait and now - t0 > a.wait:
            print(f"[watchdog] no session started within {a.wait:.0f}s; exiting", flush=True); sys.exit(3)
        time.sleep(1)


if __name__ == "__main__":
    main()
