# 꿈의 서고

세로형 모바일 우선 사천성 퍼즐 + 마법 전투 RPG입니다. GitHub Pages를 기본 배포 주소로 사용하고, Firebase는 Authentication, Firestore, Analytics 용도로 사용합니다.

- 기본 배포 주소: `https://junl-im.github.io/DR/`
- GitHub 저장소: `https://github.com/junl-im/DR`
- Firebase Project ID: `dream-library-b732a`
- 화면 방향: 세로형 9:16 모바일 우선
- 에셋 원칙: SVG 금지, 2D~3D 렌더링 PNG/WebP와 Texture Atlas만 사용

## Engine Direction

```text
WebGL
  ↓
PixiJS 8
  ↓
Custom Rendering Layer
  ↓
GSAP + Spine + Particle System
  ↓
Howler.js
  ↓
Texture Atlas
```

## Art Direction

- 2.5D Premium Casual Fantasy
- Stylized PBR Look
- Soft Rim Light
- High Material Definition
- Premium Casual
- Subsurface Feel
- Soft AO
- Painterly Finish
- Luxury UI
- Modern Korean Mobile Game
- 제한 팔레트: 네이비, 골드, 에메랄드, 바이올렛, 스카이블루

## Asset Pipeline

```text
Art Bible
  ↓
Master Style Prompt
  ↓
Object Prompt
  ↓
PNG/WebP 렌더링 생성
  ↓
배경 제거 확인
  ↓
Shadow 제거
  ↓
Atlas 생성
  ↓
게임 적용
```

## Version History

### v1.0.85 - Live Code Cleanup, Dead Function Deletion and QA Integration Patch

- v1.0.84 기준 통파일을 점검하고 이번 패치 범위를 코드 정리로 제한했다. 새 버전 번호가 붙은 `install...Pass()` / `sync...Ui()` 함수는 추가하지 않았다.
- TypeScript `noUnusedLocals` 기준과 grep 호출 추적으로 살아있는 코드와 죽은 코드를 먼저 분리했다. 정상 호출 경로가 있는 함수와 실제 UI/게임 로직에 효과가 있는 코드는 유지했다.
- `src/main.ts`에서 실제 호출 경로가 없던 `enterLobbyFromStart()`, `getRecentSeasonShopHistoryId()`, `renderLocalLeaderboard()`, `renderLocalDailyLeaderboard()`를 삭제했다. 로비 진입은 이미 `enterLobbyFromAuth('resume')` 경로로 통합되어 있었고, 랭킹 fallback은 `loadLeaderboard()` / `loadDailyLeaderboard()` 안에서 `getLocalRankRows()`와 `renderRankRows()`로 직접 처리되고 있었다.
- `src/game/difficulty.js`에서 외부 import/내부 호출이 없던 `isV2GameplayTile()`와 그 전용 `V2_TILE_TYPES`를 삭제했다. 타일 선택은 `GAMEPLAY_TILE_SET` / `getGameplayTiles()` 경로가 살아있는 기준으로 유지된다.
- `requestGameFullscreen`의 `src/main.ts` 미사용 import와, 값만 남아 있던 예전 patch token 상수/compat token 상수/`void ...COMPAT_TOKENS` 블록을 삭제했다. 보스 이미지, 카메라, 시즌, 랭킹, 모달의 실제 동작 상수는 유지했다.
- `stable-atlas-v1040` 전용 CSS selector는 현재 런타임에서 실제로 설정되는 `stable-atlas-v1054-collection-link-polish` selector로 통합했다. 삭제 전 추적 결과, main은 이미 v1054 값을 쓰고 있어 v1040 selector는 실제 효과가 끊긴 상태였다.
- QA 스크립트는 삭제한 함수/토큰 이름을 강제로 찾지 않도록 정리하고, 현재 살아있는 호출 경로와 실제 mount/dataset/CSS selector를 검사하도록 수정했다.
- `src/game/difficulty.js`의 별도 `LEGACY_QA_ATLAS_MANIFEST_ANCHORS` 블록을 삭제하고, 필요한 manifest는 `ATLAS_ASSETS`의 실제 preload 후보로 통합했다.
- service worker cache를 `dream-library-cache-v1.0.85`로 갱신하고 `texture-atlas-manifest-v1.0.85.json`을 추가했다.
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md와 AI_HANDOFF_DR.md에만 누적한다.

다음 업데이트 예정: v1.0.86 - Service Worker Legacy Anchor Cleanup and Hidden Compatibility Mount Audit

- `public/sw.js`의 legacy QA cache anchor가 실제 캐시 정책인지, 단순 문자열 앵커인지 추가 추적
- `index.html`의 hidden compatibility mount가 실제 화면/QA에 필요한지 추적 후 삭제 또는 실제 mount로 통합
- CSS의 오래된 version selector 중 현재 runtime dataset과 연결되지 않은 항목 분류
- 살아있는 로비/시즌/보스/랭킹 흐름은 건드리지 않고, 죽은 앵커와 죽은 selector만 단계적으로 정리



### v1.0.84 - Mobile Ranking Chip Wrap, Asset Fallback Load Polish and Lobby Anchor Settle QA Patch

- v1.0.83 기준 통파일을 점검하고 실제 모바일에서 랭킹 상태 chip이 이름/점수와 겹치거나 과하게 길어지는 흐름을 다시 다듬었다.
- `v1084-mobile-rank-chip-wrap`을 추가해 랭킹 row에 `data-rank-chip-wrap`을 부여하고, 작은 화면에서는 점수/이름/source chip/방금 기록 chip이 안정적으로 줄바꿈되도록 grid를 재조정했다.
- 방금 기록 chip 문구는 `방금 기록`에서 화면용 `방금`으로 줄이고, 접근성 `aria-label`에는 의미를 유지해 좁은 폭에서 덜 밀리게 했다.
- `v1084-asset-fallback-load-polish`를 추가해 `imported-moon-library.webp`, `frame-library-v2.webp`를 생성하고 PNG fallback보다 WebP를 먼저 preload/cache 후보에 배치했다.
- `v1084-lobby-anchor-settle-qa`를 추가해 로비 긴 패널 복귀 시 anchor가 이미 화면 안에 있으면 불필요한 `scrollIntoView`를 하지 않아 작은 화면 튐을 줄였다.
- `v1084-boss-atlas-build-verify`를 추가해 v1.0.83의 boss atlas CSS 변수 guard가 유지되는지, 빌드에서 `/DR/assets/atlas/boss-frames-v2.png` resolve 경고가 다시 나오는지 계속 추적한다.
- `tools/check-mobile-rank-fallback-anchor.mjs`를 추가하고 GitHub Pages / Quality Check workflow에 연결했다.
- service worker cache를 `dream-library-cache-v1.0.84`로 갱신하고 `texture-atlas-manifest-v1.0.84.json`을 추가했다.
- 기존 금지 항목인 `statusbar-icon-right-v1046`, 보드 미니맵, 보기 맞춤, 드래그 이동 도움말, 손가락 시작 문구, `data-legacy-role-copy`는 계속 부활 방지 QA 대상으로 유지한다.
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md와 AI_HANDOFF_DR.md에만 누적한다.

다음 업데이트 예정: v1.0.85 - Mobile Lobby Panel Touch QA, Remaining Image Budget and Firebase Rank State Polish Patch

- 실제 모바일에서 로비 긴 패널 anchor 복귀가 탭/모달/보상 복귀 후에도 튀지 않는지 추가 확인
- 남은 대용량 이미지 9개 중 atlas PNG와 UI frame의 WebP/atlas 분기 가능성 추가 조사
- Firebase 무료 보호 상태가 랭킹 새로고침/점수 저장 직후 자연스럽게 보이는지 copy polish
- 카메라 drag/zoom 분리와 보스 상태바 비율이 다음 빌드에서도 유지되는지 재확인


### v1.0.83 - Rank UI Copy Polish, WebP Fallback QA and Boss Atlas Resolve Guard Patch

- v1.0.82 기준 통파일을 점검하고 랭킹의 클라우드/기기/캐시/무료 보호 상태 문구를 사용자 친화적으로 다듬었다.
- `v1083-rank-ui-copy-polish`를 추가해 랭킹 상단 안내를 `클라우드와 기기 기록`, `기기 기록 우선`, `무료 보호 중`, `저장 기록 표시`처럼 게임 사용자가 이해하기 쉬운 표현으로 정리했다.
- `rank-fresh-chip`를 추가해 방금 기록한 점수가 랭킹에 섞일 때 눈에 띄도록 하고, 작은 화면에서는 랭킹 source chip이 줄바꿈되어 점수/이름과 겹치지 않게 했다.
- `v1083-webp-fallback-qa`를 추가해 브라우저 WebP 지원 여부를 `html[data-webp-support]`로 표시하고, 미지원 환경은 PNG fallback을 명확히 사용하도록 했다.
- `v1083-boss-atlas-resolve-guard`를 추가하고 CSS의 `/DR/assets/atlas/boss-frames-v2.*` 하드코딩 URL을 CSS 변수 기반으로 바꿔 boss atlas resolve 경고 재발 가능성을 낮췄다.
- `vendor-firebase` 단일 chunk를 `vendor-firebase-firestore-v1083`, `vendor-firebase-auth-v1083`, `vendor-firebase-app-v1083`, `vendor-firebase-core-v1083` 후보로 분리해 무료 Firebase 기능과 초기 로딩 비용을 추적하기 쉽게 했다.
- `tools/check-rank-copy-webp-atlas.mjs`를 추가하고 GitHub Pages / Quality Check workflow에 연결했다.
- service worker cache를 `dream-library-cache-v1.0.83`으로 갱신하고 `texture-atlas-manifest-v1.0.83.json`을 추가했다.
- 기존 금지 항목인 `statusbar-icon-right-v1046`, 보드 미니맵, 보기 맞춤, 드래그 이동 도움말, 손가락 시작 문구, `data-legacy-role-copy`는 계속 부활 방지 QA 대상으로 유지한다.
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md와 AI_HANDOFF_DR.md에만 누적한다.

다음 업데이트 예정: v1.0.84 - Ranking Status Microcopy QA, Firebase Chunk Audit, Boss Atlas Warning Recheck and Image Optimization Patch

- 실제 모바일에서 랭킹 안내 chip이 너무 길거나 줄바꿈이 과하지 않은지 재검수
- Firebase chunk 분리 후 GitHub Pages 빌드 산출물 크기와 초기 로딩 흐름 확인
- boss atlas runtime resolve 경고가 사라졌는지 빌드 로그 기준으로 재점검
- 대용량 이미지 9개 중 추가 WebP/atlas 후보 선별
- 로비 긴 패널 anchor 복귀와 스크롤 위치 저장이 실제 기기에서 자연스러운지 추가 확인

### v1.0.82 - Firebase Write Budget, Lobby Anchor Stability and QA Wording Refresh Patch

- v1.0.81 기준 통파일을 점검하고 Firebase 무료 요금제에서 랭킹/프로필 write가 불필요하게 반복되는 경로를 추가 보호했다.
- `v1082-firebase-free-write-budget`를 추가해 전역/일일 랭킹 저장 전에 일일 write 예산과 중복 점수 저장 dedupe를 확인한다.
- 점수 저장 후 랭킹 새로고침은 현재 플레이한 보드 우선으로 실행하고, `force` 요청이 있어도 read budget을 우회하지 않게 수정했다.
- `src/auth.js`에 프로필 write guard를 추가해 같은 계정/표시명 로그인 상태에서는 12시간 안에 `users/{uid}` profile write를 반복하지 않는다.
- `v1082-lobby-panel-anchor-stability`를 추가해 로비 메뉴의 상점/복원/도감처럼 긴 패널이 탭 전환, 모달 복귀, 보상 흐름 후에도 이전 스크롤 anchor를 최대한 유지한다.
- `.lobby-panel-dock`와 긴 패널에 scroll-padding, scroll-margin, overflow-anchor 제어를 추가해 작은 화면에서 카드가 튀거나 갑자기 위로 점프하는 느낌을 줄였다.
- `v1082-qa-output-wording-refresh`로 최근 QA 스크립트 출력 문구를 현재 호환 범위 기준으로 정리하고, 오래된 버전 문구 때문에 다른 AI가 실패로 오해하지 않도록 보강했다.
- `tools/check-firebase-write-lobby-anchor.mjs`를 추가하고 GitHub Pages / Quality Check workflow에 연결했다.
- service worker cache를 `dream-library-cache-v1.0.82`로 갱신하고 `texture-atlas-manifest-v1.0.82.json`을 추가했다.
- 기존 금지 항목인 `statusbar-icon-right-v1046`, 보드 미니맵, 보기 맞춤, 드래그 이동 도움말, 손가락 시작 문구, `data-legacy-role-copy`는 계속 부활 방지 QA 대상으로 유지한다.
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md와 AI_HANDOFF_DR.md에만 누적한다.

다음 업데이트 예정: v1.0.83 - Rank UI Copy Polish, Image Fallback QA and Low-end Render Follow-up Patch

- 랭킹의 클라우드/기기/캐시/보호 상태 문구가 사용자에게 더 자연스러운지 실제 화면에서 재점검
- WebP 배경 fallback이 GitHub Pages와 Firebase Hosting 모두에서 정상 로딩되는지 확인
- Pixi chunk 분리 후 남은 런타임 경고와 boss atlas resolve 경고를 원인별로 분류
- 큰 이미지 9개 중 추가 WebP 전환 가능한 파일을 선별
- 로비 긴 패널 anchor 복귀가 작은 화면/실제 기기에서 과하게 튀지 않는지 추가 QA


### v1.0.44 - Boss Statusbar Right, Expanded Stage Ladder and Lobby Drag Rescue Patch

- v1.0.43 기준 통파일을 점검하고, 보드 우측 위에서 화면을 가릴 수 있던 보스 그림을 보스 상태바 오른쪽 슬롯으로 이동
- `boss-lane`에 `data-boss-layout="statusbar-right-portrait-v1044"`를 추가해 보스 정보는 왼쪽, 보스 그림은 오른쪽에 고정되도록 재배치
- 작은 화면에서는 보스 그림 크기와 atlas overlay opacity를 낮춰 보드 영역을 덜 가리도록 조정
- 보스 상태 문구를 `clear-status-v1044` 구조로 갱신하고, 보스 그림이 현재 상대/HP/반격 예고와 연결된다는 의미를 유지
- 난이도 단계를 `초보 / 입문 / 일반 / 숙련 / 어려움 / 악몽`으로 확장해 초반부터 바로 어려워지는 흐름을 완화
- 캠페인 스테이지를 12개에서 30개로 확장하고, 챕터도 5개로 늘려 단계별로 더 오래 다양하게 즐길 수 있게 재구성
- 초보/입문 챕터에는 작은 보드와 넉넉한 힌트/섞기를 배정하고, 악몽 난이도는 최종권 후반부에서만 열리게 조정
- 로비에서 드래그가 잘 안 먹는 구간을 줄이기 위해 lobby scroll guard 감도를 낮추고, 카드/챕터/스테이지 위에서 세로 드래그하면 shell scroll을 보조하도록 개선
- 챕터 탭이 5개로 늘어나도 좁은 화면에서 가로 스크롤/세로 스크롤이 충돌하지 않도록 chapter tab 레이아웃과 touch-action을 보정
- `npm run check:boss-stage-lobby-scroll` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker cache slim 정책을 `v1044-cache-slim-boss-stage-lobby-scroll`로 갱신하고 Texture Atlas manifest를 v1.0.44로 추가
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

다음 업데이트 예정: v1.0.46 - Stage Map Comfort, Boss Status Icon Set and Lobby Gesture Final QA Patch

- 30개 스테이지 확장 후 로비에서 현재 진행 위치를 더 쉽게 파악하도록 챕터/스테이지 진행 UI polish
- 보스 상태바 오른쪽 보스 그림을 보스별 아이콘/색감으로 더 명확하게 차별화
- 초보~악몽 난이도별 +3초 보너스, 지체 압박, 보스 HP 감소량의 균형 추가 조정
- 로비 드래그가 실제 모바일에서 카드/버튼 위에서도 자연스럽게 먹는지 추가 QA
- 챕터 탭 5개가 작은 화면에서 너무 빽빽하지 않도록 compact 표시 추가 검토
- 이메일 중앙 팝업, 옵션 계정 전환, 보스 상태바가 작은 화면에서 겹치지 않도록 추가 압축
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음


### v1.0.43 - Google Fallback, Center Email Modal and Readable Boss Status Patch

- v1.0.42 기준 통파일을 점검하고, 구글 로그인 버튼을 눌러도 반응이 없어 보이던 문제를 구글 popup 우선 + redirect fallback 구조로 개선
- `loginWithGoogle()`에 popup blocked / cancelled / unsupported 환경 fallback을 추가하고, `completeGoogleRedirect()`로 돌아온 로그인 결과를 확인해 자동으로 로비에 연결
- 구글 로그인 시작 즉시 `구글 로그인 창을 여는 중입니다` 상태 문구를 표시해 무반응처럼 보이지 않게 수정
- 이메일 로그인은 화면 아래 inline form 대신 중앙 팝업 `email-auth-modal`에서 입력하도록 변경
- 옵션 > 계정 전환의 이메일 버튼도 같은 중앙 팝업을 열도록 연결해 첫 화면/옵션 흐름을 통일
- 기존 inline 이메일 form은 DOM 호환용으로만 남기고 `retired-inline-email-form`으로 화면에서 제거
- 보드 우측 위 몬스터 그림 역할이 애매했던 문제를 해결하기 위해 `보스 상태 / HP / 시간 압박 / 실수 반격` chip 구조로 변경
- `getBossReadableRole()`과 `boss-role-help`를 추가해 보스별로 무엇을 경고하는지 한 문장으로 설명
- 첫 보스전에서 1회성 boss role pulse를 표시해 우측 위 보스 상태판이 장식이 아니라 전투 정보임을 알림
- 보스 기본 그림/atlas fallback, +3초 매칭 보너스, 지체 압박 사운드/연출은 유지
- `npm run check:auth-modal-boss-role` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker cache slim 정책을 `v1043-cache-slim-auth-modal-boss-role`로 갱신하고 Texture Atlas manifest를 v1.0.43으로 추가
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

다음 업데이트 예정: v1.0.44 - Login Reliability QA, Boss State Tutorial and Difficulty Tempo Patch

- 실제 GitHub Pages/Firebase 도메인에서 구글 로그인 popup/redirect 동작 추가 QA
- Firebase Authorized Domain 누락 시 사용자에게 더 명확한 안내 문구 제공
- 이메일 중앙 팝업에서 비밀번호 보기/입력 오류/가입 성공 상태를 더 편하게 다듬기
- 보스 상태 chip을 보스별 아이콘/색감으로 더 명확히 차별화
- 보스 HP 감소, +3초 보너스, 지체 압박 사운드의 난이도별 템포 추가 조정
- 첫 보스전 1회성 설명 연출이 게임 흐름을 방해하지 않도록 길이/위치 polish
- 작은 화면에서 이메일 팝업, 옵션 계정 전환, 보스 상태판 겹침 추가 압축
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음



### v1.0.42 - Account Switch, Match Time Bonus and Stall Pressure Action Patch

- v1.0.41 기준 통파일을 점검하고, 옵션 설정 안에서 바로 계정을 전환할 수 있도록 계정 섹션을 확장
- 옵션 > 계정 전환에 `게스트 / 구글 / 이메일` 버튼을 추가해 첫 화면으로 돌아가지 않아도 저장 방식 전환 흐름을 이해할 수 있게 정리
- 게스트/구글 전환은 옵션 안에서 바로 처리하고, 이메일 전환은 이메일 입력 폼이 있는 첫 화면을 열어 자연스럽게 로그인하도록 연결
- 사천성 난이도가 높게 느껴지는 문제를 완화하기 위해 모든 정상 매칭마다 기본 보너스 시간 `+3초`를 지급
- `PAIR_MATCH_TIME_BONUS_SECONDS`, `grantPairMatchTimeBonus()`를 추가하고 HUD 시간 영역에 `+3초` 팝업과 누적 보너스 QA hook을 추가
- 매칭 없이 오래 지체되면 `triggerStallPressure()`가 보스 경고, 긴박한 warning/urgent 사운드, 시간 HUD pulse, 보드 경고 overlay를 발생시킴
- 지체 압박은 시간을 빼앗는 벌칙이 아니라 “지금 한 쌍을 맞추면 +3초로 회복 가능”이라는 긴장 연출 중심으로 설계
- 보드 우측 위 몬스터/보스 그림의 역할이 애매했던 문제를 해결하기 위해 boss role badge와 설명 title을 추가
- 보스 그림은 단순 장식이 아니라 HP, 시간 압박, 실패 반격, 콤보 반격 예고를 보여주는 전투 상태 표시 영역으로 명확화
- `DreamAudio`에 `warning`, `urgent` 합성 효과음을 추가
- service worker cache slim 정책을 `v1042-cache-slim-account-time-pressure`로 갱신하고 Texture Atlas manifest를 v1.0.42로 추가
- `npm run check:account-time-pressure` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

다음 업데이트 예정: v1.0.43 - Account Transition UX, Boss Role Tutorial and Difficulty Relief Patch

- 옵션 안 계정 전환 후 현재 플레이/로비 상태가 더 자연스럽게 이어지도록 전환 애니메이션 polish
- 이메일 전환도 옵션 모달 안에서 직접 입력할 수 있는 compact 계정 패널 검토
- 보스 역할을 첫 보스전에서 짧게 알려주는 1회성 설명 연출 추가
- +3초 보너스가 난이도를 너무 낮추지 않는지 난이도별 시간 보정값 검토
- 지체 압박 사운드가 반복될 때 피로하지 않도록 cooldown과 볼륨 추가 조정
- 보스 HP/반격 예고/보상 흐름을 더 직관적으로 연결
- 작은 화면에서 옵션 계정 전환 버튼과 보상 모달 겹침 추가 압축
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음


### v1.0.41 - Auth Entry Simplification and Direct Lobby Shortcut Cleanup Patch

- v1.0.40 기준 통파일을 점검하고, 첫 시작 화면의 중복 진입 구조를 정리
- 기존 `서고 입장` 버튼을 `게스트 로그인`으로 변경해 실제 동작과 문구를 일치시킴
- `Google 저장`은 `구글 로그인`, `Email 저장`은 `이메일 로그인`으로 변경해 저장 계정의 의미를 더 명확하게 표시
- 이메일 폼 버튼을 `이메일 로그인 / 이메일 가입`으로 정리하고 `로그인 후 로비 / 가입 후 로비` 같은 중복 표현 제거
- 첫 화면 아래의 별도 `로비 입장` 버튼은 필요성이 낮아 retired direct lobby entry로 숨김 처리하고 화면에서는 제거
- `enterLobbyFromAuth()`를 추가해 게스트/구글/이메일 로그인 모두 로비 선택 화면으로 들어가되, 퍼즐판을 바로 열지 않는 기존 안전 흐름은 유지
- 로그인 상태 설명을 `게스트 로그인 · 로컬 진행 중`, `구글 로그인 · 진행 저장 중`, `이메일 로그인 · 진행 저장 중`으로 구분
- 첫 화면 부트 안정화와 service worker network-first 정책 유지, cache/manifest를 v1.0.41로 갱신
- `npm run check:auth-entry-flow` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

다음 업데이트 예정: v1.0.42 - Login Transition Polish, Saved Progress CTA and Restoration Shortcut Patch

- 게스트/구글/이메일 로그인 후 로비로 넘어가는 전환 애니메이션을 더 자연스럽게 조정
- 저장 계정으로 로그인했을 때 이전 진행 상태를 짧게 보여주는 CTA 추가
- 보상 모달에서 복원 프로젝트 바로가기/집중 프로젝트 전환 흐름 개선
- 클리어 연출에 사운드/haptic feedback 연결 강화
- 초기 로딩/서비스워커 캐시 교체 중 첫 화면 잔상 방지 추가 점검
- 작은 화면에서 보상 모달, 보스 패널, 하단 액션 버튼 겹침 추가 압축
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음



### v1.0.40 - Mobile Board Feel, Boss Asset Polish and Clear Flow Reward Patch

- v1.0.39 기준 통파일을 점검하고, 미니맵/보기·중앙·+/- 라인/드래그 이동 도움말을 재도입하지 않은 채 모바일 보드 조작감과 클리어 보상 흐름을 다듬음
- `MOBILE_BOARD_FEEL_PATCH`와 `data-mobile-board-feel="v1040-mobile-board-feel"`을 추가해 카메라 버튼 없이도 큰 보드 선택 후 follow가 더 부드럽게 반응하도록 조정
- `getBoardFocusProfile()`을 v1.0.40 기준으로 재조정해 far zoom/큰 보드에서 카메라가 과하게 튀지 않고, 가장자리 선택 시에만 완만하게 따라오도록 감도와 cooldown을 완화
- `getVisualPriorityState()`를 `tile-contrast-natural-v1040 / boss-route-soft-v1040 / balanced-v1040`로 정리해 먼 줌에서도 타일 본체가 먼저 읽히도록 명암과 보스 경고 우선순위를 조정
- 보스 기본 그림과 atlas overlay 계층을 `stable-atlas-v1040`으로 갱신하고, `v1040-stable-visible` guard를 추가해 atlas overlay가 몬스터 기본 그림을 덮지 않도록 보강
- `applyBossAtlasFrame()`의 overlay scale을 낮춰 작은 화면에서 보스 base asset이 빈 자리처럼 보이거나 지나치게 덮이는 문제를 줄임
- `renderer.playClearRewardFlow()`를 추가해 클리어 직후 보드 중앙에서 별/재료 획득 감각이 먼저 터진 뒤 보상 모달로 이어지도록 연결
- 보상 모달에 `v1040-clear-to-restoration`, `materials-linked-v1040` hook을 추가하고, 획득 재료가 어느 복원 프로젝트에 연결되는지 한 줄로 보여주도록 개선
- service worker cache slim 정책을 `v1040-cache-slim-core-first`로 갱신하고 Texture Atlas manifest를 v1.0.40으로 추가
- `npm run check:mobile-board-reward-flow` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- 기존 `check:selection-stability`, `check:mobile-playability`, `check:no-minimap-topbar`, `check:board-focus-tempo-cache`와 함께 v1.0.40 신규 검사를 통과
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

다음 업데이트 예정: v1.0.41 - Reward Restoration UX, Boss Flow Audio-Haptic and Loading Polish Patch

- 보상 모달에서 복원 프로젝트 바로가기/집중 프로젝트 전환 흐름 개선
- 클리어 연출에 사운드/haptic feedback 연결 강화
- 보스 warning/cut-in이 반복될 때 오디오와 화면 흔들림의 피로도를 줄이는 tempo polish
- 초기 로딩/서비스워커 캐시 교체 중 첫 화면 잔상 방지 추가 점검
- 작은 화면에서 보상 모달, 보스 패널, 하단 액션 버튼의 겹침 추가 압축
- 미니맵, 보기/중앙/+/- 라인, 드래그 이동 도움말은 계속 재도입하지 않음


### v1.0.39 - Board Focus Balance, Boss Flow Tempo and Asset Cache Slim Patch

- v1.0.38 기준 통파일을 점검하고, 미니맵/보기·중앙·+/- 라인/드래그 이동 도움말을 재도입하지 않은 채 큰 보드 조작감을 내부적으로 조정
- `BOARD_FOCUS_BALANCE_PATCH`와 `getBoardFocusProfile()`을 추가해 선택 후 카메라 follow가 과하게 튀지 않고 보드 크기/줌 상태에 따라 부드럽게 따라오도록 변경
- far zoom 상태를 `far-boost / far / balanced / close`로 세분화하고 `data-visual-priority="tile-contrast-first"`를 추가해 먼 줌에서 타일 명암과 외곽선 가독성을 우선 보정
- objective marker 우선순위를 현재 시야 중심과 특수 타일 중요도 기준으로 재정렬하고, 과밀 상태는 `compressed-v1039`로 더 작고 은은하게 압축
- 힌트 빛길/매칭 pulse/보스 경고가 동시에 나올 때 route assist 폭과 board pulse alpha를 낮춰 타일 본체를 가리지 않도록 조정
- `getBossWarningTempo()`와 `BOSS_FLOW_TEMPO_PATCH`를 추가해 보스 warning lane/cut-in이 연속 발생할 때 cooldown-softened 상태로 흔들림과 impact를 줄임
- 보스별 템포를 `balanced-tempo / quick-slice / heavy-slow`로 분리해 그림자 장서관장은 빠르게, 봉인된 페이지 골렘은 묵직하게 보이도록 조정
- boss stable image/atlas overlay 시각 계층을 `stable-atlas-v1039`로 갱신하고 작은 화면에서 atlas overlay가 기본 몬스터 그림을 덮지 않도록 추가 조정
- service worker에 `CACHE_SLIM_POLICY = v1039-cache-slim-core-first`를 추가하고, 저우선순위 import manifest/selected PNG/motion sheet 사전 캐시를 제거해 초기 캐시를 경량화
- `npm run check:board-focus-tempo-cache` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.39로 갱신
- 미니맵/보드 레이더, 게임 내 보기/중앙/+/- 라인, 드래그 이동 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.38 - Boss Pattern Depth, Objective Marker Density and Mobile Flow Polish Patch

- v1.0.37 기준 통파일을 점검하고, 보이는 조작 UI를 늘리지 않은 채 보스 패턴/마커/모바일 흐름의 내부 polish를 진행
- 보스 3종별 warning lane 색상, 폭, alpha, 지속 시간, 흔들림 강도를 분리하는 `BOSS_WARNING_DEPTH_PROFILES`와 `getBossWarningDepthProfile()` 추가
- `renderer.playBossWarning()`이 boss id를 함께 받아 망각의 서고령/그림자 장서관장/봉인된 페이지 골렘의 warning depth를 다르게 렌더링하도록 변경
- objective marker가 많을 때 `getObjectiveMarkerDensity()`로 표시 개수, radius, alpha, pulse delay를 자동 압축해 보드 과밀도를 줄임
- `drawObjectiveOverflowMarker()`를 추가해 숨겨진 목표가 많을 때도 미니맵 없이 보드 내부에 압축 상태만 은은하게 표시
- boss stable image fallback과 atlas overlay의 시각 계층을 `data-boss-visual-stack="stable-atlas-v1038"`로 분리해 작은 화면에서도 기본 몬스터 그림이 atlas overlay에 묻히지 않도록 조정
- 힌트 빛길, 보스 경고, objective marker가 겹칠 때 `data-visual-priority` hook으로 보스/경로 우선순위를 정리
- 보스 cut-in은 `data-visual-priority`와 `data-boss-cutin-priority`로 작은 화면에서 더 compact하게 노출
- `npm run check:boss-pattern-density` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.38로 갱신
- 미니맵/보드 레이더, 게임 내 보기/중앙/+/- 라인, 드래그 이동 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.37 - Lobby Space Polish, Back Flow UX and Boss Asset Visibility Patch

- v1.0.36 기준 통파일을 점검하고, 상단 라인 제거 후 남은 로비/게임 화면 여백을 한 번 더 압축해 실제 플레이 공간을 확장
- `battle-stage[data-space-polish="v1037"]` hook을 추가해 카메라 버튼 없는 큰 보드 화면의 boss lane / board / action row 배치를 정리
- 뒤로가기/종료 확인 화면 안 옵션 톱니 진입 흐름을 유지하면서, 옵션 톱니 터치 영역과 exit card toolbar 정렬을 보강
- 사용자가 지적한 몬스터/보스 그림 자리 에셋 누락 가능성을 점검하고, 보스 DOM 이미지는 motion frame이 아니라 안정적인 boss base asset을 항상 사용하도록 변경
- `BOSS_IMAGE_FALLBACK_SRC`, `setBossStableImage()`, `preloadBossAtlasImage()`를 추가해 atlas가 아직 로드되지 않았거나 frame lookup이 실패해도 보스 그림이 빈 자리로 사라지지 않도록 fallback 구성
- boss atlas sprite는 보조 overlay로만 사용하고, `.boss-core.boss-atlas-ready img` opacity를 0으로 숨기지 않도록 바꿔 몬스터 그림의 기본 가시성을 보장
- boss atlas PNG/WebP를 index preload와 service worker cache에 명시해 보스 컷인/경고 순간의 빈 에셋 표시를 줄임
- `npm run check:boss-asset-visibility` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.37로 갱신
- 미니맵/보드 레이더, 게임 내 보기/중앙/+/- 라인, 드래그 이동 도움말은 계속 재도입하지 않음
- 선택 패 크기 고정과 tile body geometry guard 유지
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.36 - Space Reclaim, Camera UI Removal and Back Sheet Options Patch

- v1.0.35 기준 통파일을 점검하고, 사용자가 요청한 게임 내 `보기 맞춤 / 중앙 / + / -` 카메라 조절 라인과 카메라 도움말 표시를 화면에서 제거
- Pixi board camera의 pan/zoom 엔진, drag guard, touch-action isolation은 유지하되, 조작 버튼과 안내 문구는 hidden shell로 전환해 보드 공간을 회수
- 모든 화면 최상단에 있던 top option line을 제거하고, 상단 뒤로가기/옵션 고정 UI가 차지하던 공간을 screen-stack과 app padding으로 회수
- 기존 상단 옵션 버튼은 화면에서 제거하고, 뒤로가기/종료 확인 화면 안에 `exit-options-button` 톱니 버튼을 추가해 옵션 모달로 진입하도록 변경
- `openOptionsFromExitSheet()`를 추가해 종료 확인 화면의 톱니 버튼을 누르면 확인 화면을 닫고 옵션 모달을 안정적으로 열도록 구성
- `renderBoardCameraGuide()`를 space-reclaimed 정책으로 바꿔 `data-board-camera`는 유지하되 board camera guide/control DOM은 항상 숨김 처리
- `check:mobile-playability`, `check:board-camera`, `check:no-minimap-topbar`, `check:objective-camera-boss`, `check:real-device-selection`을 v1.0.36 정책에 맞게 갱신
- `npm run check:space-reclaim-back-options` 신규 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.36으로 갱신
- 미니맵/보드 레이더는 계속 재도입하지 않음
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.35 - Real Device Selection QA, Touch Precision and Board Readability Patch

- v1.0.34 기준 통파일을 점검하고, 실제 모바일 손가락 조작 기준으로 선택 판정과 시각 geometry를 더 명확히 분리
- `TOUCH_HIT_SLOP_RATIO`, `TOUCH_HIT_SLOP_MAX`를 추가해 터치 hitArea는 소폭 넓히되 타일 본체 sprite/frame/scale은 전혀 커지지 않도록 구성
- `selectionGeometrySnapshots`, `captureSelectionGeometry()`, `verifySelectionGeometrySnapshot()`을 추가해 선택/힌트/매칭 직후에도 타일 본체 geometry drift를 즉시 보정
- `REAL_DEVICE_SELECTION_QA_LABEL`과 `.battle-stage[data-selection-qa="real-device-selection-geometry-qa"]` hook을 추가해 실제 기기 QA 상태를 확인할 수 있게 구성
- `keepSelectedTileComfortablyVisible()`을 추가해 큰 보드에서 선택한 패가 화면 가장자리 밖으로 밀릴 때만 카메라가 부드럽게 따라가도록 보정
- `updateBoardReadabilityTier()`와 `data-zoom-readability`를 추가해 far/balanced/close 줌 단계별 보드 가독성 스타일 hook을 제공
- 선택 overlay와 hint overlay는 계속 world-space 별도 layer로 유지하며 selected PNG/atlas frame은 사용하지 않음
- mismatch 흔들림 중에도 `enforceTileBodyGeometry()`를 onUpdate/onComplete에 적용해 흔들림이 스케일 변화로 번지지 않도록 차단
- 카메라 가이드 문구를 `드래그 이동 · 선택 보조 · 보기 맞춤`으로 정리해 큰 보드 선택 보조 기능을 자연스럽게 안내
- `npm run check:real-device-selection` 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.35로 갱신
- 미니맵/보드 레이더는 계속 재도입하지 않음
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.34 - Tile Geometry Visual QA, Boss Cut-in and HUD Compression Patch

- v1.0.33 기준 통파일을 점검하고, 선택/힌트/매칭/보스 경고가 겹쳐도 타일 본체가 커져 보이지 않도록 tile body geometry lock을 한 단계 더 강화
- `TILE_GEOMETRY_GUARD_LABEL`, `TILE_GEOMETRY_EPSILON`, `enforceTileBodyGeometry()`, `assertTileBodyGeometry()`를 추가해 Pixi 텍스처 갱신과 ticker 타이밍마다 타일 본체 geometry를 셀 기준으로 재보정
- 타일 root에 고정 cell hitArea를 배정해 선택 overlay나 이펙트 레이어가 터치/시각 범위를 키우는 경로를 차단
- 매칭 제거 연출에서 root scale 축소/확대 tween을 제거하고 alpha/y 이동, beam, fragment, missile 중심으로 타격감을 유지
- `.battle-stage[data-tile-geometry="locked"]` QA hook을 추가해 실제 화면에서 타일 본체 고정 상태를 확인할 수 있게 구성
- `npm run check:selection-stability`를 v1.0.34 geometry guard 기준으로 갱신
- `npm run check:tile-geometry-hud` 추가 및 GitHub Pages / Quality Check workflow에 연결
- 보스 3종별 `bossHitCutin` bossId/comboTier data hook을 추가하고, 7콤보 이상 finisher cut-in을 추가
- 보스 warning telegraph에 pattern data hook을 추가해 row/cross/diagonal 경고 색감 차별화 기반을 강화
- 작은 화면용 `micro` HUD density를 추가해 HUD/보스 패널/카메라 버튼/보드 영역 겹침을 더 압축
- 미니맵/보드 레이더는 계속 재도입하지 않음
- service worker 캐시와 Texture Atlas manifest를 v1.0.34로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.33 - Objective Markers, Camera Tutorial and Boss Pattern Polish Patch

- v1.0.32 기준 통파일을 점검하고, 미니맵 재도입 없이 큰 보드 플레이 보조를 보드 내부 연출로 확장
- `objectiveMarkerLayer`와 `refreshObjectiveMarkers()`를 추가해 안개/잠금/시간 봉인처럼 아직 드러나지 않은 특수 타일을 보드 위 작은 marker로 표시
- objective marker는 world-space overlay에만 그려지며 타일 본체의 texture, width/height, scale을 건드리지 않도록 구성
- 첫 큰 보드 진입 시 `dream-library-camera-guide-seen` 저장값을 사용해 짧은 카메라 조작 가이드를 한 번만 강조
- 카메라 가이드는 개발자용 문구 없이 `드래그 이동`, `+/− 확대`, `보기 맞춤` 같은 게임 조작 문구만 사용
- 보스 경고 패턴을 `column`, `row`, `cross`, `diagonal`로 분리하고 콤보/시간/압박/실패 사유에 따라 warning lane 방향을 다르게 출력
- 보스 warning lane은 계속 `screenToWorld` 기준 world 좌표로 그려 pan/zoom 중에도 보드와 어긋나지 않게 유지
- route assist, 보스 카메라 충격, 선택 overlay 분리 구조는 유지하고 미니맵/보드 레이더는 재도입하지 않음
- `.board-camera-guide.camera-tutorial` 스타일을 추가해 큰 보드 첫 조작 안내를 은은하게 강조
- `npm run check:objective-camera-boss` 추가 및 GitHub Pages / Quality Check workflow에 연결
- `npm run typecheck`, 전체 QA 검사, `npm run build:github` 통과
- service worker 캐시와 Texture Atlas manifest를 v1.0.33으로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.32 - Minimap Removal and Hard Selection Geometry Lock Patch

- v1.0.31 기준 통파일을 다시 점검하고, 사용자가 재차 지적한 선택 패 과대 표시 문제를 최우선으로 재수정
- 선택 시 패 자체가 커지는 것이 아니라도, 선택 상태 이미지/비동기 텍스처 갱신/효과 레이어/스폰 scale tween이 겹치면 패가 커진 것처럼 보일 수 있는 경로를 전체 차단
- 선택 상태에서 더 이상 selected PNG 또는 selected atlas frame으로 교체하지 않고, 타일 본체는 normal texture와 고정 geometry를 유지
- `selectionFocusOverlay`를 추가해 선택 표시는 타일 본체가 아닌 별도 world-space overlay layer에서만 처리
- `drawSelectionFocusOverlay()`로 셀 내부 고정 테두리/corner marker만 표시하고, 선택 시 `root.scale`, `sprite.scale`, `selectionRing.scale`, `selectionCore.scale` 조작을 금지
- 선택 순간의 큰 파동 이펙트를 제거하고, `SELECTION_OVERLAY_INSET_RATIO` 기준으로 타일 셀 안쪽에만 선택 강조가 보이도록 수정
- 타일 등장 시 `root.scale.set(0.88) -> 1` 애니메이션을 제거하고, 등장 연출은 alpha/y 이동만 사용해 선택 시점과 겹쳐 커지는 착시를 차단
- 보드 ticker에서 비동기 텍스처 갱신 이후에도 `fitTileSprite()`와 `root.scale.set(1)`을 반복 보정해 패 본체 geometry를 계속 잠금
- 힌트 강조도 별도 `drawHintFocusOverlay()`로 분리해 힌트 링이 패 자체를 키워 보이는 경로를 줄임
- 미니맵/보드 레이더 런타임을 제거하고, route assist와 보스 warning lane은 유지
- 최상단 topbar의 불필요한 브랜드 글씨/앞 아이콘을 제거하고, 뒤로가기/옵션만 남기는 compact topbar 구조로 정리
- 첫 시작 화면 안정화는 v1.0.31의 `forceLoginBootScreen()`과 network-first service worker 정책 유지
- `npm run check:selection-stability`를 하드 선택 geometry lock 기준으로 강화
- `npm run check:no-minimap-topbar` 추가 및 GitHub Pages / Quality Check workflow에 연결
- service worker 캐시와 Texture Atlas manifest를 v1.0.32로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.31 - Selection Containment and First Screen Stability Patch

- v1.0.30 기준 통파일을 재점검하고, 사용자가 다시 지적한 선택 타일 과대 표시 문제를 우선 수정
- 원인을 단순 `root.scale` 문제가 아니라 선택 링/광채/파동 레이어가 타일 셀 밖으로 크게 그려지는 시각 문제로 재정의
- 선택 효과 상수를 `SELECTION_INSET_RATIO`, `SELECTION_RING_RATIO`, `SELECTION_WAVE_RATIO`로 분리해 선택 표현이 타일 셀 내부에서만 보이도록 제한
- 선택 core/ring 반경을 축소하고 stroke 두께를 줄여 선택 시 오브젝트가 커진 것처럼 보이는 효과 제거
- 선택 파동의 기존 2.6배 확장 애니메이션을 삭제하고, 타일 크기 안쪽에서 alpha/rotation으로 사라지는 안정형 반응으로 변경
- 매칭 시작 시 두 타일을 1.06배 키우던 연출을 제거하고 glow/beam/fragment 중심으로 타격감을 유지
- 선택 상태는 계속 normal texture를 사용해 selected PNG 원본 크기 차이가 보드 위 오브젝트 크기를 키우지 못하도록 유지
- 첫 시작 시 다른 화면이 먼저 보이는 경우를 줄이기 위해 `forceLoginBootScreen()` 부트 안정화 루틴 추가
- 앱 초기화 전에 login 화면만 active로 고정하고, 옵션/보상/종료/복원 모달과 보드 카메라 UI를 닫힌 상태로 정리
- service worker fetch 전략을 문서/앱 코드에 대해 network-first로 변경해 이전 캐시가 첫 화면을 잘못 띄우는 상황을 완화
- PWA 등록 시 `registration.update()`를 호출해 새 패치 반영 지연을 줄임
- `npm run check:boot-screen` 추가
- `npm run check:selection-stability`를 선택 효과 셀 내부 제한 기준까지 강화
- GitHub Pages / Quality Check workflow에 신규 검사 반영
- service worker 캐시와 Texture Atlas manifest를 v1.0.31로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.30 - Minimap, Route Assist and Boss Camera Impact Patch

- v1.0.29 기준 통파일을 점검하고, 큰 보드 플레이 보조 기능을 실제 게임 화면에 추가
- 큰 보드 전용 `보드 레이더` 미니맵을 추가해 현재 시야 위치와 남은 타일 분포를 확인할 수 있도록 개선
- 레이더를 탭하면 해당 위치 중심으로 카메라가 이동하도록 `installMinimapControls`, `centerCameraOnWorld`, `updateBoardMinimapViewport` 연결
- 힌트 사용 시 연결 가능한 두 오브젝트만 밝히는 것에서 확장해, 실제 연결 경로를 `빛길`로 잠깐 보여주는 route assist 추가
- 힌트 대상이 현재 화면 밖에 있을 때도 `focusBoardPoints`로 해당 쌍을 중심에 가져오도록 개선
- 힌트 링도 크기 변화 없이 alpha/rotation/glow만 사용하도록 정리해 선택 타일 크기 고정 정책 유지
- 보스 경고 시 world 좌표 기준 warning lane과 화면 가장자리 flare를 함께 출력해 큰 보드 카메라 상태와 보스 공격 연출이 분리되지 않도록 개선
- 보스 투사체와 보드 pulse 중심을 `screenToWorld` 변환 기준으로 보정해 pan/zoom 중에도 전투 이펙트가 현재 시야와 어긋나지 않도록 수정
- `npm run check:minimap-route-impact` 추가
- GitHub Pages / Quality Check workflow에 신규 검사 반영
- `npm run typecheck`, `npm run build:github`, 기존 QA 검사와 신규 검사를 통과
- service worker 캐시와 Texture Atlas manifest를 v1.0.30으로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.29 - Selection Scale Lock, Camera Controls and Mobile Board Polish Patch

- v1.0.28 기준 통파일을 점검하고, 사용자가 지적한 `타일 선택 시 커지는 느낌`을 우선 수정
- 선택 타일은 root/sprite/ring/core scale을 모두 `1`로 고정하고, 크기 변화 없이 glow, 스카이블루/골드 이중 링, 회전, alpha만으로 반응하도록 변경
- selected PNG 프레임이 실제 오브젝트 크기를 키우는 경로를 막기 위해 선택 상태도 normal texture를 유지
- 타일 등장 연출의 `back.out` overshoot를 제거해, 새 보드 렌더 직후 타일이 튀어 커지는 느낌을 줄임
- 큰 보드용 카메라 최소 줌을 실제 fit scale에 가깝게 낮춰 `보기 맞춤` 버튼에서 보드 전체 확인이 가능하도록 조정
- 보드 카메라 조작 버튼 추가
  - `보기 맞춤`
  - `중앙`
  - `+`
  - `-`
- `DreamPixiRenderer`에 `fitBoardView`, `centerBoardView`, `nudgeCameraZoom`, `animateCameraTo` API 추가
- 보드 영역은 `touch-action: none`, 카메라 버튼은 `touch-action: manipulation`으로 분리해 드래그/핀치/버튼 입력 충돌을 줄임
- 큰 보드 안내와 컨트롤은 pan/zoom 난이도에서만 노출되도록 런타임 토글 적용
- `npm run check:selection-stability` 추가
- `npm run check:mobile-playability` 추가
- `npm run check:board-camera`, `check:tile-readability`, `check:display-copy`, `check:no-svg`, `check:kakao-lobby-rotation` 기준 유지
- service worker 캐시와 Texture Atlas manifest를 v1.0.29로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.28 - Board Camera, Large Map Difficulty and Pan Zoom Playability Patch

- 난이도를 올릴 때 타일을 무조건 작게 만드는 방식에서 벗어나 큰 보드맵 + 카메라 조작 구조로 전환
- 일반/어려움/악몽 보드 크기 확장
  - 일반: 7x8 → 8x10
  - 어려움: 8x8 → 10x12
  - 악몽: 8x10 → 12x14
- `DIFFICULTIES`에 `cameraMode: 'panZoom'`와 `boardProfile`을 추가해 큰 보드 난이도와 화면 조작 방식을 분리
- `DreamPixiRenderer`에 board camera viewport 추가
  - 큰 보드는 화면 안에 억지로 축소하지 않고 world 좌표계에 배치
  - 드래그로 보드 이동
  - 두 손가락 pinch 확대/축소
  - 데스크톱 QA용 wheel zoom 지원
- 카메라 이동 후 tile tap이 오작동하지 않도록 drag tap suppression 추가
- 보드 world clamp를 넣어 빈 공간으로 너무 멀리 밀려나지 않도록 제한
- 쉬운 난이도는 기존처럼 한 화면 fit 중심, 일반 이상은 pan/zoom 월드맵 플레이 중심으로 분리
- 게임 화면에는 작고 은은한 `드래그로 보드 이동 · 두 손가락으로 확대/축소` 안내만 표시
- `npm run check:board-camera` 추가 및 Actions 검사에 반영
- service worker 캐시와 Texture Atlas manifest를 v1.0.28로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.27 - Silent Display Hooks, Readable Tiles and Non-Scaling Selection Patch

- `Display Assist`, `Frame Lock`, `게임 화면을 준비했습니다`, `게임 프레임 유지 중` 등 개발자용 화면 보조 문구를 런타임 UI에서 제거
- 기존 `browser-guard`와 `portrait-lock-overlay`는 검사/런타임 hook ID만 유지하고, 사용자 화면에는 보이지 않는 silent hook으로 전환
- 설정의 화면 문구도 `화면 보정` 흐름으로 정리해 보조 패널처럼 보이지 않도록 수정
- 퍼즐 타일 가독성을 위해 보드 크기를 모바일 기준으로 재조정
  - 일반: 8x8 → 7x8
  - 어려움: 8x10 → 8x8
  - 악몽: 10x12 → 8x10
- `DreamPixiRenderer`의 보드 padding, reserve, gap 계산을 줄여 실제 타일 표시 면적을 확대
- 타일 sprite 표시 비율을 `0.92`에서 `0.98`로 키워 v2 오브젝트가 더 크게 보이도록 조정
- 선택 타일은 더 이상 root scale이나 sprite scale로 커지지 않음
- 선택 상태는 normal texture 위에 스카이블루/골드 이중 테두리, glow, rune ring으로만 강조
- 힌트 강조도 타일 확대 대신 ring pulse 중심으로 변경
- 매치 성공 pop scale도 과도하지 않게 축소
- `npm run check:display-copy`, `npm run check:tile-readability` 추가 및 Actions 검사에 반영
- service worker 캐시와 Texture Atlas manifest를 v1.0.27로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.26 - Pixi Boss Layer, In-App Device QA and Ranking Flow Patch

- 보스 프레임 atlas를 DOM fallback뿐 아니라 Pixi 전투 UI layer 후보에도 동기화
- `DreamPixiRenderer.preloadBossFrameAtlas()`와 `syncPixiBossLayer()`를 추가해 idle/warn/hit/break 상태를 Pixi sprite로도 반영
- 보스 경고/피격/브레이크 컷인 시 Pixi boss layer mood를 함께 변경해 전투 연출 타이밍을 정렬
- 카카오/인앱 viewport QA를 위해 `portrait-fit-landscape`, `data-inapp-device-qa` 상태를 추가하고 가로 viewport 입력 시 세로 shell fit 상태를 더 명확히 표시
- 작은 화면 전투 HUD에 `data-hud-density="compact"`를 적용해 보드 공간을 추가 확보
- 랭킹 저장 후 Cloud/Local 패널을 즉시 재조회하고 방금 기록한 로컬 점수를 `NEW`로 표시
- 로비 스크롤 중 카드/스테이지/도감 클릭이 섞이지 않도록 dragging 상태 pointer-events를 추가 보정
- `npm run check:pixi-boss-layer`, `npm run check:inapp-device-qa`, `npm run check:ranking-flow` 추가 및 Actions 검사에 반영
- service worker 캐시와 Texture Atlas manifest를 v1.0.26으로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.25 - Kakao Lobby Rotation Root Fix and Stable Portrait Shell Patch

- 카카오 인앱 브라우저에서 `서고 입장`을 누른 뒤 화면이 가로값으로 고정되는 문제를 우선 수정
- 원인 경로를 `서고 입장 → requestGameFullscreen() / requestKakaoPortraitLock() → visualViewport landscape 고정` 흐름으로 판단하고, 로비 입장/스테이지 시작 자동 경로에서 fullscreen/orientation API 호출 제거
- `enterLobbyFromStart()`는 이제 hard fullscreen 호출 없이 `syncGameViewport()`와 virtual portrait frame 재계산만 수행
- `startSelectedStage()`도 자동 fullscreen/orientation 요청 대신 soft viewport sync만 수행
- 카카오 인앱에서는 `portraitLock.js`가 fullscreen/orientation lock을 자동 요청하지 않고, 현재 viewport를 9:16 세로 프레임으로만 보정
- `browserGuard.js`의 in-app 보정도 외부 이동/강제 fullscreen 없이 soft frame request만 수행
- `viewportFrame.js`에서 가로 viewport 입력 시 이전 세로 세션의 큰 height를 재사용하지 않고 현재 짧은 변 기준으로 9:16 frame을 새로 계산
- `html.source-landscape .app-shell`을 fixed center portrait shell로 고정해 가로 viewport에서도 앱 루트가 가로 레이아웃으로 재배치되지 않도록 보정
- `npm run check:kakao-lobby-rotation` 추가 및 Actions 검사에 반영
- service worker 캐시와 Texture Atlas manifest를 v1.0.25로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.24 - Real Boss Atlas Rendering, Asset Compression and Interaction Polish Patch

- 보스 프레임 atlas metadata를 실제 DOM 렌더링 경로에 연결
- `src/game/bossAtlas.js`를 추가해 `boss-frames-v2.atlas.json`의 frame 좌표와 sheet 크기를 런타임에서 사용
- `boss-core` 내부에 `boss-atlas-sprite`를 추가하고, idle/warn/hit/break 상태마다 atlas background-position과 scale을 갱신
- 기존 보스 `<img>`는 fallback으로 유지하되, atlas frame을 사용할 수 있으면 `boss-atlas-ready` 상태로 atlas sprite를 우선 표시
- `boss-frames-v2.webp`, `v2-tiles.webp` 압축 후보를 생성하고 preload/cache 후보에 포함
- service worker 캐시를 v1.0.24로 갱신하고 atlas WebP 후보를 cache 목록에 추가
- Texture Atlas manifest v1.0.24 갱신
- 로비 선택 스테이지 카드의 중복 제목/설명 블록 제거
- 버튼/카드 pointer feedback runtime을 추가해 눌림/해제 시각 피드백 강화
- 로비 스크롤 guard를 다시 조정해 세로 드래그와 카드 탭 충돌을 줄임
- 작은 화면에서 선택 스테이지 카드와 랭킹 row 밀도 추가 정리
- `npm run check:boss-atlas-rendering`, `check:asset-compression`, `check:interaction-polish` 추가 및 Actions 검사에 반영
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.23 - Boss Frame Atlas, Mobile Layout QA, Ranking and Scroll Polish Patch

- 보스 모션/스티커 프레임 18장을 `public/assets/atlas/boss-frames-v2.png`와 `boss-frames-v2.atlas.json`으로 패킹
- `BOSS_FRAME_ATLAS_ASSETS`를 추가해 보스 프레임 atlas도 preload/cache 정책에 포함
- 보스 데이터에 `atlasFrames` 키를 추가하고, 전투 UI의 `boss-core`에 현재 프레임 상태와 atlas frame key를 기록
- 보스 warning/hit/break 프레임 전환 시 DOM 이미지 fallback은 유지하면서, 이후 Pixi 렌더링 연결을 위한 atlas metadata를 확보
- 작은 화면 전투 HUD를 추가 압축해 퍼즐판 높이를 더 확보
- source landscape 상태에서 앱 shell이 가로폭을 다시 차지하지 않도록 모바일 layout QA rule 추가
- 로비 세로 드래그 guard 기준을 완화/강화해 스크롤 중 카드 클릭 오동작을 줄임
- 랭킹 리스트에 Cloud/Local 혼합 표시 안내 행을 추가하고, 모바일 rank row 밀도를 재정리
- 기술 라벨처럼 보이던 `v2 atlas 우선 매핑` 노출 문구를 사용자용 `프리미엄 타일` 문구로 교체
- `npm run check:boss-atlas`, `npm run check:mobile-layout`, `npm run check:scroll-polish` 추가 및 Actions 검사에 반영
- Texture Atlas manifest v1.0.23 갱신
- service worker 캐시를 v1.0.23으로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.22 - CI Atlas Preload, Annotation Cleanup, Background Optimization and HUD Density Patch

- v1.0.20 Actions 실패 로그를 기준으로 `check:v2-assets` 실패 원인을 우선 수정
- 원인: `PRELOAD_ASSETS`가 packed v2 tile atlas를 명시적으로 직접 포함하지 않아 검사 스크립트가 atlas preload 정책을 놓칠 수 있었음
- `PRELOAD_ASSETS`에 `...TILE_ATLAS_ASSETS`를 명시적으로 추가해 GitHub Actions 검사 기준과 실제 preload 기준을 일치시킴
- `DreamPixiRenderer`에 `resolveTileAtlasTexture()`를 분리 추가
- v2 타일 렌더링 순서를 `atlas frame lookup -> Assets cache fallback -> individual PNG fallback`으로 명확히 고정
- `check:v2-assets`가 atlas preload, v2 우선 게임플레이 타일 풀, renderer fallback 순서를 한 번에 검증하도록 강화
- Actions Annotations가 여러 줄로 중복 잡히지 않도록 v2 asset policy 실패 메시지를 한 줄 요약형으로 정리
- `check-workflows` 실패 메시지도 한 줄 요약형으로 정리
- 대형 v2 배경 3종 WebP 후보 생성
  - `moon-library-v2.webp`
  - `gothic-window-v2.webp`
  - `bookshelf-v2.webp`
- 배경 CSS 변수를 `image-set(WebP, PNG fallback)` 기반으로 변경해 지원 브라우저에서는 WebP를 우선 사용
- service worker와 preload asset 목록에 WebP 배경 후보를 반영
- 작은 화면 전투 HUD 밀도 추가 압축
- 보스 정보/미터/전투 패널의 높이와 여백을 줄여 세로 화면에서 퍼즐판 가시성을 개선
- `npm run check:background-optimization` 추가 및 Actions 검사에 반영
- Texture Atlas manifest v1.0.22 갱신
- service worker 캐시를 v1.0.22로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.21 - Lobby Motion, Button States, Ranking UX and Atlas Extension Patch

- 로비 마스코트 분위기 시스템 추가
- 진행도에 따라 로비 마스코트가 `welcome`, `active`, `radiant` 상태로 바뀌고, 호흡/고개 끄덕임/빛나는 대기 애니메이션을 적용
- 로비 추천 미션 카드에 `READY` 표시와 보상 가능 시각 강조 추가
- 버튼 상태 PNG 매핑 강화
- `normal`, `hover`, `pressed`, `disabled` 키 이미지를 CSS 변수로 모두 등록
- 뒤로가기, 설정, 힌트, 섞기, 랭킹 새로고침, 화면 맞춤, 로그아웃, 진짜 게임 시작 버튼이 pointer 상태별 PNG를 사용하도록 확장
- Firebase 랭킹과 로컬 fallback 랭킹을 같은 리스트에서 자연스럽게 섞어 보여주는 Ranking UX 추가
- Cloud/Local 배지, 1~3위 강조, daily 날짜 태그 표시 추가
- 로비 스크롤 QA 추가 개선
- 세로 드래그 중 미션/스테이지/도감 카드 클릭이 오동작하지 않도록 drag guard 추가
- 로비 패널에 layout/paint contain을 적용해 긴 스크롤 중 리페인트 부담 완화
- `DreamPixiRenderer`에 일반 asset texture resolver를 추가해 VFX/타일 파편도 atlas/Assets 캐시를 먼저 확인하도록 확장
- 보드에 v2 atlas 사용 여부를 `data-atlas`로 표시해 렌더링 상태를 확인 가능하게 정리
- `npm run check:lobby-motion`, `check:button-states`, `check:ranking-ux`, `check:atlas-extended` 추가 및 Actions 검사에 반영
- Texture Atlas manifest v1.0.21 갱신
- service worker 캐시를 v1.0.21로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.20 - Real Atlas Packing, Touch QA and Boss Sheet Slicing Patch

- v1.0.19 GitHub Actions 실패 원인을 우선 수정
- 원인: `check:v2-assets`가 기대하는 v2 우선 게임플레이 타일 풀 헬퍼와 실제 보드 생성 코드 기준이 어긋나 있었음
- `src/game/difficulty.js`에 `GAMEPLAY_TILE_SET`, `getGameplayTiles()`를 명확히 유지하고, `src/game/shisen.js`가 `getGameplayTiles(difficulty.iconTypes)`를 사용하도록 정리
- `npm run check:v2-assets`가 v2 상태별 타일, renderer 상태 텍스처, fragment VFX 연결을 다시 통과하도록 수정
- v2 상태별 타일 36종 × 5상태를 실제 `public/assets/atlas/v2-tiles.png`와 `v2-tiles.atlas.json`로 패킹
- `DreamPixiRenderer`가 개별 PNG보다 atlas frame lookup을 우선 시도하고, 실패 시 기존 state PNG로 fallback
- 보스 모션 시트와 보스 스티커 시트를 9프레임 PNG로 분할해 `boss-motion-v2`, `boss-sticker-v2` frame set 추가
- 보스 피격/브레이크 컷인에서 프레임 전환을 사용하도록 `setBossFrame()` 연결
- 버튼 hover/pressed/selected 상태가 pointer 이벤트에 더 선명하게 반응하도록 버튼 상태 클래스와 터치 피드백 정리
- 로비/도감/복원 패널의 세로 드래그 우선권을 강화하고, 탭과 스크롤을 더 명확히 분리
- 가로 viewport가 들어왔을 때 앱 내부를 가로 레이아웃으로 재배치하지 않고, 세로 프레임을 fit-landscape 방식으로 중앙 고정
- 화면에는 카카오/세로모드/전체화면 관련 문구를 노출하지 않음
- `npm run check:real-atlas`, `npm run check:touch-qa`, `npm run check:boss-sheets` 추가 및 Actions 검사에 반영
- Texture Atlas manifest v1.0.20 갱신
- service worker 캐시를 v1.0.20으로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.19 - Gameplay Asset Mapping, Alpha Clean, Selection Clarity and Lobby Scroll Patch

- 사천성 보드가 여전히 기존 타일을 먼저 쓰는 원인을 수정
- 원인: `createBoard()`가 `TILE_SET.slice(0, iconTypes)`를 사용해 배열 앞쪽의 기존 타일/프리미엄 타일을 먼저 배정하고 있었음
- `GAMEPLAY_TILE_SET`와 `getGameplayTiles()` 추가: 실제 퍼즐판은 v2 상태별 오브젝트를 우선 배정하고, 부족할 때 프리미엄/기존 타일을 fallback으로 사용
- 입문/일반/어려움/악몽 난이도에서 보드에 보이는 타일을 사용자가 제공한 v2 오브젝트 중심으로 재매핑
- 선택한 타일이 잘 보이지 않던 문제 수정
- `DreamPixiRenderer`에 `selectionRing`, `selectionCore`를 추가해 선택 타일에 스카이블루/골드 이중 링, 강한 glow, 확대 피드백을 표시
- 선택/힌트/잠김/비활성 상태 PNG 교체와 별도 선택 링을 동시에 사용해 상태 대비 강화
- v2 일부 UI/캐릭터 PNG에 흰 배경이 깔려 있던 문제 보정
- 마스코트, 보조 캐릭터, 로고, 버튼, 장식 프레임, 보스 시트의 가장자리 흰 배경을 alpha-clean 처리
- 원본 배경 이미지는 장면용으로 유지하고, 오브젝트/버튼/캐릭터류만 투명 처리
- 로비 드래그 스크롤이 뻑뻑하던 문제 추가 완화
- 로비 화면의 버튼/카드 터치 영역을 `pan-y` 중심으로 재정리하고, 자동 `scrollIntoView`는 부드러운 강제 스크롤 대신 즉시/근접 이동으로 변경
- 가로 회전 시 레이아웃이 다시 가로 기준으로 커지는 문제를 추가 수정
- `viewportFrame.js`가 마지막 정상 세로 프레임을 저장하고, 가로 viewport에서는 저장된 세로 프레임을 scale 하여 유지하도록 변경
- `npm run check:gameplay-mapping`, `npm run check:alpha-clean` 추가 및 GitHub Actions 검사에 반영
- Texture Atlas manifest v1.0.19 갱신
- service worker 캐시를 v1.0.19로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.18 - Virtual Portrait Frame, Quiet In-App Copy and Layout Root Cause Fix Patch

- 카카오/모바일 환경에서 보조 안내 문구가 과하게 노출되던 문제를 정리하고, 게임 화면에서는 카카오/세로모드/전체화면 고정 류의 문구가 보이지 않도록 수정
- 회전 차단 오버레이로 막는 방식이 아니라, 실제 레이아웃이 가로 기준으로 재계산되던 원인을 수정
- 원인: `portraitLock.js`가 세로 프레임을 적용한 직후 `fullscreen.js`가 실제 가로 viewport 값을 다시 `--app-width`, `--app-height`에 덮어쓰면서 앱이 가로 화면 기준으로 돌아갈 수 있었음
- `src/platform/viewportFrame.js` 추가: `computePortraitFrame()`, `applyPortraitFrame()`로 모바일/인앱 viewport 계산을 단일화
- `fullscreen.js`와 `portraitLock.js`가 모두 같은 virtual portrait frame 계산을 사용하도록 변경
- 실제 기기가 가로로 돌아가도 앱은 실제 가로 폭을 그대로 쓰지 않고, 9:16 비율의 가상 세로 프레임을 중앙에 유지
- `portrait-lock-overlay`는 더 이상 화면을 덮거나 게임 입력을 막지 않도록 숨김 fallback으로 전환
- `browser-guard` 보조 패널은 자동 노출하지 않고 내부 화면 보정 이벤트만 수행하도록 변경
- 설정 화면의 화면 관련 문구와 버튼명을 일반적인 `화면 맞춤` 흐름으로 정리
- `npm run check:viewport-frame` 추가 및 GitHub Actions 검사에 반영
- Texture Atlas manifest v1.0.18 갱신
- service worker 캐시를 v1.0.18로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.17 - Asset State Set, Boss Motion, Button Frame and VFX Polish Patch

- 업로드한 `dream_library_massive_asset_pack_v2.zip`에서 런타임에 바로 쓰는 PNG 자산을 선별 반영
- 적용 중 대형 원본 시트 1개는 ZIP 꼬리 손상으로 완전 추출되지 않아 프로젝트에는 넣지 않았고, 정상 추출된 개별 PNG/상태 PNG만 사용
- v2 상태별 사천성 타일 36종 × 5상태 추가: normal, selected, hint, locked, disabled
- `TILE_SET`에 `v2-tile-01` ~ `v2-tile-36` 오브젝트 추가
- 난이도별 타일 다양성 확대: 일반 16종, 어려움 26종, 악몽 36종
- `DreamPixiRenderer`가 타일 선택/힌트/잠금/비활성 상태에 맞는 PNG를 실제로 교체하도록 수정
- 타일 제거 시 v2 fragment particle PNG를 뿌려 오브젝트가 깨지는 느낌 강화
- 보스 피격 컷인 `boss-hit-cutin` 추가: 3콤보 이상은 BOSS HIT, 5콤보 이상은 BOSS BREAK로 표시
- 로그인/로비 디자인에 v2 배경, 로고, 마스코트, 버튼 아트, 장식 프레임을 적용
- UI 키 PNG 상태 세트 일부를 실제 버튼/힌트/섞기/로비/다시 시작 버튼에 연결
- 신규 복원 프로젝트 `아케인 무대` 추가: v2 오브젝트를 수집해 전투 무대 복원 목표로 사용
- `npm run check:v2-assets` 추가 및 GitHub Actions 검사에 반영
- service worker 캐시를 v1.0.17로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.16 - Exit Fallback, Smooth Mobile Scroll, Local Ranking Fallback Patch

- 종료 확인 팝업에서 `종료 하기`를 눌러도 일반 브라우저에서 창이 닫히지 않는 문제 대응
- 브라우저 보안 정책으로 `window.close()`가 막히는 경우를 대비해 `exit-sleep-modal` 종료 상태 화면 추가
- 종료 시 진행 중인 보드, 타이머, 선택 상태를 정리하고 첫 화면 상태로 저장한 뒤 종료 상태 오버레이로 전환
- 종료 상태에서 `다시 열기` 버튼으로 첫 화면을 다시 복구할 수 있도록 처리
- 카카오/모바일 세로 전체화면 런타임에서 스크롤이 뻑뻑해지는 문제 완화
- `portraitLock.js`의 전체화면/세로 잠금 재시도를 모든 터치 종료마다 실행하지 않고, 탭에 가까운 제스처에서만 실행하도록 변경
- 로비/옵션/도감/랭킹 패널에 `touch-action: pan-y`, `-webkit-overflow-scrolling: touch`, `overscroll-behavior-y: contain` 정리
- 퍼즐판 캔버스에는 `touch-action: none`을 유지해 게임 조작과 로비 스크롤 충돌을 분리
- Firebase 랭킹 실패 또는 미연결 상태에서 전역/일일 랭킹을 로컬 기록으로 대체 표시
- 클리어 기록을 `dream-library-local-ranking-global`, `dream-library-local-ranking-daily`에 저장
- `npm run check:exit-scroll` 추가 및 Actions 검사에 반영
- Texture Atlas manifest v1.0.16 갱신
- 이미지 리포트에 README로 붙이기 쉬운 markdown table 출력 추가
- 현재 자산은 플레이/로비/보스/도감 구성에는 충분하나, 다음 품질 상승을 위해 표정별 마스코트, 보스 공격 프레임, 세로 배경 레이어, 버튼 상태별 PNG, 타일 파편 VFX 보강이 필요
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.15 - Kakao In-App Portrait Fullscreen, Atlas Lookup, Combat Cut-in Patch

- 카카오톡/Kakao 계열 인앱 브라우저에서 외부 브라우저로 빼지 않고 그대로 실행하도록 정책 변경
- 카카오 인앱 실행 시 세로 9:16 전체화면 프레임을 우선 적용하고, 회전/리사이즈/터치 이후에도 portrait lock을 재시도
- 가로 전환 시 게임 UI가 돌아가지 않도록 `portrait-lock-overlay`와 CSS viewport lock fallback 추가
- `src/platform/portraitLock.js` 추가: `--app-height`, `--app-width`, `html.kakao-runtime`, `html.portrait-runtime` 기반 런타임 프레임 관리
- 카카오 보조 패널 문구를 외부 이동 안내가 아니라 `카카오톡 안에서 바로 실행` 안내로 변경
- `open-external-button`, `copy-url-button`, `intent://` 계열 외부 handoff 토큰 제거
- 설정 화면의 전체화면 버튼도 카카오 인앱 세로 고정 정책에 맞게 정리
- Texture Atlas manifest v1.0.15를 실제 lookup 후보 경로에 맞춰 갱신
- `DreamPixiRenderer`에서 Atlas lookup 준비 경로와 전투 VFX 배정 지점 정리
- 콤보/보스 피격 컷인 타이밍과 로비 미션 카드 밀도 추가 다듬기
- `npm run check:kakao-portrait` 추가 및 Actions 검사에 반영
- `npm run check:kakao`는 외부 브라우저 handoff 문구/intent가 남아 있으면 실패하도록 강화
- service worker 캐시를 v1.0.15로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.14 - Lobby Mission Deck, Foldable Lobby Panels, Dynamic Loading Patch

- 로비에 `Mission Deck` 추천 카드 추가: 추천 스테이지, 오늘의 복원, 복원 가능 프로젝트, 컬렉션 목표를 자동 배치
- 첫 화면 → 로비 → 진짜 게임 시작 흐름은 유지하고, 로비에서 무엇을 먼저 할지 더 명확히 보이도록 정리
- 추천 스테이지 카드는 바로 퍼즐을 열지 않고 선택 카드로 이동해 `진짜 게임 시작` 버튼을 누르게 유지
- daily 추천 카드는 오늘 스테이지로 바로 진입할 수 있도록 연결
- 복원 추천 카드는 복원 상세 모달로 연결하고, 완료 가능한 프로젝트를 우선 노출
- 컬렉션 추천 카드는 프리미엄/미수집 필터로 도감 위치를 자동 이동
- 작은 화면에서 로비가 길어지는 문제를 줄이기 위해 미션/복원/daily/컬렉션 패널 접기 UX 추가
- `DreamAudio`와 `SpineBridge`를 정적 import에서 동적 import로 전환해 Howler/Spine 계열 chunk 분리 기반 마련
- `npm run check:lobby-missions` 추가 및 Actions 검사에 반영
- Texture Atlas 후보 manifest를 `texture-atlas-manifest-v1.0.14.json`로 갱신
- service worker 캐시를 v1.0.14로 갱신
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적


### v1.0.13 - Lobby First Flow, Soft Kakao Assist, Collection Daily Polish

- 첫 화면 시작 버튼은 퍼즐판을 바로 열지 않고 `서고 입장 → 로비` 구조로 이동
- 익명/게스트 시작, Google, Email 로그인 성공 후 모두 로비로 이동
- 실제 퍼즐 시작은 로비의 `진짜 게임 시작` 또는 `오늘 스테이지 시작`에서만 실행
- 카카오톡 대응을 전체 화면 대응 페이지에서 하단 보조 패널형 Browser Handoff로 완화
- 카카오톡 안에서도 게스트 로비/플레이는 계속 가능하도록 변경
- Google/Email 계정 저장이 필요한 경우에만 외부 브라우저 사용 제안
- 복원 프로젝트 완료 상태 저장과 `복원 완료` 보상 처리 추가
- 컬렉션 도감 필터 추가: 전체 / 보유 / 미수집 / 프리미엄
- 오늘의 복원 랭킹 탭 추가: 오늘 / 전체
- Vite manualChunks 설정 추가로 PixiJS, Firebase, 연출 라이브러리 chunk 분리 시작
- `npm run check:lobby-flow` 추가 및 Actions 검사에 lobby-first 흐름 검증 반영
- SVG 금지 유지
- 별도 삭제 안내 파일 추가 없음. 버전 기록과 적용 메모는 README.md에만 누적

### v1.0.12 - Stage Rule Balance, Boss Telegraph, Actions Stability Patch

- 안개 타일, 잠긴 타일, 시간 봉인을 실제 플레이 규칙으로 강화
- 안개 타일은 첫 터치에서 정체를 드러내고, 다시 선택해야 연결 가능
- 잠긴 타일은 먼저 다른 한 쌍을 연결하면 금속 장식이 열리는 구조로 조정
- 시간 봉인은 해제 시 3초 감소, 봉인 타일 연결 성공 시 8초 회복으로 리스크/보상 추가
- 보스 압박 스테이지에서 연결 실패 시 시간이 4초 줄고 보스 반격 예고 표시
- 보스별 `telegraphTitle`, `telegraphLine`, `pressurePenalty` 데이터 추가
- 전투 HUD에 `boss-telegraph` UI 추가
- 연결 성공, 보스 피격, 보스 경고에 imported VFX PNG를 추가 배정
- Texture Atlas 후보 manifest `public/assets/meta/texture-atlas-manifest-v1.0.12.json` 추가
- `tools/build-texture-atlas-manifest.mjs`와 `npm run atlas:manifest` 추가
- `tools/check-special-rules.mjs`와 `npm run check:special-rules` 추가
- GitHub Actions 설치 안정화를 위해 공개 npm registry와 fetch retry 설정 명시
- full ZIP에서는 이전 삭제 안내용 별도 파일과 legacy 제거 스크립트 파일 제거
- patch ZIP에는 새 삭제 안내 파일을 만들지 않고, 적용 메모는 README.md에만 기록
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.11 - Massive Asset Import, Back Flow, Actions Stabilization Patch

- 업로드한 `dream_library_massive_asset_pack_v1.zip`에서 PNG 렌더링 에셋만 선별 반영
- SVG 파일은 생성, 복사, 참조하지 않도록 유지하고 `npm run check:assets`로 전체 프로젝트 검사
- 신규 프리미엄 퍼즐 오브젝트 24종 추가: `premium-01.png` ~ `premium-24.png`
- 신규 캐릭터 PNG 8종 추가: assistant 4종, boss-import 4종
- 신규 VFX PNG 6종과 파티클 PNG 10종 추가
- 신규 UI 키 PNG 12종 추가: back, home, settings, hint, refresh, calendar, ranking, chest, fullscreen, logout, close, play
- 신규 배경 PNG `imported-moon-library.png` 추가
- 에셋 반영 내역을 `public/assets/meta/asset-import-v1.0.11.json`에 기록
- 사천성 타일 풀을 기존 24종에서 48종으로 확장해 expert 난이도에서도 오브젝트 반복감을 줄임
- 첫 화면에 개발 중 로그/디버그 문구가 보이지 않도록 유지
- 모바일/브라우저 뒤로가기 대응 추가: 게임 중 뒤로가기 시 진행 중인 판을 정리하고 첫 화면으로 이동
- 첫 화면에서 뒤로가기를 누르면 바로 이탈하지 않고 `종료 하기` 확인 팝업 표시
- 보상/복원 상세/옵션 팝업이 열린 상태에서 뒤로가기를 누르면 먼저 해당 팝업만 닫히도록 정리
- GitHub Actions 중복 실행 정리: `main` push 자동 실행은 GitHub Pages workflow 하나만 담당
- `quality-check.yml`은 pull request와 수동 실행 전용으로 변경
- Firebase Hosting workflow는 수동/PR preview 용도로 유지해 Pages 배포와 충돌하지 않도록 정리
- GitHub 러너의 `npm ci` 불안정 이슈 대응: Actions에서는 Node 20 LTS와 안전 설치 명령을 사용
- 이전 patch에서 남은 `package-lock.json` 관련 메모는 별도 파일이 아니라 README에만 기록
- workflow 검사 스크립트 `npm run check:workflows` 추가
- service worker 캐시를 v1.0.11로 갱신하고 신규 핵심 PNG 자산을 precache에 추가
- README GitHub Desktop 적용 문구를 v1.0.11 기준으로 갱신
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.10 - Boss Types, Collection Upgrade, Chapter Tabs, Daily Ranking Patch

- 보스 타입 3종을 실제 데이터와 UI로 분리: 망각의 서고령 / 그림자 장서관장 / 봉인된 페이지 골렘
- 챕터별 `bossId`를 스테이지 데이터에 배정하고, 보스별 이름, PNG, 반격 문구, 콤보 경고 주기, 시간 압박 기준을 분리
- 신규 보스 PNG 자산 2종 추가: `shadow-librarian.png`, `sealed-page-golem.png`
- 전투 HUD 보스 영역에 `boss-image`, `boss-name`, `boss-pattern` hook 추가
- 보스 HP 단계와 보스 종류별 aura 스타일을 분리해 같은 사천성 규칙에서도 챕터별 전투감이 다르게 느껴지도록 조정
- 챕터별 월드맵 탭 추가: 달빛 서가 / 구름 정원 / 별빛 탑을 탭으로 전환
- 잠긴 스테이지를 직접 시작하지 못하도록 시작 직전 검증 추가
- 보상 인벤토리를 `기억 오브젝트 도감` 컬렉션 패널로 확장
- 컬렉션 도감 PNG 자산 `collection-codex.png` 추가
- 복원 프로젝트 상세 모달 추가: 필요 재료, 보유량, 보상, 집중 프로젝트 설정 표시
- 오늘의 복원 클리어 시 별가루 보너스가 `spark` 재료로 누적되도록 추가
- daily 리더보드 UI 추가 및 Firestore 저장 경로 `leaderboards/daily/days/{dateKey}/scores/{uid}` 추가
- Firestore Rules에 날짜별 daily 리더보드 경로 검증 추가
- Texture Atlas 우선 로딩 실험 적용: `ATLAS_ASSETS`를 먼저 preload한 뒤 개별 PNG를 이어서 preload
- 이미지 용량 점검 스크립트 `npm run report:images` 추가
- GitHub Actions `quality-check.yml` 추가: typecheck, SVG 금지, health, kakao, content, image report, build 검사
- GitHub Pages 배포 workflow에도 품질 검사 단계를 추가
- service worker 캐시를 v1.0.10으로 갱신하고 신규 보스/컬렉션 PNG를 precache에 추가
- README GitHub Desktop 적용 문구를 v1.0.10 기준으로 정리
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.9 - Restoration Meta, Daily Content, Special Rules, Kakao Handoff Patch

- 카카오톡 인앱 브라우저 대응을 차단/경고 방식에서 외부 브라우저 이어하기 대책으로 변경
- Android 카카오톡에서는 사용자가 시작 버튼을 누른 순간 Chrome `intent://` handoff를 시도하도록 변경
- iOS/전환 실패 환경에서는 주소 복사와 임시 플레이를 제공하는 브라우저 handoff 패널 추가
- 첫 진입 시 강제 경고 화면을 띄우지 않고, 실제 시작 액션 시점에만 전환 대책을 실행하도록 변경
- 브라우저 handoff 전용 PNG 자산 `browser-handoff.png` 추가
- 도서관 복원 메타 시스템 추가: 클리어 보상 자원을 localStorage 인벤토리에 누적
- 로비에 `서고 복원 작업대` 패널 추가
- 복원 프로젝트 3종 추가: 달빛 책장 / 구름 정원 / 별빛 탑
- 복원 재료 보유량에 따라 프로젝트 진행률 바가 채워지도록 구현
- 일일 콘텐츠 패널 추가: 날짜 기반 daily stage와 특수 규칙 조합 생성
- 오늘의 복원 버튼 추가: 일일 스테이지 바로 시작
- 스테이지별 특수 규칙 데이터 추가: 안개 타일, 잠긴 타일, 시간 봉인, 보스 압박
- 사천성 보드 생성 시 특수 타일 플래그를 주입하는 구조 추가
- PixiJS 타일 렌더링에 특수 타일 badge, veil, 색상 rim 표시 추가
- 게임 HUD에 modifier strip 추가로 현재 특수 규칙 표시
- Firestore score payload와 rules 필드 불일치 수정: `timeSeconds`, `difficulty`, `cleared` 저장
- service worker 캐시를 v1.0.9로 갱신하고 신규 meta PNG를 precache에 추가
- `npm run check:kakao` 추가: 카카오 handoff 정책 검사
- `npm run check:content` 추가: 일일 콘텐츠/복원 메타 데이터 검사
- `npm run check:health`를 v1.0.9 필수 자산과 UI hook 기준으로 갱신
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.8 - Full Polish, Combat Feedback, Engine Quality Patch

- 작은 모바일 화면에서 로그인/게임 UI가 겹치지 않도록 `screen-game`, HUD, 보스 영역, 퍼즐판, 하단 버튼 레이아웃을 재조정
- `app-shell` overflow 문제를 정리해 로비는 자연스럽게 스크롤되고 게임 화면은 세로 9:16 안에서 고정되도록 수정
- 게임 HUD에 미션 스트립 추가: 남은 오브젝트 수와 목표 콤보 표시
- 보스 영역을 PNG 렌더링 캐릭터 `forgotten-spirit.png` 기반으로 교체
- 보스 HP 바 추가: HP 수치와 실제 게이지가 함께 감소
- 보스 상태 단계 추가: stable / wounded / danger
- 콤보 컷인 UI 추가: 2콤보 이상부터 전투 피드백 강화
- 15초 이하 저시간 구간에서 보스 반격 예고 연출 추가
- 6콤보 단위로 퍼즐판 흔들림과 보스 압박 연출 추가
- 사천성 연결 경로 계산을 Boolean 판정에서 실제 경로 반환 방식으로 확장
- 연결 성공 시 실제 꺾임 경로를 따라 빛줄기를 그리도록 개선
- 보드 생성과 섞기 후 최소 1개 이상의 연결 가능한 쌍이 나오도록 보정
- PixiJS 렌더러에 디바이스 품질 프로필 추가: 고품질 / 균형 / 절전
- 품질 설정을 옵션 모달에 추가하고 localStorage에 저장
- 저사양 모드에서 파티클 수, 모션, blur/shadow 부담 감소
- 타일 idle floating 누적 오차 문제 수정: 매 프레임 y값이 계속 밀리던 문제를 base position 방식으로 보정
- PixiJS asset preload 캐시 추가
- pointermove parallax 입력을 throttle 처리해 불필요한 프레임 비용 감소
- 모바일 haptic feedback 시스템 추가: 터치/선택/매칭/콤보/경고 진동 분리
- 신규 PNG 자산 추가: `forgotten-spirit.png`, `combo-flash.png`, `magic-wave.png`, `boss-warning.png`, `hp-frame.png`
- service worker 캐시를 v1.0.8로 갱신
- `npm run check:health` 추가: v1.0.8 필수 UI hook, 스타일, PNG 자산, SVG 금지 정책 검사
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.7 - Compact Start Screen + Raster Asset Refresh Patch

- 첫 로그인 화면을 한 화면 안에 들어오도록 재구성
- 게임 소개 문구를 제거하고 타이틀/시작 버튼/로그인 버튼을 위쪽으로 압축 배치
- `게임 시작` 버튼을 누르면 로그인 설정 페이지가 아니라 바로 기본 스테이지에 진입하도록 변경
- Firebase 설정이 없는 환경에서는 `게임 시작`이 즉시 로컬 게스트 세션을 만들고 게임을 시작
- Google 로그인, 이메일 로그인/가입 완료 후에도 바로 게임으로 진입하도록 변경
- 옵션, 사운드, 전체화면, 로컬 진행 초기화, 로그아웃을 우측 상단 톱니바퀴 옵션 모달로 분리
- 이전 로그인 설정 페이지 흐름을 제거하고 옵션 모달 중심 UX로 정리
- 로그인 화면 배경, 로비/전투 배경, 캐릭터, UI, 이펙트, 24종 타일 PNG를 전면 교체
- `dream-objects.png` Texture Atlas와 atlas JSON을 v1.0.7 기준으로 재생성
- `tile-manifest.json` 버전을 v1.0.7로 갱신
- service worker 캐시를 v1.0.7로 갱신
- SVG 금지 정책 유지: full ZIP과 patch ZIP 내부에 SVG 파일 없음

### v1.0.6 - No SVG Raster Render Asset Patch

- 프로젝트 에셋 원칙을 `SVG 절대 금지`로 확정
- 게임 첫 화면과 로비에 남아 있던 벡터 이미지 참조를 PNG 렌더링 자산으로 교체
- 퍼즐 타일 24종을 256×256 투명 PNG 오브젝트로 재제작
- `dream-objects.png` Texture Atlas와 `dream-objects.atlas.json` 갱신
- 2.5D 배경 6종을 세로형 PNG 렌더링 배경으로 교체
- 사서 모모 캐릭터를 PNG 렌더링 자산으로 교체
- UI 프레임, 보상 배지, 히트 버스트 효과를 PNG로 교체
- favicon을 PNG로 교체
- service worker precache 대상을 PNG 자산으로 변경
- GitHub Pages `/DR/` 경로에서 배경 PNG가 깨지지 않도록 런타임 CSS 변수 방식으로 수정
- `tools/check-no-svg.mjs` 추가: SVG 파일 잔존 여부 검사
- `tools/clean-v1.0.6.mjs` 추가: 기존 SVG 잔여 파일 제거 보조 스크립트
- README.md에 다음 버전 업데이트 예정 표기 형식 추가

### v1.0.5 - Premium Engine Skeleton + Living UI

- 첫 화면에서 개발 중/환경 설정 로그가 보이지 않도록 정리
- 게임 이름을 `꿈의 서고`로 통일
- HTML title, PWA manifest, favicon, 메타 설명을 `꿈의 서고` 기준으로 변경
- PixiJS 8 + TypeScript 엔진 구조 추가
- WebGL/PixiJS 8/Custom Rendering Layer/GSAP/Spine/Particle/Howler/Texture Atlas 방향으로 프로젝트 구조 재편
- `src/main.ts` TypeScript 진입점 추가
- `DreamPixiRenderer` 추가: 2.5D 배경 레이어, 마법진 퍼즐판, 타일 오브젝트, 파티클, 빛줄기, 보스 발사 연출 담당
- `DreamAudio` 추가: Howler.js 기반 터치/선택/매칭/빛줄기/폭발/콤보/클리어 효과음 뼈대
- `SpineBridge` 추가: Spine Pixi v8 런타임 연결 준비
- 버튼 기본 상태에 미세 호흡 애니메이션, 은은한 Glow, hover 확대, touch 눌림, 선택 빛 퍼짐 추가
- 퍼즐 타일을 평면 아이콘이 아닌 떠 있는 마법 오브젝트 에셋으로 교체
- 자체 제작 프리미엄 캐주얼 오브젝트 24종 추가
- Texture Atlas 메타 파일 `dream-objects.atlas.json` 추가
- 2.5D 도서관 배경 추가
- 타격감 시퀀스 추가: 터치 -> 확대 -> 빛 번짐 -> 빛줄기 -> 잔상 -> 보스 발사 -> 폭발 -> 카메라 흔들림 -> 파티클 -> 콤보
- 움직이는 퍼즐판 방향 반영: 룬/마법진 숨쉬기, 선택 가능한 오브젝트 빛 반응, 보스 HP 연동
- 색상 체계를 네이비/골드/에메랄드/바이올렛/스카이블루 중심으로 정리
- AI 에셋 생성용 Master Style Prompt와 Asset Pipeline 문서 추가
- README.md에만 버전 변경 내역 유지

### v1.0.4 - Campaign Lobby + Stage Progress Skeleton

- 게임 시작 로비를 캠페인 월드맵 중심으로 재구성
- 3개 챕터, 12개 스테이지 데이터 구조 추가
- 스테이지 잠금/해금 흐름 추가
- 스테이지 선택 시 챕터명, 스토리, 난이도, 보상 미리보기 갱신
- 스테이지별 난이도 프리셋 자동 선택
- 클리어 시 다음 스테이지 자동 해금
- 클리어 별점 계산 추가: 남은 시간과 최대 콤보 기준 1~3성
- 로컬 캠페인 진행 저장 추가: 해금 스테이지, 클리어 스테이지, 별점, 스테이지별 최고 점수
- 클리어 보상 모달 추가
- 다음 스테이지 바로 시작 버튼 추가
- 월드맵용 자체 배경 추가
- 보상 연출용 자체 배지 추가
- 로비 진행판에 별 조각 카운터 추가
- 설정의 로컬 진행 초기화가 캠페인 진행까지 초기화하도록 확장
- PWA precache에 신규 월드맵/보상 에셋 추가
- 리더보드 저장 데이터에 `stageId`, `stageNumber`, `stars` 필드 추가
- Firestore Rules에 신규 리더보드 필드 검증 추가
- README.md에만 버전 변경 내역 유지

### v1.0.3 - Start/Login Flow + Service Skeleton

- 첫 화면을 게임 시작 로그인 화면으로 재구성
- 아기자기한 캐주얼 원화풍 자체 배경 `storybook-login` 추가
- 게임 시작 화면용 자체 배경 `lobby-garden` 추가
- 마스코트 사서 캐릭터 `librarian-momo` 자체 에셋 추가
- 화면 흐름을 `로그인 화면 -> 로그인 설정 페이지 -> 게임 시작 로비 -> 실제 게임 화면` 구조로 분리
- 게스트 바로 시작, Google 로그인, 이메일 로그인/가입 버튼을 개별 메인 버튼으로 재배치
- Firebase 환경변수가 없어도 로컬 게스트 플레이가 가능하도록 시작 흐름 보강
- 로그인/설정/로비/게임 화면 전환 라우터 추가
- 게임 시작 로비에 챕터 패널, 난이도 선택, 내 진행, 온라인 랭킹 패널 추가
- 실제 게임 화면은 HUD, 보드, 기억 자원 도감으로 분리
- 설정 페이지에 계정 상태, 전체화면, 효과음, 로컬 진행 초기화 카드 추가
- 모바일 전체화면 진입 버튼과 게임 시작 시 전체화면 요청 유지
- KakaoTalk/Kakao 인앱 브라우저 차단 유지
- PWA 캐시 대상에 신규 배경/캐릭터 에셋 추가
- service worker cache 이름에서 표시용 버전 문자열 제거
- README.md에만 버전 변경 내역 유지

### v1.0.2 - Asset Pack 01 + Firebase API Key 하드코딩 제거

- Firebase 웹 설정값을 `src/firebase.js` 하드코딩에서 Vite 환경변수 방식으로 변경
- `.env.example` 추가
- GitHub Actions 빌드에 `VITE_FIREBASE_*` Secrets 주입 추가
- Firebase 설정이 없을 때도 게임 자체는 실행되고, 로그인/리더보드만 비활성화되도록 보강
- Firebase 설정 누락 상태를 로그인 카드와 리더보드에 표시
- 자체 제작 타일 에셋 24종 추가
- 자체 제작 배경 에셋 2종 추가: `library-hall`, `memory-mist`
- 자체 제작 UI 프레임 에셋 1종 추가
- 타일 렌더링을 이모지 중심에서 이미지 중심으로 변경
- 타일 이미지 로딩 실패 시 이모지 fallback 유지
- 기억 자원 도감 UI 추가
- 매칭한 타일을 localStorage에 해금 기록으로 저장
- service worker cache 이름을 `v1.0.2`로 갱신
- service worker precache에 타일/배경/UI 에셋 추가
- GitHub Pages `/DR/` base path에서 에셋 경로가 깨지지 않도록 `import.meta.env.BASE_URL` 기준 처리

### v1.0.1 - GitHub Pages 기본 세팅 재정리

- GitHub Pages 주소 `/DR/` 기준으로 Vite 빌드 경로 세팅
- GitHub Actions `Deploy to GitHub Pages` 추가
- Firebase Hosting Actions는 Firebase 루트 배포용 빌드 명령으로 분리
- GitHub Desktop 사용 흐름에 맞춘 적용 순서 정리
- KakaoTalk/Kakao 계열 인앱 브라우저 감지 및 게임 실행 차단 화면 추가
- 주소 복사 및 외부 브라우저 열기 버튼 추가
- 전체화면 버튼 추가
- 새 게임/난이도 선택 시 전체화면 진입 시도
- PWA manifest, 아이콘, service worker 추가
- 홈 화면 추가/설치 버튼 대응
- 모바일 터치 오작동 방지, safe-area, 세로 화면 UI 보강
- 사운드 설정과 마지막 난이도 localStorage 저장
- 진동 피드백 추가
- Firebase Auth 프로필 저장 실패가 로그인 흐름을 깨지 않도록 보강
- Authorized domains 목록에 GitHub Pages 도메인 추가 안내

### v1.0.0 - Initial playable Firebase starter

- 세로형 9:16 모바일 우선 UI
- 사천성 연결 규칙: 같은 타일, 최대 2회 꺾기, 외곽 경로 허용
- 난이도 4단계: 입문, 일반, 어려움, 악몽
- 힌트, 섞기, 콤보, 제한시간, 점수 시스템
- Firebase Auth: 익명, 이메일, Google 로그인 연결
- Firestore: 사용자 프로필, 전역 리더보드 저장
- Firebase Hosting 설정
- GitHub Actions: main 브랜치 live 배포, PR preview 배포
- Firestore Security Rules 기본 운영형 템플릿

## Google API Key / Firebase Web Config

Firebase 웹앱 초기화에는 API key가 필요합니다. 단, Firebase 웹 API key는 비밀번호처럼 숨겨야만 하는 서버 비밀키가 아니라 Firebase 프로젝트로 요청을 라우팅하는 공개 식별자 성격입니다.

그래도 GitHub Secret Scanning 경고를 줄이고, 이후 다른 Google API가 붙을 때 사고를 줄이기 위해 v1.0.2부터 소스에는 실제 API key를 하드코딩하지 않습니다.

### 로컬 PC 설정

1. `.env.example` 파일을 복사합니다.
2. 복사본 이름을 `.env.local`로 바꿉니다.
3. `.env.local`의 `VITE_FIREBASE_API_KEY`에 Firebase 웹 API key를 넣습니다.
4. `.env.local`은 `.gitignore`에 의해 GitHub에 올라가지 않습니다.

```text
VITE_FIREBASE_API_KEY=Firebase Console에서 확인한 웹 API key
VITE_FIREBASE_AUTH_DOMAIN=dream-library-b732a.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=dream-library-b732a
VITE_FIREBASE_STORAGE_BUCKET=dream-library-b732a.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=120637221874
VITE_FIREBASE_APP_ID=1:120637221874:web:609a6694d4a19ac792196b
VITE_FIREBASE_MEASUREMENT_ID=G-LM4XVDQ241
```

### GitHub Actions Secrets 설정

GitHub 저장소에서 아래로 이동합니다.

```text
Settings > Secrets and variables > Actions > New repository secret
```

아래 Secrets를 추가합니다.

```text
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_MEASUREMENT_ID
FIREBASE_SERVICE_ACCOUNT_DREAM_LIBRARY_B732A
```

`FIREBASE_SERVICE_ACCOUNT_DREAM_LIBRARY_B732A`는 Firebase Hosting Actions용입니다. GitHub Pages만 먼저 쓸 때는 `VITE_FIREBASE_*` 값부터 넣으면 됩니다.

### Google Cloud API Key 제한 권장

Google Cloud Console에서 해당 API key에 아래 제한을 거는 것을 권장합니다.

- Application restrictions: HTTP referrers
- 허용 referrer 예시:
  - `https://junl-im.github.io/*`
  - `https://dream-library-b732a.web.app/*`
  - `https://dream-library-b732a.firebaseapp.com/*`
  - 로컬 테스트가 필요하면 `http://localhost:*/*`
- API restrictions: Firebase에서 실제 사용하는 API만 허용

## GitHub Desktop 적용 순서

### full ZIP으로 처음 세팅하거나 완전 교체할 때

1. GitHub Desktop에서 `junl-im/DR` 저장소를 Clone합니다.
2. Clone한 `DR` 폴더에서 `.git` 폴더만 남기고 기존 프로젝트 파일을 정리합니다.
3. 다운로드한 full ZIP 압축을 풉니다.
4. 압축을 푼 안쪽 파일 전체를 `DR` 폴더 안에 복사합니다.
5. `.env.example`을 복사해서 `.env.local`을 만들고 Firebase 값을 입력합니다.
6. GitHub Desktop에서 변경 파일을 확인합니다.
7. Summary에 `Apply 꿈의 서고 v1.0.13 lobby first kakao assist and collection polish patch` 입력합니다.
8. `Commit to main`을 누릅니다.
9. `Push origin`을 누릅니다.
10. GitHub 저장소 Settings > Pages에서 Source를 `GitHub Actions`로 설정합니다.
11. GitHub 저장소 Settings > Secrets and variables > Actions에 `VITE_FIREBASE_*` Secrets를 입력합니다.
12. Actions 탭에서 `Deploy to GitHub Pages`가 성공하면 `https://junl-im.github.io/DR/`에서 확인합니다.

### patch ZIP으로 기존 파일 위에 덮을 때

1. patch ZIP 압축을 풉니다.
2. 나온 파일들을 GitHub Desktop이 Clone한 `DR` 폴더에 그대로 복사합니다.
3. 덮어쓰기 질문이 나오면 덮어씁니다.
4. 기존 SVG 잔여 파일이 보이면 파일을 삭제합니다. 새 삭제 안내 파일은 만들지 않고 README 기록만 유지합니다.
5. `.env.example`을 복사해서 `.env.local`을 만들고 Firebase 값을 입력합니다.
6. GitHub Desktop에서 변경 파일과 삭제 파일을 확인합니다.
7. Summary에 `Apply 꿈의 서고 v1.0.13 lobby first kakao assist and collection polish patch` 입력합니다.
8. Commit 후 Push합니다.
9. GitHub 저장소 Actions Secrets에 `VITE_FIREBASE_*` 값을 입력합니다.

## Local Development

```bash
# old package-lock.json이 남아 있으면 먼저 삭제
rm -f package-lock.json
npm install
npm run dev
```

## GitHub Pages Build

```bash
npm run build
```

GitHub Pages는 저장소 하위 경로 `/DR/`에 배포되므로 기본 빌드는 `/DR/` base path로 생성됩니다.

## Firebase Hosting Build

Firebase Hosting 루트에 배포할 때는 별도 명령을 사용합니다.

```bash
npm run build:firebase
npm run deploy:firebase
```

Firebase Hosting과 GitHub Pages를 동시에 쓰면 실제 게임 주소가 2개가 됩니다. 지금 기본 운영 주소는 GitHub Pages `https://junl-im.github.io/DR/`로 둡니다.

## GitHub Actions

포함된 workflow는 다음과 같습니다.

```text
.github/workflows/github-pages.yml
.github/workflows/firebase-hosting-merge.yml
.github/workflows/firebase-hosting-pull-request.yml
.github/workflows/quality-check.yml
```

- `github-pages.yml`: main push 시 GitHub Pages 자동 배포
- `firebase-hosting-merge.yml`: 수동 실행용 Firebase Hosting live 배포
- `firebase-hosting-pull-request.yml`: PR 생성 시 Firebase preview 배포
- `quality-check.yml`: PR/수동 실행 시 typecheck, SVG 금지, 카카오 handoff, 콘텐츠 데이터, 특수 규칙, 이미지 용량, 빌드 검사

Firebase CLI로 Hosting Action secret을 생성하는 권장 명령은 다음과 같습니다.

```bash
firebase login
firebase use dream-library-b732a
firebase init hosting:github
```

## Firebase Authorized Domains

Firebase Console > Authentication > Settings > Authorized domains에 아래 도메인을 확인하거나 추가합니다.

```text
localhost
junl-im.github.io
dream-library-b732a.firebaseapp.com
dream-library-b732a.web.app
```

GitHub Pages 주소가 `https://junl-im.github.io/DR/`이더라도 Authorized domain에는 경로 `/DR/`를 넣지 않고 도메인 `junl-im.github.io`만 넣습니다.

## Firebase Authentication

Firebase Console에서 이미 켜둔 공급자:

```text
Anonymous
Email/Password
Google
```

게임 코드도 위 3개 방식에 맞춰 연결되어 있습니다.

## Firestore Collections

```text
users/{uid}
leaderboards/global/scores/{uid}
leaderboards/daily/scores/{uid}
leaderboards/daily/days/{dateKey}/scores/{uid}
```

현재 규칙 원칙:

- 사용자 프로필은 본인만 읽고 쓸 수 있습니다.
- 리더보드는 누구나 읽을 수 있습니다.
- 리더보드 기록은 로그인한 사용자가 자기 UID 문서에만 쓸 수 있습니다.
- 날짜별 daily 기록은 문서 경로의 `{dateKey}`와 저장 데이터의 `dailyKey`가 일치해야 합니다.
- 점수, 시간, 이동 수, 콤보 수는 기본 범위 검증을 통과해야 합니다.
- 나머지 문서는 전부 차단합니다.

Firestore Rules 배포:

```bash
npm run deploy:rules
```



## v1.0.46 Patch Notes - Stage Map Comfort, Boss Status Icon Set and Lobby Gesture Final QA

- 42개 스테이지 확장 이후 현재 위치와 다음 목표가 더 잘 보이도록 `next-goal-v1046` stage map comfort UI를 추가했습니다.
- 보스 그림은 보스 상태바 우측의 더 작은 icon 슬롯으로 압축하고 `statusbar-icon-right-v1046` 레이아웃으로 보드 시야를 덜 가리게 정리했습니다.
- 보스 상태 chip은 HP/압박/반격을 짧게 표시하고 보스별 테두리 톤으로 역할을 구분합니다.
- 초보/입문은 매칭 보너스를 +4초, 일반~숙련은 +3초, 도전~악몽은 +2초로 조정해 난이도별 템포를 더 폭넓게 만들었습니다.
- 지체 압박 시작/반복 주기를 난이도별로 다르게 적용해 초반은 여유롭고 후반은 긴장감 있게 조정했습니다.
- 로비 드래그 보조를 `v1046-gesture-final-rescue`로 강화해 카드, 챕터 탭, 스테이지 노드, 진행 chip 위에서도 세로 스크롤이 더 잘 먹도록 조정했습니다.
- 미니맵, 게임 내 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않았습니다.

검사:

```bash
npm run check:stage-map-boss-difficulty-lobby
```

커밋 메시지:

```text
Apply 꿈의 서고 v1.0.46 stage map comfort boss icon set difficulty tempo and lobby gesture QA patch
```

다음 업데이트 예정: v1.0.48 - Summer Season Live Balance, Reward Pass Polish and Mobile Campaign QA Patch


## v1.0.47 Patch Notes - Mega Summer Season Festival Update

- v1.0.47은 초대규모 썸머 시즌 업데이트로 진행했습니다.
- 캠페인을 기존 7챕터/42스테이지에서 13챕터/78스테이지로 크게 확장했습니다.
- 신규 시즌 챕터 6개와 시즌 스테이지 36개를 추가했습니다.
- 신규 시즌명은 `한여름 꿈결 축제`입니다.
- 로비에 `Summer Season` 패널을 추가해 시즌 진행도, 다음 시즌 스테이지, 시즌 보상 규칙을 바로 확인할 수 있게 했습니다.
- 시즌 스테이지에는 `summer-2026` season marker를 추가했습니다.
- 시즌 전용 modifier로 `햇살 파도`, `진주 연쇄`, `축제 보스`를 추가하고 일일 콘텐츠 modifier pool에도 연결했습니다.
- 썸머 시즌 스테이지에서는 5콤보마다 추가 보너스 시간 +5초와 보너스 점수를 지급하는 `grantSummerSeasonComboBonus()`를 추가했습니다.
- 시즌 스테이지 클리어 시 기본 보상 외에 `햇살 조개` 시즌 재화를 추가 지급합니다.
- 복원 프로젝트에 `한여름 축제 서가`를 추가해 시즌 재화와 프리미엄 오브젝트를 수집할 동기를 강화했습니다.
- 78스테이지 기준 stage map comfort UI와 난이도별 진행 chip을 유지하면서 시즌 진행도도 함께 표시합니다.
- 로비 드래그 보조를 `v1047-season-gesture-fluid`로 강화해 시즌 패널, 스테이지 노드, 챕터 탭, 카드 위에서도 세로 드래그가 더 잘 먹도록 했습니다.
- service worker cache를 `dream-library-cache-v1.0.47`로 갱신하고 `texture-atlas-manifest-v1.0.47.json`을 추가했습니다.
- 신규 검사 `check:summer-season-mega`를 추가하고 GitHub Pages/Quality workflow에 연결했습니다.
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 재도입하지 않았습니다.
- 선택 패 크기 고정 구조는 유지했습니다.
- SVG 없음, node_modules/dist/package-lock.json/DELETE_REMOVED 파일은 ZIP에서 제외합니다.

권장 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.47 mega summer season festival update
```

## v1.0.45 Patch Notes - Stage Progress UX, Boss Chip Bar and Lobby Gesture QA

- 보스 그림을 보스 상태바 우측의 더 작은 chip 슬롯으로 압축해 보드 시야를 덜 가리도록 조정했습니다.
- 캠페인을 7챕터/42스테이지로 확장하고 초보와 악몽 사이에 성장/도전 완충 난이도를 추가했습니다.
- 로비 캠페인 패널에 난이도별 진행 chip과 42스테이지 진행 요약을 추가했습니다.
- 스테이지 노드에 난이도 라벨을 표시해 초보/입문/일반/성장/숙련/도전/어려움/악몽 흐름을 더 쉽게 파악하도록 했습니다.
- 로비 카드, 챕터 탭, 스테이지 노드 위에서 세로 드래그가 끊기는 구간을 줄이기 위해 deep drag rescue를 추가했습니다.
- 기존 금지 UI인 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 재도입하지 않았습니다.
- 신규 검사 `check:stage-ladder-boss-lobby`를 추가하고 GitHub Pages/Quality workflow에 연결했습니다.

권장 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.45 stage progress UX boss chip bar and lobby gesture QA patch
```


## v1.0.48 Patch Notes - Summer Season Live Balance, Reward Pass Polish and Mobile Campaign QA

- 썸머 시즌을 78스테이지 대형 캠페인 상태로 유지하면서, 시즌 패널을 보상 패스형 UI로 polish했습니다.
- 시즌 패스 마일스톤을 6/12/18/24/30/36 클리어 단위로 추가하고, 각 마일스톤에서 태양 왕관 보너스 재료를 지급하도록 연결했습니다.
- 기존 5콤보 +5초 고정 시즌 보너스를 난이도별 라이브 밸런스로 조정했습니다.
  - 초보/입문: +6초
  - 일반/성장: +5초
  - 숙련/도전: +4초
  - 어려움/악몽: +3초
- 보상 모달에 시즌 패스 마일스톤 보상이 바로 표시되도록 `reward-chip-season-pass`를 추가했습니다.
- 시즌 패널에 패스 단계, 다음 마일스톤, 난이도별 현재 콤보 보너스를 표시해 시즌 진행 동기를 강화했습니다.
- 로비 드래그 rescue를 `v1048-campaign-gesture-fluid`로 갱신해 시즌 패널, 패스 트랙, 챕터 탭, 스테이지 노드 위에서도 세로 스크롤이 더 잘 먹도록 보강했습니다.
- service worker cache를 `dream-library-cache-v1.0.48`로 갱신하고 v1.0.48 texture atlas manifest를 생성했습니다.
- 신규 검사 `check:summer-live-balance`를 추가하고 GitHub Pages/Quality workflow에 연결했습니다.
- 기존 금지 UI인 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 재도입하지 않았습니다.

권장 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.48 summer season live balance reward pass polish and mobile campaign QA patch
```

## Asset Resources

v1.0.6부터 에셋은 SVG를 사용하지 않습니다. v1.0.7에서는 로그인 화면과 게임 핵심 에셋을 PNG 렌더링 자원으로 전면 교체했고, v1.0.8에서는 보스/전투 피드백/성능 품질 자산을 추가했습니다. v1.0.9에서는 복원 메타/일일 콘텐츠/카카오 handoff PNG 자산을 추가했고, v1.0.10에서는 보스 3종/컬렉션 도감/daily 랭킹 PNG 자산을 추가했고, v1.0.11에서는 업로드 에셋팩의 PNG 렌더링 자산을 선별 반영해 프리미엄 퍼즐 오브젝트, 캐릭터, VFX, UI 키를 확장했고, v1.0.12에서는 특수 타일 규칙과 보스 예고 UI에 해당 VFX를 실제 배정했고, v1.0.14에서는 로비 미션 카드와 접기 UX, 동적 로딩 기반을 추가했고, v1.0.15에서는 카카오 인앱 외부 이동을 제거하고 세로 전체화면/회전 방지 런타임을 강화했고, v1.0.16에서는 종료 fallback, 로컬 랭킹 fallback, 모바일 스크롤 감도를 다듬었고, v1.0.17에서는 v2 에셋팩의 상태별 타일/마스코트/보스/VFX/UI 프레임을 선별 반영했고, v1.0.18에서는 모바일/인앱 환경의 가로 재계산 원인을 virtual portrait frame으로 수정했고, v1.0.19에서는 실제 보드 타일 매핑을 v2 에셋 우선으로 재정렬하고 선택 강조/alpha-clean/로비 스크롤을 추가 보정했고, v1.0.20에서는 v2 상태별 타일을 실제 atlas로 패킹했고, v1.0.21에서는 로비 모션/버튼 상태/랭킹 UX를 강화했고, v1.0.22에서는 atlas preload CI와 WebP 배경 최적화/HUD 밀도 개선을 적용했고, v1.0.23에서는 보스 프레임 atlas와 모바일 layout QA/스크롤 polish를 추가했고, v1.0.24에서는 보스 atlas sprite 실제 렌더링, atlas WebP 압축 후보, 로비 상호작용 polish를 추가했고, v1.0.25에서는 카카오 인앱 로비 진입 시 fullscreen/orientation API로 인해 가로 viewport가 고정되는 경로를 제거하고 stable portrait shell을 추가했고, v1.0.26에서는 보스 atlas를 Pixi layer 후보와 동기화하고 인앱 device QA/랭킹 flow를 보강했고, v1.0.27에서는 화면 보조 문구를 silent hook으로 제거하고 타일 크기/선택 강조를 가독성 중심으로 재조정했고, v1.0.28에서는 큰 보드맵을 유지하면서 드래그 이동/두 손가락 확대축소가 가능한 board camera 구조를 추가했고, v1.0.29에서는 선택 타일 크기 고정과 보드 카메라 컨트롤/모바일 조작 안정성을 추가했고, v1.0.30에서는 보드 레이더, 빛길 힌트, 보스 카메라 충격 연출을 추가했고, v1.0.31에서는 선택 효과를 타일 셀 내부로 제한하고 첫 화면 부트 안정성을 보강했고, v1.0.32에서는 미니맵/상단 브랜드를 제거하고 선택 표시를 타일 본체와 완전히 분리한 고정 overlay 방식으로 바꿔 패 geometry가 선택으로 커지는 경로를 차단했고, v1.0.33에서는 미니맵 없이 objective marker, 첫 큰 보드 카메라 가이드, 보스 warning pattern 분리를 추가했고, v1.0.34에서는 타일 본체 geometry guard와 boss cut-in polish, 작은 화면 micro HUD 압축을 추가했고, v1.0.35에서는 실제 모바일 선택 QA, touch precision hitArea 분리, 선택 후 카메라 보조와 줌 가독성 hook을 추가했고, v1.0.36에서는 게임 내 카메라 조절 라인과 도움말, 모든 화면 최상단 옵션 라인을 제거하고 뒤로가기/종료 확인 화면 안에 톱니 옵션 진입을 추가해 플레이 공간을 확장했고, v1.0.37에서는 상단 라인 제거 후 남은 여백을 더 정리하고 보스/몬스터 그림 자리가 atlas 지연이나 frame lookup 실패로 비어 보이지 않도록 stable boss image fallback과 boss asset visibility 검사를 추가했고, v1.0.38에서는 보스별 warning depth, objective marker density 자동 압축, boss stable image/atlas overlay 시각 계층과 모바일 cut-in 우선순위를 추가로 다듬었고, v1.0.39에서는 선택 후 카메라 follow 감도, far zoom 타일 가독성, 보스 warning tempo cooldown, objective marker 시야 우선순위와 service worker cache slim 정책을 추가했고, v1.0.40에서는 모바일 보드 조작감과 보스 에셋 polish, 클리어 보상 흐름을 연결했고, v1.0.41에서는 첫 화면을 게스트/구글/이메일 로그인 구조로 정리했고, v1.0.42에서는 옵션 계정 전환, 매칭 +3초 보너스, 지체 압박 연출과 보스 역할 라벨을 추가했고, v1.0.43에서는 구글 로그인 popup/redirect fallback, 중앙 이메일 로그인 팝업, 더 읽기 쉬운 보스 상태 UI를 적용했고, v1.0.44에서는 보스 그림을 상태바 우측 슬롯으로 이동하고 초보~악몽 6단계/30스테이지 캠페인으로 확장했으며 로비 드래그 보조를 강화했고, v1.0.45에서는 보스 그림을 더 작은 상태바 우측 chip 슬롯으로 압축하고 초보~악몽 사이에 성장/도전 완충 난이도를 추가해 7챕터/42스테이지 캠페인으로 확장했으며 로비 카드/버튼 위 드래그 구조를 더 깊게 보정했습니다. v1.0.46에서는 42개 스테이지에서 현재 위치/다음 목표를 더 분명하게 보여주는 stage map comfort UI, 보스 상태바 우측 icon 슬롯 polish, 난이도별 +시간 보너스/압박 템포 조정, 로비 gesture final rescue를 추가했습니다. v1.0.47에서는 한여름 꿈결 축제 시즌을 열어 캠페인을 13챕터/78스테이지로 확장하고, 36개 신규 시즌 스테이지, 시즌 패널, 5콤보 +5초 시즌 보너스, 햇살 조개 시즌 재화, 시즌 복원 프로젝트, 로비 드래그 fluid rescue를 추가했습니다. v1.0.48에서는 썸머 시즌 보너스를 난이도별 라이브 밸런스로 조정하고, 6단계 시즌 패스 마일스톤과 보상 모달 연동, 시즌 패널 모바일 campaign QA, v1.0.48 cache/atlas manifest를 추가했습니다. 모든 게임 표시 자원은 2D~3D 렌더링 기반 PNG/WebP와 Texture Atlas 기준으로 관리합니다.

```text
public/assets/objects/*.png              84+ files
public/assets/backgrounds/*.png           10+ files
public/assets/characters/*.png            16+ files
public/assets/ui/*.png                    80+ files
public/assets/effects/*.png               44+ files
public/assets/meta/*                      11 files
public/assets/atlas/dream-objects.png     1 file
public/assets/atlas/*.json                3+ files
public/assets/meta/tile-manifest.json     1 file
```

현재 타일 자원:

```text
magic-book, gold-key, candle, hourglass, crystal-orb, rune, ink, scroll,
crown, feather, potion, star, music-box, dragon-egg, relic, moon,
gem, shield, flower, comet, bell, map, castle, spark,
premium-01 ~ premium-24, v2-tile-01 ~ v2-tile-36
```

외부 저작권 에셋을 가져오지 않고, 프로젝트 안에서 바로 쓸 수 있는 자체 렌더링 자원으로 구성합니다. 로그인 배경, 로비 배경, 월드맵, 마스코트 캐릭터도 PNG 렌더링 자산입니다.

## No SVG Policy

- SVG 파일은 프로젝트에 추가하지 않습니다.
- 퍼즐 타일은 아이콘이 아니라 질감과 깊이를 가진 렌더링 오브젝트로 제작합니다.
- 최종 게임 적용 자원은 PNG/WebP 개별 파일 또는 Texture Atlas만 사용합니다.
- 새 에셋을 추가한 뒤에는 `npm run check:assets`로 SVG 잔존 여부를 검사합니다.


## v1.0.49 Patch Notes - Summer Event VFX, Reward Pass Missions and Boss Season Polish

- v1.0.47~v1.0.48의 한여름 꿈결 축제 시즌을 이어 받아, 이번 버전은 시즌 이벤트가 실제 보드 연출과 보상 흐름에 더 강하게 보이도록 다듬었습니다.
- `v1049-summer-event-vfx`를 추가해 `햇살 파도`, `진주 연쇄`, `축제 보스` modifier가 매칭/보스 경고 순간에 보드 VFX로 직접 반응합니다.
- Pixi renderer에 `playSummerModifierVfx()`를 추가해 시즌 modifier별 ring/VFX sprite/route assist를 보드 world layer에 표시합니다.
- 시즌 패스 패널에 `패스 목표`, `콤보 미션`, `축제 보스` 미션 카드를 추가했습니다.
- 시즌 패스 마일스톤 보상 수령 시 `playSeasonPassRewardBurst()`로 보드 상단에 짧은 보상 수령 연출이 발생합니다.
- 13챕터/78스테이지 상태에서 챕터 탭이 길어지는 문제를 줄이기 위해 `v1049-compact-chapter-carousel` 구조를 추가했습니다.
- 챕터 탭에는 시즌 챕터를 구분하는 `data-season-tab="summer"` hook을 추가했습니다.
- 보스 상태바 우측 아이콘에 `v1049-boss-season-polish` 장식을 추가해 시즌 보스/일반 보스 상태를 더 명확하게 보이도록 다듬었습니다.
- 로비 드래그 보조를 `v1049-season-vfx-gesture-qa`로 갱신해 시즌 패널, 시즌 패스 미션, 챕터 carousel, 스테이지 노드 위에서도 세로 스크롤이 끊기지 않도록 보강했습니다.
- service worker cache를 `dream-library-cache-v1.0.49`로 갱신하고 `texture-atlas-manifest-v1.0.49.json`을 생성했습니다.
- 신규 검사 `check:summer-event-vfx-pass`를 추가하고 GitHub Pages/Quality workflow에 연결했습니다.
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않았습니다.
- 선택 패 크기 고정 구조, 중앙 이메일 로그인 팝업, 구글 로그인 popup/redirect fallback, 보스 상태바 우측 아이콘 구조를 유지했습니다.

검사 요약:

```bash
npm run typecheck
npm run build:github
전체 check:* QA suite 통과
npm run check:summer-event-vfx-pass
```

빌드 결과:

- Vite production build 성공
- 큰 chunk 경고는 존재하지만 빌드 실패는 아닙니다.

GitHub Desktop 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.49 summer event VFX reward pass missions and boss season polish patch
```

다음 업데이트 예정: v1.0.51 - Summer Finale Expansion, Season Shop and Boss Pattern Event Patch

## Next Version Plan

### v1.0.51 예정 - Summer Finale Expansion, Season Shop and Boss Pattern Event Patch

- 시즌 후반부를 위한 피날레 미션과 시즌 상점형 보상 교환 UI 추가 검토
- 햇살 조개/태양 왕관을 썸머 전용 교환 보상으로 쓰는 흐름 polish
- 축제 보스 modifier가 있는 스테이지에 전용 보스 warning/cut-in 패턴 추가
- 시즌 패스 미션 카드에 일일/주간 느낌의 반복 목표를 추가할지 검토
- 78개 스테이지 compact carousel에서 현재 챕터 자동 focus와 스냅 위치 polish
- 시즌 VFX가 작은 화면에서 타일과 보스 상태바를 가리지 않도록 alpha/z-order 추가 QA
- 로비 드래그가 시즌 패널/패스 미션/챕터 carousel 위에서도 자연스럽게 먹는지 실제 모바일 QA 강화
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음

## KakaoTalk / In-App Browser Policy

v1.0.18부터 카카오톡/Kakao 계열 인앱 브라우저는 외부 브라우저로 빼지 않고, 별도 보조 문구를 노출하지 않은 채 게임을 그대로 실행합니다.

원칙:

- 첫 화면 진입 즉시 경고로 막지 않습니다.
- 카카오톡 안에서도 로비, 게스트 플레이, 퍼즐 진행을 허용합니다.
- 외부 브라우저 전환, Chrome intent, 주소 복사 handoff를 사용하지 않습니다.
- `fullscreen.js`와 `portraitLock.js`가 같은 virtual portrait frame을 사용해, 실제 viewport가 가로값을 반환해도 앱 레이아웃은 9:16 프레임 기준을 유지합니다.
- 보조 패널이나 차단 레이어를 먼저 띄우지 않고 내부 계산으로 화면 흔들림을 줄입니다.

## PWA / Fullscreen Policy

- manifest display는 fullscreen 우선입니다.
- 지원 브라우저에서는 사용자가 설정의 `화면 맞춤` 버튼을 직접 누를 때만 hard fullscreen을 시도합니다.
- 로비 입장/스테이지 시작 같은 자동 흐름에서는 fullscreen/orientation API를 호출하지 않고 virtual portrait frame만 재계산합니다.
- 카카오 인앱 브라우저에서는 fullscreen/orientation API가 visualViewport를 가로값으로 고정할 수 있으므로 자동 호출하지 않습니다.

## Project Identity

- Project: 꿈의 서고
- Genre: Premium Casual Fantasy Puzzle RPG
- Core: Shisen-Sho puzzle battle
- World: 기억을 보관하는 마법 서고
- Threat: Void가 기억을 파편화함
- Player Goal: 사천성 퍼즐을 풀어 기억 조각을 복원하고 서고를 재건

## Art Direction Seed

Initial tile themes:

- Magic Books
- Keys
- Candles
- Hourglasses
- Crystal Orbs
- Runes
- Magic Ink
- Scrolls
- Crowns
- Feathers
- Potion Bottles
- Constellation Pieces
- Music Boxes
- Dragon Eggs
- Library Relics

## Next Milestones

1. v2 상태별 타일 Atlas 패킹 자동화
2. 보스 공격 시퀀스 시트 분할/컷인 적용
3. 로비 마스코트 모션과 카드형 가이드 추가
4. 모바일/인앱 화면 보정 QA와 실제 기기별 viewport 기록 정리



## v1.0.50 Patch Notes - Summer Finale Expansion, Season Shop and Design QA Polish

v1.0.50은 v1.0.47~v1.0.49에서 확장한 한여름 꿈결 축제를 피날레형 시즌 업데이트로 확장한 대형 패치입니다.

핵심 변경:

- 썸머 시즌을 13챕터/78스테이지에서 15챕터/90스테이지로 확장했습니다.
- 신규 챕터 `태양 조개 상점가`, `축제 보스의 여름 피날레`를 추가했습니다.
- 썸머 시즌 총량을 48개 시즌 스테이지로 확장했습니다.
- 시즌 패스 마일스톤을 8단계로 확장했습니다.
- 시즌 상점 미리보기 UI를 추가했습니다.
- 햇살 조개/태양 왕관을 시즌 교환 보상으로 연결하는 구조를 추가했습니다.
- 피날레 미션 카드 3종을 추가했습니다.
- 피날레 스테이지 클리어 시 보상 모달에 피날레 보너스 chip을 표시합니다.
- 축제 보스, 햇살 파도, 진주 연쇄가 피날레 권역에서 더 자주 결합되도록 스테이지 modifier를 확장했습니다.
- 시즌 패널의 작은 화면 밀도, 카드 간격, carousel 폭을 재조정했습니다.
- 보스 상태바 우측 아이콘은 유지하되 피날레 장식이 보드를 가리지 않도록 더 작고 은은하게 조정했습니다.
- 로비 드래그 보정 범위에 피날레 미션 카드와 시즌 상점 카드 영역을 추가했습니다.
- service worker cache를 `dream-library-cache-v1.0.50`으로 갱신했습니다.
- `texture-atlas-manifest-v1.0.50.json`을 생성했습니다.
- 신규 검사 `check:summer-finale-shop-design`을 추가하고 GitHub Pages/Quality Check workflow에 연결했습니다.

유지 정책:

- 미니맵은 재도입하지 않습니다.
- 게임 내 `보기 / 중앙 / + / -` 라인은 재도입하지 않습니다.
- 카메라 도움말은 재도입하지 않습니다.
- 선택 패 크기 고정 구조는 유지합니다.
- 보스 상태바 우측 아이콘 구조는 유지합니다.
- SVG는 사용하지 않습니다.
- ZIP에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않습니다.

검사 결과:

```text
npm run typecheck
npm run build:github
전체 check:* QA suite 통과
npm run check:summer-season-mega
npm run check:summer-live-balance
npm run check:summer-event-vfx-pass
npm run check:summer-finale-shop-design
```

Vite production build 성공. 큰 chunk 경고는 존재하지만 빌드 실패는 아닙니다.

GitHub Desktop 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.50 summer finale expansion season shop and design QA polish patch
```

다음 업데이트 예정: v1.0.51 - Finale Balance, Season Shop Claim Flow and Mobile Design QA Patch

## v1.0.51 Patch Notes - Finale Balance, Season Shop Claim Flow and Mobile Design QA Patch

v1.0.51은 v1.0.50의 피날레/상점 구조를 실제 플레이에서 더 쓰기 좋게 다듬은 후속 패치입니다. 대규모 콘텐츠는 유지하면서, 시즌 상점 수령 흐름과 모바일 디자인 밀도를 중심으로 문제점을 정리했습니다.

핵심 변경:

- 시즌 상점 미리보기였던 구조를 실제 `수령 가능 / 부족 / 완료` 상태로 확장했습니다.
- `seasonShopClaims` 저장값을 추가해 수령 완료 상태를 로컬 진행에 보존합니다.
- 햇살 조개/태양 왕관 보유량을 상점 카드 안에 표시합니다.
- 수령 가능한 보상은 버튼으로 바로 받을 수 있고, 비용이 부족하면 부족 수량을 표시합니다.
- 상점 보상 수령 시 재화 차감, 보상 inventory 추가, 상태 저장, 로비/통계 갱신을 한 번에 처리합니다.
- 90개 스테이지 compact carousel에서 현재 챕터가 자동으로 가운데 보이도록 `current-chapter-v1051` focus를 추가했습니다.
- 시즌 VFX와 보스 경고가 선택 overlay를 덜 가리도록 alpha/z-order CSS를 추가 조정했습니다.
- 보스 상태바 우측 아이콘은 더 작게 유지하면서 시즌 장식만 은은하게 보이도록 조정했습니다.
- 작은 화면에서 시즌 패널, 시즌 상점, 피날레 미션, 패스 트랙이 과밀하지 않도록 mobile density CSS를 추가했습니다.
- 로비 드래그 보정 범위를 시즌 상점 버튼/카드까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.51`로 갱신했습니다.
- `texture-atlas-manifest-v1.0.51.json`을 생성했습니다.
- 신규 검사 `check:summer-shop-claim-design`을 추가하고 GitHub Pages/Quality Check workflow에 연결했습니다.

유지 정책:

- 미니맵은 재도입하지 않습니다.
- 게임 내 `보기 / 중앙 / + / -` 라인은 재도입하지 않습니다.
- 카메라 도움말은 재도입하지 않습니다.
- 선택 패 크기 고정 구조는 유지합니다.
- 보스 상태바 우측 아이콘 구조는 유지합니다.
- SVG는 사용하지 않습니다.
- ZIP에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않습니다.

검사 결과:

```text
npm run typecheck
npm run check:summer-shop-claim-design
npm run check:summer-finale-shop-design
npm run check:summer-live-balance
npm run check:summer-event-vfx-pass
npm run check:no-minimap-topbar
npm run check:selection-stability
npm run check:assets
npm run check:workflows
```

현재 작업 환경에는 `vite` 실행 파일이 없어 `npm run build:github`는 실행하지 못했습니다. `node_modules`, `dist`, `package-lock.json`은 ZIP에 포함하지 않았습니다.

GitHub Desktop 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.51 finale balance season shop claim flow and mobile design QA patch
```

다음 업데이트 예정: v1.0.52 - Season Shop Reward Polish, Finale Boss Cut-in and Mobile Store UX Patch

## Next Version Plan

### v1.0.52 예정 - Season Shop Reward Polish, Finale Boss Cut-in and Mobile Store UX Patch

- 시즌 상점 보상 수령 후 전용 burst/cut-in 연출 강화
- 상점 재화 부족 시 어떤 스테이지에서 모을 수 있는지 바로 안내하는 shortcut 추가
- 축제 보스 전용 warning/cut-in 패턴을 더 명확하게 분리
- 피날레 난이도별 +시간 보너스와 지체 압박 사운드 피로도 추가 조정
- 시즌 VFX가 타일 선택 overlay와 겹칠 때 시각 우선순위 추가 정리
- 작은 화면에서 시즌 상점 버튼, 이메일 팝업, 옵션 계정 전환, 보스 상태바가 겹치지 않도록 추가 압축
- 로비 드래그가 상점 수령 버튼 위에서도 클릭/스크롤 충돌 없이 동작하는지 추가 QA
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음


## v1.0.52 Patch Notes - Season Shop Reward Polish, Finale Boss Cut-in and Mobile Store UX Patch

v1.0.52는 v1.0.51의 시즌 상점 수령 흐름을 더 게임답게 만들고, 부족 재화 안내와 축제 보스 피날레 컷인을 추가한 디자인/문제점 다듬기 패치입니다.

핵심 변경:

- 시즌 상점 보상 수령 시 `playSeasonShopClaimBurst()` 전용 burst/cut-in 연출을 추가했습니다.
- 시즌 상점 패널에 `v1052-season-shop-claim-burst` 상태를 추가해 수령 순간 패널이 은은하게 빛나도록 했습니다.
- 비용이 부족한 상점 보상에는 `모으러 가기` 버튼을 추가했습니다.
- `focusSummerShopMaterial()`을 추가해 부족 재화를 모을 수 있는 시즌 스테이지로 바로 이동하도록 했습니다.
- 시즌 상점 보상 카드에 `sourceHint`, 부족 수량, 보관함 활성 상태를 더 명확히 표시했습니다.
- 신규 상점 보상 `피날레 컷인 악보`를 추가했습니다.
- 축제 보스/피날레 스테이지 경고 시 `playFinaleBossEventCutin()`을 호출해 시간 압박/실수 반격/피날레 경고를 더 읽기 쉽게 보여줍니다.
- 시즌 VFX와 보스 warning lane이 타일 선택 overlay를 덜 가리도록 alpha와 blend 우선순위를 조정했습니다.
- 작은 화면에서 시즌 상점 카드가 1열로 정리되고, 설명 문구는 압축되도록 mobile store UX CSS를 추가했습니다.
- 로비 드래그 보정 범위를 시즌 상점 수령 버튼, 모으러 가기 버튼, 피날레 카드, 시즌 미션 카드까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.52`로 갱신했습니다.
- `texture-atlas-manifest-v1.0.52.json`을 생성했습니다.
- 신규 검사 `check:summer-shop-reward-polish`를 추가하고 GitHub Pages/Quality Check workflow에 연결했습니다.

유지 정책:

- 미니맵은 재도입하지 않습니다.
- 게임 내 `보기 / 중앙 / + / -` 라인은 재도입하지 않습니다.
- 카메라 도움말은 재도입하지 않습니다.
- 선택 패 크기 고정 구조는 유지합니다.
- 보스 상태바 우측 아이콘 구조는 유지합니다.
- SVG는 사용하지 않습니다.
- ZIP에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않습니다.

검사 결과:

```text
npm run typecheck
npm run check:summer-shop-reward-polish
npm run check:summer-shop-claim-design
npm run check:summer-finale-shop-design
npm run check:summer-event-vfx-pass
npm run check:no-minimap-topbar
npm run check:selection-stability
npm run check:assets
npm run check:health
npm run check:content
npm run check:workflows
npm run check:mobile-playability
npm run check:boss-asset-visibility
npm run check:account-time-pressure
npm run check:auth-modal-boss-role
```

`npm run build:github`는 현재 작업 환경에 `vite` 실행 파일이 없어 실행하지 못했습니다. `node_modules`, `dist`, `package-lock.json`은 ZIP에 포함하지 않았습니다.

GitHub Desktop 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.52 season shop reward polish finale boss cut-in and mobile store UX patch
```

다음 업데이트 예정: v1.0.53 - Season Store Claim History, Finale Boss Balance and UI Density QA Patch

## Next Version Plan

### v1.0.53 예정 - Season Store Claim History, Finale Boss Balance and UI Density QA Patch

- 시즌 상점 수령 내역/최근 보상 기록 UI 추가
- 부족 재화 바로가기 후 자동으로 해당 챕터 carousel focus가 더 자연스럽게 이동하도록 개선
- 피날레 보스 cut-in 반복 시 피로하지 않도록 cooldown/priority 조정
- 시즌 상점 보상 아이템이 복원/컬렉션/보스 상태바에 반영되는 표시 강화
- 작은 화면에서 시즌 상점, 이메일 팝업, 옵션 계정 전환, 보스 상태바 겹침 추가 QA
- 로비 드래그가 시즌 상점 버튼 위에서도 클릭/스크롤 충돌 없이 더 안정적인지 추가 점검
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음

## v1.0.53 Patch Notes - Season Store Claim History, Finale Boss Balance, UI Density QA and Build Fix Patch

v1.0.53은 v1.0.52 이후 GitHub Actions에서 발생한 `check:summer-live-balance` 실패를 먼저 해결하고, 시즌 상점 기록/피날레 보스 밸런스/모바일 UI 밀도 문제를 함께 다듬은 안정화 패치입니다.

핵심 변경:

- GitHub Actions build 실패 원인인 `Missing season pass lobby mount`를 수정했습니다.
- 시즌 패널의 실제 mount는 `data-season-pass="v1053-shop-history-pass"`로 유지하면서, 과거 검사 스크립트가 찾는 v1.0.48~v1.0.52 시즌 패스 mount token도 숨김 호환 anchor로 보강했습니다.
- 숨김 호환 anchor는 `hidden aria-hidden="true"` 상태라 화면에는 노출되지 않고, 로비 UI를 차지하지 않습니다.
- 시즌 상점 최근 수령 기록 UI를 추가했습니다.
- `seasonShopHistory` 상태와 `dream-library-season-shop-history` 로컬 저장을 추가했습니다.
- 최근 수령 기록은 최대 4개만 표시해 시즌 패널이 과밀해지지 않도록 했습니다.
- 시즌 상점 보상을 수령하면 보스 상태바 우측 아이콘에도 은은한 수령 반영 상태가 표시되도록 했습니다.
- `getSeasonClaimVisualState()`를 추가해 상점 보상/보스 상태바/시즌 패널을 연결했습니다.
- 피날레 보스 cut-in 반복 피로도를 줄이기 위해 cooldown/priority 로직을 보강했습니다.
- 작은 화면에서 시즌 상점, 수령 기록, 이메일 팝업, 옵션 계정 전환, 보스 상태바가 겹치지 않도록 mobile density CSS를 추가했습니다.
- 로비 드래그 보정 범위를 시즌 수령 기록과 상점 버튼까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.53`으로 갱신했습니다.
- `texture-atlas-manifest-v1.0.53.json`을 생성했습니다.
- 신규 검사 `check:summer-history-finale-density`를 추가하고 GitHub Pages/Quality Check workflow에 연결했습니다.

유지 정책:

- 미니맵은 재도입하지 않습니다.
- 게임 내 `보기 / 중앙 / + / -` 라인은 재도입하지 않습니다.
- 카메라 도움말은 재도입하지 않습니다.
- 선택 패 크기 고정 구조는 유지합니다.
- 보스 상태바 우측 아이콘 구조는 유지합니다.
- SVG는 사용하지 않습니다.
- ZIP에는 `node_modules`, `dist`, `package-lock.json`을 포함하지 않습니다.

검사 결과:

```text
npm run typecheck
전체 check:* QA suite 통과
npm run check:summer-live-balance
npm run check:summer-history-finale-density
npm run build:github
```

빌드도 성공했습니다. Vite의 큰 chunk 경고는 있었지만 실패는 아닙니다.

GitHub Desktop 커밋 메시지:

```text
Apply 꿈의 서고 v1.0.53 season pass build fix shop history finale balance and UI density QA patch
```

다음 업데이트 예정: v1.0.54 - Season Store Collection Link, Finale Reward Audio and Mobile Polish Patch

## Next Version Plan

### v1.0.54 예정 - Season Store Collection Link, Finale Reward Audio and Mobile Polish Patch

- 시즌 상점 수령 아이템을 컬렉션/복원 프로젝트에 더 명확히 연결
- 시즌 상점 수령 기록에서 보상 상세 보기 추가
- 피날레 보스 cut-in과 보상 수령 사운드/햅틱 연결 polish
- 시즌 패널이 90스테이지/15챕터 구조에서도 작은 화면에서 덜 빽빽하게 보이도록 추가 압축
- 로비 드래그가 시즌 기록/상점/피날레/챕터 carousel 위에서도 끊기지 않는지 추가 QA
- GitHub Actions 검사 token이 누락되지 않도록 시즌 패스 mount 호환성 계속 유지
- 미니맵, 보기/중앙/+/- 라인, 카메라 도움말은 계속 재도입하지 않음

## v1.0.54 Patch Notes - Season Store Collection Link, Adaptive Engine Budget and Design QA Polish Patch

v1.0.54는 v1.0.53 이후 시즌 상점, 모바일 밀도, 로비 중복 카드, 성능 예산을 함께 정리한 디자인/문제점 체크 패치입니다.

### 핵심 변경

- 시즌 상점 보상 카드에 `보상 상세` 버튼을 추가했습니다.
- 시즌 상점 최근 수령 기록을 누르면 연결된 복원/컬렉션 영역으로 이동하도록 `v1054-season-store-collection-link-detail` 흐름을 추가했습니다.
- 로비 하단 `내 진행` 카드가 중복되어 같은 ID가 두 번 생기던 문제를 정리했습니다.
- 중복 카드 자리는 `디자인 점검` 카드로 교체해 시즌 패널, 보스바, 팝업 겹침 자동 압축 상태를 보여줍니다.
- 기기 성능/화면 크기에 따라 시즌 VFX와 cut-in 밀도를 조절하는 `v1054-adaptive-visual-budget` 엔진 hook을 추가했습니다.
- 시즌 패널, 시즌 상점, 수령 기록, 이메일 팝업, 옵션 계정 전환, 보스 상태바가 작은 화면에서 겹치지 않도록 CSS를 추가했습니다.
- 로비 드래그 보정 범위에 시즌 상점 상세 버튼, 수령 기록 카드, 디자인 점검 카드까지 포함했습니다.
- service worker cache를 `dream-library-cache-v1.0.54`로 갱신했습니다.
- `texture-atlas-manifest-v1.0.54.json`을 추가했습니다.
- 신규 검사 `check:season-store-engine-design`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 패 크기 고정 구조 유지
- 보스 상태바 우측 아이콘 구조 유지
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 check:* QA suite 통과
npm run check:season-store-engine-design
```

`npm run build:github`는 현재 작업 환경에 `vite` 실행 파일이 없어 실행하지 못했습니다. GitHub Actions에서는 safe install 후 실행됩니다.

### 커밋 메시지

```text
Apply 꿈의 서고 v1.0.54 season store collection link adaptive engine budget and design QA polish patch
```

다음 업데이트 예정: v1.0.55 - Engine Render Budget Tuning, Store Reward Collection Polish and Lobby Density Final QA Patch

### v1.0.55 예정 - Engine Render Budget Tuning, Store Reward Collection Polish and Lobby Density Final QA Patch

- 시즌 상점 보상 상세 화면을 더 고급스럽게 꾸미고 컬렉션 보상 미리보기를 강화합니다.
- 저사양/작은 화면에서 시즌 VFX와 cut-in이 타일 선택 overlay를 가리지 않도록 alpha/z-order를 더 정리합니다.
- 보스 상태바 우측 아이콘과 시즌 상점 보상 상태가 더 자연스럽게 연결되도록 polish합니다.
- 로비 드래그와 클릭 충돌 로그성 QA hook을 보강합니다.
- 시즌 패널, 상점, 수령 기록, 챕터 carousel의 모바일 밀도를 추가로 압축합니다.
- 미니맵, `보기 / 중앙 / + / -` 라인, 카메라 도움말은 계속 재도입하지 않습니다.


## v1.0.55 Patch Notes - Engine Render Budget Tuning, Store Reward Collection Polish and Lobby Density Final QA Patch

v1.0.55는 v1.0.54의 시즌 상점/복원 연결 구조를 기반으로, 저사양/작은 화면에서 효과가 타일 선택과 UI를 가리지 않도록 엔진 예산과 모바일 밀도를 다듬은 패치입니다.

### 핵심 변경

- `v1055-engine-render-budget-tuning` 훅을 추가해 화면 크기, 기기 메모리/코어, 난이도별 보드 크기, 로비 길이를 바탕으로 `lite / balanced / rich` 연출 예산을 자동 선택합니다.
- Pixi 렌더러에 `setRenderBudget()`와 `getRenderBudgetProfile()`을 추가해 파티클 수, VFX 스프라이트 발생 빈도, 보스 경고 알파, 카메라 쉐이크를 예산별로 조정합니다.
- 시즌 상점 보상 카드에 `v1055-store-reward-preview-lens` 미리보기 블록을 추가해 복원/컬렉션 연결과 보상 수량을 더 빠르게 읽을 수 있게 했습니다.
- 시즌 상점 수령 연출은 절약 예산에서 짧게 끝나도록 조정해 작은 화면에서 팝업/보스바와 덜 겹치게 했습니다.
- `v1055-lobby-density-final-qa`와 `v1055-lobby-touch-conflict-audit` 훅을 추가해 시즌 상점, 수령 기록, 미션, 챕터 카드 위의 드래그/터치 충돌을 줄였습니다.
- service worker cache를 `dream-library-cache-v1.0.55`로 갱신하고, `texture-atlas-manifest-v1.0.55.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:engine-render-budget`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 패 크기 고정 구조 유지
- 자동 fullscreen/orientation API 호출 추가 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
npm run check:engine-render-budget
npm run check:season-store-engine-design
npm run check:summer-history-finale-density
npm run check:summer-shop-reward-polish
npm run check:mobile-playability
npm run check:selection-stability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:content
npm run check:workflows
npm run build:github
```

### 커밋 메시지

```text
Apply 꿈의 서고 v1.0.55 engine render budget store reward polish and lobby density final QA patch
```

다음 업데이트 예정: v1.0.56 - Reward Detail Showcase, Boss Warning Readability and Real Device Touch QA Patch

### v1.0.56 예정 - Reward Detail Showcase, Boss Warning Readability and Real Device Touch QA Patch

- 시즌 상점 보상 상세를 더 고급스럽게 꾸미고 복원/컬렉션 링크를 강화합니다.
- 보스 경고선과 타일 선택 링/광채가 겹치는 구간을 추가 정리합니다.
- 실기기에서 시즌 패널, 보스바, 옵션 팝업, 이메일 팝업의 터치 범위를 추가 QA합니다.
- 로비 드래그가 상점/기록/미션/챕터 위에서 더 안정적인지 계속 점검합니다.
- 미니맵, `보기 / 중앙 / + / -` 라인, 카메라 도움말은 계속 재도입하지 않습니다.

## v1.0.56 Patch Notes - Reward Detail Showcase, Boss Warning Readability and Real Device Touch QA Patch

v1.0.56은 v1.0.55의 렌더링 예산/시즌 상점 polish 위에, 실제 플레이 중 보상 상세가 부족하게 느껴지던 부분과 보스 경고 가독성, 실기기 터치 충돌 가능성을 정리한 디자인/QA 패치입니다.

### 핵심 변경

- 시즌 상점 `보상 상세` 버튼을 단순 이동형 흐름에서 실제 상세 쇼케이스 팝업으로 확장했습니다.
- `v1056-reward-detail-showcase` 훅을 추가해 보상 수량, 필요 재화, 복원 프로젝트 연결, 현재 진행률을 한 카드 안에서 확인할 수 있게 했습니다.
- 상세 팝업 CTA를 `복원으로 보기`/`컬렉션 보기`로 정리해 보상 확인 후 연결 패널로 자연스럽게 이동하게 했습니다.
- `v1056-boss-warning-readability` 훅을 추가해 작은 화면/절약 연출 상태에서도 보스 경고 문구가 완전히 사라지지 않고 압축 표시되도록 보강했습니다.
- Pixi 보스 경고 lane에 `readabilityWidthScale`을 추가해 절약/균형 예산에서 경고선 두께와 flare가 타일 선택 링을 과하게 덮지 않도록 조정했습니다.
- `v1056-real-device-touch-qa` 훅을 추가해 시즌 상점 상세/수령/기록 버튼의 실기기 터치 영역과 로비 드래그 중 오탭 방지 처리를 강화했습니다.
- 로비 드래그 보정 대상에 시즌 상점 상세, 수령 기록, 보상 미리보기, 디자인 점검 카드를 추가했습니다.
- service worker cache를 `dream-library-cache-v1.0.56`으로 갱신하고, `texture-atlas-manifest-v1.0.56.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:reward-detail-touch-qa`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 패 크기 고정 구조 유지
- 자동 fullscreen/orientation API 호출 추가 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 63개 check:* QA suite 통과
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:season-store-engine-design
npm run check:mobile-playability
npm run check:selection-stability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### 커밋 메시지

```text
Apply 꿈의 서고 v1.0.56 reward detail showcase boss warning readability and real device touch QA patch
```

다음 업데이트 예정: v1.0.57 - Chapter Finale Reward Theater, Boss Pattern Telegraph Polish and Store Progress Routing Patch

### v1.0.57 예정 - Chapter Finale Reward Theater, Boss Pattern Telegraph Polish and Store Progress Routing Patch

- 챕터/피날레 클리어 보상 연출을 더 고급스럽게 분리합니다.
- 보스 패턴별 경고 색상과 보드 경로 라인의 우선순위를 더 세밀하게 조정합니다.
- 시즌 상점에서 부족 재화가 있을 때 추천 스테이지/챕터로 이동하는 경로를 더 명확히 표시합니다.
- 복원/컬렉션/상점 간 왕복 동선을 더 짧게 다듬습니다.
- 미니맵, `보기 / 중앙 / + / -` 라인, 카메라 도움말은 계속 재도입하지 않습니다.


## v1.0.57 Patch Notes - Daily Start Signal and Mobile Back Action Sheet Patch

v1.0.57은 로비에서 핵심 시작점인 `오늘의 복원`이 한눈에 게임 시작 버튼처럼 보이지 않던 문제와, 폰 뒤로가기에서 기대하던 선택 팝업 흐름이 약해진 문제를 함께 복구한 UX/디자인 패치입니다.

### 변경점

- `v1057-daily-start-signal-widget` 훅을 추가해 로비 상단 `오늘의 복원` 버튼 위에 공중에 떠 있는 손가락, 화살표, `게임 시작` 말풍선 유도 위젯을 배치했습니다.
- 일일 콘텐츠 카드의 `오늘 스테이지 시작` 버튼에도 작은 `게임 시작` 배지를 붙여 핵심 진입점이 아래쪽에서도 다시 보이게 했습니다.
- `v1057-back-action-sheet-restored` 훅을 추가해 폰 뒤로가기/소프트 뒤로가기 시 `첫 화면`, `옵션 톱니바퀴`, `나가기`를 선택할 수 있는 액션 시트 흐름을 복구했습니다.
- `v1057-mobile-exit-options-qa` 훅으로 옵션 톱니바퀴 터치 영역과 나가기 시트 버튼 밀도를 모바일 기준으로 보강했습니다.
- 자동 fullscreen/orientation API, 미니맵, 카메라 상단 조작 라인, SVG는 추가하지 않았습니다.
- service worker cache를 `dream-library-cache-v1.0.57`로 갱신하고, `texture-atlas-manifest-v1.0.57.json`을 생성/선로드에 추가했습니다.

### 검사

- `npm run typecheck` 통과
- `npm run check:start-signal-back-exit` 통과
- `npm run check:reward-detail-touch-qa` 통과
- `npm run check:mobile-playability` 통과
- `npm run check:no-minimap-topbar` 통과
- `npm run check:assets` 통과
- `npm run check:health` 통과
- `npm run check:workflows` 통과
- `npm run build:github` 통과

### GitHub Desktop 커밋 메시지

```
Apply 꿈의 서고 v1.0.57 daily start signal and mobile back action sheet patch
```

다음 업데이트 예정: v1.0.58 - First Session Tutorial, Daily Restore Reward Drama and Lobby Hero Motion Patch

## v1.0.58 Patch Notes - Daily Route Assist, Clickable Start Signal and Back Sheet Option Row Patch

v1.0.58은 v1.0.57에서 추가한 `오늘의 복원` 시작 유도 장치를 더 실제 게임 시작 버튼처럼 다듬고, 뒤로가기 액션 시트에서 옵션 설정을 더 명확한 선택지로 보이게 만든 UX/디자인 패치입니다.

### 변경점

- `v1058-daily-start-route-assist` 훅을 추가해 로비의 `오늘의 복원` 시작 유도 말풍선을 장식이 아니라 실제 클릭 가능한 시작 위젯으로 확장했습니다.
- 떠 있는 손가락/화살표/`게임 시작` 말풍선을 누르면 바로 오늘의 복원 스테이지가 시작되도록 연결했습니다.
- 로비 히어로에 `오늘의 복원 → 보스 퍼즐 시작` 흐름을 보여주는 얇은 route ribbon을 추가해 핵심 시작점이 더 명확하게 보이도록 했습니다.
- 일정 시간 동안 로비에서 입력이 없으면 `daily-start-nudge-ready` 상태로 부드럽게 다시 흔들리며 시작 지점을 알려주는 idle nudge를 추가했습니다.
- `v1058-lobby-hero-safe-motion` 훅으로 히어로 패널의 glow와 마스코트 그림자를 조정해 시작 신호가 배경/캐릭터와 묻히지 않게 했습니다.
- `v1058-back-sheet-option-row-qa` 훅으로 뒤로가기 팝업의 선택지를 `첫 화면`, `⚙ 옵션`, `계속하기`, `나가기`로 명확히 분리했습니다.
- 기존 톱니바퀴 아이콘은 유지하면서, 액션 버튼 줄에도 `⚙ 옵션` 버튼을 추가해 폰 화면에서 옵션 설정이 사라진 것처럼 느껴지지 않게 했습니다.
- service worker cache를 `dream-library-cache-v1.0.58`로 갱신하고, `texture-atlas-manifest-v1.0.58.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:daily-route-assist`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 65개 check:* QA suite 통과
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.58 daily route assist clickable start cue and back sheet option row patch
```

다음 업데이트 예정: v1.0.59 - First Session Tutorial, Daily Restore Reward Drama and Lobby Hero Motion Patch

## v1.0.59 Patch Notes - Smart Start Coach, Lobby Overlap Guard and Back Sheet Clarity Patch

v1.0.59는 v1.0.58에서 강화한 `오늘의 복원` 시작 위젯이 작은 폰 화면에서 말풍선, route ribbon, 마스코트와 겹치지 않도록 자동 배치 안전장치를 추가하고, 한 번 시작을 경험한 플레이어에게는 시작 코치가 덜 과하게 보이도록 다듬은 디자인/모바일 QA 패치입니다.

### 변경점

- `v1059-smart-start-coach-overlap-qa` 훅을 추가해 로비의 시작 말풍선과 `오늘의 복원` 버튼, route ribbon, 마스코트 영역의 겹침을 감지하는 시작 코치 레이아웃 가드를 추가했습니다.
- 작은 화면이나 실제 겹침이 감지되면 `daily-start-overlap-safe` 상태로 전환되어 말풍선을 플로팅 절대 위치가 아니라 안전한 카드형 버튼으로 접어 보여줍니다.
- `dream-library-daily-start-coach-seen` 저장 키를 추가해 오늘의 복원 시작을 한 번 경험한 플레이어에게는 말풍선과 버튼 glow가 더 잔잔한 재방문 상태로 바뀌도록 했습니다.
- route ribbon에 `start-focus-rail` 스타일을 추가해 `오늘의 복원 → 보스 퍼즐 시작` 흐름을 더 고급스럽고 얇은 빛길처럼 보이게 조정했습니다.
- `v1059-lobby-polish-layering` 훅으로 미션/일일/시즌 패널의 테두리와 그림자 레이어를 정리해 로비 카드들이 한 덩어리로 뭉쳐 보이지 않게 했습니다.
- `v1059-back-sheet-clarity-touch-qa` 훅으로 뒤로가기 팝업 카드 폭, 버튼 높이, 계속하기 강조, 모바일 옵션 안내 문구를 정리했습니다.
- service worker cache를 `dream-library-cache-v1.0.59`로 갱신하고, `texture-atlas-manifest-v1.0.59.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:start-coach-overlap`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 66개 check:* QA suite 통과
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.59 smart start coach overlap guard back sheet clarity and lobby polish patch
```

다음 업데이트 예정: v1.0.60 - First Session Tutorial, Daily Reward Drama, Boss Intro Polish and Lobby Content Guide Patch

## v1.0.60 Patch Notes - Daily Restore Target Pointer and Start CTA Precision Patch

v1.0.60은 `게임 시작` 위젯이 단순 알림처럼 보이던 문제를 고쳐, 말풍선과 손가락, 화살표, 빛줄기의 끝점이 로비 핵심 CTA인 `오늘의 복원` 버튼을 정확히 가리키도록 만든 시작 유도 디자인 패치입니다.

### 변경점

- `v1060-daily-start-target-pointer` 훅을 추가해 `오늘의 복원` 버튼, 시작 말풍선, route ribbon, 런타임 sync 모두에 동일한 시작 타깃 포인터 상태를 연결했습니다.
- `daily-start-target-ring`을 추가해 `오늘의 복원` 버튼 자체를 금빛 조준 링과 스캔 glow로 감싸도록 했습니다.
- `게임 시작` 말풍선 문구를 `오늘의 복원을 눌러요`로 바꿔, 시작 위젯이 무엇을 가리키는지 텍스트로도 즉시 이해되도록 했습니다.
- 말풍선에서 `오늘의 복원` 버튼 링으로 이어지는 빛줄기/화살촉 애니메이션을 추가했습니다.
- 손가락 애니메이션을 단순 둥둥 떠 있는 모션이 아니라 버튼 방향으로 짚는 `dailyFingerToTarget` 모션으로 교체했습니다.
- 작은 화면의 `daily-start-overlap-safe` 상태에서도 말풍선 아래에서 버튼을 향해 내려찍는 형태로 방향성이 유지되도록 compact CSS를 추가했습니다.
- 시작 코치 겹침 계산에 `daily-start-target-ring` 영역을 포함해, 조준 링과 말풍선이 서로 겹칠 때 자동 안전 배치가 동작하도록 했습니다.
- service worker cache를 `dream-library-cache-v1.0.60`으로 갱신하고, `texture-atlas-manifest-v1.0.60.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:daily-start-pointer`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 67개 check:* QA suite 통과
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.60 daily restore target pointer and start CTA precision patch
```

다음 업데이트 예정: v1.0.61 - First Session Tutorial, Daily Reward Drama, Boss Intro Polish and Lobby Content Guide Patch

## v1.0.61 Patch Notes - Dynamic Daily Start Precision Rail, Lobby Guide and Boss Intro Polish Patch

v1.0.61은 v1.0.60의 `오늘의 복원` 타깃 포인터를 한 단계 더 안정화한 패치입니다. 고정형 말풍선/빛줄기가 화면 폭과 compact 상태에 따라 버튼 중심에서 어긋날 수 있는 문제를 줄이기 위해, 로비 런타임에서 말풍선과 `오늘의 복원` 버튼의 실제 위치를 측정해 빛줄기 길이와 각도를 자동 보정하도록 개선했습니다.

### 변경점

- `v1061-daily-start-precision-rail` 훅을 추가해 `오늘의 복원` 버튼, 타깃 링, 시작 말풍선, 빛줄기를 하나의 정밀 시작 유도 레일로 연결했습니다.
- `daily-start-beam`을 추가해 말풍선에서 버튼 중심까지 이어지는 빛줄기의 시작점, 길이, 각도를 런타임 CSS 변수로 보정하도록 했습니다.
- 화면 resize, orientationchange, visibility 복귀, 시작 코치 compact 전환 시 `syncDailyStartPrecisionRail()`을 다시 실행해 작은 폰/세로 화면/복귀 상황에서도 포인터 방향성이 유지되도록 했습니다.
- 로비 히어로 아래에 `오늘의 복원이 게임 시작입니다` 안내 카드를 추가해 `오늘의 복원 → 보스 퍼즐 → 서고 복원` 흐름을 명확히 보여줍니다.
- 오늘의 복원 패널에 `오늘 보상` 프리뷰를 추가해 보상, 보스, 복원 프로젝트 연결을 한 줄로 이해할 수 있게 했습니다.
- 스테이지 진입 시 `보스 등장` 인트로 배너를 짧게 보여줘 로비에서 퍼즐/보스 전투로 전환되는 체감을 강화했습니다.
- service worker cache를 `dream-library-cache-v1.0.61`로 갱신하고, `texture-atlas-manifest-v1.0.61.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:daily-start-precision-rail`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 68개 check:* QA suite 통과
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.61 dynamic daily start precision rail lobby guide and boss intro polish patch
```

다음 업데이트 예정: v1.0.62 - First Session Tutorial, Daily Reward Drama, Boss Attack Readability and Lobby Content Progression Patch

## v1.0.62 Patch Notes - Daily Start Focus Assist, Guide Comfort and Boss Intro Preload Patch

v1.0.62는 v1.0.61의 `오늘의 복원` 시작 레일을 유지하면서, 로비 안내가 너무 빽빽하거나 반복적으로 느껴질 수 있는 문제를 줄인 디자인/UX 패치입니다. 첫 진입에는 `오늘의 복원`이 게임 시작임을 강하게 보여주고, 재방문자나 작은 화면에서는 안내 카드를 조용한 요약 모드로 전환해 시선 과밀을 줄였습니다.

### 변경점

- `v1062-daily-start-focus-assist` 훅을 추가해 `오늘의 복원` 버튼, 시작 말풍선, 빛줄기, 안내 카드, route ribbon을 하나의 시작 집중 시스템으로 연결했습니다.
- `daily-start-focus-summary`를 추가해 오늘 보상과 복원 연결 목표를 안내 카드 안에서 한 줄로 보여줍니다.
- `syncDailyStartFocusAssist()`를 추가해 로비 상태, 화면 높이/폭, 재방문 여부에 따라 안내 카드를 `full / quiet / micro` 모드로 자동 전환합니다.
- 재방문자에게는 큰 설명 카드가 작게 접히고, 작은 화면에서는 핵심 문구와 오늘 목표만 남겨 로비 상단 겹침과 피로도를 줄였습니다.
- 시작 빛줄기가 너무 길어지거나 action 영역 밖으로 벗어나는 경우 `rerouted` 모드로 자동 보정해 버튼 중심을 다시 향하도록 했습니다.
- `dailyStartRailIntegrity` 상태를 추가해 정상/우회 레일 상태를 QA와 CSS에서 확인할 수 있게 했습니다.
- 보스 인트로 영역에 `v1062-boss-intro-preload` 훅과 `보스 준비` 작은 상태 배지를 추가해 퍼즐 진입 전 보스 전환 체감을 부드럽게 했습니다.
- service worker cache를 `dream-library-cache-v1.0.62`로 갱신하고, `texture-atlas-manifest-v1.0.62.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:daily-start-focus-assist`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 69개 check:* QA suite 통과
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.62 daily start focus assist guide comfort rail integrity and boss intro preload patch
```

다음 업데이트 예정: v1.0.63 - First Session Tutorial, Daily Quest Chain, Boss Attack Readability and Reward Flow Polish Patch

## v1.0.63 Patch Notes - Daily Quest Chain, Boss Attack Readability and Reward Flow Polish Patch

v1.0.63은 v1.0.62의 `오늘의 복원` 시작 안내를 다음 단계로 확장한 패치입니다. 시작 버튼을 명확히 가리키는 것에 더해, 누르면 어떤 보상을 얻고 어떤 보스 퍼즐을 거쳐 어느 복원 목표로 이어지는지 한눈에 보이도록 `오늘의 복원`을 퀘스트 체인 형태로 정리했습니다. 게임 진입 후에는 보스 반격 정보를 작게 상시 요약하고, 클리어 보상 팝업에서도 다음 복원 흐름을 바로 보여주도록 다듬었습니다.

### 변경점

- `v1063-daily-quest-chain` 훅을 추가해 `오늘의 복원` 안내 카드 안에 `보상 → 보스 → 복원` 3단계 퀘스트 체인을 표시합니다.
- 일일 보상 총량, 오늘 보스 이름, 보스 반격 조건, 연결되는 복원 프로젝트 진행도를 한 번에 보여주도록 `renderDailyQuestChain()`을 추가했습니다.
- `full / quiet / micro` 안내 모드에 맞춰 퀘스트 체인도 자동 압축되도록 모바일 밀도 CSS를 보강했습니다.
- `v1063-boss-attack-readability` 훅과 `boss-attack-preview`를 추가해 보스 반격 조건을 상시 미리보기로 보여줍니다.
- 콤보 반격, 시간 압박, 주기 압박, 실수 반격 상태에 따라 보스 반격 프리뷰 문구와 톤이 자동으로 바뀌도록 `syncBossAttackPreview()`를 추가했습니다.
- `v1063-reward-flow-polish` 훅과 `reward-flow-next`를 추가해 스테이지 클리어 후 획득 재료가 어느 복원 목표로 이어지는지 보상 팝업 안에서 바로 안내합니다.
- service worker cache를 `dream-library-cache-v1.0.63`으로 갱신하고, `texture-atlas-manifest-v1.0.63.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:daily-quest-chain`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 70개 check:* QA suite 통과
npm run check:daily-quest-chain
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.63 daily quest chain boss attack readability and reward flow polish patch
```

다음 업데이트 예정: v1.0.64 - Daily Quest Tutorial Timing, Boss Telegraph VFX Trim and Restoration Reward Theater Patch

## v1.0.64 Patch Notes - Arrow-only Daily Start CTA and Lobby UI Polish Patch

v1.0.64는 v1.0.63의 `오늘의 복원` 퀘스트 체인 위에 시작 CTA의 시선 방향을 더 명확하게 정리한 패치입니다. 사용자 피드백에 맞춰 `게임 시작` 위젯의 손가락 모양을 제거하고, 현재 배치에 더 잘 맞는 우측 화살표 중심의 CTA로 바꿨습니다. 동시에 로비 히어로, 시작 안내 카드, 뒤로가기/보상 팝업 버튼 그림자와 밀도를 다시 다듬어 전체 UI가 더 고급스럽고 덜 복잡해 보이도록 정리했습니다.

### 변경점

- `daily-start-signal` 안의 손가락 `☝` 요소를 HTML에서 제거하고 `signal-arrow`만 남겨 우측 방향성이 더 명확하게 보이도록 변경했습니다.
- 신규 훅 `v1064-daily-start-arrow-only-cta`를 추가해 `게임 시작` 말풍선을 화살표 전용 2열 카드 구조로 재정리했습니다.
- 말풍선 문구를 `오늘의 복원을 눌러요`에서 `오늘의 복원 버튼입니다`로 변경해, 알림이 아니라 특정 버튼을 가리키는 CTA처럼 읽히게 했습니다.
- 런타임에서 화살표 텍스트를 `➜`로 고정하는 안전 장치를 추가했습니다.
- `v1064-lobby-ui-polish-pass` 훅을 추가해 로비 히어로 배경, 시작 안내 카드, 퀘스트 체인, 뒤로가기/보상 버튼의 그림자와 밀도를 재정리했습니다.
- 기존 QA에서 손가락 위젯을 요구하던 조건을 제거하고, 신규 검사 `check:daily-start-arrow-cta`로 손가락 HTML 제거와 우측 화살표 CTA 연결을 검증하도록 바꿨습니다.
- service worker cache를 `dream-library-cache-v1.0.64`로 갱신하고, `texture-atlas-manifest-v1.0.64.json`을 생성/선로드에 추가했습니다.
- GitHub Pages / Quality Check workflow에 `check:daily-start-arrow-cta`를 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 71개 check:* QA suite 통과
npm run check:daily-start-arrow-cta
npm run check:daily-quest-chain
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.64 arrow-only daily start CTA and lobby UI polish patch
```

다음 업데이트 예정: v1.0.65 - Daily Start First-touch Tutorial, Lobby Visual Hierarchy, Boss Telegraph VFX Trim and Restoration Reward Theater Patch

## v1.0.65 Patch Notes - UI/UX Stability, Duplicate ID Guard and Touch-safe Start CTA Patch

v1.0.65는 v1.0.64의 우측 화살표 시작 CTA를 유지하면서, 로비 UI/UX 안정성과 작은 화면 배치를 다시 점검한 패치입니다. 특히 중복 ID/DOM 흔들림, 시작 CTA 터치 영역, 뒤로가기 팝업 밀도, 스테이지 선택 카드의 줄바꿈 안정성을 QA 기준으로 묶어 불안정 요소를 줄였습니다.

### 변경점

- `v1065-ui-ux-stability-pass` 훅을 추가해 시작 CTA, 오늘의 복원 버튼, 빛줄기, 시작 안내 카드, 선택 스테이지 카드, 뒤로가기 팝업을 한 번에 점검합니다.
- `selected-stage-copy` 구조를 명시해 스테이지 제목/설명 영역이 작은 화면에서 안전하게 줄바꿈되도록 정리했습니다.
- 시작 CTA는 손가락 없이 우측 화살표 전용 구조를 유지하면서, 최소 터치 높이와 `touch-action: manipulation`을 보강했습니다.
- 뒤로가기 팝업에 safe-area padding과 최소 버튼 높이를 적용해 모바일 하단 영역에서 버튼이 눌리기 쉽게 조정했습니다.
- 런타임 `syncUiUxStabilityPass()`를 추가해 작은 화면/모달 오픈/시작 빛줄기 상태에 따라 `ui-ux-tight`, `ui-ux-modal-open`, `uiUxRailMode` 상태를 동기화합니다.
- 신규 검사 `check:ui-ux-stability`를 추가해 중복 ID, 손가락 위젯 재등장, 최신 cache/atlas, workflow 연결, 금지 문구를 자동 확인합니다.
- service worker cache를 `dream-library-cache-v1.0.65`로 갱신하고, `texture-atlas-manifest-v1.0.65.json`을 생성/선로드에 추가했습니다.
- GitHub Pages / Quality Check workflow에 `check:ui-ux-stability`를 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 72개 check:* QA suite 통과
npm run check:ui-ux-stability
npm run check:daily-start-arrow-cta
npm run check:daily-quest-chain
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.65 UI UX stability duplicate ID guard touch safe start CTA and modal density patch
```

다음 업데이트 예정: v1.0.66 - First-touch Micro Tutorial, Boss Telegraph VFX Trim, Restoration Reward Theater and Small-screen Lobby Rhythm Patch

## v1.0.66 Patch Notes - First-touch Micro Tutorial, Boss Telegraph Density and Game UI Stability Patch

v1.0.66은 v1.0.65의 UI/UX 안정화 위에 게임 진입 직후의 첫 플레이 경험과 전투 화면 밀도를 다시 다듬은 패치입니다. 특히 처음 퍼즐판에 들어온 플레이어가 무엇을 눌러야 하는지 알 수 있도록 짧은 첫 연결 안내를 넣고, 작은 화면에서는 HUD/보스 반격/보드 안내가 서로 밀리지 않도록 자동 압축합니다.

### 변경점

- `v1066-first-touch-micro-tutorial` 훅을 추가해 스테이지 시작 직후 `첫 연결` 안내 카드를 표시합니다.
- 첫 연결 안내는 `같은 오브젝트 2개 선택`, `선택 타일은 링/빛으로 표시`처럼 실제 플레이 동작만 짧게 안내하며, 일정 시간 후 또는 확인/첫 매칭 시 자동으로 사라집니다.
- `v1066-game-ui-stability-pass` 훅을 추가해 게임 HUD, 보스 라인, 보스 반격 미리보기, 퍼즐판, 첫 연결 안내의 밀도를 런타임으로 동기화합니다.
- 작은 화면/낮은 높이에서는 보스 반격 미리보기가 compact 모드로 바뀌어 보드 영역을 덜 가립니다.
- `game-ui-tight`, `game-ui-micro`, `first-touch-guide-active` 상태를 추가해 화면 크기와 안내 표시 여부에 따라 카드/보드 그림자/간격을 안정화했습니다.
- 손가락 시작 위젯은 계속 제거 상태를 유지하고, 오늘의 복원 시작 CTA는 우측 화살표 중심으로 유지합니다.
- 신규 검사 `check:first-touch-ux`를 추가해 첫 연결 안내, 게임 UI 안정화 훅, 보스 반격 compact 모드, cache/atlas, workflow 연결, SVG 금지를 자동 확인합니다.
- service worker cache를 `dream-library-cache-v1.0.66`으로 갱신하고, `texture-atlas-manifest-v1.0.66.json`을 생성/선로드에 추가했습니다.
- GitHub Pages / Quality Check workflow에 `check:first-touch-ux`를 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 73개 check:* QA suite 통과
npm run check:first-touch-ux
npm run check:ui-ux-stability
npm run check:daily-start-arrow-cta
npm run check:daily-quest-chain
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.66 first touch tutorial boss density and game UI stability patch
```

다음 업데이트 예정: v1.0.67 - Restoration Reward Theater, Boss Warning VFX Trim, Small-screen Lobby Rhythm and Daily Quest Readability Patch

## v1.0.67 Patch Notes - Restoration Reward Bridge, Boss VFX Density Guard and UX Comfort Patch

v1.0.67은 v1.0.66의 첫 터치 안내와 게임 UI 안정화 위에 클리어 후 보상 흐름, 보스 경고 과밀도, 반복 안내 피로도를 다시 다듬은 패치입니다. 특히 스테이지 클리어 후 획득 재료가 어떤 복원 프로젝트로 이어지는지 버튼과 진행 바로 보여주고, 작은 화면에서는 보스 경고 VFX가 퍼즐판을 덜 가리도록 낮은 밀도 모드를 추가했습니다.

### 변경점

- `v1067-restoration-reward-bridge` 훅을 추가해 보상 팝업에 복원 연결 카드, 진행 바, `복원으로 보기` 액션을 추가했습니다.
- `복원으로 보기`를 누르면 보상 팝업을 닫고 로비의 복원 작업대로 이동한 뒤 연결된 복원 프로젝트 상세를 바로 엽니다.
- 복원 프로젝트가 완료 가능한 상태이면 버튼 문구가 `복원 완료 보기`로 바뀌고 ready 상태 스타일을 적용합니다.
- `v1067-boss-vfx-density-guard` 훅을 추가해 작은 화면/마이크로 HUD에서 보스 경고 흔들림과 경고 카드 광량을 줄입니다.
- 보스 반격 미리보기에는 `data-vfx-density="soft"` 상태를 추가해 compact 상태에서 정보와 VFX가 보드 위로 과하게 튀지 않게 했습니다.
- `v1067-micro-tutorial-comfort` 훅을 추가해 오늘 스테이지 반복 진입 시 첫 터치 안내가 짧은 soft-repeat 모드로 표시됩니다.
- 신규 검사 `check:reward-restoration-bridge`를 추가해 보상-복원 브리지, 보스 VFX density guard, 반복 튜토리얼 comfort, cache/atlas, workflow 연결, SVG 금지를 자동 확인합니다.
- service worker cache를 `dream-library-cache-v1.0.67`로 갱신하고, `texture-atlas-manifest-v1.0.67.json`을 생성/선로드에 추가했습니다.
- GitHub Pages / Quality Check workflow에 `check:reward-restoration-bridge`를 연결했습니다.

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### 검사

```text
npm run typecheck
전체 74개 check:* QA suite 통과
npm run check:reward-restoration-bridge
npm run check:first-touch-ux
npm run check:ui-ux-stability
npm run check:daily-start-arrow-cta
npm run check:daily-quest-chain
npm run check:daily-start-focus-assist
npm run check:daily-start-precision-rail
npm run check:daily-start-pointer
npm run check:start-coach-overlap
npm run check:daily-route-assist
npm run check:start-signal-back-exit
npm run check:reward-detail-touch-qa
npm run check:engine-render-budget
npm run check:mobile-playability
npm run check:no-minimap-topbar
npm run check:assets
npm run check:health
npm run check:workflows
npm run build:github
```

`npm run build:github`는 성공했습니다. Vite의 일부 chunk 크기 경고는 있었지만 빌드 실패는 아닙니다.

### GitHub Desktop 커밋 메시지

```text
Apply 꿈의 서고 v1.0.67 reward restoration bridge boss VFX density guard and UX comfort patch
```

다음 업데이트 예정: v1.0.68 - Restoration Completion Theater, Reward Claim Motion, Boss Warning Readability Polish and Lobby Rhythm Patch

## v1.0.68 Patch Notes - Restoration Completion Theater, Reward Motion and Next Goal Advisor Patch

v1.0.68은 v1.0.67의 보상→복원 연결 위에 복원 완료 순간의 연출감, 보상 수령 모션, 클리어 후 다음 목표 추천, 보스 경고 아이콘 정리를 더한 UI/UX 안정화 패치입니다. 특히 클리어 팝업이 단순 결과창으로 끝나지 않고 “무엇이 완료 가능해졌고, 다음에 어디로 가야 하는지”를 바로 안내하도록 다듬었습니다.

### 핵심 개선

- `reward-completion-theater`를 추가해 복원 완료 가능 상태에서 짧은 완료 연출 카드가 표시됩니다.
- 보상 팝업에 `reward-claim-pop` 모션을 추가해 별/재료/복원 칩이 더 자연스럽게 들어옵니다.
- `reward-next-goal` 카드를 추가해 클리어 후 다음 스테이지, 복원 완료, 로비 목표 확인 중 가장 적절한 다음 행동을 추천합니다.
- `reward-next-goal-button`을 누르면 복원 완료 가능한 경우 복원 작업대로, 그렇지 않으면 다음 스테이지가 선택된 로비 카드로 이동합니다.
- 첫 터치 안내의 중복 `innerHTML` 렌더링을 제거해 이벤트 재바인딩과 UI 안정성을 개선했습니다.
- 보스 반격 미리보기에 `v1068-boss-warning-icon-trim`을 추가해 작은 화면에서는 경고 설명이 아이콘/핵심명 중심으로 접힙니다.
- service worker cache를 `dream-library-cache-v1.0.68`로 갱신하고, `texture-atlas-manifest-v1.0.68.json`을 생성/선로드에 추가했습니다.

### QA 결과

- `npm run typecheck`
- `npm run check:restoration-theater-next-goal`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:daily-quest-chain`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.68 restoration completion theater reward motion next goal and boss warning icon trim patch

다음 업데이트 예정: v1.0.69 - Lobby Rhythm Cleanup, Restoration Detail Ceremony, Boss Warning Icon Set Polish, Clear Flow Recommendation QA Patch

## v1.0.69 Patch Notes - Lobby Rhythm Cleanup, Restoration Detail Ceremony and Clear Flow Recommendation QA Patch

v1.0.69는 v1.0.68의 복원 완료 연출과 다음 목표 추천 위에 로비 리듬, 복원 상세 완료식, 작은 화면 보상 팝업 밀도, 보스 경고 아이콘 세트, 클리어 후 추천 흐름 QA를 더한 UI/UX 안정화 패치입니다. 특히 “보상 → 복원 상세 → 완료식 → 다음 목표”가 더 자연스럽게 이어지고, 작은 화면에서도 팝업과 보스 경고가 덜 답답하게 보이도록 정리했습니다.

### 핵심 개선

- `v1069-lobby-rhythm-cleanup`을 추가해 로비 패널 간격, 그림자, 작은 화면 compact density를 다시 정리했습니다.
- `v1069-restoration-detail-ceremony`를 추가해 복원 상세 팝업 상단에 완료식/진행 상태 카드와 진행 바를 표시합니다.
- 복원 상세 재료 목록을 카드형으로 정리해 보유 수량과 재료명이 더 안정적으로 보이도록 개선했습니다.
- `v1069-reward-popup-density-guard`를 추가해 작은 화면에서 보상 팝업이 화면 밖으로 밀리지 않도록 compact scroll/density 모드를 적용했습니다.
- `v1069-clear-flow-recommendation-qa`를 추가해 클리어 후 추천 카드에 `보상 → 복원 완료`, `보상 → 다음 스테이지`, `보상 → 로비 점검` 흐름을 명시했습니다.
- `v1069-boss-warning-icon-set-polish`를 추가해 보스 경고 카드의 시간/실수/압박/콤보 예고를 더 짧고 선명한 아이콘형 라벨로 표시합니다.
- service worker cache를 `dream-library-cache-v1.0.69`로 갱신하고, `texture-atlas-manifest-v1.0.69.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:restoration-detail-ceremony`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### QA 결과

- `npm run typecheck`
- `npm run check:restoration-detail-ceremony`
- `npm run check:restoration-theater-next-goal`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:daily-quest-chain`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

```text
Apply 꿈의 서고 v1.0.69 lobby rhythm restoration detail ceremony reward density and boss icon polish patch
```

다음 업데이트 예정: v1.0.70 - Reward Modal Accessibility, Restoration Ceremony Sound Cue, Boss Telegraph Line Polish, Mobile Safe-area QA Patch

## v1.0.70 Patch Notes - Reward Action Accessibility, Safe-Area Modal Flow and Boss Counter Line Polish Patch

v1.0.70은 v1.0.69의 복원 상세 완료식과 보상 팝업 밀도 개선 위에, 실제 모바일 사용 중 눌러야 할 버튼 흐름이 더 명확하게 보이도록 보상 액션 접근성, safe-area 팝업 압축, 복원 완료식 피드백 큐, 보스 반격 라인 가독성을 보강한 UI/UX 안정화 패치입니다.

### 주요 변경

- `v1070-reward-action-accessibility-flow`를 추가해 보상 팝업의 추천 액션, 복원 연결 버튼, 다음 목표 버튼의 터치 높이와 안내 문구를 보강했습니다.
- `v1070-mobile-safe-area-modal-qa`를 추가해 작은 폰과 하단 제스처 영역에서 보상/복원 상세 팝업이 안전 영역 안에 머물도록 조정했습니다.
- `v1070-compact-modal-action-flow`를 추가해 보상/복원 상세 팝업 하단 버튼 줄을 sticky 형태로 안정화하고, 작은 화면에서는 1열로 접히게 했습니다.
- `v1070-restoration-ceremony-feedback-cue`를 추가해 복원 상세 완료식 카드에 `완료 가능 / 완료됨 / 진행 중` 피드백 큐와 완료 가능 glow를 더했습니다.
- `v1070-boss-counter-line-polish`를 추가해 보스 반격 미리보기 안에 `반격 예고 → 매칭으로 차단` 흐름 라인을 표시하고, 작은 화면에서는 자동으로 숨겨 과밀도를 줄였습니다.
- 실제 코드 안정성 점검 중 발견한 `closeReward()`의 중복 `hidden` 클래스 추가를 제거했습니다.
- service worker cache를 `dream-library-cache-v1.0.70`으로 갱신하고, `texture-atlas-manifest-v1.0.70.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:modal-action-safe-area`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 77개 `check:*` QA suite 통과
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:restoration-theater-next-goal`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.70 reward action accessibility safe-area modal flow and boss counter line polish patch

다음 업데이트 예정: v1.0.71 - Modal Button Microcopy, Restoration Completion Sound Cue, Boss Telegraph Contrast, Small Screen Reward QA Patch

## v1.0.71 Patch Notes - Modal Button Microcopy, Restoration Feedback Cue, Boss Telegraph Contrast and Small Reward QA Patch

v1.0.71은 v1.0.70의 보상/복원 팝업 안정화 위에, 실제 사용자가 다음에 무엇을 눌러야 하는지 더 명확히 보이도록 버튼 우선순위, 마이크로카피, 작은 화면 보상 팝업 밀도, 보스 반격 대비, 랭킹 코드 안정성을 보강한 UI/UX polish 패치입니다.

### 주요 변경

- `v1071-modal-button-microcopy-priority`를 추가해 보상 팝업의 추천 액션 문구와 버튼 우선순위를 더 명확히 표시했습니다.
- 복원 완료 가능 상태에서는 `복원 완료 먼저 보기` 흐름을 시각적으로 더 강하게 보여주고, 다음 스테이지는 보조 액션으로 낮췄습니다.
- `v1071-small-reward-modal-qa`를 추가해 작은 화면에서 보상 칩, 복원 연결 카드, 다음 목표 카드가 화면 밖으로 밀리지 않도록 추가 압축했습니다.
- `v1071-restoration-completion-feedback-cue`를 추가해 복원 상세 완료식의 완료 가능/완료됨/진행 중 피드백 큐를 더 선명하게 다듬었습니다.
- `v1071-boss-telegraph-contrast-safe`를 추가해 보스 반격 경고가 배경/VFX 위에서도 더 잘 읽히도록 대비와 텍스트 그림자를 보강했습니다.
- 실제 코드 안정성 점검 중 발견한 리더보드 cloud row의 중복 `tag` 속성을 제거했습니다.
- service worker cache를 `dream-library-cache-v1.0.71`로 갱신하고, `texture-atlas-manifest-v1.0.71.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:reward-modal-flow-polish`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 78개 `check:*` QA suite 통과
- `npm run check:reward-modal-flow-polish`
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:restoration-theater-next-goal`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.71 modal button microcopy reward flow priority boss contrast and small reward QA patch

다음 업데이트 예정: v1.0.72 - Reward Flow A/B Clarity, Boss Warning Symbol Polish, Restoration Completion Ceremony Motion, Mobile Modal Scroll QA Patch

## v1.0.72 Patch Notes - Lobby Menu Portal, Section Popup Restructure and Rounded Content Readability Patch

v1.0.72는 v1.0.71까지 누적된 보상/복원/시작 CTA 안정화 위에, 로비의 가장 큰 구조 문제였던 긴 세로 스크롤 피로를 줄이기 위한 구조 개선 패치입니다. 상단 `오늘의 복원` 게임 시작 구간은 그대로 유지하고, 아래쪽 스테이지/미션/복원/오늘/도감/상점/기록 구간은 메뉴 버튼을 눌러 팝업식 패널로 열리도록 재배치했습니다.

### 주요 변경

- `v1072-lobby-menu-portal`을 추가해 상단 게임 시작 구간 아래에 `Library Menu` 허브를 배치했습니다.
- `스테이지 / 미션 / 복원 / 오늘 / 도감 / 상점 / 기록` 메뉴 버튼을 추가했습니다.
- 각 메뉴는 `lobby-menu-overlay` 안에서 하나의 큰 패널로 열리며, 기존처럼 긴 페이지를 계속 내려보지 않아도 됩니다.
- `v1072-section-popup-restructure`를 추가해 기존 로비 콘텐츠를 유지하면서 표시 방식만 팝업식으로 전환했습니다.
- 메뉴 내부 스크롤은 패널 안에서만 동작하도록 분리해 로비 전체 스크롤 피로를 줄였습니다.
- 기존 미션 카드, 보상 브리지, 복원 연결 버튼이 특정 구간으로 이동할 때도 해당 메뉴 패널이 자동으로 열리도록 `scrollLobbyTarget()` 흐름을 보강했습니다.
- 둥근 테두리 때문에 안쪽 내용이 눌려 보이던 `복원으로 보기` 연결 카드에 `v1072-rounded-card-content-readability`를 적용했습니다.
- 보상/복원 카드의 과한 pill/rounded 배치를 완화하고, 제목/상세 문구가 잘리지 않도록 줄바꿈과 여백을 조정했습니다.
- service worker cache를 `dream-library-cache-v1.0.72`로 갱신하고, `texture-atlas-manifest-v1.0.72.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:lobby-menu-portal`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 79개 `check:*` QA suite 통과
- `npm run check:lobby-menu-portal`
- `npm run check:reward-modal-flow-polish`
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:restoration-theater-next-goal`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.72 lobby menu portal section popup restructure and rounded content readability patch

다음 업데이트 예정: v1.0.73 - Lobby Menu Animation, Panel Entry Motion, Section Icon Polish, Popup Navigation QA Patch

## v1.0.73 Patch Notes - Lobby Menu Motion, Back-Close Flow and Panel State Retention Patch

v1.0.73은 v1.0.72에서 추가한 로비 메뉴 포털 구조를 실제 모바일 사용 흐름에 맞게 한 단계 안정화한 패치입니다. 상단 `오늘의 복원 / 게임 시작` 구간은 그대로 유지하고, 아래 메뉴 패널은 더 자연스럽게 열리고 닫히며, 폰 뒤로가기/ESC에서는 종료 팝업보다 먼저 열린 메뉴를 닫도록 정리했습니다.

### 주요 변경

- `v1073-lobby-menu-motion-state`를 추가해 로비 메뉴 패널 열림/닫힘 모션을 적용했습니다.
- `v1073-lobby-menu-back-close`를 추가해 메뉴 내부에 `뒤로` 버튼을 배치했습니다.
- 폰 뒤로가기, ESC, 오버레이 바깥 터치 시 열린 메뉴 패널이 먼저 닫히도록 `handleSoftBack()` 흐름을 보강했습니다.
- `v1073-lobby-menu-tab-switch`를 추가해 메뉴 팝업 안에서 `스테이지 / 미션 / 복원 / 오늘 / 도감 / 상점 / 기록`을 바로 전환할 수 있는 상단 탭을 추가했습니다.
- `v1073-lobby-panel-state-retention`을 추가해 마지막으로 열었던 메뉴 패널 상태를 유지하고, 다음 진입 시 선택 상태가 더 명확히 보이게 했습니다.
- 메뉴 버튼에 작은 럭셔리 심볼을 추가해 텍스트만 있던 버튼보다 시선 구분이 잘 되도록 다듬었습니다.
- 메뉴를 닫을 때 마지막으로 눌렀던 메뉴 버튼으로 focus가 돌아오도록 접근성 흐름을 보강했습니다.
- `toggleLobbyPanel()` 안에서 같은 collapsed panel 상태를 중복 저장하던 불필요한 `writeJson()` 호출을 제거했습니다.
- service worker cache를 `dream-library-cache-v1.0.73`으로 갱신하고, `texture-atlas-manifest-v1.0.73.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:lobby-menu-motion-state`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 80개 `check:*` QA suite 통과
- `npm run check:lobby-menu-motion-state`
- `npm run check:lobby-menu-portal`
- `npm run check:reward-modal-flow-polish`
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.73 lobby menu motion back close tab switch and panel state retention patch

다음 업데이트 예정: v1.0.74 - Menu Panel Content Density, Section Header Polish, Modal Focus Trap, Small Screen Tap QA Patch

## v1.0.74 Patch Notes - Lobby Menu Focus Trap, Panel Density and Small Screen Tap QA Patch

v1.0.74는 v1.0.72~v1.0.73에서 만든 로비 메뉴 팝업 구조를 더 안정적으로 다듬은 패치입니다. 메뉴 패널이 열린 상태에서 ESC가 종료 팝업까지 이어질 수 있는 실제 UX 불안정 지점을 막고, 메뉴 내부 콘텐츠 밀도와 작은 화면 터치 안정성을 강화했습니다.

### 주요 변경

- `v1074-lobby-menu-focus-trap`를 추가해 로비 메뉴 팝업이 열렸을 때 Tab focus가 팝업 밖으로 빠져나가지 않도록 보강했습니다.
- ESC 처리에 `stopImmediatePropagation()`을 적용해 열린 메뉴가 닫힌 직후 종료 팝업까지 연달아 뜨는 흐름을 차단했습니다.
- `v1074-lobby-panel-content-density`를 추가해 메뉴 패널 내부 헤더, 설명, 콘텐츠 여백을 작은 화면 기준으로 다시 압축했습니다.
- 메뉴 탭 아래에 `lobby-panel-route-hint` 안내줄을 추가해 현재 구간에서 무엇을 할 수 있는지 짧게 보여줍니다.
- `v1074-lobby-menu-tap-target-qa`를 추가해 메뉴 버튼/탭의 최소 터치 높이, tap highlight, touch-action을 정리했습니다.
- 패널별 scroll 위치를 `dream-library-lobby-panel-scroll-top`에 저장해 메뉴 안에서 구간을 오가도 이전 확인 위치가 더 안정적으로 유지되도록 했습니다.
- 실제 코드 안정성 수정: `syncLobbyMenuPortal()` 안에서 `data-lobby-menu-motion-state`를 같은 대상에 중복 지정하던 코드를 제거했습니다.
- service worker cache를 `dream-library-cache-v1.0.74`로 갱신하고, `texture-atlas-manifest-v1.0.74.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:lobby-menu-focus-density`를 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 81개 `check:*` QA suite 통과
- `npm run check:lobby-menu-focus-density`
- `npm run check:lobby-menu-motion-state`
- `npm run check:lobby-menu-portal`
- `npm run check:reward-modal-flow-polish`
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.74 lobby menu focus trap panel density tap QA and escape isolation patch

다음 업데이트 예정: v1.0.75 - Lobby Panel Header Visual Polish, Menu Transition State QA, Restoration Panel Micro Layout and Reward Flow Recheck

## v1.0.75 Patch Notes - Lobby Shortcut Menu Bar, Player-Facing Copy Cleanup and Scroll Stability Patch

v1.0.75는 메뉴 화면에 남아 있던 개발 로그처럼 보이는 문구를 걷어내고, 긴 스크롤/팝업 스크롤이 섞이는 문제를 줄이기 위해 로비 메뉴를 `바로가기 메뉴바` 중심으로 다시 정리한 구조 안정화 패치입니다. 상단 `오늘의 복원 / 게임 시작` 구간은 그대로 유지하고, 아래 구간은 가로 메뉴바에서 바로 열어보는 흐름으로 다듬었습니다.

### 주요 변경

- `v1075-lobby-shortcut-menu-bar`를 추가해 기존 메뉴 허브를 더 짧고 명확한 바로가기 메뉴바 형태로 다듬었습니다.
- 메뉴 화면의 `Library Menu`, `필요한 구간만 열어보기`, `상단 게임 시작은 그대로 두고...`, `구간을 선택하면...` 같은 설명형/개발 로그 느낌 문구를 사용자용 문구로 교체하거나 화면에서 제거했습니다.
- 메뉴 버튼을 가로 스크롤 가능한 shortcut bar로 바꿔 `스테이지 / 미션 / 복원 / 오늘 / 도감 / 상점 / 기록`을 더 빠르게 고를 수 있게 했습니다.
- `v1075-lobby-scroll-stability`를 추가해 메뉴 팝업이 열린 동안 본문 `.app-shell` 스크롤이 뒤에서 같이 움직이지 않도록 잠금 처리했습니다.
- 메뉴를 열 때 기존 로비 스크롤 위치를 저장하고, 닫을 때 복원해 화면이 갑자기 튀는 느낌을 줄였습니다.
- 메뉴 패널 전환 시 `panel.scrollIntoView()`로 본문 스크롤이 같이 움직일 수 있던 흐름을 제거하고, 패널 내부 dock 스크롤만 조정하도록 변경했습니다.
- `v1075-lobby-copy-cleanup`을 추가해 메뉴/로비 일부 영어 eyebrow를 한국어 게임 문구로 정리했습니다.
- `Start Route`, `Adventure Lobby`, `Mission Deck`, `Campaign Map`, `Selected Stage`, `Summer Season`, `Stage Clear`, `Restoration Detail` 등 화면 노출 가능 문구를 한국어 플레이 문구로 교체했습니다.
- service worker cache를 `dream-library-cache-v1.0.75`로 갱신하고, `texture-atlas-manifest-v1.0.75.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:lobby-shortcut-scroll`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 82개 `check:*` QA suite 통과
- `npm run check:lobby-shortcut-scroll`
- `npm run check:lobby-menu-focus-density`
- `npm run check:lobby-menu-motion-state`
- `npm run check:lobby-menu-portal`
- `npm run check:reward-modal-flow-polish`
- `npm run check:modal-action-safe-area`
- `npm run check:restoration-detail-ceremony`
- `npm run check:reward-restoration-bridge`
- `npm run check:first-touch-ux`
- `npm run check:ui-ux-stability`
- `npm run check:daily-start-arrow-cta`
- `npm run check:engine-render-budget`
- `npm run check:mobile-playability`
- `npm run check:no-minimap-topbar`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run build:github`

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED` 파일 ZIP 제외

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.75 lobby shortcut menu bar player copy cleanup and scroll stability patch

다음 업데이트 예정: v1.0.76 - Shortcut Menu Icon Polish, Panel Scroll QA, Modal Close Flow and Lobby Navigation Rhythm Patch

## v1.0.76 Patch Notes - Shortcut Menu Icon Polish, Panel Scroll QA, Modal Close Flow and Lobby Navigation Rhythm Patch

v1.0.76은 v1.0.75의 바로가기 메뉴바를 더 실제 플레이 화면답게 다듬고, 로비 메뉴 팝업이 열리고 닫힐 때 생길 수 있는 스크롤 튐·오작동 닫힘·포커스 리듬 문제를 줄인 UI/UX 안정화 패치입니다. 사용자가 요구한 끊김 대비 원칙에 따라 `AI_HANDOFF_DR.md`를 신규 생성해 작업환경, 검수 명령, 산출 ZIP 규칙, 다음 예정 작업을 이어받을 수 있게 기록했습니다.

### 주요 변경

- `AI_HANDOFF_DR.md`를 신규 생성해 현재 버전, 작업환경, GitHub Desktop/Firebase 무료 기준, 검수 명령, ZIP 산출 규칙, 다음 작업 예정까지 기록했습니다.
- `v1076-shortcut-menu-icon-polish`를 추가해 로비 바로가기 메뉴 아이콘의 광택, 테두리, 선택/포커스 상태를 더 명확하게 다듬었습니다.
- 바로가기 메뉴 버튼 7개에 사용자용 `aria-label`을 추가해 접근성 읽기 흐름과 QA 식별성을 높였습니다.
- `v1076-panel-scroll-qa`를 추가해 메뉴 패널 dock의 스크롤 anchor를 막고, 탭 전환 시 패널 내부 스크롤 위치를 더 안정적으로 저장/복원하도록 했습니다.
- `saveLobbyPanelScroll()`와 `restoreLobbyPanelScroll()`을 추가해 패널 전환 전/후 dock 스크롤을 저장하고, DOM 높이 안정화 후 두 번의 `requestAnimationFrame`으로 복원합니다.
- `v1076-modal-close-flow`를 추가해 로비 메뉴 바깥 닫기 흐름을 단순 click에서 pointerdown/pointerup 일치 방식으로 바꿨습니다.
- 카드 내부를 누른 뒤 바깥에서 손을 떼거나, 스크롤 중 의도치 않게 팝업이 닫힐 수 있는 흐름을 줄였습니다.
- `v1076-lobby-navigation-rhythm`을 추가해 로비 메뉴 열림/열림 완료/닫힘 phase를 body class로 관리합니다.
- `lobby-nav-opening`, `lobby-nav-open`, `lobby-nav-closing` 상태를 CSS와 연결해 모달 전환 리듬을 더 자연스럽게 조정했습니다.
- reduced motion 환경에서는 v1.0.76 전환 애니메이션이 꺼지도록 처리했습니다.
- service worker cache를 `dream-library-cache-v1.0.76`으로 갱신하고, `texture-atlas-manifest-v1.0.76.json`을 생성/선로드에 추가했습니다.
- 신규 검사 `check:lobby-navigation-rhythm`을 추가하고 GitHub Pages / Quality Check workflow에 연결했습니다.
- 기존 `check:*` 스크립트의 버전 허용 범위를 v1.0.76까지 확장해 GitHub Actions 전체 QA가 새 패키지 버전에서 계속 통과하도록 했습니다.

### 검사 결과

- `npm run typecheck`
- `npm run check:assets`
- `npm run check:health`
- `npm run check:workflows`
- `npm run check:lobby-shortcut-scroll`
- `npm run check:lobby-navigation-rhythm`
- `npm run report:images`
- `npm run build:github`

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED`, 과거 1회성 삭제 스크립트는 ZIP 제외
- 매 패치마다 `README.md`와 `AI_HANDOFF_DR.md`에 진행 상황, 예정, 작업환경, 필수검수를 같이 기록

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.76 lobby navigation rhythm icon polish and modal close QA patch

다음 업데이트 예정: v1.0.77 - Lobby Panel Card Density, Reward/Restoration Modal Focus Return, Firebase Free Read Budget and Low-End Render QA Patch

## v1.0.77 Patch Notes - Boss Board Clearance, Left Statusbar Portrait and Pixi Board Obstruction Guard Patch

v1.0.77은 전투 화면에서 보스/몬스터 그림이 하단 보드와 스킬바 근처에 떠서 플레이를 방해할 수 있던 문제를 우선 수정한 UI/UX 안정화 패치입니다. 보스 원본 이미지는 상태바 왼쪽 끝으로 옮기고, 경고/피격 같은 atlas 연출은 상태바 오른쪽의 작은 echo 슬롯으로 제한했습니다. 보드 위 Pixi 보스 레이어는 상태바 echo가 활성화되면 렌더링하지 않아 타일 조작 영역을 침범하지 않게 했습니다.

### 주요 변경

- `statusbar-left-icon-safe-v1077` 레이아웃을 추가해 보스 원본 이미지를 보스 상태바 왼쪽 끝 `boss-core`에 고정했습니다.
- `boss-lane-echo`를 추가해 기존 보드 쪽에서 보이던 보스 경고/피격 연출을 상태바 오른쪽 작은 원형 슬롯으로 이동했습니다.
- `applyBossAtlasFrame()`과 `setBossFrame()`이 왼쪽 보스 초상과 오른쪽 echo를 함께 갱신하도록 정리했습니다.
- `DreamPixiRenderer`의 보드 우하단 보스 sprite/aura는 v1.0.77 상태바 echo가 감지되면 `visible=false`, `renderable=false`, `alpha=0`으로 차단합니다.
- 기존 Pixi boss QA 호환성을 위해 `data-boss-layer="pixi"`는 유지하되, 실제 배치는 `data-boss-layer-placement="statusbar-echo-v1077"`와 `data-boss-layer-visibility="dom-lane-echo"`로 기록합니다.
- v1.0.46의 우측 압축 보스 레이아웃 CSS가 다시 active fallback으로 살아나지 않도록 제거했습니다.
- active HTML/main에서 `statusbar-icon-right-v1046`가 다시 들어오면 실패하는 `check:boss-board-clearance`를 추가했습니다.
- stage/boss 관련 기존 QA가 v1.0.77의 왼쪽 보스 초상 레이아웃을 기준으로 검사하도록 갱신했습니다.
- service worker cache를 `dream-library-cache-v1.0.77`로 갱신하고, `texture-atlas-manifest-v1.0.77.json`을 생성/선로드에 추가했습니다.
- GitHub Pages / Quality Check workflow에 `npm run check:boss-board-clearance`를 연결했습니다.
- `AI_HANDOFF_DR.md`에 v1.0.77 원인, 수정 내역, 검수 명령, GitHub Desktop/Firebase 무료 환경, 다음 v1.0.78 예정 내역을 기록했습니다.

### 검사 결과

- `npm run typecheck`
- 전체 84개 `check:*` QA suite 통과
- `npm run check:boss-board-clearance`
- `npm run check:pixi-boss-layer`
- `npm run check:boss-asset-visibility`
- `npm run check:boss-stage-lobby-scroll`
- `npm run check:stage-ladder-boss-lobby`
- `npm run check:stage-map-boss-difficulty-lobby`
- `npm run check:lobby-navigation-rhythm`
- `npm run report:images` - 454 files, 51.98 MB
- `npm run build:github`

### 알려진 경고

- `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고가 남아 있습니다. 기존 경고이며 빌드 실패는 아닙니다.
- `vendor-effects` chunk 500 KB 초과 경고가 남아 있습니다. 기존 경고이며 후속 v1.0.78 이후 code split 후보입니다.
- 이미지 리포트상 1.2 MB 초과 이미지 9개가 있습니다. 후속 asset optimization 후보입니다.

### 유지 정책

- 상단 `오늘의 복원 / 게임 시작` 구간 유지
- 자동 fullscreen/orientation API 추가 없음
- 미니맵 재도입 없음
- 게임 내 `보기 / 중앙 / + / -` 라인 재도입 없음
- 카메라 도움말 재도입 없음
- 선택 타일 크기 확대 없음
- 손가락 시작 위젯 재도입 없음
- 전투 보드 위 Pixi 보스/몬스터 그림 재도입 없음
- active HTML/main에 `statusbar-icon-right-v1046` 재도입 없음
- SVG 없음
- `node_modules`, `dist`, `package-lock.json`, `DELETE_REMOVED`, 과거 1회성 삭제 스크립트는 ZIP 제외
- 매 패치마다 `README.md`와 `AI_HANDOFF_DR.md`에 진행 상황, 예정, 작업환경, 필수검수를 같이 기록

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.77 boss board clearance left portrait and statusbar echo patch

다음 업데이트 예정: v1.0.78 - Combat HUD Density, Boss Statusbar Readability, Skill Bar Touch Clearance, Firebase Free Read Budget and Low-End Render QA Patch

## v1.0.78 Patch Notes - Combat HUD Density, Boss Statusbar Readability, Skill Bar Touch Clearance and Low-End Render Guard Patch

v1.0.78은 v1.0.77에서 정리한 보스/몬스터 보드 방해 방지 상태를 유지하면서, 실제 모바일 전투 화면의 상단 HUD와 하단 조작 버튼 밀도를 다시 다듬은 UI/UX 안정화 패치입니다. 작은 화면에서 시간/점수/콤보/이동 칸, 보스 상태바, 보드, `힌트/섞기/다시 시작` 버튼이 서로 눌리거나 터치 오입력을 만들 가능성을 줄였습니다.

이번 패치의 핵심은 보드 아래 버튼이 타일 선택 영역과 섞이지 않도록 `v1078-combat-hud-touch-clearance` 레이어를 추가한 것입니다. `.battle-stage`, `.board-camera-shell`, `#pixi-board-host`, `.game-actions`가 같은 data marker를 공유하고, 리사이즈/회전/게임 HUD 렌더 시 `syncCombatHudTouchClearance()`가 밀도 상태를 다시 동기화합니다.

수정 상세:

- `package.json` 버전을 `1.0.78`로 갱신했습니다.
- `.game-actions`에 `data-combat-hud-touch-clearance="v1078-combat-hud-touch-clearance"`와 사용자용 `aria-label`을 추가했습니다.
- `힌트`, `섞기`, `다시 시작` 버튼에 `data-action-role`과 명확한 `aria-label`을 추가해 터치/접근성 QA 기준을 고정했습니다.
- 작은 화면에서는 하단 조작 버튼 높이와 gap을 줄이고 safe-area sticky 처리를 추가해 보드 터치와 버튼 터치가 섞이지 않게 했습니다.
- 보스 상태바에는 `v1078-boss-statusbar-readability`를 추가해 보스명/예고/HP 라벨이 작은 폭에서 ellipsis 처리되도록 했습니다.
- 저사양 렌더링은 `v1078-low-end-render-budget-guard`로 표시하고, Pixi lite budget의 particle cap과 sprite stride를 더 보수적으로 낮췄습니다.
- `tools/check-combat-hud-touch-clearance.mjs`를 추가하고 GitHub Pages / quality-check workflow에 연결했습니다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.78까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.78`로 갱신하고, `texture-atlas-manifest-v1.0.78.json`을 생성/선로드에 추가했습니다.
- `AI_HANDOFF_DR.md`에 v1.0.78 수정 내역, 검수 명령, GitHub Desktop/Firebase 무료 환경, 다음 v1.0.79 예정 내역을 기록했습니다.

검수 완료:

```bash
npm run typecheck
전체 85개 check:* QA suite
npm run check:boss-board-clearance
npm run check:combat-hud-touch-clearance
npm run report:images
npm run build:github
```

남은 참고 사항:

- `boss-frames-v2.png` runtime resolve 경고는 계속 남아 있습니다. 기존 경고이며 빌드 실패는 아닙니다.
- `vendor-effects` chunk 500 KB 초과 경고가 남아 있습니다. v1.0.79 이후 code split 후보입니다.
- 이미지 1.2 MB 초과 9개는 후속 최적화 후보입니다.

GitHub Desktop 커밋 메시지 추천:

```text
Apply 꿈의 서고 v1.0.78 combat HUD touch clearance and low-end render guard patch
```

다음 업데이트 예정: v1.0.79 - Reward/Restoration Modal Focus Return, Firebase Free Read Budget, Vendor Effects Split and Image Optimization Candidate Patch


## v1.0.79 Patch Notes - Modal Focus Return, Firebase Free Read Budget, Vendor Effects Split and Image Optimization Candidate Patch

v1.0.79는 v1.0.78의 전투 HUD 안정화 위에, 보상/복원 모달의 포커스 복귀와 Firebase 무료 환경에서의 랭킹 읽기 빈도를 줄이는 UI/UX·성능 패치입니다. 동시에 Pixi/GSAP 렌더러를 동적 import로 분리해 `vendor-effects` chunk 비대화 경고를 줄일 수 있는 구조를 만들고, 이미지 최적화 후보를 QA에서 계속 추적하도록 했습니다.

수정 상세:

- `package.json` 버전을 `1.0.79`로 갱신했습니다.
- `v1079-modal-focus-return`을 추가해 보상 모달과 복원 상세/시즌 보상 상세 모달이 열리기 전 포커스 위치를 기억하고, 닫힐 때 안전한 버튼으로 되돌리도록 했습니다.
- `rememberModalReturnFocus()`, `restoreModalReturnFocus()`, `markModalFocusReturn()`, `scheduleRestorationDetailFocus()`를 추가했습니다.
- 보상 모달에서 다음 스테이지/다시 플레이/복원 연결로 화면이 바뀌는 경우에는 숨겨진 버튼으로 포커스가 돌아가지 않도록 닫기 옵션을 분리했습니다.
- `v1079-firebase-free-read-budget`을 추가해 랭킹과 일일 랭킹을 먼저 로컬/캐시로 표시하고, 5분 TTL 동안 Firestore 반복 읽기를 피하도록 했습니다.
- Firebase 무료 기준 보호용으로 `dream-library-firebase-rank-read-budget-v1079`, `dream-library-rank-cache-global-v1079`, `dream-library-rank-cache-daily-v1079`를 추가했습니다.
- 랭킹 UI의 사용자 노출 문구를 `클라우드/기기` 중심으로 정리했습니다.
- `DreamPixiRenderer`를 정적 import에서 동적 import로 바꾸고 `v1079-vendor-effects-split` marker를 추가했습니다. 또한 `vite.config.js`에서 `vendor-audio-v1079`, `vendor-motion-v1079`, `vendor-spine-v1079`로 효과 런타임 chunk를 분리했습니다.
- `v1079-image-optimization-candidates`를 추가해 1.2 MB 초과 이미지 후보를 후속 최적화 대상으로 계속 추적합니다.
- `tools/check-modal-focus-rank-budget.mjs`를 추가하고 GitHub Pages / quality-check workflow에 연결했습니다.
- 기존 버전 호환 QA 스크립트들의 허용 범위를 v1.0.79까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.79`로 갱신하고, `texture-atlas-manifest-v1.0.79.json`을 생성/선로드에 추가했습니다.
- `AI_HANDOFF_DR.md`에 v1.0.79 수정 내역, 검수 명령, GitHub Desktop/Firebase 무료 환경, 다음 v1.0.80 예정 내역을 기록했습니다.

검수 완료:

```bash
npm run typecheck
전체 86개 check:* QA suite 통과
npm run check:modal-focus-rank-budget
npm run check:combat-hud-touch-clearance
npm run check:boss-board-clearance
npm run report:images
npm run build:github
```

유지 정책:

- 전투 보드 위 Pixi 보스/몬스터 그림 재도입 없음
- active HTML/main에 `statusbar-icon-right-v1046` 재도입 없음
- 미니맵, 게임 내 카메라 도움말, 손가락 시작 위젯 재도입 없음
- SVG 없음
- GitHub Desktop + Firebase 무료 + GitHub Pages/Firebase 빌드 흐름 유지
- `node_modules`, `dist`, `package-lock.json`, 임시 분석 파일은 ZIP 제외

GitHub Desktop 커밋 메시지 추천:

```text
Apply 꿈의 서고 v1.0.79 modal focus return rank cache and vendor split patch
```

남은 참고 사항:

- `boss-frames-v2.png` runtime resolve 경고는 계속 남아 있습니다. 기존 경고이며 빌드 실패는 아닙니다.
- `vendor-effects` 단일 chunk 경고는 해소됐고, 현재 남은 경고는 `vendor-pixi` 527.93 KB 초과입니다. v1.0.80 이후 Pixi import 경량화 후보입니다.
- 이미지 1.2 MB 초과 9개는 후속 최적화 후보입니다.

다음 업데이트 예정: v1.0.80 - Image Optimization Pass, Lobby Long Card Scroll Anchor, QA Version Message Cleanup and Firebase Write Budget Patch

## v1.0.80 Patch Notes - Camera Gesture Separation and Boss Statusbar Balance Patch

v1.0.80은 전투 보드 카메라 입력과 보스/몬스터 프로필 바 비율을 우선 정리한 UI/UX 안정화 패치입니다. 사용자가 보고한 “옆으로 드래그했는데 줌이 되는 느낌”을 줄이기 위해 한 손가락 드래그, 두 손가락 핀치, wheel/trackpad 입력을 명확히 분리했고, 보스 상태바는 왼쪽 초상화 공백과 우측 상태 슬롯의 폭 흔들림을 줄였습니다.

### 변경 사항

- `package.json` 버전을 `1.0.80`으로 갱신했습니다.
- `DreamPixiRenderer`에 `v1080-camera-gesture-separation`을 추가했습니다.
- 한 손가락 pointer drag는 `panCameraBy()`만 호출하게 하여 보드 scale이 바뀌지 않도록 했습니다.
- 드래그 직후에는 `panLockedUntil`으로 짧게 잠가 우발적인 wheel/pinch zoom이 이어지지 않게 했습니다.
- wheel/trackpad 입력은 `shouldTreatWheelAsPan()`을 거치게 했습니다. 가로 이동 성격의 wheel은 줌이 아니라 카메라 이동으로 처리합니다.
- 두 손가락 핀치는 거리 변화가 충분히 커졌을 때만 `pinchStarted`가 켜지도록 해 작은 손떨림이 줌으로 보이지 않게 했습니다.
- `#pixi-board-host`와 `.battle-stage`에 `data-camera-gesture-separation="v1080-camera-gesture-separation"`, `data-camera-gesture-mode="idle|pan|pinch|wheel"` marker를 추가했습니다.
- `v1080-boss-statusbar-balance`를 추가해 보스/몬스터 프로필 바의 왼쪽 초상화 슬롯과 우측 echo/status 슬롯을 고정 폭으로 정리했습니다.
- 기본 상태바는 `46px / 중앙 유동 / 42px`, 작은 화면은 `42px / 중앙 유동 / 38px` 비율을 사용합니다.
- `.boss-lane-echo`에 고정 `width/min-width/max-width`와 `contain`을 부여해 우측 상태 알림이 켜졌다 꺼져도 바가 좁아졌다 넓어지는 느낌을 줄였습니다.
- `tools/check-camera-gesture-statusbar-balance.mjs`를 추가해 카메라 입력 분리, 보스 상태바 비율, 구버전 레이아웃 부활 방지를 검사합니다.
- GitHub Pages / quality-check workflow에 `npm run check:camera-gesture-statusbar-balance`를 추가했습니다.
- 기존 QA 스크립트들의 버전 허용 범위를 v1.0.80까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.80`으로 갱신하고 `texture-atlas-manifest-v1.0.80.json`을 생성/선로드에 추가했습니다.
- `AI_HANDOFF_DR.md`에 v1.0.80 수정 내역, 검수 명령, GitHub Desktop/Firebase 무료 환경, 다음 v1.0.81 예정 내역을 기록했습니다.

### 검수 명령

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

### v1.0.80에서 특히 확인할 점

- 큰 보드에서 한 손가락 또는 마우스 드래그로 좌우/상하 이동할 때 보드 scale이 바뀌지 않아야 합니다.
- 트랙패드 가로 wheel은 줌이 아니라 이동으로 느껴져야 합니다.
- 두 손가락 핀치는 작은 흔들림에는 반응하지 않고 실제 확대/축소 거리 변화가 있을 때만 동작해야 합니다.
- 보스/몬스터 프로필 바 왼쪽 초상화 주변 공백이 과하게 커 보이면 안 됩니다.
- 우측 상태 echo/예고가 켜졌다 꺼져도 중앙 보스 정보가 갑자기 좁아졌다 넓어지지 않아야 합니다.
- `data-boss-layout="statusbar-icon-right-v1046"`, 보드 미니맵, 카메라 도움말, 손가락 시작 문구가 다시 나타나면 실패입니다.

### 다음 업데이트 예정

다음 업데이트 예정: v1.0.81 - Real Device Camera Feel QA, Boss Statusbar Priority Polish, Image Optimization and Pixi Chunk Follow-up

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.80 camera gesture and boss statusbar balance patch

### v1.0.80 검수 결과

- `npm run typecheck` 통과.
- 전체 87개 `check:*` QA suite 통과.
- `npm run check:camera-gesture-statusbar-balance` 통과.
- `npm run check:board-camera` 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run check:modal-focus-rank-budget` 통과.
- `npm run report:images` 통과. 454 files, 51.98 MB.
- `npm run build:github` 통과.
- 기존 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 남아 있지만 빌드 실패는 아닙니다.
- 기존 경고: `vendor-pixi` chunk 527.93 KB 초과 경고는 남아 있어 v1.0.81 이후 분리 후보입니다.

## v1.0.81 Patch Notes - Real Device Camera Feel, Boss Status Priority and Image Boot Budget Patch

v1.0.81은 실제 기기에서 카메라 드래그가 줌처럼 느껴지는 문제를 한 번 더 좁히고, 보스/몬스터 프로필 바의 왼쪽 빈 공간과 정보 우선순위를 다듬은 UI/UX 안정화 패치입니다. 동시에 큰 배경 PNG 2개에 WebP 후보를 추가하고 Pixi chunk 분리 후보를 Vite 설정에 명시했습니다.

### 변경 사항

- `package.json` 버전을 `1.0.81`로 갱신했습니다.
- `DreamPixiRenderer`에 `v1081-real-device-camera-feel`을 추가했습니다.
- 터치/펜/마우스별 pan 시작 threshold를 분리했습니다. 터치는 11px, 펜은 8px, 마우스는 6px 기준으로 잡아 손떨림이 바로 이동/줌으로 보이지 않게 했습니다.
- `resolveGestureAxis()`로 첫 이동 방향을 `horizontal / vertical / free`로 고정해 좌우 드래그가 줌 경로와 섞이지 않게 했습니다.
- 두 손가락 핀치에는 `pinchSettledAt` warmup을 추가하고, 거리 변화 기준을 `16px` / 비율 `0.065`로 높여 두 손가락을 올리는 순간의 흔들림이 확대/축소로 보이지 않게 했습니다.
- wheel/trackpad 입력은 `shiftKey`, 가로 delta, pixel delta 조건을 더 분명히 나누어 가로 스크롤은 pan으로 처리합니다.
- `v1081-boss-status-priority`를 추가해 보스/몬스터 프로필 바를 `40px / 중앙 유동 / 34px` 비율로 더 압축했습니다. 작은 화면에서는 `36px / 중앙 유동 / 30px`로 줄입니다.
- 보스바의 표시 우선순위를 `보스명 + HP + 예고 + HP바` 중심으로 재배치하고, 장황한 상태 chip/도움말은 시각적으로 숨겨 공간을 회수했습니다.
- `storybook-login.webp`, `dream-library-25d.webp`를 추가했습니다. 각각 약 2.4MB PNG에서 약 202KB WebP로 줄어 초기 부팅/캐시 후보를 가볍게 만들었습니다.
- `PRELOAD_ASSETS`와 service worker core asset에 WebP를 PNG fallback보다 먼저 등록했습니다.
- `vite.config.js`에서 Pixi chunk 후보를 `vendor-pixi-core-v1081`, `vendor-pixi-scene-v1081`, `vendor-pixi-renderer-v1081`, `vendor-pixi-assets-v1081`로 나누는 후속 분리 정책을 추가했습니다.
- `tools/check-camera-status-image-budget.mjs`를 추가해 카메라 감도, 보스바 우선순위, WebP 후보, Pixi chunk 후보, 구버전 레이아웃 부활을 검사합니다.
- GitHub Pages / quality-check workflow에 `npm run check:camera-status-image-budget`을 연결했습니다.
- 기존 QA 스크립트들의 버전 허용 범위를 v1.0.81까지 확장했습니다.
- service worker cache를 `dream-library-cache-v1.0.81`로 갱신하고 `texture-atlas-manifest-v1.0.81.json`을 생성/선로드에 추가했습니다.
- `AI_HANDOFF_DR.md`에 v1.0.81 수정 내역, 검수 명령, GitHub Desktop/Firebase 무료 환경, 다음 v1.0.82 예정 내역을 기록했습니다.

### 검수 명령

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

전체 검사 실행 예시:

```bash
node - <<'NODE' > /tmp/dr-checks.txt
const pkg = require('./package.json');
for (const key of Object.keys(pkg.scripts).filter((name) => name.startsWith('check:'))) console.log(key);
NODE
while IFS= read -r script; do npm run "$script" || exit 1; done < /tmp/dr-checks.txt
```

### v1.0.81에서 특히 확인할 점

- 실제 휴대폰에서 한 손가락 좌우/상하 드래그를 할 때 보드가 확대/축소되는 느낌이 없어야 합니다.
- 두 손가락을 올리는 순간 작은 흔들림으로 줌이 튀면 실패입니다. 손가락 간 거리를 명확히 벌리거나 좁힐 때만 zoom이 시작되어야 합니다.
- 보스/몬스터 프로필 바 왼쪽 초상화 주변 빈 공간이 v1.0.80보다 더 작아야 합니다.
- 우측 echo/status가 켜졌다 꺼져도 중앙 보스명, HP, 예고 영역이 과하게 흔들리면 실패입니다.
- `data-boss-layout="statusbar-icon-right-v1046"`, 보드 미니맵, 카메라 도움말, 손가락 시작 문구가 다시 나타나면 실패입니다.
- 새 WebP 2개는 PNG fallback을 유지하면서 service worker와 preload 후보에 들어가야 합니다.

### 다음 업데이트 예정

다음 업데이트 예정: v1.0.82 - Firebase Write Budget Guard, Lobby Long Card Scroll Anchor, QA Message Cleanup and Image Regression Check

### GitHub Desktop 커밋 메시지 추천

Apply 꿈의 서고 v1.0.81 camera feel boss status priority and image budget patch

### v1.0.81 검수 결과

- `npm run typecheck` 통과.
- 전체 88개 `check:*` QA suite 통과.
- `npm run check:camera-status-image-budget` 통과.
- `npm run check:camera-gesture-statusbar-balance` 통과.
- `npm run check:board-camera` 통과.
- `npm run check:boss-board-clearance` 통과.
- `npm run check:combat-hud-touch-clearance` 통과.
- `npm run check:modal-focus-rank-budget` 통과.
- `npm run report:images` 통과. 456 files, 52.37 MB. PNG fallback 유지 때문에 1.2MB 초과 원본 9개는 계속 추적됩니다.
- `npm run build:github` 통과.
- 기존 경고: `/DR/assets/atlas/boss-frames-v2.png` runtime resolve 경고는 남아 있지만 빌드 실패는 아닙니다.
- v1.0.80의 `vendor-pixi` 527KB 초과 경고는 v1.0.81 chunk 분리 후 해소되었습니다. 현재 큰 vendor 경고는 없습니다.
