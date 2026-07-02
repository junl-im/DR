# AI_HANDOFF_DR.md - Dream Library 이어받기 문서

## 현재 작업중인 내용 1열

| 항목 | 기록 |
|---|---|
| 현재 버전 | v1.0.84 |
| 프로젝트 | 꿈의 서고 / Dream Library, 세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG |
| 이번 패치 | Mobile Ranking Chip Wrap, Asset Fallback Load Polish and Lobby Anchor Settle QA Patch |
| 핵심 수정 | 모바일 랭킹 chip 줄바꿈, 추가 WebP fallback, 로비 anchor settle, boss atlas build verify |
| UI/UX 우선순위 | 좁은 모바일 폭에서 랭킹 이름/점수/source chip/방금 기록 chip이 겹치지 않고, 로비 긴 패널 복귀 시 스크롤이 튀지 않아야 한다 |
| 예전 코드 방지 | active HTML/main에서 `statusbar-icon-right-v1046`, 보드 미니맵, 드래그 이동 도움말, 손가락 시작 문구가 되살아나면 QA 실패로 본다 |
| 작업 기준 | 이전 산출물 `DR_v1.0.83.zip`에서 이어서 작업 |
| 필수 산출 | 그대로 사용 가능한 풀파일 ZIP 1개, 덮어쓰기용 패치 ZIP 1개 |
| 산출 파일명 규칙 | 짧은 이름 + 버전 숫자 포함. 예: `DR_v1.0.84.zip`, `DR_patch_v1.0.84.zip` |
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
- 현재 GitHub Actions workflow는 GitHub Pages와 quality-check 양쪽 모두 `npm run check:boss-board-clearance`, `npm run check:combat-hud-touch-clearance`, `npm run check:modal-focus-rank-budget`, `npm run check:camera-gesture-statusbar-balance`, `npm run check:camera-status-image-budget`, `npm run check:firebase-write-lobby-anchor`, `npm run check:rank-copy-webp-atlas`, `npm run check:mobile-rank-fallback-anchor`를 실행한다.

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
npm run check:rank-copy-webp-atlas
npm run check:mobile-rank-fallback-anchor
npm run report:images
npm run build:github
```

가능하면 전체 `check:*` 스크립트를 모두 실행한다. 현재 v1.0.84 기준 `check:mobile-rank-fallback-anchor`까지 총 91개 `check:*` 스크립트가 있다.

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```




## v1.0.84 실제 수정 내역

- `package.json` 버전을 `1.0.84`로 갱신했다.
- `v1084-mobile-rank-chip-wrap`을 추가해 랭킹 row/source note/empty state에 `data-rank-chip-wrap`을 부여했다.
- 작은 모바일 폭에서 랭킹 순위, 이름, 점수, 날짜, source chip, 방금 기록 chip이 서로 겹치지 않도록 grid column과 줄바꿈을 재정리했다.
- 방금 기록 chip 화면 문구를 `방금`으로 줄이고 `aria-label="방금 기록한 점수"`를 유지해 접근성 의미는 보존했다.
- `v1084-asset-fallback-load-polish`를 추가하고 `imported-moon-library.webp`, `frame-library-v2.webp`를 생성했다. 두 WebP 모두 PNG fallback보다 훨씬 작다.
- `src/game/difficulty.js`와 `public/sw.js`에 새 WebP 후보를 PNG fallback보다 먼저 배치했다.
- `v1084-lobby-anchor-settle-qa`를 추가해 로비 긴 패널 복귀 시 anchor가 이미 dock 안에 보이면 `scrollIntoView`를 생략한다.
- `v1084-boss-atlas-build-verify`를 추가해 v1.0.83 boss atlas CSS 변수 guard와 `/DR/assets/atlas/boss-frames-v2.*` 하드코딩 금지를 계속 확인한다.
- `tools/check-mobile-rank-fallback-anchor.mjs` 신규 추가 및 GitHub Pages / quality-check workflow에 연결했다.
- 기존 QA 허용 범위를 v1.0.84까지 확장했다.
- `dream-library-cache-v1.0.84`, `texture-atlas-manifest-v1.0.84.json`을 추가했다.
- 구버전 코드 부활 방지 항목 유지: `statusbar-icon-right-v1046`, `board-minimap`, `보기 맞춤`, `드래그 이동`, `손가락 시작`, `data-legacy-role-copy`.

## v1.0.84 검수 결과

- `npm run typecheck` 통과.
- 전체 91개 `check:*` QA suite 통과.
- `npm run check:mobile-rank-fallback-anchor` 통과.
- `npm run check:rank-copy-webp-atlas` 통과.
- `npm run report:images` 통과. 458 files, 52.58 MB. 1.2 MB 초과 이미지는 9개로 유지되며, 이번 패치에서 추가한 `imported-moon-library.webp`와 `frame-library-v2.webp`는 PNG fallback보다 훨씬 작다.
- `npm run build:github` 통과. v1.0.83에서 제거한 boss atlas runtime resolve 경고는 이번 빌드에서도 재현되지 않았다.
- 가장 큰 JS chunk는 `vendor-pixi-core-v1081` 약 343.02 KB다. `vendor-firebase-firestore-v1083`는 약 240.85 KB로 유지된다.

## v1.0.84 다음 업데이트 예상

- v1.0.85에서는 실제 모바일 로비 긴 패널 touch/anchor 체감, 남은 대용량 이미지 9개, Firebase 랭킹 보호 상태 copy, 카메라 drag/zoom 분리 유지 여부를 이어서 본다.

## v1.0.83 실제 수정 내역

- `package.json` 버전을 `1.0.83`으로 갱신했다.
- `v1083-rank-ui-copy-polish`를 추가해 랭킹 안내 문구를 사용자용 표현으로 정리했다.
- 랭킹 상단 source note를 항상 표시하고 `클라우드와 기기 기록`, `기기 기록 우선`, `무료 보호 중`, `저장 기록 표시`, `기기 기록 보호` 같은 상태를 표시한다.
- 방금 기록한 점수에는 `rank-fresh-chip`을 붙여 랭킹에 섞여도 눈에 띄게 했다.
- 작은 화면에서 랭킹 source chip이 이름/점수와 겹치지 않도록 grid와 줄바꿈을 보강했다.
- `v1083-webp-fallback-qa`를 추가해 브라우저 WebP 지원 여부를 `html[data-webp-support="webp-first|png-fallback"]`로 표시한다.
- WebP 미지원 환경에서는 boss atlas sprite가 PNG fallback으로 남도록 CSS를 분리했다.
- `v1083-boss-atlas-resolve-guard`를 추가하고 CSS의 `/DR/assets/atlas/boss-frames-v2.*` 하드코딩 URL을 제거했다. boss atlas 이미지는 `--boss-atlas-image-url`, `--boss-atlas-webp-url` CSS 변수로만 연결한다.
- `vendor-firebase` 단일 chunk를 `vendor-firebase-firestore-v1083`, `vendor-firebase-auth-v1083`, `vendor-firebase-app-v1083`, `vendor-firebase-core-v1083`로 분리해 후속 성능 점검 기준을 만들었다.
- `tools/check-rank-copy-webp-atlas.mjs` 신규 추가 및 GitHub Pages / quality-check workflow에 연결했다.
- 기존 QA 허용 범위를 v1.0.83까지 확장했다.
- `dream-library-cache-v1.0.83`, `texture-atlas-manifest-v1.0.83.json`을 추가했다.
- 구버전 코드 부활 방지 항목 유지: `statusbar-icon-right-v1046`, `board-minimap`, `보기 맞춤`, `드래그 이동`, `손가락 시작`, `data-legacy-role-copy`.

## v1.0.83 검수 결과

- `npm run typecheck` 통과.
- 전체 90개 `check:*` QA suite 통과.
- `npm run check:rank-copy-webp-atlas` 통과.
- `npm run check:firebase-write-lobby-anchor` 통과.
- `npm run report:images` 통과. 456 files, 52.37 MB. 1.2 MB 초과 이미지 9개는 계속 후속 최적화 후보.
- `npm run build:github` 통과.
- v1.0.82까지 남아 있던 `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 v1.0.83 CSS 변수 전환 후 이번 GitHub Pages build log에서 재현되지 않았다.
- `vendor-firebase` 단일 420 KB대 chunk는 v1.0.83에서 `vendor-firebase-app`, `vendor-firebase-core`, `vendor-firebase-auth`, `vendor-firebase-firestore`로 분리되었다. 가장 큰 JS chunk는 `vendor-pixi-core-v1081` 약 343.01 KB다.

## v1.0.83 다음 업데이트 예상

- v1.0.84에서는 랭킹 상태 chip의 실제 모바일 줄바꿈, Firebase chunk 분리 후 산출물 크기, boss atlas runtime resolve 경고 소거 여부, 추가 WebP/atlas 이미지 최적화 후보를 이어서 본다.

## v1.0.82 실제 수정 내역

- `package.json` 버전을 `1.0.82`로 갱신했다.
- `v1082-firebase-free-write-budget`를 추가해 랭킹 저장 전 일일 write budget과 중복 score signature를 확인한다.
- `force` 랭킹 새로고침이 더 이상 Firebase read budget을 우회하지 않게 수정했다.
- 점수 저장 후에는 현재 플레이한 보드의 랭킹을 먼저 갱신하고, 다른 랭킹은 cache/local 우선으로 처리한다.
- `src/auth.js`에 profile write guard를 추가해 같은 계정/표시명은 12시간 안에 `users/{uid}` write를 반복하지 않는다.
- `v1082-lobby-panel-anchor-stability`를 추가해 로비 메뉴 긴 패널의 scrollTop과 첫 visible anchor selector를 같이 저장한다.
- 복원/도감/상점 긴 패널에 `overflow-anchor`, `scroll-padding`, `scroll-margin` 보강 CSS를 추가했다.
- `v1082-qa-output-wording-refresh`를 추가하고 최근 QA 출력 문구를 호환 범위 기준으로 정리했다.
- `tools/check-firebase-write-lobby-anchor.mjs` 신규 추가 및 GitHub Pages / quality-check workflow에 연결했다.
- 기존 QA 허용 범위를 v1.0.82까지 확장했다.
- `dream-library-cache-v1.0.82`, `texture-atlas-manifest-v1.0.82.json`을 추가했다.
- 구버전 코드 부활 방지 항목 유지: `statusbar-icon-right-v1046`, `board-minimap`, `보기 맞춤`, `드래그 이동`, `손가락 시작`, `data-legacy-role-copy`.

## v1.0.82 검수 결과

- `npm run typecheck` 통과.
- 전체 89개 `check:*` QA suite 통과.
- `npm run check:firebase-write-lobby-anchor` 통과.
- `npm run check:camera-status-image-budget` 통과.
- `npm run check:modal-focus-rank-budget` 통과.
- `npm run report:images` 통과. 456 files, 52.37 MB. 1.2 MB 초과 이미지 9개는 계속 후속 최적화 후보.
- `npm run build:github` 통과.
- 빌드 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고가 계속 있음. 기존 경고이며 실패 아님.
- v1.0.81에서 분리한 `vendor-pixi` 500 KB 초과 경고는 계속 해소 상태. 가장 큰 JS chunk는 `vendor-firebase` 약 420.91 KB.

## v1.0.82 다음 업데이트 예상

- v1.0.83에서는 랭킹 보호 상태 문구의 사용자 친화성, WebP fallback 실제 로딩, boss atlas resolve 경고, 대용량 이미지 추가 최적화, 로비 anchor 복귀 체감을 이어서 본다.

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

패치 ZIP에는 v1.0.80에서 v1.0.81로 바뀐 파일만 넣는다. 삭제가 필요한 임시 파일은 만들지 않는다.

## 다음 업데이트 예상 내역

v1.0.81은 이번 패치에서 진행 완료한다. 다음은 문서 하단의 v1.0.82 예상 내역을 따른다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.81 camera feel boss status priority and image budget patch


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


## v1.0.80 실제 수정 내역

- `package.json` 버전을 `1.0.80`으로 갱신했다.
- 사용자가 보고한 "옆으로 이동하려고 드래그했더니 줌이 되는 느낌"을 우선 처리했다. `DreamPixiRenderer`에 `v1080-camera-gesture-separation`을 추가해 한 손가락 드래그, 두 손가락 핀치, 휠/트랙패드 입력을 분리했다.
- 한 손가락 pointer move는 `panCameraBy()`만 호출하고 scale을 바꾸지 않는다. 드래그 후 짧은 시간은 `panLockedUntil`으로 잠가 우발적인 wheel/pinch zoom이 이어지지 않게 했다.
- 트랙패드/마우스 wheel 입력은 `shouldTreatWheelAsPan()`을 거치며, 가로 이동 성격의 wheel은 줌이 아니라 카메라 이동으로 처리한다.
- 핀치는 두 포인터 거리 변화가 충분히 커질 때만 `pinchStarted`가 켜지며, 작은 흔들림은 줌으로 처리하지 않는다.
- `#pixi-board-host`와 `.battle-stage`에 `data-camera-gesture-separation="v1080-camera-gesture-separation"`, `data-camera-gesture-mode="idle|pan|pinch|wheel"` marker를 남겨 QA와 디버깅이 가능하게 했다.
- 사용자가 지적한 몬스터 프로필 바 왼쪽 공백 문제를 처리했다. `v1080-boss-statusbar-balance`를 추가해 보스 초상화 슬롯을 46px, 우측 echo/status 슬롯을 42px로 고정하고 중앙 정보 영역만 유동적으로 늘어나게 했다.
- 우측 상태 알림/echo가 켜졌다 꺼질 때 바 전체 폭이 좁아졌다 넓어지는 느낌을 줄이기 위해 `.boss-lane-echo`에 고정 width/min-width/max-width와 contain을 부여했다.
- 작은 화면에서는 초상화 42px, 우측 슬롯 38px로 줄여 왼쪽 빈 공간을 더 줄이고 보스명/HP/예고 텍스트의 ellipsis 흐름을 유지한다.
- active HTML/main/CSS에서 예전 `statusbar-icon-right-v1046`, 보드 미니맵, 카메라 도움말, 손가락 시작 문구가 되살아나면 실패하는 `tools/check-camera-gesture-statusbar-balance.mjs`를 추가했다.
- GitHub Pages / quality-check workflow에 `npm run check:camera-gesture-statusbar-balance`를 연결했다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.80까지 확장했다.
- `public/sw.js` cache를 `dream-library-cache-v1.0.80`으로 갱신하고 `texture-atlas-manifest-v1.0.80.json`을 선로드에 추가했다.
- `src/game/difficulty.js`에 v1.0.80 atlas manifest anchor를 추가했다.

## v1.0.80 필수 검수 명령

```bash
npm run typecheck
npm run check:camera-gesture-statusbar-balance
npm run check:board-camera
npm run check:boss-board-clearance
npm run check:combat-hud-touch-clearance
npm run check:modal-focus-rank-budget
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

## v1.0.80에서 특히 확인해야 할 화면

- 큰 보드에서 한 손가락 또는 마우스 드래그로 좌우/상하 이동할 때 보드 scale이 바뀌지 않아야 한다.
- 트랙패드 가로 wheel은 줌이 아니라 이동으로 느껴져야 한다. Ctrl/메타 wheel 또는 명확한 세로 wheel만 줌으로 처리한다.
- 두 손가락 핀치는 작은 흔들림에는 반응하지 않고, 실제 확대/축소 거리 변화가 있을 때만 scale이 바뀌어야 한다.
- 보스/몬스터 프로필 바의 왼쪽 초상화 슬롯에 과한 빈 공간이 없어야 한다.
- 우측 상태 echo/예고가 켜졌다 꺼져도 중앙 보스 정보가 과하게 좁아졌다 넓어지지 않아야 한다.
- `data-boss-layout="statusbar-icon-right-v1046"`, 보드 미니맵, 카메라 도움말, 손가락 시작 문구가 다시 나타나면 실패다.

## v1.0.80 검수 결과

- `npm run typecheck` 통과.
- 전체 87개 `check:*` QA suite 통과.
- `npm run check:camera-gesture-statusbar-balance` 통과.
- `npm run check:board-camera` 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run check:modal-focus-rank-budget` 통과.
- `npm run report:images` 통과. 454 files, 51.98 MB.
- `npm run build:github` 통과.
- 기존 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 남아 있지만 빌드 실패가 아니다.
- 기존 경고: `vendor-pixi` chunk 527.93 KB 초과 경고는 남아 있어 v1.0.81 이후 분리 후보다.

## 다음 업데이트 예상 내역

다음은 v1.0.81로 이어간다.

- 실제 기기 기준 카메라 drag/zoom 체감 QA를 더 보고, 필요하면 sensitivity 프로필을 난이도별로 분리한다.
- 보스 상태바에서 이름/HP/예고의 우선순위를 작은 화면별로 더 다듬는다.
- 대용량 이미지 9개 WebP/PNG 실제 압축 적용 및 visual regression 확인.
- `vendor-pixi` chunk 분리 가능성 조사.
- Firebase 무료 기준 write path와 daily rank 문서 구조 비용 재점검.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.80 camera gesture and boss statusbar balance patch


## v1.0.81 실제 수정 내역

- `package.json` 버전을 `1.0.81`로 갱신했다.
- `DreamPixiRenderer`에 `v1081-real-device-camera-feel`을 추가했다.
- 터치/펜/마우스별 pan 시작 threshold를 분리했다. 터치는 11px, 펜은 8px, 마우스는 6px 기준이다.
- `resolveGestureAxis()`로 첫 이동 방향을 고정해 좌우/상하 drag가 zoom 경로와 섞이지 않게 했다.
- 두 손가락 pinch에는 `pinchSettledAt` warmup을 추가하고 거리 변화 기준을 `16px`, ratio 기준을 `0.065`로 높였다.
- wheel/trackpad 입력에서 `shiftKey`, 가로 delta, pixel delta 조건은 pan으로 처리해 가로 이동이 zoom처럼 느껴지지 않도록 했다.
- `v1081-boss-status-priority`를 추가했다. 보스/몬스터 프로필 바는 기본 `40px / 중앙 유동 / 34px`, 작은 화면 `36px / 중앙 유동 / 30px` 비율이다.
- 보스바 표시 우선순위를 보스명, HP, 예고, HP bar 중심으로 정리하고, 장황한 상태 chip/도움말은 시각적으로 숨겨 왼쪽 공백과 텍스트 압박을 줄였다.
- `storybook-login.webp`, `dream-library-25d.webp`를 추가했다. 각각 2.4MB PNG fallback 대비 약 202KB WebP다.
- `src/game/difficulty.js`와 `public/sw.js`에서 WebP를 PNG fallback보다 먼저 preload/core asset 후보로 넣었다.
- `vite.config.js`에 `vendor-pixi-core-v1081`, `vendor-pixi-scene-v1081`, `vendor-pixi-renderer-v1081`, `vendor-pixi-assets-v1081` chunk 후보를 추가했다.
- `tools/check-camera-status-image-budget.mjs`를 추가하고 GitHub Pages / quality-check workflow에 연결했다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.81까지 확장했다.
- `public/sw.js` cache를 `dream-library-cache-v1.0.81`로 갱신하고 `texture-atlas-manifest-v1.0.81.json`을 생성/선로드에 추가했다.

## v1.0.81 필수 검수 명령

```bash
npm run typecheck
npm run check:camera-status-image-budget
npm run check:camera-gesture-statusbar-balance
npm run check:board-camera
npm run check:boss-board-clearance
npm run check:combat-hud-touch-clearance
npm run check:modal-focus-rank-budget
npm run report:images
npm run build:github
```

가능하면 아래 방식으로 전체 `check:*` 88개를 모두 실행한다.

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.81에서 특히 확인해야 할 화면

- 실제 휴대폰에서 한 손가락 좌우/상하 drag는 pan만 수행하고 zoom처럼 느껴지지 않아야 한다.
- 두 손가락을 올리는 순간 작은 흔들림으로 scale이 튀면 실패다. 손가락 간 거리를 명확히 바꿀 때만 zoom이 시작되어야 한다.
- 보스/몬스터 프로필 바 왼쪽 초상화 주변 공백이 v1.0.80보다 더 작아야 한다.
- 우측 echo/status가 켜졌다 꺼져도 중앙 보스명/HP/예고가 과하게 흔들리지 않아야 한다.
- `data-boss-layout="statusbar-icon-right-v1046"`, 보드 미니맵, 카메라 도움말, 손가락 시작 문구가 다시 나타나면 실패다.
- `storybook-login.webp`, `dream-library-25d.webp`는 PNG fallback보다 훨씬 작고 preload/core asset 후보에 포함되어야 한다.

## v1.0.81 검수 결과

- `npm run typecheck` 통과.
- 전체 88개 `check:*` QA suite 통과.
- `npm run check:camera-status-image-budget` 통과.
- `npm run check:camera-gesture-statusbar-balance` 통과.
- `npm run check:board-camera` 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run check:modal-focus-rank-budget` 통과.
- `npm run report:images` 통과. 456 files, 52.37 MB. PNG fallback 유지로 1.2MB 초과 원본 9개는 계속 추적한다.
- `npm run build:github` 통과.
- 기존 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 남아 있지만 빌드 실패가 아니다.
- v1.0.80의 `vendor-pixi` 527KB 초과 경고는 v1.0.81 chunk 분리 후 사라졌다. `vendor-pixi-core-v1081` 343KB, `vendor-pixi-assets-v1081` 186KB로 분리됐다.

## 다음 업데이트 예상 내역

다음은 v1.0.82로 이어간다.

- Firebase 무료 기준 write path와 daily rank 비용을 더 엄격하게 보호한다.
- 로비 긴 카드와 상점/복원/도감 패널 작은 화면 스크롤 anchor를 재검수한다.
- 오래된 QA 출력 문구를 현재 버전 범위 중심으로 정리한다.
- WebP 추가 이미지의 실제 화면 차이를 더 확인하고 필요하면 quality별 대체본을 분리한다.
- Pixi chunk 분리 결과를 빌드 산출물 기준으로 다시 보고 남은 큰 chunk를 줄인다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.81 camera feel boss status priority and image budget patch
