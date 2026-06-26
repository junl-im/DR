# Dream Library

Premium casual fantasy Shisen-Sho puzzle RPG prototype.

## Version History

### v0.1.0 - Initial playable Firebase starter

- 세로형 9:16 모바일 우선 UI
- 사천성 연결 규칙: 같은 타일, 최대 2회 꺾기, 외곽 경로 허용
- 난이도 4단계: 입문, 일반, 어려움, 악몽
- 힌트, 섞기, 콤보, 제한시간, 점수 시스템
- Firebase Auth: 익명, 이메일, Google 로그인 연결
- Firestore: 사용자 프로필, 전역 리더보드 저장
- Firebase Hosting 설정
- GitHub Actions: main 브랜치 live 배포, PR preview 배포
- Firestore Security Rules 기본 운영형 템플릿

## Project Identity

- Project: Dream Library
- Genre: Premium Casual Fantasy Puzzle RPG
- Core: Shisen-Sho puzzle battle
- Screen: Vertical 9:16 mobile-first
- Firebase Project ID: `dream-library-b732a`
- Repository: `junl-im/DR`

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build
npm run preview
```

## Firebase Deploy

```bash
npm install -g firebase-tools
firebase login
firebase use dream-library-b732a
npm run deploy
```

## GitHub Actions Setup

Firebase Hosting과 GitHub Actions는 Firebase CLI가 서비스 계정과 GitHub secret을 자동 생성해 주는 방식이 가장 안전합니다.

```bash
firebase init hosting:github
```

권장 응답:

- GitHub repository: `junl-im/DR`
- Build command: `npm install && npm run build`
- Public directory: `dist`
- Single-page app rewrite: `Yes`
- Deploy to live channel on merge: `Yes`
- Main branch: `main`

CLI 실행 후 GitHub repository secret에 아래 이름이 있는지 확인하세요.

```text
FIREBASE_SERVICE_ACCOUNT_DREAM_LIBRARY_B732A
```

이 스타터에는 workflow YAML이 이미 포함되어 있습니다. CLI가 다른 secret 이름을 만들면 `.github/workflows/*.yml` 안의 secret 이름만 맞춰 바꾸면 됩니다.

## Firebase Authorized Domains

Firebase Console > Authentication > Settings > Authorized domains에 아래를 확인하거나 추가하세요.

```text
localhost
dream-library-b732a.firebaseapp.com
dream-library-b732a.web.app
```

커스텀 도메인을 연결한다면 예시는 다음과 같습니다.

```text
dreamlibrary.app
www.dreamlibrary.app
game.dreamlibrary.app
```

PR preview URL은 보통 매 PR마다 다른 Firebase Hosting preview 도메인이 생깁니다. Google 로그인까지 preview에서 테스트하려면 해당 preview 도메인을 Authorized domains에 추가해야 할 수 있습니다. 운영 테스트는 live 도메인에서 먼저 진행하는 것을 권장합니다.

## Firestore Collections

```text
users/{uid}
leaderboards/global/scores/{uid}
leaderboards/daily/scores/{uid}
```

현재 규칙은 다음 원칙입니다.

- 사용자 프로필은 본인만 읽고 쓸 수 있습니다.
- 리더보드는 누구나 읽을 수 있습니다.
- 리더보드 기록은 로그인한 사용자가 자기 UID 문서에만 쓸 수 있습니다.
- 점수, 시간, 이동 수, 콤보 수는 기본 범위 검증을 통과해야 합니다.
- 클라이언트 게임이므로 치트 방지는 완전하지 않습니다. 서버 검증은 추후 Cloud Functions 또는 App Check 적용 단계에서 강화합니다.

## Art Direction Seed

Dream Library stores every memory in magical books. The Void shattered the library into Memory Fragments. The player restores memories and rebuilds the library.

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

1. 실제 PNG 타일 에셋 교체
2. 보스전 연출: 연속 콤보 시 HP 감소
3. 라이브러리 복원 메타 시스템
4. 일일 스테이지와 daily 리더보드
5. Firebase App Check
6. Cloud Functions 기반 점수 검증
7. PWA 설치 지원
