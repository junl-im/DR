# 던전 zero — 자료 확보·Elbera 분석 보고서

확인일: 2026-10-12 (한국). 게임 기준본: 0.2.0 / fca1b0e. 이번 작업은 조사·실파일 확보이며 게임 기능 적용 완료를 뜻하지 않는다.

## 핵심 판단

NJ MMO 본체와 고정 대각 시점·하단 HUD를 유지한다. 완성도를 높이려면 파일 수보다 통일된 아트, NPC와 퀘스트로 이어지는 플레이, 장비·보상 UI, 로딩·저장 실패 복구를 함께 완성해야 한다. 이번에는 공식 배포 원본 11개 묶음을 확보했고, 다음 적용 순서를 구체화했다.

## 기존 내역 대조

- Notion [MASTER](https://app.notion.com/p/3f6fff243ec98105bc41e9d025db908e)와 [웹게임 조사](https://app.notion.com/p/3f6fff243ec9812eae25f512943795f6)를 읽었다. 현재 확정은 Firebase Spark·브라우저 단독 플레이이며 PC 상시 서버는 보류다.
- 기존 99건 카탈로그 CSV의 항목과 공식 KayKit 후보를 대조했다. 99건은 기존 조사 링크 수이며 이번 실다운로드 11개 묶음과 혼동하지 않는다. 카탈로그 전체 99건의 최신 라이선스 재검증은 완료하지 않았다.
- 앱의 ‘프리서버 구축 분석’ 대화를 읽었다. Codes_KOR.zip·반하자.zip, 아이템/NPC/스킬/상점/맵 데이터 구조 연구, 독자 에셋 명세, 저비용 개발 제안이 있었다. 두 ZIP 원본은 Drive의 파일명 검색에서 나오지 않았고 원본 코드·DB 감사는 미완료다. 대화의 과거 PC 서버 제안은 최신 MASTER 결정을 바꾸지 않는다.
- 사용자 제공 ChatGPT Library URL은 웹 접근 실패, 앱 브라우저 도구도 초기화 실패했다. 라이브러리 파일 자체를 분석했다고 주장하지 않는다. ‘4종’의 정확한 명칭은 질문 중이며, 리니지1·2·M·독자 영지라는 MASTER의 네 설계 축을 임시 대응표로 사용한다. 관련 없는 ‘4종 AI 엔진’ 기록은 게임 자료에서 제외했다.

## Elbera — 유용한 것과 이식 조건

분석 소스: [Lineage2Elbera](https://github.com/elberacasa/Lineage2Elbera), revision `12c9656e2f053b233ec3fd87056491a6a6da8b0c`. 얕은 공개 소스 체크아웃을 별도 연구 디렉터리에 확보했다. 아래는 실제 파일을 읽은 분석이며, 본 게임에 코드를 복사한 상태는 아니다.

| 확인한 파일 | 배울 점 | 던전 zero 적용 판단 |
| --- | --- | --- |
| editor/world/js/gamedata.js | 동시 요청 공유, 성공 캐시, 실패 후 명시 재시도 | 아이템·스킬·에셋 카탈로그 로더에 우선 적용 |
| editor/world/js/ui/inventorywnd.js | 창 상태와 장착 슬롯 분리 | 장비창·가방·툴팁을 우리 데이터로 구현 |
| editor/world/js/ui/questwnd.js | 퀘스트 상태·선택·포기 확인 분리 | NPC 대화→수락→사냥→귀환→보상 흐름 설계 |
| editor/world/js/ui/tradewnd.js | 제안 목록·확정·취소 상태 분리 | 상점 UI에 참고, 유저 거래는 신뢰 서버 이후 |
| docs/PORT-COVERAGE.md | 구현 존재와 실플레이 검증을 구분 | 기능별 검증 장부 도입 |
| docs/public-release-boundary.md | 코드와 원본/변환 자산 배포 경계 분리 | 라이선스·해시·입수 경로 장부 유지 |

실행: `node --test editor/world/test/gamedata-cache.test.mjs editor/world/test/inventory-placement.test.mjs editor/world/test/quest-confirmation.test.mjs` → 48개 통과, 실패/skip 0. 이는 합성 입력을 사용하는 특정 모듈 검사이며 Elbera 전체 게임·서버·맵·애니메이션 검증이 아니다.

Elbera [LICENSE](https://github.com/elberacasa/Lineage2Elbera/blob/main/LICENSE)는 자체 코드·문서 MIT와 원작 NCSoft 텍스처/모델/맵/오디오/데이터를 구분한다. 과거 이력의 변환물과 개발 스크린샷도 게임 자산 이용 허가를 제공하지 않는다. 따라서 Elbera 원작 이미지 추출·재배포 대신 아래 허가된 완성 이미지들을 확보했다. 독립 저작 에셋의 별도 허가가 확인되면 추가할 수 있다.

## 실제 확보한 에셋

| 묶음 | 파일 수 | 이용 조건 | 용도 |
| --- | ---: | --- | --- |
| Kenney Fantasy UI Borders | 286 | CC0 | 고전 패널·테두리 |
| Kenney RPG UI Expansion | 94 | CC0 | 가방·상점·장비 UI |
| Kenney Particle Pack | 195 | CC0 | 강타·회복·마법 효과 |
| Kenney RPG Audio | 55 | CC0 | 전투·이동 효과음 |
| Kenney Mini Dungeon 2.0 | 162 | CC0 | 던전·몹 후보 |
| Kenney Isometric Buildings | 136 | CC0 | 완성된 등각 건물 이미지·건설 미리보기 |
| KayKit Dungeon Remastered 1.0 | 844 | CC0 | 던전 벽·바닥·상자·소품 |
| KayKit Adventurers 1.0 | 122 | CC0 | 직업별 캐릭터·장비 |
| KayKit Skeletons 1.0 | 61 | CC0 | 언데드 몬스터 |
| Game-icons Lorc 선정 SVG 16종 + 고지 | 17 | CC BY 3.0 | 검·방패·투구·물약·마법·보상 |
| Clint Bellanger Grassland Tileset + 고지 | 2 | CC BY-SA 3.0 | 완성된 고전 등각 지형 이미지 |

합계 1,974개 파일 / 308,012,218바이트. 포맷별 복제·미리보기·URL 바로가기·라이선스 등이 포함되므로 고유 에셋 1,974종이라는 뜻은 아니다. 라이선스는 원본 동봉 고지와 공식 페이지로 확인했다. CC BY는 저작자 표시, CC BY-SA는 표시와 수정된 아트의 동일 조건을 유지한다. 게임 코드 라이선스와 분리한다. 예제 미리보기의 폰트·상표를 게임 UI에 그대로 쓰지 않는다.

`asset-manifest.json`에 모든 파일 SHA256·길이·경로, `collection-summary.json`에 출처·라이선스·Git revision·확장자 수량을 기록했다. LFS 포인터, PNG 서명, GLB 헤더·JSON, SVG 실행 요소 기본 검사 오류 0. 정밀 glTF 검증·외부 URI 참조·실제 애니메이션·색상·성능은 적용 단계에서 추가 확인해야 한다. 모델 파일을 모두 초기 페이지 다운로드에 넣지 않는다.

## 광범위한 비교 조사 — 읽은 공식 자료와 사용 방식

| 자료 | 확인 수준 | 가져올 가치·조건 |
| --- | --- | --- |
| [Reldens](https://github.com/damian-pastorini/reldens) | 소스 확보·선정 파일 읽음; MIT 동봉 | 퀘스트 플러그인·보상 검증·맵별 이벤트. drop processor의 중복 방지 플래그는 실패 복구까지 검토해 재설계. 전체 서버 실행은 안 함 |
| [Aetheria](https://github.com/mositron/Aetheria) | 소스 확보·jobs/quests/recipes 읽음 | 직업·상태이상·퀘스트 체인·제작대 티어 데이터 분리. README MIT 표시는 있으나 체크아웃에 독립 LICENSE 미확인; 직접 코드 이식 전 고지 확인 |
| [RPG-JS](https://github.com/RSamaium/RPG-JS) | README 구조 확인 | NPC 이벤트·맵 편집 워크플로 참고. 엔진 교체·설치 안 함 |
| [Flare](https://github.com/flareteam/flare-game) | 저장소 개요와 OGA 원본 아트 확인 | 등각 RPG 아트·콘텐츠 배치. 이번 grassland PNG만 확보, 엔진·전체 게임은 미확보 |
| [Mirage Online Classic](https://mirageonlineclassic.com/) | 공식 사이트 | 직업·던전·제작·신규 유저 안내의 구성 참고. 사이트 설명이며 로그인 실플레이 검증 아님 |
| [Flyff Universe](https://universe.flyff.com/) | 공식 사이트 | 브라우저 PC/모바일 대응 사례. 소스·상용 이미지 확보 안 함 |
| [stein.world](https://stein.world/) | 공식 페이지 읽음 | 로그인·서버 선택 흐름 참고. 읽힌 페이지의 maintenance 표시는 실제 장애 확인으로 확대하지 않음 |
| [RPG MO](https://rpg.mo.ee/) | 공식 사이트 | 장기 성장·생활·경제의 기획 비교. 실플레이 미검증 |
| [Quaternius Textured Fantasy Nature](https://quaternius.com/packs/texturedfantasynature.html) | 팩 페이지 CC0 표기·포맷 확인; 공통 QAL과 대조 필요 | 나무·꽃·버섯 후보. 바이너리 미다운로드; 취득 버전별 조건 확인 후 이용 |
| [KayKit Dungeon Pack 1.1](https://kaylousberg.itch.io/kaykit-dungeon-pack) | 공식 free/extra 구분 확인 | 이번 확보는 GitHub의 1.0이며 최신 1.1이라고 표시하지 않음. 유료 EXTRA 미구매 |
| [Poly Haven](https://polyhaven.com/license) | 공식 라이선스·사이트/API 조건 확인 | 실사 지형 텍스처 후보. 웹페이지 예제 렌더는 CC0 자산과 다름; 전체 사이트 수집 안 함 |
| [Game-icons](https://game-icons.net/about.html) | 저작자 표시 조건 확인·16종 실확보 | 통일된 스킬/아이템 아이콘 |
| [Three.js](https://threejs.org/docs/) | 공식 문서 확인 | GLTF 로딩·애니메이션·리소스 수명 관리 |
| [glTF Validator](https://github.com/KhronosGroup/glTF-Validator) | 공식 도구 소개 확인 | 다음 적용 단계의 정밀 모델 검사 후보. 이번 검사는 자체 구조 검사이며 Validator 실행으로 표기하지 않음 |

revision: Reldens `02fbb2139dcf51264139142cc4a9c103b5479a86`, Aetheria `300c1dc91feb0f412e42d05886086224aa685b7b`, Game-icons `82d948812bfe3f269ef8f731dcdb07b08160edc4`. KayKit revision은 collection-summary에 기록했다. 모든 사이트·레포를 최신 완제품으로 단정하지 않는다.

## 적용 로드맵 — 조사에 따른 제안

1. 아트 기준 고정: 현재 3D 월드를 유지하고 고전 HUD의 패널·아이콘을 통일. 2D 등각 건물·grassland는 비교 보드/영지 미리보기 후보로 먼저 시험한다. 2D 타일을 3D 지형 텍스처처럼 무작정 붙이지 않는다.
2. 실제 인벤토리: 슬롯, 장착/해제, 수량, 비교 툴팁, 상점 구매/판매. 게임 내 CC BY 고지와 자산 링크 제공.
3. NPC·퀘스트: 시작 마을→수락→필드→보상→첫 던전의 15분 플레이를 끝까지 연결. 중복 보상과 저장 복원 검사.
4. 직업·스킬: 근접/원거리/마법 역할 및 상태이상·마나·쿨다운 정의. ‘리니지 4종’ 원본 명칭/범위 확인 후 대응 수정.
5. 던전·보스: 확보된 KayKit 세트 하나로 스케일·조명·충돌·8방향 가독성 맞춤, 전투 효과·소리의 동작 시점 검증.
6. 영지·제작·경제: 채집→제작→설비→보상 소비의 순환. 강화를 무조건 랜덤 파괴로 설계하지 않고 확률·소모·복구 규칙 공개.
7. 신뢰 서버 이후: 파티·혈맹·유저 거래·PvP·공성. 로컬 저장값을 공정 온라인 경제의 권위로 삼지 않는다.

## 인수 상태

완료: 기존 기록 대조, Elbera 특정 모듈 분석·48테스트, 11개 에셋 묶음 입수·파일 감사·출처 고지.
미완료: Library 파일과 프리서버 ZIP 원본 감사, 정확한 4종 명칭, 새 에셋의 런타임 적용·실플레이 품질 검증. 게임 0.2.0 코드는 이번 조사로 변경하지 않았다.

백업 복원: core·adventurers·skeletons ZIP 세 개를 같은 폴더에 해제한 뒤 index.html을 연다. build-library.cjs는 원본 다운로드/체크아웃 폴더가 나란히 있는 조사 작업공간용 조립 스크립트이며, 백업만으로 재다운로드하는 독립 설치기는 아니다.

## 검증된 Drive 복구본
- 기본 자료: https://drive.google.com/file/d/1bdUQQ-G9CxSvTX_gkQ1WewFFcm9jWlih/view
- 모험가: https://drive.google.com/file/d/1EUvdxum0yS84BdHw9jjC4BOGYxUSUxAH/view
- 스켈레톤: https://drive.google.com/file/d/1NMomJKpfbTcbRxgyX7v313w8hEXL4Wek/view
세 ZIP을 같은 폴더에 해제한다. 업로드 후 폴더 재조회와 ZIP 내부 1,974파일 전체 SHA256 재대조 통과. ZIP별 해시는 2026-10-12-archive-receipts.json, 검증 결과는 2026-10-12-archive-verification.json 참조.
기존 FEATURE_BACKLOG.md도 추가 확인: 사냥/변신/강화, 직업/파티, 모바일 HUD, 영지/혈맹 공성의 조합이 기록되어 있다. 구체적인 4개 제품명은 여전히 확인 필요.
조립 스크립트는 원본 조사 폴더를 인수로 받는다: node docs/research/build-library.cjs <원본 체크아웃과 팩 폴더가 모인 경로>. ZIP 검증 스크립트도 -ResearchRoot로 같은 경로를 지정한다.

## 던전 zero 적용 대조 — 2026-10-12

이 기록과 연결된 ‘NJ MMO — 리니지2풍 에셋 현실적 확보·제작 방안’을 읽고 기존 프로젝트 조사와 대조했다.

- Elbera에서 우선 참고할 것은 모델·애니메이션 manifest, 좌표/스케일 정규화, 변환 결과 검사이다. 현재 확보한 KayKit GLB에는 Lineage II UKX/UTX 추출 과정이 필요하지 않다. 원작 클라이언트 변환 및 원작 이미지 반입은 수행하지 않았다.
- 첫 적용 단위는 플레이어 1명·장비 외형 3종·몬스터 3종·마을 1곳·필드 1곳으로 제안한다. 이는 적용 범위 제안이며 구현 완료 표시가 아니다.
- 자산 적용 기록에는 원본/결과 SHA256, 라이선스 URL·버전·취득일, 배포 조건, 스케일, 애니메이션 clip ID, 저장소 공개 범위를 추가한다. 미확인 값은 추정하지 않는다.
- Quaternius 공식 공통 약관은 QAL v1.0(2026-08-28)이며 게임 이용을 허용하되 독립 에셋 묶음 재배포를 제한한다. 약관 7항은 과거 취득분에 소급하지 않는다고 명시한다. 반면 Textured Fantasy Nature 팩 페이지에는 현재 CC0 표기가 남아 있다. 따라서 모든 팩을 일괄 CC0 또는 QAL로 단정하지 않고 취득한 파일의 동봉 조건과 버전별 증거를 확인한다.
- 기존에 실제 확보·백업한 11개 묶음에는 Quaternius가 포함되지 않는다. 현재 게임에 들어 있는 기존 모델의 출처 검수는 별도 미완료 항목으로 유지한다.

공식 재확인: https://quaternius.com/license.html
팩 페이지: https://quaternius.com/packs/texturedfantasynature.html
프로젝트 기록: docs/research/2026-10-12-resource-review.md
