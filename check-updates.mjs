#!/usr/bin/env node
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// games.json을 점검해서 "확인이 필요한 부분"을 터미널에 알려주는 스크립트.
// 실제 웹 검색이나 자동 업데이트는 하지 않음 — 어디를 봐야 할지 짚어주는 용도.
// 실행: npm run check
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
import { readFileSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const JSON_PATH = path.join(__dirname, "..", "public", "assets", "games.json");

const RESET = "\x1b[0m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const GREEN = "\x1b[32m";
const DIM = "\x1b[2m";
const BOLD = "\x1b[1m";

function daysBetween(a, b) {
  return Math.floor((b - a) / 86400000);
}

function loadData() {
  const raw = JSON.parse(readFileSync(JSON_PATH, "utf-8"));
  return raw;
}

function main() {
  const data = loadData();
  const now = new Date();
  const warnings = [];
  const infos = [];

  // 최종 업데이트로부터 경과일
  const lastUpdatedStr = data._readme?.["최종_업데이트"];
  if (lastUpdatedStr) {
    const m = lastUpdatedStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const lastDate = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
      const daysSince = daysBetween(lastDate, now);
      if (daysSince >= 14) {
        warnings.push(`전체 데이터가 마지막으로 확인된 지 ${daysSince}일 지났어요 (${lastUpdatedStr}). 한 번 훑어볼 때가 됐을 수 있어요.`);
      } else {
        infos.push(`마지막 확인: ${lastUpdatedStr} (${daysSince}일 전)`);
      }
    }
  }

  data.games.forEach(game => {
    const items = game.items.map(item => ({
      ...item,
      startDate: item.startDate ? new Date(item.startDate) : null,
      endDate: item.endDate ? new Date(item.endDate) : null,
    }));

    const current = items.find(
      i => i.startDate && now >= i.startDate && (!i.endDate || now < i.endDate)
    );

    if (!current) {
      const anyKnown = items.some(i => i.startDate);
      if (anyKnown) {
        warnings.push(`[${game.shortName}] 현재 활성 시즌/패치가 없어요. 새 시즌 시작일이 등록됐는지 확인해보세요.`);
      }
      return;
    }

    // 현재 항목 종료 임박인데 다음 항목 날짜가 없는 경우
    if (current.endDate) {
      const left = daysBetween(now, current.endDate);
      if (left <= 7) {
        const idx = items.indexOf(current);
        const next = items[idx + 1];
        if (!next || !next.startDate) {
          warnings.push(`[${game.shortName}] "${current.name}" 종료까지 ${left}일 남았는데 다음 일정이 아직 없어요. 공식 발표를 확인해보세요.`);
        }
      }
      if (left < 0) {
        warnings.push(`[${game.shortName}] "${current.name}" 종료일이 이미 지났어요 (${-left}일 전). 다음 시즌으로 갱신이 필요할 수 있어요.`);
      }
    }

    // logo 필드가 있는데 파일이 없는 경우는 브라우저에서 자동 처리되므로 스킵
  });

  // 출력
  console.log(`\n${BOLD}🎮 Season Tracker — 업데이트 점검${RESET}`);
  console.log(`${DIM}${now.toLocaleString("ko-KR")} 기준${RESET}\n`);

  if (infos.length > 0) {
    infos.forEach(i => console.log(`${GREEN}✓${RESET} ${i}`));
    console.log("");
  }

  if (warnings.length === 0) {
    console.log(`${GREEN}✓ 지금 당장 확인이 필요한 항목은 없어요.${RESET}\n`);
  } else {
    console.log(`${YELLOW}${BOLD}⚠ 확인이 필요할 수 있는 항목 (${warnings.length}개)${RESET}\n`);
    warnings.forEach(w => console.log(`${YELLOW}•${RESET} ${w}`));
    console.log("");
  }

  console.log(`${DIM}이 스크립트는 games.json만 읽어서 논리적으로 점검할 뿐, 실제 최신 정보를 가져오지는 않아요.${RESET}`);
  console.log(`${DIM}경고가 뜨면 공식 사이트나 Claude에게 "이 게임들 최신 정보 확인해줘"라고 물어보고 games.json을 업데이트하세요.${RESET}\n`);
}

main();
