import React, { useState, useEffect, useMemo } from "react";

const LOGO_BASE = "/assets/logos/";
const LS_PINNED = "season-tracker:pinned";
const LS_COMPACT = "season-tracker:compact";
const LS_NOTIF_ENABLED = "season-tracker:notif-enabled";
const LS_NOTIFIED_PREFIX = "season-tracker:notified:";

// ━━━ localStorage 안전 래퍼 ━━━━━━━━━━━━━━━━━━━━━━━━━━
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ━━━ 날짜/데이터 유틸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function toDate(s) { return s ? new Date(s) : null; }
function parseGames(raw) {
  return raw.games.map(g => ({
    ...g,
    startDate: toDate(g.startDate),
    endDate: toDate(g.endDate),
    items: g.items.map(item => ({
      ...item,
      startDate: toDate(item.startDate),
      endDate: toDate(item.endDate),
    })),
  }));
}
function daysBetween(a, b) { return Math.floor((b - a) / 86400000); }
function calcProgress(start, end, now) {
  if (!start || !end) return null;
  return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
}
function elapsedText(days) {
  if (days <= 0) return "시작 전";
  if (days < 7) return `${days}일째`;
  const w = Math.floor(days / 7), r = days % 7;
  return r === 0 ? `${w}주째` : `${w}주 ${r}일째`;
}
function daysLeftText(days) {
  if (days < 0) return "종료됨";
  if (days === 0) return "오늘 종료";
  if (days === 1) return "내일 종료";
  return `${days}일 남음`;
}
function kfmt(d, opts) { return d.toLocaleDateString("ko-KR", opts); }
function urgencyColor(days) {
  if (days < 14) return "#e74c3c";
  if (days < 30) return "#e67e22";
  return "rgba(255,255,255,0.4)";
}

// ━━━ SVG 링 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function Ring({ pct, color, size = 72, strokeWidth = 4 }) {
  const r = (size - strokeWidth * 2) / 2;
  const c = 2 * Math.PI * r;
  const offset = pct == null ? c : c - (pct / 100) * c;
  return (
    <svg width={size} height={size} style={{ transform: "rotate(-90deg)", flexShrink: 0 }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth={strokeWidth} />
      {pct != null && (
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={c} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1s ease" }} />
      )}
    </svg>
  );
}
function RingCenter({ logo, icon, size }) {
  const [imgOk, setImgOk] = useState(!!logo);
  useEffect(() => { setImgOk(!!logo); }, [logo]);
  if (logo && imgOk) {
    return (
      <img src={LOGO_BASE + logo} alt="" onError={() => setImgOk(false)}
        style={{ width: size * 0.52, height: size * 0.52, objectFit: "contain", borderRadius: 4 }} />
    );
  }
  return <span style={{ fontSize: size * 0.3 }}>{icon}</span>;
}
function PctBadge({ pct, color }) {
  return (
    <div style={{
      position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
      fontSize: 9, fontWeight: 800, fontFamily: "monospace",
      color: "#fff", background: color, borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap",
    }}>
      {Math.round(pct)}%
    </div>
  );
}
function Badge({ text, color, dim }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 800, letterSpacing: 0.5,
      borderRadius: 3, padding: "1px 5px", flexShrink: 0,
      color: dim ? "rgba(255,255,255,0.4)" : color,
      background: dim ? "rgba(255,255,255,0.08)" : color + "33",
    }}>{text}</span>
  );
}
function SourceTag({ type }) {
  if (!type) return null;
  const isOfficial = type === "official";
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 4px",
      color: isOfficial ? "#7ee787" : "rgba(255,255,255,0.4)",
      background: isOfficial ? "rgba(126,231,135,0.12)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${isOfficial ? "rgba(126,231,135,0.3)" : "rgba(255,255,255,0.12)"}`,
    }}>
      {isOfficial ? "공식" : "커뮤니티"}
    </span>
  );
}
function PinButton({ pinned, onClick }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={pinned ? "즐겨찾기 해제" : "즐겨찾기 고정"}
      style={{
        background: "none", border: "none", cursor: "pointer", padding: 4,
        fontSize: 16, lineHeight: 1, flexShrink: 0,
        color: pinned ? "#f1c40f" : "rgba(255,255,255,0.2)",
        transition: "color 0.2s",
      }}
    >
      {pinned ? "★" : "☆"}
    </button>
  );
}

// ━━━ 로드맵 아이템 행 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ItemRow({ item, now, color }) {
  const unknown  = !item.startDate;
  const upcoming = !unknown && now < item.startDate;
  const active   = !unknown && now >= item.startDate && (!item.endDate || now < item.endDate);
  const done     = !unknown && item.endDate && now >= item.endDate;

  const pct     = calcProgress(item.startDate, item.endDate, now);
  const elapsed = !unknown ? daysBetween(item.startDate, now) : null;
  const left    = item.endDate ? daysBetween(now, item.endDate) : null;
  const until   = upcoming ? daysBetween(now, item.startDate) : null;
  const ringColor = active ? color : "rgba(255,255,255,0.2)";

  return (
    <div style={{
      background: active ? "rgba(255,255,255,0.05)" : "rgba(255,255,255,0.02)",
      border: `1px solid ${active ? color + "44" : "rgba(255,255,255,0.06)"}`,
      borderRadius: 10, padding: "10px 12px",
      display: "flex", alignItems: "center", gap: 10,
    }}>
      <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
        <Ring pct={done ? 100 : active ? pct : null} color={ringColor} size={44} strokeWidth={3} />
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <RingCenter logo={item.logo} icon={item.icon} size={44} />
        </div>
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 2 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: active ? "#f0f0f0" : "rgba(255,255,255,0.32)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {item.name}
          </span>
          {active   && <Badge text="LIVE" color={color} />}
          {upcoming && <Badge text="SOON" dim />}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 3 }}>
          {item.sub}
          {item.note && <span style={{ color: "rgba(255,255,255,0.18)" }}> · {item.note}</span>}
        </div>
        {unknown ? (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>일정 미발표</span>
        ) : upcoming ? (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            {kfmt(item.startDate, { month: "long", day: "numeric" })} 출시 · D-{until}
          </span>
        ) : done ? (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>종료됨</span>
        ) : (
          <div style={{ display: "flex", gap: 8, fontSize: 10 }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(elapsed)}</span>
            {left != null
              ? <span style={{ color: urgencyColor(left) }}>· {daysLeftText(left)}{item.endIsEstimate ? " (추정)" : ""}</span>
              : <span style={{ color: "rgba(255,255,255,0.28)" }}>· 종료일 미발표</span>
            }
          </div>
        )}
      </div>

      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
        {active && pct != null && (
          <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "monospace", color: "#fff", background: color, borderRadius: 4, padding: "2px 5px" }}>
            {Math.round(pct)}%
          </span>
        )}
        <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
          {item.patchUrl && <SourceTag type={item.sourceType} />}
          {item.patchUrl && (
            <a href={item.patchUrl} target="_blank" rel="noopener noreferrer"
              onClick={e => e.stopPropagation()}
              style={{
                fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
                color: color, background: color + "1a",
                border: `1px solid ${color + "44"}`,
                borderRadius: 4, padding: "2px 6px",
                textDecoration: "none", whiteSpace: "nowrap",
              }}
            >
              패치노트 ↗
            </a>
          )}
        </div>
        {item.starterBuildUrl && (
          <a href={item.starterBuildUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              color: "rgba(255,255,255,0.5)", background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: 4, padding: "2px 6px",
              textDecoration: "none", whiteSpace: "nowrap",
            }}
          >
            {item.buildLabel || "빌드 가이드 ↗"}
          </a>
        )}
      </div>
    </div>
  );
}

// ━━━ 게임 카드 (일반/컴팩트 공용) ━━━━━━━━━━━━━━━━━━━━
function GameCard({ game, now, open, onToggle, pinned, onTogglePin, compact }) {
  const current = game.items.find(
    i => i.startDate && now >= i.startDate && (!i.endDate || now < i.endDate)
  );
  const elapsed  = daysBetween(game.startDate, now);
  const left     = game.endDate ? daysBetween(now, game.endDate) : null;
  const dispPct  = current
    ? calcProgress(current.startDate, current.endDate, now)
    : calcProgress(game.startDate, game.endDate, now);
  const ringLogo = current?.logo || game.logo;
  const ringIcon = current?.icon || game.icon;
  const dispName = current ? current.name : game.label;

  const ringSize = compact ? 44 : 72;

  const dDayNode = current ? (
    <>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(daysBetween(current.startDate, now))}</span>
      {current.endDate
        ? <span style={{ color: urgencyColor(daysBetween(now, current.endDate)) }}>
            · {daysLeftText(daysBetween(now, current.endDate))}{current.endIsEstimate ? " (추정)" : ""}
          </span>
        : <span style={{ color: "rgba(255,255,255,0.3)" }}>· 종료일 미발표</span>
      }
    </>
  ) : (
    <>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(elapsed)}</span>
      {left != null
        ? <span style={{ color: urgencyColor(left) }}>· {daysLeftText(left)}{game.endIsEstimate ? " (추정)" : ""}</span>
        : <span style={{ color: "rgba(255,255,255,0.3)" }}>· 종료일 미발표</span>
      }
    </>
  );

  return (
    <div onClick={onToggle} style={{
      background: `linear-gradient(135deg, ${game.bgColor} 0%, #0d0d0d 100%)`,
      border: `1px solid ${open ? game.accentColor + "66" : "rgba(255,255,255,0.07)"}`,
      borderRadius: compact ? 12 : 16,
      padding: compact ? "10px 14px" : (open ? "20px" : "16px"),
      cursor: "pointer", transition: "all 0.3s ease",
      boxShadow: open ? `0 0 32px ${game.glowColor}, 0 4px 24px rgba(0,0,0,0.5)` : "0 2px 12px rgba(0,0,0,0.4)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${game.accentColor},transparent)`,
        opacity: open ? 1 : 0.4, transition: "opacity 0.3s",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: compact ? 10 : 12 }}>
        <div style={{ position: "relative", width: ringSize, height: ringSize + (compact ? 0 : 10), flexShrink: 0 }}>
          <Ring pct={dispPct} color={game.accentColor} size={ringSize} strokeWidth={compact ? 3 : 4} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: compact ? 0 : 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RingCenter logo={ringLogo} icon={ringIcon} size={ringSize} />
          </div>
          {!compact && dispPct != null && <PctBadge pct={dispPct} color={game.accentColor} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: compact ? 1 : 3 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: game.accentColor, textTransform: "uppercase", fontFamily: "'Courier New',monospace" }}>
              {game.shortName}
            </span>
            {!compact && game.patch && (
              <span style={{ fontSize: 9, background: game.accentColor + "22", color: game.accentColor, borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>
                {game.patch}
              </span>
            )}
          </div>
          {!compact && (
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {dispName}
            </div>
          )}
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: compact ? 11 : 12, flexWrap: "wrap" }}>
            {dDayNode}
          </div>
        </div>

        <PinButton pinned={pinned} onClick={onTogglePin} />
        {!compact && (
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.25)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${game.accentColor}33` }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            {game.roadmapLabel}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {game.items.map(item => (
              <ItemRow key={item.id} item={item} now={now} color={game.accentColor} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ━━━ 알림 로직 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkAndNotify(games, now) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const todayKey = now.toISOString().slice(0, 10);

  games.forEach(game => {
    game.items.forEach(item => {
      if (!item.startDate) return;
      const upcoming = now < item.startDate;
      const active = now >= item.startDate && (!item.endDate || now < item.endDate);

      // 출시 임박 알림 (D-7, D-1)
      if (upcoming) {
        const daysUntil = daysBetween(now, item.startDate);
        if (daysUntil === 7 || daysUntil === 1) {
          const key = `${LS_NOTIFIED_PREFIX}${item.id}:start:${daysUntil}:${todayKey}`;
          if (!lsGet(key, false)) {
            new Notification(`${game.shortName} 출시 임박`, {
              body: `${item.name} — D-${daysUntil}`,
              tag: key,
            });
            lsSet(key, true);
          }
        }
      }
      // 종료 임박 알림 (D-7, D-1)
      if (active && item.endDate) {
        const daysLeft = daysBetween(now, item.endDate);
        if (daysLeft === 7 || daysLeft === 1) {
          const key = `${LS_NOTIFIED_PREFIX}${item.id}:end:${daysLeft}:${todayKey}`;
          if (!lsGet(key, false)) {
            new Notification(`${game.shortName} 시즌 종료 임박`, {
              body: `${item.name} — ${daysLeftText(daysLeft)}`,
              tag: key,
            });
            lsSet(key, true);
          }
        }
      }
    });
  });
}

// ━━━ 메인 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [now, setNow] = useState(new Date());
  const [open, setOpen] = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const [pinned, setPinned] = useState(() => lsGet(LS_PINNED, []));
  const [compact, setCompact] = useState(() => lsGet(LS_COMPACT, false));
  const [notifEnabled, setNotifEnabled] = useState(() => lsGet(LS_NOTIF_ENABLED, false));
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== "undefined" ? Notification.permission : "unsupported"
  );

  useEffect(() => {
    fetch("/assets/games.json")
      .then(r => r.json())
      .then(raw => {
        setGames(parseGames(raw));
        setLastUpdated(raw._readme?.["최종_업데이트"] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { lsSet(LS_PINNED, pinned); }, [pinned]);
  useEffect(() => { lsSet(LS_COMPACT, compact); }, [compact]);
  useEffect(() => { lsSet(LS_NOTIF_ENABLED, notifEnabled); }, [notifEnabled]);

  // 알림 체크 (게임 로드 후 + 1분마다 now 갱신될 때)
  useEffect(() => {
    if (notifEnabled && games.length > 0) checkAndNotify(games, now);
  }, [notifEnabled, games, now]);

  const togglePin = (id) => {
    setPinned(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleNotifToggle = async () => {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      setNotifEnabled(v => !v);
      return;
    }
    const perm = await Notification.requestPermission();
    setNotifPermission(perm);
    if (perm === "granted") setNotifEnabled(true);
  };

  const sortedGames = useMemo(() => {
    const pinnedSet = new Set(pinned);
    return [...games].sort((a, b) => {
      const ap = pinnedSet.has(a.id) ? 0 : 1;
      const bp = pinnedSet.has(b.id) ? 0 : 1;
      return ap - bp;
    });
  }, [games, pinned]);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px 48px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* 헤더 */}
        <div style={{ marginBottom: 20, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, fontFamily: "monospace" }}>
            SEASON TRACKER
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>활성 시즌</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {kfmt(now, { year: "numeric", month: "long", day: "numeric" })} 기준
          </div>
        </div>

        {/* 컨트롤 바 */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20 }}>
          <button
            onClick={() => setCompact(v => !v)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: compact ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)", color: "#fff",
              cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            }}
          >
            {compact ? "📋 컴팩트" : "🗂️ 상세"}
          </button>
          <button
            onClick={handleNotifToggle}
            title={notifPermission === "denied" ? "브라우저 설정에서 알림 권한을 허용해주세요" : ""}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: notifEnabled ? "rgba(241,196,15,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${notifEnabled ? "rgba(241,196,15,0.4)" : "rgba(255,255,255,0.12)"}`,
              color: notifEnabled ? "#f1c40f" : "#fff",
              cursor: "pointer",
            }}
          >
            {notifEnabled ? "🔔 알림 켜짐" : "🔕 알림 끄짐"}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 60, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 16 }}>
            {sortedGames.map(game => (
              <GameCard
                key={game.id} game={game} now={now}
                open={open === game.id && !compact ? true : (!compact && open === game.id)}
                onToggle={() => !compact && setOpen(p => p === game.id ? null : game.id)}
                pinned={pinned.includes(game.id)}
                onTogglePin={() => togglePin(game.id)}
                compact={compact}
              />
            ))}
          </div>
        )}

        {/* 컴팩트 모드에서 상세보기 안내 */}
        {compact && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            상세 로드맵을 보려면 '상세' 보기로 전환하세요
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 0.5 }}>
          탭하면 로드맵 · 별표로 즐겨찾기 고정
          {lastUpdated && <><br />정보 갱신: {lastUpdated}</>}
        </div>
      </div>
    </div>
  );
}
