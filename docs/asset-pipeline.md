# 꿈의 서고 AI Asset Pipeline

## 고정 규칙

- SVG 금지
- 최종 적용 에셋은 PNG/WebP 또는 Texture Atlas만 사용
- 퍼즐 타일은 아이콘이 아니라 떠 있는 마법 오브젝트로 제작
- 색상은 네이비, 골드, 에메랄드, 바이올렛, 스카이블루 계열로 제한

## 제작 순서

1. Art Bible 확인
2. Master Style Prompt 고정
3. Object Prompt 작성
4. PNG/WebP 렌더링 생성
5. 투명 배경 확인
6. 가장자리 알파/노이즈 정리
7. Texture Atlas 등록
8. PixiJS 오브젝트로 연결

예: 평면 책이 아니라 금속 장식이 달린 떠 있는 마법책.

## v1.0.63 메타/연출 파이프라인 메모

- `texture-atlas-manifest-v1.0.63.json`을 생성해 최신 캐시/프리로드 기준에 포함했습니다.
- 오늘의 복원 UI는 새 SVG 없이 CSS/PNG 기반 레이어와 DOM 위젯으로만 구성합니다.
- 보스 반격 프리뷰와 보상 흐름 카드는 텍스트/그라디언트 UI로 처리해 저사양 기기에서도 부담을 줄입니다.

## v1.0.64 UI/연출 파이프라인 메모

- `texture-atlas-manifest-v1.0.64.json`을 생성해 최신 캐시/프리로드 기준에 포함했습니다.
- `게임 시작` 위젯은 손가락 아이콘 없이 우측 화살표와 CSS 빛줄기로만 `오늘의 복원` 버튼을 가리키도록 정리했습니다.
- 신규 SVG 없이 DOM/CSS, PNG/WebP, 기존 Atlas 정책만 유지합니다.
- 로비 히어로와 시작 안내 카드는 과한 장식보다 방향성, 밀도, 터치 안정성을 우선합니다.


## v1.0.65 UI/UX 안정화 파이프라인 메모

- `texture-atlas-manifest-v1.0.65.json`을 생성해 최신 캐시/프리로드 기준에 포함했습니다.
- `v1065-ui-ux-stability-pass` 훅으로 시작 CTA, 로비 선택 카드, 뒤로가기 팝업의 터치 안정성과 작은 화면 밀도를 점검합니다.
- 중복 ID 검사를 자동 QA에 포함해 스테이지 선택 카드와 접근성 참조가 흔들리지 않도록 했습니다.

## v1.0.66 First-touch UX / Game UI Stability 파이프라인 메모

- `texture-atlas-manifest-v1.0.66.json`을 생성해 최신 캐시/프리로드 기준에 포함했습니다.
- 첫 매칭 마이크로 튜토리얼은 PNG/WebP 기반 기존 UI 시스템만 사용하며 SVG를 추가하지 않습니다.
- 보스 반격 미리보기와 HUD 밀도는 런타임 `v1066-game-ui-stability-pass` 훅으로 작은 화면에서 자동 압축됩니다.
- `check:first-touch-ux`가 첫 연결 안내, 보스 반격 compact 모드, cache/atlas, workflow 연결을 함께 확인합니다.

## v1.0.67 Reward Restoration Bridge / Boss VFX Density Guard 파이프라인 메모

- `texture-atlas-manifest-v1.0.67.json`을 생성해 최신 캐시/프리로드 기준에 포함했습니다.
- 보상 팝업은 `v1067-restoration-reward-bridge` 훅으로 클리어 재료가 어느 복원 프로젝트에 반영되는지 progress bridge와 액션 버튼으로 연결합니다.
- 보스 경고/반격 미리보기는 `v1067-boss-vfx-density-guard` 훅으로 작은 화면에서 흔들림과 광량을 낮춰 보드 가림을 줄입니다.
- 첫 터치 안내는 `v1067-micro-tutorial-comfort` 훅으로 재방문/오늘 스테이지 반복 안내를 짧고 조용하게 접습니다.
