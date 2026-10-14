# PC 조작과 필드 몬스터 외형 보강

WASD / 방향키는 고정 대각 카메라의 화면 기준으로 이동한다. 기존 9m/s 경로 이동·지형 충돌·던전 경계를 사용하며, 대각선 벡터를 정규화한다. 같은 방향 WASD/화살표를 중복 입력해도 방향이 틀어지지 않는다. 키 해제, 반대 키, 창 열기, 입력창 포커스, blur, visibilitychange, 일시정지 시 이동이 멈춘다. 수동 이동은 자동사냥/의뢰 자동이동을 취소한다. 마우스·터치 조작도 유지한다.

Space / 1 공격 전환, 2 강타, 3 물약, Q 회피, Tab 다음 대상, H 자동사냥, R 귀환. I/B 인벤토리, C 캐릭터, J 의뢰, T 영지, O 옵션은 같은 키를 다시 누르면 닫힌다. Esc 닫기. 물리 키 code로 한글 배열을 지원하고, 입력/편집/선택 폼·IME 조합·Ctrl/Alt/Meta 브라우저 단축키는 게임 입력에서 제외한다. 포커스된 버튼의 Space/Enter 활성화는 보존한다.

필드 18개체의 외형은 2종에서 8종으로 확대했다: Gremlin, Crasher, Goblin, GoblinScout, OrcSoldier, Werewolf, Wolf, OrcWarrior(정예). 모두 기존 Quaternius CC0 GLB 및 LICENSE.txt를 사용한다. 출현 ID별 결정적 외형 매핑으로 리젠·재접속·프리로드가 일치한다. 실제 GLB 메시/스킨과 모든 idle/move/attack/cast/die 클립 존재를 테스트한다. Goblin 이외 리그에는 몽둥이를 잘못 부착하지 않는다. 기존 NPC ID·이름·HP·드롭·퀘스트 대상·세이브 버전과 온라인 ID는 바꾸지 않는다. 정예 황금 오라 및 던전 보스 독립 외형 유지.

검증: pc-controls.spec.ts, field-bestiary.spec.ts, mobs.spec.ts 및 전체 클라이언트/코어/타입/에셋/빌드. scripts/controls-bestiary-smoke.cjs는 실제 Chromium WebGL PC1440/모바일390에서 8방향키 이동·정지, 창6종 토글/이동 차단, 채팅 입력, blur, 수동 자동사냥 중단, Space 공격 전환/실제 처치, HTTP200 GLB8종 및 렌더링을 검증한다. 원래 WebGL 작업과 별도 job으로 실행하여 기존 검증을 줄이지 않는다.

추가 발견: 외부 Google Fonts CSS @import가 차단되면 Vite 동적 CSS preload 오류로 첫 화면 자체가 열리지 않았다. 원격 import를 제거하여 기기 글꼴 폴백을 사용한다. WebGL 증빙은 Google Fonts를 명시적으로 차단한 상태에서 시작부터 플레이까지 확인한다. 필드 접근 증빙은 일반 자동 의뢰 이동 UI를 사용하여 정상 피격 반격 자동사냥이 임의 좌표 접근 경로를 바꾸는 상황과 충돌하지 않게 했다.


수동 키를 누르고 있는 동안에는 피격 이벤트로 자동 반격이 다시 켜져 이동 의도를 빼앗지 않는다. 키를 놓은 뒤에는 기존 피격 자동 반격 정책이 다시 적용된다.

