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

### v1.0.11 - Massive PNG Asset Integration, Special Rule Balance, Workflow Dedup Patch

- 업로드한 `dream_library_massive_asset_pack_v1.zip`에서 런타임 적용 가능한 PNG 자산을 선별 반영
- SVG 금지 정책 유지 및 강화: 프로젝트 내부 SVG 파일 0개, `npm run check:assets`로 계속 차단
- 퍼즐 오브젝트 24종을 업로드 에셋팩 기반의 고급 PNG 오브젝트로 교체
- 신규 사서/고양이/보스 보조 PNG 자산 추가: `librarian-cat.png`, `librarian-momo-face.png`, `shadow-cat.png`, `azure-wisp.png`
- 로그인 배경을 업로드한 세로형 달빛 도서관 렌더링 PNG로 교체
- 꿈의 서고 로고 PNG, 시작 버튼 PNG, Google/Email 버튼 PNG, 럭셔리 프레임 PNG 추가
- 로비에 `Asset Pack v1` 쇼케이스 패널 추가: 실제 반영된 오브젝트와 에셋팩 상태를 UI에서 확인 가능
- `asset-pack-manifest.json` 추가: 에셋팩 출처, 반영 자산 목록, PNG 전용 정책 기록
- PixiJS 타일 특수 규칙 시각 효과 강화: 안개 veil, 잠금 badge, 시간 봉인 회전 ring 추가
- 특수 규칙을 실제 플레이 규칙으로 일부 반영: 잠긴 타일은 직전 연결 성공 후 콤보 상태에서 해제, 시간 봉인은 +10초, 안개/잠금/시간봉인은 보너스 점수 적용
- 보스 압박 규칙에서 주기적으로 마법진 흔들림과 상태 메시지가 발생하도록 조정
- 보스 피격 시 업로드 에셋 기반 별/다이아 파티클을 추가로 발산
- service worker 캐시를 v1.0.11로 갱신하고 신규 핵심 PNG 자산을 precache에 추가
- GitHub Actions 중복 실행 정리: `push main`에서는 GitHub Pages workflow 하나만 검증/빌드/배포 실행
- `quality-check.yml`은 pull request 또는 수동 실행 전용으로 변경해 GitHub Desktop push 후 verify가 2번 돌지 않도록 수정
- Firebase Hosting merge/preview workflow는 수동 실행 전용으로 정리
- Actions의 Node 버전을 20으로 통일하고 `npm ci --no-audit --no-fund --prefer-offline --progress=false` 및 `.npmrc`로 설치 단계를 안정화
- `package.json`의 `vite: latest`를 `vite: 8.1.0`으로 고정해 CI 설치 결과가 매번 바뀌지 않도록 수정
- `package-lock.json`의 내부 registry URL을 공개 registry URL로 정리해 GitHub Actions 환경에서 설치가 막히지 않도록 수정
- `npm run check:workflows` 추가: push main workflow 중복, Node 22 사용, bare `npm ci` 사용 여부 검사
- 이미지 용량 점검 기준 유지: 대형 원본 시트는 런타임에 넣지 않고 선별/트림/축소된 PNG만 포함
- 모바일 뒤로가기 대응 추가: 게임 중 뒤로가기 시 로비를 거쳐 첫 화면으로 복귀하고, 첫 화면에서 뒤로가기 시 종료 확인 팝업 표시
- 종료 확인 팝업 추가: 계속하기 / 첫 화면 / 종료하기 버튼으로 브라우저 종료 제한까지 안전하게 처리
- README.md에만 버전 변경 내역 유지

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
7. Summary에 `Apply 꿈의 서고 v1.0.11 massive asset workflow and back navigation patch` 입력합니다.
8. `Commit to main`을 누릅니다.
9. `Push origin`을 누릅니다.
10. GitHub 저장소 Settings > Pages에서 Source를 `GitHub Actions`로 설정합니다.
11. GitHub 저장소 Settings > Secrets and variables > Actions에 `VITE_FIREBASE_*` Secrets를 입력합니다.
12. Actions 탭에서 `Deploy to GitHub Pages`가 성공하면 `https://junl-im.github.io/DR/`에서 확인합니다.

### patch ZIP으로 기존 파일 위에 덮을 때

1. patch ZIP 압축을 풉니다.
2. 나온 파일들을 GitHub Desktop이 Clone한 `DR` 폴더에 그대로 복사합니다.
3. 덮어쓰기 질문이 나오면 덮어씁니다.
4. 기존 SVG 잔여 파일이 보이면 `remove-legacy-svg-v1.0.6.cmd` 또는 `npm run clean:legacy-assets`로 정리합니다.
5. `.env.example`을 복사해서 `.env.local`을 만들고 Firebase 값을 입력합니다.
6. GitHub Desktop에서 변경 파일과 삭제 파일을 확인합니다.
7. Summary에 `Apply 꿈의 서고 v1.0.11 massive asset workflow and back navigation patch` 입력합니다.
8. Commit 후 Push합니다.
9. GitHub 저장소 Actions Secrets에 `VITE_FIREBASE_*` 값을 입력합니다.

## Local Development

```bash
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
- `firebase-hosting-pull-request.yml`: 수동 실행용 Firebase preview 배포
- `quality-check.yml`: PR 또는 수동 실행 시 typecheck, SVG 금지, 카카오 handoff, 콘텐츠 데이터, 이미지 용량, 빌드 검사

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

v1.0.6부터 에셋은 SVG를 사용하지 않습니다. v1.0.7에서는 로그인 화면과 게임 핵심 에셋을 PNG 렌더링 자원으로 전면 교체했고, v1.0.8에서는 보스/전투 피드백/성능 품질 자산을 추가했습니다. v1.0.9에서는 복원 메타/일일 콘텐츠/카카오 handoff PNG 자산을 추가했고, v1.0.10에서는 보스 3종/컬렉션 도감/daily 랭킹 PNG 자산을 추가했습니다. 모든 게임 표시 자원은 2D~3D 렌더링 기반 PNG/WebP와 Texture Atlas 기준으로 관리합니다.

```text
public/assets/objects/*.png              24 files
public/assets/backgrounds/*.png           6 files
public/assets/characters/*.png            4 files
public/assets/ui/*.png                    3 files
public/assets/effects/*.png               4 files
public/assets/meta/*.png                  5 files
public/assets/atlas/dream-objects.png     1 file
public/assets/atlas/*.json                1 file
public/assets/meta/tile-manifest.json     1 file
```

현재 타일 자원:

```text
magic-book, gold-key, candle, hourglass, crystal-orb, rune, ink, scroll,
crown, feather, potion, star, music-box, dragon-egg, relic, moon,
gem, shield, flower, comet, bell, map, castle, spark
```

외부 저작권 에셋을 가져오지 않고, 프로젝트 안에서 바로 쓸 수 있는 자체 렌더링 자원으로 구성합니다. 로그인 배경, 로비 배경, 월드맵, 마스코트 캐릭터도 PNG 렌더링 자산입니다.

## No SVG Policy

- SVG 파일은 프로젝트에 추가하지 않습니다.
- 퍼즐 타일은 아이콘이 아니라 질감과 깊이를 가진 렌더링 오브젝트로 제작합니다.
- 최종 게임 적용 자원은 PNG/WebP 개별 파일 또는 Texture Atlas만 사용합니다.
- 새 에셋을 추가한 뒤에는 `npm run check:assets`로 SVG 잔존 여부를 검사합니다.

## Next Version Plan

### v1.0.12 예정 - Boss Telegraph, Collection Filter, Atlas Optimization Patch

- 보스 공격 예고를 보스별 텔레그래프 UI로 분리
- 잠긴 타일/안개 타일/시간 봉인 규칙 밸런스 수치 재조정
- 컬렉션 도감 필터/정렬 추가
- 복원 프로젝트 완료 보상 상태 저장 추가
- daily 리더보드 표시를 오늘/전체 탭으로 분리
- 작은 화면에서 컬렉션/복원 패널 접기 UX 추가
- Texture Atlas JSON 기반 타일 lookup을 실제 Sprite 로딩 경로에 연결
- 이미지 리포트 결과를 README에 붙여넣기 쉬운 markdown 출력으로 확장
- GitHub Actions 아티팩트 보관 옵션 추가 검토
- 에셋팩 잔여 몬스터/장식 PNG를 챕터 연출용으로 추가 선별

## KakaoTalk / In-App Browser Policy

v1.0.9부터 카카오톡/Kakao 계열 인앱 브라우저는 차단 경고가 아니라 `Browser Handoff` 방식으로 대응합니다.

원칙:

- 첫 화면 진입 즉시 경고로 막지 않습니다.
- 사용자가 `게임 시작` 또는 로그인을 누른 실제 액션 시점에 외부 브라우저 전환을 시도합니다.
- Android는 Chrome `intent://` URL로 외부 브라우저 이어 열기를 시도합니다.
- iOS처럼 자동 전환이 제한될 수 있는 환경은 주소 복사와 임시 플레이를 제공합니다.
- 임시 플레이는 가능하지만, Google 로그인/전체화면/PWA/사운드 정책은 외부 브라우저보다 제한될 수 있습니다.

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

1. 특수 타일 규칙 밸런스 실전 반영
2. 보스 공격 예고 UI 고도화
3. 컬렉션/복원 완료 상태 저장
4. daily 리더보드 탭과 atlas lookup 확장
