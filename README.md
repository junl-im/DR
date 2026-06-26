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

## Asset Resources

v1.0.6부터 에셋은 SVG를 사용하지 않습니다. v1.0.7에서는 로그인 화면과 게임 핵심 에셋을 PNG 렌더링 자원으로 전면 교체했고, v1.0.8에서는 보스/전투 피드백/성능 품질 자산을 추가했습니다. v1.0.9에서는 복원 메타/일일 콘텐츠/카카오 handoff PNG 자산을 추가했고, v1.0.10에서는 보스 3종/컬렉션 도감/daily 랭킹 PNG 자산을 추가했고, v1.0.11에서는 업로드 에셋팩의 PNG 렌더링 자산을 선별 반영해 프리미엄 퍼즐 오브젝트, 캐릭터, VFX, UI 키를 확장했고, v1.0.12에서는 특수 타일 규칙과 보스 예고 UI에 해당 VFX를 실제 배정했고, v1.0.14에서는 로비 미션 카드와 접기 UX, 동적 로딩 기반을 추가했고, v1.0.15에서는 카카오 인앱 외부 이동을 제거하고 세로 전체화면/회전 방지 런타임을 강화했고, v1.0.16에서는 종료 fallback, 로컬 랭킹 fallback, 모바일 스크롤 감도를 다듬었고, v1.0.17에서는 v2 에셋팩의 상태별 타일/마스코트/보스/VFX/UI 프레임을 선별 반영했고, v1.0.18에서는 모바일/인앱 환경의 가로 재계산 원인을 virtual portrait frame으로 수정했습니다. 모든 게임 표시 자원은 2D~3D 렌더링 기반 PNG/WebP와 Texture Atlas 기준으로 관리합니다.

```text
public/assets/objects/*.png              84+ files
public/assets/backgrounds/*.png           10+ files
public/assets/characters/*.png            16+ files
public/assets/ui/*.png                    80+ files
public/assets/effects/*.png               44+ files
public/assets/meta/*                      11 files
public/assets/atlas/dream-objects.png     1 file
public/assets/atlas/*.json                1 file
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

## Next Version Plan

### v1.0.19 예정 - Atlas Packing + Boss Sheet Slicing + Lobby Animation Patch

- v2 상태별 타일을 실제 Texture Atlas로 패킹하고 atlas JSON lookup을 우선 적용
- 보스 공격 시퀀스 시트를 자동 분할해 공격/피격 컷인 프레임으로 배정
- 로비 마스코트 표정/동작 카드 추가
- 버튼 hover/pressed PNG를 pointer 상태에 더 깊게 연결
- 작은 화면 전투 HUD 높이 추가 압축
- 모바일/인앱 화면 보정은 문구 노출 없이 내부적으로 처리하고, 게임 UI에는 표시하지 않음
- Firebase/로컬 랭킹 혼합 표시 UX 개선
- 큰 JS chunk lazy loading 범위 확대

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
- 지원 브라우저에서는 전체화면 버튼과 새 게임 시작 시 `requestFullscreen()`을 시도합니다.
- iOS Safari처럼 전체화면 API가 제한된 환경에서는 홈 화면에 추가한 뒤 실행하는 방식을 권장합니다.
- 세로 방향 잠금은 지원 브라우저에서만 best-effort로 시도합니다.

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


