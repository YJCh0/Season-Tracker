# 🎮 Game Season Tracker — 실행 매뉴얼

## 📁 폴더 구조

```
season-tracker/
├── index.html
├── package.json
├── vite.config.js
├── README.md               ← 이 파일
├── public/
│   └── assets/
│       ├── games.json      ← 날짜·이름·링크 수정은 여기만
│       └── logos/          ← 🖼️ 게임·패치 로고 이미지를 여기에 넣으세요
│           ├── d4.png
│           ├── d4-s14.png
│           ├── wow.png
│           ├── wow-voidspire.png
│           └── ...
└── src/
    ├── main.jsx
    └── App.jsx              ← 화면 구조·디자인 코드 (평소엔 안 건드려도 됨)
```

**중요**: 로고 이미지와 JSON 데이터는 반드시 `public/assets/` 안에 있어야 브라우저가 읽을 수 있어요. `src/` 폴더 안에 넣으면 인식되지 않아요.

---

## 🚀 처음 실행 (최초 1회)

```bash
# 1. Node.js 설치 여부 확인
node -v

# 설치 안 돼 있다면:
brew install node

# 2. 프로젝트 폴더로 이동
cd /Users/youngjuncho/Documents/Warcraft/main/season-tracker

# 3. 패키지 설치 (최초 1회만)
npm install

# 4. 개발 서버 실행
npm run dev
```

터미널에 `http://localhost:5173` 이 뜨면 브라우저에서 열면 돼요.

---

## 🔄 이후 실행 (매번)

```bash
cd /Users/youngjuncho/Documents/Warcraft/main/season-tracker
npm run dev
```

종료: 터미널에서 `Ctrl + C`

---

## ✏️ 시즌/패치 정보 업데이트

**코드를 건드릴 필요 없이 `public/assets/games.json` 파일만 열어서 수정하면 돼요.**

### 날짜 수정
```json
"startDate": "2026-06-30T17:00:00Z",   // 시작일 (UTC 기준, ISO 8601 형식)
"endDate": "2026-07-20T00:00:00Z",     // 종료일 — 미발표면 null
"endIsEstimate": false                 // true = "(추정)" 표시
```

### 새 시즌/패치 추가
각 게임의 `items` 배열에 항목을 추가하면 로드맵에 자동으로 나타나요:
```json
{
  "id": "고유한-id",
  "name": "시즌 이름",
  "sub": "부제목",
  "icon": "🔥",
  "logo": "파일명.png 또는 null",
  "startDate": "2026-08-01T00:00:00Z",
  "endDate": null,
  "endIsEstimate": false,
  "note": "설명 텍스트",
  "patchUrl": "https://패치노트-링크 또는 null",
  "sourceType": "official 또는 community",
  "starterBuildUrl": "https://참고사이트-링크 또는 null",
  "buildLabel": "버튼에 표시할 텍스트 (예: '메타 통계 ↗')"
}
```

### 새 게임 추가
`games` 배열 전체에 게임 객체를 하나 더 추가하면 카드가 자동으로 생겨요. 기존 게임 항목을 복사해서 값만 바꾸면 가장 쉬워요.

저장하면 브라우저가 자동으로 새로고침돼요 (Vite Hot Reload).

---

## 🔗 게임별 참고 사이트 링크 (starterBuildUrl)

로드맵을 펼쳤을 때 각 시즌/패치 항목에 뜨는 보조 링크 버튼이에요. 게임마다 성격이 달라서 버튼 텍스트(`buildLabel`)도 다르게 붙여뒀어요.

| 게임 | 연결된 사이트 | 버튼 텍스트 |
|---|---|---|
| Hearthstone | [hsguru.com 메타 (Top Legend)](https://www.hsguru.com/meta?format=2&rank=top_legend) | 메타 통계 ↗ |
| World of Warcraft | [archon.gg 신화 난이도 DPS 티어리스트](https://www.archon.gg/wow/tier-list/dps-rankings/raid/mythic/all-bosses) | DPS 티어리스트 ↗ |
| Diablo IV / D2R / PoE1 / PoE2 / Last Epoch / Torchlight: Infinite | Maxroll·TLIDB 등 빌드 가이드 | 빌드 가이드 ↗ / 빌드 DB ↗ |

다른 사이트로 바꾸고 싶으면 games.json에서 해당 항목의 `starterBuildUrl`과 `buildLabel`만 고치면 돼요.

---

## 🏷️ 공식/커뮤니티 배지 (sourceType)

패치노트 링크 옆에 초록색 **공식** 또는 회색 **커뮤니티** 태그가 자동으로 붙어요. `news.blizzard.com`, `pathofexile.com` 도메인은 공식으로, 그 외(Wowhead, Maxroll 등)는 커뮤니티로 분류돼 있어요. `sourceType` 필드를 직접 `"official"` / `"community"`로 바꿔서 조정할 수도 있어요.

---

## ⭐ 즐겨찾기 (고정)

각 게임 카드 오른쪽의 별 아이콘(☆/★)을 누르면 그 게임이 목록 맨 위로 고정돼요. 브라우저에 저장되기 때문에 앱을 껐다 켜도 유지돼요.

---

## 📋 컴팩트 뷰

헤더의 **"상세 / 컴팩트"** 버튼으로 보기 방식을 전환할 수 있어요. 컴팩트 모드는 카드 크기를 줄여서 한 화면에 더 많은 게임을 볼 수 있게 해주는 요약 보기예요 (로드맵 펼치기는 상세 모드에서만 가능).

---

## 🔔 알림

헤더의 **"알림 켜짐/꺼짐"** 버튼을 누르면 브라우저 알림 권한을 요청해요. 허용하면 각 게임의 시즌/패치 시작·종료 **D-7, D-1**에 자동으로 알림이 떠요. 같은 알림이 하루에 여러 번 뜨지 않도록 중복 방지 처리가 되어 있어요.

⚠️ 아이폰에서 알림을 받으려면 일반 Safari 탭이 아니라, **홈 화면에 추가한 앱(PWA)** 상태여야 해요 (iOS 16.4 이상). 아래 "아이폰에서 위젯처럼 보기" 섹션을 먼저 따라 하세요.

---

## 🖼️ 게임/패치 로고 이미지 넣는 방법

### 1단계 — 이미지 파일 복사
정사각형 PNG 또는 WebP 이미지를 아래 폴더에 넣습니다:
```
public/assets/logos/
```

### 2단계 — games.json의 logo 필드에 파일명만 입력
전체 경로가 아니라 **파일명만** 적으면 돼요:
```json
"logo": "d4.png"
```

이미지가 없거나 파일이 없으면 자동으로 이모지(`icon` 필드)로 대체돼요. 게임 카드는 **현재 진행 중인 패치/시즌의 로고 → 게임 대표 로고 → 이모지** 순으로 자동 선택돼요.

---

## 🎨 색상 변경 방법

`games.json`의 각 게임에서:
```json
"accentColor": "#c0392b",              // 링·글씨 색상 (HEX)
"glowColor": "rgba(192,57,43,0.35)",   // 카드 발광 색상
"bgColor": "#1a0a0a"                   // 카드 배경색
```

---

## 📱 아이폰에서 위젯처럼 보기

### 방법 1 — 같은 와이파이에서 Safari 홈화면 추가
```bash
# Mac IP 확인
ipconfig getifaddr en0
```
아이폰 Safari에서 `http://[IP주소]:5173` 접속 → 공유 버튼 → 홈 화면에 추가

### 방법 2 — Vercel 배포 (Mac이 꺼져 있어도 접근 가능, 추천)
```bash
npm install -g vercel
cd season-tracker
vercel
```
배포된 URL을 아이폰 Safari에서 열고 홈 화면에 추가하면 앱처럼 사용할 수 있고, 알림 기능도 정상 동작해요.

---

## 📦 빌드 (배포용 파일 생성)

```bash
npm run build
```
`dist/` 폴더에 정적 파일이 생성돼요. Vercel, Netlify, GitHub Pages 등에 업로드하면 돼요.

---

## 🗂️ 현재 추적 중인 게임 (10종)

| 게임 | 로드맵 기준 |
|---|---|
| Diablo IV | 시즌 |
| Diablo II: Resurrected | 래더 시즌 |
| Path of Exile | 리그 |
| Path of Exile 2 | 리그 |
| World of Warcraft | 레이드 |
| Hearthstone | 확장팩 |
| StarCraft II | 패치 |
| Overwatch 2 | 시즌 |
| Last Epoch | 사이클(시즌) |
| Torchlight: Infinite | 시즌 |

---

## 🔍 데이터 정확도 안내

이 트래커의 날짜는 각 게임 공식 발표 또는 공신력 있는 커뮤니티 소스(Wowhead, Maxroll 등)를 기반으로 하며, `games.json` 최상단 `_readme.최종_업데이트` 필드와 앱 하단 "정보 갱신" 표시에 마지막 확인 날짜가 나와요. 게임사가 날짜를 변경하거나 새로 공지하면 `games.json`만 다시 열어 수정하면 됩니다.
