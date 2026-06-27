export const CHAPTERS = [
  {
    id: 'chapter-01',
    number: 1,
    title: '달빛 서가의 첫 기록',
    shortTitle: '달빛 서가',
    theme: '초보 · 서고',
    story: '처음 플레이하는 이용자가 연결 규칙과 시간 보너스를 충분히 익히는 매우 쉬운 첫 서가입니다.',
    accent: '#ffe28e'
  },
  {
    id: 'chapter-02',
    number: 2,
    title: '구름 정원의 잃어버린 노래',
    shortTitle: '구름 정원',
    theme: '입문 · 정원',
    story: '작은 특수 타일과 넓어진 보드를 번갈아 경험하며 일반 난이도로 넘어가는 완충 구간입니다.',
    accent: '#94ffd0'
  },
  {
    id: 'chapter-03',
    number: 3,
    title: '별빛 탑의 조용한 수업',
    shortTitle: '별빛 탑',
    theme: '일반 · 별빛',
    story: '보스 상태바, +3초 보너스, 지체 압박을 안전하게 익히는 일반 난이도 챕터입니다.',
    accent: '#99e4ff'
  },
  {
    id: 'chapter-04',
    number: 4,
    title: '심해 기록관의 푸른 봉인',
    shortTitle: '심해 기록관',
    theme: '성장 · 심해',
    story: '큰 보드와 목표 마커가 천천히 늘어나지만, 아직 어려움으로 급격히 뛰지 않는 성장 구간입니다.',
    accent: '#7ddcff'
  },
  {
    id: 'chapter-05',
    number: 5,
    title: '황혼 장서실의 숙련 시험',
    shortTitle: '황혼 장서실',
    theme: '숙련 · 장서실',
    story: '보스 반격, 잠금, 시간 봉인이 섞이지만 실패 부담을 줄여 반복 학습할 수 있는 중후반 챕터입니다.',
    accent: '#d8c2ff'
  },
  {
    id: 'chapter-06',
    number: 6,
    title: '왕관 서고의 어려운 문',
    shortTitle: '왕관 서고',
    theme: '어려움 · 왕관',
    story: '넓은 보드와 강한 보스 패턴을 다루는 어려움 구간입니다. 악몽으로 가기 전 충분한 다리 역할을 합니다.',
    accent: '#f5c86b'
  },
  {
    id: 'chapter-07',
    number: 7,
    title: '악몽 서고의 마지막 꿈',
    shortTitle: '악몽 서고',
    theme: '악몽 · 최종권',
    story: '현재 캠페인의 최종 난이도입니다. 악몽은 마지막 장에서만 천천히 열립니다.',
    accent: '#c29bff'
  }
];

const stage = (id, chapterId, bossId, number, title, subtitle, difficultyKey, reward, unlockAfter, modifiers = []) => ({
  id,
  chapterId,
  bossId,
  number,
  title,
  subtitle,
  difficultyKey,
  reward,
  ...(unlockAfter ? { unlockAfter } : { unlockText: '기본 해금' }),
  modifiers
});

export const STAGES = [
  stage('c1-01', 'chapter-01', 'forgotten-spirit', 1, '잠에서 깬 책갈피', '초보 보드에서 첫 연결 규칙을 익힙니다', 'beginner', { label: '마법서 표지', type: 'magic-book', amount: 1 }, null, []),
  stage('c1-02', 'chapter-01', 'forgotten-spirit', 2, '촛불 아래 열쇠', '짝 맞춤 +3초 보너스를 체감하는 쉬운 복원', 'beginner', { label: '황금 열쇠', type: 'gold-key', amount: 1 }, 'c1-01', []),
  stage('c1-03', 'chapter-01', 'forgotten-spirit', 3, '모래시계의 약속', '시간 봉인 한 쌍을 천천히 확인합니다', 'beginner', { label: '시간 모래', type: 'hourglass', amount: 1 }, 'c1-02', ['timeSeal']),
  stage('c1-04', 'chapter-01', 'forgotten-spirit', 4, '달빛 문장 연습', '안개 타일이 조금 섞인 초보 전환 스테이지', 'beginner', { label: '달의 기억', type: 'moon', amount: 1 }, 'c1-03', ['fog']),
  stage('c1-05', 'chapter-01', 'forgotten-spirit', 5, '작은 서가 산책', '보드가 커지기 전 마지막 편한 구간', 'beginner', { label: '기억 파편', type: 'spark', amount: 2 }, 'c1-04', []),
  stage('c1-06', 'chapter-01', 'forgotten-spirit', 6, '첫 보스의 속삭임', '보스 상태바와 HP 감소를 확인하는 첫 관문', 'easy', { label: '수정 구슬', type: 'crystal-orb', amount: 2 }, 'c1-05', ['bossPressure']),

  stage('c2-01', 'chapter-02', 'forgotten-spirit', 7, '구름꽃 산책로', '입문 보드에서 여유 있게 진행합니다', 'easy', { label: '정원 기억', type: 'flower', amount: 2 }, 'c1-06', []),
  stage('c2-02', 'chapter-02', 'forgotten-spirit', 8, '비밀 잉크 연못', '안개와 힌트를 함께 다루는 입문 후반', 'easy', { label: '마법 잉크', type: 'ink', amount: 2 }, 'c2-01', ['fog']),
  stage('c2-03', 'chapter-02', 'shadow-librarian', 9, '잉크가 번진 악보', '콤보를 무리 없이 연습합니다', 'easy', { label: '뮤직 박스', type: 'music-box', amount: 2 }, 'c2-02', []),
  stage('c2-04', 'chapter-02', 'shadow-librarian', 10, '드래곤 알의 꿈', '잠긴 타일이 처음 등장하는 입문 스테이지', 'easy', { label: '드래곤 알', type: 'dragon-egg', amount: 2 }, 'c2-03', ['locked']),
  stage('c2-05', 'chapter-02', 'shadow-librarian', 11, '구름 정원 연주회', '시간 봉인과 일반 보드 적응을 함께 진행합니다', 'normal', { label: '기록의 깃털', type: 'feather', amount: 3 }, 'c2-04', ['timeSeal']),
  stage('c2-06', 'chapter-02', 'shadow-librarian', 12, '그림자 사서의 인사', '빠른 실수 반격을 가볍게 체험하는 챕터 보스', 'normal', { label: '서고 종', type: 'bell', amount: 3 }, 'c2-05', ['bossPressure']),

  stage('c3-01', 'chapter-03', 'shadow-librarian', 13, '별빛 계단', '일반 보드에서 외곽 연결을 익힙니다', 'normal', { label: '혜성 조각', type: 'comet', amount: 3 }, 'c2-06', ['fog']),
  stage('c3-02', 'chapter-03', 'shadow-librarian', 14, '봉인된 룬', '잠금과 보너스 시간 관리를 연습합니다', 'normal', { label: '룬 조각', type: 'rune', amount: 3 }, 'c3-01', ['locked']),
  stage('c3-03', 'chapter-03', 'shadow-librarian', 15, '왕관의 그림자', '보스 압박이 조금 강해지는 일반 후반', 'normal', { label: '꿈의 왕관', type: 'crown', amount: 3 }, 'c3-02', ['bossPressure']),
  stage('c3-04', 'chapter-03', 'sealed-page-golem', 16, '별빛 지도 조각', '힌트 빛길과 보스 경고의 우선순위를 읽는 구간', 'normal', { label: '비밀 지도', type: 'map', amount: 3 }, 'c3-03', ['fog', 'timeSeal']),
  stage('c3-05', 'chapter-03', 'sealed-page-golem', 17, '작은 골렘의 문', '묵직한 시간 압박을 낮은 강도로 연습합니다', 'growth', { label: '서고 유물', type: 'relic', amount: 4 }, 'c3-04', ['timeSeal', 'bossPressure']),
  stage('c3-06', 'chapter-03', 'sealed-page-golem', 18, '별빛 탑의 봉인', '성장 챕터로 넘어가기 전 완충 보스 스테이지', 'growth', { label: '성 조각', type: 'castle', amount: 4 }, 'c3-05', ['locked', 'bossPressure']),

  stage('c4-01', 'chapter-04', 'sealed-page-golem', 19, '푸른 기록관 입구', '넓은 보드 적응을 시작합니다', 'growth', { label: '푸른 유리병', type: 'premium-06', amount: 4 }, 'c3-06', []),
  stage('c4-02', 'chapter-04', 'sealed-page-golem', 20, '심해 서가의 물결', '큰 보드에서 선택 후 카메라 follow를 활용합니다', 'growth', { label: '별빛 사본', type: 'premium-01', amount: 4 }, 'c4-01', ['fog']),
  stage('c4-03', 'chapter-04', 'shadow-librarian', 21, '흐린 책갈피 항로', '잠긴 타일과 안개가 함께 등장합니다', 'growth', { label: '황금 문장', type: 'premium-02', amount: 4 }, 'c4-02', ['fog', 'locked']),
  stage('c4-04', 'chapter-04', 'shadow-librarian', 22, '파도 속 시간 봉인', '시간 봉인과 보스 경고가 겹치는 성장 후반', 'skilled', { label: '에메랄드 장식', type: 'premium-03', amount: 5 }, 'c4-03', ['timeSeal', 'bossPressure']),
  stage('c4-05', 'chapter-04', 'sealed-page-golem', 23, '심해의 잠긴 악보', '여러 특수 타일을 읽는 숙련 진입 구간', 'skilled', { label: '비밀 표식', type: 'premium-04', amount: 5 }, 'c4-04', ['locked', 'timeSeal']),
  stage('c4-06', 'chapter-04', 'sealed-page-golem', 24, '푸른 봉인의 수호자', '숙련 전환 챕터 보스', 'skilled', { label: '바이올렛 봉인', type: 'premium-05', amount: 5 }, 'c4-05', ['fog', 'locked', 'bossPressure']),

  stage('c5-01', 'chapter-05', 'sealed-page-golem', 25, '황혼 장서실 입구', '숙련 보드를 반복하며 리듬을 다집니다', 'skilled', { label: '심연 보석함', type: 'v2-tile-27', amount: 5 }, 'c4-06', []),
  stage('c5-02', 'chapter-05', 'forgotten-spirit', 26, '기억핵 회랑', '목표 마커가 많을 때 우선순위를 읽습니다', 'skilled', { label: '마지막 기억핵', type: 'v2-tile-36', amount: 5 }, 'c5-01', ['fog', 'timeSeal']),
  stage('c5-03', 'chapter-05', 'shadow-librarian', 27, '검은 장서의 왕관', '빠른 반격 패턴을 연습합니다', 'skilled', { label: '왕관 장서표', type: 'v2-tile-29', amount: 6 }, 'c5-02', ['locked', 'bossPressure']),
  stage('c5-04', 'chapter-05', 'shadow-librarian', 28, '황혼의 첫 시험', '어려움 전 마지막 숙련 완충 스테이지', 'expert', { label: '마법진 조각', type: 'v2-tile-31', amount: 6 }, 'c5-03', ['fog', 'bossPressure']),
  stage('c5-05', 'chapter-05', 'sealed-page-golem', 29, '봉인된 꿈의 좌석', '시간 봉인과 잠금이 함께 들어간 중후반', 'expert', { label: '골렘 심장석', type: 'v2-tile-33', amount: 6 }, 'c5-04', ['locked', 'timeSeal', 'bossPressure']),
  stage('c5-06', 'chapter-05', 'sealed-page-golem', 30, '황혼 장서실의 관문', '어려움으로 넘어가기 전 최종 연습', 'expert', { label: '빛의 스크롤', type: 'v2-tile-30', amount: 7 }, 'c5-05', ['locked', 'fog', 'timeSeal']),

  stage('c6-01', 'chapter-06', 'sealed-page-golem', 31, '왕관 서고의 문턱', '어려움 보드를 처음 다루는 구간', 'expert', { label: '왕관 문장', type: 'v2-tile-28', amount: 7 }, 'c5-06', ['bossPressure']),
  stage('c6-02', 'chapter-06', 'forgotten-spirit', 32, '긴 복도의 기억', '큰 보드에서 시간 보너스를 안정적으로 쌓습니다', 'hard', { label: '심연 열쇠', type: 'v2-tile-32', amount: 7 }, 'c6-01', ['fog', 'timeSeal']),
  stage('c6-03', 'chapter-06', 'shadow-librarian', 33, '왕관 그림자 추격', '빠른 반격과 힌트 우선순위를 다룹니다', 'hard', { label: '검은 잉크', type: 'v2-tile-34', amount: 7 }, 'c6-02', ['locked', 'bossPressure']),
  stage('c6-04', 'chapter-06', 'sealed-page-golem', 34, '봉인의 넓은 지도', '대형 보드와 특수 타일을 함께 읽습니다', 'hard', { label: '별빛 오르골', type: 'v2-tile-35', amount: 8 }, 'c6-03', ['fog', 'locked', 'timeSeal']),
  stage('c6-05', 'chapter-06', 'shadow-librarian', 35, '왕관 서고 연전', '보스 경고가 연속으로 나오는 어려움 후반', 'hard', { label: '왕관 기록', type: 'v2-tile-29', amount: 8 }, 'c6-04', ['bossPressure', 'timeSeal']),
  stage('c6-06', 'chapter-06', 'sealed-page-golem', 36, '왕관 문의 수호자', '악몽 전 마지막 어려움 챕터 보스', 'hard', { label: '수호자의 인장', type: 'v2-tile-33', amount: 8 }, 'c6-05', ['locked', 'fog', 'bossPressure']),

  stage('c7-01', 'chapter-07', 'forgotten-spirit', 37, '악몽의 첫 페이지', '악몽 보드가 처음 열리는 완충 스테이지', 'hard', { label: '악몽 책갈피', type: 'v2-tile-27', amount: 8 }, 'c6-06', ['fog']),
  stage('c7-02', 'chapter-07', 'shadow-librarian', 38, '그림자 장서의 밤', '악몽 진입 전 빠른 반격을 한 번 더 연습합니다', 'nightmare', { label: '밤의 깃털', type: 'v2-tile-30', amount: 9 }, 'c7-01', ['locked', 'bossPressure']),
  stage('c7-03', 'chapter-07', 'sealed-page-golem', 39, '봉인된 꿈의 왕좌', '시간 봉인과 잠금이 함께 들어간 악몽 후반', 'nightmare', { label: '왕좌 파편', type: 'v2-tile-31', amount: 9 }, 'c7-02', ['locked', 'timeSeal', 'bossPressure']),
  stage('c7-04', 'chapter-07', 'forgotten-spirit', 40, '무너지는 기억의 홀', '큰 보드에서 보너스 시간 유지가 중요합니다', 'nightmare', { label: '기억의 핵', type: 'v2-tile-36', amount: 9 }, 'c7-03', ['fog', 'timeSeal', 'bossPressure']),
  stage('c7-05', 'chapter-07', 'shadow-librarian', 41, '검은 왕관의 마지막 장', '빠른 반격과 큰 보드가 결합된 최종 전초전', 'nightmare', { label: '검은 왕관', type: 'v2-tile-29', amount: 10 }, 'c7-04', ['locked', 'fog', 'bossPressure']),
  stage('c7-06', 'chapter-07', 'sealed-page-golem', 42, '꿈의 지도 완성', '현재 캠페인의 마지막 악몽 보스 스테이지', 'nightmare', { label: '빛의 스크롤', type: 'v2-tile-30', amount: 10 }, 'c7-05', ['locked', 'fog', 'timeSeal', 'bossPressure'])
];

export const DEFAULT_STAGE_ID = STAGES[0].id;

export function getStageById(stageId) {
  return STAGES.find((item) => item.id === stageId) ?? STAGES[0];
}

export function getChapterById(chapterId) {
  return CHAPTERS.find((chapter) => chapter.id === chapterId) ?? CHAPTERS[0];
}

export function getStageIndex(stageId) {
  return STAGES.findIndex((item) => item.id === stageId);
}

export function getNextStage(stageId) {
  const index = getStageIndex(stageId);
  if (index < 0) return STAGES[0];
  return STAGES[index + 1] ?? null;
}

export function getChapterStages(chapterId) {
  return STAGES.filter((item) => item.chapterId === chapterId);
}

export function getDailyChallenge(date = new Date()) {
  const dateKey = date.toISOString().slice(0, 10);
  const seed = Number(dateKey.replaceAll('-', '')) || 1;
  const stageIndex = seed % STAGES.length;
  const modifierPool = ['fog', 'locked', 'timeSeal', 'bossPressure'];
  const first = modifierPool[seed % modifierPool.length];
  const second = modifierPool[Math.floor(seed / 7) % modifierPool.length];
  const modifiers = [...new Set([first, second])];
  const rewardBoost = 1 + (seed % 3);
  return {
    dateKey,
    seed,
    stageId: STAGES[stageIndex].id,
    modifiers,
    rewardBoost,
    label: `${dateKey} 한정 규칙 ${modifiers.map(formatModifier).join(' · ')}`,
    rewardLabel: `일일 보상 별가루 ×${rewardBoost}`
  };
}

export function formatModifier(modifier) {
  return ({
    fog: '안개 타일',
    locked: '잠긴 타일',
    timeSeal: '시간 봉인',
    bossPressure: '보스 압박'
  })[modifier] || modifier;
}
