# 던전 ZERO HUD/UI 실제 자산 인수인계 — 2026-10-13

> 이 문서는 **자료 준비**용. 현재 `main` 서비스 HUD를 교체하지 않고 기능/저장데이터를 보존한다.
> 기준: [Notion 150-source V3](https://app.notion.com/p/3f6fff243ec9810bbd3ac3210772b334);
> 150 = 조사 링크 수이지 150개 원본 바이너리 확보 완료가 아니다.

## 1. 자료 인수인계

자동 수집 프로세스: `python3 scripts/research/collect-ui-packs.py`
자동 PR 수집: `.github/workflows/ui-asset-intake.yml`, ZIP 아티팩트
`artifacts/dungeon-zero-ui-intake/intake-manifest.json` 기록: 원본 URL, 실제 파일 크기, SHA256, PNG 목차, 미수신 원인.
원본 압축파일 `original-sources/`, 선정 PNG `ready-to-evaluate/`, 조건부 `inspection-only/`.
자료지의 SHA256/받아온 파일의 헤더를 검사하지만, 실제 브라우저 레이아웃 검증/전면 라이선스 감사를 의미하지 않음.

| ID | 우선 | 공급자 및 라이선스 | 적용 계획 | 원본 |
| --- | --- | --- | --- | --- |
| kenney-fantasy-borders | P0 | Kenney / CC0 | 9-slice 인벤토리/상점/퀘스트·대화창 테두리 | https://opengameart.org/content/fantasy-ui-borders |
| kenney-rpg-ui | P0 | Kenney / CC0 | 단축키 슬롯·스탯 슬라이더·확인/취소 버튼 | https://opengameart.org/content/ui-pack-rpg-extension |
| kenney-mobile-controls | P0 | Kenney / CC0 | 모바일 이동·회피·공격/물약 조작 | https://opengameart.org/content/mobile-controls |
| melle-fantasy-gui-1/2 | P0 | MELLE / CC0 | 스킬창·서브 버튼·상태바·장식 | https://opengameart.org/content/fantasy-gui-0 |
| systemg6-rpg-ui | 보류 | System G6 / CC0 표기이나 하위 출처 언급 | 복합 프레임 품질 비교 후 분리 검증 | https://opengameart.org/content/rpg-ui-1 |
| game-hud-mit | 참고 | threejsassets / MIT | CSS 레이아웃/체력 감소 잔상·툴팁 구조 참고 | https://github.com/threejsassets/game-hud |

## 2. 코드별 이식 매핑 (게임 기능 유지)

| 현재 요소 | 현재 구현 | 후보 그래픽 | 수용 검사 |
| --- | --- | --- | --- |
| 캐릭터 HP/MP/XP | `client/src/local/local-main.ts` `#hp-bar,#mp-bar,#xp-bar` + `local.css .vitals,.bar` | MELLE bar + Kenney 9-slice | 실수치/바 길이 동기, 체력 수치/색 대비 |
| 하단 6칸 핫바 | `local-main.ts .bottom nav.actions` | Kenney RPG/ Fantasy Borders | 단축키 1/2/3/R/H/Tab 기존 키매핑 유지, 클릭 이벤트 유지 |
| 인벤토리/장비창 | `client/src/local/inventory.css` + `inventory-window.ts` | Kenney 9-slice + 슬롯 PNG | 장비 변경/수량/필터/저장 전혀 변경 금지 |
| 퀘스트·전투 타깃 | `local-main.ts .quest,#target,#boss-warning` | 공통 패널 헤더/프레임 | 390px 및 320px에서 타깃 창과 퀘스트 패널 겹침 0 |
| 모바일 터치버튼 | `local-main.ts #boss-dodge,.actions` | Kenney mobile controls | 터치 44px 이상, 실전 회피 Q와 동일, landscape 회피/타깃 통과 |
| 기타 범용 UI | `client/src/ui/hotbar.ts, target-frame.ts, hud-rail.ts` | Game HUD MIT CSS 디자인 *참고만* | 네트워크/오프라인 모두 작동, 기존 테스트 통과 |

## 3. 필수 게이트

1. 소스별 원본 보존 및 파일 바이트/SHA256/라이선스 링크 고정.
2. 9-slice는 원본 PNG의 보더 두께와 투명 배경을 확인하고 CSS `border-image-slice` 또는 개별 코너+타일로 구현; 픽셀아트는 CSS 확대 시 의도에 맞게 선택.
3. PC 1440x900, 모바일 390x844/320x700/landscape; HUD 가림·이중 터치·스크롤 오버플로 0.
4. 타깃 변경/자동사냥/단축키/보스 Q 회피/인벤토리 저장의 기존 CI 및 WebGL 회귀 통과.
5. Lighthouse/네트워크: CSS sprite 또는 사전 압축으로 다운로드량·드로우콜 악화 없이 주입.
6. `schemaVersion1`, Firebase Firestore 규칙·인덱스, 온라인 서버 코드, 인게임 전투 밸런스 불변.
7. CC0 원본도 향후 공급자/파일별 이슈 확인; MIT는 LICENSE 보존. System G6가 외부 참고한 그림(스컬/스크롤)은 개별 출처 확인 전 절대 라이브 배포 금지.

## 4. 상태 표기 규칙

- `listed`: 후보 링크만 확보.
- `downloaded`: 실제 바이너리 받은 상태 + SHA256.
- `inspected`: ZIP 멤버/PNG 헤더 및 직접 샘플 검증.
- `approved-to-integrate`: 출처·라이선스 검증, UI 적합성 검토 완료.
- `integrated`: 게임 코드 이식 + 자동 화면/기능 테스트 통과.
- `deployed`: Firebase/Pages main 실배포 확인.

**이번 작업의 목표는 `inspected`까지. `integrated`·`deployed`는 후속 승인된 UI 개발 단계.**
