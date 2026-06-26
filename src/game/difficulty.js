export const DIFFICULTIES = {
  easy: {
    key: 'easy',
    label: '입문',
    rows: 6,
    cols: 6,
    iconTypes: 9,
    timeLimitSeconds: 240,
    hints: 5,
    shuffles: 5,
    scoreMultiplier: 1
  },
  normal: {
    key: 'normal',
    label: '일반',
    rows: 8,
    cols: 8,
    iconTypes: 14,
    timeLimitSeconds: 300,
    hints: 4,
    shuffles: 4,
    scoreMultiplier: 1.25
  },
  hard: {
    key: 'hard',
    label: '어려움',
    rows: 8,
    cols: 10,
    iconTypes: 18,
    timeLimitSeconds: 360,
    hints: 3,
    shuffles: 3,
    scoreMultiplier: 1.55
  },
  expert: {
    key: 'expert',
    label: '악몽',
    rows: 10,
    cols: 12,
    iconTypes: 24,
    timeLimitSeconds: 480,
    hints: 2,
    shuffles: 2,
    scoreMultiplier: 2
  }
};

export const TILE_SET = [
  { type: 'magic-book', icon: '📘', label: '마법서' },
  { type: 'gold-key', icon: '🗝️', label: '황금 열쇠' },
  { type: 'candle', icon: '🕯️', label: '기억 촛불' },
  { type: 'hourglass', icon: '⌛', label: '시간 모래' },
  { type: 'crystal-orb', icon: '🔮', label: '수정 구슬' },
  { type: 'rune', icon: '🔯', label: '룬 조각' },
  { type: 'ink', icon: '🖋️', label: '마법 잉크' },
  { type: 'scroll', icon: '📜', label: '고대 두루마리' },
  { type: 'crown', icon: '👑', label: '왕관' },
  { type: 'feather', icon: '🪶', label: '기록의 깃털' },
  { type: 'potion', icon: '🧪', label: '포션 병' },
  { type: 'star', icon: '✨', label: '별자리 조각' },
  { type: 'music-box', icon: '🎼', label: '뮤직 박스' },
  { type: 'dragon-egg', icon: '🥚', label: '드래곤 알' },
  { type: 'relic', icon: '🏺', label: '서고 유물' },
  { type: 'moon', icon: '🌙', label: '달의 기억' },
  { type: 'gem', icon: '💎', label: '결정' },
  { type: 'shield', icon: '🛡️', label: '수호 방패' },
  { type: 'flower', icon: '🌸', label: '정원 기억' },
  { type: 'comet', icon: '☄️', label: '혜성 조각' },
  { type: 'bell', icon: '🔔', label: '서고 종' },
  { type: 'map', icon: '🗺️', label: '비밀 지도' },
  { type: 'castle', icon: '🏰', label: '꿈의 성' },
  { type: 'spark', icon: '🌟', label: '기억 파편' }
];
