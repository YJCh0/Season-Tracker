# 🎮 Game Season Tracker — Setup Guide

## 📁 Project Structure

```
season-tracker/
├── index.html
├── package.json
├── vite.config.js
├── README.md               ← this file
├── scripts/
│   └── check-updates.mjs   ← run with `npm run check`
├── public/
│   └── assets/
│       ├── games.json      ← edit dates, names, and links here only
│       └── logos/          ← 🖼️ put game/patch logo images here
│           ├── d4.png
│           ├── d4-s14.png
│           ├── wow.png
│           ├── wow-voidspire.png
│           └── ...
└── src/
    ├── main.jsx
    └── App.jsx              ← layout/design code (rarely needs editing)
```

**Important**: logo images and JSON data must live under `public/assets/` — the browser can't load them from `src/`.

---

## 🚀 First-time setup

```bash
# 1. Check Node.js is installed
node -v

# If not:
brew install node

# 2. Move into the project folder
cd /path/to/season-tracker

# 3. Install dependencies (once)
npm install

# 4. Start the dev server
npm run dev
```

Once the terminal shows `http://localhost:5173`, open it in a browser.

---

## 🔄 Running it again later

```bash
cd /path/to/season-tracker
npm run dev
```

Stop it with `Ctrl + C`.

---

## ✏️ Updating season/patch info

**No code changes needed — just edit `public/assets/games.json`.**

### Editing dates
```json
"startDate": "2026-06-30T17:00:00Z",   // start (UTC, ISO 8601)
"endDate": "2026-07-20T00:00:00Z",     // end — null if not yet announced
"endIsEstimate": false                 // true shows an "estimate" badge
```

### Adding a new season/patch
Add an entry to a game's `items` array and it shows up in the roadmap automatically:
```json
{
  "id": "unique-id",
  "name": "Season Name",
  "sub": "Subtitle",
  "icon": "🔥",
  "logo": "filename.png or null",
  "startDate": "2026-08-01T00:00:00Z",
  "endDate": null,
  "endIsEstimate": false,
  "estimate": "Guessed timing text (only shown when startDate is null)",
  "note": "Description",
  "patchUrl": "https://patch-notes-link or null",
  "sourceType": "official or community",
  "starterBuildUrl": "https://reference-site-link or null",
  "buildLabel": "Button text (e.g. 'Meta Stats ↗')",
  "name_en": "English name (optional, used with EN toggle)",
  "sub_en": "English subtitle (optional)",
  "note_en": "English note (optional)",
  "estimate_en": "English estimate text (optional)"
}
```

### Adding a whole new game
Append a full game object to the `games` array and a card appears automatically. Easiest way: duplicate an existing entry and change the values.

Saving the file triggers Vite's hot reload — the browser updates on its own.

---

## 🌐 Korean/English toggle

The **EN / KO** button in the top-right corner switches the interface language. All fixed UI text (buttons, labels, headers) is translated built-in. Per-game and per-item text (season labels, subtitles, notes, estimates) uses the optional `*_en` fields in `games.json` — if a translation is missing, it falls back to the Korean text automatically.

---

## ⭐ Pinning favorites

Click the star icon (☆/★) on any game card to pin it to the top of the list. This is saved in the browser, so it persists across sessions.

---

## ⏰ This week's highlights

A summary box below the header shows **anything launching or ending within 7 days**, across every tracked game, so you don't have to expand each card to check. Clicking an entry scrolls to and expands that game's card. The box disappears entirely when nothing is imminent.

---

## 🔍 Search & sort

- **Search box**: filters by game name or short name (D4, WoW, etc.).
- **"Default / Soonest" button**: switches to soonest-first sorting by upcoming/ending dates. Pinned (★) games always stay at the top regardless of sort mode.

---

## 📋 Compact view

The **"Detailed / Compact"** button in the header toggles a condensed layout that fits more games on one screen (roadmap expansion is only available in Detailed view).

---

## 🏷️ Confirmed vs. estimated dates

All uncertain dates use the same yellow **"EST."** badge, whether it's:
- An end date that isn't fully confirmed (`endIsEstimate: true`)
- A next season's rough timing when the exact date isn't announced yet (`estimate` field)

The `estimate` field is **display-only text** — it's never used in progress bars or D-day math. Example:
```json
{
  "id": "wow-venomous",
  "startDate": null,
  "estimate": "Likely August 11",
  "note": "12.1 Curse of Ula'tek · exact date unconfirmed"
}
```

---

## 🔔 Notifications

The **"Notifications On/Off"** button requests browser notification permission. Once granted, you'll get a notification **7 and 1 day** before any tracked start or end date. Duplicate notifications on the same day are suppressed automatically.

⚠️ On iPhone, notifications only work if the app is added to your **Home Screen (PWA)**, not just opened as a regular Safari tab (iOS 16.4+). Follow "View as a widget on iPhone" below first.

---

## 📅 Add to Google Calendar

When a roadmap item has an upcoming launch or a known end date, you'll see a **"📅 Add launch date" / "📅 Add end date"** button. Clicking it opens a new tab with Google Calendar pre-filled with a 1-hour event — just hit save. No login or app install needed; it works the same on Android, iPhone, or desktop.

---

## 📥 Export all events (.ics)

The **"📥 Export Calendar"** button in the control bar downloads a single `.ics` file containing every upcoming launch and active end date across *all* tracked games at once. Import it into Google Calendar, Apple Calendar, Outlook, or any calendar app that supports the standard iCalendar format.

---

## 📱 Widget preview

The **"📱 Widget Preview"** button opens a mockup styled like an iOS home-screen widget, showing your pinned games (or the 4 soonest if nothing's pinned) in a small grid. This is a **visual preview only** — it's not a real iOS widget. For an actual home-screen presence, see the section below.

---

## 🩺 Update-check script

Instead of manually eyeballing 10 games' worth of dates, this script scans `games.json` and flags anything that looks off.

```bash
npm run check
```

It checks for:
- Games with **no currently active season/patch** (possible missing next-season entry)
- A current item ending within **7 days** with no next entry yet
- End dates that have **already passed** without being updated
- Data that hasn't been checked in **14+ days**

⚠️ This script never fetches live data or auto-updates anything — it only catches logical gaps in `games.json`. When it flags something, check the official site (or ask Claude to look it up) and edit `games.json` yourself.

---

## 🖼️ Adding game/patch logos

### Step 1 — copy image files
Drop square PNG or WebP images into:
```
public/assets/logos/
```

### Step 2 — reference by filename only in games.json
Not a full path — just the filename:
```json
"logo": "d4.png"
```

Missing or broken images fall back to the emoji in the `icon` field automatically. The card ring picks logos in this order: **current patch/season logo → game's main logo → emoji**.

---

## 🎨 Changing colors

Per game in `games.json`:
```json
"accentColor": "#c0392b",              // ring/text color (HEX)
"glowColor": "rgba(192,57,43,0.35)",   // card glow color
"bgColor": "#1a0a0a"                   // card background
```

---

## 📱 View as a widget on iPhone

### Option 1 — Same Wi-Fi, add to Safari home screen
```bash
# find your Mac's local IP
ipconfig getifaddr en0
```
On your iPhone, open Safari to `http://[your-ip]:5173` → Share → Add to Home Screen.

### Option 2 — Deploy to Vercel (works even when your Mac is off, recommended)
```bash
npm install -g vercel
cd season-tracker
vercel
```
Open the deployed URL in Safari and add it to your home screen — it'll behave like a real app, and notifications will work properly.

---

## 📦 Building for deployment

```bash
npm run build
```
Static files land in `dist/`. Upload to Vercel, Netlify, GitHub Pages, or any static host.

---

## 🗂️ Games currently tracked (10)

| Game | Roadmap basis |
|---|---|
| Diablo IV | Season |
| Diablo II: Resurrected | Ladder Season |
| Path of Exile | League |
| Path of Exile 2 | League |
| World of Warcraft | Raid |
| Hearthstone | Expansion |
| StarCraft II | Patch |
| Overwatch (formerly Overwatch 2) | Season |
| Last Epoch | Cycle (Season) |
| Torchlight: Infinite | Season |

---

## 🔍 A note on accuracy

Dates come from official announcements or reliable community sources (Wowhead, Maxroll, etc.). The `_readme.최종_업데이트` field at the top of `games.json`, and the "Last updated" line at the bottom of the app, show when the data was last checked. When a developer changes or announces a date, just edit `games.json` directly.

**Note**: "Overwatch 2" was officially rebranded to just **"Overwatch"** (dropping the "2") in February 2026. This tracker keeps the internal id `ow2` for compatibility, but displays the name "Overwatch."

---

## 📝 Contributing notes for future updates

Going forward, **this README is maintained in English**. When updating the project (new games, new features, data refreshes), keep this file in English — translate as needed rather than switching languages mid-document.
