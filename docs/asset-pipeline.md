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
