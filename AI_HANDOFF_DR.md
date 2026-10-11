# Dream Library 인수 기록

## 현재 제품과 문서 우선순위

작업 경로 `D:\K-city-webgame\DR`, GitHub `junl-im/DR`, Firebase `dream-library-b732a`.
Notion MASTER와 Drive MASTER, Firebase-first 패키지가 현재 결정입니다. 기존 4style/hybrid/resource-v2 문서의 PC Colyseus 운영 제안은 보존하되 후속 단계로 미룹니다. 현재 단독 플레이는 브라우저에서 판정하며 온라인 재화로 이전하지 않습니다.

## 완료한 구현

LocalGameSession의 고정 시간 간격·시드 기반 전투/드롭, 기존 지형 경로탐색, 캐릭터 3종, 사냥/레벨업/물약/귀환/강화, 목재/정원 생산. IndexedDB 트랜잭션 현재·직전 백업 슬롯과 스키마 검증. Firebase Auth Google 로그인과 소유자 전용 수동 저장/불러오기. 한국어 데스크톱·모바일 HUD. 원본 서버와 온라인 엔트리 보존.

## 검증 근거

- 이전 퍼즐 HEAD e5dfe5b95307d044a1b4482942309b3fdfa0c99c, 기존 정적 검사 94/94 통과. 복구 태그 archive/puzzle-before-3d-20261011.
- NJ MMO 기준 7bba7272386357b8d5c19dd82906d13bd49f1bb9. 원본 타입 계약 오류는 fixtures와 mock signature를 보완하고 assertion 유지.
- 클라이언트 90파일/446테스트 통과 및 추가 저장 복구 회귀 테스트 통과, 타입 검사 및 Firebase 정적 빌드 통과.
- 자산 108파일/104,418,938bytes/64GLB 헤더·외부 참조·LFS 포인터 검사 통과. NPC14개 헤더 version/length 위치만 바로잡음.
- Chromium1440x900,390x844에서 신규 생성→실제 사냥1회→XP30/gold11→IndexedDB 저장→새로고침 이어하기 검증. 페이지 실행 오류0,HTTP오류0,가로 넘침false. 개발 서버 WebSocket2회는 Vite HMR이며 게임 서버 연결이 아님. 정적 빌드에서도 WebSocket0, 실제 2회 사냥·레벨2·장비강화1·정원1·저장 복원까지 확인 (docs/browser-verification.json).
- Firestore 에뮬레이터 14개 허용/거부 시나리오 통과, 새 localSaves 규칙 실제 배포 성공. 이전 규칙 docs/firestore-before-3d.rules 보존. 기존 데이터 삭제 없음.

## 자료 검수

Drive의 다섯 ZIP을 확보·압축 해제하고 최신 결정과 이전 서버 운영 안을 대조했습니다. resource catalog99행은 다운로드된 에셋99종을 뜻하지 않습니다. 기존 ZIP 내부 코드·스크립트는 자동 실행하지 않았습니다.

| ZIP | SHA256 |
| --- | --- |
| Firebase-first | 0977fce213d92d614415901baadf80edb24dc5348e3d1329998798f7d9a03173 |
| 4style | 2ee626f89f8ecb560c0f72e6950359c6a6021017444aa70660e60a6e9a0df3b0 |
| Hybrid | eba002d3a56cb61afd56c5cca3dfc2a582353737f44e9515353d906b485fdebe |
| Precodex | 2d6d29f6bbe231d5b9f38eab5d679cd721848766835938b41a5e16fae939c176 |
| Resource-v2 | f3ada6b89c96d22e7e12c0c004fb10d4656f2356d6aa055b604b87ed4b944e04 |

## 남은 작업과 실제 제한

1. 실제 Google 계정 로그인·교차 기기 저장 검증. 자동 테스트가 사용자의 실제 계정 인증을 대신하지 않음.
2. 원본 IP의 quest/NPC/item 데이터 정식 공개 범위에서 교체. 로컬 표기는 새 이름이나 원본 서버 데이터가 저장소에 남음.
3. 전체 자산의 정확한 배포 버전·라이선스 대조. 공식 페이지 확인만으로 개별 바이너리 출처 일치를 보장하지 않음. Fantasy Props MegaKit 제작자는 Quaternius인데 일부 원본 고지는 KayKit로 표기되어 있으므로 정정 근거 확보 필요. environment 건물 고지도 authored/pack으로 엇갈림. 원본 고지는 보존.
4. npm 호환 업데이트로 critical2건 제거. 최종 audit45건(5low/34moderate/6high)은 서버·개발도구·Node Firebase 경로를 포함하므로 세부 범위와 상위 패키지 업데이트 추가 검토. 무분별한 force/downgrade 금지.
5. 모바일 장시간 성능, 저장 용량 초과/거부 브라우저, import/cloud 교체 중 autosave 경쟁 조건 검증. 파일/클라우드 교체 시 진행 중 저장을 기다리고 자동 저장을 정지하도록 보완. 손상된 현재 슬롯이 정상 백업을 덮어쓰지 않도록 보완. 현재 클라우드는 수동 저장, 오프라인 백그라운드 생산 없음.
6. 정식 공개 배포와 온라인 MMO·PvP·거래·길드·공성은 완료 처리하지 않음.

## 기록 링크

- Notion https://app.notion.com/p/3f6fff243ec98105bc41e9d025db908e
- Drive https://drive.google.com/drive/folders/12u74isbqgwA2VX2jSCFwSh1nHDuAHL7_
- 전체 이전 Git bundle https://drive.google.com/file/d/1PAJRI-4o26RitvKPxy_xf3Ha94XLRhkJ/view

Firebase 규칙 안내: I've set up prototype Security Rules to keep the data in Firestore safe. They are designed to be secure for private, owner-only single-player save documents with bounded payloads and server timestamps. However, you should review and verify them before broadly sharing your app. If you'd like, I can help you harden these rules.
