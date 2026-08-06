import React, { useState, useEffect, useMemo, useRef } from "react";

const LOGO_BASE = import.meta.env.BASE_URL + "assets/logos/";
const LS_PINNED = "season-tracker:pinned";
const LS_COMPACT = "season-tracker:compact";
const LS_NOTIF_ENABLED = "season-tracker:notif-enabled";
const LS_NOTIFIED_PREFIX = "season-tracker:notified:";
const LS_SORT = "season-tracker:sort";
const LS_LANG = "season-tracker:lang";

// ━━━ UI text (KO/EN) ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
const T = {
  ko: {
    appTitle: "SEASON TRACKER",
    heading: "활성 시즌",
    asOf: (d) => `${d} 기준`,
    highlightsTitle: "⏰ 이번 주 하이라이트",
    searchPlaceholder: "게임 검색 (예: Diablo, WoW...)",
    viewCompact: "📋 컴팩트",
    viewDetailed: "🗂️ 상세",
    sortUrgent: "⏱ 임박순",
    sortDefault: "↕ 기본순",
    notifOn: "🔔 알림 켜짐",
    notifOff: "🔕 알림 꺼짐",
    notifDeniedTitle: "브라우저 설정에서 알림 권한을 허용해주세요",
    widgetPreview: "📱 위젯 미리보기",
    exportIcs: "📥 캘린더 내보내기",
    loading: "불러오는 중...",
    noMatch: (q) => `"${q}"와 일치하는 게임이 없어요`,
    compactHint: "상세 로드맵을 보려면 '상세' 보기로 전환하세요",
    footerHint: "탭하면 로드맵 · 별표로 즐겨찾기 고정",
    infoUpdated: (d) => `정보 갱신: ${d}`,
    liveBadge: "LIVE",
    soonBadge: "SOON",
    estimateBadge: "추정",
    officialTag: "공식",
    communityTag: "커뮤니티",
    unknownSchedule: "일정 미발표",
    noEndDate: "종료일 미발표",
    ended: "종료됨",
    launches: (dateStr, d) => `${dateStr} 출시 · D-${d}`,
    patchNotes: "패치노트 ↗",
    defaultBuildLabel: "빌드 가이드 ↗",
    gcalAddStart: "출시일 추가",
    gcalAddEnd: "종료일 추가",
    gcalEventStart: (name) => `${name} 출시`,
    gcalEventEnd: (name) => `${name} 종료`,
    startBadgeText: (d) => `출시 D-${d}`,
    endBadgeText: (d) => `종료 D-${d}`,
    pinTitleOn: "즐겨찾기 해제",
    pinTitleOff: "즐겨찾기 고정",
    widgetModalTitle: "홈 화면 위젯 미리보기",
    widgetModalNote: "실제 iOS 위젯이 아닌 미리보기예요. 진짜 위젯처럼 쓰려면 README의 '아이폰에서 위젯처럼 보기'를 확인하세요.",
    widgetModalClose: "닫기",
    widgetModalEmpty: "표시할 게임이 없어요",
    langToggle: "EN",
  },
  en: {
    appTitle: "SEASON TRACKER",
    heading: "Active Seasons",
    asOf: (d) => `As of ${d}`,
    highlightsTitle: "⏰ This Week's Highlights",
    searchPlaceholder: "Search games (e.g. Diablo, WoW...)",
    viewCompact: "📋 Compact",
    viewDetailed: "🗂️ Detailed",
    sortUrgent: "⏱ Soonest",
    sortDefault: "↕ Default",
    notifOn: "🔔 Notifications On",
    notifOff: "🔕 Notifications Off",
    notifDeniedTitle: "Please allow notifications in your browser settings",
    widgetPreview: "📱 Widget Preview",
    exportIcs: "📥 Export Calendar",
    loading: "Loading...",
    noMatch: (q) => `No games match "${q}"`,
    compactHint: "Switch to 'Detailed' view to see full roadmaps",
    footerHint: "Tap a card for its roadmap · ★ to pin favorites",
    infoUpdated: (d) => `Last updated: ${d}`,
    liveBadge: "LIVE",
    soonBadge: "SOON",
    estimateBadge: "EST.",
    officialTag: "Official",
    communityTag: "Community",
    unknownSchedule: "Not yet announced",
    noEndDate: "End date not announced",
    ended: "Ended",
    launches: (dateStr, d) => `Launches ${dateStr} · D-${d}`,
    patchNotes: "Patch Notes ↗",
    defaultBuildLabel: "Build Guide ↗",
    gcalAddStart: "Add launch date",
    gcalAddEnd: "Add end date",
    gcalEventStart: (name) => `${name} launches`,
    gcalEventEnd: (name) => `${name} ends`,
    startBadgeText: (d) => `Launch D-${d}`,
    endBadgeText: (d) => `Ends D-${d}`,
    pinTitleOn: "Unpin",
    pinTitleOff: "Pin to favorites",
    widgetModalTitle: "Home Screen Widget Preview",
    widgetModalNote: "This is a visual mockup, not a real iOS widget. See \"View as a widget on iPhone\" in the README for the real thing.",
    widgetModalClose: "Close",
    widgetModalEmpty: "No games to show",
    langToggle: "KO",
  },
};

// ━━━ localStorage safe wrappers ━━━━━━━━━━━━━━━━━━━━━
function lsGet(key, fallback) {
  try {
    const v = localStorage.getItem(key);
    return v === null ? fallback : JSON.parse(v);
  } catch { return fallback; }
}
function lsSet(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch {}
}

// ━━━ data / date utils ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
// 번역 필드 우선순위: lang==='en'이면 `${field}_en`, 없으면 원문(한국어)으로 폴백
function tr(obj, field, lang) {
  if (lang === "en") {
    const v = obj[`${field}_en`];
    if (v) return v;
  }
  return obj[field];
}
function elapsedText(days, lang) {
  if (lang === "en") {
    if (days <= 0) return "Not started";
    if (days < 7) return `Day ${days}`;
    const w = Math.floor(days / 7), r = days % 7;
    return r === 0 ? `Week ${w}` : `${w}w ${r}d`;
  }
  if (days <= 0) return "시작 전";
  if (days < 7) return `${days}일째`;
  const w = Math.floor(days / 7), r = days % 7;
  return r === 0 ? `${w}주째` : `${w}주 ${r}일째`;
}
function daysLeftText(days, lang) {
  if (lang === "en") {
    if (days < 0) return "Ended";
    if (days === 0) return "Ends today";
    if (days === 1) return "Ends tomorrow";
    return `${days}d left`;
  }
  if (days < 0) return "종료됨";
  if (days === 0) return "오늘 종료";
  if (days === 1) return "내일 종료";
  return `${days}일 남음`;
}
function kfmt(d, opts, lang) {
  return d.toLocaleDateString(lang === "en" ? "en-US" : "ko-KR", opts);
}
function urgencyColor(days) {
  if (days < 14) return "#e74c3c";
  if (days < 30) return "#e67e22";
  return "rgba(255,255,255,0.4)";
}
function itemStatus(item, now) {
  const unknown = !item.startDate;
  const upcoming = !unknown && now < item.startDate;
  const active = !unknown && now >= item.startDate && (!item.endDate || now < item.endDate);
  const done = !unknown && item.endDate && now >= item.endDate;
  return { unknown, upcoming, active, done };
}

// ━━━ Google Calendar single-event link ━━━━━━━━━━━━━━
function toGCalStamp(d) {
  return d.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}
function buildGCalUrl(title, date, details) {
  const start = toGCalStamp(date);
  const end = toGCalStamp(new Date(date.getTime() + 60 * 60 * 1000));
  const params = new URLSearchParams({
    action: "TEMPLATE", text: title, dates: `${start}/${end}`, details: details || "",
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ━━━ .ics batch export (all games, all upcoming/ending items) ━━━
function icsEscape(s) {
  return String(s).replace(/[\\;,]/g, m => "\\" + m).replace(/\n/g, "\\n");
}
function icsEvent(uid, date, summary, description) {
  return [
    "BEGIN:VEVENT",
    `UID:${uid}`,
    `DTSTAMP:${toGCalStamp(new Date())}`,
    `DTSTART:${toGCalStamp(date)}`,
    `DTEND:${toGCalStamp(new Date(date.getTime() + 60 * 60 * 1000))}`,
    `SUMMARY:${icsEscape(summary)}`,
    `DESCRIPTION:${icsEscape(description || "")}`,
    "END:VEVENT",
  ];
}
function buildICS(games, now, t, lang) {
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Season Tracker//EN", "CALSCALE:GREGORIAN"];
  games.forEach(game => {
    game.items.forEach(item => {
      if (!item.startDate) return;
      const { upcoming, active } = itemStatus(item, now);
      const note = tr(item, "note", lang) || "";
      if (upcoming) {
        lines.push(...icsEvent(`${item.id}-start@season-tracker`, item.startDate, t.gcalEventStart(item.name), note));
      }
      if (active && item.endDate) {
        lines.push(...icsEvent(`${item.id}-end@season-tracker`, item.endDate, t.gcalEventEnd(item.name), note));
      }
    });
  });
  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
function downloadICS(games, now, t, lang) {
  const content = buildICS(games, now, t, lang);
  const blob = new Blob([content], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "season-tracker.ics";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ━━━ collect items due within 7 days across all games ━━━
function collectHighlights(games, now) {
  const out = [];
  games.forEach(game => {
    game.items.forEach(item => {
      const { upcoming, active } = itemStatus(item, now);
      if (upcoming) {
        const d = daysBetween(now, item.startDate);
        if (d <= 7) out.push({ gameId: game.id, shortName: game.shortName, color: game.accentColor, icon: item.icon, name: item.name, kind: "start", days: d });
      }
      if (active && item.endDate) {
        const d = daysBetween(now, item.endDate);
        if (d <= 7) out.push({ gameId: game.id, shortName: game.shortName, color: game.accentColor, icon: item.icon, name: item.name, kind: "end", days: d });
      }
    });
  });
  return out.sort((a, b) => a.days - b.days);
}

// ━━━ SVG ring ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
function SourceTag({ type, t }) {
  if (!type) return null;
  const isOfficial = type === "official";
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 4px",
      color: isOfficial ? "#7ee787" : "rgba(255,255,255,0.4)",
      background: isOfficial ? "rgba(126,231,135,0.12)" : "rgba(255,255,255,0.06)",
      border: `1px solid ${isOfficial ? "rgba(126,231,135,0.3)" : "rgba(255,255,255,0.12)"}`,
    }}>
      {isOfficial ? t.officialTag : t.communityTag}
    </span>
  );
}
function EstimateTag({ t }) {
  return (
    <span style={{
      fontSize: 8, fontWeight: 700, borderRadius: 3, padding: "1px 4px",
      color: "#f1c40f", background: "rgba(241,196,15,0.12)",
      border: "1px solid rgba(241,196,15,0.3)",
    }}>
      {t.estimateBadge}
    </span>
  );
}
function PinButton({ pinned, onClick, t }) {
  return (
    <button
      onClick={e => { e.stopPropagation(); onClick(); }}
      title={pinned ? t.pinTitleOn : t.pinTitleOff}
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

// ━━━ This week's highlights bar ━━━━━━━━━━━━━━━━━━━━━━
function HighlightsBar({ highlights, onJump, t }) {
  if (highlights.length === 0) return null;
  return (
    <div style={{
      marginBottom: 20, background: "rgba(255,255,255,0.03)",
      border: "1px solid rgba(255,255,255,0.08)", borderRadius: 12, padding: "10px 12px",
    }}>
      <div style={{ fontSize: 10, color: "rgba(255,255,255,0.35)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
        {t.highlightsTitle}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
        {highlights.map((h, i) => (
          <div
            key={i}
            onClick={() => onJump(h.gameId)}
            style={{
              display: "flex", alignItems: "center", gap: 8, cursor: "pointer",
              padding: "4px 6px", borderRadius: 6, transition: "background 0.15s",
            }}
            onMouseEnter={e => e.currentTarget.style.background = "rgba(255,255,255,0.05)"}
            onMouseLeave={e => e.currentTarget.style.background = "transparent"}
          >
            <span style={{ fontSize: 14, flexShrink: 0 }}>{h.icon}</span>
            <span style={{ fontSize: 11, fontWeight: 700, color: h.color, fontFamily: "'Courier New',monospace", flexShrink: 0 }}>
              {h.shortName}
            </span>
            <span style={{ fontSize: 11, color: "#f0f0f0", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
              {h.name}
            </span>
            <span style={{
              fontSize: 10, fontWeight: 800, fontFamily: "monospace", flexShrink: 0,
              color: h.days <= 1 ? "#e74c3c" : "#e67e22",
            }}>
              {h.kind === "start" ? t.startBadgeText(h.days) : t.endBadgeText(h.days)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ━━━ Roadmap item row ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ItemRow({ item, now, color, lang, t }) {
  const { unknown, upcoming, active, done } = itemStatus(item, now);

  const pct     = calcProgress(item.startDate, item.endDate, now);
  const elapsed = !unknown ? daysBetween(item.startDate, now) : null;
  const left    = item.endDate ? daysBetween(now, item.endDate) : null;
  const until   = upcoming ? daysBetween(now, item.startDate) : null;
  const ringColor = active ? color : "rgba(255,255,255,0.2)";

  const sub = tr(item, "sub", lang);
  const note = tr(item, "note", lang);
  const estimate = tr(item, "estimate", lang);

  let gcalUrl = null, gcalText = null;
  if (upcoming) {
    gcalUrl = buildGCalUrl(t.gcalEventStart(item.name), item.startDate, note || "");
    gcalText = t.gcalAddStart;
  } else if (active && item.endDate) {
    gcalUrl = buildGCalUrl(t.gcalEventEnd(item.name), item.endDate, note || "");
    gcalText = t.gcalAddEnd;
  }

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
          {active   && <Badge text={t.liveBadge} color={color} />}
          {upcoming && <Badge text={t.soonBadge} dim />}
        </div>
        <div style={{ fontSize: 10, color: "rgba(255,255,255,0.28)", marginBottom: 3 }}>
          {sub}
          {note && <span style={{ color: "rgba(255,255,255,0.18)" }}> · {note}</span>}
        </div>
        {unknown ? (
          estimate ? (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.4)", display: "inline-flex", alignItems: "center", gap: 5 }}>
              {estimate} <EstimateTag t={t} />
            </span>
          ) : (
            <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{t.unknownSchedule}</span>
          )
        ) : upcoming ? (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.5)" }}>
            {t.launches(kfmt(item.startDate, { month: "long", day: "numeric" }, lang), until)}
          </span>
        ) : done ? (
          <span style={{ fontSize: 10, color: "rgba(255,255,255,0.22)" }}>{t.ended}</span>
        ) : (
          <div style={{ display: "flex", gap: 6, fontSize: 10, alignItems: "center" }}>
            <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(elapsed, lang)}</span>
            {left != null
              ? (
                <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
                  <span style={{ color: urgencyColor(left) }}>· {daysLeftText(left, lang)}</span>
                  {item.endIsEstimate && <EstimateTag t={t} />}
                </span>
              )
              : <span style={{ color: "rgba(255,255,255,0.28)" }}>· {t.noEndDate}</span>
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
          {item.patchUrl && <SourceTag type={item.sourceType} t={t} />}
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
              {t.patchNotes}
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
            {item.buildLabel || t.defaultBuildLabel}
          </a>
        )}
        {gcalUrl && (
          <a href={gcalUrl} target="_blank" rel="noopener noreferrer"
            onClick={e => e.stopPropagation()}
            style={{
              fontSize: 9, fontWeight: 700, letterSpacing: 0.5,
              color: "#7ee787", background: "rgba(126,231,135,0.08)",
              border: "1px solid rgba(126,231,135,0.25)",
              borderRadius: 4, padding: "2px 6px",
              textDecoration: "none", whiteSpace: "nowrap",
              display: "inline-flex", alignItems: "center", gap: 3,
            }}
          >
            📅 {gcalText}
          </a>
        )}
      </div>
    </div>
  );
}

// ━━━ Game card (detailed / compact) ━━━━━━━━━━━━━━━━━━
const GameCard = React.forwardRef(function GameCard(
  { game, now, open, onToggle, pinned, onTogglePin, compact, lang, t }, ref
) {
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
  const dispName = current ? current.name : tr(game, "label", lang);

  const ringSize = compact ? 44 : 72;

  const dDayNode = current ? (
    <>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(daysBetween(current.startDate, now), lang)}</span>
      {current.endDate
        ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: urgencyColor(daysBetween(now, current.endDate)) }}>
              · {daysLeftText(daysBetween(now, current.endDate), lang)}
            </span>
            {current.endIsEstimate && <EstimateTag t={t} />}
          </span>
        )
        : <span style={{ color: "rgba(255,255,255,0.3)" }}>· {t.noEndDate}</span>
      }
    </>
  ) : (
    <>
      <span style={{ color: "rgba(255,255,255,0.5)" }}>{elapsedText(elapsed, lang)}</span>
      {left != null
        ? (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 5 }}>
            <span style={{ color: urgencyColor(left) }}>· {daysLeftText(left, lang)}</span>
            {game.endIsEstimate && <EstimateTag t={t} />}
          </span>
        )
        : <span style={{ color: "rgba(255,255,255,0.3)" }}>· {t.noEndDate}</span>
      }
    </>
  );

  return (
    <div ref={ref} onClick={onToggle} style={{
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

        <PinButton pinned={pinned} onClick={onTogglePin} t={t} />
        {!compact && (
          <div style={{ fontSize: 16, color: "rgba(255,255,255,0.25)", transition: "transform 0.3s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>▼</div>
        )}
      </div>

      {open && (
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: `1px solid ${game.accentColor}33` }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", textTransform: "uppercase", letterSpacing: 1.5, marginBottom: 8 }}>
            {tr(game, "roadmapLabel", lang)}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {game.items.map(item => (
              <ItemRow key={item.id} item={item} now={now} color={game.accentColor} lang={lang} t={t} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
});

// ━━━ Widget preview modal (visual mockup, not a real iOS widget) ━━
function WidgetPreviewModal({ games, now, lang, t, onClose }) {
  const preview = games.slice(0, 4);
  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 1000, padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
        {/* iOS 위젯 느낌의 목업 카드 */}
        <div style={{
          width: 260, height: 260, borderRadius: 32,
          background: "linear-gradient(160deg, #1a1a1a 0%, #0a0a0a 100%)",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.6)",
          padding: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gridTemplateRows: "1fr 1fr", gap: 10,
        }}>
          {preview.length === 0 && (
            <div style={{ gridColumn: "1/-1", gridRow: "1/-1", display: "flex", alignItems: "center", justifyContent: "center", color: "rgba(255,255,255,0.3)", fontSize: 12 }}>
              {t.widgetModalEmpty}
            </div>
          )}
          {preview.map(game => {
            const current = game.items.find(i => i.startDate && now >= i.startDate && (!i.endDate || now < i.endDate));
            const left = current?.endDate ? daysBetween(now, current.endDate) : (game.endDate ? daysBetween(now, game.endDate) : null);
            return (
              <div key={game.id} style={{
                background: "rgba(255,255,255,0.05)", borderRadius: 14,
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 4, padding: 6,
              }}>
                <RingCenter logo={current?.logo || game.logo} icon={current?.icon || game.icon} size={34} />
                <span style={{ fontSize: 9, fontWeight: 800, color: game.accentColor, fontFamily: "'Courier New',monospace" }}>
                  {game.shortName}
                </span>
                <span style={{ fontSize: 8, color: "rgba(255,255,255,0.4)", fontWeight: 700 }}>
                  {left != null ? `D-${left}` : "—"}
                </span>
              </div>
            );
          })}
        </div>

        <div style={{ maxWidth: 280, textAlign: "center" }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#fff", marginBottom: 4 }}>{t.widgetModalTitle}</div>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.45)", lineHeight: 1.5 }}>{t.widgetModalNote}</div>
        </div>

        <button
          onClick={onClose}
          style={{
            fontSize: 12, fontWeight: 700, padding: "8px 20px", borderRadius: 20,
            background: "rgba(255,255,255,0.1)", border: "1px solid rgba(255,255,255,0.15)",
            color: "#fff", cursor: "pointer",
          }}
        >
          {t.widgetModalClose}
        </button>
      </div>
    </div>
  );
}

// ━━━ Notification logic ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkAndNotify(games, now) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const todayKey = now.toISOString().slice(0, 10);

  games.forEach(game => {
    game.items.forEach(item => {
      if (!item.startDate) return;
      const { upcoming, active } = itemStatus(item, now);

      if (upcoming) {
        const daysUntil = daysBetween(now, item.startDate);
        if (daysUntil === 7 || daysUntil === 1) {
          const key = `${LS_NOTIFIED_PREFIX}${item.id}:start:${daysUntil}:${todayKey}`;
          if (!lsGet(key, false)) {
            new Notification(`${game.shortName} launching soon`, { body: `${item.name} — D-${daysUntil}`, tag: key });
            lsSet(key, true);
          }
        }
      }
      if (active && item.endDate) {
        const daysLeft = daysBetween(now, item.endDate);
        if (daysLeft === 7 || daysLeft === 1) {
          const key = `${LS_NOTIFIED_PREFIX}${item.id}:end:${daysLeft}:${todayKey}`;
          if (!lsGet(key, false)) {
            new Notification(`${game.shortName} ending soon`, { body: `${item.name} — D-${daysLeft}`, tag: key });
            lsSet(key, true);
          }
        }
      }
    });
  });
}

// ━━━ Main ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
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
  const [query, setQuery] = useState("");
  const [sortMode, setSortMode] = useState(() => lsGet(LS_SORT, "default"));
  const [lang, setLang] = useState(() => lsGet(LS_LANG, "ko"));
  const [showWidgetPreview, setShowWidgetPreview] = useState(false);

  const t = T[lang];
  const cardRefs = useRef({});

  useEffect(() => {
    fetch(import.meta.env.BASE_URL + "assets/games.json")
      .then(r => r.json())
      .then(raw => {
        setGames(parseGames(raw));
        setLastUpdated(raw._readme?.["최종_업데이트"] || null);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => { lsSet(LS_PINNED, pinned); }, [pinned]);
  useEffect(() => { lsSet(LS_COMPACT, compact); }, [compact]);
  useEffect(() => { lsSet(LS_NOTIF_ENABLED, notifEnabled); }, [notifEnabled]);
  useEffect(() => { lsSet(LS_SORT, sortMode); }, [sortMode]);
  useEffect(() => { lsSet(LS_LANG, lang); }, [lang]);

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

  const urgencyValue = (game) => {
    const current = game.items.find(
      i => i.startDate && now >= i.startDate && (!i.endDate || now < i.endDate)
    );
    if (current?.endDate) return daysBetween(now, current.endDate);
    const upcoming = game.items
      .filter(i => i.startDate && now < i.startDate)
      .sort((a, b) => a.startDate - b.startDate)[0];
    if (upcoming) return daysBetween(now, upcoming.startDate);
    return Infinity;
  };

  const filteredSortedGames = useMemo(() => {
    const q = query.trim().toLowerCase();
    let list = games.filter(g =>
      !q || g.name.toLowerCase().includes(q) || g.shortName.toLowerCase().includes(q)
    );

    const pinnedSet = new Set(pinned);
    list = [...list].sort((a, b) => {
      const ap = pinnedSet.has(a.id) ? 0 : 1;
      const bp = pinnedSet.has(b.id) ? 0 : 1;
      if (ap !== bp) return ap - bp;
      if (sortMode === "urgent") return urgencyValue(a) - urgencyValue(b);
      return 0;
    });
    return list;
  }, [games, pinned, query, sortMode, now]);

  const highlights = useMemo(() => collectHighlights(games, now), [games, now]);

  // 위젯 미리보기용: 즐겨찾기가 있으면 그것부터, 없으면 임박순 상위 4개
  const widgetPreviewGames = useMemo(() => {
    if (pinned.length > 0) {
      const pinnedGames = games.filter(g => pinned.includes(g.id));
      if (pinnedGames.length > 0) return pinnedGames.slice(0, 4);
    }
    return [...games].sort((a, b) => urgencyValue(a) - urgencyValue(b)).slice(0, 4);
  }, [games, pinned, now]);

  const jumpToGame = (gameId) => {
    setCompact(false);
    setOpen(gameId);
    setQuery("");
    requestAnimationFrame(() => {
      cardRefs.current[gameId]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a0a", display: "flex", justifyContent: "center", alignItems: "flex-start", padding: "32px 16px 48px", fontFamily: "'Inter','Segoe UI',system-ui,sans-serif" }}>
      <div style={{ width: "100%", maxWidth: 440 }}>

        {/* Header */}
        <div style={{ marginBottom: 20, textAlign: "center", position: "relative" }}>
          <button
            onClick={() => setLang(l => l === "ko" ? "en" : "ko")}
            style={{
              position: "absolute", top: 0, right: 0,
              fontSize: 10, fontWeight: 800, padding: "4px 9px", borderRadius: 12,
              background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.15)",
              color: "rgba(255,255,255,0.6)", cursor: "pointer", letterSpacing: 0.5,
            }}
          >
            {t.langToggle}
          </button>
          <div style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "rgba(255,255,255,0.3)", marginBottom: 6, fontFamily: "monospace" }}>
            {t.appTitle}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "#fff", letterSpacing: -0.5 }}>{t.heading}</div>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.3)", marginTop: 4 }}>
            {t.asOf(kfmt(now, { year: "numeric", month: "long", day: "numeric" }, lang))}
          </div>
        </div>

        {!loading && <HighlightsBar highlights={highlights} onJump={jumpToGame} t={t} />}

        {/* Search */}
        <div style={{ marginBottom: 12 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            style={{
              width: "100%", boxSizing: "border-box",
              fontSize: 13, padding: "9px 12px", borderRadius: 10,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)",
              color: "#fff", outline: "none",
            }}
          />
        </div>

        {/* Controls */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 20, flexWrap: "wrap" }}>
          <button
            onClick={() => setCompact(v => !v)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: compact ? "rgba(255,255,255,0.12)" : "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.12)", color: "#fff",
              cursor: "pointer",
            }}
          >
            {compact ? t.viewCompact : t.viewDetailed}
          </button>
          <button
            onClick={() => setSortMode(m => m === "urgent" ? "default" : "urgent")}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: sortMode === "urgent" ? "rgba(231,76,60,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${sortMode === "urgent" ? "rgba(231,76,60,0.4)" : "rgba(255,255,255,0.12)"}`,
              color: sortMode === "urgent" ? "#e74c3c" : "#fff",
              cursor: "pointer",
            }}
          >
            {sortMode === "urgent" ? t.sortUrgent : t.sortDefault}
          </button>
          <button
            onClick={handleNotifToggle}
            title={notifPermission === "denied" ? t.notifDeniedTitle : ""}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: notifEnabled ? "rgba(241,196,15,0.15)" : "rgba(255,255,255,0.04)",
              border: `1px solid ${notifEnabled ? "rgba(241,196,15,0.4)" : "rgba(255,255,255,0.12)"}`,
              color: notifEnabled ? "#f1c40f" : "#fff",
              cursor: "pointer",
            }}
          >
            {notifEnabled ? t.notifOn : t.notifOff}
          </button>
          <button
            onClick={() => setShowWidgetPreview(true)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.12)",
              color: "#fff", cursor: "pointer",
            }}
          >
            {t.widgetPreview}
          </button>
          <button
            onClick={() => downloadICS(games, now, t, lang)}
            style={{
              fontSize: 11, fontWeight: 700, padding: "6px 12px", borderRadius: 20,
              background: "rgba(126,231,135,0.08)", border: "1px solid rgba(126,231,135,0.25)",
              color: "#7ee787", cursor: "pointer",
            }}
          >
            {t.exportIcs}
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 60, fontSize: 14 }}>
            {t.loading}
          </div>
        ) : filteredSortedGames.length === 0 ? (
          <div style={{ textAlign: "center", color: "rgba(255,255,255,0.3)", paddingTop: 40, fontSize: 13 }}>
            {t.noMatch(query)}
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: compact ? 8 : 16 }}>
            {filteredSortedGames.map(game => (
              <GameCard
                key={game.id} game={game} now={now}
                ref={el => cardRefs.current[game.id] = el}
                open={!compact && open === game.id}
                onToggle={() => !compact && setOpen(p => p === game.id ? null : game.id)}
                pinned={pinned.includes(game.id)}
                onTogglePin={() => togglePin(game.id)}
                compact={compact}
                lang={lang}
                t={t}
              />
            ))}
          </div>
        )}

        {compact && (
          <div style={{ textAlign: "center", marginTop: 12, fontSize: 10, color: "rgba(255,255,255,0.2)" }}>
            {t.compactHint}
          </div>
        )}

        <div style={{ textAlign: "center", marginTop: 24, fontSize: 10, color: "rgba(255,255,255,0.15)", letterSpacing: 0.5 }}>
          {t.footerHint}
          {lastUpdated && <><br />{t.infoUpdated(lastUpdated)}</>}
        </div>
      </div>

      {showWidgetPreview && (
        <WidgetPreviewModal
          games={widgetPreviewGames} now={now} lang={lang} t={t}
          onClose={() => setShowWidgetPreview(false)}
        />
      )}
    </div>
  );
}
