const tileAsset = (name) => `${import.meta.env.BASE_URL}assets/objects/${name}.png`;

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
  { type: 'magic-book', icon: '📘', asset: tileAsset('magic-book'), label: '마법서', theme: '서고' },
  { type: 'gold-key', icon: '🗝️', asset: tileAsset('gold-key'), label: '황금 열쇠', theme: '해금' },
  { type: 'candle', icon: '🕯️', asset: tileAsset('candle'), label: '기억 촛불', theme: '의식' },
  { type: 'hourglass', icon: '⌛', asset: tileAsset('hourglass'), label: '시간 모래', theme: '시간' },
  { type: 'crystal-orb', icon: '🔮', asset: tileAsset('crystal-orb'), label: '수정 구슬', theme: '예지' },
  { type: 'rune', icon: '🔯', asset: tileAsset('rune'), label: '룬 조각', theme: '마법' },
  { type: 'ink', icon: '🖋️', asset: tileAsset('ink'), label: '마법 잉크', theme: '기록' },
  { type: 'scroll', icon: '📜', asset: tileAsset('scroll'), label: '고대 두루마리', theme: '기록' },
  { type: 'crown', icon: '👑', asset: tileAsset('crown'), label: '왕관', theme: '왕국' },
  { type: 'feather', icon: '🪶', asset: tileAsset('feather'), label: '기록의 깃털', theme: '기록' },
  { type: 'potion', icon: '🧪', asset: tileAsset('potion'), label: '포션 병', theme: '연금' },
  { type: 'star', icon: '✨', asset: tileAsset('star'), label: '별자리 조각', theme: '별빛' },
  { type: 'music-box', icon: '🎼', asset: tileAsset('music-box'), label: '뮤직 박스', theme: '추억' },
  { type: 'dragon-egg', icon: '🥚', asset: tileAsset('dragon-egg'), label: '드래곤 알', theme: '환수' },
  { type: 'relic', icon: '🏺', asset: tileAsset('relic'), label: '서고 유물', theme: '유물' },
  { type: 'moon', icon: '🌙', asset: tileAsset('moon'), label: '달의 기억', theme: '달빛' },
  { type: 'gem', icon: '💎', asset: tileAsset('gem'), label: '결정', theme: '보석' },
  { type: 'shield', icon: '🛡️', asset: tileAsset('shield'), label: '수호 방패', theme: '수호' },
  { type: 'flower', icon: '🌸', asset: tileAsset('flower'), label: '정원 기억', theme: '정원' },
  { type: 'comet', icon: '☄️', asset: tileAsset('comet'), label: '혜성 조각', theme: '별빛' },
  { type: 'bell', icon: '🔔', asset: tileAsset('bell'), label: '서고 종', theme: '알림' },
  { type: 'map', icon: '🗺️', asset: tileAsset('map'), label: '비밀 지도', theme: '탐험' },
  { type: 'castle', icon: '🏰', asset: tileAsset('castle'), label: '꿈의 성', theme: '왕국' },
  { type: 'spark', icon: '🌟', asset: tileAsset('spark'), label: '기억 파편', theme: '핵심' }
];

export const PRELOAD_ASSETS = [
  `${import.meta.env.BASE_URL}assets/backgrounds/storybook-login.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/lobby-garden.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/world-map.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/library-hall.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/memory-mist.png`,
  `${import.meta.env.BASE_URL}assets/characters/librarian-momo.png`,
  `${import.meta.env.BASE_URL}assets/characters/forgotten-spirit.png`,
  `${import.meta.env.BASE_URL}assets/ui/panel-frame.png`,
  `${import.meta.env.BASE_URL}assets/ui/reward-badge.png`,
  `${import.meta.env.BASE_URL}assets/ui/hp-frame.png`,
  `${import.meta.env.BASE_URL}assets/effects/hit-burst.png`,
  `${import.meta.env.BASE_URL}assets/effects/combo-flash.png`,
  `${import.meta.env.BASE_URL}assets/effects/magic-wave.png`,
  ...TILE_SET.map((tile) => tile.asset)
];
