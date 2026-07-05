import React, { useState, useEffect } from "react";

const LOGO_BASE = "/assets/logos/";

// 날짜 문자열 → Date 객체 (null 안전)
function toDate(s) { return s ? new Date(s) : null; }

// JSON 데이터를 앱 형식으로 변환
function parseGames(raw) {
  return raw.games.map(g => ({
    ...g,
    startDate: toDate(g.startDate),
    endDate:   toDate(g.endDate),
    items: g.items.map(item => ({
      ...item,
      startDate: toDate(item.startDate),
      endDate:   toDate(item.endDate),
    })),
  }));
}

// ━━━ 유틸 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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

// ━━━ 링 중앙 (이미지 우선, 없으면 이모지) ━━━━━━━━━━━━━
function RingCenter({ logo, icon, size }) {
  const [imgOk, setImgOk] = useState(!!logo);
  useEffect(() => { setImgOk(!!logo); }, [logo]);

  if (logo && imgOk) {
    return (
      <img
        src={LOGO_BASE + logo}
        alt=""
        onError={() => setImgOk(false)}
        style={{ width: size * 0.52, height: size * 0.52, objectFit: "contain", borderRadius: 4 }}
      />
    );
  }
  return <span style={{ fontSize: size * 0.3 }}>{icon}</span>;
}

// ━━━ % 뱃지 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function PctBadge({ pct, color }) {
  return (
    <div style={{
      position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)",
      fontSize: 9, fontWeight: 800, fontFamily: "monospace",
      color: "#fff", background: color,
      borderRadius: 4, padding: "1px 5px", whiteSpace: "nowrap",
    }}>
      {Math.round(pct)}%
    </div>
  );
}

// ━━━ 뱃지 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
      {/* 미니 링 */}
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

      {/* 오른쪽: % + 패치노트 */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 5, flexShrink: 0 }}>
        {active && pct != null && (
          <span style={{ fontSize: 10, fontWeight: 800, fontFamily: "monospace", color: "#fff", background: color, borderRadius: 4, padding: "2px 5px" }}>
            {Math.round(pct)}%
          </span>
        )}
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
            onMouseEnter={e => e.currentTarget.style.opacity = "0.7"}
            onMouseLeave={e => e.currentTarget.style.opacity = "1"}
          >
            패치노트 ↗
          </a>
        )}
      </div>
    </div>
  );
}

// ━━━ 게임 카드 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function GameCard({ game, now, open, onToggle }) {
  const current = game.items.find(
    i => i.startDate && now >= i.startDate && (!i.endDate || now < i.endDate)
  );

  const elapsed  = daysBetween(game.startDate, now);
  const left     = game.endDate ? daysBetween(now, game.endDate) : null;
  const dispPct  = current
    ? calcProgress(current.startDate, current.endDate, now)
    : calcProgress(game.startDate, game.endDate, now);
  // 카드 링: 현재 패치 로고 → 게임 로고 → 이모지 순으로 폴백
  const ringLogo = current?.logo || game.logo;
  const ringIcon = current?.icon || game.icon;
  const dispName = current ? current.name : game.label;

  return (
    <div onClick={onToggle} style={{
      background: `linear-gradient(135deg, ${game.bgColor} 0%, #0d0d0d 100%)`,
      border: `1px solid ${open ? game.accentColor + "66" : "rgba(255,255,255,0.07)"}`,
      borderRadius: 16, padding: open ? "20px" : "16px",
      cursor: "pointer", transition: "all 0.3s ease",
      boxShadow: open ? `0 0 32px ${game.glowColor}, 0 4px 24px rgba(0,0,0,0.5)` : "0 2px 12px rgba(0,0,0,0.4)",
      position: "relative", overflow: "hidden",
    }}>
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 2,
        background: `linear-gradient(90deg,transparent,${game.accentColor},transparent)`,
        opacity: open ? 1 : 0.4, transition: "opacity 0.3s",
      }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ position: "relative", width: 72, height: 82, flexShrink: 0 }}>
          <Ring pct={dispPct} color={game.accentColor} size={72} strokeWidth={4} />
          <div style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 10, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <RingCenter logo={ringLogo} icon={ringIcon} size={72} />
          </div>
          {dispPct != null && <PctBadge pct={dispPct} color={game.accentColor} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
            <span style={{ fontSize: 11, fontWeight: 800, letterSpacing: 1.5, color: game.accentColor, textTransform: "uppercase", fontFamily: "'Courier New',monospace" }}>
              {game.shortName}
            </span>
            {game.patch && (
              <span style={{ fontSize: 9, background: game.accentColor + "22", color: game.accentColor, borderRadius: 4, padding: "1px 5px", fontFamily: "monospace" }}>
                {game.patch}
              </span>
            )}
          </div>
          <div style={{ fontSize: 13, fontWeight: 600, color: "#f0f0f0", marginBottom: 4, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {dispName}
          </div>
          <div style={{ display: "flex", gap: 8, alignItems: "center", fontSize: 12, flexWrap: "wrap" }}>
            {current ? (
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
            )}
          </div>
        </div>

        <div style={{ fontSize: 16, color: "rgba(255,255,255,0.25)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
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

// ━━━ 메인 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
export default function App() {
  const [now, setNow]     = useState(new Date());
  const [open, setOpen]   = useState(null);
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  // JSON 로드
  useEffect(() => {
    fetch("/assets/games.json")
      .then(r => r.json())
      .then(raw => { setGames(parseGames(raw)); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  // 1분마다 시간 갱신
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(t);
  }, []);

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px 48px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>
        <div style={{ marginBottom: 28, textAlign: "center" }}>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, fontFamily: "monospace" }}>
            SEASON TRACKER
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>활성 시즌</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {kfmt(now, { year: "numeric", month: "long", day: "numeric" })} 기준
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 60, fontSize: 14 }}>
            불러오는 중...
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {games.map(game => (
              <GameCard key={game.id} game={game} now={now}
                open={open === game.id}
                onToggle={() => setOpen(p => p === game.id ? null : game.id)}
              />
            ))}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 28, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 0.5 }}>
          탭하면 로드맵 · 미발표 일정은 표시하지 않음
        </div>
      </div>
    </div>
  );
}
