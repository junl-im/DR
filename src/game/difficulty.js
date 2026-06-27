const tileAsset = (name) => `${import.meta.env.BASE_URL}assets/objects/${name}.png`;
const stateTileAsset = (name, state = 'normal') => `${import.meta.env.BASE_URL}assets/objects/v2-state/${name}-${state}.png`;
const stateTileSet = (name) => ({
  normal: stateTileAsset(name, 'normal'),
  selected: stateTileAsset(name, 'selected'),
  hint: stateTileAsset(name, 'hint'),
  locked: stateTileAsset(name, 'locked'),
  disabled: stateTileAsset(name, 'disabled')
});

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
    iconTypes: 16,
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
    iconTypes: 26,
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
    iconTypes: 36,
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
  { type: 'spark', icon: '🌟', asset: tileAsset('spark'), label: '기억 파편', theme: '핵심' },

  { type: 'premium-01', icon: '✦', asset: tileAsset('premium-01'), label: '별빛 사본', theme: '프리미엄' },
  { type: 'premium-02', icon: '✦', asset: tileAsset('premium-02'), label: '황금 문장', theme: '프리미엄' },
  { type: 'premium-03', icon: '✦', asset: tileAsset('premium-03'), label: '에메랄드 장식', theme: '프리미엄' },
  { type: 'premium-04', icon: '✦', asset: tileAsset('premium-04'), label: '비밀 표식', theme: '프리미엄' },
  { type: 'premium-05', icon: '✦', asset: tileAsset('premium-05'), label: '바이올렛 봉인', theme: '프리미엄' },
  { type: 'premium-06', icon: '✦', asset: tileAsset('premium-06'), label: '푸른 유리병', theme: '프리미엄' },
  { type: 'premium-07', icon: '✦', asset: tileAsset('premium-07'), label: '달빛 장신구', theme: '프리미엄' },
  { type: 'premium-08', icon: '✦', asset: tileAsset('premium-08'), label: '서고 별장식', theme: '프리미엄' },
  { type: 'premium-09', icon: '✦', asset: tileAsset('premium-09'), label: '마력 룬석', theme: '프리미엄' },
  { type: 'premium-10', icon: '✦', asset: tileAsset('premium-10'), label: '청금석 오브', theme: '프리미엄' },
  { type: 'premium-11', icon: '✦', asset: tileAsset('premium-11'), label: '금속 책갈피', theme: '프리미엄' },
  { type: 'premium-12', icon: '✦', asset: tileAsset('premium-12'), label: '빛의 종장', theme: '프리미엄' },
  { type: 'premium-13', icon: '✦', asset: tileAsset('premium-13'), label: '꿈결 오브젝트', theme: '프리미엄' },
  { type: 'premium-14', icon: '✦', asset: tileAsset('premium-14'), label: '구름 문양', theme: '프리미엄' },
  { type: 'premium-15', icon: '✦', asset: tileAsset('premium-15'), label: '황혼 조각', theme: '프리미엄' },
  { type: 'premium-16', icon: '✦', asset: tileAsset('premium-16'), label: '천공 장식', theme: '프리미엄' },
  { type: 'premium-17', icon: '✦', asset: tileAsset('premium-17'), label: '별무리 보석', theme: '프리미엄' },
  { type: 'premium-18', icon: '✦', asset: tileAsset('premium-18'), label: '금빛 봉인구', theme: '프리미엄' },
  { type: 'premium-19', icon: '✦', asset: tileAsset('premium-19'), label: '심연 등불', theme: '프리미엄' },
  { type: 'premium-20', icon: '✦', asset: tileAsset('premium-20'), label: '꿈의 조율기', theme: '프리미엄' },
  { type: 'premium-21', icon: '✦', asset: tileAsset('premium-21'), label: '마법 원반', theme: '프리미엄' },
  { type: 'premium-22', icon: '✦', asset: tileAsset('premium-22'), label: '푸른 결정핵', theme: '프리미엄' },
  { type: 'premium-23', icon: '✦', asset: tileAsset('premium-23'), label: '고대 장서핀', theme: '프리미엄' },
  { type: 'premium-24', icon: '✦', asset: tileAsset('premium-24'), label: '서고 심장', theme: '프리미엄' },

  { type: 'v2-tile-01', icon: '✦', asset: stateTileAsset('v2-tile-01'), stateAssets: stateTileSet('v2-tile-01'), label: '달빛 사서의 펜', theme: 'v2 에셋' },
  { type: 'v2-tile-02', icon: '✦', asset: stateTileAsset('v2-tile-02'), stateAssets: stateTileSet('v2-tile-02'), label: '에메랄드 비전서', theme: 'v2 에셋' },
  { type: 'v2-tile-03', icon: '✦', asset: stateTileAsset('v2-tile-03'), stateAssets: stateTileSet('v2-tile-03'), label: '황금 룬 촛대', theme: 'v2 에셋' },
  { type: 'v2-tile-04', icon: '✦', asset: stateTileAsset('v2-tile-04'), stateAssets: stateTileSet('v2-tile-04'), label: '바이올렛 봉인장', theme: 'v2 에셋' },
  { type: 'v2-tile-05', icon: '✦', asset: stateTileAsset('v2-tile-05'), stateAssets: stateTileSet('v2-tile-05'), label: '스카이블루 수정핵', theme: 'v2 에셋' },
  { type: 'v2-tile-06', icon: '✦', asset: stateTileAsset('v2-tile-06'), stateAssets: stateTileSet('v2-tile-06'), label: '네이비 별지도', theme: 'v2 에셋' },
  { type: 'v2-tile-07', icon: '✦', asset: stateTileAsset('v2-tile-07'), stateAssets: stateTileSet('v2-tile-07'), label: '마법 꽃갈피', theme: 'v2 에셋' },
  { type: 'v2-tile-08', icon: '✦', asset: stateTileAsset('v2-tile-08'), stateAssets: stateTileSet('v2-tile-08'), label: '꿈결 장서핀', theme: 'v2 에셋' },
  { type: 'v2-tile-09', icon: '✦', asset: stateTileAsset('v2-tile-09'), stateAssets: stateTileSet('v2-tile-09'), label: '시간의 작은 종', theme: 'v2 에셋' },
  { type: 'v2-tile-10', icon: '✦', asset: stateTileAsset('v2-tile-10'), stateAssets: stateTileSet('v2-tile-10'), label: '고대 유리병', theme: 'v2 에셋' },
  { type: 'v2-tile-11', icon: '✦', asset: stateTileAsset('v2-tile-11'), stateAssets: stateTileSet('v2-tile-11'), label: '금빛 마법 원반', theme: 'v2 에셋' },
  { type: 'v2-tile-12', icon: '✦', asset: stateTileAsset('v2-tile-12'), stateAssets: stateTileSet('v2-tile-12'), label: '푸른 조율석', theme: 'v2 에셋' },
  { type: 'v2-tile-13', icon: '✦', asset: stateTileAsset('v2-tile-13'), stateAssets: stateTileSet('v2-tile-13'), label: '별가루 사과', theme: 'v2 에셋' },
  { type: 'v2-tile-14', icon: '✦', asset: stateTileAsset('v2-tile-14'), stateAssets: stateTileSet('v2-tile-14'), label: '흐르는 잉크병', theme: 'v2 에셋' },
  { type: 'v2-tile-15', icon: '✦', asset: stateTileAsset('v2-tile-15'), stateAssets: stateTileSet('v2-tile-15'), label: '달의 손거울', theme: 'v2 에셋' },
  { type: 'v2-tile-16', icon: '✦', asset: stateTileAsset('v2-tile-16'), stateAssets: stateTileSet('v2-tile-16'), label: '봉인된 카드', theme: 'v2 에셋' },
  { type: 'v2-tile-17', icon: '✦', asset: stateTileAsset('v2-tile-17'), stateAssets: stateTileSet('v2-tile-17'), label: '요정의 깃털', theme: 'v2 에셋' },
  { type: 'v2-tile-18', icon: '✦', asset: stateTileAsset('v2-tile-18'), stateAssets: stateTileSet('v2-tile-18'), label: '마력 등불', theme: 'v2 에셋' },
  { type: 'v2-tile-19', icon: '✦', asset: stateTileAsset('v2-tile-19'), stateAssets: stateTileSet('v2-tile-19'), label: '구름 정원 씨앗', theme: 'v2 에셋' },
  { type: 'v2-tile-20', icon: '✦', asset: stateTileAsset('v2-tile-20'), stateAssets: stateTileSet('v2-tile-20'), label: '비밀 서가 문장', theme: 'v2 에셋' },
  { type: 'v2-tile-21', icon: '✦', asset: stateTileAsset('v2-tile-21'), stateAssets: stateTileSet('v2-tile-21'), label: '초승달 구슬', theme: 'v2 에셋' },
  { type: 'v2-tile-22', icon: '✦', asset: stateTileAsset('v2-tile-22'), stateAssets: stateTileSet('v2-tile-22'), label: '고양이 사서 배지', theme: 'v2 에셋' },
  { type: 'v2-tile-23', icon: '✦', asset: stateTileAsset('v2-tile-23'), stateAssets: stateTileSet('v2-tile-23'), label: '작은 보스 토템', theme: 'v2 에셋' },
  { type: 'v2-tile-24', icon: '✦', asset: stateTileAsset('v2-tile-24'), stateAssets: stateTileSet('v2-tile-24'), label: '아케인 종이학', theme: 'v2 에셋' },
  { type: 'v2-tile-25', icon: '✦', asset: stateTileAsset('v2-tile-25'), stateAssets: stateTileSet('v2-tile-25'), label: '밤하늘 책갈피', theme: 'v2 에셋' },
  { type: 'v2-tile-26', icon: '✦', asset: stateTileAsset('v2-tile-26'), stateAssets: stateTileSet('v2-tile-26'), label: '서고 열쇠고리', theme: 'v2 에셋' },
  { type: 'v2-tile-27', icon: '✦', asset: stateTileAsset('v2-tile-27'), stateAssets: stateTileSet('v2-tile-27'), label: '심연 보석함', theme: 'v2 에셋' },
  { type: 'v2-tile-28', icon: '✦', asset: stateTileAsset('v2-tile-28'), stateAssets: stateTileSet('v2-tile-28'), label: '회복의 물약잔', theme: 'v2 에셋' },
  { type: 'v2-tile-29', icon: '✦', asset: stateTileAsset('v2-tile-29'), stateAssets: stateTileSet('v2-tile-29'), label: '왕관 장서표', theme: 'v2 에셋' },
  { type: 'v2-tile-30', icon: '✦', asset: stateTileAsset('v2-tile-30'), stateAssets: stateTileSet('v2-tile-30'), label: '빛의 스크롤', theme: 'v2 에셋' },
  { type: 'v2-tile-31', icon: '✦', asset: stateTileAsset('v2-tile-31'), stateAssets: stateTileSet('v2-tile-31'), label: '마법진 조각', theme: 'v2 에셋' },
  { type: 'v2-tile-32', icon: '✦', asset: stateTileAsset('v2-tile-32'), stateAssets: stateTileSet('v2-tile-32'), label: '은하 모래시계', theme: 'v2 에셋' },
  { type: 'v2-tile-33', icon: '✦', asset: stateTileAsset('v2-tile-33'), stateAssets: stateTileSet('v2-tile-33'), label: '골렘 심장석', theme: 'v2 에셋' },
  { type: 'v2-tile-34', icon: '✦', asset: stateTileAsset('v2-tile-34'), stateAssets: stateTileSet('v2-tile-34'), label: '그림자 잉크', theme: 'v2 에셋' },
  { type: 'v2-tile-35', icon: '✦', asset: stateTileAsset('v2-tile-35'), stateAssets: stateTileSet('v2-tile-35'), label: '별빛 오르골', theme: 'v2 에셋' },
  { type: 'v2-tile-36', icon: '✦', asset: stateTileAsset('v2-tile-36'), stateAssets: stateTileSet('v2-tile-36'), label: '마지막 기억핵', theme: 'v2 에셋' }
];

const V2_TILE_TYPES = new Set(TILE_SET.filter((tile) => tile.theme === 'v2 에셋').map((tile) => tile.type));

export const GAMEPLAY_TILE_SET = [
  ...TILE_SET.filter((tile) => tile.theme === 'v2 에셋'),
  ...TILE_SET.filter((tile) => tile.theme === '프리미엄'),
  ...TILE_SET.filter((tile) => tile.theme !== 'v2 에셋' && tile.theme !== '프리미엄')
];

export function getGameplayTiles(iconTypes = 16) {
  const count = Math.max(1, Math.min(Number(iconTypes) || 16, GAMEPLAY_TILE_SET.length));
  return GAMEPLAY_TILE_SET.slice(0, count);
}

export function isV2GameplayTile(type) {
  return V2_TILE_TYPES.has(type);
}

export const TILE_ATLAS_ASSETS = [
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.atlas.json`,
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.png`
];

export const BOSS_FRAME_ATLAS_ASSETS = [
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.atlas.json`,
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.png`
];

export const ATLAS_WEBP_ASSETS = [
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.webp`,
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.webp`
];

export const ATLAS_ASSETS = [
  ...TILE_ATLAS_ASSETS,
  ...BOSS_FRAME_ATLAS_ASSETS,
  ...ATLAS_WEBP_ASSETS,
  `${import.meta.env.BASE_URL}assets/atlas/dream-objects.png`,
  `${import.meta.env.BASE_URL}assets/atlas/dream-objects.atlas.json`,
  `${import.meta.env.BASE_URL}assets/meta/texture-atlas-manifest-v1.0.24.json`
];

export const PRELOAD_ASSETS = [
  // v1.0.24: keep packed tile, boss atlas and compressed candidates explicit so Actions policy checks never miss them.
  ...TILE_ATLAS_ASSETS,
  ...BOSS_FRAME_ATLAS_ASSETS,
  ...ATLAS_WEBP_ASSETS,
  ...ATLAS_ASSETS,
  `${import.meta.env.BASE_URL}assets/backgrounds/storybook-login.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/lobby-garden.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/world-map.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/library-hall.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/memory-mist.png`,
  `${import.meta.env.BASE_URL}assets/characters/librarian-momo.png`,
  `${import.meta.env.BASE_URL}assets/characters/forgotten-spirit.png`,
  `${import.meta.env.BASE_URL}assets/characters/shadow-librarian.png`,
  `${import.meta.env.BASE_URL}assets/characters/sealed-page-golem.png`,
  `${import.meta.env.BASE_URL}assets/ui/panel-frame.png`,
  `${import.meta.env.BASE_URL}assets/ui/reward-badge.png`,
  `${import.meta.env.BASE_URL}assets/ui/hp-frame.png`,
  `${import.meta.env.BASE_URL}assets/effects/hit-burst.png`,
  `${import.meta.env.BASE_URL}assets/effects/combo-flash.png`,
  `${import.meta.env.BASE_URL}assets/effects/magic-wave.png`,
  `${import.meta.env.BASE_URL}assets/meta/restoration-shelf.png`,
  `${import.meta.env.BASE_URL}assets/meta/daily-badge.png`,
  `${import.meta.env.BASE_URL}assets/meta/browser-handoff.png`,
  `${import.meta.env.BASE_URL}assets/meta/collection-codex.png`,

  `${import.meta.env.BASE_URL}assets/backgrounds/imported-moon-library.png`,
  `${import.meta.env.BASE_URL}assets/characters/assistant-01.png`,
  `${import.meta.env.BASE_URL}assets/characters/assistant-02.png`,
  `${import.meta.env.BASE_URL}assets/characters/assistant-03.png`,
  `${import.meta.env.BASE_URL}assets/characters/assistant-04.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-import-01.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-import-02.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-import-03.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-import-04.png`,
  ...Array.from({ length: 6 }, (_, index) => `${import.meta.env.BASE_URL}assets/effects/import-vfx-${String(index + 1).padStart(2, '0')}.png`),
  ...Array.from({ length: 10 }, (_, index) => `${import.meta.env.BASE_URL}assets/effects/particles-${String(index + 1).padStart(2, '0')}.png`),
  `${import.meta.env.BASE_URL}assets/ui/icon-back.png`,
  `${import.meta.env.BASE_URL}assets/ui/icon-home.png`,
  `${import.meta.env.BASE_URL}assets/meta/asset-import-v1.0.11.json`,
  `${import.meta.env.BASE_URL}assets/meta/texture-atlas-manifest-v1.0.24.json`,
  `${import.meta.env.BASE_URL}assets/meta/asset-import-v1.0.17.json`,
  `${import.meta.env.BASE_URL}assets/backgrounds/moon-library-v2.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/moon-library-v2.webp`,
  `${import.meta.env.BASE_URL}assets/backgrounds/gothic-window-v2.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/gothic-window-v2.webp`,
  `${import.meta.env.BASE_URL}assets/backgrounds/bookshelf-v2.png`,
  `${import.meta.env.BASE_URL}assets/backgrounds/bookshelf-v2.webp`,
  `${import.meta.env.BASE_URL}assets/characters/mascot-scholar-v2.png`,
  `${import.meta.env.BASE_URL}assets/characters/mascot-companions-v2.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-motion-sheet-v2.png`,
  `${import.meta.env.BASE_URL}assets/characters/boss-sticker-sheet-v2.png`,
  `${import.meta.env.BASE_URL}assets/ui/logo-dream-library-v2.png`,
  `${import.meta.env.BASE_URL}assets/ui/frame-ornate-v2.png`,
  ...Array.from({ length: 24 }, (_, index) => `${import.meta.env.BASE_URL}assets/effects/v2-fragments/v2-fragment-${String(index + 1).padStart(2, '0')}.png`),
  ...TILE_SET.flatMap((tile) => tile.stateAssets ? Object.values(tile.stateAssets) : [tile.asset])
];
