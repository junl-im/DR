import { collection, doc, getDocs, limit, orderBy, query, serverTimestamp, setDoc } from 'firebase/firestore';
import './styles.css';
import { db, firebaseReady } from './firebase.js';
import { completeGoogleRedirect, getDisplayName, loginAnonymously, loginWithEmail, loginWithGoogle, logout, observeAuth, signupWithEmail } from './auth.js';
import { ATLAS_ASSETS, BOSS_FRAME_ATLAS_ASSETS, DIFFICULTIES, PRELOAD_ASSETS, TILE_SET } from './game/difficulty.js';
import { CHAPTERS, DEFAULT_STAGE_ID, STAGES, SUMMER_SEASON_EVENT, getChapterById, getChapterStages, getDailyChallenge, getNextStage, getStageById, getStageIndex } from './game/stages.js';
import { countRemaining, countSpecialTiles, createBoard, findConnectionPath, findHint, getTileAt, isCleared, isSpecialTileBlocked, revealAllSpecial, revealPairSpecials, revealSpecialTile, removePair, shuffleRemaining } from './game/shisen.js';
import { getBossForStage, getBossPhase, getBossStageTags } from './game/bosses.js';
import { BOSS_ATLAS_SHEET, getBossAtlasFrame } from './game/bossAtlas.js';
import { initBrowserGuard } from './platform/browserGuard.js';
import { initFullscreenControls, requestGameFullscreen, syncGameViewport } from './platform/fullscreen.js';
import { initPortraitRuntimeGuard } from './platform/portraitLock.js';
import { initInstallPrompt, registerServiceWorker } from './platform/pwa.js';
import { GAME_TITLE } from './config/design';
import { DreamPixiRenderer, BoardPoint } from './rendering/DreamPixiRenderer';
import { detectDeviceProfile, nextQualityTier, saveQualityTier } from './systems/performance';
import { HAPTIC } from './systems/haptics';

const backgroundImageSet = (name: string) => `image-set(url(${import.meta.env.BASE_URL}assets/backgrounds/${name}.webp) type("image/webp"), url(${import.meta.env.BASE_URL}assets/backgrounds/${name}.png) type("image/png"))`;

document.documentElement.style.setProperty('--library-background-url', backgroundImageSet('moon-library-v2'));
document.documentElement.style.setProperty('--title-logo-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/logo-dream-library-v2.png)`);
document.documentElement.style.setProperty('--start-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-start-v2.png)`);
document.documentElement.style.setProperty('--google-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-google-v2.png)`);
document.documentElement.style.setProperty('--email-button-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/button-email-v2.png)`);
document.documentElement.style.setProperty('--frame-v2-url', `url(${import.meta.env.BASE_URL}assets/ui/frames-v2/frame-04.png)`);
document.documentElement.style.setProperty('--boss-atlas-image-url', `url(${BOSS_ATLAS_SHEET.image})`);
document.documentElement.style.setProperty('--boss-atlas-webp-url', `url(${BOSS_ATLAS_SHEET.webp})`);
document.documentElement.style.setProperty('--boss-atlas-sheet-w', `${BOSS_ATLAS_SHEET.width}px`);
document.documentElement.style.setProperty('--boss-atlas-sheet-h', `${BOSS_ATLAS_SHEET.height}px`);
const BOSS_IMAGE_FALLBACK_SRC = `${import.meta.env.BASE_URL}assets/characters/forgotten-spirit.png`;
const BOSS_VISUAL_STACK_PATCH = 'stable-atlas-v1054-collection-link-polish';
const LEGACY_BOSS_VISUAL_STACK_TOKEN = 'stable-atlas-v1040';
const STAGE_LADDER_EXPANSION_PATCH = 'v1054-stage-map-polish-90';
const LEGACY_STAGE_MAP_COMFORT_TOKEN = 'v1046-stage-map-comfort-42';
const LOBBY_DRAG_DEEP_RESCUE_PATCH = 'v1054-engine-design-gesture-qa';
const LEGACY_LOBBY_DRAG_RESCUE_TOKEN = 'v1046-gesture-final-rescue';
const CLEAR_REWARD_FLOW_PATCH = 'v1040-clear-to-restoration';
const AUTH_ENTRY_SIMPLIFICATION_PATCH = 'v1042-auth-entry-simplified';
const ACCOUNT_TIME_PRESSURE_PATCH = 'v1042-account-time-pressure';
const AUTH_MODAL_BOSS_ROLE_PATCH = 'v1043-auth-modal-boss-role';
const GOOGLE_REDIRECT_PENDING_KEY = 'dream-library-google-redirect-pending';
const PAIR_MATCH_TIME_BONUS_SECONDS = 3;
const DIFFICULTY_TEMPO_PATCH = 'v1054-finale-tempo-audio-balance';
const LEGACY_DIFFICULTY_TEMPO_TOKEN = 'v1046-difficulty-tempo-wide-ladder';
const SUMMER_SEASON_PATCH = 'v1054-store-collection-link-vfx';
const SUMMER_REWARD_PASS_PATCH = 'v1054-store-collection-pass';
const SUMMER_LIVE_BALANCE_PATCH = 'v1054-finale-tempo-audio-balance';
const SUMMER_EVENT_VFX_PATCH = 'v1054-store-collection-link-vfx';
const SUMMER_PASS_MISSIONS_PATCH = 'v1054-store-collection-pass';
const SUMMER_COMPACT_CAROUSEL_PATCH = 'v1054-current-chapter-polish-carousel';
const BOSS_SEASON_POLISH_PATCH = 'v1054-reward-linked-boss-icon-polish';
const SUMMER_FINALE_SHOP_PATCH = 'v1054-season-store-collection-link';
const SUMMER_FINALE_MISSION_PATCH = 'v1054-finale-reward-audio-missions';
const SUMMER_DESIGN_QA_PATCH = 'v1054-mobile-polish-density';
const SUMMER_SHOP_BURST_PATCH = 'v1054-season-store-reward-burst';
const SUMMER_SHOP_SHORTCUT_PATCH = 'v1054-season-shop-material-shortcut';
const FINALE_BOSS_CUTIN_PATCH = 'v1054-finale-reward-audio-cutin';
const SUMMER_SHOP_HISTORY_PATCH = 'v1054-season-store-detail-history';
const SUMMER_SHOP_HISTORY_LIMIT = 4;
const FINALE_BOSS_CUTIN_COOLDOWN_PATCH = 'v1054-finale-audio-cooldown-priority';
const FINALE_BOSS_CUTIN_COOLDOWN_MS = 4200;
const FINALE_BOSS_CUTIN_MISMATCH_MS = 2600;
const MOBILE_UI_DENSITY_QA_PATCH = 'v1054-mobile-design-overlap-audit';
const SEASON_STORE_COLLECTION_LINK_PATCH = 'v1054-season-store-collection-link-detail';
const ENGINE_DESIGN_UPGRADE_PATCH = 'v1054-adaptive-visual-budget';
const DUPLICATE_ID_CLEANUP_PATCH = 'v1054-duplicate-id-cleanup';
const ENGINE_RENDER_BUDGET_TUNING_PATCH = 'v1055-engine-render-budget-tuning';
const STORE_REWARD_COLLECTION_POLISH_PATCH = 'v1055-store-reward-collection-polish';
const LOBBY_DENSITY_FINAL_QA_PATCH = 'v1055-lobby-density-final-qa';
const STORE_REWARD_PREVIEW_LENS_PATCH = 'v1055-store-reward-preview-lens';
const TOUCH_CONFLICT_AUDIT_PATCH = 'v1055-lobby-touch-conflict-audit';
const REWARD_DETAIL_SHOWCASE_PATCH = 'v1056-reward-detail-showcase';
const BOSS_WARNING_READABILITY_PATCH = 'v1056-boss-warning-readability';
const REAL_DEVICE_TOUCH_QA_PATCH = 'v1056-real-device-touch-qa';
const DAILY_START_SIGNAL_PATCH = 'v1057-daily-start-signal-widget';
const BACK_ACTION_SHEET_PATCH = 'v1057-back-action-sheet-restored';
const MOBILE_EXIT_OPTIONS_QA_PATCH = 'v1057-mobile-exit-options-qa';
const DAILY_START_ROUTE_ASSIST_PATCH = 'v1058-daily-start-route-assist';
const BACK_SHEET_OPTION_ROW_PATCH = 'v1058-back-sheet-option-row-qa';
const LOBBY_HERO_SAFE_MOTION_PATCH = 'v1058-lobby-hero-safe-motion';
const START_COACH_SMART_OVERLAP_PATCH = 'v1059-smart-start-coach-overlap-qa';
const BACK_SHEET_CLARITY_PATCH = 'v1059-back-sheet-clarity-touch-qa';
const LOBBY_POLISH_LAYER_PATCH = 'v1059-lobby-polish-layering';
const DAILY_START_TARGET_POINTER_PATCH = 'v1060-daily-start-target-pointer';
const DAILY_START_PRECISION_RAIL_PATCH = 'v1061-daily-start-precision-rail';
const LOBBY_CONTENT_GUIDE_PATCH = 'v1061-lobby-content-guide';
const DAILY_REWARD_DRAMA_PATCH = 'v1061-daily-reward-drama';
const BOSS_INTRO_POLISH_PATCH = 'v1061-boss-intro-polish';
const DAILY_START_FOCUS_ASSIST_PATCH = 'v1062-daily-start-focus-assist';
const LOBBY_GUIDE_COMFORT_PATCH = 'v1062-lobby-guide-comfort';
const BOSS_INTRO_PRELOAD_PATCH = 'v1062-boss-intro-preload';
const DAILY_QUEST_CHAIN_PATCH = 'v1063-daily-quest-chain';
const BOSS_ATTACK_READABILITY_PATCH = 'v1063-boss-attack-readability';
const REWARD_FLOW_POLISH_PATCH = 'v1063-reward-flow-polish';
const DAILY_START_ARROW_CTA_PATCH = 'v1064-daily-start-arrow-only-cta';
const LOBBY_UI_POLISH_PASS_PATCH = 'v1064-lobby-ui-polish-pass';
const UI_UX_STABILITY_PASS_PATCH = 'v1065-ui-ux-stability-pass';
const FIRST_TOUCH_MICRO_TUTORIAL_PATCH = 'v1066-first-touch-micro-tutorial';
const GAME_UI_STABILITY_PASS_PATCH = 'v1066-game-ui-stability-pass';
const RESTORATION_REWARD_BRIDGE_PATCH = 'v1067-restoration-reward-bridge';
const BOSS_VFX_DENSITY_GUARD_PATCH = 'v1067-boss-vfx-density-guard';
const MICRO_TUTORIAL_COMFORT_PATCH = 'v1067-micro-tutorial-comfort';
const RESTORATION_COMPLETION_THEATER_PATCH = 'v1068-restoration-completion-theater';
const REWARD_CLAIM_MOTION_PATCH = 'v1068-reward-claim-motion';
const NEXT_GOAL_ADVISOR_PATCH = 'v1068-next-goal-advisor';
const BOSS_WARNING_ICON_TRIM_PATCH = 'v1068-boss-warning-icon-trim';
const LOBBY_RHYTHM_CLEANUP_PATCH = 'v1069-lobby-rhythm-cleanup';
const RESTORATION_DETAIL_CEREMONY_PATCH = 'v1069-restoration-detail-ceremony';
const REWARD_POPUP_DENSITY_GUARD_PATCH = 'v1069-reward-popup-density-guard';
const BOSS_WARNING_ICON_SET_PATCH = 'v1069-boss-warning-icon-set-polish';
const CLEAR_FLOW_RECOMMENDATION_QA_PATCH = 'v1069-clear-flow-recommendation-qa';
const REWARD_ACTION_ACCESSIBILITY_PATCH = 'v1070-reward-action-accessibility-flow';
const RESTORATION_CEREMONY_FEEDBACK_PATCH = 'v1070-restoration-ceremony-feedback-cue';
const BOSS_COUNTER_LINE_POLISH_PATCH = 'v1070-boss-counter-line-polish';
const MOBILE_SAFE_AREA_QA_PATCH = 'v1070-mobile-safe-area-modal-qa';
const COMPACT_MODAL_ACTION_FLOW_PATCH = 'v1070-compact-modal-action-flow';
const MODAL_BUTTON_MICROCOPY_PATCH = 'v1071-modal-button-microcopy-priority';
const RESTORATION_COMPLETION_CUE_PATCH = 'v1071-restoration-completion-feedback-cue';
const BOSS_TELEGRAPH_CONTRAST_PATCH = 'v1071-boss-telegraph-contrast-safe';
const SMALL_REWARD_MODAL_QA_PATCH = 'v1071-small-reward-modal-qa';
const LEADERBOARD_DUPLICATE_TAG_FIX_PATCH = 'v1071-leaderboard-duplicate-tag-fix';
const LOBBY_MENU_PORTAL_PATCH = 'v1072-lobby-menu-portal';
const SECTION_POPUP_RESTRUCTURE_PATCH = 'v1072-section-popup-restructure';
const ROUNDED_CARD_CONTENT_READABILITY_PATCH = 'v1072-rounded-card-content-readability';
const LOBBY_MENU_MOTION_STATE_PATCH = 'v1073-lobby-menu-motion-state';
const LOBBY_MENU_BACK_CLOSE_PATCH = 'v1073-lobby-menu-back-close';
const LOBBY_MENU_TAB_SWITCH_PATCH = 'v1073-lobby-menu-tab-switch';
const LOBBY_PANEL_STATE_RETENTION_PATCH = 'v1073-lobby-panel-state-retention';
const FIRST_TOUCH_GUIDE_SEEN_KEY = 'dream-library-first-touch-guide-seen';
const DAILY_START_COACH_SEEN_KEY = 'dream-library-daily-start-coach-seen';
const ACTIVE_LOBBY_PANEL_KEY = 'dream-library-active-lobby-panel';

const LEGACY_SUMMER_QA_TOKENS = 'v1049-summer-event-vfx v1049-summer-pass-missions v1049-season-vfx-gesture-qa v1049-compact-chapter-carousel v1049-boss-season-polish dream-library-cache-v1.0.50 texture-atlas-manifest-v1.0.50.json';
void LEGACY_SUMMER_QA_TOKENS;
const LEGACY_V1062_COMPAT_TOKENS = 'v1062-daily-start-focus-assist v1062-lobby-guide-comfort v1062-boss-intro-preload dream-library-cache-v1.0.62 texture-atlas-manifest-v1.0.62.json';
void LEGACY_V1062_COMPAT_TOKENS;
const LEGACY_V1063_COMPAT_TOKENS = 'v1063-daily-quest-chain v1063-boss-attack-readability v1063-reward-flow-polish dream-library-cache-v1.0.63 texture-atlas-manifest-v1.0.63.json';
void LEGACY_V1063_COMPAT_TOKENS;
const V1064_COMPAT_TOKENS = 'v1064-daily-start-arrow-only-cta v1064-lobby-ui-polish-pass dream-library-cache-v1.0.64 texture-atlas-manifest-v1.0.64.json';
void V1064_COMPAT_TOKENS;
const V1065_COMPAT_TOKENS = 'v1065-ui-ux-stability-pass dream-library-cache-v1.0.65 texture-atlas-manifest-v1.0.65.json';
void V1065_COMPAT_TOKENS;
const V1066_COMPAT_TOKENS = 'v1066-first-touch-micro-tutorial v1066-game-ui-stability-pass dream-library-cache-v1.0.66 texture-atlas-manifest-v1.0.66.json';
void V1066_COMPAT_TOKENS;
const V1067_COMPAT_TOKENS = 'v1067-restoration-reward-bridge v1067-boss-vfx-density-guard v1067-micro-tutorial-comfort dream-library-cache-v1.0.67 texture-atlas-manifest-v1.0.67.json';
void V1067_COMPAT_TOKENS;
const V1068_COMPAT_TOKENS = 'v1068-restoration-completion-theater v1068-reward-claim-motion v1068-next-goal-advisor v1068-boss-warning-icon-trim dream-library-cache-v1.0.68 texture-atlas-manifest-v1.0.68.json';
void V1068_COMPAT_TOKENS;
const V1069_COMPAT_TOKENS = 'v1069-lobby-rhythm-cleanup v1069-restoration-detail-ceremony v1069-reward-popup-density-guard v1069-boss-warning-icon-set-polish v1069-clear-flow-recommendation-qa dream-library-cache-v1.0.69 texture-atlas-manifest-v1.0.69.json';
void V1069_COMPAT_TOKENS;
const V1070_COMPAT_TOKENS = 'v1070-reward-action-accessibility-flow v1070-restoration-ceremony-feedback-cue v1070-boss-counter-line-polish v1070-mobile-safe-area-modal-qa v1070-compact-modal-action-flow dream-library-cache-v1.0.70 texture-atlas-manifest-v1.0.70.json';
void V1070_COMPAT_TOKENS;
const V1072_COMPAT_TOKENS = 'v1072-lobby-menu-portal v1072-section-popup-restructure v1072-rounded-card-content-readability dream-library-cache-v1.0.72 texture-atlas-manifest-v1.0.72.json';
const V1073_COMPAT_TOKENS = 'v1073-lobby-menu-motion-state v1073-lobby-menu-back-close v1073-lobby-menu-tab-switch v1073-lobby-panel-state-retention dream-library-cache-v1.0.73 texture-atlas-manifest-v1.0.73.json';
void V1072_COMPAT_TOKENS;
const V1071_COMPAT_TOKENS = 'v1071-modal-button-microcopy-priority v1071-restoration-completion-feedback-cue v1071-boss-telegraph-contrast-safe v1071-small-reward-modal-qa v1071-leaderboard-duplicate-tag-fix dream-library-cache-v1.0.71 texture-atlas-manifest-v1.0.71.json';
void V1071_COMPAT_TOKENS;
const LEGACY_V1051_TO_V1053_COMPAT_TOKENS = 'v1051-summer-shop-claim-vfx v1052-season-shop-reward-vfx v1053-shop-history-vfx v1051-summer-shop-claim-pass v1052-season-shop-reward-pass v1053-shop-history-pass v1051-auto-focus-compact-carousel v1052-store-auto-focus-carousel v1053-shortcut-focus-carousel v1051-boss-season-icon-readability v1052-boss-finale-cutin-icon v1053-claimed-boss-icon-polish v1051-summer-shop-claim-flow v1052-season-shop-reward-claim-flow v1053-season-shop-history-claim-flow v1051-finale-balance-missions v1052-finale-boss-missions v1053-finale-boss-balance-missions current-chapter-v1051 current-chapter-v1052 next-goal-v1051-shop-claim next-goal-v1052-shop-reward next-goal-v1053-shop-history v1052-season-shop-claim-burst v1053-season-shop-history-burst v1052-season-shop-earn-shortcut v1053-season-shop-earn-focus-shortcut v1052-finale-boss-cutin v1053-finale-boss-cooldown-cutin v1053-season-store-claim-history v1053-finale-cutin-cooldown-priority v1053-mobile-ui-density-overlap-qa';
void LEGACY_V1051_TO_V1053_COMPAT_TOKENS;

const SUMMER_SEASON_COMBO_BONUS_BY_DIFFICULTY: Record<string, number> = {
  beginner: 6,
  easy: 6,
  normal: 5,
  growth: 5,
  skilled: 4,
  expert: 4,
  hard: 3,
  nightmare: 3
};
const DIFFICULTY_TEMPO_PROFILES: Record<string, { bonus: number; first: number; repeat: number; pressure: string }> = {
  beginner: { bonus: 4, first: 22, repeat: 14, pressure: 'very-soft' },
  easy: { bonus: 4, first: 20, repeat: 13, pressure: 'soft' },
  normal: { bonus: 3, first: 17, repeat: 11, pressure: 'balanced' },
  growth: { bonus: 3, first: 16, repeat: 10, pressure: 'balanced' },
  skilled: { bonus: 3, first: 15, repeat: 10, pressure: 'tense' },
  expert: { bonus: 2, first: 14, repeat: 9, pressure: 'expert' },
  hard: { bonus: 2, first: 13, repeat: 8, pressure: 'hard' },
  nightmare: { bonus: 2, first: 12, repeat: 8, pressure: 'nightmare' }
};
const STALL_PRESSURE_FIRST_SECONDS = 14;
const STALL_PRESSURE_REPEAT_SECONDS = 9;
let bossAtlasImageReady = false;
function preloadBossAtlasImage() {
  const image = new Image();
  image.onload = () => { bossAtlasImageReady = true; document.body.dataset.bossAtlasReady = 'true'; };
  image.onerror = () => { bossAtlasImageReady = false; document.body.dataset.bossAtlasReady = 'fallback'; };
  image.src = BOSS_ATLAS_SHEET.webp || BOSS_ATLAS_SHEET.image;
}
preloadBossAtlasImage();
const UI_STATE_ICONS = ['back', 'settings', 'hint', 'refresh', 'fullscreen', 'logout', 'home', 'play', 'collection', 'restore', 'ranking', 'close', 'confirm', 'gift', 'book', 'map', 'warning'] as const;
for (const iconName of UI_STATE_ICONS) {
  for (const stateName of ['normal', 'hover', 'pressed', 'disabled'] as const) {
    document.documentElement.style.setProperty(`--ui-${iconName}-${stateName}-url`, `url(${import.meta.env.BASE_URL}assets/ui/keys-v2/${iconName}-${stateName}.png)`);
  }
  document.documentElement.style.setProperty(`--ui-${iconName}-url`, `var(--ui-${iconName}-normal-url)`);
}

const $ = <T extends HTMLElement>(selector: string) => document.querySelector(selector) as T;
const $$ = <T extends HTMLElement>(selector: string) => Array.from(document.querySelectorAll(selector)) as T[];

const el = {
  app: $('#app'),
  pixiStage: $('#pixi-stage'),
  boardHost: $('#pixi-board-host'),
  boardCameraGuide: $('#board-camera-guide'),
  boardCameraControls: $('#board-camera-controls'),
  screens: $$('.screen'),
  backButton: $('#back-button'),
  loginStatus: $('#login-status'),
  authName: $('#auth-name'),
  authProvider: $('#auth-provider'),
  anonymousButton: $('#anonymous-button'),
  googleButton: $('#google-button'),
  showEmailButton: $('#show-email-button'),
  emailForm: $('#email-form') as HTMLFormElement,
  emailInput: $('#email-input') as HTMLInputElement,
  passwordInput: $('#password-input') as HTMLInputElement,
  emailSignupButton: $('#email-signup-button'),
  emailAuthModal: $('#email-auth-modal'),
  emailAuthForm: $('#email-auth-form') as HTMLFormElement,
  emailModalInput: $('#email-modal-input') as HTMLInputElement,
  passwordModalInput: $('#password-modal-input') as HTMLInputElement,
  emailModalSignupButton: $('#email-modal-signup-button'),
  closeEmailAuthButton: $('#close-email-auth-button'),
  enterLobbyButton: $('#enter-lobby-button'),
  openSettingsButton: $('#open-settings-button'),
  closeOptionsButton: $('#close-options-button'),
  optionsModal: $('#options-modal'),
  signoutButton: $('#signout-button'),
  settingsAccountText: $('#settings-account-text'),
  settingsLoginButton: $('#settings-login-button'),
  settingsLobbyButton: $('#settings-lobby-button'),
  settingsGuestButton: $('#settings-guest-button'),
  settingsGoogleButton: $('#settings-google-button'),
  settingsEmailButton: $('#settings-email-button'),
  settingsFullscreenButton: $('#settings-fullscreen-button'),
  soundToggle: $('#sound-toggle'),
  qualityToggle: $('#quality-toggle'),
  qualityLabel: $('#quality-label'),
  resetProgressButton: $('#reset-progress-button'),
  fullscreenButton: $('#settings-fullscreen-button'),
  installButton: $('#install-button'),
  lobbyGreeting: $('#lobby-greeting'),
  lobbyHeroImage: document.querySelector('.lobby-hero img') as HTMLImageElement | null,
  stageLadderSummary: $('#stage-ladder-summary'),
  chapterTabs: $('#chapter-tabs'),
  worldMap: $('#world-map'),
  selectedChapterName: $('#selected-chapter-name'),
  chapterStoryText: $('#chapter-story-text'),
  selectedStageTitle: $('#selected-stage-title'),
  selectedStageSubtitle: $('#selected-stage-subtitle'),
  selectedStageMeta: $('#selected-stage-meta'),
  selectedStageReward: $('#selected-stage-reward'),
  stageProgressLabel: $('#stage-progress-label'),
  startSelectedButton: $('#start-selected-button'),
  bestScoreLabel: $('#best-score-label'),
  clearCountLabel: $('#clear-count-label'),
  starCountLabel: $('#star-count-label'),
  leaderboardList: $('#leaderboard-list'),
  refreshLeaderboardButton: $('#refresh-leaderboard-button'),
  dailyStageButton: $('#daily-stage-button'),
  lobbyMissionDeck: $('#lobby-mission-deck'),
  lobbyDeckRefreshButton: $('#lobby-deck-refresh-button'),
  restorationFocusButton: $('#restoration-focus-button'),
  restorationSummary: $('#restoration-summary'),
  restorationList: $('#restoration-list'),
  collectionSummary: $('#collection-summary'),
  collectionList: $('#collection-list'),
  collectionFilter: $('#collection-filter'),
  dailyTitle: $('#daily-title'),
  dailyDesc: $('#daily-desc'),
  dailyLeaderboardList: $('#daily-leaderboard-list'),
  dailyRankTabs: $('#daily-rank-tabs'),
  dailyStartButton: $('#daily-start-button'),
  dailyStartSignal: $('#daily-start-signal') as HTMLButtonElement,
  dailyStartBeam: $('#daily-start-beam'),
  dailyStartGuide: $('#daily-start-guide'),
  dailyStartFocusSummary: $('#daily-start-focus-summary'),
  dailyQuestChain: $('#daily-quest-chain'),
  dailyRewardPromise: $('#daily-reward-promise'),
  lobbyMenuHub: $('#lobby-menu-hub'),
  lobbyMenuOverlay: $('#lobby-menu-overlay'),
  lobbyMenuCloseButton: $('#lobby-menu-close-button'),
  lobbyMenuBackButton: $('#lobby-menu-back-button'),
  lobbyMenuTabs: $('#lobby-menu-tabs'),
  lobbyMenuTitle: $('#lobby-menu-title'),
  lobbyMenuSubtitle: $('#lobby-menu-subtitle'),
  lobbyPanelDock: $('#lobby-panel-dock'),
  stageLabel: $('#stage-label'),
  difficultyTitle: $('#difficulty-title'),
  timeLabel: $('#time-label'),
  scoreLabel: $('#score-label'),
  comboLabel: $('#combo-label'),
  movesLabel: $('#moves-label'),
  statusLabel: $('#status-label'),
  bossImage: $('#boss-image') as HTMLImageElement,
  bossName: $('#boss-name'),
  bossPattern: $('#boss-pattern'),
  bossTelegraph: $('#boss-telegraph'),
  bossAttackPreview: $('#boss-attack-preview'),
  firstTouchGuide: $('#first-touch-guide'),
  firstTouchGuideClose: $('#first-touch-guide-close') as HTMLButtonElement,
  bossIntroBanner: $('#boss-intro-banner'),
  bossCore: $('#boss-core'),
  bossAtlasSprite: $('#boss-atlas-sprite'),
  bossHpLabel: $('#boss-hp-label'),
  bossRoleHelp: $('#boss-role-help'),
  missionLabel: $('#mission-label'),
  modifierStrip: $('#modifier-strip'),
  comboCutin: $('#combo-cutin'),
  bossHitCutin: $('#boss-hit-cutin'),
  hintButton: $('#hint-button'),
  shuffleButton: $('#shuffle-button'),
  newGameButton: $('#new-game-button'),
  exitToLobbyButton: $('#exit-to-lobby-button'),
  rewardModal: $('#reward-modal'),
  rewardTitle: $('#reward-title'),
  rewardMessage: $('#reward-message'),
  rewardItems: $('#reward-items'),
  rewardFlowNext: $('#reward-flow-next'),
  rewardRestorationBridge: $('#reward-restoration-bridge'),
  rewardRestorationFill: $('#reward-restoration-fill'),
  rewardRestorationButton: $('#reward-restoration-button') as HTMLButtonElement,
  rewardCompletionTheater: $('#reward-completion-theater'),
  rewardNextGoal: $('#reward-next-goal'),
  rewardNextGoalButton: $('#reward-next-goal-button') as HTMLButtonElement,
  nextStageButton: $('#next-stage-button'),
  replayStageButton: $('#replay-stage-button'),
  restorationDetailModal: $('#restoration-detail-modal'),
  restorationDetailTitle: $('#restoration-detail-title'),
  restorationDetailMessage: $('#restoration-detail-message'),
  restorationDetailItems: $('#restoration-detail-items'),
  restorationDetailCloseButton: $('#restoration-detail-close-button'),
  restorationDetailFocusButton: $('#restoration-detail-focus-button'),
  exitConfirmModal: $('#exit-confirm-modal'),
  exitConfirmMessage: $('#exit-confirm-message'),
  exitCancelButton: $('#exit-cancel-button'),
  exitConfirmButton: $('#exit-confirm-button'),
  exitHomeButton: $('#exit-home-button'),
  exitOptionsButton: $('#exit-options-button'),
  exitOptionsRowButton: $('#exit-options-row-button'),
  exitSleepModal: $('#exit-sleep-modal'),
  exitSleepMessage: $('#exit-sleep-message'),
  exitWakeButton: $('#exit-wake-button')
};


function forceLoginBootScreen() {
  el.app.dataset.screen = 'login';
  el.app.dataset.authEntry = AUTH_ENTRY_SIMPLIFICATION_PATCH;
  document.body.dataset.screen = 'login';
  document.body.dataset.authEntry = AUTH_ENTRY_SIMPLIFICATION_PATCH;
  el.screens.forEach((screenEl) => screenEl.classList.toggle('active', screenEl.id === 'screen-login'));
  el.backButton.classList.add('hidden');
  [el.optionsModal, el.emailAuthModal, el.rewardModal, el.exitConfirmModal, el.exitSleepModal, el.restorationDetailModal, el.lobbyMenuOverlay].forEach((modal) => modal.classList.add('hidden'));
  el.boardCameraGuide?.classList.add('hidden');
  el.boardCameraGuide?.setAttribute('aria-hidden', 'true');
  el.boardCameraControls?.classList.add('hidden');
  el.boardCameraControls?.setAttribute('aria-hidden', 'true');
}

forceLoginBootScreen();

type ScreenName = 'login' | 'settings' | 'lobby' | 'game';
type CampaignProgress = { unlocked: string[]; cleared: Record<string, { stars: number; bestScore: number }> };
type RestorationInventory = Record<string, number>;
type RestorationCompleted = Record<string, string>;
type LocalRankEntry = { displayName: string; score: number; stageId: string; stars: number; dailyKey?: string; updatedAt: string };
type BrowserRecovery = ReturnType<typeof initBrowserGuard>;

const renderer = new DreamPixiRenderer();
type AudioRuntime = { setEnabled(enabled: boolean): void; unlock(): void; play(id: string): void };
const silentAudio: AudioRuntime = { setEnabled: () => undefined, unlock: () => undefined, play: () => undefined };
let audio: AudioRuntime = silentAudio;
let audioReady: Promise<void> | null = null;
let spineReady: Promise<void> | null = null;
let browserRecovery: BrowserRecovery | null = null;
let portraitRuntime: ReturnType<typeof initPortraitRuntimeGuard> | null = null;

const RESTORATION_PROJECTS = [
  {
    id: 'shelf',
    label: '달빛 책장',
    need: 6,
    types: ['magic-book', 'scroll', 'ink'],
    reward: '달빛 서가 배경 장식 강화',
    description: '마법서와 기록 재료를 모아 첫 책장을 되살립니다.'
  },
  {
    id: 'garden',
    label: '구름 정원',
    need: 8,
    types: ['flower', 'music-box', 'feather'],
    reward: '로비 정원 파티클 개방',
    description: '구름꽃과 추억의 노래를 모아 정원 기억을 복원합니다.'
  },
  {
    id: 'tower',
    label: '별빛 탑',
    need: 10,
    types: ['comet', 'rune', 'crown', 'map'],
    reward: '별빛 탑 챕터 연출 강화',
    description: '봉인과 지도의 조각을 모아 마지막 탑의 문양을 밝힙니다.'
  },
  {
    id: 'arcane-stage',
    label: '아케인 무대',
    need: 12,
    types: ['v2-tile-01', 'v2-tile-05', 'v2-tile-12', 'v2-tile-18'],
    reward: 'v2 전투 컷인과 로비 장식 강화',
    description: '새로 발견된 v2 오브젝트를 모아 보스전 무대를 더 화려하게 복원합니다.'
  },
  {
    id: 'summer-festival',
    label: '한여름 축제 서가',
    need: 18,
    types: ['premium-07', 'premium-08', 'premium-09', 'premium-10', 'premium-11', 'premium-12'],
    reward: '썸머 시즌 로비 장식과 보상 컷인 강화',
    description: '햇살 조개와 산호 장식을 모아 한여름 축제 서가를 복원합니다.'
  }
];

const state = {
  screen: 'login' as ScreenName,
  previousScreen: 'login' as ScreenName,
  user: null as any,
  localGuest: readJson('dream-library-local-guest', null),
  selectedStageId: readText('dream-library-selected-stage') || DEFAULT_STAGE_ID,
  selectedChapterId: readText('dream-library-selected-chapter') || getStageById(readText('dream-library-selected-stage') || DEFAULT_STAGE_ID).chapterId,
  board: [] as any[][],
  selected: null as BoardPoint | null,
  locked: true,
  moves: 0,
  combo: 0,
  comboMax: 0,
  score: 0,
  startedAt: 0,
  remainingSeconds: 0,
  timerId: 0,
  hints: 0,
  shuffles: 0,
  soundEnabled: readText('dream-library-sound') !== 'off',
  localStats: readJson('dream-library-local-stats', { bestScore: 0, clearCount: 0 }),
  localRanking: readJson<LocalRankEntry[]>('dream-library-local-ranking-global', []),
  localDailyRanking: readJson<LocalRankEntry[]>('dream-library-local-ranking-daily', []),
  campaignProgress: normalizeCampaignProgress(readJson('dream-library-campaign-progress', null)),
  inventory: readJson<RestorationInventory>('dream-library-inventory', {}),
  restorationCompleted: readJson<RestorationCompleted>('dream-library-restoration-completed', {}),
  collectionFilter: readText('dream-library-collection-filter') || 'all',
  dailyRankScope: readText('dream-library-daily-rank-scope') || 'today',
  restorationFocus: readText('dream-library-restoration-focus') || 'shelf',
  collapsedPanels: readJson<Record<string, boolean>>('dream-library-lobby-collapsed-panels', {}),
  activeLobbyPanel: readText(ACTIVE_LOBBY_PANEL_KEY) || 'campaign',
  lastLobbyMenuTrigger: null as HTMLElement | null,
  lobbyMenuOpenCount: 0,
  dailyChallenge: getDailyChallenge(new Date()),
  currentBoardId: 'global' as 'global' | 'daily',
  activeBoss: getBossForStage(getStageById(readText('dream-library-selected-stage') || DEFAULT_STAGE_ID)) as any,
  pendingRestorationProjectId: '',
  qualityProfile: detectDeviceProfile(),
  warnedLowTime: false,
  lastClearedStageId: '',
  lastSeasonPassReward: null as null | { label: string; amount: number; milestone: number },
  lastRewardFocusProjectId: '',
  lastRewardNextStageId: '',
  restorationTheaterTimer: 0,
  seasonShopClaims: readJson<Record<string, boolean>>('dream-library-season-shop-claims', {}),
  seasonShopHistory: readJson<any[]>('dream-library-season-shop-history', []),
  lastFinaleBossCutinAt: 0,
  stageModifiers: [] as string[],
  pressureTick: 0,
  timeSealBonusCount: 0,
  pairTimeBonusTotal: 0,
  noMatchSeconds: 0,
  lastStallPressureSecond: 0,
  urgentPressureActive: false,
  suppressHistorySync: false,
  browserBackReady: false,
  recentScoreKey: '',
  hudDensity: 'normal' as 'normal' | 'compact' | 'micro',
  renderBudget: { name: 'balanced' as 'lite' | 'balanced' | 'rich', reason: 'initial', seasonLimit: 4, vfxAlpha: 1, motion: 'normal' },
  dailyStartNudgeTimer: 0,
  dailyStartSignalTouched: false,
  dailyStartCoachSeen: readText(DAILY_START_COACH_SEEN_KEY) === START_COACH_SMART_OVERLAP_PATCH,
  startCoachMeasureTimer: 0,
  dailyStartRailMeasureTimer: 0,
  bossIntroTimer: 0,
  modalActionPriorityTimer: 0,
  dailyFocusAssistTimer: 0,
  uiUxStabilityTimer: 0,
  gameUiStabilityTimer: 0,
  firstTouchGuideTimer: 0,
  firstTouchGuideSeen: [FIRST_TOUCH_MICRO_TUTORIAL_PATCH, MICRO_TUTORIAL_COMFORT_PATCH].includes(readText(FIRST_TOUCH_GUIDE_SEEN_KEY) || '')
};

init();

async function init() {
  document.title = GAME_TITLE;
  browserRecovery = initBrowserGuard();
  portraitRuntime = initPortraitRuntimeGuard({ onStatus: setStatus });
  document.addEventListener('dream-library:portrait-lock-requested', () => {
    portraitRuntime?.syncViewport();
  });
  document.addEventListener('dream-library:viewport-frame-requested', () => {
    syncGameViewport({ reason: 'custom-event' });
    portraitRuntime?.syncViewport();
  });
  if (browserRecovery.inApp) {
    browserRecovery.maybeShowSoftTip();
    syncGameViewport({ reason: 'init-inapp' });
    setStatus('로그인 선택을 준비했습니다.');
  }

  registerServiceWorker();
  void loadAudioRuntime();
  renderer.setQuality(state.qualityProfile);
  applyAdaptiveVisualBudget();
  renderQualityButton();
  initFullscreenControls(el.fullscreenButton, setStatus);
  initInstallPrompt(el.installButton, setStatus);
  bindEvents();
  initButtonStateFeedback();
  initLobbyScrollGuard();
  initBackNavigation();
  initStartCoachOverlapWatcher();
  initDailyStartPrecisionRailWatcher();
  initDailyStartFocusAssistWatcher();
  initUiUxStabilityWatcher();
  initGameUiStabilityWatcher();
  renderAuth();
  renderLobby();
  renderStats();
  updateScreen('login');
  window.addEventListener('pageshow', (event) => {
    if ((event as PageTransitionEvent).persisted && state.screen !== 'game') forceLoginBootScreen();
  });

  await renderer.initAmbient(el.pixiStage);
  await renderer.preloadAssets(ATLAS_ASSETS);
  void renderer.preloadAssets(BOSS_FRAME_ATLAS_ASSETS);
  void renderer.preloadBossFrameAtlas();
  renderer.preloadAssets(PRELOAD_ASSETS);
  void loadSpineRuntime();

  if (firebaseReady) {
    try {
      const redirectResult = await completeGoogleRedirect();
      if (redirectResult?.user) {
        state.user = redirectResult.user;
        state.localGuest = null;
        sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
        renderAuth();
        renderLobby();
        enterLobbyFromAuth('google');
      }
    } catch {
      sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
      setStatus('구글 로그인 결과를 확인하지 못했습니다. 다시 시도해 주세요.');
    }
  }

  observeAuth((user: any) => {
    state.user = user;
    if (user) state.localGuest = null;
    const googleRedirectPending = sessionStorage.getItem(GOOGLE_REDIRECT_PENDING_KEY) === '1';
    if (user && googleRedirectPending) {
      sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
      renderAuth();
      renderLobby();
      enterLobbyFromAuth('google');
    } else {
      renderAuth();
      renderLobby();
    }
    loadLeaderboard();
    loadDailyLeaderboard();
  });
  loadLeaderboard();
  loadDailyLeaderboard();
}


async function loadAudioRuntime() {
  if (audioReady) return audioReady;
  audioReady = import('./audio/DreamAudio').then(({ DreamAudio }) => {
    audio = new DreamAudio();
    audio.setEnabled(state.soundEnabled);
  }).catch(() => {
    audio = silentAudio;
  });
  return audioReady;
}

async function loadSpineRuntime() {
  if (spineReady) return spineReady;
  spineReady = import('./engine/SpineBridge').then(({ prepareSpineRuntime }) => prepareSpineRuntime()).catch(() => undefined);
  return spineReady;
}

function bindEvents() {
  el.backButton.addEventListener('click', () => {
    openExitConfirm();
  });
  // v1.0.37: the visible top option line was removed. Options now open from the back/exit sheet gear.
  el.openSettingsButton?.addEventListener('click', openOptions);
  el.closeOptionsButton.addEventListener('click', closeOptionsPanel);
  el.optionsModal.addEventListener('click', (event) => { if (event.target === el.optionsModal) closeOptionsPanel(); });
  el.settingsLoginButton.addEventListener('click', () => { closeOptionsPanel(); updateScreen('login'); });
  el.settingsLobbyButton.addEventListener('click', () => { closeOptionsPanel(); hasSession() ? updateScreen('lobby') : updateScreen('login'); });
  el.settingsGuestButton.addEventListener('click', switchToGuestAccountFromOptions);
  el.settingsGoogleButton.addEventListener('click', switchToGoogleAccountFromOptions);
  el.settingsEmailButton.addEventListener('click', openEmailAccountSwitchFromOptions);
  el.soundToggle.addEventListener('click', () => {
    HAPTIC.tap();
    state.soundEnabled = !state.soundEnabled;
    writeText('dream-library-sound', state.soundEnabled ? 'on' : 'off');
    audio.setEnabled(state.soundEnabled);
    renderSoundButton();
  });
  el.qualityToggle.addEventListener('click', () => {
    const nextTier = nextQualityTier(state.qualityProfile.tier);
    saveQualityTier(nextTier);
    state.qualityProfile = detectDeviceProfile();
    renderer.setQuality(state.qualityProfile);
    applyAdaptiveVisualBudget();
    renderQualityButton();
    if (state.screen === 'game' && state.board.length) {
      renderer.renderBoard(state.board);
      renderBoardCameraGuide();
    }
    setStatus(`렌더링 품질을 ${qualityText(state.qualityProfile.tier)}로 변경했습니다.`);
  });

  el.resetProgressButton.addEventListener('click', () => {
    state.campaignProgress = normalizeCampaignProgress(null);
    state.localStats = { bestScore: 0, clearCount: 0 };
    state.inventory = {};
    state.restorationCompleted = {};
    state.localRanking = [];
    state.localDailyRanking = [];
    writeJson('dream-library-campaign-progress', state.campaignProgress);
    writeJson('dream-library-local-stats', state.localStats);
    writeJson('dream-library-local-ranking-global', state.localRanking);
    writeJson('dream-library-local-ranking-daily', state.localDailyRanking);
    writeJson('dream-library-inventory', state.inventory);
    writeJson('dream-library-restoration-completed', state.restorationCompleted);
    state.seasonShopClaims = {};
    state.seasonShopHistory = [];
    writeJson('dream-library-season-shop-claims', state.seasonShopClaims);
    writeJson('dream-library-season-shop-history', state.seasonShopHistory);
    renderLobby();
    renderStats();
    setStatus('로컬 진행을 초기화했습니다.');
  });

  el.showEmailButton.addEventListener('click', () => openEmailAuthModal('login'));
  el.anonymousButton.addEventListener('click', () => runAuth(async () => {
    audio.play('tap');
    HAPTIC.tap();
    suggestKakaoAssist('');
    if (firebaseReady) await loginAnonymously();
    else {
      state.localGuest = makeLocalGuest();
      writeJson('dream-library-local-guest', state.localGuest);
      renderAuth();
    }
    enterLobbyFromAuth('guest');
  }, '게스트 로그인으로 로비를 열었습니다.'));
  el.googleButton.addEventListener('click', () => runGoogleLogin('start'));
  el.emailForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runEmailLoginFromInlineFallback();
  });
  el.emailSignupButton.addEventListener('click', runEmailSignupFromInlineFallback);
  el.emailAuthForm.addEventListener('submit', (event) => {
    event.preventDefault();
    runEmailLoginFromModal();
  });
  el.emailModalSignupButton.addEventListener('click', runEmailSignupFromModal);
  el.closeEmailAuthButton.addEventListener('click', closeEmailAuthModal);
  el.emailAuthModal.addEventListener('click', (event) => { if (event.target === el.emailAuthModal) closeEmailAuthModal(); });
  el.signoutButton.addEventListener('click', () => runAuth(async () => {
    if (firebaseReady && state.user) await logout();
    state.localGuest = null;
    writeJson('dream-library-local-guest', null);
    renderAuth();
    closeOptionsPanel();
    updateScreen('login');
  }, '로그아웃했습니다.'));
  el.enterLobbyButton.addEventListener('click', () => enterLobbyFromAuth('resume')); // retired direct lobby button kept hidden for DOM compatibility
  el.exitCancelButton.addEventListener('click', closeExitConfirm);
  el.exitHomeButton.addEventListener('click', exitHomeFromBackSheet);
  el.exitConfirmButton.addEventListener('click', confirmExitApp);
  el.exitOptionsButton.addEventListener('click', openOptionsFromExitSheet);
  el.exitOptionsRowButton.addEventListener('click', openOptionsFromExitSheet);
  el.exitWakeButton.addEventListener('click', wakeFromExitSleep);
  el.exitConfirmModal.addEventListener('click', (event) => { if (event.target === el.exitConfirmModal) closeExitConfirm(); });

  el.chapterTabs.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-chapter-id]');
    if (!node) return;
    selectChapter(node.dataset.chapterId || CHAPTERS[0].id);
  });

  el.worldMap.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-stage-id]');
    if (!node) return;
    const stageId = node.dataset.stageId || DEFAULT_STAGE_ID;
    const stage = getStageById(stageId);
    state.selectedChapterId = stage.chapterId;
    writeText('dream-library-selected-chapter', state.selectedChapterId);
    if (!isStageUnlocked(stageId)) {
      state.selectedStageId = stageId;
      writeText('dream-library-selected-stage', stageId);
      setStatus('이전 기억을 먼저 복원해야 합니다.');
      renderLobby();
      return;
    }
    state.selectedStageId = stageId;
    writeText('dream-library-selected-stage', stageId);
    audio.play('select');
    renderLobby();
  });
  el.startSelectedButton.addEventListener('click', () => startSelectedStage());
  el.dailyStageButton.addEventListener('click', startDailyStage);
  el.dailyStartButton.addEventListener('click', startDailyStage);
  el.dailyStartSignal.addEventListener('click', startDailyStage);
  el.lobbyMenuHub?.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-lobby-menu-open]');
    if (!trigger) return;
    openLobbyMenuPanel(trigger.dataset.lobbyMenuOpen || 'campaign', trigger);
  });
  el.lobbyMenuTabs?.addEventListener('click', (event) => {
    const trigger = (event.target as HTMLElement).closest<HTMLElement>('[data-lobby-menu-tab]');
    if (!trigger) return;
    openLobbyMenuPanel(trigger.dataset.lobbyMenuTab || 'campaign', trigger, { keepFocus: true });
  });
  el.lobbyMenuCloseButton?.addEventListener('click', () => closeLobbyMenuPanel({ returnFocus: true }));
  el.lobbyMenuBackButton?.addEventListener('click', () => closeLobbyMenuPanel({ returnFocus: true }));
  el.lobbyMenuOverlay?.addEventListener('click', (event) => { if (event.target === el.lobbyMenuOverlay) closeLobbyMenuPanel({ returnFocus: true }); });
  el.dailyStartSignal.addEventListener('pointerenter', () => document.body.classList.add('daily-start-signal-hovered'));
  el.dailyStartSignal.addEventListener('pointerleave', () => document.body.classList.remove('daily-start-signal-hovered'));
  el.firstTouchGuideClose?.addEventListener('click', () => hideFirstTouchGuide(true));
  el.lobbyDeckRefreshButton.addEventListener('click', () => {
    renderLobbyMissionDeck(true);
    setStatus('로비 추천 미션을 현재 진행 상황 기준으로 다시 배치했습니다.');
  });
  el.lobbyMissionDeck.addEventListener('click', handleLobbyMissionClick);
  document.addEventListener('click', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>('.season-jump-button');
    if (!target) return;
    const stageId = target.dataset.stageId || getSummerSeasonNextStage()?.id || DEFAULT_STAGE_ID;
    const stage = getStageById(stageId);
    state.selectedStageId = stage.id;
    state.selectedChapterId = stage.chapterId;
    writeText('dream-library-selected-stage', stage.id);
    writeText('dream-library-selected-chapter', stage.chapterId);
    renderLobby();
    setStatus('썸머 시즌 스테이지로 이동했습니다.');
  });
  document.addEventListener('click', (event) => {
    const claimTarget = (event.target as HTMLElement).closest<HTMLElement>('.season-shop-claim');
    const earnTarget = (event.target as HTMLElement).closest<HTMLElement>('.season-shop-earn');
    if (!claimTarget && !earnTarget) return;
    event.preventDefault();
    event.stopPropagation();
    if (claimTarget) claimSummerShopItem(claimTarget.dataset.shopItem || '');
    if (earnTarget) focusSummerShopMaterial(earnTarget.dataset.shopItem || '', earnTarget.dataset.costType || '');
  });
  document.addEventListener('click', (event) => {
    const detailTarget = (event.target as HTMLElement).closest<HTMLElement>('.season-shop-detail, .season-shop-history-card');
    if (!detailTarget) return;
    const itemId = detailTarget.dataset.shopItem || detailTarget.dataset.shopHistoryItem || '';
    if (!itemId) return;
    event.preventDefault();
    event.stopPropagation();
    openSeasonShopRewardDetail(itemId);
  });
  el.dailyRankTabs.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-daily-rank]');
    if (!node) return;
    state.dailyRankScope = node.dataset.dailyRank || 'today';
    writeText('dream-library-daily-rank-scope', state.dailyRankScope);
    renderDailyPanel();
    loadDailyLeaderboard();
  });
  el.collectionFilter.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-collection-filter]');
    if (!node) return;
    state.collectionFilter = node.dataset.collectionFilter || 'all';
    writeText('dream-library-collection-filter', state.collectionFilter);
    renderCollection();
  });
  el.restorationFocusButton.addEventListener('click', () => {
    scrollLobbyTarget('.restoration-panel');
    setStatus('복원 작업대를 확인하세요.');
  });
  el.newGameButton.addEventListener('click', () => startSelectedStage());
  el.exitToLobbyButton.addEventListener('click', () => exitToLobby());
  el.hintButton.addEventListener('click', showHint);
  el.shuffleButton.addEventListener('click', shuffleBoard);
  el.refreshLeaderboardButton.addEventListener('click', () => { loadLeaderboard(); loadDailyLeaderboard(); });
  el.nextStageButton.addEventListener('click', () => {
    closeReward();
    const next = getNextStage(state.lastClearedStageId || state.selectedStageId);
    if (next) {
      state.selectedStageId = next.id;
      state.selectedChapterId = next.chapterId;
      writeText('dream-library-selected-stage', next.id);
      writeText('dream-library-selected-chapter', next.chapterId);
      startSelectedStage();
    } else updateScreen('lobby');
  });
  el.replayStageButton.addEventListener('click', () => {
    closeReward();
    startSelectedStage();
  });
  el.rewardRestorationButton?.addEventListener('click', openRewardRestorationBridge);
  el.rewardNextGoalButton?.addEventListener('click', openRewardNextGoalAdvisor);
  el.restorationList.addEventListener('click', (event) => {
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-restore-id]');
    if (node) openRestorationDetail(node.dataset.restoreId || 'shelf');
  });
  el.restorationDetailCloseButton.addEventListener('click', closeRestorationDetail);
  el.restorationDetailModal.addEventListener('click', (event) => { if (event.target === el.restorationDetailModal) closeRestorationDetail(); });
  document.addEventListener('click', (event) => {
    const closeNode = (event.target as HTMLElement).closest<HTMLElement>('[data-lobby-menu-close]');
    if (closeNode) {
      closeLobbyMenuPanel({ returnFocus: true });
      return;
    }
    const node = (event.target as HTMLElement).closest<HTMLElement>('[data-collapse-target]');
    if (!node) return;
    toggleLobbyPanel(node.dataset.collapseTarget || '');
  });

  el.restorationDetailFocusButton.addEventListener('click', () => {
    if (!state.pendingRestorationProjectId) return;
    const project = RESTORATION_PROJECTS.find((item) => item.id === state.pendingRestorationProjectId);
    if (project && canCompleteRestoration(project) && !state.restorationCompleted[project.id]) {
      completeRestorationProject(project.id);
      return;
    }
    state.restorationFocus = state.pendingRestorationProjectId;
    writeText('dream-library-restoration-focus', state.restorationFocus);
    closeRestorationDetail();
    renderRestoration();
    scrollLobbyTarget('.restoration-panel');
    setStatus('집중 복원 프로젝트를 변경하고 복원 패널로 이동했습니다.');
  });

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && document.body.classList.contains('lobby-menu-open')) closeLobbyMenuPanel({ returnFocus: true });
  });

  window.addEventListener('resize', () => {
    portraitRuntime?.syncViewport();
    applyAdaptiveVisualBudget();
    if (state.screen === 'game' && state.board.length) {
      renderer.renderBoard(state.board);
      renderBoardCameraGuide();
    }
  });
  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') handleSoftBack();
  });
}

function initBackNavigation() {
  if (state.browserBackReady) return;
  state.browserBackReady = true;
  try {
    window.history.replaceState({ dreamLibrary: true, screen: state.screen }, '', window.location.href);
    window.history.pushState({ dreamLibrary: true, screen: state.screen }, '', window.location.href);
  } catch {}
  window.addEventListener('popstate', () => {
    handleSoftBack();
    try { window.history.pushState({ dreamLibrary: true, screen: state.screen }, '', window.location.href); } catch {}
  });
}

function handleSoftBack() {
  if (document.body.classList.contains('lobby-menu-open')) { closeLobbyMenuPanel({ returnFocus: true }); return; }
  if (!el.rewardModal.classList.contains('hidden')) { closeReward(); return; }
  if (!el.restorationDetailModal.classList.contains('hidden')) { closeRestorationDetail(); return; }
  if (!el.optionsModal.classList.contains('hidden')) { closeOptionsPanel(); return; }
  if (!el.exitConfirmModal.classList.contains('hidden')) { closeExitConfirm(); return; }
  if (!el.exitSleepModal.classList.contains('hidden')) { wakeFromExitSleep(); return; }
  if (state.screen === 'game' || state.screen === 'lobby' || state.screen === 'settings' || state.screen === 'login') {
    openExitConfirm();
    return;
  }
  openExitConfirm();
}


function suggestKakaoAssist(_message: string) {
  syncGameViewport({ reason: 'assist-soft-fit' });
  portraitRuntime?.syncViewport();
}

async function requestKakaoPortraitLock(source = 'game') {
  syncGameViewport({ reason: source });
  if (browserRecovery?.inApp) {
    portraitRuntime?.syncViewport();
    return true;
  }
  await portraitRuntime?.requestLock(source);
  return true;
}

async function handoffIfNeeded(mode: 'assist' | 'auth' = 'assist') {
  if (!browserRecovery?.inApp) return false;
  audio.play('tap');
  if (mode === 'auth') setStatus('계정 저장을 시도합니다.');
  await requestKakaoPortraitLock(mode);
  return false;
}



function initButtonStateFeedback() {
  const selector = 'button, .mission-card, .stage-node, .collection-tile, .restore-node';
  document.addEventListener('pointerdown', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(selector);
    if (!target || target.hasAttribute('disabled')) return;
    target.dataset.pointerState = 'pressed';
  }, { passive: true });
  document.addEventListener('pointerup', (event) => {
    const target = (event.target as HTMLElement).closest<HTMLElement>(selector);
    if (target) target.dataset.pointerState = 'released';
    window.setTimeout(() => target?.removeAttribute('data-pointer-state'), 90);
  }, { passive: true });
  document.addEventListener('pointercancel', () => {
    document.querySelectorAll<HTMLElement>('[data-pointer-state]').forEach((item) => item.removeAttribute('data-pointer-state'));
  }, { passive: true });
}

const LEGACY_LOBBY_DRAG_THRESHOLD_NOTE = 'dy > 5'; // retained for scroll-polish policy while v1.0.47 uses dy > 1.2 season gesture fluid rescue; legacy v1.0.46 markers: dy > 1.6 and dx * 0.34 and shell.scrollTop -= deltaY * 1.18

function initLobbyScrollGuard() {
  const shell = el.app?.closest<HTMLElement>('.app-shell') || document.querySelector<HTMLElement>('.app-shell');
  if (!shell) return;
  let startX = 0;
  let startY = 0;
  let startTime = 0;
  let dragging = false;
  let dragLocked = false;
  let lastY = 0;

  shell.addEventListener('pointerdown', (event) => {
    if (state.screen !== 'lobby') return;
    startX = event.clientX;
    startY = event.clientY;
    startTime = performance.now();
    lastY = event.clientY;
    dragging = false;
    dragLocked = false;
    document.body.classList.remove('is-lobby-dragging');
  }, { passive: true });

  shell.addEventListener('pointermove', (event) => {
    if (state.screen !== 'lobby') return;
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);
    if (dy > 1.2 && dy > dx * 0.28) {
      dragging = true;
      dragLocked = dy > 4;
      document.body.classList.add('is-lobby-dragging');
      const deltaY = event.clientY - lastY;
      if (Math.abs(deltaY) > 0.55 && (event.target as HTMLElement).closest('button, .mission-card, .chapter-tab, .stage-node, .restore-node, .collection-tile, .selected-stage-card, .lobby-hero, .section-heading, .daily-panel, .restoration-panel, .collection-panel, .stage-ladder-summary, .ladder-chip, .world-map, .lobby-grid, .summer-season-panel, .season-jump-button, .season-shop-card, .season-shop-claim, .season-shop-earn, .season-shop-detail, .season-shop-history-card, .season-shop-reward-preview, .season-design-audit, .season-finale-card, .season-pass-mission, .daily-start-signal, .daily-route-ribbon, .start-focus-rail')) {
        shell.scrollTop -= deltaY * 1.28;
        document.body.dataset.lobbyDragRescue = LOBBY_DRAG_DEEP_RESCUE_PATCH;
      }
      lastY = event.clientY;
    }
  }, { passive: true });

  shell.addEventListener('pointerup', () => {
    if (state.screen !== 'lobby') return;
    window.setTimeout(() => { if (!dragging) document.body.classList.remove('is-lobby-dragging'); }, 80);
  }, { passive: true });

  shell.addEventListener('click', (event) => {
    if (state.screen !== 'lobby') return;
    const elapsed = performance.now() - startTime;
    if ((dragging || dragLocked) && elapsed < 900) {
      event.preventDefault();
      event.stopPropagation();
    }
    dragging = false;
    window.setTimeout(() => document.body.classList.remove('is-lobby-dragging'), 120);
  }, true);
}

function enterLobbyFromAuth(mode: 'guest' | 'google' | 'email' | 'email-signup' | 'resume' = 'guest') {
  if (!hasSession()) {
    state.localGuest = makeLocalGuest();
    writeJson('dream-library-local-guest', state.localGuest);
    renderAuth();
  }
  syncGameViewport({ reason: `auth-entry-${mode}` });
  portraitRuntime?.syncViewport();
  renderLobby();
  updateScreen('lobby');
  const message: Record<string, string> = {
    guest: '게스트 로그인 완료. 스테이지를 고르고 진짜 게임을 시작하세요.',
    google: '구글 로그인 저장이 연결되었습니다. 스테이지를 고르세요.',
    email: '이메일 로그인 저장이 연결되었습니다. 스테이지를 고르세요.',
    'email-signup': '이메일 저장 계정을 만들었습니다. 스테이지를 고르세요.',
    resume: '저장된 세션으로 로비를 열었습니다.'
  };
  setStatus(message[mode] || message.guest);
}

function enterLobbyFromStart() {
  syncGameViewport({ reason: 'enter-lobby' });
  enterLobbyFromAuth('resume');
}

async function startDailyStage() {
  markDailyStartSignalConsumed();
  const daily = state.dailyChallenge;
  document.body.dataset.dailyStartSignalActivated = DAILY_START_SIGNAL_PATCH;
  el.dailyStageButton?.classList.add('start-signal-activated');
  el.dailyStartButton?.classList.add('start-signal-activated');
  HAPTIC.select();
  state.selectedStageId = daily.stageId;
  state.selectedChapterId = getStageById(daily.stageId).chapterId;
  writeText('dream-library-selected-stage', daily.stageId);
  writeText('dream-library-selected-chapter', state.selectedChapterId);
  renderLobby();
  await startSelectedStage({ daily: true });
}

async function startSelectedStage(options: { daily?: boolean } = {}) {
  await handoffIfNeeded('assist');
  state.currentBoardId = options.daily ? 'daily' : 'global';
  const baseStage = getStageById(state.selectedStageId);
  if (!options.daily && !isStageUnlocked(baseStage.id)) {
    setStatus('잠긴 스테이지입니다. 이전 기억을 먼저 복원하세요.');
    renderLobby();
    return;
  }
  const stage = options.daily ? { ...baseStage, modifiers: state.dailyChallenge.modifiers, dailySeed: state.dailyChallenge.seed } : baseStage;
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  state.stageModifiers = [...(stage.modifiers || [])];
  state.pressureTick = 0;
  state.timeSealBonusCount = 0;
  state.pairTimeBonusTotal = 0;
  state.noMatchSeconds = 0;
  state.lastStallPressureSecond = 0;
  state.urgentPressureActive = false;
  document.body.classList.remove('time-pressure-action');
  document.querySelector<HTMLElement>('.battle-stage')?.removeAttribute('data-stall-pressure');
  state.activeBoss = getBossForStage(stage);
  renderBossPanel();
  audio.unlock();
  audio.play('tap');
  syncGameViewport({ reason: 'stage-start' });
  portraitRuntime?.syncViewport();
  state.board = createBoard(difficulty, stage.modifiers || []);
  renderBoardCameraGuide(difficulty);
  state.selected = null;
  state.locked = false;
  state.moves = 0;
  state.combo = 0;
  state.comboMax = 0;
  state.score = 0;
  state.remainingSeconds = difficulty.timeLimitSeconds;
  state.hints = difficulty.hints;
  state.shuffles = difficulty.shuffles;
  state.warnedLowTime = false;
  state.startedAt = Date.now();
  clearInterval(state.timerId);
  state.timerId = window.setInterval(tickTimer, 1000);
  updateScreen('game');
  showBossIntroBanner(stage);
  if (!renderer.boardApp) await renderer.initBoard(el.boardHost, handleTileTap);
  await renderer.renderBoard(state.board);
  renderBoardCameraGuide(difficulty);
  setBossFrame('idle');
  renderer.setBossHp(100, getBossPhase(100));
  renderGameHud();
  showFirstTouchGuide(stage, options.daily ? 'daily' : 'stage');
  scheduleGameUiStabilityPass();
  setStatus('같은 마법 오브젝트를 연결하세요.');
  updateMissionLabel();
  renderModifierStrip(stage.modifiers || []);
}





function handleSpecialTileGate(point: BoardPoint, tile: any) {
  if (!isSpecialTileBlocked(tile)) return false;
  state.selected = null;
  renderer.setSelected(null);
  if (tile.special === 'fog') {
    state.board = revealSpecialTile(state.board, point);
    renderer.renderBoard(state.board);
    setStatus('안개 타일을 걷었습니다. 드러난 오브젝트를 다시 선택하세요.');
    HAPTIC.select();
    return true;
  }
  if (tile.special === 'locked') {
    if (state.combo >= 1) {
      state.board = revealAllSpecial(state.board, 'locked');
      renderer.renderBoard(state.board);
      setStatus('잠긴 타일의 금속 장식이 열렸습니다. 이제 연결할 수 있습니다.');
      HAPTIC.select();
    } else {
      renderer.playMismatch(point);
      setStatus('잠긴 타일은 먼저 다른 한 쌍을 연결하면 열립니다.');
      HAPTIC.warning();
    }
    return true;
  }
  if (tile.special === 'timeSeal') {
    state.board = revealSpecialTile(state.board, point);
    state.remainingSeconds = Math.max(0, state.remainingSeconds - 3);
    renderer.renderBoard(state.board);
    renderGameHud();
    setStatus('시간 봉인을 해제했습니다. 3초가 줄었지만 연결하면 시간을 되찾습니다.');
    HAPTIC.warning();
    return true;
  }
  return false;
}

function getDifficultyTempoProfile(stage = getStageById(state.selectedStageId)) {
  const key = stage?.difficultyKey || 'normal';
  return DIFFICULTY_TEMPO_PROFILES[key] || DIFFICULTY_TEMPO_PROFILES.normal;
}

function getPairMatchTimeBonus(stage = getStageById(state.selectedStageId)) {
  return getDifficultyTempoProfile(stage).bonus || PAIR_MATCH_TIME_BONUS_SECONDS;
}

function getStallPressureThresholds(stage = getStageById(state.selectedStageId)) {
  const profile = getDifficultyTempoProfile(stage);
  return {
    first: profile.first || STALL_PRESSURE_FIRST_SECONDS,
    repeat: profile.repeat || STALL_PRESSURE_REPEAT_SECONDS,
    pressure: profile.pressure || 'balanced'
  };
}

function grantPairMatchTimeBonus(firstTile?: any, secondTile?: any) {
  const bonus = getPairMatchTimeBonus();
  state.remainingSeconds += bonus;
  state.pairTimeBonusTotal += bonus;
  state.noMatchSeconds = 0;
  state.lastStallPressureSecond = 0;
  state.urgentPressureActive = false;
  document.body.dataset.timePressurePatch = ACCOUNT_TIME_PRESSURE_PATCH;
  document.body.classList.remove('time-pressure-action');
  const stageEl = document.querySelector<HTMLElement>('.battle-stage');
  stageEl?.setAttribute('data-time-bonus-rule', `pair-plus-${bonus}`);
  stageEl?.removeAttribute('data-stall-pressure');
  el.timeLabel.dataset.bonus = `+${bonus}초`;
  el.timeLabel.classList.remove('time-bonus-pop', 'urgent-time');
  void el.timeLabel.offsetWidth;
  el.timeLabel.classList.add('time-bonus-pop');
  window.setTimeout(() => el.timeLabel.classList.remove('time-bonus-pop'), 740);
  if (![firstTile?.special, secondTile?.special].some(Boolean)) {
    setStatus(`연결 성공 · 보너스 시간 +${bonus}초`);
  }
}

function triggerStallPressure() {
  if (state.screen !== 'game' || state.locked || state.remainingSeconds <= 0) return;
  const seconds = state.noMatchSeconds;
  const tempo = getStallPressureThresholds();
  if (seconds < tempo.first) return;
  if (state.lastStallPressureSecond && seconds - state.lastStallPressureSecond < tempo.repeat) return;
  state.lastStallPressureSecond = seconds;
  state.urgentPressureActive = true;
  document.body.dataset.timePressurePatch = ACCOUNT_TIME_PRESSURE_PATCH;
  document.body.classList.add('time-pressure-action');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-stall-pressure', `urgent-${tempo.pressure}`);
  el.timeLabel.classList.add('urgent-time');
  audio.play('urgent');
  window.setTimeout(() => audio.play('warning'), 120);
  HAPTIC.warning();
  triggerBossTelegraph('time');
  setStatus(`시간이 흔들립니다. 한 쌍을 맞추면 보너스 시간 +${getPairMatchTimeBonus()}초를 얻습니다.`);
  window.setTimeout(() => {
    document.body.classList.remove('time-pressure-action');
    el.timeLabel.classList.remove('urgent-time');
  }, 950);
}

function applySpecialMatchRewards(firstTile: any, secondTile: any) {
  const specials = [firstTile?.special, secondTile?.special].filter(Boolean);
  if (specials.includes('timeSeal')) {
    const bonus = 8;
    state.remainingSeconds += bonus;
    state.timeSealBonusCount += 1;
    setStatus(`시간 봉인을 복원해 ${bonus}초를 되찾았습니다.`);
  }
  if (specials.includes('fog')) {
    state.score += 40;
  }
  if (specials.includes('locked')) {
    state.score += 70;
  }
}

function advanceSpecialRulesAfterMatch() {
  if (countSpecialTiles(state.board, 'locked', true) > 0 && state.combo >= 1) {
    state.board = revealAllSpecial(state.board, 'locked');
    renderer.renderBoard(state.board);
    setStatus('연결 성공으로 잠긴 타일이 열렸습니다.');
  }
}


function applyBossWarningReadability(reason: 'combo' | 'time' | 'pressure' | 'mismatch', boss: any = {}) {
  const stage = document.querySelector<HTMLElement>('.battle-stage');
  const lane = document.querySelector<HTMLElement>('.boss-lane');
  const compact = state.renderBudget?.name === 'lite' || state.hudDensity === 'micro';
  const warningTone = reason === 'mismatch' ? 'mistake' : reason === 'time' ? 'time' : reason === 'pressure' ? 'pressure' : 'combo';
  const warningIcon = reason === 'time' ? 'clock' : reason === 'mismatch' ? 'mistake' : reason === 'pressure' ? 'pulse' : 'combo';
  stage?.setAttribute('data-boss-warning-readability', BOSS_WARNING_READABILITY_PATCH);
  stage?.setAttribute('data-boss-warning-tone', warningTone);
  stage?.setAttribute('data-boss-warning-density', compact ? 'compact' : 'readable');
  stage?.setAttribute('data-boss-warning-icon-set', BOSS_WARNING_ICON_SET_PATCH);
  stage?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  stage?.setAttribute('data-warning-icon', warningIcon);
  lane?.setAttribute('data-boss-warning-readability', BOSS_WARNING_READABILITY_PATCH);
  lane?.setAttribute('data-boss-warning-tone', warningTone);
  lane?.setAttribute('data-boss-warning-icon-set', BOSS_WARNING_ICON_SET_PATCH);
  lane?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  lane?.setAttribute('data-warning-icon', warningIcon);
  el.bossTelegraph.dataset.bossWarningReadability = BOSS_WARNING_READABILITY_PATCH;
  el.bossTelegraph.dataset.bossWarningIconSet = BOSS_WARNING_ICON_SET_PATCH;
  el.bossTelegraph.dataset.bossCounterLinePolish = BOSS_COUNTER_LINE_POLISH_PATCH;
  el.bossTelegraph.dataset.warningTone = warningTone;
  el.bossTelegraph.dataset.warningIcon = warningIcon;
  if (compact) {
    const title = boss.telegraphTitle || (reason === 'time' ? '시간 압박' : reason === 'mismatch' ? '실수 반격' : '반격 예고');
    el.bossTelegraph.textContent = `${title} · 짝을 맞춰 흐름 회복`;
  }
}

function getBossAttackPreview(reason: 'idle' | 'combo' | 'time' | 'pressure' | 'mismatch' = 'idle', boss: any = state.activeBoss || {}) {
  const warningEvery = Number(boss.comboWarningEvery || 6);
  const warningSeconds = Number(boss.warningSeconds || 15);
  const baseTip = boss.attackLine || '짝을 맞춰 반격을 끊으세요.';
  if (reason === 'combo') return { tone: 'combo', title: `${warningEvery}콤보 반격`, tip: '연속 매칭 후 예고가 켜지면 바로 다음 짝을 찾으세요.' };
  if (reason === 'time') return { tone: 'time', title: `${warningSeconds}초 이하 시간 압박`, tip: '힌트/섞기를 아끼지 말고 흐름을 회복하세요.' };
  if (reason === 'pressure') return { tone: 'pressure', title: '주기 압박', tip: '멈추면 점수와 시간이 흔들립니다.' };
  if (reason === 'mismatch') return { tone: 'mistake', title: '실수 반격', tip: '잘못 고른 타일은 다시 확인하고 연결선을 짧게 보세요.' };
  return { tone: 'ready', title: `${warningEvery}콤보 또는 ${warningSeconds}초 경고`, tip: baseTip };
}

function syncBossAttackPreview(reason: 'idle' | 'combo' | 'time' | 'pressure' | 'mismatch' = 'idle') {
  const preview = el.bossAttackPreview;
  if (!preview) return;
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  const info = getBossAttackPreview(reason, boss);
  preview.dataset.bossAttackReadability = BOSS_ATTACK_READABILITY_PATCH;
  preview.dataset.gameUiStability = GAME_UI_STABILITY_PASS_PATCH;
  preview.dataset.bossVfxDensityGuard = BOSS_VFX_DENSITY_GUARD_PATCH;
  preview.dataset.bossWarningIconSet = BOSS_WARNING_ICON_SET_PATCH;
  preview.dataset.bossCounterLinePolish = BOSS_COUNTER_LINE_POLISH_PATCH;
  preview.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  const compactAttack = state.hudDensity === 'micro' || window.innerWidth <= 390 || window.innerHeight <= 700;
  const warningIcon = reason === 'time' ? 'clock' : reason === 'mismatch' ? 'mistake' : reason === 'pressure' ? 'pulse' : reason === 'combo' ? 'combo' : 'ready';
  preview.dataset.attackTone = info.tone;
  preview.dataset.attackDensity = compactAttack ? 'compact' : 'readable';
  preview.dataset.vfxDensity = compactAttack ? 'soft' : 'normal';
  preview.dataset.warningIcon = warningIcon;
  preview.dataset.iconTrim = compactAttack ? (window.innerWidth <= 370 || window.innerHeight <= 640 ? 'icon-only' : 'compact') : 'readable';
  preview.innerHTML = `<span data-warning-icon-label>${getBossWarningIconLabel(warningIcon)}</span><b>${escapeHtml(info.title)}</b><small>${escapeHtml(info.tip)}</small><em class="boss-counter-route" aria-hidden="true">반격 예고 → 매칭으로 차단</em>`;
  const battleStage = document.querySelector<HTMLElement>('.battle-stage');
  const bossLane = document.querySelector<HTMLElement>('.boss-lane');
  battleStage?.setAttribute('data-boss-attack-readability', BOSS_ATTACK_READABILITY_PATCH);
  battleStage?.setAttribute('data-game-ui-stability', GAME_UI_STABILITY_PASS_PATCH);
  battleStage?.setAttribute('data-boss-vfx-density-guard', BOSS_VFX_DENSITY_GUARD_PATCH);
  battleStage?.setAttribute('data-boss-vfx-density', compactAttack ? 'soft' : 'normal');
  battleStage?.setAttribute('data-boss-warning-icon-set', BOSS_WARNING_ICON_SET_PATCH);
  battleStage?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  battleStage?.setAttribute('data-warning-icon', warningIcon);
  bossLane?.setAttribute('data-boss-attack-readability', BOSS_ATTACK_READABILITY_PATCH);
  bossLane?.setAttribute('data-game-ui-stability', GAME_UI_STABILITY_PASS_PATCH);
  bossLane?.setAttribute('data-boss-vfx-density-guard', BOSS_VFX_DENSITY_GUARD_PATCH);
  bossLane?.setAttribute('data-boss-vfx-density', compactAttack ? 'soft' : 'normal');
  bossLane?.setAttribute('data-boss-warning-icon-set', BOSS_WARNING_ICON_SET_PATCH);
  bossLane?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  bossLane?.setAttribute('data-warning-icon', warningIcon);
}

function getBossWarningIconLabel(icon: string) {
  if (icon === 'clock') return '시간';
  if (icon === 'mistake') return '실수';
  if (icon === 'pulse') return '압박';
  if (icon === 'combo') return '콤보';
  return '예고';
}

function triggerBossTelegraph(reason: 'combo' | 'time' | 'pressure' | 'mismatch') {
  setBossFrame('warn');
  const boss = state.activeBoss || {};
  syncBossAttackPreview(reason);
  const reasonText: Record<string, string> = {
    combo: '콤보 반격',
    time: '시간 압박',
    pressure: '보스 압박',
    mismatch: '실패 반격'
  };
  el.bossTelegraph.textContent = `${boss.telegraphTitle || reasonText[reason]} · ${boss.telegraphLine || boss.attackLine || '연결을 이어가세요.'}`;
  el.bossTelegraph.dataset.reason = reason;
  el.bossTelegraph.dataset.pattern = getBossWarningPattern(reason);
  el.bossTelegraph.dataset.bossId = boss.id || 'forgotten-spirit';
  el.bossCore.dataset.warningPattern = getBossWarningPattern(reason);
  el.bossCore.dataset.bossWarningDepth = boss.id || 'forgotten-spirit';
  applyBossWarningReadability(reason, boss);
  el.bossTelegraph.classList.remove('hidden', 'telegraph-pop');
  void el.bossTelegraph.offsetWidth;
  el.bossTelegraph.classList.add('telegraph-pop');
  const softVfx = state.hudDensity === 'micro' || window.innerWidth <= 390 || window.innerHeight <= 700;
  el.bossTelegraph.dataset.bossVfxDensityGuard = BOSS_VFX_DENSITY_GUARD_PATCH;
  el.bossTelegraph.dataset.vfxDensity = softVfx ? 'soft' : 'normal';
  el.bossTelegraph.dataset.bossTelegraphContrast = BOSS_TELEGRAPH_CONTRAST_PATCH;
  el.bossAttackPreview?.setAttribute('data-boss-telegraph-contrast', BOSS_TELEGRAPH_CONTRAST_PATCH);
  // Legacy QA anchor: renderer.playBossWarning(boss.shakePower || 7, getBossWarningPattern(reason), boss.id ||
  renderer.playBossWarning(Math.max(3, Math.round((boss.shakePower || 7) * (softVfx ? 0.62 : 1))), getBossWarningPattern(reason), boss.id || 'forgotten-spirit');
  if (state.stageModifiers.includes('festivalBoss') || isSummerSeasonStage(getStageById(state.selectedStageId))) {
    renderer.playSummerModifierVfx(['festivalBoss'], Math.max(1, state.combo), null);
    document.querySelector<HTMLElement>('.boss-lane')?.setAttribute('data-boss-season-polish', BOSS_SEASON_POLISH_PATCH);
    playFinaleBossEventCutin(reason);
  }
  window.setTimeout(hideBossTelegraph, 1500);
}

function playFinaleBossEventCutin(reason: 'combo' | 'time' | 'pressure' | 'mismatch') {
  const stage = getStageById(state.selectedStageId);
  const isFinale = Number(stage.number || 0) >= (SUMMER_SEASON_EVENT.finaleStartStageNumber || 79);
  if (!isFinale && !state.stageModifiers.includes('festivalBoss')) return;
  const now = Date.now();
  const cooldownMs = reason === 'mismatch' ? FINALE_BOSS_CUTIN_MISMATCH_MS : FINALE_BOSS_CUTIN_COOLDOWN_MS;
  if (now - state.lastFinaleBossCutinAt < cooldownMs) {
    el.bossHitCutin.dataset.finaleBossCooldown = FINALE_BOSS_CUTIN_COOLDOWN_PATCH;
    return;
  }
  state.lastFinaleBossCutinAt = now;
  el.bossHitCutin.dataset.finaleBossCutin = FINALE_BOSS_CUTIN_PATCH;
  el.bossHitCutin.dataset.finaleBossCooldown = FINALE_BOSS_CUTIN_COOLDOWN_PATCH;
  el.bossHitCutin.dataset.visualPriority = 'finale-boss-warning';
  const enhanced = state.inventory['summer-finale-cutin'] ? ' 강화' : '';
  el.bossHitCutin.textContent = reason === 'time' ? `축제 보스${enhanced} · 시간 압박` : reason === 'mismatch' ? `축제 보스${enhanced} · 실수 반격` : `축제 보스${enhanced} · 피날레 경고`;
  el.bossHitCutin.classList.remove('hidden', 'boss-hit-pop', 'boss-break-pop', 'boss-finisher-pop', 'season-shop-burst-pop', 'finale-boss-pop');
  void el.bossHitCutin.offsetWidth;
  el.bossHitCutin.classList.add('finale-boss-pop', 'boss-hit-pop');
  window.setTimeout(() => el.bossHitCutin.classList.add('hidden'), 860);
}

function getBossWarningPattern(reason: 'combo' | 'time' | 'pressure' | 'mismatch'): 'column' | 'row' | 'cross' | 'diagonal' {
  if (reason === 'combo') return 'cross';
  if (reason === 'time') return 'row';
  if (reason === 'mismatch') return 'diagonal';
  return 'column';
}

function hideBossTelegraph() {
  el.bossTelegraph.classList.add('hidden');
}

function handleTileTap(point: BoardPoint) {
  if (state.locked) return;
  const tile = state.board[point.row]?.[point.col];
  if (!tile) return;
  audio.play('tap');
  HAPTIC.tap();
  if (handleSpecialTileGate(point, tile)) return;
  if (!state.selected) {
    state.selected = point;
    renderer.setSelected(point);
    audio.play('select');
    HAPTIC.select();
    return;
  }
  const first = state.selected;
  if (first.row === point.row && first.col === point.col) {
    state.selected = null;
    renderer.setSelected(null);
    return;
  }
  const connectionPath = findConnectionPath(state.board, first, point);
  const firstTile = getTileAt(state.board, first);
  const secondTile = getTileAt(state.board, point);
  if (connectionPath) {
    hideFirstTouchGuide(true);
    state.locked = true;
    state.moves += 1;
    state.combo += 1;
    state.comboMax = Math.max(state.comboMax, state.combo);
    state.score += 100 * state.combo;
    renderer.setSelected(null);
    state.board = revealPairSpecials(state.board, first, point);
    audio.play('match');
    window.setTimeout(() => audio.play('beam'), 90);
    window.setTimeout(() => audio.play('burst'), 220);
    if (state.combo > 1) {
      audio.play('combo');
      HAPTIC.combo();
      showComboCutin(state.combo);
      if (state.combo >= 3) showBossHitCutin(state.combo);
    } else HAPTIC.match();
    renderer.playMatchSequence(first, point, state.combo, () => {
      state.board = removePair(state.board, first, point);
      grantPairMatchTimeBonus(firstTile, secondTile);
      grantSummerSeasonComboBonus();
      renderer.playSummerModifierVfx(state.stageModifiers, state.combo, connectionPath);
      applySpecialMatchRewards(firstTile, secondTile);
      advanceSpecialRulesAfterMatch();
      state.selected = null;
      state.locked = false;
      renderGameHud();
      const hp = (countRemaining(state.board) / Math.max(1, state.board.length * state.board[0].length)) * 100;
      renderer.setBossHp(hp, getBossPhase(hp));
      const warningEvery = state.activeBoss?.comboWarningEvery || 6;
      if (state.combo > 0 && state.combo % warningEvery === 0) triggerBossTelegraph('combo');
      if (isCleared(state.board)) clearStage();
    }, connectionPath);
  } else {
    state.moves += 1;
    state.combo = 0;
    renderer.playMismatch(point);
    HAPTIC.warning();
    renderer.setSelected(point);
    state.selected = point;
    if (state.stageModifiers.includes('bossPressure')) {
      state.remainingSeconds = Math.max(0, state.remainingSeconds - 4);
      triggerBossTelegraph('mismatch');
    }
    setStatus(state.stageModifiers.includes('bossPressure') ? '보스 압박 중 실패하여 시간이 4초 줄었습니다.' : '연결 경로는 최대 두 번까지만 꺾을 수 있습니다.');
    renderGameHud();
  }
}

function tickTimer() {
  if (state.screen !== 'game' || state.locked) return;
  state.remainingSeconds = Math.max(0, state.remainingSeconds - 1);
  state.noMatchSeconds += 1;
  triggerStallPressure();
  renderGameHud();
  const warningSeconds = state.activeBoss?.warningSeconds || 15;
  if (!state.warnedLowTime && state.remainingSeconds <= warningSeconds && state.remainingSeconds > 0) {
    state.warnedLowTime = true;
    triggerBossTelegraph('time');
    setStatus(state.activeBoss?.attackLine || '보스가 반격을 준비합니다. 빠르게 연결하세요.');
  }
  if (state.stageModifiers.includes('bossPressure') && state.remainingSeconds > 0 && state.remainingSeconds % 30 === 0) {
    state.pressureTick += 1;
    state.score = Math.max(0, state.score - Number(state.activeBoss?.pressurePenalty || 25));
    triggerBossTelegraph('pressure');
    renderGameHud();
  }
  if (state.remainingSeconds <= 0) {
    state.locked = true;
    clearInterval(state.timerId);
    setStatus('시간이 끝났습니다. 같은 스테이지를 다시 도전하세요.');
  }
}

function showHint() {
  if (state.locked || state.hints <= 0) return;
  const hint = findHint(state.board);
  if (!hint) {
    setStatus('현재 연결 가능한 쌍이 없어 섞기를 사용하세요.');
    return;
  }
  state.hints -= 1;
  const points = hint.map((item: any) => ({ row: item.row, col: item.col }));
  const routePath = points.length >= 2 ? findConnectionPath(state.board, points[0], points[1]) : null;
  renderer.hint(points, routePath);
  audio.play('select');
  setStatus('빛길이 이어지는 오브젝트를 보세요.');
}

async function shuffleBoard() {
  if (state.locked || state.shuffles <= 0) return;
  state.shuffles -= 1;
  state.board = shuffleRemaining(state.board);
  state.selected = null;
  await renderer.renderBoard(state.board);
  audio.play('select');
  setStatus('마법진이 흔들리며 남은 오브젝트를 섞었습니다.');
}

async function clearStage() {
  state.locked = true;
  clearInterval(state.timerId);
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const wasAlreadyCleared = Boolean(state.campaignProgress.cleared[stage.id]);
  state.lastSeasonPassReward = null;
  const timeBonus = state.remainingSeconds * 5;
  const comboBonus = state.comboMax * 80;
  const score = Math.round((state.score + timeBonus + comboBonus) * difficulty.scoreMultiplier);
  state.score = score;
  const stars = state.remainingSeconds > difficulty.timeLimitSeconds * 0.5 ? 3 : state.remainingSeconds > difficulty.timeLimitSeconds * 0.25 ? 2 : 1;
  state.lastClearedStageId = stage.id;
  unlockStage(stage.id, stars, score);
  addReward(stage.reward.type, stage.reward.amount);
  if (isSummerSeasonStage(stage)) {
    addReward(SUMMER_SEASON_EVENT.currencyType, SUMMER_SEASON_EVENT.clearReward);
    if (!wasAlreadyCleared) {
      const passReward = getSummerSeasonPassRewardForClears(getSummerSeasonClears());
      if (passReward) {
        addReward(passReward.type, passReward.amount);
        state.lastSeasonPassReward = passReward;
        renderer.playSeasonPassRewardBurst(passReward.label);
      }
    }
  }
  if (state.currentBoardId === 'daily') addReward('spark', state.dailyChallenge.rewardBoost);
  state.localStats.bestScore = Math.max(state.localStats.bestScore, score);
  state.localStats.clearCount += 1;
  writeJson('dream-library-local-stats', state.localStats);
  saveLocalScore(score, stars);
  renderStats();
  renderLobby();
  renderGameHud();
  audio.play('clear');
  renderer.playClearRewardFlow(stars, score);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-clear-flow-stage', 'v1040-reward-bridge');
  await saveScore(score, stars);
  await refreshRankingPanelsAfterScore();
  openReward(stars, score);
}

function updateScreen(screen: ScreenName) {
  if (screen !== state.screen) state.previousScreen = state.screen;
  state.screen = screen;
  el.app.dataset.screen = screen;
  document.body.dataset.screen = screen;
  const bg = screen === 'login' ? 'moon-library-v2' : screen === 'lobby' ? 'gothic-window-v2' : 'library-hall';
  if (screen === 'lobby' || screen === 'game') {
    syncGameViewport({ reason: `screen-${screen}` });
    portraitRuntime?.syncViewport();
  }
  document.documentElement.style.setProperty('--library-background-url', bg.endsWith('-v2') ? backgroundImageSet(bg) : `url(${import.meta.env.BASE_URL}assets/backgrounds/${bg}.png)`);
  el.screens.forEach((screenEl) => screenEl.classList.toggle('active', screenEl.id === `screen-${screen}`));
  // v1.0.37: no persistent top navigation line; browser back and in-screen actions handle flow.
  el.backButton.classList.add('hidden');
  if (screen === 'lobby') renderLobby();
  if (screen !== 'lobby') { closeLobbyMenuPanel({ silent: true }); clearDailyStartNudge(); }
  if (screen === 'settings') renderAuth();
  scheduleGameUiStabilityPass();
  if (state.browserBackReady) {
    try { window.history.replaceState({ dreamLibrary: true, screen }, '', window.location.href); } catch {}
  }
}


async function switchToGuestAccountFromOptions() {
  await runAuth(async () => {
    if (firebaseReady && state.user && !state.user.isAnonymous) await logout();
    state.localGuest = makeLocalGuest();
    writeJson('dream-library-local-guest', state.localGuest);
    renderAuth();
    closeOptionsPanel();
    enterLobbyFromAuth('guest');
  }, '게스트 계정으로 전환했습니다.');
}

async function switchToGoogleAccountFromOptions() {
  closeOptionsPanel();
  await runGoogleLogin('options');
}

function openEmailAccountSwitchFromOptions() {
  closeOptionsPanel();
  openEmailAuthModal('options');
}

function openEmailAuthModal(source: 'login' | 'options' = 'login') {
  el.emailAuthModal.classList.remove('hidden');
  el.emailAuthModal.dataset.emailAuth = 'center-popup-v1043';
  el.emailAuthModal.dataset.source = source;
  el.emailForm.classList.add('collapsed');
  el.emailForm.setAttribute('aria-hidden', 'true');
  el.emailModalInput.focus({ preventScroll: true });
  setStatus(source === 'options' ? '중앙 팝업에서 이메일 저장 계정으로 전환하세요.' : '이메일 저장 계정 정보를 입력하세요.');
}

function closeEmailAuthModal() {
  el.emailAuthModal.classList.add('hidden');
}

function getModalEmailCredentials() {
  const email = el.emailModalInput.value.trim();
  const password = el.passwordModalInput.value;
  if (!email || !password) throw Object.assign(new Error('Email and password required.'), { code: 'auth/missing-email-password' });
  return { email, password };
}

async function runGoogleLogin(source: 'start' | 'options') {
  await runAuth(async () => {
    audio.play('tap');
    HAPTIC.tap();
    if (!firebaseReady) throw new Error('login-disabled');
    setStatus('구글 로그인 창을 여는 중입니다. 반응이 없으면 잠시 뒤 로그인 화면으로 이동합니다.');
    sessionStorage.setItem(GOOGLE_REDIRECT_PENDING_KEY, '1');
    await handoffIfNeeded('auth');
    await loginWithGoogle();
    sessionStorage.removeItem(GOOGLE_REDIRECT_PENDING_KEY);
    state.localGuest = null;
    writeJson('dream-library-local-guest', null);
    renderAuth();
    if (source === 'options') closeOptionsPanel();
    enterLobbyFromAuth('google');
  }, '구글 로그인으로 저장 플레이를 시작했습니다.');
}

function runEmailLoginFromModal() {
  runAuth(async () => {
    if (!firebaseReady) throw new Error('login-disabled');
    const { email, password } = getModalEmailCredentials();
    await handoffIfNeeded('auth');
    await loginWithEmail(email, password);
    closeEmailAuthModal();
    enterLobbyFromAuth('email');
  }, '이메일 로그인으로 저장 플레이를 시작했습니다.');
}

function runEmailSignupFromModal() {
  runAuth(async () => {
    if (!firebaseReady) throw new Error('login-disabled');
    const { email, password } = getModalEmailCredentials();
    await handoffIfNeeded('auth');
    await signupWithEmail(email, password);
    closeEmailAuthModal();
    enterLobbyFromAuth('email-signup');
  }, '이메일 계정을 만들고 저장 플레이를 시작했습니다.');
}

function runEmailLoginFromInlineFallback() {
  el.emailModalInput.value = el.emailInput.value;
  el.passwordModalInput.value = el.passwordInput.value;
  runEmailLoginFromModal();
}

function runEmailSignupFromInlineFallback() {
  el.emailModalInput.value = el.emailInput.value;
  el.passwordModalInput.value = el.passwordInput.value;
  runEmailSignupFromModal();
}

function openOptions() {
  renderAuth();
  el.optionsModal.classList.remove('hidden');
  el.optionsModal.dataset.accountSwitch = 'v1043-account-switch-modal';
}

function openOptionsFromExitSheet() {
  closeExitConfirm();
  openOptions();
  setStatus('옵션 설정을 열었습니다. 소리, 품질, 계정 상태를 확인하세요.');
}

function closeOptionsPanel() {
  el.optionsModal.classList.add('hidden');
}

function exitToLobby(reason: 'button' | 'back' = 'button') {
  stopCurrentBoard();
  updateScreen('lobby');
  if (reason === 'button') setStatus('로비로 돌아왔습니다.');
}

function exitToFirstScreen() {
  stopCurrentBoard();
  updateScreen('login');
}

function stopCurrentBoard() {
  state.locked = true;
  clearInterval(state.timerId);
  state.selected = null;
  renderer.setSelected(null);
  hideBossTelegraph();
}

function openExitConfirm() {
  el.exitConfirmModal.dataset.backActionSheet = BACK_ACTION_SHEET_PATCH;
  el.exitConfirmModal.dataset.mobileExitOptions = MOBILE_EXIT_OPTIONS_QA_PATCH;
  el.exitConfirmModal.dataset.backSheetOptionRow = BACK_SHEET_OPTION_ROW_PATCH;
  el.exitConfirmModal.dataset.backSheetClarity = BACK_SHEET_CLARITY_PATCH;
  el.exitConfirmMessage.textContent = state.screen === 'game'
    ? '진행 중인 판을 멈추고 첫 화면으로 돌아가거나, 옵션을 확인하거나, 서고를 정리할 수 있습니다.'
    : state.screen === 'login'
      ? '첫 화면입니다. 옵션을 확인하거나 서고를 정리하고 나갈 수 있습니다.'
      : '첫 화면으로 돌아가거나, 옵션을 확인하거나, 서고를 정리하고 나갈 수 있습니다.';
  el.exitConfirmModal.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  el.exitConfirmModal.classList.remove('hidden');
  scheduleUiUxStabilityPass();
  setStatus('뒤로가기 선택지를 열었습니다.');
  HAPTIC.warning();
}

function exitHomeFromBackSheet() {
  closeExitConfirm();
  exitToFirstScreen();
  setStatus('첫 화면으로 돌아왔습니다.');
}

function closeExitConfirm() {
  el.exitConfirmModal.classList.add('hidden');
  scheduleUiUxStabilityPass();
}

function confirmExitApp() {
  closeExitConfirm();
  writeText('dream-library-last-exit-at', new Date().toISOString());
  stopCurrentBoard();
  updateScreen('login');
  showExitSleep('게임 상태를 정리했습니다. 홈 버튼이나 앱 전환으로 나가면 됩니다.');
  try { window.close(); } catch {}
  window.setTimeout(() => {
    if (!document.hidden) {
      showExitSleep('홈 버튼이나 앱 전환으로 나가면 되고, 다시 플레이하려면 아래 버튼을 누르세요.');
    }
  }, 260);
}

function showExitSleep(message: string) {
  el.exitSleepMessage.textContent = message;
  document.body.dataset.appState = 'sleep';
  el.exitSleepModal.classList.remove('hidden');
  setStatus('꿈의 서고를 종료 상태로 전환했습니다.');
}

function wakeFromExitSleep() {
  document.body.dataset.appState = 'active';
  el.exitSleepModal.classList.add('hidden');
  updateScreen('login');
  setStatus('다시 열었습니다. 게스트/구글/이메일 로그인 중 선택하세요.');
}

function getAuthProviderLabel(user: any) {
  if (!user) return '';
  const providerId = user.providerData?.[0]?.providerId || '';
  if (providerId === 'google.com') return '구글 로그인 · 진행 저장 중';
  if (user.email) return '이메일 로그인 · 진행 저장 중';
  if (user.isAnonymous) return '게스트 로그인 · 익명 저장 중';
  return '저장 세션 연결 중';
}

function renderAuth() {
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '새로운 사서님';
  const provider = state.user ? getAuthProviderLabel(state.user) : state.localGuest ? '게스트 로그인 · 로컬 진행 중' : '게스트/구글/이메일 로그인 중 선택하세요.';
  el.authName.textContent = name;
  el.authProvider.textContent = provider;
  el.settingsAccountText.textContent = `${name} · ${provider}`;
  el.optionsModal.dataset.accountSwitch = 'v1043-account-switch-modal';
  el.enterLobbyButton.classList.add('hidden');
  el.enterLobbyButton.setAttribute('aria-hidden', 'true');
  el.signoutButton.classList.toggle('hidden', !hasSession());
  renderSoundButton();
}

function renderSoundButton() {
  el.soundToggle.textContent = state.soundEnabled ? '효과음 켜짐' : '효과음 꺼짐';
  el.soundToggle.setAttribute('aria-pressed', String(state.soundEnabled));
}

function renderQualityButton() {
  const text = qualityText(state.qualityProfile.tier);
  const budget = getEngineRenderBudgetDetail();
  el.qualityToggle.textContent = `렌더링 ${text}`;
  el.qualityLabel.textContent = `${text} · ${state.qualityProfile.reason} · ${renderBudgetText(budget.name)}`;
}

function renderBudgetText(name: 'lite' | 'balanced' | 'rich') {
  if (name === 'rich') return '고급 연출';
  if (name === 'lite') return '절약 연출';
  return '균형 연출';
}

function getEngineRenderBudgetDetail() {
  const width = window.innerWidth || document.documentElement.clientWidth || 390;
  const height = window.innerHeight || document.documentElement.clientHeight || 740;
  const smallViewport = Math.min(width, height) <= 390 || height <= 700;
  const longLobby = STAGES.length >= 90;
  const tier = state.qualityProfile?.tier || 'medium';
  const memory = Number((navigator as any).deviceMemory || 4);
  const cores = Number(navigator.hardwareConcurrency || 4);
  const selected = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[selected?.difficultyKey] || DIFFICULTIES.normal;
  const heavyBoard = Number(difficulty.rows || 0) * Number(difficulty.cols || 0) >= 88;
  let name: 'lite' | 'balanced' | 'rich' = 'balanced';
  const reasons: string[] = [];
  if (tier === 'low' || smallViewport || memory <= 3 || cores <= 3) {
    name = 'lite';
    reasons.push('small-or-low-device');
  } else if (tier === 'high' && !longLobby && !heavyBoard) {
    name = 'rich';
    reasons.push('high-profile-clear-space');
  } else {
    reasons.push(longLobby ? 'long-lobby' : 'balanced-profile');
  }
  if (heavyBoard && name === 'rich') name = 'balanced';
  return {
    name,
    reason: reasons.join('+'),
    seasonLimit: name === 'lite' ? 2 : name === 'balanced' ? 3 : 4,
    vfxAlpha: name === 'lite' ? 0.48 : name === 'balanced' ? 0.72 : 1,
    motion: name === 'lite' ? 'short' : name === 'balanced' ? 'stable' : 'full'
  };
}

function applyAdaptiveVisualBudget() {
  const budget = getEngineRenderBudgetDetail();
  state.renderBudget = budget;
  document.body.dataset.adaptiveVisualBudget = ENGINE_DESIGN_UPGRADE_PATCH;
  document.body.dataset.engineRenderBudget = ENGINE_RENDER_BUDGET_TUNING_PATCH;
  document.body.dataset.storeRewardPolish = STORE_REWARD_COLLECTION_POLISH_PATCH;
  document.body.dataset.lobbyDensityFinalQa = LOBBY_DENSITY_FINAL_QA_PATCH;
  document.body.dataset.touchConflictAudit = TOUCH_CONFLICT_AUDIT_PATCH;
  document.body.dataset.realDeviceTouchQa = REAL_DEVICE_TOUCH_QA_PATCH;
  document.body.dataset.dailyStartSignal = DAILY_START_SIGNAL_PATCH;
  document.body.dataset.backActionSheet = BACK_ACTION_SHEET_PATCH;
  document.body.dataset.mobileExitOptions = MOBILE_EXIT_OPTIONS_QA_PATCH;
  document.body.dataset.dailyRouteAssist = DAILY_START_ROUTE_ASSIST_PATCH;
  document.body.dataset.backSheetOptionRow = BACK_SHEET_OPTION_ROW_PATCH;
  document.body.dataset.lobbyHeroSafeMotion = LOBBY_HERO_SAFE_MOTION_PATCH;
  document.body.dataset.startCoachOverlap = START_COACH_SMART_OVERLAP_PATCH;
  document.body.dataset.backSheetClarity = BACK_SHEET_CLARITY_PATCH;
  document.body.dataset.lobbyPolishLayer = LOBBY_POLISH_LAYER_PATCH;
  document.body.dataset.dailyStartPointer = DAILY_START_TARGET_POINTER_PATCH;
  document.body.dataset.dailyStartPrecision = DAILY_START_PRECISION_RAIL_PATCH;
  document.body.dataset.lobbyContentGuide = LOBBY_CONTENT_GUIDE_PATCH;
  document.body.dataset.dailyRewardDrama = DAILY_REWARD_DRAMA_PATCH;
  document.body.dataset.bossIntroPolish = BOSS_INTRO_POLISH_PATCH;
  document.body.dataset.bossIntroPreload = BOSS_INTRO_PRELOAD_PATCH;
  document.body.dataset.dailyStartFocusAssist = DAILY_START_FOCUS_ASSIST_PATCH;
  document.body.dataset.lobbyGuideComfort = LOBBY_GUIDE_COMFORT_PATCH;
  document.body.dataset.bossIntroPreload = BOSS_INTRO_PRELOAD_PATCH;
  document.body.dataset.dailyQuestChain = DAILY_QUEST_CHAIN_PATCH;
  document.body.dataset.bossAttackReadability = BOSS_ATTACK_READABILITY_PATCH;
  document.body.dataset.rewardFlowPolish = REWARD_FLOW_POLISH_PATCH;
  document.body.dataset.restorationRewardBridge = RESTORATION_REWARD_BRIDGE_PATCH;
  document.body.dataset.lobbyRhythmCleanup = LOBBY_RHYTHM_CLEANUP_PATCH;
  document.body.dataset.restorationDetailCeremony = RESTORATION_DETAIL_CEREMONY_PATCH;
  document.body.dataset.rewardPopupDensityGuard = REWARD_POPUP_DENSITY_GUARD_PATCH;
  document.body.dataset.bossWarningIconSet = BOSS_WARNING_ICON_SET_PATCH;
  document.body.dataset.clearFlowRecommendationQa = CLEAR_FLOW_RECOMMENDATION_QA_PATCH;
  document.body.dataset.dailyStartArrowCta = DAILY_START_ARROW_CTA_PATCH;
  document.body.dataset.lobbyUiPolish = LOBBY_UI_POLISH_PASS_PATCH;
  document.body.dataset.dailyStartArrowCta = DAILY_START_ARROW_CTA_PATCH;
  document.body.dataset.lobbyUiPolish = LOBBY_UI_POLISH_PASS_PATCH;
  document.body.dataset.effectBudget = budget.name;
  document.body.dataset.renderBudgetReason = budget.reason;
  document.body.style.setProperty('--season-vfx-alpha', String(budget.vfxAlpha));
  document.body.dataset.designQa = MOBILE_UI_DENSITY_QA_PATCH;
  document.body.dataset.duplicateIdCleanup = DUPLICATE_ID_CLEANUP_PATCH;
  renderer.setRenderBudget(budget.name);
  el.app?.setAttribute('data-engine-upgrade', ENGINE_DESIGN_UPGRADE_PATCH);
  el.app?.setAttribute('data-engine-render-budget', ENGINE_RENDER_BUDGET_TUNING_PATCH);
  el.app?.setAttribute('data-real-device-touch-qa', REAL_DEVICE_TOUCH_QA_PATCH);
  el.app?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.app?.setAttribute('data-back-action-sheet', BACK_ACTION_SHEET_PATCH);
  el.app?.setAttribute('data-mobile-exit-options', MOBILE_EXIT_OPTIONS_QA_PATCH);
  el.app?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.app?.setAttribute('data-back-sheet-option-row', BACK_SHEET_OPTION_ROW_PATCH);
  el.app?.setAttribute('data-lobby-hero-safe-motion', LOBBY_HERO_SAFE_MOTION_PATCH);
  el.app?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  el.app?.setAttribute('data-back-sheet-clarity', BACK_SHEET_CLARITY_PATCH);
  el.app?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  el.app?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  el.app?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  el.app?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.app?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  el.app?.setAttribute('data-daily-reward-drama', DAILY_REWARD_DRAMA_PATCH);
  el.app?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.app?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  el.app?.setAttribute('data-boss-intro-preload', BOSS_INTRO_PRELOAD_PATCH);
  el.app?.setAttribute('data-boss-intro-polish', BOSS_INTRO_POLISH_PATCH);
  el.app?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  el.app?.setAttribute('data-boss-attack-readability', BOSS_ATTACK_READABILITY_PATCH);
  el.app?.setAttribute('data-reward-flow-polish', REWARD_FLOW_POLISH_PATCH);
  el.app?.setAttribute('data-daily-start-arrow-cta', DAILY_START_ARROW_CTA_PATCH);
  el.app?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  el.app?.setAttribute('data-first-touch-ux', FIRST_TOUCH_MICRO_TUTORIAL_PATCH);
  el.app?.setAttribute('data-game-ui-stability', GAME_UI_STABILITY_PASS_PATCH);
  el.app?.setAttribute('data-lobby-ui-polish', LOBBY_UI_POLISH_PASS_PATCH);
  el.app?.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);
  el.app?.setAttribute('data-lobby-menu-back-close', LOBBY_MENU_BACK_CLOSE_PATCH);
  el.app?.setAttribute('data-lobby-menu-tab-switch', LOBBY_MENU_TAB_SWITCH_PATCH);
  el.app?.setAttribute('data-lobby-panel-state-retention', LOBBY_PANEL_STATE_RETENTION_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-engine-upgrade', ENGINE_DESIGN_UPGRADE_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-density-final-qa', LOBBY_DENSITY_FINAL_QA_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-hero-safe-motion', LOBBY_HERO_SAFE_MOTION_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-first-touch-ux', FIRST_TOUCH_MICRO_TUTORIAL_PATCH);
  document.querySelector<HTMLElement>('.screen-game')?.setAttribute('data-game-ui-stability', GAME_UI_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-ui-polish', LOBBY_UI_POLISH_PASS_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.summer-season-panel')?.setAttribute('data-engine-render-budget', ENGINE_RENDER_BUDGET_TUNING_PATCH);
  document.querySelector<HTMLElement>('.summer-season-panel')?.setAttribute('data-reward-detail-showcase', REWARD_DETAIL_SHOWCASE_PATCH);
  document.querySelector<HTMLElement>('.summer-season-panel')?.setAttribute('data-real-device-touch-qa', REAL_DEVICE_TOUCH_QA_PATCH);
  document.querySelector<HTMLElement>('.daily-panel')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-hero-safe-motion', LOBBY_HERO_SAFE_MOTION_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-ui-polish', LOBBY_UI_POLISH_PASS_PATCH);
  el.dailyStageButton?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStageButton?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.daily-start-target-ring')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.daily-start-target-ring')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartButton?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.dailyStartButton?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.daily-start-stack')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.dailyStartSignal?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-arrow-cta', DAILY_START_ARROW_CTA_PATCH);
  el.dailyStartSignal?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  el.dailyStartSignal?.setAttribute('data-first-touch-ux', FIRST_TOUCH_MICRO_TUTORIAL_PATCH);
  el.dailyStartBeam?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartBeam?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartBeam?.setAttribute('data-daily-start-arrow-cta', DAILY_START_ARROW_CTA_PATCH);
  el.dailyStartBeam?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  el.dailyStartGuide?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-ui-polish', LOBBY_UI_POLISH_PASS_PATCH);
  el.dailyStartGuide?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  el.dailyStartFocusSummary?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyQuestChain?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  el.dailyRewardPromise?.setAttribute('data-daily-reward-drama', DAILY_REWARD_DRAMA_PATCH);
}

function qualityText(tier: string) {
  return tier === 'high' ? '고품질' : tier === 'medium' ? '균형' : '절전';
}

function syncDailyStartSignal() {
  document.body.dataset.dailyStartSignal = DAILY_START_SIGNAL_PATCH;
  document.body.dataset.dailyRouteAssist = DAILY_START_ROUTE_ASSIST_PATCH;
  document.body.dataset.lobbyHeroSafeMotion = LOBBY_HERO_SAFE_MOTION_PATCH;
  document.body.dataset.startCoachOverlap = START_COACH_SMART_OVERLAP_PATCH;
  document.body.dataset.lobbyPolishLayer = LOBBY_POLISH_LAYER_PATCH;
  document.body.dataset.dailyStartPointer = DAILY_START_TARGET_POINTER_PATCH;
  document.body.dataset.dailyStartPrecision = DAILY_START_PRECISION_RAIL_PATCH;
  document.body.dataset.lobbyContentGuide = LOBBY_CONTENT_GUIDE_PATCH;
  document.body.dataset.dailyRewardDrama = DAILY_REWARD_DRAMA_PATCH;
  document.body.dataset.dailyQuestChain = DAILY_QUEST_CHAIN_PATCH;
  document.body.dataset.bossAttackReadability = BOSS_ATTACK_READABILITY_PATCH;
  document.body.dataset.rewardFlowPolish = REWARD_FLOW_POLISH_PATCH;
  document.body.dataset.restorationRewardBridge = RESTORATION_REWARD_BRIDGE_PATCH;
  document.body.classList.toggle('daily-start-coach-seen', state.dailyStartCoachSeen);
  document.body.dataset.startCoachPhase = state.dailyStartCoachSeen ? 'returning' : 'fresh';
  document.body.dataset.uiUxStability = UI_UX_STABILITY_PASS_PATCH;
  document.body.dataset.firstTouchUx = FIRST_TOUCH_MICRO_TUTORIAL_PATCH;
  document.body.dataset.gameUiStability = GAME_UI_STABILITY_PASS_PATCH;
  el.app?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.app?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.app?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  el.app?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  el.app?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-hero-safe-motion', LOBBY_HERO_SAFE_MOTION_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-hero-safe-motion', LOBBY_HERO_SAFE_MOTION_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-lobby-polish-layer', LOBBY_POLISH_LAYER_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.lobby-hero')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  document.querySelector<HTMLElement>('.screen-lobby')?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.daily-panel')?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  document.querySelectorAll<HTMLElement>('[data-start-signal]').forEach((node) => {
    node.dataset.startSignal = DAILY_START_SIGNAL_PATCH;
  });
  el.dailyStageButton?.classList.toggle('start-signal-ready', state.screen === 'lobby');
  el.dailyStartButton?.classList.toggle('start-signal-ready', state.screen === 'lobby');
  el.dailyStartSignal?.classList.toggle('start-signal-ready', state.screen === 'lobby');
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.daily-route-ribbon')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  document.querySelector<HTMLElement>('.daily-start-stack')?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.dailyStageButton?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  el.dailyStartButton?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  el.dailyStartSignal?.setAttribute('data-start-signal', DAILY_START_SIGNAL_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-route-assist', DAILY_START_ROUTE_ASSIST_PATCH);
  el.dailyStartSignal?.setAttribute('data-start-coach-overlap', START_COACH_SMART_OVERLAP_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartSignal?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartBeam?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartBeam?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-content-guide', LOBBY_CONTENT_GUIDE_PATCH);
  el.dailyStartGuide?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  el.dailyStartFocusSummary?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyQuestChain?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  el.dailyRewardPromise?.setAttribute('data-daily-reward-drama', DAILY_REWARD_DRAMA_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStageButton?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStageButton?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
  document.querySelector<HTMLElement>('.daily-start-target-ring')?.setAttribute('data-daily-start-pointer', DAILY_START_TARGET_POINTER_PATCH);
  document.querySelector<HTMLElement>('.daily-start-target-ring')?.setAttribute('data-daily-start-precision', DAILY_START_PRECISION_RAIL_PATCH);
  el.dailyStartSignal?.setAttribute('aria-label', state.dailyStartCoachSeen ? '오른쪽 화살표가 오늘의 복원을 가리킵니다. 누르면 바로 게임 시작' : '오른쪽 화살표가 오늘의 복원 버튼을 정확히 가리킵니다');
  const arrow = el.dailyStartSignal?.querySelector<HTMLElement>('.signal-arrow');
  if (arrow) arrow.textContent = '➜';
  scheduleStartCoachOverlapMeasure();
  scheduleDailyStartPrecisionRailMeasure();
  scheduleDailyStartFocusAssist();
  scheduleUiUxStabilityPass();
  scheduleDailyStartNudge();
}

function initStartCoachOverlapWatcher() {
  window.addEventListener('resize', scheduleStartCoachOverlapMeasure, { passive: true });
  window.addEventListener('orientationchange', scheduleStartCoachOverlapMeasure, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleStartCoachOverlapMeasure();
  });
}

function initDailyStartPrecisionRailWatcher() {
  window.addEventListener('resize', scheduleDailyStartPrecisionRailMeasure, { passive: true });
  window.addEventListener('orientationchange', scheduleDailyStartPrecisionRailMeasure, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleDailyStartPrecisionRailMeasure();
  });
}

function initDailyStartFocusAssistWatcher() {
  window.addEventListener('resize', scheduleDailyStartFocusAssist, { passive: true });
  window.addEventListener('orientationchange', scheduleDailyStartFocusAssist, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleDailyStartFocusAssist();
  });
}

function initUiUxStabilityWatcher() {
  window.addEventListener('resize', scheduleUiUxStabilityPass, { passive: true });
  window.addEventListener('orientationchange', scheduleUiUxStabilityPass, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleUiUxStabilityPass();
  });
}

function scheduleUiUxStabilityPass() {
  if (state.uiUxStabilityTimer) window.clearTimeout(state.uiUxStabilityTimer);
  state.uiUxStabilityTimer = window.setTimeout(syncUiUxStabilityPass, 120);
}

function syncUiUxStabilityPass() {
  state.uiUxStabilityTimer = 0;
  const tight = window.innerWidth <= 430 || window.innerHeight <= 700;
  const modalOpen = !el.exitConfirmModal.classList.contains('hidden') || !el.optionsModal.classList.contains('hidden') || !el.rewardModal.classList.contains('hidden');
  const railMode = document.body.dataset.dailyStartRailMode || 'inactive';
  const dailySignal = el.dailyStartSignal;
  const stageButton = el.dailyStageButton;
  const selectedCopy = document.querySelector<HTMLElement>('.selected-stage-copy');
  const lobbyHero = document.querySelector<HTMLElement>('.lobby-hero');
  const quickActions = document.querySelector<HTMLElement>('.lobby-quick-actions');
  const selectedCard = document.querySelector<HTMLElement>('.selected-stage-card');
  document.body.dataset.uiUxStability = UI_UX_STABILITY_PASS_PATCH;
  document.body.dataset.firstTouchUx = FIRST_TOUCH_MICRO_TUTORIAL_PATCH;
  document.body.dataset.gameUiStability = GAME_UI_STABILITY_PASS_PATCH;
  document.body.dataset.uiUxDensity = tight ? 'tight' : 'comfortable';
  document.body.dataset.uiUxRailMode = railMode;
  document.body.dataset.lobbyRhythmCleanup = LOBBY_RHYTHM_CLEANUP_PATCH;
  document.body.classList.toggle('lobby-rhythm-tight', tight);
  document.body.classList.toggle('ui-ux-tight', tight);
  document.body.classList.toggle('ui-ux-modal-open', modalOpen);
  [el.app, dailySignal, stageButton, el.dailyStartGuide, el.dailyStartBeam, selectedCopy, selectedCard, quickActions, lobbyHero, el.exitConfirmModal].forEach((node) => {
    node?.setAttribute('data-ui-ux-stability', UI_UX_STABILITY_PASS_PATCH);
    node?.setAttribute('data-lobby-rhythm-cleanup', LOBBY_RHYTHM_CLEANUP_PATCH);
  });
  document.querySelectorAll<HTMLElement>('[data-lobby-panel]').forEach((panel) => {
    panel.setAttribute('data-lobby-rhythm-cleanup', LOBBY_RHYTHM_CLEANUP_PATCH);
    panel.dataset.lobbyRhythmDensity = tight ? 'compact' : 'comfortable';
  });
  if (dailySignal) {
    dailySignal.dataset.uiUxRailMode = railMode;
    dailySignal.dataset.uiUxDensity = tight ? 'tight' : 'comfortable';
  }
}

function initGameUiStabilityWatcher() {
  window.addEventListener('resize', scheduleGameUiStabilityPass, { passive: true });
  window.addEventListener('orientationchange', scheduleGameUiStabilityPass, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) scheduleGameUiStabilityPass();
  });
}

function scheduleGameUiStabilityPass() {
  if (state.gameUiStabilityTimer) window.clearTimeout(state.gameUiStabilityTimer);
  state.gameUiStabilityTimer = window.setTimeout(syncGameUiStabilityPass, 100);
}

function syncGameUiStabilityPass() {
  state.gameUiStabilityTimer = 0;
  const tight = window.innerWidth <= 430 || window.innerHeight <= 700;
  const micro = window.innerWidth <= 370 || window.innerHeight <= 640 || state.hudDensity === 'micro';
  const battleStage = document.querySelector<HTMLElement>('.battle-stage');
  const bossLane = document.querySelector<HTMLElement>('.boss-lane');
  const gameHud = document.querySelector<HTMLElement>('.game-hud');
  const boardHost = el.boardHost;
  document.body.dataset.gameUiStability = GAME_UI_STABILITY_PASS_PATCH;
  document.body.dataset.firstTouchUx = FIRST_TOUCH_MICRO_TUTORIAL_PATCH;
  document.body.dataset.microTutorialComfort = MICRO_TUTORIAL_COMFORT_PATCH;
  document.body.dataset.bossWarningIconTrim = BOSS_WARNING_ICON_TRIM_PATCH;
  document.body.dataset.bossWarningIconSet = BOSS_WARNING_ICON_SET_PATCH;
  document.body.dataset.bossCounterLinePolish = BOSS_COUNTER_LINE_POLISH_PATCH;
  document.body.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  document.body.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  document.body.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
  document.body.dataset.smallRewardModalQa = SMALL_REWARD_MODAL_QA_PATCH;
  document.body.dataset.gameUiDensity = micro ? 'micro' : tight ? 'tight' : 'comfortable';
  document.body.classList.toggle('game-ui-tight', tight || micro);
  document.body.classList.toggle('game-ui-micro', micro);
  [battleStage, bossLane, gameHud, boardHost, el.bossAttackPreview, el.firstTouchGuide].forEach((node) => {
    node?.setAttribute('data-game-ui-stability', GAME_UI_STABILITY_PASS_PATCH);
    node?.setAttribute('data-micro-tutorial-comfort', MICRO_TUTORIAL_COMFORT_PATCH);
  });
  battleStage?.setAttribute('data-boss-vfx-density-guard', BOSS_VFX_DENSITY_GUARD_PATCH);
  battleStage?.setAttribute('data-boss-warning-icon-trim', BOSS_WARNING_ICON_TRIM_PATCH);
  battleStage?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  bossLane?.setAttribute('data-boss-vfx-density-guard', BOSS_VFX_DENSITY_GUARD_PATCH);
  bossLane?.setAttribute('data-boss-warning-icon-trim', BOSS_WARNING_ICON_TRIM_PATCH);
  bossLane?.setAttribute('data-boss-counter-line-polish', BOSS_COUNTER_LINE_POLISH_PATCH);
  el.firstTouchGuide?.setAttribute('data-first-touch-ux', FIRST_TOUCH_MICRO_TUTORIAL_PATCH);
  el.firstTouchGuide?.setAttribute('data-micro-tutorial-comfort', MICRO_TUTORIAL_COMFORT_PATCH);
  if (el.bossAttackPreview) {
    el.bossAttackPreview.dataset.attackDensity = (tight || micro) ? 'compact' : 'readable';
    el.bossAttackPreview.dataset.bossVfxDensityGuard = BOSS_VFX_DENSITY_GUARD_PATCH;
    el.bossAttackPreview.dataset.vfxDensity = (tight || micro) ? 'soft' : 'normal';
    el.bossAttackPreview.dataset.bossWarningIconTrim = BOSS_WARNING_ICON_TRIM_PATCH;
    el.bossAttackPreview.dataset.bossWarningIconSet = BOSS_WARNING_ICON_SET_PATCH;
    el.bossAttackPreview.dataset.bossCounterLinePolish = BOSS_COUNTER_LINE_POLISH_PATCH;
    el.bossAttackPreview.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
    el.bossAttackPreview.dataset.bossTelegraphContrast = BOSS_TELEGRAPH_CONTRAST_PATCH;
    el.bossAttackPreview.dataset.iconTrim = micro ? 'icon-only' : tight ? 'compact' : 'readable';
    if (!el.bossAttackPreview.dataset.warningIcon) el.bossAttackPreview.dataset.warningIcon = 'ready';
  }
  if (gameHud) gameHud.dataset.hudDensity = micro ? 'micro' : tight ? 'compact' : state.hudDensity;
}

function showFirstTouchGuide(stage: any, source: 'daily' | 'stage' = 'stage') {
  const guide = el.firstTouchGuide;
  if (!guide) return;
  if (state.firstTouchGuideTimer) window.clearTimeout(state.firstTouchGuideTimer);
  const softRepeat = state.firstTouchGuideSeen && source === 'daily';
  const shouldShow = !state.firstTouchGuideSeen || source === 'daily';
  guide.dataset.firstTouchUx = FIRST_TOUCH_MICRO_TUTORIAL_PATCH;
  guide.dataset.microTutorialComfort = MICRO_TUTORIAL_COMFORT_PATCH;
  guide.dataset.gameUiStability = GAME_UI_STABILITY_PASS_PATCH;
  guide.dataset.guideMode = softRepeat ? 'soft-repeat' : 'full';
  const guideTitle = softRepeat ? '오늘 스테이지 · 짝 1개만 먼저 연결' : `${escapeHtml(stage.title)} · 같은 오브젝트 2개 선택`;
  const guideTip = softRepeat ? '알림은 짧게 접히고 보드는 계속 보입니다' : '선택 타일은 커지지 않고 링/빛으로만 표시됩니다';
  guide.innerHTML = `<span>${source === 'daily' ? '오늘 첫 연결' : '첫 연결'}</span><b>${guideTitle}</b><small>${guideTip}</small><button id="first-touch-guide-close" type="button" aria-label="첫 연결 안내 닫기">확인</button>`;
  el.firstTouchGuideClose = $('#first-touch-guide-close') as HTMLButtonElement;
  el.firstTouchGuideClose?.addEventListener('click', () => hideFirstTouchGuide(true), { once: true });
  guide.classList.toggle('hidden', !shouldShow);
  document.body.classList.toggle('first-touch-guide-active', shouldShow);
  document.body.dataset.firstTouchGuideState = shouldShow ? (softRepeat ? 'soft-repeat' : 'visible') : 'seen';
  document.body.dataset.microTutorialComfort = MICRO_TUTORIAL_COMFORT_PATCH;
  document.body.classList.toggle('first-touch-guide-soft-repeat', softRepeat && shouldShow);
  if (shouldShow) {
    state.firstTouchGuideTimer = window.setTimeout(() => hideFirstTouchGuide(false), softRepeat ? 2800 : 5200);
  }
  scheduleGameUiStabilityPass();
}

function hideFirstTouchGuide(markSeen = false) {
  const guide = el.firstTouchGuide;
  if (state.firstTouchGuideTimer) {
    window.clearTimeout(state.firstTouchGuideTimer);
    state.firstTouchGuideTimer = 0;
  }
  guide?.classList.add('hidden');
  document.body.classList.remove('first-touch-guide-active', 'first-touch-guide-soft-repeat');
  document.body.dataset.firstTouchGuideState = markSeen ? 'closed' : 'resting';
  if (markSeen) {
    state.firstTouchGuideSeen = true;
    writeText(FIRST_TOUCH_GUIDE_SEEN_KEY, MICRO_TUTORIAL_COMFORT_PATCH);
  }
  scheduleGameUiStabilityPass();
}

function scheduleDailyStartFocusAssist() {
  if (state.dailyFocusAssistTimer) window.clearTimeout(state.dailyFocusAssistTimer);
  state.dailyFocusAssistTimer = window.setTimeout(syncDailyStartFocusAssist, 90);
}

function syncDailyStartFocusAssist() {
  state.dailyFocusAssistTimer = 0;
  const tight = window.innerWidth <= 430 || window.innerHeight <= 700;
  const returning = state.dailyStartCoachSeen || document.body.classList.contains('daily-start-signal-used');
  const guideMode = state.screen !== 'lobby' ? 'inactive' : tight ? 'micro' : returning ? 'quiet' : 'full';
  document.body.dataset.dailyStartFocusAssist = DAILY_START_FOCUS_ASSIST_PATCH;
  document.body.dataset.lobbyGuideComfort = LOBBY_GUIDE_COMFORT_PATCH;
  document.body.dataset.dailyStartGuideMode = guideMode;
  document.body.classList.toggle('daily-start-guide-comfort', guideMode === 'quiet' || guideMode === 'micro');
  el.dailyStartGuide?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartGuide?.setAttribute('data-lobby-guide-comfort', LOBBY_GUIDE_COMFORT_PATCH);
  el.dailyStartGuide?.setAttribute('data-guide-mode', guideMode);
  el.dailyStartFocusSummary?.setAttribute('data-daily-start-focus', DAILY_START_FOCUS_ASSIST_PATCH);
  el.dailyStartFocusSummary?.setAttribute('data-guide-mode', guideMode);
  el.dailyQuestChain?.setAttribute('data-daily-quest-chain', DAILY_QUEST_CHAIN_PATCH);
  el.dailyQuestChain?.setAttribute('data-guide-mode', guideMode);
  el.dailyStartSignal?.setAttribute('data-guide-mode', guideMode);
}

function scheduleDailyStartPrecisionRailMeasure() {
  if (state.dailyStartRailMeasureTimer) window.clearTimeout(state.dailyStartRailMeasureTimer);
  state.dailyStartRailMeasureTimer = window.setTimeout(syncDailyStartPrecisionRail, 96);
}

function syncDailyStartPrecisionRail() {
  state.dailyStartRailMeasureTimer = 0;
  const root = document.querySelector<HTMLElement>('.lobby-quick-actions');
  const signal = el.dailyStartSignal;
  const target = el.dailyStageButton;
  const beam = el.dailyStartBeam;
  if (!root || !signal || !target || !beam || state.screen !== 'lobby') {
    beam?.classList.add('hidden');
    document.body.dataset.dailyStartRailMode = 'inactive';
    return;
  }
  const rootRect = root.getBoundingClientRect();
  const signalRect = signal.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  if (!rootRect.width || !targetRect.width || !signalRect.width) return;
  const compact = document.body.classList.contains('daily-start-overlap-safe') || window.innerWidth <= 430;
  const from = compact
    ? { x: signalRect.left + signalRect.width / 2, y: signalRect.bottom + 4 }
    : { x: signalRect.right + 4, y: signalRect.top + signalRect.height / 2 };
  const to = compact
    ? { x: targetRect.left + targetRect.width / 2, y: targetRect.top - 4 }
    : { x: targetRect.left - 5, y: targetRect.top + targetRect.height / 2 };
  let dx = to.x - from.x;
  let dy = to.y - from.y;
  let length = Math.max(18, Math.sqrt(dx * dx + dy * dy));
  let angle = Math.atan2(dy, dx) * 180 / Math.PI;
  const leavesActionBox = from.x < rootRect.left - 8 || from.x > rootRect.right + 8 || to.x < rootRect.left - 8 || to.x > rootRect.right + 8 || from.y < rootRect.top - 8 || from.y > rootRect.bottom + 8 || to.y < rootRect.top - 8 || to.y > rootRect.bottom + 8;
  const tooLong = length > Math.max(190, Math.min(rootRect.width * 0.76, 280));
  const rerouted = leavesActionBox || tooLong;
  if (rerouted) {
    from.x = signalRect.left + signalRect.width / 2;
    from.y = signalRect.bottom + 2;
    to.x = targetRect.left + targetRect.width / 2;
    to.y = targetRect.top - 6;
    dx = to.x - from.x;
    dy = to.y - from.y;
    length = Math.max(18, Math.sqrt(dx * dx + dy * dy));
    angle = Math.atan2(dy, dx) * 180 / Math.PI;
  }
  root.style.setProperty('--daily-rail-x', `${from.x - rootRect.left}px`);
  root.style.setProperty('--daily-rail-y', `${from.y - rootRect.top}px`);
  root.style.setProperty('--daily-rail-length', `${length}px`);
  root.style.setProperty('--daily-rail-angle', `${angle}deg`);
  beam.classList.remove('hidden');
  beam.dataset.railMode = rerouted ? 'rerouted' : compact ? 'compact' : 'direct';
  document.body.dataset.dailyStartRailMode = rerouted ? 'rerouted' : compact ? 'compact' : 'direct';
  document.body.dataset.dailyStartRailIntegrity = rerouted ? 'rerouted' : 'safe';
}

function scheduleStartCoachOverlapMeasure() {
  if (state.startCoachMeasureTimer) window.clearTimeout(state.startCoachMeasureTimer);
  state.startCoachMeasureTimer = window.setTimeout(measureStartCoachOverlap, 80);
}

function rectsOverlap(a: DOMRect, b: DOMRect, pad = 4) {
  return a.left < b.right + pad && a.right > b.left - pad && a.top < b.bottom + pad && a.bottom > b.top - pad;
}

function measureStartCoachOverlap() {
  state.startCoachMeasureTimer = 0;
  if (state.screen !== 'lobby') {
    document.body.classList.remove('daily-start-overlap-safe');
    return;
  }
  const signal = el.dailyStartSignal;
  const target = el.dailyStageButton;
  const heroImage = el.lobbyHeroImage;
  const ribbon = document.querySelector<HTMLElement>('.daily-route-ribbon');
  const targetRing = document.querySelector<HTMLElement>('.daily-start-target-ring');
  if (!signal || !target || !ribbon) return;
  const signalRect = signal.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const ribbonRect = ribbon.getBoundingClientRect();
  const imageRect = heroImage?.getBoundingClientRect();
  const ringRect = targetRing?.getBoundingClientRect();
  const viewportTight = window.innerWidth <= 430 || window.innerHeight <= 720;
  const overlaps = rectsOverlap(signalRect, targetRect, 8) || rectsOverlap(signalRect, ribbonRect, 8) || (ringRect ? rectsOverlap(signalRect, ringRect, 6) : false) || (imageRect ? rectsOverlap(signalRect, imageRect, 2) : false);
  document.body.classList.toggle('daily-start-overlap-safe', viewportTight || overlaps);
  document.body.dataset.startCoachOverlapState = viewportTight || overlaps ? 'compact' : 'clear';
  scheduleDailyStartPrecisionRailMeasure();
}

function clearDailyStartNudge() {
  if (state.dailyStartNudgeTimer) {
    window.clearTimeout(state.dailyStartNudgeTimer);
    state.dailyStartNudgeTimer = 0;
  }
  document.body.classList.remove('daily-start-nudge-ready');
}

function scheduleDailyStartNudge() {
  clearDailyStartNudge();
  if (state.screen !== 'lobby' || state.dailyStartSignalTouched) return;
  state.dailyStartNudgeTimer = window.setTimeout(() => {
    const overlaysClosed = el.exitConfirmModal.classList.contains('hidden') && el.optionsModal.classList.contains('hidden') && el.rewardModal.classList.contains('hidden');
    if (state.screen !== 'lobby' || !overlaysClosed || document.body.classList.contains('is-lobby-dragging')) return;
    document.body.classList.add('daily-start-nudge-ready');
    el.dailyStartSignal?.setAttribute('aria-label', '오른쪽 화살표와 빛줄기가 오늘의 복원 버튼을 가리킵니다');
  }, 5200);
}

function markDailyStartSignalConsumed() {
  state.dailyStartSignalTouched = true;
  state.dailyStartCoachSeen = true;
  writeText(DAILY_START_COACH_SEEN_KEY, START_COACH_SMART_OVERLAP_PATCH);
  clearDailyStartNudge();
  document.body.classList.add('daily-start-signal-used', 'daily-start-coach-seen');
  scheduleDailyStartFocusAssist();
  document.body.dataset.startCoachPhase = 'returning';
}


function renderLobby() {
  let stage = getStageById(state.selectedStageId);
  if (!CHAPTERS.some((chapter: any) => chapter.id === state.selectedChapterId)) state.selectedChapterId = stage.chapterId;
  if (stage.chapterId !== state.selectedChapterId) {
    const fallback = getChapterStages(state.selectedChapterId).find((item: any) => isStageUnlocked(item.id)) || getChapterStages(state.selectedChapterId)[0] || getStageById(DEFAULT_STAGE_ID);
    stage = fallback;
    state.selectedStageId = stage.id;
    writeText('dream-library-selected-stage', stage.id);
  }
  const chapter = getChapterById(state.selectedChapterId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const boss = getBossForStage(stage);
  const clearCount = Object.keys(state.campaignProgress.cleared).length;
  const name = state.user ? getDisplayName(state.user) : state.localGuest ? state.localGuest.name : '사서님';
  el.lobbyGreeting.textContent = `${name}, 서고의 마법진이 준비되었습니다.`;
  syncLobbyMotion(clearCount, stage.id);
  el.selectedChapterName.textContent = chapter.title;
  el.chapterStoryText.textContent = chapter.story;
  el.selectedStageTitle.textContent = `${stage.number}. ${stage.title}`;
  el.selectedStageSubtitle.textContent = stage.subtitle;
  el.selectedStageMeta.textContent = `${difficulty.label} · ${difficulty.rows}×${difficulty.cols} · ${boss.name}`;
  el.selectedStageReward.textContent = `${stage.reward.label} ×${stage.reward.amount}`;
  el.stageProgressLabel.textContent = `${clearCount}/${STAGES.length} 클리어`;
  renderStageLadderSummary(clearCount, stage);
  renderSummerSeasonPanel(clearCount);
  renderChapterTabs();
  const chapterStages = getChapterStages(state.selectedChapterId);
  el.worldMap.innerHTML = chapterStages.map((item: any) => {
    const unlocked = isStageUnlocked(item.id);
    const cleared = Boolean(state.campaignProgress.cleared[item.id]);
    const selected = item.id === state.selectedStageId;
    const stars = state.campaignProgress.cleared[item.id]?.stars ?? 0;
    const difficultyMeta = DIFFICULTIES[item.difficultyKey] || DIFFICULTIES.normal;
    const stageBoss = getBossForStage(item);
    const stageText = cleared ? '★'.repeat(stars) : unlocked ? stageBoss.name.replace('의 ', ' ') : '잠김';
    return `<button type="button" class="stage-node ${unlocked ? 'unlocked' : 'locked'} ${cleared ? 'cleared' : ''} ${selected ? 'selected' : ''}" data-stage-id="${item.id}" data-difficulty="${item.difficultyKey}" aria-label="${item.number} 스테이지 ${escapeHtml(item.title)}"><strong>${item.number}</strong><span>${stageText}</span><small>${difficultyMeta.label}</small></button>`;
  }).join('');
  renderStats();
  renderLobbyMissionDeck();
  renderRestoration();
  renderCollection();
  renderDailyPanel();
  renderLobbyPanelState();
  syncLobbyMenuPortal();
  syncDailyStartSignal();
  applyAdaptiveVisualBudget();
}

function renderStageLadderSummary(clearCount: number, selectedStage: any) {
  const order = ['beginner', 'easy', 'normal', 'growth', 'skilled', 'expert', 'hard', 'nightmare'];
  const nextOpen = STAGES.find((stage: any) => isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id]) || selectedStage;
  const nextLocked = STAGES.find((stage: any) => !isStageUnlocked(stage.id));
  const selectedIndex = Math.max(0, getStageIndex(selectedStage?.id));
  const nextOpenIndex = Math.max(0, getStageIndex(nextOpen?.id));
  const grouped = order
    .map((key) => {
      const stages = STAGES.filter((stage: any) => stage.difficultyKey === key);
      const total = stages.length;
      if (!total) return null;
      const cleared = stages.filter((stage: any) => state.campaignProgress.cleared[stage.id]).length;
      const first = stages[0];
      const meta = DIFFICULTIES[key] || { label: key };
      const active = selectedStage?.difficultyKey === key;
      const reachable = isStageUnlocked(first.id);
      const next = nextOpen?.difficultyKey === key;
      return `<button type="button" class="ladder-chip ${active ? 'active' : ''} ${next ? 'next' : ''}" data-difficulty="${key}" data-first-stage-id="${first.id}" data-reachable="${reachable ? 'true' : 'false'}"><b>${escapeHtml(meta.label)}</b><em>${cleared}/${total}</em><i>${reachable ? (next ? '다음' : '열림') : '잠김'}</i></button>`;
    })
    .filter(Boolean)
    .join('');
  const progressPercent = Math.round((clearCount / Math.max(1, STAGES.length)) * 100);
  const nextMeta = DIFFICULTIES[nextOpen.difficultyKey] || DIFFICULTIES.normal;
  const selectedMeta = DIFFICULTIES[selectedStage?.difficultyKey] || nextMeta;
  el.stageLadderSummary.dataset.stageLadder = STAGE_LADDER_EXPANSION_PATCH;
  el.stageLadderSummary.dataset.stageMapComfort = 'next-goal-v1052-shop-reward';
  el.stageLadderSummary.dataset.legacyStageMapComfort = LEGACY_STAGE_MAP_COMFORT_TOKEN;
  el.stageLadderSummary.innerHTML = `<div class="ladder-progress"><strong>${clearCount}/${STAGES.length}</strong><span>현재 ${selectedIndex + 1}번 · 다음 목표 ${nextOpen.number}번 ${escapeHtml(nextOpen.title)} · ${progressPercent}%</span></div><div class="ladder-path"><span>현재 ${escapeHtml(selectedMeta.label)}</span><i></i><span>다음 ${escapeHtml(nextMeta.label)}</span><em>시즌 ${getSummerSeasonClears()}/${SUMMER_SEASON_EVENT.totalStages}</em></div><div class="ladder-chips">${grouped}</div><p>${nextLocked ? `다음 해금: ${nextLocked.number}번은 이전 스테이지 클리어 후 열립니다.` : '모든 스테이지가 열렸습니다.'}</p>`;
}


function isSummerSeasonStage(stage: any) {
  return stage?.season === SUMMER_SEASON_EVENT.id || Number(stage?.number || 0) >= SUMMER_SEASON_EVENT.startStageNumber;
}

function getSummerSeasonStages() {
  return STAGES.filter((stage: any) => isSummerSeasonStage(stage));
}

function getSummerSeasonClears() {
  return getSummerSeasonStages().filter((stage: any) => state.campaignProgress.cleared[stage.id]).length;
}

function getSummerSeasonNextStage() {
  return getSummerSeasonStages().find((stage: any) => isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id]) || getSummerSeasonStages()[0];
}

function renderSummerSeasonPanel(clearCount = Object.keys(state.campaignProgress.cleared).length) {
  const panel = document.getElementById('summer-season-panel');
  const progress = document.getElementById('summer-season-progress');
  const rewards = document.getElementById('summer-season-rewards');
  if (!panel || !progress || !rewards) return;
  const seasonStages = getSummerSeasonStages();
  const cleared = getSummerSeasonClears();
  const next = getSummerSeasonNextStage();
  const percent = Math.round((cleared / Math.max(1, seasonStages.length)) * 100);
  const nextMilestone = SUMMER_SEASON_EVENT.passMilestones.find((milestone: number) => milestone > cleared) || SUMMER_SEASON_EVENT.totalStages;
  const passLevel = SUMMER_SEASON_EVENT.passMilestones.filter((milestone: number) => cleared >= milestone).length;
  const missionCards = getSummerPassMissionCards(cleared, passLevel, nextMilestone);
  const currentStage = getStageById(state.selectedStageId);
  const currentBonus = getSummerSeasonLiveComboBonus(currentStage);
  panel.dataset.summerSeason = SUMMER_SEASON_PATCH;
  panel.dataset.seasonPass = SUMMER_REWARD_PASS_PATCH;
  panel.dataset.liveBalance = SUMMER_LIVE_BALANCE_PATCH;
  panel.dataset.seasonVfx = SUMMER_EVENT_VFX_PATCH;
  panel.dataset.seasonShop = SUMMER_FINALE_SHOP_PATCH;
  panel.dataset.finaleMissions = SUMMER_FINALE_MISSION_PATCH;
  panel.dataset.designQa = SUMMER_DESIGN_QA_PATCH;
  panel.dataset.passMissions = SUMMER_PASS_MISSIONS_PATCH;
  panel.dataset.shopHistory = SUMMER_SHOP_HISTORY_PATCH;
  panel.dataset.storeCollectionLink = SEASON_STORE_COLLECTION_LINK_PATCH;
  panel.dataset.uiDensityQa = MOBILE_UI_DENSITY_QA_PATCH;
  panel.dataset.engineUpgrade = ENGINE_DESIGN_UPGRADE_PATCH;
  panel.dataset.engineRenderBudget = ENGINE_RENDER_BUDGET_TUNING_PATCH;
  panel.dataset.storeRewardPolish = STORE_REWARD_COLLECTION_POLISH_PATCH;
  panel.dataset.lobbyDensityFinalQa = LOBBY_DENSITY_FINAL_QA_PATCH;
  panel.dataset.touchConflictAudit = TOUCH_CONFLICT_AUDIT_PATCH;
  panel.dataset.rewardDetailShowcase = REWARD_DETAIL_SHOWCASE_PATCH;
  panel.dataset.bossWarningReadability = BOSS_WARNING_READABILITY_PATCH;
  panel.dataset.realDeviceTouchQa = REAL_DEVICE_TOUCH_QA_PATCH;
  panel.dataset.duplicateIdCleanup = DUPLICATE_ID_CLEANUP_PATCH;
  applyAdaptiveVisualBudget();
  panel.dataset.seasonStageCount = String(seasonStages.length);
  panel.querySelector<HTMLElement>('#summer-season-desc')?.replaceChildren(document.createTextNode('\uc2dc\uc98c \uc0c1\uc810 \ubcf4\uc0c1 \ubbf8\ub9ac\ubcf4\uae30, \ub80c\ub354\ub9c1 \uc608\uc0b0, \ubaa8\ubc14\uc77c \ubc00\ub3c4\ub97c \ud568\uaed8 \ub2e4\ub4ec\uc5c8\uc2b5\ub2c8\ub2e4.'));
  progress.innerHTML = `<div><strong>${cleared}/${seasonStages.length}</strong><span>${SUMMER_SEASON_EVENT.title} · 전체 ${clearCount}/${STAGES.length} 클리어 · ${percent}% · 패스 ${passLevel}/${SUMMER_SEASON_EVENT.passMilestones.length}단계</span></div><button type="button" class="season-jump-button" data-stage-id="${next?.id || DEFAULT_STAGE_ID}">다음 시즌 도전</button>`;
  const passTrack = SUMMER_SEASON_EVENT.passMilestones.map((milestone: number, index: number) => {
    const reached = cleared >= milestone;
    const nextGoal = !reached && milestone === nextMilestone;
    return `<span class="season-pass-node ${reached ? 'reached' : ''} ${nextGoal ? 'next' : ''}" data-milestone="${milestone}"><b>${index + 1}</b><em>${milestone}클리어</em><i>${reached ? '수령' : nextGoal ? '다음' : '대기'}</i></span>`;
  }).join('');
  rewards.innerHTML = [
    `<span>난이도별 시즌 콤보 +${currentBonus}초</span>`,
    `<span>시즌 클리어 보상 ${SUMMER_SEASON_EVENT.currencyLabel} +${SUMMER_SEASON_EVENT.clearReward}</span>`,
    `<span>패스 마일스톤마다 ${SUMMER_SEASON_EVENT.passRewardLabel} +1</span>`,
    `<div class="season-pass-track" data-season-pass="${SUMMER_REWARD_PASS_PATCH}" aria-label="썸머 시즌 보상 패스">${passTrack}</div>`,
    `<div class="season-pass-missions" data-pass-missions="${SUMMER_PASS_MISSIONS_PATCH}" aria-label="시즌 패스 미션">${missionCards}</div>`,
    `<div class="season-finale-missions" data-finale-missions="${SUMMER_FINALE_MISSION_PATCH}" aria-label="썸머 피날레 미션">${getSummerFinaleMissionCards(cleared)}</div>`,
    `<div class="season-shop-preview" data-season-shop="${SUMMER_FINALE_SHOP_PATCH}" data-shop-burst="${SUMMER_SHOP_BURST_PATCH}" data-shop-shortcut="${SUMMER_SHOP_SHORTCUT_PATCH}" aria-label="시즌 상점 미리보기">${getSummerShopCards()}</div>`,
    `<div class="season-shop-history" data-shop-history="${SUMMER_SHOP_HISTORY_PATCH}" aria-label="시즌 상점 최근 수령 기록">${getSummerShopHistoryCards()}</div>`,
    `<div class="season-design-audit" data-engine-upgrade="${ENGINE_DESIGN_UPGRADE_PATCH}" data-engine-render-budget="${ENGINE_RENDER_BUDGET_TUNING_PATCH}" data-store-link="${SEASON_STORE_COLLECTION_LINK_PATCH}" data-lobby-density-final-qa="${LOBBY_DENSITY_FINAL_QA_PATCH}" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}" data-real-device-touch-qa="${REAL_DEVICE_TOUCH_QA_PATCH}" aria-label="시즌 디자인 점검"><span>겹침 자동 압축</span><span>상세 쇼케이스</span><span>${renderBudgetText(state.renderBudget.name)}</span></div>`
  ].join('');
}

function getSummerSeasonLiveComboBonus(stage = getStageById(state.selectedStageId)) {
  const key = stage?.difficultyKey || 'normal';
  return SUMMER_SEASON_COMBO_BONUS_BY_DIFFICULTY[key] || SUMMER_SEASON_EVENT.comboBonusSeconds;
}

function getSummerPassMissionCards(cleared: number, passLevel: number, nextMilestone: number) {
  const remaining = Math.max(0, nextMilestone - cleared);
  const next = getSummerSeasonNextStage();
  const bossStagesLeft = getSummerSeasonStages().filter((stage: any) => stage.modifiers?.includes('festivalBoss') && isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id]).length;
  const cards = [
    { title: '패스 목표', desc: remaining > 0 ? `${remaining}개 더 클리어하면 ${SUMMER_SEASON_EVENT.passRewardLabel}` : '모든 패스 보상 달성', tag: `패스 ${passLevel}/${SUMMER_SEASON_EVENT.passMilestones.length}` },
    { title: '콤보 미션', desc: `${SUMMER_SEASON_EVENT.comboEvery}콤보마다 난이도별 추가 시간`, tag: '보너스 시간' },
    { title: '축제 보스', desc: bossStagesLeft > 0 ? `${bossStagesLeft}개 보스 관문 남음` : '시즌 보스 관문 정복', tag: next?.title || '시즌' }
  ];
  return cards.map((card) => `<span class="season-pass-mission"><b>${escapeHtml(card.title)}</b><em>${escapeHtml(card.desc)}</em><i>${escapeHtml(card.tag)}</i></span>`).join('');
}


function getSummerFinaleMissionCards(cleared: number) {
  const finaleStart = SUMMER_SEASON_EVENT.finaleStartStageNumber || 79;
  const finaleStages = STAGES.filter((stage: any) => stage.season === SUMMER_SEASON_EVENT.id && stage.number >= finaleStart);
  const finaleCleared = finaleStages.filter((stage: any) => state.campaignProgress.cleared[stage.id]).length;
  const total = Math.max(1, finaleStages.length);
  const labels = SUMMER_SEASON_EVENT.finaleMissionLabels || ['피날레 입장', '축제 보스 격파', '상점 보상'];
  const cards = [
    { title: labels[0], desc: cleared >= 36 ? '피날레 권역 열림' : `${Math.max(0, 36 - cleared)}개 더 클리어`, tag: `${finaleStart}번부터` },
    { title: labels[1], desc: `${finaleCleared}/${total} 피날레 진행`, tag: '보스 이벤트' },
    { title: labels[2], desc: '햇살 조개와 태양 왕관 교환', tag: '상점 보상' }
  ];
  return cards.map((card) => `<span class="season-finale-card"><b>${escapeHtml(card.title)}</b><em>${escapeHtml(card.desc)}</em><i>${escapeHtml(card.tag)}</i></span>`).join('');
}

function getSummerShopHistoryCards() {
  const history = Array.isArray(state.seasonShopHistory) ? state.seasonShopHistory.slice(0, SUMMER_SHOP_HISTORY_LIMIT) : [];
  if (!history.length) {
    return '<span class="season-shop-history-empty">최근 수령한 시즌 상점 보상이 없습니다.</span>';
  }
  return history.map((entry: any) => {
    const time = entry.time ? new Date(entry.time).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' }) : '최근';
    return `<button type="button" class="season-shop-history-card" data-shop-history-item="${escapeHtml(entry.id || 'reward')}" data-store-link="${SEASON_STORE_COLLECTION_LINK_PATCH}" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>${escapeHtml(entry.title || '시즌 보상')}</b><em>${escapeHtml(entry.rewardLabel || '보상 수령')}</em><i>${escapeHtml(time)}</i><small>상세 보기</small></button>`;
  }).join('');
}

function getSummerShopCards() {
  const items = SUMMER_SEASON_EVENT.shopItems || [];
  return items.map((item: any) => {
    const owned = Number(state.inventory[item.costType] || 0);
    const claimed = Boolean(state.seasonShopClaims[item.id]);
    const affordable = owned >= Number(item.cost || 0);
    const missing = Math.max(0, Number(item.cost || 0) - owned);
    const stateLabel = claimed ? '완료' : affordable ? '수령 가능' : `${missing}개 부족`;
    const stateName = claimed ? 'claimed' : affordable ? 'claimable' : 'locked';
    const ownedBadge = claimed ? '<small class="season-shop-owned">보관함 활성</small>' : '';
    const help = item.sourceHint ? `<small class="season-shop-source">${escapeHtml(item.sourceHint)}</small>` : '';
    const action = affordable && !claimed
      ? `<button type="button" class="season-shop-claim" data-shop-item="${escapeHtml(item.id)}">${stateLabel}</button>`
      : claimed
        ? `<button type="button" class="season-shop-claim" data-shop-item="${escapeHtml(item.id)}" disabled>${stateLabel}</button>`
        : `<button type="button" class="season-shop-earn" data-shop-item="${escapeHtml(item.id)}" data-cost-type="${escapeHtml(item.costType)}">모으러 가기</button>`;
    return `<span class="season-shop-card ${stateName}" data-shop-item="${escapeHtml(item.id)}" data-shop-state="${stateName}" data-shop-polish="${SUMMER_SHOP_BURST_PATCH}" data-store-reward-polish="${STORE_REWARD_COLLECTION_POLISH_PATCH}" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>${escapeHtml(item.title)}</b><em>${escapeHtml(item.costLabel)} · 보유 ${owned}</em><i>${escapeHtml(item.rewardLabel)}</i>${ownedBadge}${help}${getSummerShopCollectionLink(item)}${getSummerShopRewardPreview(item, claimed)}<strong class="season-shop-missing">${claimed ? '수령 완료' : affordable ? '바로 수령 가능' : `${missing}개 더 필요`}</strong>${action}<button type="button" class="season-shop-detail" data-shop-item="${escapeHtml(item.id)}" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}">보상 상세</button></span>`;
  }).join('');
}


function getSummerShopRewardPreview(item: any, claimed = false) {
  const project = getSeasonShopRewardProject(item);
  const amount = Number(item.rewardAmount || 1);
  const title = claimed ? '적용됨' : '미리보기';
  const target = project ? project.label : '컬렉션 보관함';
  return `<small class="season-shop-reward-preview" data-reward-preview="${STORE_REWARD_PREVIEW_LENS_PATCH}" data-store-reward-polish="${STORE_REWARD_COLLECTION_POLISH_PATCH}" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>${title}</b><span>${escapeHtml(target)} · ${escapeHtml(item.rewardLabel)} +${amount}</span></small>`;
}

function getSummerShopCollectionLink(item: any) {
  const project = getSeasonShopRewardProject(item);
  const linkLabel = project ? `복원 연결 · ${project.label}` : '컬렉션 보관함 연결';
  return `<small class="season-shop-collection-link" data-store-link="${SEASON_STORE_COLLECTION_LINK_PATCH}">${escapeHtml(linkLabel)}</small>`;
}

function getSeasonShopRewardProject(item: any) {
  return RESTORATION_PROJECTS.find((project) => project.types.includes(item?.rewardType))
    || RESTORATION_PROJECTS.find((project) => project.types.includes(item?.costType))
    || RESTORATION_PROJECTS.find((project) => project.id === 'summer-festival')
    || RESTORATION_PROJECTS[0];
}

function openSeasonShopRewardDetail(itemId: string) {
  const item = (SUMMER_SEASON_EVENT.shopItems || []).find((entry: any) => entry.id === itemId);
  if (!item) return;
  const project = getSeasonShopRewardProject(item);
  const current = project ? getRestorationCurrent(project) : 0;
  const need = Number(project?.need || 1);
  const ratio = Math.min(100, Math.round((current / need) * 100));
  const owned = Number(state.inventory[item.costType] || 0);
  const cost = Number(item.cost || 0);
  const rewardAmount = Number(item.rewardAmount || 1);
  const claimed = Boolean(state.seasonShopClaims[item.id]);
  const missing = Math.max(0, cost - owned);
  if (project) state.pendingRestorationProjectId = project.id;
  state.collectionFilter = 'owned';
  writeText('dream-library-collection-filter', state.collectionFilter);
  document.body.dataset.storeCollectionLink = SEASON_STORE_COLLECTION_LINK_PATCH;
  document.body.dataset.storeRewardPolish = STORE_REWARD_COLLECTION_POLISH_PATCH;
  document.body.dataset.lobbyDensityFinalQa = LOBBY_DENSITY_FINAL_QA_PATCH;
  document.body.dataset.rewardDetailShowcase = REWARD_DETAIL_SHOWCASE_PATCH;
  document.body.dataset.realDeviceTouchQa = REAL_DEVICE_TOUCH_QA_PATCH;
  renderRestoration();
  renderCollection();
  el.restorationDetailModal.dataset.rewardDetailShowcase = REWARD_DETAIL_SHOWCASE_PATCH;
  el.restorationDetailModal.dataset.detailMode = 'season-shop';
  el.restorationDetailTitle.textContent = `${item.title} 보상 상세`;
  el.restorationDetailMessage.textContent = `${item.rewardLabel} +${rewardAmount} · ${project ? `${project.label} 진행률 ${ratio}%` : '컬렉션 보관함'} · ${claimed ? '이미 수령됨' : missing > 0 ? `${missing}개 더 필요` : '수령 가능'}`;
  el.restorationDetailItems.innerHTML = [
    `<span class="detail-item reward-showcase-main" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>보상</b><strong>${escapeHtml(item.rewardLabel)} +${rewardAmount}</strong><em>${escapeHtml(project?.label || '컬렉션 보관함')}</em></span>`,
    `<span class="detail-item reward-showcase-cost" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>필요 재화</b><strong>${escapeHtml(item.costLabel || item.costType)} · ${owned}/${cost}</strong><em>${claimed ? '보관함 활성' : missing > 0 ? `${missing}개 부족` : '바로 수령 가능'}</em></span>`,
    `<span class="detail-item reward-showcase-link" data-reward-detail-showcase="${REWARD_DETAIL_SHOWCASE_PATCH}"><b>연결</b><strong>${escapeHtml(project?.label || '컬렉션')}</strong><em>${project ? `복원 ${current}/${need}` : '수집 보관함에서 확인'}</em></span>`
  ].join('');
  (el.restorationDetailFocusButton as HTMLButtonElement).disabled = false;
  el.restorationDetailFocusButton.textContent = project ? '복원으로 보기' : '컬렉션 보기';
  el.restorationDetailModal.classList.remove('hidden');
  setStatus(`${item.title} 보상 상세를 열었습니다.`);
}

function claimSummerShopItem(itemId: string) {
  const item = (SUMMER_SEASON_EVENT.shopItems || []).find((entry: any) => entry.id === itemId);
  if (!item) return;
  if (state.seasonShopClaims[item.id]) {
    setStatus('이미 수령한 시즌 상점 보상입니다.');
    return;
  }
  const owned = Number(state.inventory[item.costType] || 0);
  const cost = Number(item.cost || 0);
  if (owned < cost) {
    setStatus(`${item.title} 수령까지 ${cost - owned}개 더 필요합니다.`);
    return;
  }
  state.inventory[item.costType] = owned - cost;
  state.inventory[item.rewardType] = Number(state.inventory[item.rewardType] || 0) + Number(item.rewardAmount || 1);
  state.seasonShopClaims[item.id] = true;
  addSeasonShopHistory(item);
  writeJson('dream-library-inventory', state.inventory);
  writeJson('dream-library-season-shop-claims', state.seasonShopClaims);
  writeJson('dream-library-season-shop-history', state.seasonShopHistory);
  audio.play('clear');
  HAPTIC.combo();
  playSeasonShopClaimBurst(item);
  renderLobby();
  renderStats();
  setStatus(`${item.title} 수령 완료 · ${item.rewardLabel}`);
}

function addSeasonShopHistory(item: any) {
  const entry = {
    id: item.id,
    title: item.title,
    rewardLabel: item.rewardLabel,
    rewardType: item.rewardType,
    time: Date.now()
  };
  const previous = Array.isArray(state.seasonShopHistory) ? state.seasonShopHistory : [];
  state.seasonShopHistory = [entry, ...previous.filter((historyItem: any) => historyItem.id !== item.id)].slice(0, SUMMER_SHOP_HISTORY_LIMIT);
}

function getRecentSeasonShopHistoryId() {
  const history = Array.isArray(state.seasonShopHistory) ? state.seasonShopHistory : [];
  return history[0]?.id || '';
}

function getSeasonClaimVisualState() {
  if (state.inventory['summer-finale-cutin']) return 'finale-cutin-owned';
  if (state.inventory['summer-crown-frame']) return 'crown-frame-owned';
  if (Object.keys(state.seasonShopClaims || {}).length) return 'store-reward-owned';
  return 'none';
}

function playSeasonShopClaimBurst(item: any) {
  const compactBurst = state.renderBudget?.name === 'lite';
  document.body.dataset.seasonShopBurst = SUMMER_SHOP_BURST_PATCH;
  document.body.dataset.storeRewardPolish = STORE_REWARD_COLLECTION_POLISH_PATCH;
  document.body.dataset.engineRenderBudget = ENGINE_RENDER_BUDGET_TUNING_PATCH;
  const panel = document.getElementById('summer-season-panel');
  panel?.setAttribute('data-shop-burst-active', 'true');
  el.bossHitCutin.dataset.visualPriority = 'store-reward';
  el.bossHitCutin.dataset.seasonShopBurst = SUMMER_SHOP_BURST_PATCH;
  el.bossHitCutin.textContent = `상점 보상 수령 · ${item.title}`;
  el.bossHitCutin.classList.remove('hidden', 'boss-hit-pop', 'boss-break-pop', 'boss-finisher-pop', 'season-shop-burst-pop');
  void el.bossHitCutin.offsetWidth;
  el.bossHitCutin.classList.add('season-shop-burst-pop', 'boss-hit-pop');
  window.setTimeout(() => {
    el.bossHitCutin.classList.add('hidden');
    panel?.removeAttribute('data-shop-burst-active');
  }, compactBurst ? 720 : 980);
}

function focusSummerShopMaterial(itemId: string, costType: string) {
  const item = (SUMMER_SEASON_EVENT.shopItems || []).find((entry: any) => entry.id === itemId);
  const next = getSummerSeasonStages().find((stage: any) => isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id] && stage.reward?.type === costType)
    || getSummerSeasonNextStage()
    || getStageById(DEFAULT_STAGE_ID);
  state.selectedStageId = next.id;
  state.selectedChapterId = next.chapterId;
  writeText('dream-library-selected-stage', next.id);
  writeText('dream-library-selected-chapter', next.chapterId);
  document.body.dataset.seasonShopShortcut = SUMMER_SHOP_SHORTCUT_PATCH;
  document.body.dataset.lobbyDragRescue = LOBBY_DRAG_DEEP_RESCUE_PATCH;
  renderLobby();
  window.setTimeout(() => focusSelectedChapterTab(), 40);
  setStatus(`${item?.title || '시즌 상점'} 재화를 모을 수 있는 스테이지로 이동했습니다.`);
}

function getSummerModifierVfxLabels(modifiers: string[] = []) {
  const labels: Record<string, string> = { sunTide: '햇살 파도 VFX', pearlChain: '진주 연쇄 VFX', festivalBoss: '축제 보스 장식' };
  return modifiers.filter((modifier) => labels[modifier]).map((modifier) => labels[modifier]);
}

function getSummerSeasonPassRewardForClears(clears: number) {
  const milestone = SUMMER_SEASON_EVENT.passMilestones.find((item: number) => item === clears);
  if (!milestone) return null;
  return { label: SUMMER_SEASON_EVENT.passRewardLabel, type: SUMMER_SEASON_EVENT.passRewardType, amount: 1, milestone };
}

function grantSummerSeasonComboBonus(stage = getStageById(state.selectedStageId)) {
  if (!isSummerSeasonStage(stage) || state.combo <= 0 || state.combo % SUMMER_SEASON_EVENT.comboEvery !== 0) return false;
  const bonusSeconds = getSummerSeasonLiveComboBonus(stage);
  state.remainingSeconds += bonusSeconds;
  state.score += 160 + (state.combo * 14) + (bonusSeconds * 10);
  const battleStage = document.querySelector<HTMLElement>('.battle-stage');
  battleStage?.setAttribute('data-summer-combo-bonus', SUMMER_SEASON_PATCH);
  battleStage?.setAttribute('data-summer-live-balance', SUMMER_LIVE_BALANCE_PATCH);
  el.timeLabel.dataset.seasonBonus = `+${bonusSeconds}초`;
  el.timeLabel.classList.remove('time-bonus-pop');
  void el.timeLabel.offsetWidth;
  el.timeLabel.classList.add('time-bonus-pop');
  audio.play('combo');
  HAPTIC.combo();
  setStatus(`한여름 축제 공명 · ${SUMMER_SEASON_EVENT.comboEvery}콤보 보너스 +${bonusSeconds}초`);
  return true;
}

function syncLobbyMotion(clearCount: number, stageId: string) {
  const mood = clearCount >= 8 ? 'radiant' : clearCount >= 3 ? 'active' : 'welcome';
  document.body.dataset.lobbyMood = mood;
  if (el.lobbyHeroImage) {
    const useCompanion = mood !== 'welcome' || stageId.includes('cloud') || stageId.includes('star');
    el.lobbyHeroImage.src = `${import.meta.env.BASE_URL}assets/characters/${useCompanion ? 'mascot-companions-v2' : 'mascot-scholar-v2'}.png`;
    el.lobbyHeroImage.dataset.mood = mood;
  }
}


function renderLobbyMissionDeck(forcePulse = false) {
  const cards = getLobbyMissionCards();
  el.lobbyMissionDeck.innerHTML = cards.map((card) => `
    <button type="button" class="mission-card ${card.accent}${forcePulse ? ' deck-pulse' : ''}" data-mission-type="${card.type}" data-stage-id="${card.stageId || ''}" data-restore-id="${card.restoreId || ''}" data-filter="${card.filter || ''}" data-ready="${card.ready ? 'true' : 'false'}">
      <span class="mission-card-badge">${card.badge}</span>
      <strong>${escapeHtml(card.title)}</strong>
      <small>${escapeHtml(card.desc)}</small>
      <em>${escapeHtml(card.cta)}</em>
    </button>`).join('');
}

function getLobbyMissionCards() {
  const nextStage = STAGES.find((stage: any) => isStageUnlocked(stage.id) && !state.campaignProgress.cleared[stage.id]) || getStageById(state.selectedStageId);
  const dailyStage = getStageById(state.dailyChallenge.stageId);
  const readyProject = RESTORATION_PROJECTS.find((project) => canCompleteRestoration(project) && !state.restorationCompleted[project.id]);
  const focusProject = RESTORATION_PROJECTS.find((project) => project.id === state.restorationFocus) || RESTORATION_PROJECTS[0];
  const targetProject = readyProject || focusProject;
  const missingPremium = TILE_SET.find((tile: any) => tile.theme === '프리미엄' && Number(state.inventory[tile.type] || 0) <= 0);
  const ownedCount = TILE_SET.filter((tile: any) => Number(state.inventory[tile.type] || 0) > 0).length;
  const cards = [
    {
      type: 'campaign',
      stageId: nextStage.id,
      accent: 'gold',
      badge: '추천 스테이지',
      title: `${nextStage.number}. ${nextStage.title}`,
      desc: `${DIFFICULTIES[nextStage.difficultyKey].label} · ${getBossForStage(nextStage).name}`,
      cta: `${nextStage.reward.label} ×${nextStage.reward.amount}`,
      ready: true
    },
    {
      type: 'daily',
      stageId: dailyStage.id,
      accent: 'emerald',
      badge: '오늘의 복원',
      title: dailyStage.title,
      desc: `${state.dailyChallenge.label} · ${state.dailyChallenge.rewardLabel}`,
      cta: state.dailyChallenge.rewardLabel,
      ready: true
    },
    {
      type: 'restoration',
      restoreId: targetProject.id,
      accent: readyProject ? 'sky' : 'violet',
      badge: readyProject ? '복원 가능' : '집중 복원',
      title: targetProject.label,
      desc: `${getRestorationCurrent(targetProject)}/${targetProject.need} · ${targetProject.reward}`,
      cta: readyProject ? '완료 보상 수령' : `${getRestorationCurrent(targetProject)}/${targetProject.need} 필요`,
      ready: Boolean(readyProject)
    },
    {
      type: 'collection',
      filter: missingPremium ? 'premium' : 'missing',
      accent: 'violet',
      badge: '컬렉션 목표',
      title: missingPremium ? missingPremium.label : '미수집 오브젝트',
      desc: `${ownedCount}/${TILE_SET.length} 수집 · 도감 정리`,
      cta: missingPremium ? '프리미엄 수집' : '미수집 확인',
      ready: !missingPremium
    }
  ];
  return cards;
}

function handleLobbyMissionClick(event: Event) {
  const card = (event.target as HTMLElement).closest<HTMLElement>('[data-mission-type]');
  if (!card) return;
  const type = card.dataset.missionType || '';
  audio.play('select');
  HAPTIC.select();
  if (type === 'campaign') {
    const stageId = card.dataset.stageId || DEFAULT_STAGE_ID;
    const stage = getStageById(stageId);
    state.selectedStageId = stage.id;
    state.selectedChapterId = stage.chapterId;
    writeText('dream-library-selected-stage', stage.id);
    writeText('dream-library-selected-chapter', stage.chapterId);
    renderLobby();
    scrollLobbyTarget('.selected-stage-card');
    setStatus('추천 스테이지를 선택했습니다. 진짜 게임 시작을 누르면 전투가 시작됩니다.');
    return;
  }
  if (type === 'daily') {
    startDailyStage();
    return;
  }
  if (type === 'restoration') {
    openRestorationDetail(card.dataset.restoreId || state.restorationFocus || 'shelf');
    return;
  }
  if (type === 'collection') {
    state.collectionFilter = card.dataset.filter || 'missing';
    writeText('dream-library-collection-filter', state.collectionFilter);
    renderCollection();
    scrollLobbyTarget('.collection-panel');
    setStatus('컬렉션 도감 목표를 열었습니다. 미수집/프리미엄 오브젝트를 확인하세요.');
  }
}


const LOBBY_MENU_TITLES: Record<string, { title: string; subtitle: string }> = {
  campaign: { title: '스테이지 월드맵', subtitle: '챕터와 스테이지를 크게 열어 고르고 바로 시작합니다.' },
  mission: { title: '오늘 먼저 할 일', subtitle: '추천 미션과 다음 행동을 한눈에 확인합니다.' },
  restoration: { title: '서고 복원 작업대', subtitle: '보상 재료와 완료 가능한 복원 프로젝트를 확인합니다.' },
  daily: { title: '오늘의 복원', subtitle: '일일 보상, 랭킹, 오늘 스테이지를 확인합니다.' },
  collection: { title: '기억 오브젝트 도감', subtitle: '보유/미수집/프리미엄 수집품을 분리해서 봅니다.' },
  summer: { title: '시즌 상점 보상', subtitle: '시즌 보상 상세와 재화 목표를 확인합니다.' },
  progress: { title: '내 진행과 복원 기록', subtitle: '최고 점수, 별 조각, 복원 기록을 확인합니다.' }
};

function normalizeLobbyPanelKey(key: string) {
  if (key === 'stage' || key === 'selected') return 'campaign';
  if (key === 'shop' || key === 'season') return 'summer';
  if (key === 'rank' || key === 'leaderboard') return 'progress';
  return LOBBY_MENU_TITLES[key] ? key : 'campaign';
}

function syncLobbyMenuPortal() {
  const tight = window.innerWidth <= 430 || window.innerHeight <= 720;
  document.body.dataset.lobbyMenuPortal = LOBBY_MENU_PORTAL_PATCH;
  document.body.dataset.lobbyScrollRestructure = SECTION_POPUP_RESTRUCTURE_PATCH;
  document.body.dataset.roundedContentReadable = ROUNDED_CARD_CONTENT_READABILITY_PATCH;
  document.body.dataset.lobbyMenuMotionState = LOBBY_MENU_MOTION_STATE_PATCH;
  document.body.dataset.lobbyPanelStateRetention = LOBBY_PANEL_STATE_RETENTION_PATCH;
  document.body.classList.toggle('lobby-menu-tight', tight);
  el.lobbyMenuHub?.setAttribute('data-lobby-menu-portal', LOBBY_MENU_PORTAL_PATCH);
  el.lobbyMenuHub?.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);
  el.lobbyMenuOverlay?.setAttribute('data-lobby-menu-portal', LOBBY_MENU_PORTAL_PATCH);
  el.lobbyMenuOverlay?.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);
  el.lobbyMenuOverlay?.setAttribute('data-lobby-menu-back-close', LOBBY_MENU_BACK_CLOSE_PATCH);
  el.lobbyPanelDock?.setAttribute('data-lobby-menu-portal', LOBBY_MENU_PORTAL_PATCH);
  el.lobbyPanelDock?.setAttribute('data-lobby-panel-state-retention', LOBBY_PANEL_STATE_RETENTION_PATCH);
  el.lobbyMenuTabs?.setAttribute('data-lobby-menu-tab-switch', LOBBY_MENU_TAB_SWITCH_PATCH);
  document.querySelectorAll<HTMLElement>('[data-lobby-menu-open]').forEach((button) => {
    const key = normalizeLobbyPanelKey(button.dataset.lobbyMenuOpen || 'campaign');
    const selected = key === state.activeLobbyPanel && document.body.classList.contains('lobby-menu-open');
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', selected ? 'true' : 'false');
    button.setAttribute('data-lobby-menu-portal', LOBBY_MENU_PORTAL_PATCH);
    button.setAttribute('data-lobby-menu-motion-state', LOBBY_MENU_MOTION_STATE_PATCH);
  });
  document.querySelectorAll<HTMLElement>('[data-lobby-menu-tab]').forEach((button) => {
    const key = normalizeLobbyPanelKey(button.dataset.lobbyMenuTab || 'campaign');
    const selected = key === state.activeLobbyPanel && document.body.classList.contains('lobby-menu-open');
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-current', selected ? 'page' : 'false');
    button.setAttribute('data-lobby-menu-tab-switch', LOBBY_MENU_TAB_SWITCH_PATCH);
  });
  document.querySelectorAll<HTMLElement>('[data-lobby-panel]').forEach((panel) => {
    const key = normalizeLobbyPanelKey(panel.dataset.lobbyPanel || 'campaign');
    const active = key === state.activeLobbyPanel;
    panel.setAttribute('data-lobby-menu-portal', LOBBY_MENU_PORTAL_PATCH);
    panel.setAttribute('data-lobby-panel-state-retention', LOBBY_PANEL_STATE_RETENTION_PATCH);
    panel.classList.toggle('lobby-menu-panel-active', active);
    if (document.body.classList.contains('lobby-menu-open')) panel.classList.remove('collapsed');
    panel.setAttribute('aria-hidden', document.body.classList.contains('lobby-menu-open') && active ? 'false' : 'true');
  });
  document.querySelectorAll<HTMLElement>('.reward-restoration-bridge, .restoration-detail-card, .reward-card').forEach((node) => {
    node.setAttribute('data-rounded-content-readable', ROUNDED_CARD_CONTENT_READABILITY_PATCH);
  });
}

function openLobbyMenuPanel(panelKey = 'campaign', trigger?: HTMLElement | null, options: { keepFocus?: boolean } = {}) {
  const key = normalizeLobbyPanelKey(panelKey);
  state.activeLobbyPanel = key;
  state.lobbyMenuOpenCount += 1;
  if (trigger && !trigger.closest('#lobby-menu-tabs')) state.lastLobbyMenuTrigger = trigger;
  writeText(ACTIVE_LOBBY_PANEL_KEY, key);
  const meta = LOBBY_MENU_TITLES[key];
  el.lobbyMenuTitle.textContent = meta.title;
  el.lobbyMenuSubtitle.textContent = meta.subtitle;
  el.lobbyMenuOverlay.classList.remove('hidden', 'closing');
  el.lobbyMenuOverlay.classList.add('opening');
  el.lobbyMenuOverlay.dataset.lobbyMenuMotionState = LOBBY_MENU_MOTION_STATE_PATCH;
  el.lobbyMenuOverlay.dataset.lobbyMenuBackClose = LOBBY_MENU_BACK_CLOSE_PATCH;
  el.lobbyMenuOverlay.dataset.lobbyPanelStateRetention = LOBBY_PANEL_STATE_RETENTION_PATCH;
  document.body.classList.add('lobby-menu-open');
  document.body.dataset.activeLobbyPanel = key;
  syncLobbyMenuPortal();
  window.setTimeout(() => {
    el.lobbyMenuOverlay.classList.remove('opening');
    const panel = document.querySelector<HTMLElement>(`[data-lobby-panel="${key}"]`);
    panel?.scrollIntoView({ block: 'start', behavior: 'auto' });
    if (!options.keepFocus) el.lobbyMenuCloseButton?.focus({ preventScroll: true });
  }, 20);
}

function closeLobbyMenuPanel(options: { returnFocus?: boolean; silent?: boolean } = {}) {
  if (!el.lobbyMenuOverlay || el.lobbyMenuOverlay.classList.contains('hidden')) {
    document.body.classList.remove('lobby-menu-open');
    syncLobbyMenuPortal();
    return;
  }
  el.lobbyMenuOverlay.dataset.lobbyMenuBackClose = LOBBY_MENU_BACK_CLOSE_PATCH;
  el.lobbyMenuOverlay.classList.remove('opening');
  el.lobbyMenuOverlay.classList.add('closing');
  document.body.classList.remove('lobby-menu-open');
  syncLobbyMenuPortal();
  const finish = () => {
    el.lobbyMenuOverlay?.classList.add('hidden');
    el.lobbyMenuOverlay?.classList.remove('closing');
    if (options.returnFocus && state.lastLobbyMenuTrigger) state.lastLobbyMenuTrigger.focus({ preventScroll: true });
  };
  if (options.silent || window.matchMedia('(prefers-reduced-motion: reduce)').matches) finish();
  else window.setTimeout(finish, 150);
}

function getLobbyPanelKeyForSelector(selector: string) {
  if (selector.includes('restoration')) return 'restoration';
  if (selector.includes('collection')) return 'collection';
  if (selector.includes('daily')) return 'daily';
  if (selector.includes('summer') || selector.includes('season')) return 'summer';
  if (selector.includes('mission')) return 'mission';
  if (selector.includes('leaderboard') || selector.includes('lobby-grid') || selector.includes('progress')) return 'progress';
  if (selector.includes('selected-stage') || selector.includes('chapter') || selector.includes('world-map')) return 'campaign';
  return '';
}

function scrollLobbyTarget(selector: string) {
  const panelKey = getLobbyPanelKeyForSelector(selector);
  if (panelKey && state.screen === 'lobby') openLobbyMenuPanel(panelKey);
  const target = document.querySelector<HTMLElement>(selector);
  const shell = document.body.classList.contains('lobby-menu-open')
    ? el.lobbyPanelDock
    : (el.app?.closest<HTMLElement>('.app-shell') || document.querySelector<HTMLElement>('.app-shell'));
  if (!target || !shell) return;
  const shellRect = shell.getBoundingClientRect();
  const targetRect = target.getBoundingClientRect();
  const current = shell.scrollTop;
  const next = current + targetRect.top - shellRect.top - 12;
  shell.scrollTo({ top: Math.max(0, next), behavior: 'auto' });
}

function toggleLobbyPanel(panelKey: string) {
  if (!panelKey) return;
  if (document.body.classList.contains('lobby-menu-open')) { closeLobbyMenuPanel(); return; }
  state.collapsedPanels[panelKey] = !state.collapsedPanels[panelKey];
  writeJson('dream-library-lobby-collapsed-panels', state.collapsedPanels);
  renderLobbyPanelState();
}

function renderLobbyPanelState() {
  document.querySelectorAll<HTMLElement>('[data-lobby-panel]').forEach((panel) => {
    const key = panel.dataset.lobbyPanel || '';
    const collapsed = Boolean(state.collapsedPanels[key]);
    panel.classList.toggle('collapsed', collapsed);
    panel.querySelectorAll<HTMLElement>('[data-collapse-target]').forEach((button) => {
      if (button.dataset.collapseTarget === key) button.textContent = document.body.classList.contains('lobby-menu-open') ? '닫기' : (collapsed ? '펼치기' : '접기');
    });
  });
}


function selectChapter(chapterId: string) {
  const stages = getChapterStages(chapterId);
  if (!stages.length) return;
  state.selectedChapterId = chapterId;
  writeText('dream-library-selected-chapter', chapterId);
  const current = getStageById(state.selectedStageId);
  if (current.chapterId !== chapterId) {
    const firstUnlocked = stages.find((stage: any) => isStageUnlocked(stage.id));
    state.selectedStageId = (firstUnlocked || stages[0]).id;
    writeText('dream-library-selected-stage', state.selectedStageId);
  }
  renderLobby();
}

function renderChapterTabs() {
  el.chapterTabs.dataset.compactCarousel = SUMMER_COMPACT_CAROUSEL_PATCH;
  el.chapterTabs.setAttribute('aria-label', '챕터 선택 · compact carousel');
  el.chapterTabs.innerHTML = CHAPTERS.map((chapter: any) => {
    const stages = getChapterStages(chapter.id);
    const cleared = stages.filter((stage: any) => state.campaignProgress.cleared[stage.id]).length;
    const hasUnlocked = stages.some((stage: any) => isStageUnlocked(stage.id));
    const isSeason = chapter.season === SUMMER_SEASON_EVENT.id || stages.some((stage: any) => isSummerSeasonStage(stage));
    return `<button type="button" class="chapter-tab ${chapter.id === state.selectedChapterId ? 'selected' : ''} ${hasUnlocked ? 'unlocked' : 'locked'} ${isSeason ? 'season-tab' : ''}" data-chapter-id="${chapter.id}" data-season-tab="${isSeason ? 'summer' : 'base'}"><strong>${chapter.shortTitle}</strong><span>${cleared}/${stages.length}</span></button>`;
  }).join('');
  requestAnimationFrame(() => focusSelectedChapterTab());
}

function focusSelectedChapterTab() {
  const selected = el.chapterTabs.querySelector<HTMLElement>('.chapter-tab.selected');
  if (!selected) return;
  selected.scrollIntoView({ behavior: 'auto', inline: 'center', block: 'nearest' });
  el.chapterTabs.dataset.autoFocus = 'current-chapter-v1052';
}

function renderBossPanel() {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  setBossStableImage(boss.asset, boss.name);
  el.bossCore.dataset.bossAssetGuard = 'stable-fallback';
  el.bossCore.dataset.bossVisualStack = BOSS_VISUAL_STACK_PATCH;
  const bossLane = document.querySelector<HTMLElement>('.boss-lane');
  bossLane?.setAttribute('data-boss-layout', 'statusbar-icon-right-v1046');
  bossLane?.setAttribute('data-boss-season-polish', BOSS_SEASON_POLISH_PATCH);
  bossLane?.setAttribute('data-engine-render-budget', ENGINE_RENDER_BUDGET_TUNING_PATCH);
  bossLane?.setAttribute('data-boss-warning-readability', BOSS_WARNING_READABILITY_PATCH);
  bossLane?.setAttribute('data-boss-attack-readability', BOSS_ATTACK_READABILITY_PATCH);
  bossLane?.setAttribute('data-season-claim-visual', getSeasonClaimVisualState());
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-stage-ladder', STAGE_LADDER_EXPANSION_PATCH);
  el.bossName.textContent = boss.name;
  const role = getBossReadableRole(boss);
  el.bossPattern.textContent = role.pattern;
  el.bossPattern.title = role.title;
  el.bossRoleHelp.textContent = role.help;
  el.bossTelegraph.textContent = `${boss.telegraphTitle || '반격 예고'} · ${boss.telegraphLine || boss.attackLine || '연결을 이어가세요.'}`;
  el.bossTelegraph.classList.add('hidden');
  syncBossAttackPreview('idle');
  el.bossCore.dataset.bossId = boss.id;
  el.bossCore.dataset.phase = 'stable';
  el.bossCore.dataset.bossFrame = 'idle';
  el.bossCore.dataset.bossAtlasFrame = boss.atlasFrames?.idle || '';
  applyBossAtlasFrame(boss.atlasFrames?.idle || '');
  renderer.syncPixiBossLayer(boss.atlasFrames?.idle || '', 'idle');
  showBossRolePulseOnce();
}

function getBossReadableRole(boss: any) {
  const bonus = getPairMatchTimeBonus();
  const base = {
    pattern: '보스 상태 · HP/압박/반격',
    title: '오른쪽 작은 보스 아이콘은 현재 상대와 위험도를 표시합니다. HP와 반격 예고를 같이 확인하세요.',
    help: `오른쪽 보스 아이콘은 현재 상대입니다. 멈추거나 실수하면 압박하고, 짝을 맞추면 HP가 줄고 +${bonus}초를 얻습니다.`
  };
  if (boss?.id === 'shadow-librarian') {
    return { ...base, pattern: '보스 상태 · 빠른 실수 반격', help: `그림자 장서관장은 실수에 빠르게 반응합니다. 연속 매칭으로 반격 예고를 끊고 +${bonus}초를 챙기세요.` };
  }
  if (boss?.id === 'sealed-page-golem') {
    return { ...base, pattern: '보스 상태 · 묵직한 시간 압박', help: `페이지 골렘은 느리지만 강하게 압박합니다. 멈추지 말고 한 쌍씩 +${bonus}초를 회복하세요.` };
  }
  return base;
}

function showBossRolePulseOnce() {
  const seen = readText('dream-library-boss-role-help-seen') === '1';
  const stage = document.querySelector<HTMLElement>('.battle-stage');
  if (!stage || seen) return;
  stage.dataset.bossRoleTutorial = 'v1053-statusbar-claim-history';
  writeText('dream-library-boss-role-help-seen', '1');
  window.setTimeout(() => {
    if (stage.dataset.bossRoleTutorial === 'v1053-statusbar-claim-history') delete stage.dataset.bossRoleTutorial;
  }, 4200);
}

function setBossStableImage(src = BOSS_IMAGE_FALLBACK_SRC, alt = '망각의 서고령') {
  el.bossImage.alt = alt;
  el.bossImage.dataset.bossImgGuard = 'stable';
  el.bossImage.dataset.bossAssetPolish = 'v1040-stable-visible';
  el.bossImage.onerror = () => {
    el.bossImage.onerror = null;
    el.bossImage.src = BOSS_IMAGE_FALLBACK_SRC;
    el.bossCore.classList.remove('boss-atlas-ready');
    el.bossCore.dataset.bossAtlasReady = 'fallback';
    el.bossCore.dataset.bossAssetGuard = 'fallback-image-visible';
  };
  if (!el.bossImage.src.endsWith(src)) el.bossImage.src = src;
  el.bossCore.dataset.bossImageSrc = src;
}

function applyBossAtlasFrame(frameKey = '') {
  const frame = getBossAtlasFrame(frameKey);
  if (!frame || !bossAtlasImageReady) {
    el.bossCore.classList.remove('boss-atlas-ready');
    el.bossAtlasSprite?.removeAttribute('style');
    el.bossCore.dataset.bossAtlasReady = bossAtlasImageReady ? 'missing-frame' : 'fallback';
    return;
  }
  const coreSize = Math.max(44, el.bossCore.clientWidth || 64);
  const scale = Math.min(0.38, Math.max(0.2, (coreSize * 1.48) / Math.max(frame.w, frame.h))); // v1.0.40: keep atlas overlay behind stable monster art
  el.bossCore.classList.add('boss-atlas-ready');
  el.bossCore.dataset.bossVisualStack = BOSS_VISUAL_STACK_PATCH;
  el.bossCore.style.setProperty('--boss-frame-w', `${frame.w}px`);
  el.bossCore.style.setProperty('--boss-frame-h', `${frame.h}px`);
  el.bossCore.style.setProperty('--boss-frame-x', `-${frame.x}px`);
  el.bossCore.style.setProperty('--boss-frame-y', `-${frame.y}px`);
  el.bossCore.style.setProperty('--boss-frame-scale', `${scale}`);
  el.bossCore.dataset.bossAtlasReady = 'true';
}

function setBossFrame(stateName: 'idle' | 'warn' | 'hit' | 'break' = 'idle') {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  const src = boss.asset || BOSS_IMAGE_FALLBACK_SRC;
  const atlasFrame = boss.atlasFrames?.[stateName] || boss.atlasFrames?.idle || '';
  el.bossCore.dataset.bossFrame = stateName;
  el.bossCore.dataset.bossAtlasFrame = atlasFrame;
  applyBossAtlasFrame(atlasFrame);
  renderer.syncPixiBossLayer(atlasFrame, stateName);
  setBossStableImage(src, boss.name);
  if (stateName !== 'idle') {
    window.setTimeout(() => {
      const idle = boss.asset || BOSS_IMAGE_FALLBACK_SRC;
      const idleAtlasFrame = boss.atlasFrames?.idle || '';
      el.bossCore.dataset.bossFrame = 'idle';
      el.bossCore.dataset.bossAtlasFrame = idleAtlasFrame;
      applyBossAtlasFrame(idleAtlasFrame);
      renderer.syncPixiBossLayer(idleAtlasFrame, 'idle');
      setBossStableImage(idle, boss.name);
    }, stateName === 'break' ? 680 : 420);
  }
}

function renderStats() {
  el.bestScoreLabel.textContent = formatNumber(state.localStats.bestScore || 0);
  el.clearCountLabel.textContent = formatNumber(state.localStats.clearCount || 0);
  const stars = Object.values(state.campaignProgress.cleared).reduce((sum: number, clear: any) => sum + (clear.stars || 0), 0);
  el.starCountLabel.textContent = formatNumber(stars);
}

function getHudDensity(): 'normal' | 'compact' | 'micro' {
  const width = window.innerWidth || document.documentElement.clientWidth || 390;
  const height = window.innerHeight || document.documentElement.clientHeight || 740;
  if (height <= 660 || width <= 360) return 'micro';
  if (height <= 760 || width <= 390) return 'compact';
  return 'normal';
}

function renderGameHud() {
  const stage = getStageById(state.selectedStageId);
  const chapter = getChapterById(stage.chapterId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  el.stageLabel.textContent = `${chapter.shortTitle} · Stage ${stage.number}`;
  el.difficultyTitle.textContent = difficulty.label;
  el.timeLabel.textContent = formatTime(state.remainingSeconds);
  const tempo = getDifficultyTempoProfile(stage);
  const matchBonus = getPairMatchTimeBonus(stage);
  el.timeLabel.title = `짝 맞춤 보너스 +${matchBonus}초 · ${tempo.pressure} 압박 · 누적 +${state.pairTimeBonusTotal}초`;
  el.timeLabel.dataset.timeBonusTotal = String(state.pairTimeBonusTotal);
  el.timeLabel.dataset.matchBonus = String(matchBonus);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-difficulty-tempo', `${stage.difficultyKey}-${tempo.pressure}`);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-difficulty-tempo-patch', DIFFICULTY_TEMPO_PATCH);
  document.querySelector<HTMLElement>('.time-meter')?.setAttribute('data-match-bonus-label', `${matchBonus}초`);
  el.scoreLabel.textContent = formatNumber(state.score);
  el.comboLabel.textContent = `${state.combo}`;
  el.movesLabel.textContent = `${state.moves}`;
  updateMissionLabel();
  state.hudDensity = getHudDensity();
  el.app.dataset.hudDensity = state.hudDensity;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-real-device-qa', 'touch-precision-readability');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-engine-upgrade', ENGINE_DESIGN_UPGRADE_PATCH);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-engine-render-budget', ENGINE_RENDER_BUDGET_TUNING_PATCH);
  document.querySelector<HTMLElement>('.screen-game')?.setAttribute('data-hud-density', state.hudDensity);
  document.querySelector<HTMLElement>('.game-hud')?.setAttribute('data-hud-density', state.hudDensity);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-hud-density', state.hudDensity);
  renderBoardCameraGuide(difficulty);
}

function renderBoardCameraGuide(difficultyOverride?: any) {
  const difficulty = difficultyOverride || DIFFICULTIES[getStageById(state.selectedStageId).difficultyKey];
  const panZoom = difficulty?.cameraMode === 'panZoom' || Number(difficulty?.rows || 0) * Number(difficulty?.cols || 0) > 72;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-board-camera', panZoom ? 'pan-zoom' : 'fit');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-camera-ui', 'space-reclaimed');
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-space-polish', 'v1037');
  if (el.boardCameraGuide) {
    el.boardCameraGuide.textContent = '';
    el.boardCameraGuide.classList.add('hidden');
    el.boardCameraGuide.classList.remove('camera-tutorial');
    el.boardCameraGuide.setAttribute('aria-hidden', 'true');
  }
  if (el.boardCameraControls) {
    el.boardCameraControls.innerHTML = '';
    el.boardCameraControls.classList.add('hidden');
    el.boardCameraControls.setAttribute('aria-hidden', 'true');
  }
}


function updateMissionLabel() {
  const stage = getStageById(state.selectedStageId);
  const difficulty = DIFFICULTIES[stage.difficultyKey];
  const remaining = state.board.length ? countRemaining(state.board) : difficulty.rows * difficulty.cols;
  const comboTargets: Record<string, number> = { beginner: 2, easy: 3, normal: 4, skilled: 5, hard: 6, nightmare: 7, expert: 7 };
  const targetCombo = comboTargets[difficulty.key] || 4;
  const bossTags = getBossStageTags(stage);
  el.missionLabel.textContent = `남은 오브젝트 ${remaining}개 · ${targetCombo}콤보 · ${bossTags[0] || '보스전'}`;
}


function renderModifierStrip(modifiers: string[]) {
  const labels: Record<string, string> = {
    fog: '안개 타일',
    locked: '잠긴 타일',
    timeSeal: '시간 봉인',
    bossPressure: '보스 압박',
    sunTide: '햇살 파도',
    pearlChain: '진주 연쇄',
    festivalBoss: '축제 보스'
  };
  if (!modifiers.length) {
    el.modifierStrip.innerHTML = '<span>기본 규칙</span>';
    return;
  }
  const vfxLabels = getSummerModifierVfxLabels(modifiers);
  el.modifierStrip.dataset.summerEventVfx = vfxLabels.length ? SUMMER_EVENT_VFX_PATCH : 'base';
  el.modifierStrip.innerHTML = modifiers.map((modifier) => `<span data-modifier="${modifier}" data-season-vfx="${['sunTide', 'pearlChain', 'festivalBoss'].includes(modifier) ? SUMMER_EVENT_VFX_PATCH : 'base'}" title="${labels[modifier] || modifier}">${labels[modifier] || modifier}</span>`).join('') + (vfxLabels.length ? `<span class="modifier-vfx-note">${vfxLabels.join(' · ')}</span>` : '');
}

function addReward(type: string, amount: number) {
  state.inventory[type] = (state.inventory[type] || 0) + amount;
  writeJson('dream-library-inventory', state.inventory);
}

function renderRestoration() {
  const totalItems = Object.values(state.inventory).reduce((sum: number, value: any) => sum + Number(value || 0), 0);
  const completedCount = Object.keys(state.restorationCompleted).length;
  el.restorationSummary.textContent = `보유 복원 재료 ${formatNumber(totalItems)}개 · 완료 ${completedCount}/${RESTORATION_PROJECTS.length} · 프로젝트를 눌러 보상 상태를 확인하세요.`;
  el.restorationList.innerHTML = RESTORATION_PROJECTS.map((project) => {
    const current = getRestorationCurrent(project);
    const ratio = Math.min(100, Math.round((current / project.need) * 100));
    const focused = project.id === state.restorationFocus;
    const completed = Boolean(state.restorationCompleted[project.id]);
    const label = completed ? '완료' : ratio >= 100 ? '복원 가능' : `${current}/${project.need}`;
    return `<button type="button" class="restore-node ${ratio >= 100 ? 'complete' : ''} ${completed ? 'restored' : ''} ${focused ? 'selected' : ''}" data-restore-id="${project.id}"><strong>${focused ? '✦ ' : ''}${project.label}</strong><span>${label}</span><i style="--restore-progress:${ratio}%"></i></button>`;
  }).join('');
}

function getRestorationCurrent(project: any) {
  return project.types.reduce((sum: number, type: string) => sum + Number(state.inventory[type] || 0), 0);
}

function canCompleteRestoration(project: any) {
  return getRestorationCurrent(project) >= project.need;
}

function completeRestorationProject(projectId: string) {
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId);
  if (!project || state.restorationCompleted[project.id] || !canCompleteRestoration(project)) return;
  state.restorationCompleted[project.id] = new Date().toISOString();
  addReward('spark', 2);
  addReward('star', 1);
  writeJson('dream-library-restoration-completed', state.restorationCompleted);
  closeRestorationDetail();
  renderLobby();
  setStatus(`${project.label} 복원이 완료되어 별가루와 기억 파편을 획득했습니다.`);
  triggerRestorationCompletionTheater(project);
  HAPTIC.combo();
}

function triggerRestorationCompletionTheater(project: any) {
  if (state.restorationTheaterTimer) window.clearTimeout(state.restorationTheaterTimer);
  document.body.dataset.restorationCompletionTheater = RESTORATION_COMPLETION_THEATER_PATCH;
  document.body.dataset.restorationDetailCeremony = RESTORATION_DETAIL_CEREMONY_PATCH;
  document.body.dataset.restorationCeremonyFeedback = RESTORATION_CEREMONY_FEEDBACK_PATCH;
  document.body.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  document.body.classList.add('restoration-completion-theater-active', 'restoration-detail-ceremony-active');
  el.restorationDetailModal?.setAttribute('data-restoration-completion-theater', RESTORATION_COMPLETION_THEATER_PATCH);
  el.restorationDetailModal?.setAttribute('data-restoration-detail-ceremony', RESTORATION_DETAIL_CEREMONY_PATCH);
  el.restorationDetailModal?.setAttribute('data-restoration-ceremony-feedback', RESTORATION_CEREMONY_FEEDBACK_PATCH);
  el.restorationDetailModal?.setAttribute('data-mobile-safe-area-qa', MOBILE_SAFE_AREA_QA_PATCH);
  el.rewardModal?.setAttribute('data-restoration-completion-theater', RESTORATION_COMPLETION_THEATER_PATCH);
  el.rewardModal?.setAttribute('data-restoration-detail-ceremony', RESTORATION_DETAIL_CEREMONY_PATCH);
  el.rewardModal?.setAttribute('data-restoration-ceremony-feedback', RESTORATION_CEREMONY_FEEDBACK_PATCH);
  el.rewardModal?.setAttribute('data-reward-action-accessibility', REWARD_ACTION_ACCESSIBILITY_PATCH);
  el.rewardModal?.setAttribute('data-mobile-safe-area-qa', MOBILE_SAFE_AREA_QA_PATCH);
  el.rewardCompletionTheater?.setAttribute('data-restoration-completion-theater', RESTORATION_COMPLETION_THEATER_PATCH);
  el.rewardCompletionTheater?.setAttribute('data-restoration-detail-ceremony', RESTORATION_DETAIL_CEREMONY_PATCH);
  el.rewardCompletionTheater?.setAttribute('data-restoration-ceremony-feedback', RESTORATION_CEREMONY_FEEDBACK_PATCH);
  if (el.rewardCompletionTheater) {
    el.rewardCompletionTheater.innerHTML = `<span>완료식</span><b>${escapeHtml(project.label)}</b><small>${escapeHtml(project.reward || '서고의 빛이 돌아왔습니다')}</small>`;
    el.rewardCompletionTheater.classList.remove('hidden');
  }
  state.restorationTheaterTimer = window.setTimeout(() => {
    document.body.classList.remove('restoration-completion-theater-active', 'restoration-detail-ceremony-active');
    el.rewardCompletionTheater?.classList.add('hidden');
  }, 1800);
}



function renderCollection() {
  const collected = TILE_SET.filter((tile: any) => Number(state.inventory[tile.type] || 0) > 0);
  const premiumTotal = TILE_SET.filter((tile: any) => tile.theme === '프리미엄').length;
  const premiumOwned = collected.filter((tile: any) => tile.theme === '프리미엄').length;
  const v2Owned = collected.filter((tile: any) => tile.theme === 'v2 에셋').length;
  const v2Total = TILE_SET.filter((tile: any) => tile.theme === 'v2 에셋').length;
  el.collectionSummary.textContent = `${collected.length}/${TILE_SET.length} 수집 · 프리미엄 ${premiumOwned}/${premiumTotal} · v2 오브젝트 ${v2Owned}/${v2Total}`;
  el.collectionFilter.querySelectorAll('[data-collection-filter]').forEach((button: Element) => {
    button.classList.toggle('selected', (button as HTMLElement).dataset.collectionFilter === state.collectionFilter);
  });
  const filtered = TILE_SET
    .filter((tile: any) => {
      const count = Number(state.inventory[tile.type] || 0);
      if (state.collectionFilter === 'owned') return count > 0;
      if (state.collectionFilter === 'missing') return count <= 0;
      if (state.collectionFilter === 'premium') return tile.theme === '프리미엄';
      return true;
    })
    .sort((a: any, b: any) => Number(state.inventory[b.type] || 0) - Number(state.inventory[a.type] || 0));
  el.collectionList.innerHTML = filtered.map((tile: any) => {
    const count = Number(state.inventory[tile.type] || 0);
    return `<article class="collection-tile ${count > 0 ? 'owned' : 'locked'} ${tile.theme === '프리미엄' ? 'premium' : ''} ${tile.theme === 'v2 에셋' ? 'v2-asset' : ''}" data-theme="${escapeHtml(tile.theme || '')}"><img src="${tile.asset}" alt="" draggable="false" /><strong>${escapeHtml(tile.label)}</strong><span>${count > 0 ? `${count}개 · ${escapeHtml(tile.theme)}` : '미수집'}</span></article>`;
  }).join('') || '<p class="empty-list">조건에 맞는 오브젝트가 없습니다.</p>';
}

function openRestorationDetail(projectId: string) {
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId) || RESTORATION_PROJECTS[0];
  state.pendingRestorationProjectId = project.id;
  const current = getRestorationCurrent(project);
  const ratio = Math.min(100, Math.round((current / project.need) * 100));
  const completed = Boolean(state.restorationCompleted[project.id]);
  const ready = canCompleteRestoration(project) && !completed;
  el.restorationDetailTitle.textContent = completed ? `${project.label} 완료` : project.label;
  el.restorationDetailMessage.textContent = `${project.description} · 보상: ${project.reward} · 진행률 ${ratio}%${completed ? ' · 복원 완료' : ready ? ' · 완료 가능' : ''}`;
  el.restorationDetailModal.dataset.restorationDetailCeremony = RESTORATION_DETAIL_CEREMONY_PATCH;
  el.restorationDetailModal.dataset.restorationCeremonyFeedback = RESTORATION_CEREMONY_FEEDBACK_PATCH;
  el.restorationDetailModal.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  el.restorationDetailModal.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  el.restorationDetailModal.dataset.ceremonyState = completed ? 'completed' : ready ? 'ready' : 'progress';
  el.restorationDetailItems.setAttribute('data-restoration-detail-ceremony', RESTORATION_DETAIL_CEREMONY_PATCH);
  el.restorationDetailItems.setAttribute('data-restoration-ceremony-feedback', RESTORATION_CEREMONY_FEEDBACK_PATCH);
  const ceremony = `<div class="restoration-ceremony-strip" data-restoration-detail-ceremony="${RESTORATION_DETAIL_CEREMONY_PATCH}" data-restoration-ceremony-feedback="${RESTORATION_CEREMONY_FEEDBACK_PATCH}" data-restoration-completion-cue="${RESTORATION_COMPLETION_CUE_PATCH}" data-compact-modal-action-flow="${COMPACT_MODAL_ACTION_FLOW_PATCH}" data-ceremony-state="${completed ? 'completed' : ready ? 'ready' : 'progress'}"><span>${completed ? '완료식' : ready ? '완료 준비' : '복원 진행'}</span><b>${escapeHtml(project.label)}</b><small>${ratio}% · ${escapeHtml(project.reward)}</small><i aria-hidden="true"><em style="width:${ratio}%"></em></i><em class="ceremony-feedback-cue" aria-hidden="true">${ready ? '완료 가능' : completed ? '완료됨' : '진행 중'}</em></div>`;
  const items = project.types.map((type) => {
    const tile = TILE_SET.find((item: any) => item.type === type);
    const count = Number(state.inventory[type] || 0);
    return `<span class="detail-item"><img src="${tile?.asset || ''}" alt="" draggable="false" /><b>${escapeHtml(tile?.label || type)}</b><small>${count}개 보유</small></span>`;
  }).join('');
  el.restorationDetailItems.innerHTML = ceremony + items;
  (el.restorationDetailFocusButton as HTMLButtonElement).disabled = completed;
  el.restorationDetailFocusButton.setAttribute('data-restoration-ceremony-feedback', RESTORATION_CEREMONY_FEEDBACK_PATCH);
  el.restorationDetailFocusButton.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
  el.restorationDetailFocusButton.setAttribute('aria-label', completed ? '이미 완료된 복원 프로젝트' : ready ? '복원 완료식 실행' : '집중 프로젝트로 지정');
  document.getElementById('restoration-detail-close-button')?.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
  el.restorationDetailFocusButton.textContent = completed ? '완료됨' : canCompleteRestoration(project) ? '복원 완료' : project.id === state.restorationFocus ? '집중 중' : '집중 프로젝트';
  el.restorationDetailModal.classList.remove('hidden');
  scheduleModalSafeAreaAudit();
  scheduleRewardActionFocus();
}


function closeRestorationDetail() {
  el.restorationDetailModal.classList.add('hidden');
  delete el.restorationDetailModal.dataset.rewardDetailShowcase;
  delete el.restorationDetailModal.dataset.detailMode;
}

function renderDailyQuestChain(stage: any, boss: any, focusProject: any) {
  const daily = state.dailyChallenge;
  const rewardTotal = Number(stage.reward.amount || 0) + Number(daily.rewardBoost || 0);
  const projectCurrent = focusProject ? getRestorationCurrent(focusProject) : 0;
  const projectNeed = Number(focusProject?.need || 0);
  const projectReady = focusProject ? projectCurrent >= projectNeed : false;
  const comboNeed = Number(boss?.comboWarningEvery || 6);
  const warningSeconds = Number(boss?.warningSeconds || 15);
  return `<div id="daily-quest-chain" class="daily-quest-chain" data-daily-quest-chain="${DAILY_QUEST_CHAIN_PATCH}" aria-label="오늘의 복원 퀘스트 체인">` +
    `<span class="chain-reward"><b>보상</b><strong>${escapeHtml(stage.reward.label)} ×${rewardTotal}</strong><small>오늘 추가 보상 포함</small></span>` +
    `<span class="chain-boss"><b>보스</b><strong>${escapeHtml(boss.name)}</strong><small>${comboNeed}콤보/잔여 ${warningSeconds}초 주의</small></span>` +
    `<span class="chain-restore ${projectReady ? 'ready' : ''}"><b>복원</b><strong>${escapeHtml(focusProject?.label || '서고')}</strong><small>${projectNeed ? `${Math.min(projectCurrent, projectNeed)}/${projectNeed}` : '보상 연결'} ${projectReady ? '완료 가능' : '진행'}</small></span>` +
    `</div>`;
}

function renderDailyPanel() {
  const daily = state.dailyChallenge;
  const stage = getStageById(daily.stageId);
  const modifierText = daily.modifiers.length ? daily.modifiers.map((item: string) => ({ fog: '안개', locked: '잠금', timeSeal: '시간 봉인', bossPressure: '보스 압박', sunTide: '햇살 파도', pearlChain: '진주 연쇄', festivalBoss: '축제 보스' } as Record<string, string>)[item] || item).join(' · ') : '기본 규칙';
  el.dailyTitle.textContent = `오늘의 복원 · ${stage.title}`;
  el.dailyDesc.textContent = `${daily.label} · ${modifierText} · ${daily.rewardLabel}`;
  const boss = getBossForStage(stage);
  const focusProject = RESTORATION_PROJECTS.find((project) => project.types.includes(stage.reward.type)) || RESTORATION_PROJECTS.find((project) => !state.restorationCompleted[project.id]) || RESTORATION_PROJECTS[0];
  if (el.dailyRewardPromise) {
    el.dailyRewardPromise.innerHTML = `<span>오늘 보상</span><b>${escapeHtml(stage.reward.label)} ×${stage.reward.amount + daily.rewardBoost}</b><small>${escapeHtml(boss.name)} 보스 퍼즐 후 ${escapeHtml(focusProject?.label || '서고')} 복원에 연결</small>`;
  }
  if (el.dailyStartGuide) {
    el.dailyStartGuide.innerHTML = `<div><p class="eyebrow">Start Route</p><strong>오늘의 복원이 게임 시작입니다</strong><small>${escapeHtml(stage.title)} · ${escapeHtml(boss.name)} · ${escapeHtml(stage.reward.label)} 보상</small><p id="daily-start-focus-summary" class="daily-start-focus-summary" data-daily-start-focus="${DAILY_START_FOCUS_ASSIST_PATCH}"><span>오늘 목표</span><b>${escapeHtml(stage.reward.label)} ×${stage.reward.amount + daily.rewardBoost}</b><small>${escapeHtml(focusProject?.label || '서고 복원')}으로 연결</small></p>${renderDailyQuestChain(stage, boss, focusProject)}</div><ol><li><b>1</b><span>오늘의 복원</span></li><li><b>2</b><span>보스 퍼즐</span></li><li><b>3</b><span>${escapeHtml(focusProject?.label || '서고 복원')}</span></li></ol>`;
    el.dailyStartFocusSummary = $('#daily-start-focus-summary');
    el.dailyQuestChain = $('#daily-quest-chain');
    scheduleDailyStartFocusAssist();
    scheduleUiUxStabilityPass();
  }
  el.dailyRankTabs.querySelectorAll('[data-daily-rank]').forEach((button: Element) => {
    button.classList.toggle('selected', (button as HTMLElement).dataset.dailyRank === state.dailyRankScope);
  });
}


function showBossIntroBanner(stage: any) {
  const boss = getBossForStage(stage);
  const banner = el.bossIntroBanner;
  if (!banner) return;
  if (state.bossIntroTimer) window.clearTimeout(state.bossIntroTimer);
  document.body.dataset.bossIntroPolish = BOSS_INTRO_POLISH_PATCH;
  document.body.dataset.dailyStartFocusAssist = DAILY_START_FOCUS_ASSIST_PATCH;
  document.body.dataset.lobbyGuideComfort = LOBBY_GUIDE_COMFORT_PATCH;
  document.body.dataset.bossIntroPreload = BOSS_INTRO_PRELOAD_PATCH;
  document.body.dataset.dailyQuestChain = DAILY_QUEST_CHAIN_PATCH;
  document.body.dataset.bossAttackReadability = BOSS_ATTACK_READABILITY_PATCH;
  document.body.dataset.rewardFlowPolish = REWARD_FLOW_POLISH_PATCH;
  document.body.dataset.restorationRewardBridge = RESTORATION_REWARD_BRIDGE_PATCH;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-boss-intro-polish', BOSS_INTRO_POLISH_PATCH);
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-boss-intro-preload', BOSS_INTRO_PRELOAD_PATCH);
  banner.dataset.bossIntroPolish = BOSS_INTRO_POLISH_PATCH;
  banner.dataset.bossIntroPreload = BOSS_INTRO_PRELOAD_PATCH;
  banner.innerHTML = `<span>보스 등장</span><strong>${escapeHtml(boss.name)}</strong><small>${escapeHtml(stage.title)} · 짝을 맞춰 반격을 끊으세요</small>`;
  banner.classList.remove('hidden', 'boss-intro-pop');
  void banner.offsetWidth;
  banner.classList.add('boss-intro-pop');
  state.bossIntroTimer = window.setTimeout(() => banner.classList.add('hidden'), 1900);
}

function showComboCutin(combo: number) {
  if (combo < 2) return;
  const finisher = combo >= 5 || combo % 4 === 0;
  el.comboCutin.textContent = finisher ? `${combo} COMBO · 서고 공명` : `${combo} COMBO`;
  el.comboCutin.classList.remove('hidden', 'combo-pop', 'combo-finisher');
  if (finisher) el.comboCutin.classList.add('combo-finisher');
  void el.comboCutin.offsetWidth;
  el.comboCutin.classList.add('combo-pop');
  if (finisher) {
    document.querySelector('#boss-core')?.classList.add('cutin-hit');
    window.setTimeout(() => document.querySelector('#boss-core')?.classList.remove('cutin-hit'), 540);
  }
  window.setTimeout(() => el.comboCutin.classList.add('hidden'), finisher ? 980 : 760);
}


function showBossHitCutin(combo: number) {
  const boss = state.activeBoss || getBossForStage(getStageById(state.selectedStageId));
  const broken = combo >= 5;
  const finisher = combo >= 7;
  setBossFrame(broken ? 'break' : 'hit');
  el.bossHitCutin.dataset.bossId = boss.id || 'boss';
  el.bossHitCutin.dataset.comboTier = finisher ? 'finisher' : broken ? 'break' : 'hit';
  el.bossHitCutin.dataset.visualPriority = finisher ? 'finisher-front' : broken ? 'boss-break' : 'compact-hit';
  if (isSummerSeasonStage(getStageById(state.selectedStageId)) && finisher) el.bossHitCutin.dataset.finaleBossCutin = FINALE_BOSS_CUTIN_PATCH;
  document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-boss-cutin-priority', finisher ? 'front' : 'compact');
  el.bossHitCutin.textContent = finisher ? `${boss.name} 균열 · ${combo} COMBO` : broken ? `BOSS BREAK · ${combo} COMBO` : `BOSS HIT · ${combo} COMBO`;
  el.bossHitCutin.classList.remove('hidden', 'boss-hit-pop', 'boss-break-pop', 'boss-finisher-pop');
  if (broken) el.bossHitCutin.classList.add('boss-break-pop');
  if (finisher) el.bossHitCutin.classList.add('boss-finisher-pop');
  void el.bossHitCutin.offsetWidth;
  el.bossHitCutin.classList.add('boss-hit-pop');
  window.setTimeout(() => el.bossHitCutin.classList.add('hidden'), finisher ? 1120 : broken ? 920 : 720);
}

function openReward(stars: number, score: number) {
  const stage = getStageById(state.selectedStageId);
  const focusProject = RESTORATION_PROJECTS.find((project) => project.types.includes(stage.reward.type)) || RESTORATION_PROJECTS.find((project) => !state.restorationCompleted[project.id]) || RESTORATION_PROJECTS[0];
  const current = focusProject ? getRestorationCurrent(focusProject) : 0;
  const need = focusProject?.need || 0;
  const next = getNextStage(stage.id);
  state.lastRewardFocusProjectId = focusProject?.id || '';
  state.lastRewardNextStageId = next?.id || '';
  const rewardTight = window.innerWidth <= 430 || window.innerHeight <= 700;
  document.body.dataset.rewardClaimMotion = REWARD_CLAIM_MOTION_PATCH;
  document.body.dataset.nextGoalAdvisor = NEXT_GOAL_ADVISOR_PATCH;
  document.body.dataset.rewardPopupDensityGuard = REWARD_POPUP_DENSITY_GUARD_PATCH;
  document.body.dataset.clearFlowRecommendationQa = CLEAR_FLOW_RECOMMENDATION_QA_PATCH;
  document.body.dataset.rewardActionAccessibility = REWARD_ACTION_ACCESSIBILITY_PATCH;
  document.body.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  document.body.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  document.body.classList.toggle('reward-popup-density-tight', rewardTight);
  const progressText = focusProject ? `${focusProject.label} ${Math.min(current, need)}/${need}` : '복원 재료 보관';
  el.rewardTitle.textContent = `${stage.title} 복원 완료`;
  el.rewardMessage.textContent = `별 ${stars}개 · ${formatNumber(score)}점 · 획득 재료가 ${progressText}에 반영되었습니다.`;
  el.rewardModal.dataset.rewardFlowPolish = REWARD_FLOW_POLISH_PATCH;
  el.rewardModal.dataset.rewardPopupDensityGuard = REWARD_POPUP_DENSITY_GUARD_PATCH;
  el.rewardModal.dataset.clearFlowRecommendationQa = CLEAR_FLOW_RECOMMENDATION_QA_PATCH;
  el.rewardModal.dataset.rewardActionAccessibility = REWARD_ACTION_ACCESSIBILITY_PATCH;
  el.rewardModal.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  el.rewardModal.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  el.rewardModal.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
  el.rewardModal.dataset.smallRewardModalQa = SMALL_REWARD_MODAL_QA_PATCH;
  el.rewardModal.dataset.rewardDensity = rewardTight ? 'compact' : 'comfortable';
  el.rewardFlowNext?.setAttribute('data-reward-flow-polish', REWARD_FLOW_POLISH_PATCH);
  el.rewardFlowNext?.setAttribute('data-reward-action-accessibility', REWARD_ACTION_ACCESSIBILITY_PATCH);
  el.rewardFlowNext?.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  if (el.rewardFlowNext) el.rewardFlowNext.innerHTML = `<span>다음 흐름</span><b>${escapeHtml(progressText)}</b><small>${focusProject ? `${escapeHtml(focusProject.label)} 복원으로 이어집니다` : '복원 재료가 서고에 보관됩니다'}</small><em class="reward-action-summary">${focusProject && canCompleteRestoration(focusProject) ? '복원 완료 버튼을 먼저 누르는 흐름입니다' : next ? '다음 목표 버튼을 먼저 누르면 바로 이어집니다' : '로비에서 다음 목표를 확인하세요'}</em>`;
  if (el.rewardRestorationBridge && focusProject) {
    const ratio = need ? Math.min(100, Math.round((current / need) * 100)) : 0;
    const remaining = Math.max(0, need - current);
    el.rewardRestorationBridge.dataset.restorationRewardBridge = RESTORATION_REWARD_BRIDGE_PATCH;
    el.rewardRestorationBridge.dataset.restoreId = focusProject.id;
    el.rewardRestorationBridge.dataset.bridgeState = remaining <= 0 ? 'ready' : 'progress';
    el.rewardRestorationBridge.style.setProperty('--restore-bridge-progress', `${ratio}%`);
    el.rewardRestorationBridge.querySelector<HTMLElement>('[data-restore-bridge-title]')!.textContent = focusProject.label;
    el.rewardRestorationBridge.querySelector<HTMLElement>('[data-restore-bridge-detail]')!.textContent = remaining <= 0 ? '지금 복원 완료 가능' : `${remaining}개 더 모으면 복원 가능`;
    el.rewardRestorationFill?.style.setProperty('width', `${ratio}%`);
    el.rewardRestorationButton.textContent = remaining <= 0 ? '복원 완료 보기' : '복원으로 보기';
    el.rewardRestorationButton.dataset.restoreId = focusProject.id;
    el.rewardRestorationBridge.classList.remove('hidden');
    el.rewardRestorationBridge.dataset.rewardClaimMotion = REWARD_CLAIM_MOTION_PATCH;
    el.rewardRestorationBridge.dataset.rewardActionAccessibility = REWARD_ACTION_ACCESSIBILITY_PATCH;
    el.rewardRestorationBridge.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
    el.rewardRestorationBridge.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
    el.rewardRestorationButton.setAttribute('data-reward-action-accessibility', REWARD_ACTION_ACCESSIBILITY_PATCH);
    el.rewardRestorationButton.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
    el.rewardRestorationButton.setAttribute('aria-label', remaining <= 0 ? `${focusProject.label} 복원 완료 보기` : `${focusProject.label} 복원 진행 보기`);
    if (remaining <= 0) triggerRestorationCompletionTheater(focusProject);
  }
  const dailyBonus = state.currentBoardId === 'daily' ? `<span class="reward-chip reward-chip-daily">오늘의 별가루 ×${state.dailyChallenge.rewardBoost}</span>` : '';
  const seasonBonus = isSummerSeasonStage(stage) ? `<span class="reward-chip reward-chip-season">${escapeHtml(SUMMER_SEASON_EVENT.currencyLabel)} ×${SUMMER_SEASON_EVENT.clearReward}</span>` : '';
  const seasonPassBonus = state.lastSeasonPassReward ? `<span class="reward-chip reward-chip-season-pass">패스 ${state.lastSeasonPassReward.milestone} 클리어 · ${escapeHtml(state.lastSeasonPassReward.label)} ×${state.lastSeasonPassReward.amount}</span>` : '';
  const finaleBonus = (stage as any).finale ? `<span class="reward-chip reward-chip-finale">피날레 보너스 · 상점 재화 +1</span>` : '';
  const restoreChip = focusProject ? `<span class="reward-chip reward-chip-restore">복원 연결 · ${escapeHtml(focusProject.label)}</span>` : '';
  el.rewardItems.dataset.rewardFlow = 'materials-linked-v1040';
  el.rewardItems.innerHTML = `<span class="reward-chip reward-chip-stars">★ ${stars}</span><span class="reward-chip reward-chip-material">${escapeHtml(stage.reward.label)} ×${stage.reward.amount}</span>${restoreChip}${dailyBonus}${seasonBonus}${seasonPassBonus}${finaleBonus}`;
  el.rewardModal.dataset.rewardFlow = CLEAR_REWARD_FLOW_PATCH;
  el.rewardModal.dataset.restorationRewardBridge = RESTORATION_REWARD_BRIDGE_PATCH;
  el.rewardModal.dataset.restorationCompletionTheater = RESTORATION_COMPLETION_THEATER_PATCH;
  el.rewardModal.dataset.rewardClaimMotion = REWARD_CLAIM_MOTION_PATCH;
  el.rewardModal.dataset.nextGoalAdvisor = NEXT_GOAL_ADVISOR_PATCH;
  el.rewardModal.dataset.rewardPopupDensityGuard = REWARD_POPUP_DENSITY_GUARD_PATCH;
  el.rewardModal.dataset.clearFlowRecommendationQa = CLEAR_FLOW_RECOMMENDATION_QA_PATCH;
  el.rewardModal.dataset.rewardActionAccessibility = REWARD_ACTION_ACCESSIBILITY_PATCH;
  el.rewardModal.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  el.rewardModal.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  el.rewardModal.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
  el.rewardModal.dataset.smallRewardModalQa = SMALL_REWARD_MODAL_QA_PATCH;
  el.nextStageButton.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
  el.nextStageButton.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  el.replayStageButton.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
  el.replayStageButton.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  renderRewardNextGoalAdvisor(stage, next, focusProject);
  syncRewardActionPriority(focusProject, next);
  el.nextStageButton.classList.toggle('hidden', !next);
  el.rewardModal.classList.remove('hidden');
  el.rewardModal.classList.remove('reward-claim-pop');
  void el.rewardModal.offsetWidth;
  el.rewardModal.classList.add('reward-claim-pop');
  scheduleModalSafeAreaAudit();
  scheduleRewardActionFocus();
}



function renderRewardNextGoalAdvisor(stage: any, next: any, focusProject: any) {
  if (!el.rewardNextGoal) return;
  const projectReady = focusProject ? canCompleteRestoration(focusProject) : false;
  const nextLabel = next ? next.title : '오늘의 복원 반복 도전';
  const actionLabel = projectReady ? '복원 완료 먼저 보기' : next ? '다음 목표 보기' : '로비에서 목표 보기';
  const body = projectReady
    ? `${escapeHtml(focusProject.label)} 복원이 완료 가능해졌습니다`
    : next
      ? `${escapeHtml(stage.title)} 이후 ${escapeHtml(next.title)}로 이어집니다`
      : '복원 작업대와 랭킹을 확인한 뒤 다시 도전하세요';
  const priority = projectReady ? 'restore-first' : next ? 'stage-next' : 'lobby-review';
  el.rewardNextGoal.dataset.nextGoalAdvisor = NEXT_GOAL_ADVISOR_PATCH;
  el.rewardNextGoal.dataset.clearFlowRecommendationQa = CLEAR_FLOW_RECOMMENDATION_QA_PATCH;
  el.rewardNextGoal.dataset.rewardPopupDensityGuard = REWARD_POPUP_DENSITY_GUARD_PATCH;
  el.rewardNextGoal.dataset.rewardActionAccessibility = REWARD_ACTION_ACCESSIBILITY_PATCH;
  el.rewardNextGoal.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  el.rewardNextGoal.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  el.rewardNextGoal.dataset.goalState = projectReady ? 'restore-ready' : next ? 'next-stage' : 'lobby-review';
  el.rewardNextGoal.dataset.goalPriority = priority;
  el.rewardNextGoal.innerHTML = `<span>${projectReady ? '복원 우선' : '다음 목표'}</span><b>${escapeHtml(nextLabel)}</b><small>${body}</small><em class="reward-next-route" aria-hidden="true">${projectReady ? '보상 → 복원 완료' : next ? '보상 → 다음 스테이지' : '보상 → 로비 점검'}</em><i class="reward-action-hint" aria-hidden="true">${projectReady ? '복원 완료를 먼저 보면 가장 빠릅니다' : next ? '다음 목표로 이어가면 흐름이 끊기지 않습니다' : '로비에서 복원과 랭킹을 점검하세요'}</i><button id="reward-next-goal-button" type="button" class="secondary" data-reward-action-accessibility="${REWARD_ACTION_ACCESSIBILITY_PATCH}" data-compact-modal-action-flow="${COMPACT_MODAL_ACTION_FLOW_PATCH}" data-modal-button-microcopy="${MODAL_BUTTON_MICROCOPY_PATCH}">${actionLabel}</button>`;
  el.rewardNextGoalButton = $('#reward-next-goal-button') as HTMLButtonElement;
  el.rewardNextGoalButton?.setAttribute('aria-label', `${actionLabel}: ${nextLabel}`);
  el.rewardNextGoalButton?.setAttribute('data-primary-reward-action', priority);
  el.rewardNextGoalButton?.addEventListener('click', openRewardNextGoalAdvisor, { once: true });
  el.rewardNextGoal.classList.remove('hidden');
}

function syncRewardActionPriority(focusProject: any, next: any) {
  const projectReady = Boolean(focusProject && canCompleteRestoration(focusProject) && !state.restorationCompleted[focusProject.id]);
  const priority = projectReady ? 'restore-first' : next ? 'stage-next' : 'lobby-review';
  el.rewardModal.dataset.rewardActionPriority = priority;
  el.rewardModal.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
  el.rewardModal.dataset.smallRewardModalQa = SMALL_REWARD_MODAL_QA_PATCH;
  el.rewardNextGoal?.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  el.rewardNextGoalButton?.setAttribute('data-primary-reward-action', priority);
  el.rewardRestorationButton?.setAttribute('data-primary-reward-action', projectReady ? 'restore-first' : 'support');
  el.nextStageButton?.setAttribute('data-secondary-reward-action', projectReady ? 'later' : next ? 'direct-next' : 'hidden');
  el.replayStageButton?.setAttribute('data-secondary-reward-action', 'replay');
  if (next) el.nextStageButton.textContent = projectReady ? '다음 스테이지 나중에' : '바로 다음 스테이지';
  el.replayStageButton.textContent = '다시 플레이';
}

function scheduleRewardActionFocus() {
  if (state.modalActionPriorityTimer) window.clearTimeout(state.modalActionPriorityTimer);
  state.modalActionPriorityTimer = window.setTimeout(focusRewardPrimaryAction, 80);
}

function focusRewardPrimaryAction() {
  state.modalActionPriorityTimer = 0;
  if (el.rewardModal.classList.contains('hidden')) return;
  const primary = el.rewardModal.querySelector<HTMLButtonElement>('[data-primary-reward-action="restore-first"], #reward-next-goal-button, #next-stage-button');
  if (primary && window.innerWidth >= 360) primary.focus({ preventScroll: true });
}

function openRewardNextGoalAdvisor() {
  const projectId = state.lastRewardFocusProjectId || el.rewardRestorationButton?.dataset.restoreId || state.restorationFocus || 'shelf';
  const project = RESTORATION_PROJECTS.find((item) => item.id === projectId);
  const shouldRestoreFirst = Boolean(project && canCompleteRestoration(project) && !state.restorationCompleted[project.id]);
  closeReward();
  if (shouldRestoreFirst) {
    updateScreen('lobby');
    renderLobby();
    window.setTimeout(() => {
      scrollLobbyTarget('.restoration-panel');
      openRestorationDetail(projectId);
      setStatus('복원 완료 가능한 프로젝트를 먼저 열었습니다.');
    }, 80);
    return;
  }
  if (state.lastRewardNextStageId) {
    state.selectedStageId = state.lastRewardNextStageId;
    writeText('dream-library-selected-stage', state.selectedStageId);
  }
  updateScreen('lobby');
  renderLobby();
  window.setTimeout(() => {
    scrollLobbyTarget('.selected-stage-card');
    setStatus(state.lastRewardNextStageId ? '다음 목표 스테이지를 선택했습니다.' : '로비에서 다음 목표를 확인하세요.');
  }, 80);
}

function closeReward() {
  el.rewardModal.classList.add('hidden');
  el.rewardModal.classList.remove('reward-claim-pop');
  el.rewardNextGoal?.classList.add('hidden');
  if (state.restorationTheaterTimer) {
    window.clearTimeout(state.restorationTheaterTimer);
    state.restorationTheaterTimer = 0;
  }
  document.body.classList.remove('restoration-completion-theater-active', 'restoration-detail-ceremony-active', 'reward-popup-density-tight', 'modal-safe-area-tight', 'small-reward-modal-tight');
  el.rewardCompletionTheater?.classList.add('hidden');
}

function openRewardRestorationBridge() {
  const projectId = el.rewardRestorationButton?.dataset.restoreId || el.rewardRestorationBridge?.dataset.restoreId || state.restorationFocus || 'shelf';
  closeReward();
  updateScreen('lobby');
  renderLobby();
  window.setTimeout(() => {
    scrollLobbyTarget('.restoration-panel');
    openRestorationDetail(projectId);
    setStatus('방금 획득한 재료가 연결된 복원 프로젝트를 열었습니다.');
  }, 80);
}


function scheduleModalSafeAreaAudit() {
  window.setTimeout(syncModalSafeAreaAudit, 40);
}

function syncModalSafeAreaAudit() {
  const rewardOpen = !el.rewardModal?.classList.contains('hidden');
  const detailOpen = !el.restorationDetailModal?.classList.contains('hidden');
  const tight = window.innerWidth <= 430 || window.innerHeight <= 700;
  const tiny = window.innerWidth <= 370 || window.innerHeight <= 620;
  document.body.dataset.mobileSafeAreaQa = MOBILE_SAFE_AREA_QA_PATCH;
  document.body.dataset.compactModalActionFlow = COMPACT_MODAL_ACTION_FLOW_PATCH;
  document.body.dataset.smallRewardModalQa = SMALL_REWARD_MODAL_QA_PATCH;
  document.body.dataset.modalButtonMicrocopy = MODAL_BUTTON_MICROCOPY_PATCH;
  document.body.classList.toggle('modal-safe-area-tight', Boolean((rewardOpen || detailOpen) && tight));
  document.body.classList.toggle('small-reward-modal-tight', Boolean((rewardOpen || detailOpen) && tiny));
  [el.rewardModal, el.restorationDetailModal].forEach((modal) => {
    modal?.setAttribute('data-mobile-safe-area-qa', MOBILE_SAFE_AREA_QA_PATCH);
    modal?.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
    modal?.setAttribute('data-small-reward-modal-qa', SMALL_REWARD_MODAL_QA_PATCH);
    modal?.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  });
  document.querySelectorAll<HTMLElement>('.reward-actions').forEach((actions) => {
    actions.setAttribute('data-compact-modal-action-flow', COMPACT_MODAL_ACTION_FLOW_PATCH);
    actions.setAttribute('data-reward-action-accessibility', REWARD_ACTION_ACCESSIBILITY_PATCH);
    actions.setAttribute('data-modal-button-microcopy', MODAL_BUTTON_MICROCOPY_PATCH);
  });
}


async function loadLeaderboard() {
  const localRows = getLocalRankRows(state.localRanking, 'global');
  if (!db) {
    el.leaderboardList.innerHTML = renderRankRows(localRows, '로컬 복원 기록 준비 완료', 'local');
    return;
  }
  try {
    const snapshot = await getDocs(query(collection(db, 'leaderboards/global/scores'), orderBy('score', 'desc'), limit(5)));
    const cloudRows = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        displayName: data.displayName || '사서',
        score: Number(data.score || 0),
        stageId: String(data.stageId || ''),
        source: 'cloud' as const,
        tag: '저장'
      };
    });
    el.leaderboardList.innerHTML = renderRankRows(mergeRankRows(cloudRows, localRows), '첫 복원 기록을 남겨보세요.', cloudRows.length ? 'mixed' : 'local');
  } catch {
    el.leaderboardList.innerHTML = renderRankRows(localRows, 'Firebase 랭킹 실패 · 로컬 기록 표시', 'local');
  }
}

function getLocalRankRows(list: LocalRankEntry[], scope: 'global' | 'daily') {
  return [...list]
    .sort((a, b) => b.score - a.score)
    .slice(0, 8)
    .map((entry) => {
      const rankKey = makeRankIdentity(entry);
      return {
        displayName: entry.displayName,
        score: entry.score,
        stageId: entry.stageId,
        dailyKey: entry.dailyKey,
        source: 'local' as const,
        tag: scope === 'daily' ? '로컬 daily' : '로컬',
        rankKey,
        fresh: rankKey === state.recentScoreKey
      };
    });
}

function mergeRankRows(cloudRows: any[], localRows: any[]) {
  const seen = new Set<string>();
  const merged = [...cloudRows, ...localRows]
    .sort((a, b) => Number(b.score || 0) - Number(a.score || 0))
    .filter((entry) => {
      const key = `${entry.source}:${entry.displayName}:${entry.stageId || ''}:${entry.dailyKey || ''}:${entry.score}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .slice(0, 5);
  return merged;
}

function renderRankRows(rows: any[], emptyLabel = '로컬 플레이 준비 완료', mode: 'cloud' | 'local' | 'mixed' = 'mixed') {
  if (!rows.length) return `<li class="rank-empty">${escapeHtml(emptyLabel)}</li>`;
  const sourceSummary = mode === 'mixed' ? '<li class="rank-source-note"><strong>Cloud</strong>와 <strong>Local</strong> 기록을 점수순으로 함께 표시합니다.</li>' : mode === 'local' ? '<li class="rank-source-note"><strong>Local</strong> 기기 기록 기준으로 표시합니다.</li>' : '';
  return sourceSummary + rows.map((entry, index) => {
    const rankClass = index === 0 ? 'rank-gold' : index === 1 ? 'rank-silver' : index === 2 ? 'rank-bronze' : '';
    const sourceClass = entry.source === 'cloud' ? 'rank-cloud' : 'rank-local';
    const sourceLabel = entry.source === 'cloud' ? 'Cloud' : 'Local';
    const dailyTag = entry.dailyKey ? `<small>${escapeHtml(String(entry.dailyKey).slice(5))}</small>` : '';
    return `<li class="rank-row ${rankClass} ${sourceClass}" data-rank-source="${entry.source}" data-rank-mode="${mode}" data-rank-fresh="${entry.fresh ? 'true' : 'false'}"><b>${index + 1}</b><span>${escapeHtml(entry.displayName || '사서')}</span><strong>${formatNumber(entry.score || 0)}</strong>${dailyTag}<em>${sourceLabel}</em></li>`;
  }).join('');
}

async function loadDailyLeaderboard() {
  const scopeLabel = state.dailyRankScope === 'all' ? '전체 일일' : '오늘';
  const localRows = getLocalRankRows(
    state.localDailyRanking.filter((entry) => state.dailyRankScope === 'all' || entry.dailyKey === state.dailyChallenge.dateKey),
    'daily'
  );
  if (!db) {
    el.dailyLeaderboardList.innerHTML = renderRankRows(localRows, `로컬 ${scopeLabel} 기록 준비 완료`, 'local');
    return;
  }
  try {
    const daily = state.dailyChallenge;
    const ref = state.dailyRankScope === 'all'
      ? collection(db, 'leaderboards/daily/scores')
      : collection(db, 'leaderboards', 'daily', 'days', daily.dateKey, 'scores');
    const snapshot = await getDocs(query(ref, orderBy('score', 'desc'), limit(5)));
    const cloudRows = snapshot.docs.map((docSnap) => {
      const data = docSnap.data() as any;
      return {
        displayName: data.displayName || '사서',
        score: Number(data.score || 0),
        stageId: String(data.stageId || ''),
        dailyKey: data.dailyKey || daily.dateKey,
        source: 'cloud' as const,
        tag: '저장'
      };
    });
    el.dailyLeaderboardList.innerHTML = renderRankRows(mergeRankRows(cloudRows, localRows), `${scopeLabel} 첫 기록을 노려보세요.`, cloudRows.length ? 'mixed' : 'local');
  } catch {
    el.dailyLeaderboardList.innerHTML = renderRankRows(localRows, `${scopeLabel} Firebase 실패 · 로컬 기록 표시`, 'local');
  }
}

function renderLocalLeaderboard(emptyLabel = '로컬 플레이 준비 완료', returnOnly = false) {
  const markup = renderRankRows(getLocalRankRows(state.localRanking, 'global'), emptyLabel, 'local');
  if (!returnOnly) el.leaderboardList.innerHTML = markup;
  return markup;
}

function renderLocalDailyLeaderboard(emptyLabel = '로컬 일일 기록 준비 완료', returnOnly = false) {
  const dailyKey = state.dailyChallenge.dateKey;
  const rows = getLocalRankRows(
    state.localDailyRanking.filter((entry) => state.dailyRankScope === 'all' || entry.dailyKey === dailyKey),
    'daily'
  );
  const markup = renderRankRows(rows, emptyLabel, 'local');
  if (!returnOnly) el.dailyLeaderboardList.innerHTML = markup;
  return markup;
}

function saveLocalScore(score: number, stars: number) {
  const stage = getStageById(state.selectedStageId);
  const baseEntry: LocalRankEntry = {
    displayName: state.user ? getDisplayName(state.user) : state.localGuest?.name || '로컬 사서',
    score,
    stageId: stage.id,
    stars,
    updatedAt: new Date().toISOString()
  };
  state.recentScoreKey = makeRankIdentity(baseEntry);
  state.localRanking = upsertLocalRank(state.localRanking, baseEntry);
  writeJson('dream-library-local-ranking-global', state.localRanking);
  if (state.currentBoardId === 'daily') {
    const dailyEntry = { ...baseEntry, dailyKey: state.dailyChallenge.dateKey };
    state.recentScoreKey = makeRankIdentity(dailyEntry);
    state.localDailyRanking = upsertLocalRank(state.localDailyRanking, dailyEntry);
    writeJson('dream-library-local-ranking-daily', state.localDailyRanking);
  }
}

function makeRankIdentity(entry: Pick<LocalRankEntry, 'displayName' | 'stageId' | 'dailyKey'>) {
  return `${entry.displayName}:${entry.stageId}:${entry.dailyKey || 'global'}`;
}

function upsertLocalRank(list: LocalRankEntry[], entry: LocalRankEntry) {
  const identity = makeRankIdentity(entry);
  const merged = list.filter((item) => makeRankIdentity(item) !== identity);
  merged.push(entry);
  return merged.sort((a, b) => b.score - a.score).slice(0, 20);
}

async function refreshRankingPanelsAfterScore() {
  await Promise.allSettled([loadLeaderboard(), loadDailyLeaderboard()]);
}

async function saveScore(score: number, stars: number) {
  if (!db || !state.user) return;
  const stage = getStageById(state.selectedStageId);
  const payload = {
    uid: state.user.uid,
    displayName: getDisplayName(state.user),
    score,
    comboMax: state.comboMax,
    moves: state.moves,
    difficulty: stage.difficultyKey,
    timeSeconds: state.remainingSeconds,
    cleared: true,
    stageId: stage.id,
    stageNumber: stage.number,
    stars,
    updatedAt: serverTimestamp()
  };
  await setDoc(doc(db, 'leaderboards/global/scores', state.user.uid), payload, { merge: true }).catch(() => null);
  if (state.currentBoardId === 'daily') {
    const dailyPayload = { ...payload, dailyKey: state.dailyChallenge.dateKey };
    await setDoc(doc(db, 'leaderboards/daily/scores', state.user.uid), dailyPayload, { merge: true }).catch(() => null);
    await setDoc(doc(db, 'leaderboards', 'daily', 'days', state.dailyChallenge.dateKey, 'scores', state.user.uid), dailyPayload, { merge: true }).catch(() => null);
    loadDailyLeaderboard();
  }
}

function unlockStage(stageId: string, stars: number, score: number) {
  const previous = state.campaignProgress.cleared[stageId];
  state.campaignProgress.cleared[stageId] = { stars: Math.max(stars, previous?.stars || 0), bestScore: Math.max(score, previous?.bestScore || 0) };
  const next = getNextStage(stageId);
  if (next && !state.campaignProgress.unlocked.includes(next.id)) state.campaignProgress.unlocked.push(next.id);
  writeJson('dream-library-campaign-progress', state.campaignProgress);
}

function isStageUnlocked(stageId: string) {
  return state.campaignProgress.unlocked.includes(stageId);
}

function normalizeCampaignProgress(progress: CampaignProgress | null): CampaignProgress {
  const unlocked = new Set([DEFAULT_STAGE_ID, ...(progress?.unlocked || [])]);
  const cleared = progress?.cleared || {};
  STAGES.forEach((stage: any) => {
    if (stage.unlockAfter && cleared[stage.unlockAfter]) unlocked.add(stage.id);
  });
  return { unlocked: [...unlocked], cleared };
}

async function runAuth(action: () => Promise<void>, successMessage: string) {
  try {
    await action();
    setStatus(successMessage);
  } catch (error: any) {
    if (error?.code === 'auth/redirect-started') setStatus('구글 로그인 화면으로 이동합니다. 돌아오면 자동으로 로비를 엽니다.');
    else if (error?.code === 'auth/missing-email-password') setStatus('이메일과 비밀번호를 입력하세요.');
    else if (error?.message === 'login-disabled' || error?.code === 'firebase/missing-config') setStatus('현재는 게스트 로그인을 사용할 수 있습니다.');
    else if (error?.code === 'auth/unauthorized-domain') setStatus('구글 로그인 도메인 설정을 확인해야 합니다. Firebase Authorized Domain에 현재 도메인을 추가하세요.');
    else setStatus('로그인을 완료하지 못했습니다. 잠시 후 다시 시도하세요.');
  }
}

function hasSession() {
  return Boolean(state.user || state.localGuest);
}

function makeLocalGuest() {
  return { uid: `local-${crypto.randomUUID()}`, name: `게스트 사서 ${Math.floor(Math.random() * 900 + 100)}` };
}

function setStatus(message: string) {
  el.loginStatus.textContent = message;
  el.statusLabel.textContent = message;
}

function formatTime(seconds: number) {
  const minutes = Math.floor(seconds / 60).toString().padStart(2, '0');
  const rest = Math.floor(seconds % 60).toString().padStart(2, '0');
  return `${minutes}:${rest}`;
}

function formatNumber(value: number) {
  return new Intl.NumberFormat('ko-KR').format(value || 0);
}

function readText(key: string) {
  return localStorage.getItem(key) || '';
}

function writeText(key: string, value: string) {
  localStorage.setItem(key, value);
}

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  if (value === null) localStorage.removeItem(key);
  else localStorage.setItem(key, JSON.stringify(value));
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '\'': '&#39;', '"': '&quot;' }[char] || char));
}
