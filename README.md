# 🎮 Game Season Tracker

## 📁 폴더 구조

```
season-tracker/
├── index.html
├── package.json
├── vite.config.js
├── README.md               ← 이 파일
├── public/
│   └── assets/
│       ├── games.json      ← 날짜·이름·URL 수정은 여기만
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

## ✏️ 시즌/패치 정보 업데이트 (가장 자주 하게 될 작업)

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
  "patchUrl": "https://패치노트-링크 또는 null"
}
```

### 새 게임 추가
`games` 배열 전체에 게임 객체를 하나 더 추가하면 카드가 자동으로 생겨요. 기존 게임 항목을 복사해서 값만 바꾸면 가장 쉬워요.

저장하면 브라우저가 자동으로 새로고침돼요 (Vite Hot Reload).

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
배포된 URL을 아이폰 Safari에서 열고 홈 화면에 추가하면 앱처럼 사용할 수 있어요.

---

## 📦 빌드 (배포용 파일 생성)

```bash
npm run build
```
`dist/` 폴더에 정적 파일이 생성돼요. Vercel, Netlify, GitHub Pages 등에 업로드하면 돼요.

---

## 🗂️ 현재 추적 중인 게임 (9종)

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

---

## 🔍 데이터 정확도 안내

이 트래커의 날짜는 각 게임 공식 발표 또는 공신력 있는 커뮤니티 소스(Wowhead, Maxroll 등)를 기반으로 하며, `최종_업데이트` 필드(games.json 최상단)에 마지막 확인 날짜가 표시돼 있어요. 게임사가 날짜를 변경하거나 새로 공지하면 `games.json`만 다시 열어 수정하면 됩니다.
