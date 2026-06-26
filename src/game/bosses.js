const bossAsset = (name) => `${import.meta.env.BASE_URL}assets/characters/${name}.png`;

export const BOSSES = {
  forgottenSpirit: {
    id: 'forgotten-spirit',
    name: '망각의 서고령',
    title: '달빛 서가의 파수꾼',
    asset: bossAsset('forgotten-spirit'),
    element: 'violet',
    patternLabel: '잔상 압박 · 6콤보마다 반격 예고',
    attackLine: '망각의 서고령이 기억 잔상을 흩뿌립니다. 빠르게 연결하세요.',
    warningSeconds: 15,
    comboWarningEvery: 6,
    shakePower: 7
  },
  shadowLibrarian: {
    id: 'shadow-librarian',
    name: '그림자 장서관장',
    title: '구름 정원의 검은 사서',
    asset: bossAsset('shadow-librarian'),
    element: 'sky',
    patternLabel: '책갈피 봉쇄 · 5콤보마다 판 흔들림',
    attackLine: '그림자 장서관장이 책갈피를 봉쇄합니다. 콤보를 이어 반격하세요.',
    warningSeconds: 18,
    comboWarningEvery: 5,
    shakePower: 8
  },
  sealedPageGolem: {
    id: 'sealed-page-golem',
    name: '봉인된 페이지 골렘',
    title: '별빛 탑의 마지막 봉인',
    asset: bossAsset('sealed-page-golem'),
    element: 'gold',
    patternLabel: '봉인 파동 · 4콤보마다 강한 충격',
    attackLine: '봉인된 페이지 골렘이 마법진을 내려칩니다. 남은 오브젝트를 정리하세요.',
    warningSeconds: 20,
    comboWarningEvery: 4,
    shakePower: 10
  }
};

export function getBossById(bossId) {
  return Object.values(BOSSES).find((boss) => boss.id === bossId) || BOSSES.forgottenSpirit;
}

export function getBossForStage(stage) {
  if (stage?.bossId) return getBossById(stage.bossId);
  if (stage?.chapterId === 'chapter-03') return BOSSES.sealedPageGolem;
  if (stage?.chapterId === 'chapter-02') return BOSSES.shadowLibrarian;
  return BOSSES.forgottenSpirit;
}

export function getBossPhase(percent) {
  if (percent <= 25) return 'danger';
  if (percent <= 55) return 'wounded';
  return 'stable';
}

export function getBossStageTags(stage) {
  const boss = getBossForStage(stage);
  return [boss.title, boss.patternLabel].filter(Boolean);
}
