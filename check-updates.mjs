#!/usr/bin/env node
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// Scans games.json and prints things worth double-checking.
// Does NOT search the web or auto-update anything — it just points
// out logical gaps so you know what to look into.
// Run: npm run check
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
  return JSON.parse(readFileSync(JSON_PATH, "utf-8"));
}

function main() {
  const data = loadData();
  const now = new Date();
  const warnings = [];
  const infos = [];

  const lastUpdatedStr = data._readme?.["최종_업데이트"];
  if (lastUpdatedStr) {
    const m = lastUpdatedStr.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (m) {
      const lastDate = new Date(`${m[1]}-${m[2]}-${m[3]}T00:00:00Z`);
      const daysSince = daysBetween(lastDate, now);
      if (daysSince >= 14) {
        warnings.push(`Data was last checked ${daysSince} days ago (${lastUpdatedStr}). Might be worth a refresh.`);
      } else {
        infos.push(`Last checked: ${lastUpdatedStr} (${daysSince} day(s) ago)`);
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
        warnings.push(`[${game.shortName}] No currently active season/patch. Check whether the next season's start date has been added.`);
      }
      return;
    }

    if (current.endDate) {
      const left = daysBetween(now, current.endDate);
      if (left <= 7) {
        const idx = items.indexOf(current);
        const next = items[idx + 1];
        if (!next || !next.startDate) {
          warnings.push(`[${game.shortName}] "${current.name}" ends in ${left} day(s), but there's no next entry yet. Check for an official announcement.`);
        }
      }
      if (left < 0) {
        warnings.push(`[${game.shortName}] "${current.name}" end date has already passed (${-left} day(s) ago). May need to roll over to the next season.`);
      }
    }
  });

  console.log(`\n${BOLD}🎮 Season Tracker — Update Check${RESET}`);
  console.log(`${DIM}As of ${now.toLocaleString("en-US")}${RESET}\n`);

  if (infos.length > 0) {
    infos.forEach(i => console.log(`${GREEN}✓${RESET} ${i}`));
    console.log("");
  }

  if (warnings.length === 0) {
    console.log(`${GREEN}✓ Nothing looks like it needs attention right now.${RESET}\n`);
  } else {
    console.log(`${YELLOW}${BOLD}⚠ Things that might need a look (${warnings.length})${RESET}\n`);
    warnings.forEach(w => console.log(`${YELLOW}•${RESET} ${w}`));
    console.log("");
  }

  console.log(`${DIM}This script only reasons over games.json — it never fetches live data.${RESET}`);
  console.log(`${DIM}If something's flagged, check the official site (or ask Claude to look it up) and update games.json.${RESET}\n`);
}

main();
