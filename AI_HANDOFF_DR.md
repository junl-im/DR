# AI_HANDOFF_DR.md - Dream Library 이어받기 문서

## 현재 작업중인 내용 1열

| 항목 | 기록 |
|---|---|
| 현재 버전 | v1.0.78 |
| 프로젝트 | 꿈의 서고 / Dream Library, 세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG |
| 이번 패치 | Combat HUD Density, Boss Statusbar Readability, Skill Bar Touch Clearance and Low-End Render Guard Patch |
| 핵심 수정 | 전투 HUD 상단/하단 밀도, 보스 상태바 글자 겹침, 보드 아래 조작 버튼 터치 오입력 가능성, 저사양 VFX 예산을 함께 안정화 |
| UI/UX 우선순위 | 보스/몬스터 그림은 v1.0.77처럼 보드에 올라오지 않게 유지하고, 이번 v1.0.78에서는 보드와 하단 버튼 사이 안전 여백 및 작은 화면 읽기성을 강화 |
| 예전 코드 방지 | active HTML/main에서 `statusbar-icon-right-v1046`, 보드 미니맵, 드래그 이동 도움말, 손가락 시작 문구가 되살아나면 QA 실패로 본다 |
| 작업 기준 | 이전 산출물 `DR_v1.0.77.zip`에서 이어서 작업 |
| 필수 산출 | 그대로 사용 가능한 풀파일 ZIP 1개, 덮어쓰기용 패치 ZIP 1개 |
| 산출 파일명 규칙 | 짧은 이름 + 버전 숫자 포함. 예: `DR_v1.0.78.zip`, `DR_patch_v1.0.78.zip` |
| 기록 파일 규칙 | 매 패치마다 `README.md`와 이 `AI_HANDOFF_DR.md`를 같이 갱신 |
| 불필요 파일 금지 | 임시 분석 파일, `dist`, `node_modules`, `package-lock.json`, `DELETE_REMOVED`, 과거 1회성 삭제 스크립트는 산출 ZIP에서 제외 |

## 작업 환경 절대 유지

- 사용자는 GitHub Desktop으로 파일을 확인하고 커밋/푸시한다.
- 배포는 GitHub Pages와 Firebase Hosting 둘 다 고려한다.
- Firebase는 무료 요금제 기준으로 유지한다.
- Firebase project id는 `dream-library-b732a` 이다.
- GitHub Pages 빌드는 `/DR/` base를 사용한다.
- Firebase 빌드는 `/` base를 사용한다.
- Node는 GitHub Actions 기준 Node 20 LTS를 유지한다.
- Actions에서는 `npm ci`를 쓰지 않고, `rm -f package-lock.json` 후 `npm install --no-audit --no-fund --prefer-online`을 사용한다.
- 로컬과 ZIP 산출물에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않는다.
- 산출 규칙 문구 고정: `package-lock.json 제외`, `풀파일 ZIP`, `패치 ZIP`은 매번 기록한다.
- SVG는 금지한다. 이미지 정책은 PNG/WebP/JPG 중심이다.
- 현재 GitHub Actions workflow는 GitHub Pages와 quality-check 양쪽 모두 `npm run check:boss-board-clearance`, `npm run check:combat-hud-touch-clearance`를 실행한다.

## 사용자가 결과를 보기 위한 명령

처음 받은 ZIP을 푼 뒤 또는 패치 ZIP을 덮어쓴 뒤 아래 순서로 실행한다.

```bash
npm install --no-audit --no-fund --prefer-online
npm run dev
```

브라우저에서 Vite가 알려주는 로컬 주소를 연다. 모바일 실제 기기 확인 시 같은 네트워크에서 아래처럼 실행한다.

```bash
npm run dev -- --host 0.0.0.0
```

GitHub Pages용 결과 확인:

```bash
npm run build:github
npm run preview -- --host 0.0.0.0
```

Firebase Hosting용 결과 확인:

```bash
npm run build:firebase
npm run preview -- --host 0.0.0.0
```

Firebase 배포는 사용자가 로그인/권한 확인 후 직접 실행한다.

```bash
firebase deploy --only hosting
firebase deploy --only firestore:rules
firebase deploy --only hosting,firestore
```

## 필수 검수 명령

패치를 만든 AI는 최종 ZIP 생성 전에 최소 아래 명령을 실행하고 결과를 기록한다.

```bash
npm run typecheck
npm run check:assets
npm run check:health
npm run check:workflows
npm run check:lobby-shortcut-scroll
npm run check:lobby-navigation-rhythm
npm run check:boss-stage-lobby-scroll
npm run check:stage-ladder-boss-lobby
npm run check:stage-map-boss-difficulty-lobby
npm run check:pixi-boss-layer
npm run check:boss-asset-visibility
npm run check:boss-board-clearance
npm run check:combat-hud-touch-clearance
npm run report:images
npm run build:github
```

가능하면 전체 `check:*` 스크립트를 모두 실행한다. 현재 v1.0.79 기준 `check:modal-focus-rank-budget`까지 총 86개 `check:*` 스크립트가 있다.

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.78 실제 수정 내역

- `package.json` 버전을 `1.0.78`로 갱신했다.
- `index.html`의 `.battle-stage`, `.board-camera-shell`, `#pixi-board-host`, `.game-actions`에 `data-combat-hud-touch-clearance="v1078-combat-hud-touch-clearance"`를 부여했다.
- 하단 조작 버튼에 `data-action-role="hint|shuffle|restart"`와 사용자용 `aria-label`을 추가해 터치/접근성 기준을 명확히 했다.
- `src/main.ts`에 `COMBAT_HUD_TOUCH_CLEARANCE_PATCH`, `BOSS_STATUSBAR_READABILITY_PATCH`, `LOW_END_RENDER_BUDGET_GUARD_PATCH`를 추가했다.
- `syncCombatHudTouchClearance()`를 추가해 화면 회전/리사이즈/게임 HUD 렌더 때 보드, 상태바, 하단 버튼의 밀도 상태를 다시 동기화한다.
- 작은 화면에서는 `.game-actions`를 더 낮은 높이와 안정된 sticky safe-area로 다듬어 보드 터치와 버튼 터치가 섞이지 않도록 했다.
- 보스 상태바는 `v1078-boss-statusbar-readability`로 이름/예고/HP 라벨을 ellipsis 처리하고, 작은 화면에서는 보조 설명을 접어 겹침을 줄인다.
- `DreamPixiRenderer`의 lite/balanced VFX 예산을 한 단계 낮춰 저사양 기기에서 경고/컷인/파티클 부담을 줄였다. lite는 `particleCap: 11`, `spriteStride: 3` 기준이다.
- `tools/check-combat-hud-touch-clearance.mjs`를 추가했다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.78까지 확장했다.
- GitHub Pages / quality-check workflow에 `npm run check:combat-hud-touch-clearance`를 추가했다.
- `public/sw.js` cache를 `dream-library-cache-v1.0.78`로 갱신하고 `texture-atlas-manifest-v1.0.78.json`을 선로드에 추가했다.
- `src/game/difficulty.js`에 v1.0.78 atlas manifest anchor를 추가했다.

## v1.0.78 검수 결과

- `npm run typecheck` 통과.
- 전체 85개 `check:*` QA suite 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run report:images` 통과. 454 files, 51.98 MB. 1.2 MB 초과 이미지 9개는 후속 최적화 후보.
- `npm run build:github` 통과.
- 빌드 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고가 계속 있음. 기존 경고이며 실패 아님.
- 빌드 경고: `vendor-effects` chunk 500 KB 초과 경고가 계속 있음. 기존 경고이며 실패 아님.

## v1.0.78에서 특히 확인해야 할 화면

- 360~390px 폭, 650~720px 높이에서 시간/점수/콤보/이동 칸이 2줄로 깨지거나 버튼과 겹치지 않아야 한다.
- 보스 상태바의 보스명, 예고 pill, HP 라벨, HP 바가 왼쪽 보스 초상과 오른쪽 echo 사이에서 눌리지 않아야 한다.
- 하단 `힌트/섞기/다시 시작` 버튼을 누를 때 보드 타일 선택이 같이 일어나지 않아야 한다.
- 보드 아래 버튼은 safe-area를 침범하지 않고, 작은 화면에서도 보드와 최소 여백을 유지해야 한다.
- v1.0.77의 보스 보드 방해 방지 상태가 유지되어야 한다. 보스/몬스터 큰 그림이 보드 아래쪽에 다시 나타나면 실패다.
- old active attribute `data-boss-layout="statusbar-icon-right-v1046"`가 HTML/main에서 다시 나타나면 실패로 봐야 한다.

## 이전 버전 기록 요약

### v1.0.77

- 전투 화면에서 보스/몬스터 그림이 하단 보드와 스킬바 근처에 떠서 플레이를 방해하던 문제를 우선 수정했다.
- 보스 원본 이미지는 상태바 왼쪽 끝 `boss-core`로 이동했다.
- 보스 경고/피격 atlas 연출은 상태바 오른쪽 `boss-lane-echo`로 제한했다.
- Pixi 보스 sprite/aura는 상태바 echo가 있으면 보드 위에서 `visible=false`, `renderable=false`, `alpha=0`으로 차단한다.
- `check:boss-board-clearance`로 예전 오른쪽 보스 배치가 되살아나지 않게 검사한다.

### v1.0.76

- `AI_HANDOFF_DR.md`를 신규 생성했다.
- 로비 바로가기 메뉴 아이콘 polish, 패널 스크롤 QA, 모달 닫기 흐름, 로비 내비게이션 리듬을 개선했다.
- GitHub Desktop, Firebase 무료, ZIP 산출/제외 규칙을 문서화했다.

## ZIP 생성 규칙

풀파일 ZIP에는 프로젝트 실행에 필요한 원본 소스와 public asset을 넣는다.

포함해야 하는 대표 항목:

- `index.html`
- `package.json`
- `README.md`
- `AI_HANDOFF_DR.md`
- `.github/workflows/*`
- `src/**`
- `public/**`
- `tools/**`
- `docs/**`
- Firebase 설정 파일

제외해야 하는 항목:

- `node_modules/**`
- `dist/**`
- `package-lock.json`
- `.git/**`
- `DELETE_REMOVED*`
- 임시 분석/작업 폴더
- 과거 1회성 삭제 스크립트

패치 ZIP에는 v1.0.78에서 v1.0.79로 바뀐 파일만 넣는다. 삭제가 필요한 임시 파일은 만들지 않는다.

## 다음 업데이트 예상 내역

다음은 v1.0.80으로 이어간다.

- 이미지 1.2 MB 초과 9개 WebP/PNG 실제 압축 적용 및 visual regression 확인.
- 로비 긴 카드와 상점/복원/도감 패널의 작은 화면 스크롤 anchor 재검수.
- 남은 오래된 QA 출력 문구와 버전 허용 메시지 정리.
- 보드/보스/랭킹 경로에서 동적 import chunk 이름과 캐시 갱신 흐름 추가 검수.
- Firebase 무료 기준 write path와 daily rank 문서 구조 비용 재점검.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.79 modal focus return rank cache and vendor split patch


## v1.0.79 실제 수정 내역

- `package.json` 버전을 `1.0.79`로 갱신했다.
- `v1079-modal-focus-return`을 추가해 보상 모달과 복원 상세/시즌 보상 상세 모달이 열리기 전 포커스 위치를 기억하고, 닫힐 때 안전한 버튼으로 되돌린다.
- `rememberModalReturnFocus()`, `restoreModalReturnFocus()`, `markModalFocusReturn()`, `scheduleRestorationDetailFocus()`를 추가해 모달 간 이동, ESC/back 닫기, 바깥 클릭 닫기 흐름을 정리했다.
- 보상 모달에서 다음 스테이지/다시 플레이/복원 연결로 화면이 전환될 때는 숨겨진 요소로 포커스가 돌아가지 않도록 `closeReward({ returnFocus: false })` 경로를 분리했다.
- `v1079-firebase-free-read-budget`을 추가해 랭킹/일일 랭킹을 먼저 로컬/캐시로 그린 뒤, 5분 TTL 안에서는 Firestore read를 반복하지 않는다.
- `FIREBASE_RANK_DAILY_READ_LIMIT = 14`, `dream-library-firebase-rank-read-budget-v1079`, `dream-library-rank-cache-global-v1079`, `dream-library-rank-cache-daily-v1079`를 추가해 Firebase 무료 요금제에서 불필요한 반복 읽기를 줄였다.
- 랭킹 표기의 `Cloud/Local` 노출을 `클라우드/기기`와 `Cloud 기록과 기기 기록` 안내로 정리해 사용자에게 더 자연스럽게 보이도록 했다.
- `v1079-vendor-effects-split`으로 `DreamPixiRenderer`를 정적 import에서 동적 import로 바꿔 Pixi/GSAP 렌더러가 별도 chunk 후보가 되도록 했다. `vite.config.js`도 `vendor-audio-v1079`, `vendor-motion-v1079`, `vendor-spine-v1079`로 분리했다.
- `v1079-image-optimization-candidates`를 QA anchor로 추가하고 1.2 MB 초과 이미지 후보가 계속 추적되도록 했다.
- `tools/check-modal-focus-rank-budget.mjs`를 추가하고 GitHub Pages / quality-check workflow에 연결했다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.79까지 확장했다.
- `public/sw.js` cache를 `dream-library-cache-v1.0.79`로 갱신하고 `texture-atlas-manifest-v1.0.79.json`을 선로드에 추가했다.
- `src/game/difficulty.js`에 v1.0.79 atlas manifest anchor를 추가했다.

## v1.0.79 필수 검수 명령

```bash
npm run typecheck
npm run check:modal-focus-rank-budget
npm run check:combat-hud-touch-clearance
npm run check:boss-board-clearance
npm run report:images
npm run build:github
```

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.79에서 특히 확인해야 할 화면

- 보상 모달에서 `다음 목표 보기`, `복원 완료 먼저 보기`, `다시 플레이`, `다음 스테이지`를 누른 뒤 포커스가 화면 밖/숨김 버튼으로 가지 않아야 한다.
- 복원 상세 모달과 시즌 보상 상세 모달을 닫으면 방금 눌렀던 복원 카드/상점 상세 버튼 또는 가까운 패널 버튼으로 포커스가 돌아가야 한다.
- 랭킹 새로고침을 여러 번 눌러도 5분 캐시와 read budget marker가 동작해야 하며, Firebase 실패 시 기기 기록이 먼저 보여야 한다.
- `v1077` 보스 보드 방해 방지와 `v1078` 하단 버튼 touch clearance가 유지되어야 한다.
- old active attribute `data-boss-layout="statusbar-icon-right-v1046"`, 미니맵, 카메라 도움말, 손가락 시작 문구가 다시 나타나면 실패다.

## v1.0.79 검수 결과

- `npm run typecheck` 통과.
- 전체 86개 `check:*` QA suite 통과.
- `npm run check:modal-focus-rank-budget` 통과. 1.2 MB 초과 이미지 후보 9개 추적.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run report:images` 통과. 454 files, 51.98 MB.
- `npm run build:github` 통과.
- `vendor-effects` 단일 chunk 경고는 v1.0.79 분리 후 사라졌고, 남은 chunk 경고는 `vendor-pixi` 527.93 KB 초과다.
- `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 계속 남아 있지만 빌드 실패는 아니다.

산출 ZIP에는 `node_modules`, `dist`, `package-lock.json`, 과거 1회성 삭제 스크립트가 들어가면 안 된다.
