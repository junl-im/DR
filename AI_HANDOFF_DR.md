# AI_HANDOFF_DR.md - Dream Library 이어받기 문서

## 현재 작업중인 내용 1열

| 항목 | 기록 |
|---|---|
| 현재 버전 | v1.0.76 |
| 프로젝트 | 꿈의 서고 / Dream Library, 세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG |
| 이번 패치 | Shortcut Menu Icon Polish, Panel Scroll QA, Modal Close Flow and Lobby Navigation Rhythm Patch |
| 핵심 수정 | 로비 바로가기 메뉴 아이콘 polish, 패널 내부 스크롤 저장/복원 안정화, 바깥 터치 닫기 pointer down/up 흐름, 로비 내비게이션 phase 클래스 추가 |
| 작업 기준 | 사용자가 업로드한 DR.zip 원본 v1.0.75에서 이어서 작업 |
| 필수 산출 | 그대로 사용 가능한 풀파일 ZIP 1개, 덮어쓰기용 패치 ZIP 1개 |
| 산출 파일명 규칙 | 짧은 이름 + 버전 숫자 포함. 예: DR_v1.0.76.zip, DR_patch_v1.0.76.zip |
| 기록 파일 규칙 | 매 패치마다 README.md와 이 AI_HANDOFF_DR.md를 같이 갱신 |
| 불필요 파일 금지 | 임시 분석 파일, dist, node_modules, package-lock.json 제외, DELETE_REMOVED, 과거 1회성 삭제 스크립트는 산출 ZIP에서 제외 |

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
- SVG는 금지한다. 이미지 정책은 PNG/WebP/JPG 중심이다.

## 사용자가 결과를 보기 위한 명령

처음 받은 ZIP을 푼 뒤 또는 패치 ZIP을 덮어쓴 뒤 아래 순서로 실행한다.

```bash
npm install --no-audit --no-fund --prefer-online
npm run dev
```

브라우저에서 Vite가 알려주는 로컬 주소를 연다. 모바일 실제 기기 확인 시 같은 네트워크에서 `--host 0.0.0.0` 주소를 사용한다.

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
npm run report:images
npm run build:github
```

가능하면 전체 `check:*` 스크립트를 모두 실행한다. 현재 v1.0.76 기준 `check:lobby-navigation-rhythm`까지 포함되어 있다.

전체 검사 실행 예시:

```bash
node - <<'NODE'
const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf8'));
for (const [name] of Object.entries(pkg.scripts)) {
  if (name.startsWith('check:')) console.log('npm run ' + name);
}
NODE
```

위 목록을 복사해 실행하거나, 셸에서 순차 실행 스크립트를 만들어도 된다.

## v1.0.76 변경 상세

- `package.json` 버전을 `1.0.76`으로 올렸다.
- 신규 검사 `check:lobby-navigation-rhythm`을 추가했다.
- 기존 `check:*` 스크립트의 버전 허용 범위를 v1.0.76까지 확장했다. GitHub Actions에서 전체 QA가 새 버전 때문에 실패하지 않도록 하기 위한 필수 변경이다.
- `.github/workflows/github-pages.yml`와 `.github/workflows/quality-check.yml`에 `npm run check:lobby-navigation-rhythm`을 연결했다.
- `src/main.ts`에 아래 v1.0.76 토큰을 추가했다.
  - `v1076-shortcut-menu-icon-polish`
  - `v1076-panel-scroll-qa`
  - `v1076-modal-close-flow`
  - `v1076-lobby-navigation-rhythm`
- 로비 메뉴 버튼에 사용자용 `aria-label`을 보강했다.
- 로비 메뉴 바깥 닫기를 단순 click이 아니라 pointerdown + pointerup 일치 흐름으로 바꿨다.
  - 팝업 카드 내부를 누른 뒤 바깥에서 손을 떼는 식의 오작동 닫힘을 줄이기 위한 변경이다.
- `saveLobbyPanelScroll()` / `restoreLobbyPanelScroll()`을 추가했다.
  - 탭 전환 전 현재 패널 dock 스크롤을 저장한다.
  - 탭 전환 후 `requestAnimationFrame` 2회로 DOM 높이가 안정된 뒤 복원한다.
- `setLobbyNavigationRhythm()`을 추가했다.
  - body에 `lobby-nav-opening`, `lobby-nav-open`, `lobby-nav-closing` 클래스를 부여한다.
  - CSS에서 모달 열림/닫힘 리듬을 더 자연스럽게 조정한다.
- `src/styles.css`에 v1.0.76 CSS를 추가했다.
  - 바로가기 아이콘 광택/테두리/선택 상태 polish
  - 패널 내부 스크롤 anchoring 방지
  - 모달 닫기 흐름 cursor/카드 분리
  - 작은 화면에서 dock min-height 조정
  - reduced motion 대응
- `public/sw.js` cache를 `dream-library-cache-v1.0.76`으로 갱신했다.
- `public/assets/meta/texture-atlas-manifest-v1.0.76.json`을 생성했다.
- `AI_HANDOFF_DR.md`를 신규 생성했다.

## 이번 패치에서 확인한 불안정/개선 지점

- 로비 메뉴 팝업은 카드 내부 스크롤과 본문 스크롤이 겹치기 쉬우므로 `.app-shell` 잠금과 dock pan-y 흐름을 계속 유지해야 한다.
- 패널 전환 시 `scrollIntoView()`를 다시 넣으면 페이지 전체가 튈 수 있으므로 금지한다.
- 메뉴 바깥 닫기를 click 하나로 처리하면 드래그/스크롤과 충돌할 수 있으므로 pointerdown/up 기준을 유지한다.
- ESC는 로비 메뉴가 열려 있을 때 `stopImmediatePropagation()`으로 종료 팝업까지 이어지는 것을 막아야 한다.
- `check:health`, `check:workflows` 등 일부 검사 출력에 과거 버전 숫자가 남아 있어도 호환성 앵커 메시지이며 실패가 아니다.
- `package-lock.json` 제외은 원본 ZIP에 있었지만 산출 ZIP에서는 제외한다. Actions도 lock 파일을 지운 뒤 npm install한다.
- `remove-legacy-svg-v1.0.6.cmd`, `remove-legacy-svg-v1.0.6.sh`는 과거 1회성 정리 스크립트라 산출 ZIP에서 제외한다.

## 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지.
- 자동 fullscreen/orientation API 추가 금지.
- 미니맵 재도입 금지.
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 금지.
- 카메라 도움말 재도입 금지.
- 선택 타일 크기 무리한 확대 금지.
- 손가락 시작 위젯 재도입 금지.
- SVG 추가 금지.
- Firebase 무료 환경에서 비용을 유발할 수 있는 대량 읽기/쓰기 루프 금지.
- UI/UX는 모바일 세로 화면, 작은 화면, 노치/safe-area, 카카오/인앱 브라우저를 항상 우선 검수한다.

## 산출 ZIP 구성 규칙

풀파일 ZIP에는 실행에 필요한 프로젝트 원본만 넣는다.

포함:

- `index.html`
- `package.json`
- `vite.config.js`
- `tsconfig.json`
- `.github/workflows/*`
- `src/**`
- `public/**`
- `tools/**`
- `docs/**`
- Firebase 설정 파일
- `README.md`
- `AI_HANDOFF_DR.md`

제외:

- `node_modules/**`
- `dist/**`
- `package-lock.json` 제외
- `DELETE_REMOVED`
- `.git/**`
- 임시 분석 파일
- 과거 삭제용 1회성 스크립트 `remove-legacy-svg-v1.0.6.*`

패치 ZIP에는 v1.0.76에서 바뀐 파일만 넣는다.

- `AI_HANDOFF_DR.md`
- `README.md`
- `package.json`
- `.github/workflows/github-pages.yml`
- `.github/workflows/quality-check.yml`
- `index.html`
- `src/main.ts`
- `src/styles.css`
- `public/sw.js`
- `public/assets/meta/texture-atlas-manifest-v1.0.76.json`
- `tools/check-lobby-navigation-rhythm.mjs`
- v1.0.76 허용 범위를 반영한 기존 `tools/check-*.mjs` 파일들

## GitHub Desktop 사용 순서

1. 사용자가 기존 프로젝트 폴더를 백업한다.
2. 패치 ZIP을 프로젝트 루트에 덮어쓴다. 새로 시작할 경우 풀파일 ZIP을 사용한다.
3. GitHub Desktop에서 변경 파일 목록을 확인한다.
4. 터미널에서 필수 검수 명령을 실행한다.
5. 커밋 메시지는 아래 추천 문구를 사용한다.

```text
Apply 꿈의 서고 v1.0.76 lobby navigation rhythm icon polish and modal close QA patch
```

6. GitHub Desktop에서 push한다.
7. GitHub Pages Actions 완료 후 실제 페이지에서 모바일 세로 화면을 확인한다.
8. Firebase 배포가 필요하면 Firebase CLI 로그인 후 hosting/rules 배포를 직접 실행한다.

## 다음 업데이트 예상 내역

다음 버전은 v1.0.77 권장.

- 로비 메뉴 카드 내부 정보 밀도 재점검.
- 상점/복원/도감 패널의 긴 카드 겹침과 작은 화면 버튼 줄바꿈 QA.
- reward modal과 restoration detail modal의 닫기/포커스 복귀 흐름 재검수.
- Pixi 보드 렌더 예산과 저사양 기기 quality profile 재점검.
- Firebase 무료 기준으로 랭킹/일일 기록 읽기 빈도와 fallback UX 점검.
- 사용자가 보는 한국어 문구에서 개발자용/영문 잔여 copy 추가 제거.

## 마지막 확인 버전

v1.0.76
