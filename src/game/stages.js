export const CHAPTERS = [
  {
    id: 'chapter-01',
    number: 1,
    title: '달빛 서가의 첫 기록',
    shortTitle: '달빛 서가',
    theme: '튜토리얼 · 서고',
    story: '잠든 서고에 흩어진 첫 번째 꿈 조각을 모아 모모의 기록장을 되살립니다.',
    accent: '#ffe28e'
  },
  {
    id: 'chapter-02',
    number: 2,
    title: '구름 정원의 잃어버린 노래',
    shortTitle: '구름 정원',
    theme: '성장 · 정원',
    story: '구름꽃 사이에 감춰진 멜로디를 찾아 다음 서가의 문을 엽니다.',
    accent: '#94ffd0'
  },
  {
    id: 'chapter-03',
    number: 3,
    title: '별빛 탑의 봉인된 페이지',
    shortTitle: '별빛 탑',
    theme: '도전 · 별빛',
    story: '별빛 탑 꼭대기에서 오래된 봉인을 풀고 꿈의 지도 마지막 조각을 되찾습니다.',
    accent: '#99e4ff'
  }
];

export const STAGES = [
  {
    id: 'c1-01',
    chapterId: 'chapter-01',
    bossId: 'forgotten-spirit',
    number: 1,
    title: '잠에서 깬 책갈피',
    subtitle: '첫 연결 규칙을 익히는 가벼운 복원',
    difficultyKey: 'easy',
    reward: { label: '마법서 표지', type: 'magic-book', amount: 1 },
    unlockText: '기본 해금',
    modifiers: []
  },
  {
    id: 'c1-02',
    chapterId: 'chapter-01',
    bossId: 'forgotten-spirit',
    number: 2,
    title: '촛불 아래 열쇠',
    subtitle: '힌트와 섞기를 아껴 쓰는 연습',
    difficultyKey: 'easy',
    reward: { label: '황금 열쇠', type: 'gold-key', amount: 1 },
    unlockAfter: 'c1-01',
    modifiers: ['fog']
  },
  {
    id: 'c1-03',
    chapterId: 'chapter-01',
    bossId: 'forgotten-spirit',
    number: 3,
    title: '모래시계의 약속',
    subtitle: '제한시간 보너스를 노리는 스테이지',
    difficultyKey: 'normal',
    reward: { label: '시간 모래', type: 'hourglass', amount: 2 },
    unlockAfter: 'c1-02',
    modifiers: ['timeSeal']
  },
  {
    id: 'c1-04',
    chapterId: 'chapter-01',
    bossId: 'forgotten-spirit',
    number: 4,
    title: '달빛 문장',
    subtitle: '첫 챕터 마무리 보스 퍼즐',
    difficultyKey: 'normal',
    reward: { label: '달의 기억', type: 'moon', amount: 2 },
    unlockAfter: 'c1-03',
    modifiers: ['fog', 'bossPressure']
  },
  {
    id: 'c2-01',
    chapterId: 'chapter-02',
    bossId: 'shadow-librarian',
    number: 5,
    title: '구름꽃 산책로',
    subtitle: '더 넓은 보드와 다양한 타일이 등장합니다',
    difficultyKey: 'normal',
    reward: { label: '정원 기억', type: 'flower', amount: 2 },
    unlockAfter: 'c1-04',
    modifiers: ['locked']
  },
  {
    id: 'c2-02',
    chapterId: 'chapter-02',
    bossId: 'shadow-librarian',
    number: 6,
    title: '잉크가 번진 악보',
    subtitle: '콤보 유지가 중요한 중반 스테이지',
    difficultyKey: 'hard',
    reward: { label: '뮤직 박스', type: 'music-box', amount: 3 },
    unlockAfter: 'c2-01',
    modifiers: ['fog', 'locked']
  },
  {
    id: 'c2-03',
    chapterId: 'chapter-02',
    bossId: 'shadow-librarian',
    number: 7,
    title: '드래곤 알의 꿈',
    subtitle: '연결 가능한 외곽 경로를 적극 활용하세요',
    difficultyKey: 'hard',
    reward: { label: '드래곤 알', type: 'dragon-egg', amount: 3 },
    unlockAfter: 'c2-02',
    modifiers: ['bossPressure']
  },
  {
    id: 'c2-04',
    chapterId: 'chapter-02',
    bossId: 'shadow-librarian',
    number: 8,
    title: '구름 정원 연주회',
    subtitle: '두 번째 챕터 클리어 관문',
    difficultyKey: 'hard',
    reward: { label: '기록의 깃털', type: 'feather', amount: 3 },
    unlockAfter: 'c2-03',
    modifiers: ['timeSeal', 'bossPressure']
  },
  {
    id: 'c3-01',
    chapterId: 'chapter-03',
    bossId: 'sealed-page-golem',
    number: 9,
    title: '별빛 계단',
    subtitle: '후반부의 넓은 판을 여는 도전',
    difficultyKey: 'hard',
    reward: { label: '혜성 조각', type: 'comet', amount: 4 },
    unlockAfter: 'c2-04',
    modifiers: ['locked', 'timeSeal']
  },
  {
    id: 'c3-02',
    chapterId: 'chapter-03',
    bossId: 'sealed-page-golem',
    number: 10,
    title: '봉인된 룬',
    subtitle: '남은 힌트와 섞기를 계산하며 진행하세요',
    difficultyKey: 'expert',
    reward: { label: '룬 조각', type: 'rune', amount: 4 },
    unlockAfter: 'c3-01',
    modifiers: ['fog', 'timeSeal', 'bossPressure']
  },
  {
    id: 'c3-03',
    chapterId: 'chapter-03',
    bossId: 'sealed-page-golem',
    number: 11,
    title: '왕관의 그림자',
    subtitle: '최대 크기 보드에 가까운 고난도 복원',
    difficultyKey: 'expert',
    reward: { label: '꿈의 왕관', type: 'crown', amount: 5 },
    unlockAfter: 'c3-02',
    modifiers: ['locked', 'fog', 'bossPressure']
  },
  {
    id: 'c3-04',
    chapterId: 'chapter-03',
    bossId: 'sealed-page-golem',
    number: 12,
    title: '꿈의 지도 완성',
    subtitle: '현재 캠페인의 마지막 보스 스테이지',
    difficultyKey: 'expert',
    reward: { label: '비밀 지도', type: 'map', amount: 5 },
    unlockAfter: 'c3-03',
    modifiers: ['locked', 'fog', 'timeSeal', 'bossPressure']
  }
];

export const DEFAULT_STAGE_ID = STAGES[0].id;

export function getStageById(stageId) {
  return STAGES.find((stage) => stage.id === stageId) ?? STAGES[0];
}

export function getChapterById(chapterId) {
  return CHAPTERS.find((chapter) => chapter.id === chapterId) ?? CHAPTERS[0];
}

export function getStageIndex(stageId) {
  return STAGES.findIndex((stage) => stage.id === stageId);
}

export function getNextStage(stageId) {
  const index = getStageIndex(stageId);
  if (index < 0) return STAGES[0];
  return STAGES[index + 1] ?? null;
}

export function getChapterStages(chapterId) {
  return STAGES.filter((stage) => stage.chapterId === chapterId);
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
