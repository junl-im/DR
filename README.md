# Dream Library · 꿈의 서고

NJ MMO의 Three.js 렌더러·지형·모델을 바탕으로 만든 단독 플레이 3D 웹게임의 첫 번째 프로토타입입니다. 상시 실행 서버 없이 사냥, 성장, 장비 강화, 정원 건설과 IndexedDB 저장을 지원합니다. Google 로그인 후 Firebase에 수동으로 여행 기록을 옮길 수 있습니다.

## 실행

Node.js 24에서 `npm ci`, `npm run dev`를 실행한 뒤 http://localhost:4200 에 접속합니다. `npm run build:firebase` 결과는 `dist/client`입니다. Firebase 웹 설정은 `.env.example`을 참고하여 `.env.local`에 넣습니다. 공개 웹 API 키는 인증 수단이 아니며 Firestore 접근은 소유자 UID 규칙으로 제한합니다.

## 조작

땅을 클릭하여 이동, 몬스터 클릭 후 공격, 1/Space 공격 전환, 2 별빛 참격, 3 물약, R 귀환, Q/E 시점 회전. 가까운 몬스터 찾기로 사냥을 시작할 수 있습니다. 영지 메뉴에서 서고 주변 목재 채집과 정원 건설, 장비 메뉴에서 강화합니다.

## 검증

`npm run test:core`, `npm run test:client`, `npm run typecheck`, `npm run check:assets`, `npm run build:firebase`.
Firestore 규칙은 Java 21과 Firebase CLI 설치 후 `firebase emulators:exec --only firestore --project demo-dream-library "node scripts/rules-check.mjs"`로 검사합니다.

## 기록과 보존

- [Notion 개발 원장](https://app.notion.com/p/3f6fff243ec98105bc41e9d025db908e)
- [Drive 자료·백업](https://drive.google.com/drive/folders/12u74isbqgwA2VX2jSCFwSh1nHDuAHL7_)
- [이전 퍼즐 전체 Git 백업](https://drive.google.com/file/d/1PAJRI-4o26RitvKPxy_xf3Ha94XLRhkJ/view)

이전 퍼즐은 `archive/puzzle-before-3d-20261011` 태그와 Git bundle로 보존했습니다. 원본 NJ MMO 서버는 `server/`, 온라인 진입점은 `client/src/main-online.ts`에 남겨 두었습니다. 현재 로컬 재화는 향후 온라인 경제에서 신뢰하지 않습니다. PvP·거래·길드·공성은 후속 단계입니다.

## 출처와 제한

기반: [tech-leads-club/nj-mmo](https://github.com/tech-leads-club/nj-mmo), commit `7bba7272386357b8d5c19dd82906d13bd49f1bb9`. MIT 라이선스와 원본 자산 고지를 보존합니다. `docs/asset-inventory.json`은 포함 파일의 해시와 모델 정보를, `docs/glb-header-repairs.json`은 NPC 14개 파일의 헤더 복구 내역을 기록합니다. 코드 라이선스와 개별 자산 라이선스는 별개이며, 원본 IP 문구·전체 자산 출처 검수는 정식 공개 전 남은 작업입니다.

현재는 첫 프로토타입입니다. Google 실제 계정 로그인·교차 기기 저장, 장시간 모바일 성능과 모든 저장 공간 오류 경로는 추가 검증 대상입니다.
