# AI_HANDOFF_DR.md - Dream Library 이어받기 문서

## 현재 작업중인 내용 1열

| 항목 | 기록 |
|---|---|
| 현재 버전 | v1.0.89B / package.json 1.0.88 runtime baseline |
| 프로젝트 | 꿈의 서고 / Dream Library, 세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG |
| 이번 패치 | GitHub Pages Build Guard Recovery Patch |
| 핵심 수정 | v1.0.89 workflow 패치에서 package.json version을 올려 legacy QA allow-list에 걸린 문제를 수정하고, package.json version을 runtime baseline인 1.0.88로 복원 |
| UI/UX 우선순위 | 이번 패치는 배포 workflow만 건드리며 화면/UI/게임 로직은 수정하지 않는다 |
| 예전 코드 방지 | active HTML/main에서 `statusbar-icon-right-v1046`, 보드 미니맵, 드래그 이동 도움말, 손가락 시작 문구가 되살아나면 QA 실패로 본다 |
| 작업 기준 | v1.0.89 GitHub Actions build 실패 로그: `check:tile-geometry-hud`의 package version guard 실패 |
| 필수 산출 | 그대로 사용 가능한 풀파일 ZIP 1개, 덮어쓰기용 패치 ZIP 1개 |
| 산출 파일명 규칙 | 짧은 이름 + 버전 숫자 포함. 예: `DR_v1.0.89.zip`, `DRp_v1.0.89.zip` |
| 기록 파일 규칙 | 매 패치마다 `README.md`와 이 `AI_HANDOFF_DR.md`를 같이 갱신 |
| 불필요 파일 금지 | 임시 분석 파일, `dist`, `node_modules`, `package-lock.json`, `DELETE_REMOVED`, 과거 1회성 삭제 스크립트는 산출 ZIP에서 제외. 분석/패치 기록은 `AI_HANDOFF_DR.md`와 `README.md`에만 남긴다 |

## 사용자 고정 작업 규칙

- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수를 새로 추가하지 않는다. 기존 로직을 고칠 때는 해당 로직이 있는 자리에서 직접 수정한다.
- 이전 버전 코드를 단순히 숨기거나 mute 처리하지 않는다. 더 이상 쓰지 않는다고 판단되면 실제 호출 여부와 화면/데이터 효과를 코드 추적으로 확인한 뒤 삭제하거나 살아있는 로직에 통합한다.
- 삭제 전에는 반드시 “이 함수/DOM/selector/asset이 실제로 호출되고 효과가 있는지” 확인 결과를 기록한다.
- 한 번에 여러 화면/기능을 동시에 건드리지 않는다. 사용자가 지정한 범위만 작업한다.
- 작업 후 무엇을 지웠고/바꿨는지, 왜 안전하다고 판단했는지 요약한다.
- 이 프로젝트의 공식 인수인계 파일은 `AI_HANDOFF_DR.md`다. 다른 프로젝트명 파일명을 언급하더라도 Dream Library 작업 기록은 `AI_HANDOFF_DR.md`와 `README.md`에만 남긴다.
- 기록 문구는 “예전 걸 mute한다”가 아니라 “예전 걸 삭제했다/통합했다/유지했다”처럼 실제 처리 결과로 남긴다.

## 작업 환경 절대 유지

- 사용자는 GitHub Desktop으로 파일을 확인하고 커밋/푸시한다.
- 배포는 GitHub Pages와 Firebase Hosting 둘 다 고려한다.
- Firebase는 무료 요금제 기준으로 유지한다.
- Firebase project id는 `dream-library-b732a` 이다.
- GitHub Pages 빌드는 `/DR/` base를 사용한다.
- Firebase 빌드는 `/` base를 사용한다.
- 앱 빌드용 `node-version: 20`은 유지한다. 단, GitHub Actions JavaScript Action 런타임은 2026-07-03 기준 Node 24 기본 전환기이므로 Pages deploy action은 Node 24 대응 major를 사용한다.
- Actions에서는 `npm ci`를 쓰지 않고, `rm -f package-lock.json` 후 `npm install --no-audit --no-fund --prefer-online`을 사용한다.
- 로컬과 ZIP 산출물에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않는다.
- 산출 규칙 문구 고정: `package-lock.json 제외`, `풀파일 ZIP`, `패치 ZIP`은 매번 기록한다.
- SVG는 금지한다. 이미지 정책은 PNG/WebP/JPG 중심이다.
- 현재 GitHub Actions workflow는 GitHub Pages와 quality-check 양쪽 모두 `npm run check:boss-board-clearance`, `npm run check:combat-hud-touch-clearance`, `npm run check:modal-focus-rank-budget`, `npm run check:camera-gesture-statusbar-balance`, `npm run check:camera-status-image-budget`, `npm run check:firebase-write-lobby-anchor`, `npm run check:rank-copy-webp-atlas`, `npm run check:mobile-rank-fallback-anchor`, `npm run check:cleanup-live-paths`, `npm run check:css-runtime-selectors`, `npm run check:lobby-bottom-shortcut`를 실행한다. `tools/check-workflows.mjs`는 GitHub Pages workflow에서 `actions/deploy-pages@v5`를 요구하고 v4 이하를 차단한다.

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
npm run check:cleanup-live-paths
npm run check:css-runtime-selectors
npm run check:lobby-bottom-shortcut
npm run report:images
npm run build:github
```

가능하면 전체 `check:*` 스크립트를 모두 실행한다. 현재 v1.0.88 기준 `check:lobby-bottom-shortcut`까지 총 94개 `check:*` 스크립트가 있다.

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```




## v1.0.89B 실제 수정 내역 - GitHub Pages Build Guard Recovery Patch

- 사용자가 추가로 붙여준 새 실패 로그는 deploy job이 아니라 build job의 `npm run check:tile-geometry-hud` 단계 실패였다. 즉 v1.0.89의 `actions/deploy-pages@v5` 변경 자체가 아니라, build QA 중 package version guard가 먼저 실패한 상태다.
- 원인 추적 결과, v1.0.89에서 workflow-only 패치임에도 `package.json` version을 `1.0.89`로 올린 것이 문제였다. 여러 legacy QA 스크립트는 현재 runtime/cache/asset baseline인 `1.0.88`까지 허용하도록 작성되어 있고, `check:tile-geometry-hud`가 가장 먼저 그 문제를 드러냈다.
- 이번 v1.0.89B에서는 `package.json` version을 `1.0.88`로 되돌렸다. 이 패치는 GitHub Pages deploy action 교체를 유지하되 앱 runtime/cache/content 버전은 바꾸지 않는 build recovery 패치다.
- `.github/workflows/github-pages.yml`의 `actions/deploy-pages@v5`와 `tools/check-workflows.mjs`의 v5 요구 정책은 유지했다. GitHub Pages Source는 사용자가 GitHub Actions로 맞다고 다시 확인했으므로 설정 후보는 계속 제외한다.
- 화면/UI/게임 로직, service worker cache, asset manifest, HTML DOM, CSS selector, gameplay 함수는 수정하지 않았다. 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수도 추가하지 않았다.
- 삭제한 파일/함수/DOM은 없다. 이번 변경은 `package.json` version 복원과 문서 기록 보정만 수행했다.
- 안전 판단: 실패한 검수 스크립트는 실제 화면 동작이 아니라 package version 문자열 guard에서 멈췄다. 기존 v1.0.88 runtime baseline은 v1.0.89 이전까지 통과하던 기준이고, v1.0.89에서 바꾼 deploy action/workflow QA는 그대로 유지되므로 배포 문제 대응과 build guard 통과를 동시에 만족한다.

## v1.0.89B 필수 검수 명령

```bash
npm run check:workflows
npm run check:tile-geometry-hud
```

가능하면 GitHub Pages workflow의 Verify project policy에 들어있는 `npm run check:*`와 `npm run report:images`를 전체 실행한다. `node_modules`가 없는 산출 검수 환경에서는 `npm run typecheck`와 `npm run build:github`는 패치 적용 후 의존성 설치 환경에서 재확인한다.

## v1.0.89B 검수 결과

- `npm run check:workflows` 통과. `actions/deploy-pages@v5` 요구와 v4 이하 차단 정책은 유지된다.
- `npm run check:tile-geometry-hud` 통과. build 실패 직접 지점인 package version guard가 해소됐다.
- GitHub Pages workflow의 Verify project policy에 포함된 `npm run check:*` 및 `npm run report:images`를 가능한 범위에서 전체 실행했고 통과했다.
- `npm run report:images` 결과: 458 files, 52.58 MB total, 1.2 MB 초과 대형 이미지 9개 경고는 기존 asset budget 추적 항목으로 남는다.
- `npm run typecheck`, `npm run build:github`는 이 산출 환경에 `node_modules`가 없어 실행하지 않았다. 패치 적용 후 `npm install --no-audit --no-fund --prefer-online` 뒤 재실행해야 한다.

## v1.0.89B 다음 업데이트 예상

- GitHub Actions를 다시 실행해 build job이 `check:tile-geometry-hud` 이후 끝까지 통과하는지 확인한다.
- build job이 통과하면 deploy job에서 `actions/deploy-pages@v5`가 실행되고, 기존 `syncing_files` 실패가 사라지는지 확인한다.
- 만약 이후 다른 `check:*`가 package version guard로 실패하면, package version bump 정책과 legacy QA version guard 통합을 별도 범위로 다룬다. 이번 패치는 build 실패 직접 지점 복구만 수행했다.

## GitHub Desktop 커밋 메시지 추천

Recover 꿈의 서고 v1.0.89B build guard baseline

## v1.0.89 실제 수정 내역 - GitHub Pages Deploy Runtime Stabilization Patch

- 사용자가 GitHub 저장소 Settings -> Pages -> Build and deployment Source가 GitHub Actions로 맞다는 것을 재확인했다. 따라서 이번 원인 분류에서 Pages source 설정 오류 후보는 제외했다.
- 실패 로그는 build/artifact 문제가 아니었다. `Fetching artifact metadata`, `Found 1 artifact(s)`, `Created deployment` 이후 `syncing_files` 상태에서 실패했다.
- 놓친 핵심 지점은 앱 빌드 Node 버전과 GitHub Actions JavaScript Action 런타임 버전이 다르다는 점이다. `actions/setup-node`의 `node-version: 20`은 앱 빌드 Node이고, `actions/deploy-pages@v4` 자체가 어떤 Node 런타임으로 실행되는지는 Action major가 결정한다.
- 2026-07-03 기준 GitHub Actions hosted runner는 Node 24 기본 실행 전환기에 있고, `actions/deploy-pages@v5`는 Node.js 24.x 대응 릴리스다. 따라서 `.github/workflows/github-pages.yml`에서 deploy step을 `actions/deploy-pages@v4`에서 `actions/deploy-pages@v5`로 갱신했다.
- 임시 우회인 `ACTIONS_ALLOW_USE_UNSECURE_NODE_VERSION=true`는 넣지 않았다. 이유: Node 20으로 되돌리는 임시 대응이고, 이후 runner에서 Node 20이 제거되면 다시 깨질 수 있기 때문이다.
- `tools/check-workflows.mjs`에 `actions/deploy-pages@v5` 필수 검사를 추가하고 `actions/deploy-pages@v4` 이하가 되살아나면 실패하도록 차단했다. 출력 문구도 “Node 20 app build, Node 24 Pages deploy action”으로 통합했다.
- `package.json` version을 `1.0.89`로 갱신했다.
- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다. 화면/UI/게임 로직도 수정하지 않았다.
- 삭제한 파일/함수/DOM은 없다. 이번 변경은 workflow action major 교체와 workflow QA 정책 통합만 수행했다.
- 안전 판단: 기존 workflow는 `actions/upload-pages-artifact@v3`를 사용 중이고, 해당 artifact는 `actions/deploy-pages@v4 or newer` 요구 조건과 맞는다. `v5`는 이 조건의 newer 범위다. 로그상 artifact 생성/조회는 이미 성공하므로, 배포 실패 지점인 deploy action runtime만 최소 변경했다.

## v1.0.89 필수 검수 명령

```bash
npm run check:workflows
npm run check:health
```

가능하면 의존성 설치 후 아래도 실행한다. 현재 산출 검수 환경에는 `node_modules`가 포함되어 있지 않으므로 typecheck/build는 사용자가 패치 적용 후 `npm install --no-audit --no-fund --prefer-online`을 실행한 환경에서 재확인한다.

```bash
npm run typecheck
npm run build:github
```

## v1.0.89 검수 결과

- `npm run check:workflows` 통과. GitHub Pages workflow에서 `actions/deploy-pages@v5`를 요구하고 v4 이하를 차단하는 정책이 정상 작동했다.
- `npm run check:health` 통과. 기본 프로젝트 필수 파일과 SVG 금지 정책이 유지됐다.
- `npm run typecheck`, `npm run build:github`는 이 산출 환경에 `node_modules`가 없어 실행하지 않았다. 패치 적용 후 `npm install --no-audit --no-fund --prefer-online` 뒤 재실행해야 한다.

## v1.0.89 다음 업데이트 예상

- GitHub Actions 재실행 후 deploy job 로그에서 Node 20 deprecation / `punycode` warning / `syncing_files` 실패가 사라지는지 확인한다.
- build job 쪽에서 `actions/checkout@v4`, `actions/setup-node@v4`, `actions/upload-pages-artifact@v3` 관련 Node 20 경고가 추가로 보이면, 다음 버전에서 GitHub official actions Node 24 migration을 별도 범위로 다룬다. 이번 v1.0.89에서는 deploy 실패 직접 지점만 고쳤다.
- 만약 `actions/deploy-pages@v5` 적용 후에도 `syncing_files`에서 실패하면, GitHub Pages backend incident 또는 Pages deployment latency 재발 여부를 GitHub Status에서 먼저 확인한다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.89 GitHub Pages deploy Node 24 action patch



## v1.0.88A 분석 기록 - GitHub Pages Deploy Failure Audit and Handoff Rule Lock

- 사용자가 업로드한 `DR.zip`을 기준으로 통파일 구조, 인수인계 문서, workflow, package script, service worker, 산출 규칙을 먼저 점검했다.
- 이번 분석 패치에서는 소스/화면 로직을 변경하지 않았다. 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수도 추가하지 않았다.
- 현재 프로젝트는 `AI_HANDOFF_DR.md` 724줄, `README.md` 3345줄, 전체 파일 692개, public asset 중심 구조다. 루트에는 `AI_HANDOFF_DR.md`, `README.md`, `.github/workflows/*.yml`, `src`, `public`, `tools`가 핵심이다.
- `package.json` 기준 버전은 `1.0.88`이고 `check:*` 스크립트는 94개다. 이번 audit-only 산출물은 package version을 올리지 않고 문서 기록만 추가한다.
- 업로드 ZIP 안에는 `package-lock.json`이 포함되어 있었다. 기존 인수인계 규칙은 산출 ZIP에서 `package-lock.json` 제외를 요구하므로, 이번 산출 풀파일 ZIP에서는 제외한다. 다만 패치 ZIP은 문서 2개만 포함하므로 기존 로컬의 `package-lock.json` 삭제까지 수행하지 않는다. 삭제가 필요하면 별도 범위로 지정해 실제 사용 여부와 workflow 영향을 확인한 뒤 처리한다.
- GitHub Pages workflow 분석 결과: `.github/workflows/github-pages.yml`은 `actions/setup-node@v4` + `node-version: 20`, `actions/upload-pages-artifact@v3`, `actions/deploy-pages@v4`, `pages: write`, `id-token: write`를 사용한다. 로그는 artifact를 찾고 Pages deployment 생성까지 성공한 뒤 `syncing_files`에서 실패했다. 따라서 현재 증상은 build 실패/아티팩트 누락보다 Pages 배포 action 런타임 전환 또는 Pages 동기화 백엔드 계열 가능성이 높다.
- `tools/check-workflows.mjs`는 아직 “Node 20 LTS” 문구를 정상 정책으로 출력하고 `node-version: 22`만 금지한다. 2026-07-03 기준 Node 20 Actions 런타임 전환 이슈가 실제 로그에 나타나므로, 다음 배포 패치에서 workflow와 QA 정책을 같이 바꿔야 한다.
- 현재 로그의 `punycode` 경고는 Node 24에서 더 크게 보이는 deprecation warning 성격이며, 사용자가 붙여준 실패의 직접 지점은 그 뒤의 `Deployment failed, try again later`다.
- `npm run check:workflows` 통과. 현재 workflow 정책 파일이 기존 Node 20 기준으로는 정상임을 확인했다.
- `npm run check:lobby-bottom-shortcut` 통과. 직전 v1.0.88 로비 하단 메뉴바 QA는 유지되어 있다.
- `npm run check:health` 통과. 기본 프로젝트 필수 파일/SVG 금지 확인은 유지되어 있다.
- 이번 분석에서는 `npm install`, `npm run build:github`, 전체 94개 `check:*`는 실행하지 않았다. 이유: 사용자가 “분석부터”를 지시했고, 배포 실패 로그가 build 이후 deploy 단계에서 발생했기 때문이다. 다음 실제 workflow 패치에서는 최소 `npm run check:workflows`, `npm run typecheck`, `npm run build:github`를 다시 실행한다.

## v1.0.88A 다음 업데이트 예상

- v1.0.89 범위는 GitHub Pages Deploy Runtime Stabilization 하나로 제한한다.
- 후보 1: `actions/deploy-pages@v4`를 현재 Node 24 전환에 맞는 최신 major로 갱신하는지 검토한다.
- 후보 2: 앱 빌드용 `actions/setup-node`의 `node-version: 20` 유지/상향 여부를 Action 런타임과 분리해 판단한다.
- 후보 3: `tools/check-workflows.mjs`, `AI_HANDOFF_DR.md`, `README.md`의 Node 20 고정 문구를 실제 정책과 맞게 통합한다.
- 후보 4: GitHub Pages 설정에서 Build and deployment source가 `GitHub Actions`인지 사용자가 확인해야 한다. 이 항목은 저장소 설정이라 ZIP 패치만으로 검증할 수 없다.

## GitHub Desktop 커밋 메시지 추천

Record 꿈의 서고 v1.0.88A deploy failure audit and handoff rules



## v1.0.88 실제 수정 내역

- `package.json` 버전을 `1.0.88`로 갱신했다.
- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다. 기존 `#lobby-menu-hub`, `initLobbyScrollGuard()`, CSS, QA script, service worker, atlas preload 위치에서 직접 수정했다.
- 삭제 전 호출 추적 결과:
  - `#lobby-menu-hub`는 실제 메뉴 버튼 DOM이며 `openLobbyMenuPanel()` 흐름과 연결되어 있다. 살아있는 UI이므로 복제/삭제하지 않고 기존 DOM을 최하단 fixed bar로 전환했다.
  - `#lobby-menu-hub`의 `alive-panel` class는 `panelFloat` animation을 통해 계속 위치를 움직인다. 하단 고정 메뉴바에서는 스크롤 떨림처럼 보일 수 있어 해당 class만 삭제했다. 다른 카드의 `alive-panel` 연출은 유지했다.
  - `initLobbyScrollGuard()`는 실제 초기화 경로에서 호출된다. 함수 자체는 로비 드래그 중 실수 클릭을 막는 살아있는 코드라 유지했다.
  - 다만 `shell.scrollTop -= deltaY * 1.28` 수동 보정은 native scroll과 동시에 작동해 모바일 관성 스크롤과 충돌할 수 있으므로 삭제했다. 드래그 상태 class와 클릭 방지 흐름은 유지했다.
- `data-lobby-shortcut-placement="bottom-fixed"`를 기존 hub / overlay / panel dock에 추가했다. 이 marker는 새 함수를 만들기 위한 것이 아니라 기존 DOM의 고정 배치와 popup safe area를 CSS/QA에서 확인하기 위한 상태 표시다.
- CSS에서 로비 화면에만 하단 고정 메뉴바를 표시하고, 로그인/실게임 화면에서는 숨기도록 했다. overlay보다 높은 z-index로 팝업 중에도 유지하되, 일반 모달 stack보다 낮은 레이어로 제한했다.
- 로비 app shell과 screen, lobby overlay, lobby panel dock에 하단 고정바 공간을 예약해 긴 패널과 팝업이 메뉴바와 겹치지 않도록 했다.
- `tools/check-lobby-bottom-shortcut.mjs`를 추가했다. 단일 hub 고정, `alive-panel` 제거, game 화면 숨김, overlay 하단 공간, 수동 scrollTop 보정 삭제, 새 버전 꼬리 함수 미추가를 검사한다.
- GitHub Pages / quality-check workflow에 `npm run check:lobby-bottom-shortcut`를 연결했다.
- `dream-library-cache-v1.0.88`, `texture-atlas-manifest-v1.0.88.json`을 추가했다.

## v1.0.88 필수 검수 명령

```bash
npm run typecheck
npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false
npm run check:lobby-bottom-shortcut
npm run check:lobby-shortcut-scroll
npm run check:lobby-navigation-rhythm
npm run check:css-runtime-selectors
npm run check:cleanup-live-paths
npm run report:images
npm run build:github
```

가능하면 아래 방식으로 전체 `check:*` 94개를 모두 실행한다.

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.88 검수 결과

- `npm run typecheck` 통과.
- `npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false` 통과.
- 전체 94개 `check:*` QA suite 통과.
- `npm run check:lobby-bottom-shortcut` 통과.
- `npm run check:scroll-polish` 통과. 수동 `scrollTop` 보정 삭제 기준으로 QA를 통합했다.
- `npm run check:boss-stage-lobby-scroll` 통과. 로비 drag rescue QA는 native scroll + 클릭 방지 기준으로 통합했다.
- `npm run report:images` 통과. 458 files, 52.58 MB. 1.2MB 초과 이미지 9개는 계속 추적한다.
- `npm run build:github` 통과. 가장 큰 JS chunk는 `vendor-pixi-core-v1081` 약 343.02 KB다.

## v1.0.88 다음 업데이트 예상

- 실제 모바일에서 로비 하단 고정 메뉴바가 safe area와 겹치지 않는지 확인한다.
- 로비 팝업을 열고 닫은 뒤 scroll anchor 복귀가 튀지 않는지 확인한다.
- 이번 범위 밖이었던 오래된 `data-*` marker 중 실제 CSS/QA/상태표시에 필요 없는 항목을 계속 분류한다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.88 lobby bottom shortcut scroll stabilization patch



## v1.0.87 실제 수정 내역

- `package.json` 버전을 `1.0.87`로 갱신했다.
- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다. 기존 CSS, QA script, service worker, atlas preload 위치에서만 정리했다.
- 삭제 전 호출 추적 결과:
  - CSS에서 사용하는 versioned data selector 값을 `index.html`과 `src/**/*.ts`, `src/**/*.js` runtime source 전체와 대조했다.
  - `clear-status-v1043`, `statusbar-right-portrait-v1044`, `statusbar-chip-right-v1045`, `v1045-stage-ladder-42`, `next-goal-v1046`, `v1048-campaign-gesture-fluid`, `v1049-compact-chapter-carousel`, `v1050-finale-compact-carousel`, `v1051-auto-focus-compact-carousel`, `v1053-season-store-claim-history`, `v1053-mobile-ui-density-overlap-qa`, `v1053-claimed-boss-icon-polish` 등 39개 token은 runtime에서 더 이상 생산되지 않았다.
  - 해당 token을 포함한 86개 CSS rule은 사용자 화면에 실제 효과가 없는 죽은 selector로 판단해 삭제했다.
  - `.stage-ladder-summary`, `.summer-season-panel`, `.boss-role-stack`, `.boss-state-icon`, `.boss-role-help`, `.season-shop-card`, `.season-shop-claim`, `.season-shop-history` 같은 실제 DOM/class 기반 스타일은 호출 경로가 살아 있어 유지했다.
- `v1054 legacy check compatibility anchors` 주석은 QA 문자열만 남기는 앵커였으므로 삭제했다.
- 삭제한 과거 selector를 찾던 QA는 현재 살아있는 dataset 기준으로 통합했다.
  - 보스 상태 QA: `clear-status-v1043` 대신 `statusbar-left-icon-v1077` / `v1046-icon-readability` / `boss-role-stack` 경로 확인.
  - 스테이지 맵 QA: `next-goal-v1046` CSS 대신 `next-goal-v1052-shop-reward` runtime dataset과 `.stage-ladder-summary` base style 확인.
  - 시즌 패널 QA: 삭제된 v1050/v1051/v1053 selector 대신 `v1054-season-store-collection-link`, `v1054-mobile-design-overlap-audit`, 실제 `.season-shop-*` class 확인.
- `tools/check-css-runtime-selectors.mjs`를 추가했다. 남은 versioned CSS data selector 값이 runtime source에서 생산되지 않으면 실패하며, 이번에 삭제한 과거 selector token이 CSS에 되살아나도 실패한다.
- GitHub Pages / quality-check workflow에 `npm run check:css-runtime-selectors`를 연결했다.
- `dream-library-cache-v1.0.87`, `texture-atlas-manifest-v1.0.87.json`을 추가했다.

## v1.0.87 필수 검수 명령

```bash
npm run typecheck
npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false
npm run check:css-runtime-selectors
npm run check:cleanup-live-paths
npm run check:auth-modal-boss-role
npm run check:stage-map-boss-difficulty-lobby
npm run check:summer-season-mega
npm run check:summer-shop-claim-design
npm run report:images
npm run build:github
```

가능하면 아래 방식으로 전체 `check:*` 93개를 모두 실행한다.

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.87 검수 결과

- `npm run typecheck` 통과.
- `npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false` 통과.
- 전체 93개 `check:*` QA suite 통과.
- `npm run check:css-runtime-selectors` 통과.
- `npm run check:cleanup-live-paths` 통과.
- `npm run report:images` 통과. 458 files, 52.58 MB. 1.2MB 초과 이미지 9개는 계속 추적한다.
- `npm run build:github` 통과. 가장 큰 JS chunk는 `vendor-pixi-core-v1081` 약 343.02 KB다.

## v1.0.87 다음 업데이트 진행 완료

- v1.0.88에서 로비 첫 화면 바로가기 메뉴바를 최하단 고정형으로 통합했다.
- `initLobbyScrollGuard()`의 수동 scrollTop 보정을 삭제하고 native scroll 중심으로 정리했다.
- 오래된 `data-*` marker 분류는 v1.0.89 후속 후보로 넘긴다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.87 css runtime selector cleanup patch


## v1.0.86 실제 수정 내역

- `package.json` 버전을 `1.0.86`으로 갱신했다.
- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다. 기존 service worker, login/auth, exit sheet, QA script 위치에서 직접 정리했다.
- 삭제 전 호출 추적 결과:
  - `public/sw.js`의 `CACHE_SLIM_POLICY`, `PREVIOUS_CACHE_SLIM_POLICY`, `LEGACY_QA_CACHE_ANCHORS`, `LEGACY_AUTH_MODAL_CACHE_SLIM_POLICY`는 install/activate/fetch handler에서 읽히지 않았다. 실제 캐시 동작은 `CACHE_NAME`, `CORE_ASSETS`, fetch handler가 담당하므로 죽은 문자열 앵커로 판단하고 삭제했다.
  - `retired-shell-actions`, `back-button`, `open-settings-button`은 active 화면에서 hidden/inert 상태였고, 실제 옵션 진입은 `exit-options-button`, `exit-options-row-button`, `openOptionsFromExitSheet()`가 담당했다. hidden mount와 main 참조/event binding, `#back-button` CSS를 삭제했다.
  - `enter-lobby-button`은 hidden direct lobby compatibility mount였고, 실제 시작 흐름은 `anonymousButton`, `googleButton`, `showEmailButton`에서 `enterLobbyFromAuth()` 또는 중앙 이메일 모달로 이어졌다. DOM mount와 main 참조를 삭제했다.
  - hidden inline email form은 실제 이메일 로그인/가입이 `email-auth-modal`, `openEmailAuthModal()`, `runEmailLoginFromModal()`, `runEmailSignupFromModal()`로 처리되어 삭제했다. inline fallback 함수와 input 참조, `.email-form` / `.email-buttons` / `.retired-inline-email-form` CSS를 삭제했다.
- 예전 service worker cache 이름을 검사하던 QA는 현재 살아있는 `dream-library-cache-v1.0.86` 기준으로 통합했다. 오래된 cache 이름 문자열은 되살리지 않았고, 필요한 atlas manifest는 `CORE_ASSETS`의 실제 cache 대상 후보로 유지했다.
- `tools/check-cleanup-live-paths.mjs`를 추가했다. 삭제한 compatibility mount/dead token이 active runtime에 다시 생기면 실패하고, 이메일 중앙 모달/exit sheet/current cache 경로가 살아있는지 확인한다.
- GitHub Pages / quality-check workflow에 `npm run check:cleanup-live-paths`를 연결했다.
- `dream-library-cache-v1.0.86`, `texture-atlas-manifest-v1.0.86.json`을 추가했다.

## v1.0.86 필수 검수 명령

```bash
npm run typecheck
npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false
npm run check:cleanup-live-paths
npm run check:auth-entry-flow
npm run check:auth-modal-boss-role
npm run check:no-minimap-topbar
npm run check:space-reclaim-back-options
npm run report:images
npm run build:github
```

가능하면 아래 방식으로 전체 `check:*` 92개를 모두 실행한다.

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.86 검수 결과

- `npm run typecheck` 통과.
- `npx tsc --noEmit --noUnusedLocals true --noUnusedParameters false` 통과.
- 전체 92개 `check:*` QA suite 통과.
- `npm run check:cleanup-live-paths` 통과.
- `npm run report:images` 통과. 458 files, 52.58 MB. 1.2MB 초과 이미지 9개는 계속 추적한다.
- `npm run build:github` 통과. 가장 큰 JS chunk는 `vendor-pixi-core-v1081` 약 343.02 KB다.

## v1.0.86 다음 업데이트 예상

- v1.0.87에서는 CSS 안의 오래된 version selector 중 현재 runtime dataset과 연결되지 않은 항목을 실제 효과 기준으로 추가 분류한다.
- `src/main.ts`의 오래된 data-* marker 중 사용자 화면/QA/상태표시에 필요한 것과 단순 과거 앵커를 분리한다.
- 살아있는 로비/시즌/보스/랭킹 흐름은 유지하고, 효과가 끊긴 selector만 기존 로직에 통합하거나 삭제한다.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.86 cleanup live paths patch


## v1.0.85 실제 수정 내역

- `package.json` 버전을 `1.0.85`로 갱신했다.
- 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다. 기존 로직 위치에서 직접 정리했다.
- `tsc --noEmit --noUnusedLocals true --noUnusedParameters false`와 grep 호출 추적으로 죽은 코드 후보를 먼저 분리했다.
- 삭제 전 호출 추적 결과:
  - `enterLobbyFromStart()`는 `tools/check-kakao-lobby-rotation.mjs`만 이름을 찾고 있었고, 실제 버튼은 `enterLobbyFromAuth('resume')`를 직접 호출했다. 그래서 wrapper를 삭제하고 QA를 실제 진입 함수 검사로 통합했다.
  - `getRecentSeasonShopHistoryId()`는 선언 외 호출이 없었다. 시즌 상점 기록은 `addSeasonShopHistory()`, `getSummerShopHistoryCards()`, `state.seasonShopHistory` 저장 경로가 살아 있어 해당 미사용 helper만 삭제했다.
  - `renderLocalLeaderboard()` / `renderLocalDailyLeaderboard()`는 선언 외 호출이 없었다. 실제 fallback은 `loadLeaderboard()` / `loadDailyLeaderboard()` 내부에서 `getLocalRankRows()`와 `renderRankRows()`로 처리되어 두 wrapper를 삭제했다.
  - `isV2GameplayTile()` / `V2_TILE_TYPES`는 import/호출이 없었다. 타일 공급은 `GAMEPLAY_TILE_SET` / `getGameplayTiles()`가 살아 있어 삭제했다.
- `src/main.ts`에서 미사용 import `requestGameFullscreen`을 삭제했다. fullscreen 실제 기능은 `src/platform/fullscreen.js`의 `initFullscreenControls()` 내부에 남아 있다.
- `src/main.ts`의 예전 patch token 상수, `*_COMPAT_TOKENS`, `void ...COMPAT_TOKENS`, `LEGACY_V1051_TO_V1053_COMPAT_TOKENS`, `LEGACY_LOBBY_DRAG_THRESHOLD_NOTE`를 삭제했다. 이들은 실제 런타임 호출/DOM 효과가 없고 QA 문자열만 만족시키던 코드였다.
- `src/game/difficulty.js`의 `LEGACY_QA_ATLAS_MANIFEST_ANCHORS` 블록을 삭제했다. 계속 필요한 manifest는 `ATLAS_ASSETS`에 실제 preload 후보로 통합했다.
- `src/styles.css`의 boss atlas selector를 현재 런타임 값인 `stable-atlas-v1054-collection-link-polish` 기준으로 통합했다. 기존 v1040 selector는 main에서 더 이상 설정하지 않아 효과가 끊긴 상태였다.
- 삭제한 함수/토큰을 강제로 찾던 QA 스크립트는 현재 살아있는 함수, dataset, CSS selector, preload 후보를 확인하도록 정리했다.
- `dream-library-cache-v1.0.85`, `texture-atlas-manifest-v1.0.85.json`을 추가했다.

## v1.0.85 검수 결과

- `npm run typecheck` 통과.
- `tsc --noEmit --noUnusedLocals true --noUnusedParameters false` 기준 `src/main.ts` / `src/game/difficulty.js` 미사용 함수·상수 없음.
- 전체 91개 `check:*` QA suite 통과.
- `npm run report:images` 통과.
- `npm run build:github` 통과.

## v1.0.85 다음 업데이트 예상

- v1.0.86에서는 `public/sw.js`의 legacy QA cache anchor와 `index.html`의 hidden compatibility mount를 실제 호출/효과 기준으로 추적한다.
- CSS 안의 오래된 version selector 중 현재 runtime dataset과 연결되지 않은 항목을 분류한다.
- 살아있는 화면/게임 기능은 유지하고, 단순 문자열 앵커나 효과가 끊긴 selector만 단계적으로 삭제 또는 실제 로직에 통합한다.

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
