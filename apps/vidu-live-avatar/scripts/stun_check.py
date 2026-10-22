#!/usr/bin/env python3
"""Free WebRTC network preflight (stdlib only, no credits): can this machine do UDP/STUN?

Vidu's realtime avatar streams over Aliyun RTC (WebRTC). Media needs UDP egress; a successful STUN
binding = the browser/OBS will get a server-reflexive ("srflx") ICE candidate. We learned the hard
way: with no UDP (or everything forced through an HTTP proxy / overseas tunnel) the session bills
but the stage stays at 「画面连接中…」 and the browser shows a misleading CORS error on alivecdn rtcsub.

    python3 scripts/stun_check.py            # exit 0 = PASS (at least one STUN server answered)
    python3 scripts/stun_check.py --no-cdn   # skip the Aliyun CDN edge check
Exit: 0 PASS, 1 FAIL (no UDP/STUN), 2 PASS but warnings (proxy env / overseas CDN edge).
"""
import argparse, ipaddress, os, re, socket, struct, sys, time, urllib.request

SERVERS = [("stun.miwifi.com", 3478), ("stun.l.google.com", 19302), ("stun.cloudflare.com", 3478)]
MAGIC = 0x2112A442
CDN = "https://r5-rtcsub.media-sh.alivecdn.com/"


def stun(host: str, port: int, timeout: float = 2.0, tries: int = 2):
    try:
        infos = socket.getaddrinfo(host, port, socket.AF_INET, socket.SOCK_DGRAM)
    except OSError as e:
        return None, f"DNS failed: {e}"
    addr = infos[0][4]
    for _ in range(tries):
        tid = os.urandom(12)
        req = struct.pack("!HHI12s", 0x0001, 0, MAGIC, tid)
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.settimeout(timeout)
        try:
            t = time.time()
            s.sendto(req, addr)
            data, _ = s.recvfrom(2048)
            rtt = (time.time() - t) * 1000
        except OSError:
            continue
        finally:
            s.close()
        if len(data) < 20 or data[8:20] != tid:
            continue
        i = 20
        while i + 4 <= len(data):
            atype, alen = struct.unpack("!HH", data[i:i + 4])
            val = data[i + 4:i + 4 + alen]
            if atype in (0x0020, 0x0001) and len(val) >= 8 and val[1] == 1:  # XOR-MAPPED / MAPPED, IPv4
                p = struct.unpack("!H", val[2:4])[0]
                ip = bytes(val[4:8])
                if atype == 0x0020:
                    p ^= MAGIC >> 16
                    ip = bytes(b ^ m for b, m in zip(ip, struct.pack("!I", MAGIC)))
                return (socket.inet_ntoa(ip), p, rtt), addr[0]
            i += 4 + alen + (-alen % 4)
        return None, "reply without mapped address"
    return None, f"timeout ({addr[0]})"


def cdn_edge():
    opener = urllib.request.build_opener(urllib.request.ProxyHandler({}))  # direct, like WebRTC would be
    req = urllib.request.Request(CDN, method="HEAD")
    try:
        r = opener.open(req, timeout=6)
        h = r.headers
    except urllib.error.HTTPError as e:  # 4xx is fine; we only want the headers
        h = e.headers
    except Exception as e:  # noqa: BLE001
        return None, f"unreachable: {e}"
    return h.get("Via") or "", None


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--no-cdn", action="store_true")
    a = ap.parse_args()
    ok, warn = 0, []
    for host, port in SERVERS:
        try:
            ip = socket.gethostbyname(host)
            if ipaddress.ip_address(ip) in ipaddress.ip_network("198.18.0.0/15"):
                warn.append(f"{host} resolves to fake-IP {ip}: a TUN/fake-IP proxy (Clash/Surge etc.) is intercepting DNS; disable it for RTC")
        except OSError:
            pass
        res, info = stun(host, port)
        if res:
            ok += 1
            print(f"PASS  {host}:{port}  srflx(public) {res[0]}:{res[1]}  rtt {res[2]:.0f}ms")
        else:
            print(f"FAIL  {host}:{port}  {info}")
    proxies = {k: v for k, v in os.environ.items() if k.lower() in ("http_proxy", "https_proxy", "all_proxy")}
    if proxies:
        warn.append(f"proxy env set ({', '.join(proxies)}): WebRTC media ignores HTTP proxies; turn off global/TUN proxy for RTC")
    if not a.no_cdn:
        via, err = cdn_edge()
        if err:
            warn.append(f"Aliyun RTC CDN {err}")
        else:
            print(f"INFO  Aliyun RTC CDN edge: {via or '(no Via header)'}")
            if re.search(r"us\d+", via.lower()):
                warn.append("CDN served from a US edge -> overseas egress/tunnel; use a normal mainland-China network")
    for w in dict.fromkeys(warn):
        print(f"WARN  {w}")
    if not ok:
        print("RESULT: FAIL - no UDP/STUN reply. Do NOT start a paid session on this network.")
        return 1
    print(f"RESULT: PASS - UDP/STUN works ({ok}/{len(SERVERS)})" + (" with warnings" if warn else ""))
    return 2 if warn else 0


if __name__ == "__main__":
    sys.exit(main())
