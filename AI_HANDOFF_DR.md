# 던전 zero 인수 기록

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

## 사용자 화면 기준 정정
제품 이름은 던전 zero. 사용자는 기존 커스텀 서고 UI와 로우폴리 화면이 기대와 다르다고 지적했다. 첨부 이미지는 고전 리니지 계열 등각 화면으로 보이며 실제 NJ MMO 로우폴리 3D와 구분한다. 첨부 화면 지향 또는 NJ MMO 원본 복원 중 사용자 답변 전 대규모 UI/엔진 변경을 진행하지 않는다. 기존 Firebase 프로젝트 ID와 저장 DB 키는 데이터 보존을 위해 유지한다.

사용자 선택 확정: 첨부 이미지의 고전 MMORPG 분위기·고정 시점·하단 HUD 기준으로 변경. 실제 NJ MMO 원본 UI 복원으로 오해하지 않는다. 로우폴리 3D 자산은 유지하며 원본 스크린샷의 게임 그래픽이 구현되었다고 주장하지 않는다.

## 0.2.0 — 마을과 전투 피드백
사용자 계속 개선 요청에 따라 고전 HUD/고정 카메라를 유지하며 마을 광장 패치의 비동기 로딩을 처리, 지형 기반 광장·길과 군집 수풀·실제 메뉴 안내판3개 추가. 공격/회복 숫자·강타 쿨다운·경험치 수치·지역 표시 추가. 비영속 bounded 이벤트 큐로 피해/보상/레벨업 기록을 분리하여 동시 보상 기록 손실 방지. 저장 스키마1/Firebase 연결 유지. 로컬12개·전체 클라이언트·타입·빌드 통과, 기존 플레이 저장복원과 새 UI 브라우저검증 통과. 브라우저 증거 docs/update-0.2-verification.json. 장식은 이동 차단 물체로 추가하지 않음. 새 외부 모델/텍스처 없음.

## 2026-10-12 — 외부 자원 확장 조사
사용자 지시로 프리서버 구축 분석 대화와 Notion 웹게임 조사 대조. Codes_KOR.zip·반하자.zip 원본 및 Library 파일은 미확보, 4종 정확한 제품명 질문 중. Elbera revision12c9656의 데이터/인벤토리/퀘스트 검사48개 통과. 공식 자산11묶음1974파일308012218바이트를 resources/library/2026-10-12에 확보(게임 적용 전, Git 제외). 세 Drive ZIP 폴더 재조회·모든 자산 SHA256 재대조 통과. 상세 docs/research/2026-10-12-resource-review.md. Elbera 원작 그래픽은 MIT 대상에서 제외되므로 복제 안 함. 게임 런타임·Firebase 설정 변경 없음.
