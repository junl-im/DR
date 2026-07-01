# AI_HANDOFF_DR.md - Dream Library 이어받기 문서

## 현재 작업중인 내용 1열

| 항목 | 기록 |
|---|---|
| 현재 버전 | v1.0.77 |
| 프로젝트 | 꿈의 서고 / Dream Library, 세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG |
| 이번 패치 | Boss Board Clearance, Left Statusbar Portrait and Pixi Board Obstruction Guard Patch |
| 핵심 수정 | 전투 보드 아래쪽에 보이던 Pixi 보스/몬스터 그림을 보드 위에서 제거하고, 보스 상태바 안으로 시각 정보를 이동 |
| 보스 이미지 수정 | 보스 원본 이미지는 상태바 왼쪽 끝 `boss-core`에 고정 표시, 보스 공격/경고 atlas 연출은 오른쪽 작은 `boss-lane-echo`에서만 표시 |
| 보드 방해 해결 | `DreamPixiRenderer`의 보드 우하단 보스 sprite/aura는 v1.0.77 상태바 echo가 감지되면 `visible=false`, `renderable=false`, `alpha=0`으로 차단 |
| 원인 기록 | v1.0.76까지는 상태바 우측 압축 레이아웃과 Pixi 보스 레이어가 동시에 살아 있어, 실제 플레이 화면에서 보스 연출이 타일/하단 HUD 근처에 떠서 방해될 수 있었음 |
| 예전 코드 방지 | active HTML/main에서 `statusbar-icon-right-v1046` 복귀를 금지하는 `check:boss-board-clearance` 추가, old v1046 right-side CSS도 제거 |
| 작업 기준 | 이전 산출물 `DR_v1.0.76.zip`에서 이어서 작업 |
| 필수 산출 | 그대로 사용 가능한 풀파일 ZIP 1개, 덮어쓰기용 패치 ZIP 1개 |
| 산출 파일명 규칙 | 짧은 이름 + 버전 숫자 포함. 예: `DR_v1.0.77.zip`, `DR_patch_v1.0.77.zip` |
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
- 현재 GitHub Actions workflow는 GitHub Pages와 quality-check 양쪽 모두 `npm run check:boss-board-clearance`를 실행한다.

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
npm run report:images
npm run build:github
```

가능하면 전체 `check:*` 스크립트를 모두 실행한다. 현재 v1.0.77 기준 `check:boss-board-clearance`까지 총 84개 `check:*` 스크립트가 있다.

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

## v1.0.77 실제 수정 내역

- `package.json` 버전을 `1.0.77`로 갱신했다.
- `index.html`의 `.boss-lane`을 `statusbar-left-icon-safe-v1077` 레이아웃으로 교체했다.
- `#boss-core`를 `.boss-info`보다 앞에 배치해 보스 원본 이미지가 상태바 왼쪽 끝에 먼저 보이게 했다.
- `#boss-lane-echo`와 `#boss-lane-echo-sprite`를 추가해 보스 atlas 경고/피격/붕괴 연출을 상태바 오른쪽 작은 원형 echo로 이동했다.
- `src/main.ts`에 `BOSS_BOARD_CLEARANCE_PATCH`와 echo DOM 참조를 추가했다.
- `renderBossPanel()`, `setBossStableImage()`, `applyBossAtlasFrame()`, `setBossFrame()`이 상태바 왼쪽 보스 그림과 오른쪽 echo를 함께 갱신하도록 정리했다.
- `src/rendering/DreamPixiRenderer.ts`에서 상태바 echo가 있으면 Pixi 보스 sprite/aura를 보드 위에 그리지 않도록 숨김 처리했다.
- 기존 Pixi boss QA가 요구하는 `data-boss-layer="pixi"` 호환성은 유지하되 `data-boss-layer-placement="statusbar-echo-v1077"`, `data-boss-layer-visibility="dom-lane-echo"`로 실제 배치 이유를 남긴다.
- `src/styles.css`에 v1.0.77 상태바 왼쪽 보스 초상, 오른쪽 echo, 작은 화면 밀도, reduced motion 규칙을 추가했다.
- v1.0.46의 우측 압축 보스 레이아웃 CSS는 active fallback으로 살아나지 않도록 제거했다.
- `tools/check-boss-board-clearance.mjs`를 새로 추가했다.
- 기존 stage/boss 관련 QA가 v1.0.77 왼쪽 보스 초상 레이아웃을 기준으로 검사하도록 갱신했다.
- `public/sw.js` cache를 `dream-library-cache-v1.0.77`로 갱신했다.
- `public/assets/meta/texture-atlas-manifest-v1.0.77.json`을 생성했다.
- GitHub Pages / quality-check workflow에 `npm run check:boss-board-clearance`를 추가했다.

## v1.0.77 검수 결과

- `npm run typecheck` 통과.
- 전체 84개 `check:*` QA suite 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:pixi-boss-layer` 통과.
- `npm run check:boss-asset-visibility` 통과.
- `npm run report:images` 통과. 454 files, 51.98 MB. 1.2 MB 초과 이미지 9개는 후속 최적화 후보.
- `npm run build:github` 통과.
- 빌드 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고가 계속 있음. 기존 경고이며 실패 아님.
- 빌드 경고: `vendor-effects` chunk 500 KB 초과 경고가 계속 있음. 기존 경고이며 실패 아님.

## v1.0.77에서 특히 확인해야 할 화면

- 전투 진입 후 하단 타일/스킬바 근처에 보스/몬스터 큰 그림이 남지 않아야 한다.
- 보스 원본 이미지는 보스 상태바 왼쪽 끝 원형 초상으로 보여야 한다.
- 보스 공격 예고/피격 같은 움직임은 상태바 오른쪽 작은 echo에서만 보여야 한다.
- HP 100%, 예고 pill, 보스 이름, boss-role-stack이 390px 이하 화면에서도 서로 겹치지 않아야 한다.
- old active attribute `data-boss-layout="statusbar-icon-right-v1046"`가 HTML/main에서 다시 나타나면 실패로 봐야 한다.

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

패치 ZIP에는 v1.0.76에서 v1.0.77로 바뀐 파일만 넣는다. 삭제가 필요한 임시 파일은 만들지 않는다.

## 다음 업데이트 예상 내역

다음은 v1.0.78로 이어간다.

- 전투 HUD 상단/하단 밀도 재검수: 제한 시간, 점수, 콤보, 이동 칸이 작은 화면에서 눌리거나 겹치지 않는지 확인.
- 보스 상태바 HP/예고/이름 가독성 추가 다듬기.
- 하단 스킬바와 타일 보드 사이 여백, 터치 오입력 가능성 QA.
- 보상 모달과 복원 상세 모달 focus return 재검수.
- Firebase 무료 기준 랭킹/일일 기록 읽기 빈도 점검.
- 저사양 기기 Pixi render budget 재검토와 `vendor-effects` chunk 분리 후보 조사.
- 남은 영어/개발자용 문구와 오래된 QA 출력 문구 정리.

## GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.77 boss board clearance left portrait and statusbar echo patch
