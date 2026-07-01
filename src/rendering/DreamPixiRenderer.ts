import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { PALETTE } from '../config/design';
import type { DeviceProfile } from '../systems/performance';

const effectAsset = (name: string) => `${import.meta.env.BASE_URL}assets/effects/${name}.png`;
const tileAtlasAssets = [
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.atlas.json`,
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.png`,
  `${import.meta.env.BASE_URL}assets/atlas/v2-tiles.webp`
];
const bossFrameAtlasAssets = [
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.atlas.json`,
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.png`,
  `${import.meta.env.BASE_URL}assets/atlas/boss-frames-v2.webp`
];
const isV2StateAsset = (asset = '') => asset.includes('/assets/objects/v2-state/') || asset.includes('assets/objects/v2-state/');
const SELECTION_INSET_RATIO = 0.12;
const SELECTION_RING_RATIO = 0.38;
const SELECTION_WAVE_RATIO = 0.22;
const TILE_SPRITE_RATIO = 0.92;
const TILE_GEOMETRY_GUARD_LABEL = 'tile-body-geometry-locked';
const TILE_GEOMETRY_EPSILON = 0.001;
const SELECTION_OVERLAY_INSET_RATIO = 0.09;
const TOUCH_HIT_SLOP_RATIO = 0.075;
const TOUCH_HIT_SLOP_MAX = 7;
const REAL_DEVICE_SELECTION_QA_LABEL = 'real-device-selection-geometry-qa';
const BOARD_FOCUS_BALANCE_PATCH = 'v1040-board-focus-balance';
const MOBILE_BOARD_FEEL_PATCH = 'v1040-mobile-board-feel';
const CLEAR_REWARD_FLOW_PATCH = 'v1040-board-to-reward-flow';
const BOSS_FLOW_TEMPO_PATCH = 'v1040-boss-flow-tempo';
const SUMMER_EVENT_VFX_PATCH = 'v1049-summer-event-vfx';
const SUMMER_PASS_MISSIONS_PATCH = 'v1049-summer-pass-missions';
const ENGINE_RENDER_BUDGET_TUNING_PATCH = 'v1055-engine-render-budget-tuning';
const BOSS_WARNING_READABILITY_PATCH = 'v1056-boss-warning-readability';
const BOSS_BOARD_CLEARANCE_PATCH = 'v1077-boss-board-clearance';
const LOW_END_RENDER_BUDGET_GUARD_PATCH = 'v1078-low-end-render-budget-guard';
const CAMERA_GESTURE_SEPARATION_PATCH = 'v1080-camera-gesture-separation';
const createTileHitArea = (size: number, slop = Math.min(TOUCH_HIT_SLOP_MAX, size * TOUCH_HIT_SLOP_RATIO)) => ({
  contains: (x: number, y: number) => Math.abs(x) <= size / 2 + slop && Math.abs(y) <= size / 2 + slop
});

const BOSS_WARNING_DEPTH_PROFILES: Record<string, { primary: number; secondary: number; aura: number; laneAlpha: number; coreAlpha: number; flareAlpha: number; duration: number; widthBoost: number }> = {
  'forgotten-spirit': { primary: PALETTE.violet, secondary: PALETTE.sky, aura: PALETTE.goldLight, laneAlpha: 0.14, coreAlpha: 0.58, flareAlpha: 0.12, duration: 0.58, widthBoost: 1 },
  'shadow-librarian': { primary: PALETTE.sky, secondary: PALETTE.violet, aura: PALETTE.emerald, laneAlpha: 0.17, coreAlpha: 0.64, flareAlpha: 0.16, duration: 0.52, widthBoost: 1.12 },
  'sealed-page-golem': { primary: PALETTE.gold, secondary: PALETTE.violet, aura: PALETTE.goldLight, laneAlpha: 0.2, coreAlpha: 0.7, flareAlpha: 0.19, duration: 0.66, widthBoost: 1.28 },
  default: { primary: PALETTE.violet, secondary: PALETTE.sky, aura: PALETTE.goldLight, laneAlpha: 0.15, coreAlpha: 0.6, flareAlpha: 0.14, duration: 0.6, widthBoost: 1 }
};

export type BoardTile = {
  id: string;
  type: string;
  label: string;
  asset: string;
  theme?: string;
  special?: 'fog' | 'locked' | 'timeSeal';
  specialRevealed?: boolean;
  stateAssets?: Partial<Record<'normal' | 'selected' | 'hint' | 'locked' | 'disabled', string>>;
};

export type BoardCell = BoardTile | null;
export type BoardPoint = { row: number; col: number };
export type PaddedPathPoint = { row: number; col: number };
export type TileTapHandler = (point: BoardPoint) => void;

type TileView = {
  root: Container;
  sprite: Sprite;
  glow: Graphics;
  selectionRing: Graphics;
  selectionCore: Graphics;
  row: number;
  col: number;
  baseX: number;
  baseY: number;
  phase: number;
  settling: boolean;
  removing: boolean;
  tile: BoardTile;
};

type BoardLayout = {
  startX: number;
  startY: number;
  step: number;
  rows: number;
  cols: number;
  worldWidth: number;
  worldHeight: number;
  cameraMode: 'fit' | 'panZoom';
};

type RenderBudgetName = 'lite' | 'balanced' | 'rich';
type RenderBudgetProfile = { name: RenderBudgetName; particleScale: number; particleCap: number; spriteStride: number; warningAlphaScale: number; burstScale: number };

type BoardCamera = {
  x: number;
  y: number;
  scale: number;
  minScale: number;
  maxScale: number;
  viewportWidth: number;
  viewportHeight: number;
  worldWidth: number;
  worldHeight: number;
  pointers: Map<number, { x: number; y: number }>;
  dragging: boolean;
  moved: boolean;
  lastX: number;
  lastY: number;
  pinchDistance: number;
  pinchScale: number;
  tapSuppressedUntil: number;
  gestureMode: 'idle' | 'pan' | 'pinch' | 'wheel';
  gestureStartX: number;
  gestureStartY: number;
  pinchStarted: boolean;
  panLockedUntil: number;
};

export class DreamPixiRenderer {
  ambientApp?: Application;
  boardApp?: Application;
  ambientLayers: Record<string, Container> = {};
  boardLayers: Record<string, Container> = {};
  boardViewport?: Container;
  tileViews = new Map<string, TileView>();
  board: BoardCell[][] = [];
  host?: HTMLElement;
  tileSize = 64;
  readonly minReadableTile = 34;
  gap = 7;
  selectedKey: string | null = null;
  onTileTap?: TileTapHandler;
  assetCache = new Set<string>();
  quality: DeviceProfile = { tier: 'high', pixelRatio: 1.5, particleScale: 1, motionScale: 1, maxBoardTile: 72, reason: '기본값' };
  layout: BoardLayout = { startX: 0, startY: 0, step: 72, rows: 0, cols: 0, worldWidth: 0, worldHeight: 0, cameraMode: 'fit' };
  camera: BoardCamera = {
    x: 0,
    y: 0,
    scale: 1,
    minScale: 0.6,
    maxScale: 1.5,
    viewportWidth: 0,
    viewportHeight: 0,
    worldWidth: 0,
    worldHeight: 0,
    pointers: new Map(),
    dragging: false,
    moved: false,
    lastX: 0,
    lastY: 0,
    pinchDistance: 0,
    pinchScale: 1,
    tapSuppressedUntil: 0,
    gestureMode: 'idle',
    gestureStartX: 0,
    gestureStartY: 0,
    pinchStarted: false,
    panLockedUntil: 0
  };
  lastPointerMove = 0;
  tileAtlasReady: Promise<void> | null = null;
  bossAtlasReady: Promise<void> | null = null;
  bossLayerSprite: Sprite | null = null;
  bossLayerAura: Graphics | null = null;
  pendingBossFrame: { frameKey: string; mood: string } | null = null;
  routeAssistPreview: Graphics | null = null;
  selectionFocusOverlay: Graphics | null = null;
  objectiveMarkerLayer: Container | null = null;
  bossWarningIndex = 0;
  geometryGuardFrame = 0;
  selectionGeometrySnapshots = new Map<string, { rootScaleX: number; rootScaleY: number; spriteWidth: number; spriteHeight: number }>();
  lastSelectionFollowAt = 0;
  lastBossWarningAt = 0;
  bossWarningCooldownMs = 520;
  renderBudgetName: RenderBudgetName = 'balanced';
  renderBudgetFrame = 0;

  setQuality(profile: DeviceProfile) {
    this.quality = profile;
    document.body.dataset.quality = profile.tier;
  }

  setRenderBudget(name: RenderBudgetName | string = 'balanced') {
    const normalized: RenderBudgetName = name === 'lite' || name === 'rich' ? name : 'balanced';
    this.renderBudgetName = normalized;
    document.body.dataset.pixiRenderBudget = `${ENGINE_RENDER_BUDGET_TUNING_PATCH}-${normalized}`;
    document.body.dataset.lowEndRenderBudgetGuard = LOW_END_RENDER_BUDGET_GUARD_PATCH;
  }

  private getRenderBudgetProfile(): RenderBudgetProfile {
    if (this.renderBudgetName === 'lite') return { name: 'lite', particleScale: 0.46, particleCap: 11, spriteStride: 3, warningAlphaScale: 0.54, burstScale: 0.7 };
    if (this.renderBudgetName === 'rich') return { name: 'rich', particleScale: 1.08, particleCap: 34, spriteStride: 1, warningAlphaScale: 1, burstScale: 1.08 };
    return { name: 'balanced', particleScale: 0.74, particleCap: 22, spriteStride: 1, warningAlphaScale: 0.78, burstScale: 0.88 };
  }

  async preloadTileAtlas() {
    if (!this.tileAtlasReady) {
      this.tileAtlasReady = Promise.all(tileAtlasAssets.map(async (asset) => {
        await Assets.load(asset).catch(() => null);
        this.assetCache.add(asset);
      })).then(() => undefined);
    }
    await this.tileAtlasReady;
  }

  async preloadBossFrameAtlas() {
    if (!this.bossAtlasReady) {
      this.bossAtlasReady = Promise.all(bossFrameAtlasAssets.map(async (asset) => {
        await Assets.load(asset).catch(() => null);
        this.assetCache.add(asset);
      })).then(() => undefined);
    }
    await this.bossAtlasReady;
  }

  syncPixiBossLayer(frameKey = '', mood = 'idle') {
    this.pendingBossFrame = { frameKey, mood };
    if (!this.boardApp || !frameKey) return;
    void this.preloadBossFrameAtlas().then(() => this.applyPixiBossLayer(frameKey, mood));
  }

  private applyPixiBossLayer(frameKey: string, mood: string) {
    if (!this.boardApp || !this.boardLayers.ui || !frameKey) return;
    const texture = this.resolveBossFrameTexture(frameKey);
    if (!texture) return;
    if (!this.bossLayerAura) {
      this.bossLayerAura = new Graphics().circle(0, 0, 58).fill({ color: PALETTE.violet, alpha: 0.18 }).circle(0, 0, 36).fill({ color: PALETTE.sky, alpha: 0.14 });
      this.bossLayerAura.blendMode = 'add';
      this.boardLayers.ui.addChild(this.bossLayerAura);
    }
    if (!this.bossLayerSprite) {
      this.bossLayerSprite = new Sprite(texture);
      this.bossLayerSprite.anchor.set(0.5);
      this.boardLayers.ui.addChild(this.bossLayerSprite);
    }
    this.bossLayerSprite.texture = texture;
    const app = this.boardApp;
    const laneEchoEnabled = Boolean(document.querySelector<HTMLElement>('.boss-lane-echo[data-boss-board-clearance="v1077-boss-board-clearance"]'));
    const targetSize = laneEchoEnabled ? Math.max(32, Math.min(46, app.renderer.width * 0.1)) : Math.max(66, Math.min(112, app.renderer.width * 0.22));
    const fit = targetSize / Math.max(texture.width || targetSize, texture.height || targetSize);
    const scale = mood === 'break' ? fit * 1.12 : mood === 'warn' ? fit * 1.06 : fit;
    this.bossLayerSprite.scale.set(scale);
    this.bossLayerSprite.x = app.renderer.width - targetSize * 0.58;
    this.bossLayerSprite.y = Math.max(22, targetSize * 0.5);
    this.bossLayerSprite.alpha = laneEchoEnabled ? 0 : mood === 'idle' ? 0.72 : 0.96;
    this.bossLayerSprite.visible = !laneEchoEnabled;
    this.bossLayerSprite.renderable = !laneEchoEnabled;
    this.bossLayerSprite.eventMode = 'none';
    this.bossLayerSprite.rotation = mood === 'hit' ? -0.025 : mood === 'warn' ? 0.018 : 0;
    this.bossLayerAura.x = this.bossLayerSprite.x;
    this.bossLayerAura.y = this.bossLayerSprite.y;
    this.bossLayerAura.alpha = laneEchoEnabled ? 0 : mood === 'idle' ? 0.26 : 0.52;
    this.bossLayerAura.visible = !laneEchoEnabled;
    this.bossLayerAura.renderable = !laneEchoEnabled;
    const host = document.querySelector<HTMLElement>('.battle-stage');
    if (host) {
      host.dataset.bossLayer = 'pixi';
      host.dataset.bossLayerMood = mood;
      host.dataset.bossBoardClearance = BOSS_BOARD_CLEARANCE_PATCH;
      host.dataset.bossLayerPlacement = laneEchoEnabled ? 'statusbar-echo-v1077' : 'board-corner';
      host.dataset.bossLayerVisibility = laneEchoEnabled ? 'dom-lane-echo' : 'pixi-board-visible';
      host.dataset.lowEndRenderGuard = LOW_END_RENDER_BUDGET_GUARD_PATCH;
    }
    gsap.killTweensOf([this.bossLayerSprite, this.bossLayerAura]);
    if (mood !== 'idle') {
      gsap.fromTo(this.bossLayerSprite.scale, { x: scale * 0.88, y: scale * 0.88 }, { x: scale, y: scale, duration: 0.22 * this.quality.motionScale, ease: 'back.out(2.4)' });
      gsap.fromTo(this.bossLayerAura.scale, { x: 0.7, y: 0.7 }, { x: 1.22, y: 1.22, duration: 0.36 * this.quality.motionScale, ease: 'power2.out' });
    }
  }

  private resolveBossFrameTexture(frameKey: string) {
    try {
      const file = frameKey.split('/').pop() || frameKey;
      const texture = Assets.get(frameKey)
        || Assets.get(file)
        || Assets.get(`boss-frames-v2/${frameKey}`)
        || Assets.get(`assets/characters/${frameKey}`);
      if (texture instanceof Texture) return texture;
    } catch {
      // DOM fallback remains active if atlas lookup is unavailable.
    }
    return null;
  }

  async preloadAssets(assets: string[]) {
    if (assets.some((asset) => isV2StateAsset(asset))) await this.preloadTileAtlas();
    const targets = assets.filter((asset) => !this.assetCache.has(asset) && !isV2StateAsset(asset));
    await Promise.all(targets.map(async (asset) => {
      await Assets.load(asset).catch(() => null);
      this.assetCache.add(asset);
    }));
  }

  async initAmbient(host: HTMLElement) {
    this.ambientApp = new Application();
    await this.ambientApp.init({
      backgroundAlpha: 0,
      resizeTo: window,
      antialias: this.quality.tier !== 'low',
      autoDensity: true,
      resolution: this.quality.pixelRatio,
      preference: 'webgl'
    } as any);
    host.appendChild(this.ambientApp.canvas);
    this.ambientLayers = createLayers(['sky', 'far', 'bookshelf', 'pillars', 'particles', 'ui']);
    Object.values(this.ambientLayers).forEach((layer) => this.ambientApp!.stage.addChild(layer));
    this.paintAmbient();
    this.ambientApp.ticker.add(() => this.tickAmbient());
    window.addEventListener('pointermove', (event) => {
      const now = performance.now();
      if (now - this.lastPointerMove < 34) return;
      this.lastPointerMove = now;
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      this.ambientApp!.stage.x = x * -5 * this.quality.motionScale;
      this.ambientApp!.stage.y = y * -4 * this.quality.motionScale;
      document.body.style.setProperty('--parallax-y', String(y * this.quality.motionScale));
    }, { passive: true });
  }

  async initBoard(host: HTMLElement, onTileTap: TileTapHandler) {
    this.host = host;
    this.onTileTap = onTileTap;
    this.boardApp = new Application();
    await this.boardApp.init({
      backgroundAlpha: 0,
      resizeTo: host,
      antialias: this.quality.tier !== 'low',
      autoDensity: true,
      resolution: this.quality.pixelRatio,
      preference: 'webgl'
    } as any);
    host.innerHTML = '';
    host.appendChild(this.boardApp.canvas);
    this.boardViewport = new Container();
    this.boardApp.stage.addChild(this.boardViewport);
    this.boardLayers = createLayers(['runes', 'board', 'paths', 'particles', 'ui']);
    ['runes', 'board', 'paths', 'particles'].forEach((name) => this.boardViewport!.addChild(this.boardLayers[name]));
    this.boardApp.stage.addChild(this.boardLayers.ui);
    this.installCameraControls();
    this.boardApp.ticker.add((ticker: any) => this.tickBoard(ticker.deltaTime || 1));
    if (this.pendingBossFrame) this.syncPixiBossLayer(this.pendingBossFrame.frameKey, this.pendingBossFrame.mood);
  }

  async renderBoard(board: BoardCell[][]) {
    if (!this.boardApp) return;
    this.board = board;
    this.selectedKey = null;
    this.tileViews.clear();
    Object.values(this.boardLayers).forEach((layer) => layer.removeChildren());
    this.clearSelectionFocusOverlay();
    this.clearObjectiveMarkers();
    this.routeAssistPreview = null;
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    this.layout = this.calculateLayout(rows, cols);
    this.paintMagicCircle();
    const uniqueAssets = [...new Set(board.flat().filter(Boolean).flatMap((tile: any) => tile.stateAssets ? Object.values(tile.stateAssets) : [tile.asset]))];
    await this.preloadAssets(uniqueAssets);
    if (this.pendingBossFrame) this.syncPixiBossLayer(this.pendingBossFrame.frameKey, this.pendingBossFrame.mood);
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-atlas', uniqueAssets.some((asset) => isV2StateAsset(String(asset))) ? 'v2' : 'fallback');

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tile = board[row][col];
        if (!tile) continue;
        const x = this.layout.startX + col * this.layout.step;
        const y = this.layout.startY + row * this.layout.step;
        this.addTile(tile, row, col, x, y);
      }
    }
    this.configureBoardCamera(true);
    this.refreshObjectiveMarkers();
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-tile-geometry', 'locked');
  }

  setSelected(point: BoardPoint | null) {
    this.clearSelectionFocusOverlay();
    if (this.selectedKey) {
      const previous = this.tileViews.get(this.selectedKey);
      if (previous && !previous.removing) {
        this.lockTileViewScale(previous);
        this.applyTileStateTexture(previous, previous.tile.special && !previous.tile.specialRevealed ? previous.tile.special === 'locked' ? 'locked' : 'disabled' : 'normal');
        gsap.to(previous.glow, { alpha: 0.16, duration: 0.12 * this.quality.motionScale });
      }
    }
    this.selectedKey = point ? keyOf(point) : null;
    if (!point) return;
    const view = this.tileViews.get(keyOf(point));
    if (!view || view.removing) return;
    this.lockTileViewScale(view);
    this.captureSelectionGeometry(view);
    // Selection must never swap to selected PNG or touch tile/sprite scale.
    // The tile body stays normal; a separate world-space overlay marks selection.
    this.applyTileStateTexture(view, view.tile.special && !view.tile.specialRevealed ? view.tile.special === 'locked' ? 'locked' : 'disabled' : 'normal');
    gsap.fromTo(view.glow, { alpha: 0.24 }, { alpha: 0.52, duration: 0.12 * this.quality.motionScale, ease: 'sine.out' });
    this.drawSelectionFocusOverlay(view);
    this.keepSelectedTileComfortablyVisible(view);
    this.verifySelectionGeometrySnapshot(view);
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-selection-qa', REAL_DEVICE_SELECTION_QA_LABEL);
  }

  hint(points: BoardPoint[], path?: PaddedPathPoint[] | null) {
    points.forEach((point, index) => {
      const view = this.tileViews.get(keyOf(point));
      if (!view || view.removing) return;
      this.lockTileViewScale(view);
      this.captureSelectionGeometry(view);
      this.applyTileStateTexture(view, 'hint');
      window.setTimeout(() => {
        if (!view.removing && this.selectedKey !== keyOf(point)) this.applyTileStateTexture(view, 'normal');
      }, 820);
      this.drawHintFocusOverlay(view, index);
      this.verifySelectionGeometrySnapshot(view);
      this.emitSelectionWave(view.root.x, view.root.y, PALETTE.emerald);
    });
    this.drawRouteAssist(path, points);
    this.focusBoardPoints(points);
  }

  private keepSelectedTileComfortablyVisible(view: TileView) {
    if (!this.boardApp || this.layout.cameraMode !== 'panZoom') return;
    const now = performance.now();
    const profile = this.getBoardFocusProfile();
    if (now - this.lastSelectionFollowAt < profile.cooldownMs) return;
    const screenX = view.baseX * this.camera.scale + this.camera.x;
    const screenY = view.baseY * this.camera.scale + this.camera.y;
    const outX = screenX < profile.margin || screenX > this.camera.viewportWidth - profile.margin;
    const outY = screenY < profile.margin || screenY > this.camera.viewportHeight - profile.margin;
    if (!outX && !outY) return;
    this.lastSelectionFollowAt = now;
    const targetScale = Math.max(this.camera.minScale, Math.min(this.camera.maxScale, Math.max(this.camera.scale, profile.targetScale)));
    const nextX = this.camera.viewportWidth / 2 - view.baseX * targetScale;
    const nextY = this.camera.viewportHeight / 2 - view.baseY * targetScale;
    const blend = profile.followBlend;
    this.animateCameraTo(
      this.camera.x + (nextX - this.camera.x) * blend,
      this.camera.y + (nextY - this.camera.y) * blend,
      this.camera.scale + (targetScale - this.camera.scale) * blend,
      true
    );
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-board-focus-follow', profile.name);
  }

  async playMatchSequence(first: BoardPoint, second: BoardPoint, combo: number, onRemove: () => void, path?: PaddedPathPoint[] | null) {
    const a = this.tileViews.get(keyOf(first));
    const b = this.tileViews.get(keyOf(second));
    if (!a || !b) {
      onRemove();
      return;
    }
    a.removing = true;
    b.removing = true;
    this.cameraShake(Math.min(15, 4 + combo));
    this.lockTileViewScale(a);
    this.lockTileViewScale(b);
    this.captureSelectionGeometry(a);
    this.captureSelectionGeometry(b);
    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to([a.glow, b.glow], { alpha: 0.82, duration: 0.08 * this.quality.motionScale, ease: 'power2.out' })
        .add(() => this.drawConnectionBeamByPath(path, a.root.x, a.root.y, b.root.x, b.root.y), '>-0.01')
        .add(() => this.emitBoardPulse(combo), '>-0.01')
        .add(() => this.emitTileFragments(a.root.x, a.root.y, combo), '>-0.02')
        .add(() => this.emitTileFragments(b.root.x, b.root.y, combo), '<')
        .add(() => { this.verifySelectionGeometrySnapshot(a); this.verifySelectionGeometrySnapshot(b); }, '<')
        .to([a.root, b.root], { alpha: 0.28, y: (index: number, target: any) => target.y - this.tileSize * 0.08, duration: 0.12 * this.quality.motionScale, ease: 'power2.out' })
        .add(() => this.fireAtBoss((a.root.x + b.root.x) / 2, (a.root.y + b.root.y) / 2, combo))
        .to([a.root, b.root], { alpha: 0, duration: 0.12 * this.quality.motionScale, ease: 'sine.out' }, '<');
    });
    this.tileViews.delete(keyOf(first));
    this.tileViews.delete(keyOf(second));
    onRemove();
  }

  playMismatch(point: BoardPoint) {
    const view = this.tileViews.get(keyOf(point));
    if (!view || view.removing) return;
    gsap.killTweensOf(view.root);
    this.lockTileViewScale(view);
    gsap.fromTo(view.root, { x: view.baseX - 5 }, { x: view.baseX + 5, duration: 0.055, repeat: 3, yoyo: true, ease: 'sine.inOut', onUpdate: () => this.enforceTileBodyGeometry(view), onComplete: () => { view.root.x = view.baseX; this.lockTileViewScale(view); } });
    this.emitSelectionWave(view.baseX, view.baseY, PALETTE.violet);
  }

  setBossHp(percent: number, phase?: string) {
    const hp = Math.max(0, Math.round(percent));
    const core = document.querySelector<HTMLElement>('#boss-core');
    const label = document.querySelector<HTMLElement>('#boss-hp-label');
    const fill = document.querySelector<HTMLElement>('#boss-hp-fill');
    if (core) {
      core.dataset.phase = phase || (hp <= 25 ? 'danger' : hp <= 55 ? 'wounded' : 'stable');
      core.style.setProperty('--boss-hit-scale', String(1 + (100 - hp) / 520));
    }
    if (label) label.textContent = `HP ${hp}%`;
    if (fill) fill.style.transform = `scaleX(${hp / 100})`;
  }


  playSummerModifierVfx(modifiers: string[] = [], combo = 1, path?: PaddedPathPoint[] | null) {
    if (!this.boardApp || !this.boardLayers.particles) return;
    const seasonModifiers = modifiers.filter((modifier) => ['sunTide', 'pearlChain', 'festivalBoss'].includes(modifier));
    if (!seasonModifiers.length) return;
    const app = this.boardApp;
    const center = this.screenToWorld(app.renderer.width / 2, app.renderer.height / 2 + 10);
    const scaledTile = Math.max(24, this.tileSize * Math.max(0.64, this.camera.scale));
    const colors: Record<string, number> = { sunTide: PALETTE.goldLight, pearlChain: PALETTE.sky, festivalBoss: PALETTE.violet };
    seasonModifiers.forEach((modifier, index) => {
      const color = colors[modifier] || PALETTE.emerald;
      const ring = new Graphics()
        .circle(center.x, center.y, scaledTile * (0.88 + index * 0.22))
        .stroke({ color, width: Math.max(2, scaledTile * 0.048), alpha: modifier === 'festivalBoss' ? 0.52 : 0.42 });
      ring.label = `summer-event-vfx-${modifier}-${combo}`;
      ring.blendMode = 'add';
      this.boardLayers.particles.addChild(ring);
      gsap.to(ring.scale, { x: 1.8 + combo * 0.035, y: 1.8 + combo * 0.035, duration: 0.48 * this.quality.motionScale, ease: 'power2.out' });
      gsap.to(ring, { alpha: 0, duration: 0.52 * this.quality.motionScale, ease: 'power2.out', onComplete: () => ring.destroy() });
      if (modifier === 'sunTide') this.spawnVfxSprite(center.x - scaledTile * 0.52, center.y, 'import-vfx-02');
      if (modifier === 'pearlChain') this.spawnVfxSprite(center.x + scaledTile * 0.52, center.y, 'import-vfx-04');
      if (modifier === 'festivalBoss') this.spawnVfxSprite(center.x, center.y - scaledTile * 0.48, 'import-vfx-06');
    });
    if (path?.length && seasonModifiers.includes('pearlChain')) {
      this.drawRouteAssist(path);
    }
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-summer-event-vfx', SUMMER_EVENT_VFX_PATCH);
  }

  playSeasonPassRewardBurst(label = '태양 왕관') {
    if (!this.boardApp || !this.boardLayers.ui) return;
    const centerX = this.boardApp.renderer.width / 2;
    const y = Math.max(44, this.boardApp.renderer.height * 0.18);
    const badge = new Graphics()
      .roundRect(centerX - 92, y - 20, 184, 40, 20)
      .fill({ color: PALETTE.navy, alpha: 0.84 })
      .stroke({ color: PALETTE.goldLight, width: 2, alpha: 0.78 });
    badge.label = `season-pass-reward-${label}`;
    this.boardLayers.ui.addChild(badge);
    this.emitParticles(this.screenToWorld(centerX, y).x, this.screenToWorld(centerX, y).y, 22, PALETTE.goldLight);
    gsap.fromTo(badge, { alpha: 0, y: y + 12 }, { alpha: 1, y, duration: 0.18 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(badge, { alpha: 0, delay: 0.72 * this.quality.motionScale, duration: 0.28 * this.quality.motionScale, ease: 'sine.out', onComplete: () => badge.destroy() });
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-season-pass-reward', SUMMER_PASS_MISSIONS_PATCH);
  }

  playBossWarning(power = 7, pattern: 'column' | 'row' | 'cross' | 'diagonal' = 'column', bossId = 'forgotten-spirit') {
    const core = document.querySelector<HTMLElement>('#boss-core');
    if (!core) return;
    const now = performance.now();
    const tempo = this.getBossWarningTempo(bossId, now);
    const profile = this.getBossWarningDepthProfile(bossId);
    const adjustedPower = Math.max(3.5, power * tempo.powerScale);
    core.classList.add('boss-warning');
    core.dataset.warningPattern = pattern;
    core.dataset.bossWarningDepth = bossId;
    core.dataset.warningDepthPatch = 'v1040';
    core.dataset.bossWarningReadability = BOSS_WARNING_READABILITY_PATCH;
    core.dataset.bossFlowTempo = tempo.name;
    core.dataset.bossFlowTempoPatch = BOSS_FLOW_TEMPO_PATCH;
    window.setTimeout(() => core.classList.remove('boss-warning'), Math.round(profile.duration * tempo.durationScale * 1000 + 140));
    this.lastBossWarningAt = now;
    this.cameraShake(Math.round(adjustedPower * profile.widthBoost * tempo.shakeScale));
    this.drawBossWarningLane(adjustedPower, pattern, bossId, tempo);
    if (this.boardApp && tempo.spawnImpact) {
      const impact = this.screenToWorld(this.boardApp.renderer.width / 2, 42);
      this.spawnVfxSprite(impact.x, impact.y, bossId === 'sealed-page-golem' || pattern === 'diagonal' ? 'import-vfx-05' : 'import-vfx-06');
    }
  }

  private calculateLayout(rows: number, cols: number): BoardLayout {
    const app = this.boardApp!;
    const width = app.renderer.width;
    const height = app.renderer.height;
    const minSide = Math.min(width, height);
    const panZoom = rows * cols > 72 || rows > 8 || cols > 9;
    this.gap = panZoom ? Math.max(4, Math.min(7, Math.round(minSide / 112))) : Math.max(3, Math.min(6, Math.round(minSide / 126)));
    const sidePadding = panZoom ? 28 : width <= 380 ? 8 : 14;
    const topReserve = panZoom ? 34 : height <= 420 ? 26 : 38;
    const bottomReserve = panZoom ? 26 : height <= 420 ? 10 : 16;

    if (panZoom) {
      const cameraTile = Math.max(46, Math.min(this.quality.maxBoardTile, Math.round(minSide / 6.1)));
      this.tileSize = Math.round(cameraTile);
      const boardW = cols * this.tileSize + (cols - 1) * this.gap;
      const boardH = rows * this.tileSize + (rows - 1) * this.gap;
      const worldWidth = boardW + sidePadding * 2;
      const worldHeight = boardH + topReserve + bottomReserve;
      return {
        startX: sidePadding + this.tileSize / 2,
        startY: topReserve + this.tileSize / 2,
        step: this.tileSize + this.gap,
        rows,
        cols,
        worldWidth,
        worldHeight,
        cameraMode: 'panZoom'
      };
    }

    const maxTileW = (width - sidePadding - (cols - 1) * this.gap) / Math.max(cols, 1);
    const maxTileH = (height - topReserve - bottomReserve - (rows - 1) * this.gap) / Math.max(rows, 1);
    const rawTileSize = Math.min(this.quality.maxBoardTile, maxTileW, maxTileH);
    this.tileSize = Math.max(this.minReadableTile, rawTileSize);
    if (this.tileSize > rawTileSize) this.tileSize = Math.max(30, rawTileSize);
    const boardW = cols * this.tileSize + (cols - 1) * this.gap;
    const boardH = rows * this.tileSize + (rows - 1) * this.gap;
    const startX = (width - boardW) / 2 + this.tileSize / 2;
    const startY = Math.max(topReserve / 2 + this.tileSize / 2, (height - boardH) / 2 + this.tileSize / 2 + 10);
    return { startX, startY, step: this.tileSize + this.gap, rows, cols, worldWidth: width, worldHeight: height, cameraMode: 'fit' };
  }

  private updateBoardReadabilityTier() {
    const host = this.host || document.querySelector<HTMLElement>('#pixi-board-host');
    if (!host) return;
    const scaledTile = this.tileSize * this.camera.scale;
    const tier = scaledTile < 32 ? 'far-boost' : scaledTile < 38 ? 'far' : scaledTile > 58 ? 'close' : 'balanced';
    host.dataset.zoomReadability = tier;
    host.dataset.boardFocusBalance = BOARD_FOCUS_BALANCE_PATCH;
    host.dataset.mobileBoardFeel = MOBILE_BOARD_FEEL_PATCH;
    host.style.setProperty('--tile-readability-scale', String(Math.max(0.82, Math.min(1.18, 42 / Math.max(28, scaledTile)))));
    const stage = document.querySelector<HTMLElement>('.battle-stage');
    stage?.setAttribute('data-zoom-readability', tier);
    stage?.setAttribute('data-board-focus-balance', BOARD_FOCUS_BALANCE_PATCH);
    stage?.setAttribute('data-mobile-board-feel', MOBILE_BOARD_FEEL_PATCH);
    stage?.setAttribute('data-visual-priority', this.getVisualPriorityState(tier));
  }

  private configureBoardCamera(reset = false) {
    if (!this.boardApp || !this.boardViewport) return;
    const app = this.boardApp;
    const worldWidth = Math.max(this.layout.worldWidth, app.renderer.width);
    const worldHeight = Math.max(this.layout.worldHeight, app.renderer.height);
    const viewportWidth = app.renderer.width;
    const viewportHeight = app.renderer.height;
    const fitScale = Math.min(viewportWidth / worldWidth, viewportHeight / worldHeight);
    const panZoom = this.layout.cameraMode === 'panZoom';
    this.camera.viewportWidth = viewportWidth;
    this.camera.viewportHeight = viewportHeight;
    this.camera.worldWidth = worldWidth;
    this.camera.worldHeight = worldHeight;
    this.camera.minScale = panZoom ? Math.max(0.36, Math.min(0.78, fitScale * 1.02)) : Math.min(1, fitScale);
    this.camera.maxScale = panZoom ? 1.58 : 1.08;
    const nextScale = panZoom ? Math.max(this.camera.minScale, Math.min(0.88, this.camera.maxScale)) : Math.min(1, this.camera.maxScale);
    if (reset || !Number.isFinite(this.camera.scale)) this.camera.scale = nextScale;
    this.camera.scale = Math.max(this.camera.minScale, Math.min(this.camera.maxScale, this.camera.scale));
    if (reset) {
      this.camera.x = (viewportWidth - worldWidth * this.camera.scale) / 2;
      this.camera.y = (viewportHeight - worldHeight * this.camera.scale) / 2;
    }
    this.applyCameraTransform();
    const host = this.host || document.querySelector<HTMLElement>('#pixi-board-host');
    if (host) {
      host.dataset.cameraMode = panZoom ? 'pan-zoom' : 'fit';
      host.dataset.boardRows = String(this.layout.rows);
      host.dataset.boardCols = String(this.layout.cols);
      host.dataset.touchPrecision = 'cell-slope-guard';
      host.dataset.cameraGestureSeparation = CAMERA_GESTURE_SEPARATION_PATCH;
    }
    this.updateBoardReadabilityTier();
  }

  fitBoardView(animated = true) {
    if (!this.boardApp) return;
    const targetScale = this.camera.minScale;
    const targetX = (this.camera.viewportWidth - this.camera.worldWidth * targetScale) / 2;
    const targetY = (this.camera.viewportHeight - this.camera.worldHeight * targetScale) / 2;
    this.animateCameraTo(targetX, targetY, targetScale, animated);
  }

  centerBoardView(animated = true) {
    if (!this.boardApp) return;
    const targetX = (this.camera.viewportWidth - this.camera.worldWidth * this.camera.scale) / 2;
    const targetY = (this.camera.viewportHeight - this.camera.worldHeight * this.camera.scale) / 2;
    this.animateCameraTo(targetX, targetY, this.camera.scale, animated);
  }

  nudgeCameraZoom(factor: number, animated = true) {
    if (!this.boardApp) return;
    const canvas = this.boardApp.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    this.zoomAt(centerX, centerY, this.camera.scale * factor, animated);
  }

  focusBoardPoints(points: BoardPoint[], animated = true) {
    const views = points.map((point) => this.tileViews.get(keyOf(point))).filter(Boolean) as TileView[];
    if (!views.length || !this.boardApp) return;
    const centerX = views.reduce((sum, view) => sum + view.baseX, 0) / views.length;
    const centerY = views.reduce((sum, view) => sum + view.baseY, 0) / views.length;
    const targetScale = this.layout.cameraMode === 'panZoom' ? Math.min(this.camera.maxScale, Math.max(this.camera.scale, this.getBoardFocusProfile().targetScale)) : this.camera.scale;
    this.centerCameraOnWorld(centerX, centerY, targetScale, animated);
  }

  private centerCameraOnWorld(worldX: number, worldY: number, scale = this.camera.scale, animated = true) {
    const targetScale = Math.max(this.camera.minScale, Math.min(this.camera.maxScale, scale));
    const targetX = this.camera.viewportWidth / 2 - worldX * targetScale;
    const targetY = this.camera.viewportHeight / 2 - worldY * targetScale;
    this.animateCameraTo(targetX, targetY, targetScale, animated);
  }

  private screenToWorld(x: number, y: number) {
    const scale = Math.max(0.001, this.camera.scale);
    return {
      x: (x - this.camera.x) / scale,
      y: (y - this.camera.y) / scale
    };
  }


  private getBoardFocusProfile() {
    const scaledTile = this.tileSize * this.camera.scale;
    const boardArea = Math.max(1, this.layout.rows * this.layout.cols);
    const largeBoard = boardArea >= 90 || this.layout.rows >= 10 || this.layout.cols >= 10;
    const farZoom = scaledTile < 34;
    if (farZoom || largeBoard) {
      return {
        name: 'large-soft-follow-v1040',
        margin: Math.max(34, scaledTile * 0.56),
        targetScale: Math.min(farZoom ? 0.78 : 0.74, this.camera.maxScale),
        followBlend: farZoom ? 0.42 : 0.34,
        cooldownMs: farZoom ? 540 : 620
      };
    }
    return { name: 'near-edge-only-v1040', margin: Math.max(30, scaledTile * 0.5), targetScale: Math.min(0.72, this.camera.maxScale), followBlend: 0.32, cooldownMs: 650 };
  }

  private getVisualPriorityState(tier = 'balanced') {
    if (tier === 'far-boost') return 'tile-contrast-natural-v1040';
    if (tier === 'far') return 'boss-route-soft-v1040';
    return 'balanced-v1040';
  }

  private animateCameraTo(x: number, y: number, scale: number, animated = true) {
    gsap.killTweensOf(this.camera);
    const fromX = this.camera.x;
    const fromY = this.camera.y;
    const fromScale = this.camera.scale;
    this.camera.x = x;
    this.camera.y = y;
    this.camera.scale = Math.max(this.camera.minScale, Math.min(this.camera.maxScale, scale));
    if (!animated || this.quality.motionScale <= 0.05) {
      this.applyCameraTransform();
      return;
    }
    const target = { x: this.camera.x, y: this.camera.y, scale: this.camera.scale };
    this.camera.x = fromX;
    this.camera.y = fromY;
    this.camera.scale = fromScale;
    gsap.to(this.camera, {
      x: target.x,
      y: target.y,
      scale: target.scale,
      duration: 0.18 * this.quality.motionScale,
      ease: 'power2.out',
      onUpdate: () => this.applyCameraTransform(),
      onComplete: () => this.applyCameraTransform()
    });
  }

  private applyCameraTransform() {
    if (!this.boardViewport) return;
    this.clampCamera();
    this.boardViewport.scale.set(this.camera.scale);
    this.boardViewport.x = this.camera.x;
    this.boardViewport.y = this.camera.y;
    this.updateBoardReadabilityTier();
  }

  private clampCamera() {
    const scaledW = this.camera.worldWidth * this.camera.scale;
    const scaledH = this.camera.worldHeight * this.camera.scale;
    const pad = 12;
    if (scaledW <= this.camera.viewportWidth) {
      this.camera.x = (this.camera.viewportWidth - scaledW) / 2;
    } else {
      const minX = this.camera.viewportWidth - scaledW - pad;
      const maxX = pad;
      this.camera.x = Math.min(maxX, Math.max(minX, this.camera.x));
    }
    if (scaledH <= this.camera.viewportHeight) {
      this.camera.y = (this.camera.viewportHeight - scaledH) / 2;
    } else {
      const minY = this.camera.viewportHeight - scaledH - pad;
      const maxY = pad;
      this.camera.y = Math.min(maxY, Math.max(minY, this.camera.y));
    }
  }

  private zoomAt(clientX: number, clientY: number, nextScale: number, animated = false) {
    if (!this.boardApp) return;
    const canvas = this.boardApp.canvas as HTMLCanvasElement;
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    const scale = Math.max(this.camera.minScale, Math.min(this.camera.maxScale, nextScale));
    const localX = (x - this.camera.x) / this.camera.scale;
    const localY = (y - this.camera.y) / this.camera.scale;
    const targetX = x - localX * scale;
    const targetY = y - localY * scale;
    this.animateCameraTo(targetX, targetY, scale, animated);
  }

  private markCameraGestureState(mode: BoardCamera['gestureMode']) {
    this.camera.gestureMode = mode;
    const host = this.host || document.querySelector<HTMLElement>('#pixi-board-host');
    if (host) {
      host.dataset.cameraGestureSeparation = CAMERA_GESTURE_SEPARATION_PATCH;
      host.dataset.cameraGestureMode = mode;
    }
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-camera-gesture-separation', CAMERA_GESTURE_SEPARATION_PATCH);
  }

  private panCameraBy(dx: number, dy: number) {
    if (this.layout.cameraMode !== 'panZoom') return;
    this.camera.x += dx;
    this.camera.y += dy;
    this.applyCameraTransform();
    this.camera.panLockedUntil = performance.now() + 260;
    this.camera.tapSuppressedUntil = performance.now() + 180;
    this.markCameraGestureState('pan');
  }

  private shouldTreatWheelAsPan(event: WheelEvent) {
    if (event.ctrlKey || event.metaKey) return false;
    const absX = Math.abs(event.deltaX);
    const absY = Math.abs(event.deltaY);
    return absX > 0 && absX >= absY * 0.72;
  }

  private installCameraControls() {
    if (!this.boardApp) return;
    const canvas = this.boardApp.canvas as HTMLCanvasElement;
    canvas.style.touchAction = 'none';
    const distance = () => {
      const points = [...this.camera.pointers.values()];
      if (points.length < 2) return 0;
      return Math.hypot(points[0].x - points[1].x, points[0].y - points[1].y);
    };
    const midpoint = () => {
      const points = [...this.camera.pointers.values()];
      if (points.length < 2) return points[0] || { x: this.camera.viewportWidth / 2, y: this.camera.viewportHeight / 2 };
      return { x: (points[0].x + points[1].x) / 2, y: (points[0].y + points[1].y) / 2 };
    };
    canvas.addEventListener('pointerdown', (event) => {
      canvas.setPointerCapture?.(event.pointerId);
      this.camera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      this.camera.dragging = this.camera.pointers.size === 1;
      this.camera.moved = false;
      this.camera.lastX = event.clientX;
      this.camera.lastY = event.clientY;
      this.camera.gestureStartX = event.clientX;
      this.camera.gestureStartY = event.clientY;
      this.camera.pinchStarted = false;
      this.markCameraGestureState(this.camera.pointers.size >= 2 ? 'pinch' : 'idle');
      if (this.camera.pointers.size >= 2) {
        this.camera.pinchDistance = distance();
        this.camera.pinchScale = this.camera.scale;
      }
    });
    canvas.addEventListener('pointermove', (event) => {
      if (!this.camera.pointers.has(event.pointerId)) return;
      event.preventDefault();
      const previous = this.camera.pointers.get(event.pointerId)!;
      this.camera.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
      if (this.camera.pointers.size >= 2) {
        const currentDistance = distance();
        const ratio = this.camera.pinchDistance > 0 ? currentDistance / this.camera.pinchDistance : 1;
        const distanceDelta = Math.abs(currentDistance - this.camera.pinchDistance);
        if (!this.camera.pinchStarted && distanceDelta < 10 && Math.abs(ratio - 1) < 0.045) {
          this.camera.moved = true;
          this.camera.tapSuppressedUntil = performance.now() + 180;
          return;
        }
        this.camera.pinchStarted = true;
        if (this.camera.pinchDistance > 0 && currentDistance > 0 && performance.now() >= this.camera.panLockedUntil) {
          const center = midpoint();
          this.markCameraGestureState('pinch');
          this.zoomAt(center.x, center.y, this.camera.pinchScale * ratio);
          this.camera.moved = true;
          this.camera.tapSuppressedUntil = performance.now() + 220;
        }
        return;
      }
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      const totalMove = Math.abs(event.clientX - this.camera.gestureStartX) + Math.abs(event.clientY - this.camera.gestureStartY);
      if (totalMove > 7) this.camera.moved = true;
      if (this.camera.moved) this.panCameraBy(dx, dy);
    }, { passive: false });
    const release = (event: PointerEvent) => {
      if (this.camera.moved) this.camera.tapSuppressedUntil = performance.now() + 220;
      this.camera.pointers.delete(event.pointerId);
      if (this.camera.pointers.size < 2) {
        this.camera.pinchDistance = 0;
        this.camera.pinchStarted = false;
      }
      if (this.camera.pointers.size === 0) {
        this.camera.dragging = false;
        window.setTimeout(() => this.markCameraGestureState('idle'), 120);
      }
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      if (this.shouldTreatWheelAsPan(event)) {
        this.panCameraBy(-event.deltaX, -event.deltaY);
        return;
      }
      if (this.camera.pointers.size > 0 || performance.now() < this.camera.panLockedUntil) return;
      this.markCameraGestureState('wheel');
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAt(event.clientX, event.clientY, this.camera.scale * factor);
      this.camera.tapSuppressedUntil = performance.now() + 180;
    }, { passive: false });
  }


  private drawRouteAssist(path?: PaddedPathPoint[] | null, points: BoardPoint[] = []) {
    if (!this.boardLayers.paths) return;
    this.routeAssistPreview?.destroy();
    this.routeAssistPreview = null;
    const route = path?.length ? path.map((point) => this.paddedToCanvas(point)) : points.map((point) => {
      const view = this.tileViews.get(keyOf(point));
      return view ? { x: view.baseX, y: view.baseY } : null;
    }).filter(Boolean) as { x: number; y: number }[];
    if (route.length < 2) return;
    const preview = new Graphics();
    preview.blendMode = 'add';
    preview.moveTo(route[0].x, route[0].y);
    route.slice(1).forEach((point) => preview.lineTo(point.x, point.y));
    preview.stroke({ color: PALETTE.sky, width: Math.max(5, this.tileSize * 0.1), alpha: 0.46 });
    preview.moveTo(route[0].x, route[0].y);
    route.slice(1).forEach((point) => preview.lineTo(point.x, point.y));
    preview.stroke({ color: PALETTE.goldLight, width: Math.max(2, this.tileSize * 0.045), alpha: 0.88 });
    this.boardLayers.paths.addChild(preview);
    this.routeAssistPreview = preview;
    gsap.fromTo(preview, { alpha: 0.15 }, { alpha: 1, duration: 0.14 * this.quality.motionScale, ease: 'sine.out' });
    gsap.to(preview, { alpha: 0, delay: 0.78 * this.quality.motionScale, duration: 0.26 * this.quality.motionScale, ease: 'power2.out', onComplete: () => {
      if (this.routeAssistPreview === preview) this.routeAssistPreview = null;
      preview.destroy();
    } });
  }

  private isTapSuppressed() {
    return performance.now() < this.camera.tapSuppressedUntil;
  }

  private resolveTileAtlasTexture(tile: BoardTile, state: 'normal' | 'selected' | 'hint' | 'locked' | 'disabled' = 'normal') {
    if (!tile.type.startsWith('v2-tile-')) return null;
    const preferredFrame = `${tile.type}-${state}.png`;
    const fallbackFrame = `${tile.type}-normal.png`;
    try {
      const atlasTexture = Assets.get(preferredFrame)
        || Assets.get(`v2-tiles/${preferredFrame}`)
        || Assets.get(fallbackFrame)
        || Assets.get(`v2-tiles/${fallbackFrame}`);
      if (atlasTexture instanceof Texture) return atlasTexture;
    } catch {
      // Packed atlas lookup is first priority, but individual PNG fallback must remain safe.
    }
    return null;
  }

  private resolveTileTexture(tile: BoardTile, state: 'normal' | 'selected' | 'hint' | 'locked' | 'disabled' = 'normal') {
    const atlasTexture = this.resolveTileAtlasTexture(tile, state);
    if (atlasTexture) return atlasTexture;
    const asset = tile.stateAssets?.[state] || tile.stateAssets?.normal || tile.asset;
    const filename = asset.split('/').pop() || asset;
    try {
      const cachedTexture = Assets.get(filename)
        || Assets.get(`v2-state/${filename}`)
        || Assets.get(`assets/objects/v2-state/${filename}`)
        || Assets.get(`assets/objects/${filename}`)
        || Assets.get(asset);
      if (cachedTexture instanceof Texture) return cachedTexture;
    } catch {
      // Individual PNG remains the safe fallback.
    }
    return Texture.from(asset);
  }

  private resolveAssetTexture(asset: string) {
    const filename = asset.split('/').pop() || asset;
    try {
      const atlasTexture = Assets.get(filename)
        || Assets.get(`effects/${filename}`)
        || Assets.get(`assets/effects/${filename}`)
        || Assets.get(`characters/${filename}`)
        || Assets.get(`assets/characters/${filename}`)
        || Assets.get(asset);
      if (atlasTexture instanceof Texture) return atlasTexture;
    } catch {
      // Individual asset fallback is safe.
    }
    return Texture.from(asset);
  }

  private fitTileSprite(view: TileView) {
    // Pixi can briefly use source texture dimensions when atlas/image loading updates.
    // Re-apply explicit cell-bounded dimensions every time the tile is touched/ticked.
    const size = this.tileSize * TILE_SPRITE_RATIO;
    view.sprite.anchor.set(0.5);
    view.sprite.x = 0;
    view.sprite.y = 0;
    view.sprite.width = size;
    view.sprite.height = size;
  }

  private enforceTileBodyGeometry(view: TileView) {
    // v1.0.35 hard guard: effects, touch hit slop and camera follow may change, but the tile body never grows.
    // Do not set sprite.scale to 1 here; width/height are the safe cell-bounded contract.
    view.root.scale.set(1);
    view.root.pivot.set(0, 0);
    view.root.hitArea = createTileHitArea(this.tileSize);
    view.sprite.rotation = Math.max(-0.04, Math.min(0.04, view.sprite.rotation || 0));
    this.fitTileSprite(view);
    view.selectionRing.scale.set(1);
    view.selectionCore.scale.set(1);
    view.root.label = `${TILE_GEOMETRY_GUARD_LABEL}:${view.row}:${view.col}`;
    view.root.hitArea = createTileHitArea(this.tileSize);
  }

  private captureSelectionGeometry(view: TileView) {
    const key = keyOf({ row: view.row, col: view.col });
    this.selectionGeometrySnapshots.set(key, {
      rootScaleX: view.root.scale.x,
      rootScaleY: view.root.scale.y,
      spriteWidth: view.sprite.width,
      spriteHeight: view.sprite.height
    });
  }

  private verifySelectionGeometrySnapshot(view: TileView) {
    const key = keyOf({ row: view.row, col: view.col });
    const snapshot = this.selectionGeometrySnapshots.get(key);
    if (!snapshot || view.removing) return;
    const drift = Math.abs(view.root.scale.x - snapshot.rootScaleX)
      + Math.abs(view.root.scale.y - snapshot.rootScaleY)
      + Math.abs(view.sprite.width - snapshot.spriteWidth) / Math.max(snapshot.spriteWidth, 1)
      + Math.abs(view.sprite.height - snapshot.spriteHeight) / Math.max(snapshot.spriteHeight, 1);
    if (drift > TILE_GEOMETRY_EPSILON) {
      this.enforceTileBodyGeometry(view);
      this.captureSelectionGeometry(view);
    }
  }

  private assertTileBodyGeometry(view: TileView) {
    const expected = this.tileSize * TILE_SPRITE_RATIO;
    const drift = Math.abs(view.root.scale.x - 1) + Math.abs(view.root.scale.y - 1)
      + Math.abs(view.sprite.width - expected) / Math.max(expected, 1)
      + Math.abs(view.sprite.height - expected) / Math.max(expected, 1);
    if (drift > TILE_GEOMETRY_EPSILON && !view.removing) this.enforceTileBodyGeometry(view);
  }

  private lockTileViewScale(view: TileView) {
    gsap.killTweensOf([view.root.scale, view.sprite.scale, view.selectionRing.scale, view.selectionCore.scale]);
    this.enforceTileBodyGeometry(view);
  }

  private applyTileStateTexture(view: TileView, state: 'normal' | 'selected' | 'hint' | 'locked' | 'disabled') {
    const textureState = state === 'selected' ? 'normal' : state;
    if (view.tile.stateAssets && state !== 'selected') view.sprite.texture = this.resolveTileTexture(view.tile, textureState);
    this.fitTileSprite(view);
    view.sprite.alpha = state === 'disabled' ? 0.52 : state === 'locked' ? 0.72 : 1;
    view.selectionRing.scale.set(1);
    view.selectionCore.scale.set(1);
    // Per-tile selection graphics are kept dormant. Active selection is rendered by a separate overlay layer.
    view.selectionRing.alpha = 0;
    view.selectionCore.alpha = 0;
  }

  private addTile(tile: BoardTile, row: number, col: number, x: number, y: number) {
    const root = new Container();
    root.x = x;
    root.y = y;
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.label = `${TILE_GEOMETRY_GUARD_LABEL}:${row}:${col}`;
    root.hitArea = createTileHitArea(this.tileSize);

    const shadow = new Graphics().ellipse(0, this.tileSize * 0.34, this.tileSize * 0.38, this.tileSize * 0.12).fill({ color: PALETTE.navyDeep, alpha: 0.35 });
    const frame = new Graphics().roundRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize, this.tileSize * 0.24).fill({ color: PALETTE.navySoft, alpha: 0.72 }).stroke({ color: PALETTE.gold, width: 1.5, alpha: 0.45 });
    const specialColor = tile.special === 'locked' ? PALETTE.gold : tile.special === 'timeSeal' ? PALETTE.violet : tile.special === 'fog' ? PALETTE.sky : PALETTE.sky;
    const hiddenSpecial = Boolean(tile.special && !tile.specialRevealed);
    const glow = new Graphics().circle(0, 0, this.tileSize * 0.48).fill({ color: specialColor, alpha: tile.special ? 0.24 : 0.16 });
    glow.alpha = 0.16;
    const startState = hiddenSpecial ? tile.special === 'locked' ? 'locked' : 'disabled' : 'normal';
    const texture = this.resolveTileTexture(tile, startState);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = this.tileSize * TILE_SPRITE_RATIO;
    sprite.height = this.tileSize * TILE_SPRITE_RATIO;
    sprite.alpha = hiddenSpecial && tile.special === 'fog' ? 0.16 : hiddenSpecial ? 0.46 : 1;
    const rim = new Graphics().roundRect(-this.tileSize / 2 + 4, -this.tileSize / 2 + 4, this.tileSize - 8, this.tileSize - 8, this.tileSize * 0.2).stroke({ color: specialColor, width: tile.special ? 2.2 : 1.4, alpha: tile.special ? 0.58 : 0.2 });
    const selectionInset = Math.max(4, this.tileSize * SELECTION_INSET_RATIO);
    const selectionCore = new Graphics()
      .roundRect(-this.tileSize / 2 + selectionInset, -this.tileSize / 2 + selectionInset, this.tileSize - selectionInset * 2, this.tileSize - selectionInset * 2, this.tileSize * 0.18)
      .stroke({ color: PALETTE.sky, width: Math.max(1.8, this.tileSize * 0.038), alpha: 0.94 })
      .stroke({ color: PALETTE.gold, width: Math.max(1, this.tileSize * 0.018), alpha: 0.9 });
    selectionCore.alpha = 0;
    const selectionRing = new Graphics()
      .circle(0, 0, this.tileSize * SELECTION_RING_RATIO)
      .stroke({ color: PALETTE.gold, width: Math.max(1.6, this.tileSize * 0.035), alpha: 0.92 })
      .circle(0, 0, this.tileSize * 0.33)
      .stroke({ color: PALETTE.sky, width: Math.max(1, this.tileSize * 0.022), alpha: 0.7 });
    selectionRing.alpha = 0;
    selectionRing.blendMode = 'add';

    root.addChild(shadow, glow, frame, selectionCore, sprite, rim, selectionRing);
    if (tile.special) root.addChild(this.createSpecialBadge(tile.special, hiddenSpecial));
    root.on('pointertap', () => {
      if (this.isTapSuppressed()) return;
      this.onTileTap?.({ row, col });
    });
    this.boardLayers.board.addChild(root);
    const view: TileView = { root, sprite, glow, selectionRing, selectionCore, row, col, baseX: x, baseY: y, phase: Math.random() * Math.PI * 2, settling: true, removing: false, tile };
    this.tileViews.set(keyOf({ row, col }), view);
    this.enforceTileBodyGeometry(view);
    gsap.fromTo(root, { y: y + 12, alpha: 0 }, { y, alpha: 1, delay: (row + col) * 0.008, duration: 0.24 * this.quality.motionScale, ease: 'power2.out', onComplete: () => { view.settling = false; root.y = view.baseY; this.lockTileViewScale(view); } });
  }

  private createSpecialBadge(special: BoardTile['special'], hidden: boolean) {
    const badge = new Container();
    const color = special === 'locked' ? PALETTE.gold : special === 'timeSeal' ? PALETTE.violet : PALETTE.sky;
    const size = this.tileSize;
    const veilAlpha = hidden ? 0.34 : 0.1;
    const veil = new Graphics().roundRect(-size / 2 + 3, -size / 2 + 3, size - 6, size - 6, size * 0.22).fill({ color: PALETTE.navyDeep, alpha: veilAlpha });
    const mark = new Graphics();
    if (special === 'locked') {
      mark.roundRect(-size * 0.16, -size * 0.02, size * 0.32, size * 0.24, size * 0.04).stroke({ color, width: 2.4, alpha: 0.86 });
      mark.arc(0, -size * 0.02, size * 0.16, Math.PI, 0).stroke({ color, width: 2.2, alpha: 0.86 });
    } else if (special === 'timeSeal') {
      mark.circle(0, 0, size * 0.18).stroke({ color, width: 2.3, alpha: 0.86 });
      mark.moveTo(0, 0).lineTo(0, -size * 0.12).stroke({ color, width: 2, alpha: 0.86 });
      mark.moveTo(0, 0).lineTo(size * 0.1, size * 0.06).stroke({ color, width: 2, alpha: 0.86 });
    } else {
      mark.circle(0, 0, size * 0.17).fill({ color, alpha: 0.2 });
      mark.circle(-size * 0.05, -size * 0.03, size * 0.07).fill({ color, alpha: 0.55 });
      mark.circle(size * 0.07, size * 0.05, size * 0.06).fill({ color, alpha: 0.42 });
    }
    badge.addChild(veil, mark);
    badge.alpha = hidden ? 1 : 0.62;
    return badge;
  }

  private paintAmbient() {
    const app = this.ambientApp!;
    const { width, height } = app.renderer;
    this.ambientLayers.sky.removeChildren();
    this.ambientLayers.far.removeChildren();
    this.ambientLayers.bookshelf.removeChildren();
    this.ambientLayers.pillars.removeChildren();
    this.ambientLayers.particles.removeChildren();

    this.ambientLayers.sky.addChild(new Graphics().rect(0, 0, width, height).fill({ color: PALETTE.navy, alpha: 0.13 }));
    const moon = new Graphics().circle(width * 0.76, height * 0.13, Math.min(width, height) * 0.11).fill({ color: PALETTE.goldLight, alpha: 0.11 });
    this.ambientLayers.sky.addChild(moon);
    const dustCount = Math.round(28 * this.quality.particleScale);
    for (let i = 0; i < dustCount; i += 1) {
      const dust = new Graphics().circle(0, 0, Math.random() * 2 + 1).fill({ color: i % 3 === 0 ? PALETTE.gold : PALETTE.sky, alpha: 0.45 });
      dust.x = Math.random() * width;
      dust.y = Math.random() * height;
      (dust as any).speed = (0.15 + Math.random() * 0.45) * this.quality.motionScale;
      this.ambientLayers.particles.addChild(dust);
    }
  }

  private paintMagicCircle() {
    const app = this.boardApp!;
    const width = Math.max(app.renderer.width, this.layout.worldWidth || app.renderer.width);
    const height = Math.max(app.renderer.height, this.layout.worldHeight || app.renderer.height);
    const centerX = (this.layout.worldWidth || width) / 2;
    const centerY = (this.layout.worldHeight || height) / 2;
    const radius = Math.min(this.layout.worldWidth || width, this.layout.worldHeight || height) * 0.44;
    const base = new Graphics();
    base.circle(centerX, centerY, radius).stroke({ color: PALETTE.sky, width: 2, alpha: 0.2 });
    base.circle(centerX, centerY, radius * 0.74).stroke({ color: PALETTE.gold, width: 1.2, alpha: 0.22 });
    base.circle(centerX, centerY, radius * 0.48).stroke({ color: PALETTE.violet, width: 1, alpha: 0.13 });
    for (let i = 0; i < 24; i += 1) {
      const angle = (Math.PI * 2 * i) / 24;
      const x1 = centerX + Math.cos(angle) * radius * 0.84;
      const y1 = centerY + Math.sin(angle) * radius * 0.84;
      const x2 = centerX + Math.cos(angle) * radius;
      const y2 = centerY + Math.sin(angle) * radius;
      base.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: i % 2 ? PALETTE.emerald : PALETTE.violet, width: 1, alpha: 0.16 });
    }
    this.boardLayers.runes.addChild(base);
  }

  private clearSelectionFocusOverlay() {
    if (!this.selectionFocusOverlay) return;
    gsap.killTweensOf(this.selectionFocusOverlay);
    this.selectionFocusOverlay.destroy();
    this.selectionFocusOverlay = null;
  }

  private clearObjectiveMarkers() {
    if (!this.objectiveMarkerLayer) return;
    gsap.killTweensOf(this.objectiveMarkerLayer.children);
    this.objectiveMarkerLayer.destroy({ children: true });
    this.objectiveMarkerLayer = null;
  }

  private refreshObjectiveMarkers() {
    if (!this.boardLayers.paths) return;
    this.clearObjectiveMarkers();
    const layer = new Container();
    layer.label = 'objective-marker-layer';
    const hiddenSpecials = [...this.tileViews.values()]
      .filter((view) => Boolean(view.tile.special && !view.tile.specialRevealed && !view.removing))
      .sort((a, b) => this.getObjectiveMarkerPriority(b) - this.getObjectiveMarkerPriority(a));
    const markerPlan = this.getObjectiveMarkerDensity(hiddenSpecials.length);
    const stage = document.querySelector<HTMLElement>('.battle-stage');
    stage?.setAttribute('data-objective-marker-density', markerPlan.density);
    stage?.setAttribute('data-objective-marker-overflow', String(Math.max(0, hiddenSpecials.length - markerPlan.limit)));
    hiddenSpecials.slice(0, markerPlan.limit).forEach((view, index) => {
      const color = view.tile.special === 'locked' ? PALETTE.gold : view.tile.special === 'timeSeal' ? PALETTE.violet : PALETTE.sky;
      const marker = new Graphics();
      const radius = Math.max(4.2, this.tileSize * markerPlan.radiusRatio);
      const x = view.baseX + this.tileSize * 0.34;
      const y = view.baseY - this.tileSize * 0.34;
      marker.label = `objective-marker-${view.tile.special}-${index}`;
      marker.circle(x, y, radius).fill({ color, alpha: markerPlan.fillAlpha });
      marker.circle(x, y, radius * 0.56).fill({ color, alpha: markerPlan.coreAlpha });
      marker.circle(x, y, radius * 1.34).stroke({ color, width: Math.max(1, this.tileSize * 0.014), alpha: markerPlan.strokeAlpha });
      marker.blendMode = 'add';
      layer.addChild(marker);
      gsap.fromTo(marker, { alpha: markerPlan.minAlpha }, { alpha: markerPlan.maxAlpha, delay: index * markerPlan.delay, duration: markerPlan.duration * this.quality.motionScale, repeat: -1, yoyo: true, ease: 'sine.inOut' });
    });
    if (hiddenSpecials.length > markerPlan.limit) this.drawObjectiveOverflowMarker(layer, hiddenSpecials.length - markerPlan.limit);
    if (!layer.children.length) {
      layer.destroy();
      return;
    }
    this.boardLayers.paths.addChild(layer);
    this.objectiveMarkerLayer = layer;
  }

  private getObjectiveMarkerPriority(view: TileView) {
    const specialWeight = view.tile.special === 'locked' ? 30 : view.tile.special === 'timeSeal' ? 22 : view.tile.special === 'fog' ? 12 : 0;
    const centerX = (this.screenToWorld(this.camera.viewportWidth / 2, this.camera.viewportHeight / 2).x || this.camera.worldWidth / 2);
    const centerY = (this.screenToWorld(this.camera.viewportWidth / 2, this.camera.viewportHeight / 2).y || this.camera.worldHeight / 2);
    const dist = Math.hypot(view.baseX - centerX, view.baseY - centerY);
    const nearViewBonus = Math.max(0, 8 - dist / Math.max(this.tileSize * 1.8, 1));
    return specialWeight + nearViewBonus;
  }

  private getObjectiveMarkerDensity(count: number) {
    const boardArea = Math.max(1, this.layout.rows * this.layout.cols);
    const scaledTile = this.tileSize * this.camera.scale;
    const farZoom = scaledTile < 34;
    const boostFar = scaledTile < 30;
    const denseBoard = boardArea >= 96 || count > 10;
    const limit = boostFar ? 4 : farZoom ? 5 : denseBoard ? 7 : 9;
    const density = count > limit ? 'compressed-v1040' : denseBoard ? 'balanced-v1040' : 'open-v1040';
    return {
      density,
      limit,
      radiusRatio: density === 'compressed-v1040' ? 0.061 : 0.086,
      fillAlpha: density === 'compressed-v1040' ? 0.1 : 0.16,
      coreAlpha: density === 'compressed-v1040' ? 0.54 : 0.76,
      strokeAlpha: density === 'compressed-v1040' ? 0.3 : 0.48,
      minAlpha: density === 'compressed-v1040' ? 0.28 : 0.44,
      maxAlpha: density === 'compressed-v1040' ? 0.62 : 0.88,
      delay: density === 'compressed-v1040' ? 0.014 : 0.028,
      duration: density === 'compressed-v1040' ? 0.74 : 0.56
    };
  }

  private drawObjectiveOverflowMarker(layer: Container, overflowCount: number) {
    const x = this.camera.worldWidth - Math.max(28, this.tileSize * 0.58);
    const y = Math.max(26, this.tileSize * 0.55);
    const radius = Math.max(6, this.tileSize * 0.115);
    const marker = new Graphics();
    marker.label = `objective-marker-overflow-${overflowCount}`;
    marker.circle(x, y, radius * 1.46).fill({ color: PALETTE.gold, alpha: 0.1 });
    marker.circle(x, y, radius).stroke({ color: PALETTE.goldLight, width: Math.max(1, this.tileSize * 0.018), alpha: 0.46 });
    marker.circle(x, y, radius * 0.42).fill({ color: PALETTE.goldLight, alpha: 0.7 });
    marker.blendMode = 'add';
    layer.addChild(marker);
    gsap.fromTo(marker, { alpha: 0.32 }, { alpha: 0.76, duration: 0.72 * this.quality.motionScale, repeat: -1, yoyo: true, ease: 'sine.inOut' });
  }

  private drawSelectionFocusOverlay(view: TileView) {
    if (!this.boardLayers.paths) return;
    this.clearSelectionFocusOverlay();
    const inset = Math.max(5, this.tileSize * SELECTION_OVERLAY_INSET_RATIO);
    const size = this.tileSize - inset * 2;
    const stableStroke = Math.max(1.2, 1.9 / Math.max(this.camera.scale, 0.5));
    const x = view.baseX;
    const y = view.baseY;
    const overlay = new Graphics();
    overlay.blendMode = 'add';
    overlay.roundRect(x - size / 2, y - size / 2, size, size, this.tileSize * 0.18)
      .stroke({ color: PALETTE.sky, width: Math.max(stableStroke, this.tileSize * 0.022), alpha: 0.96 });
    overlay.roundRect(x - size / 2 + 3, y - size / 2 + 3, size - 6, size - 6, this.tileSize * 0.15)
      .stroke({ color: PALETTE.gold, width: Math.max(stableStroke * 0.72, this.tileSize * 0.014), alpha: 0.86 });
    const corner = Math.max(6, this.tileSize * 0.15);
    const left = x - size / 2;
    const right = x + size / 2;
    const top = y - size / 2;
    const bottom = y + size / 2;
    overlay.moveTo(left, top + corner).lineTo(left, top).lineTo(left + corner, top)
      .moveTo(right - corner, top).lineTo(right, top).lineTo(right, top + corner)
      .moveTo(right, bottom - corner).lineTo(right, bottom).lineTo(right - corner, bottom)
      .moveTo(left + corner, bottom).lineTo(left, bottom).lineTo(left, bottom - corner)
      .stroke({ color: PALETTE.goldLight, width: Math.max(stableStroke * 0.86, this.tileSize * 0.016), alpha: 0.92 });
    overlay.alpha = 0;
    this.boardLayers.paths.addChild(overlay);
    this.selectionFocusOverlay = overlay;
    gsap.to(overlay, { alpha: 1, duration: 0.1 * this.quality.motionScale, ease: 'sine.out' });
  }

  private drawHintFocusOverlay(view: TileView, index = 0) {
    if (!this.boardLayers.paths) return;
    const inset = Math.max(6, this.tileSize * 0.12);
    const size = this.tileSize - inset * 2;
    const stableStroke = Math.max(1.1, 1.7 / Math.max(this.camera.scale, 0.5));
    const hint = new Graphics();
    hint.blendMode = 'add';
    hint.roundRect(view.baseX - size / 2, view.baseY - size / 2, size, size, this.tileSize * 0.16)
      .stroke({ color: PALETTE.emerald, width: Math.max(stableStroke, this.tileSize * 0.018), alpha: 0.8 });
    hint.alpha = 0;
    this.boardLayers.paths.addChild(hint);
    gsap.to(hint, { alpha: 0.9, delay: index * 0.04, duration: 0.12 * this.quality.motionScale, yoyo: true, repeat: 3, ease: 'sine.inOut', onComplete: () => hint.destroy() });
  }

  private drawConnectionBeamByPath(path: PaddedPathPoint[] | null | undefined, x1: number, y1: number, x2: number, y2: number) {
    const points = path?.length ? path.map((point) => this.paddedToCanvas(point)) : [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    if (!points.length) return;
    const beam = new Graphics();
    beam.label = 'route-assist-priority-v1040-clear-readable';
    const routeWidth = this.tileSize * this.camera.scale < 34 ? 6.2 : 8;
    beam.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => beam.lineTo(point.x, point.y));
    beam.stroke({ color: PALETTE.sky, width: routeWidth, alpha: this.tileSize * this.camera.scale < 34 ? 0.68 : 0.8 });
    beam.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => beam.lineTo(point.x, point.y));
    beam.stroke({ color: PALETTE.goldLight, width: Math.max(2.1, routeWidth * 0.36), alpha: 0.94 });
    this.boardLayers.paths.addChild(beam);
    this.emitParticles(x1, y1, 14, PALETTE.gold);
    this.emitParticles(x2, y2, 14, PALETTE.sky);
    this.spawnVfxSprite((x1 + x2) / 2, (y1 + y2) / 2, comboVfxName(Math.abs(Math.round(x1 + y1 + x2 + y2))));
    gsap.to(beam, { alpha: 0, duration: 0.28 * this.quality.motionScale, ease: 'power2.out', onComplete: () => beam.destroy() });
  }

  private getBossWarningDepthProfile(bossId = 'default') {
    return BOSS_WARNING_DEPTH_PROFILES[bossId] || BOSS_WARNING_DEPTH_PROFILES.default;
  }


  private getBossWarningTempo(bossId = 'default', now = performance.now()) {
    const elapsed = now - this.lastBossWarningAt;
    const bossCooldown = bossId === 'sealed-page-golem' ? 680 : bossId === 'shadow-librarian' ? 480 : this.bossWarningCooldownMs;
    if (elapsed < bossCooldown) {
      return { name: 'cooldown-softened', powerScale: 0.62, durationScale: 0.78, shakeScale: 0.48, spawnImpact: false };
    }
    if (bossId === 'sealed-page-golem') return { name: 'heavy-slow', powerScale: 1.04, durationScale: 1.08, shakeScale: 0.88, spawnImpact: true };
    if (bossId === 'shadow-librarian') return { name: 'quick-slice', powerScale: 0.92, durationScale: 0.86, shakeScale: 0.74, spawnImpact: true };
    return { name: 'balanced-tempo', powerScale: 1, durationScale: 1, shakeScale: 0.8, spawnImpact: true };
  }

  private drawBossWarningLane(power: number, pattern: 'column' | 'row' | 'cross' | 'diagonal' = 'column', bossId = 'default', tempo = this.getBossWarningTempo(bossId)) {
    if (!this.boardApp || !this.boardLayers.paths || !this.boardLayers.ui) return;
    const app = this.boardApp;
    const profile = this.getBossWarningDepthProfile(bossId);
    const budget = this.getRenderBudgetProfile();
    const centerWorld = this.screenToWorld(app.renderer.width / 2, app.renderer.height / 2);
    const laneX = Math.max(0, Math.min(this.camera.worldWidth, centerWorld.x));
    const laneY = Math.max(0, Math.min(this.camera.worldHeight, centerWorld.y));
    const lane = new Graphics();
    lane.label = `boss-warning-depth-${bossId}-${pattern}-${this.bossWarningIndex += 1}`;
    lane.blendMode = 'add';
    const readabilityWidthScale = budget.name === 'lite' ? 0.72 : budget.name === 'balanced' ? 0.88 : 1;
    const strongWidth = Math.max(8, power * 1.72 * profile.widthBoost * tempo.powerScale * readabilityWidthScale);
    const coreWidth = Math.max(2, power * 0.34 * profile.widthBoost * tempo.powerScale * readabilityWidthScale);
    const drawLine = (x1: number, y1: number, x2: number, y2: number, color = profile.primary, coreColor = profile.aura) => {
      lane.moveTo(x1, y1).lineTo(x2, y2);
      lane.stroke({ color, width: strongWidth, alpha: profile.laneAlpha * budget.warningAlphaScale });
      lane.moveTo(x1, y1).lineTo(x2, y2);
      lane.stroke({ color: coreColor, width: coreWidth, alpha: profile.coreAlpha * budget.warningAlphaScale });
      if (bossId === 'shadow-librarian') {
        lane.moveTo(x1 + 3, y1 + 3).lineTo(x2 + 3, y2 + 3);
        lane.stroke({ color: profile.secondary, width: Math.max(1.4, coreWidth * 0.45), alpha: 0.38 * budget.warningAlphaScale });
      }
      if (bossId === 'sealed-page-golem') {
        lane.moveTo(x1 - 4, y1 - 4).lineTo(x2 - 4, y2 - 4);
        lane.stroke({ color: profile.secondary, width: Math.max(2, coreWidth * 0.6), alpha: 0.34 * budget.warningAlphaScale });
      }
    };
    if (pattern === 'row' || pattern === 'cross') drawLine(0, laneY, this.camera.worldWidth, laneY, profile.secondary);
    if (pattern === 'column' || pattern === 'cross') drawLine(laneX, 0, laneX, this.camera.worldHeight, profile.primary);
    if (pattern === 'diagonal') {
      drawLine(0, 0, this.camera.worldWidth, this.camera.worldHeight, profile.primary);
      drawLine(this.camera.worldWidth, 0, 0, this.camera.worldHeight, profile.secondary);
    }
    this.boardLayers.paths.addChild(lane);

    const flareThickness = Math.max(5, power * 1.32 * profile.widthBoost * readabilityWidthScale);
    const flare = new Graphics()
      .rect(0, 0, app.renderer.width, flareThickness)
      .fill({ color: pattern === 'row' ? profile.secondary : profile.primary, alpha: profile.flareAlpha * budget.warningAlphaScale })
      .rect(0, app.renderer.height - flareThickness, app.renderer.width, flareThickness)
      .fill({ color: profile.aura, alpha: profile.flareAlpha * budget.warningAlphaScale * 0.82 });
    flare.blendMode = 'add';
    this.boardLayers.ui.addChild(flare);
    gsap.to(lane, { alpha: 0, duration: profile.duration * tempo.durationScale * this.quality.motionScale, ease: 'power2.out', onComplete: () => lane.destroy() });
    gsap.to(flare, { alpha: 0, duration: Math.max(0.36, profile.duration * tempo.durationScale - 0.1) * this.quality.motionScale, ease: 'power2.out', onComplete: () => flare.destroy() });
  }

  private fireAtBoss(x: number, y: number, combo: number) {
    const app = this.boardApp!;
    const target = this.screenToWorld(app.renderer.width / 2, 18);
    const targetX = target.x;
    const targetY = target.y;
    const missile = new Graphics().circle(0, 0, 8 + Math.min(combo, 8)).fill({ color: PALETTE.goldLight, alpha: 1 });
    missile.x = x;
    missile.y = y;
    this.boardLayers.particles.addChild(missile);
    gsap.to(missile, { x: targetX, y: targetY, duration: 0.22 * this.quality.motionScale, ease: 'power2.in', onComplete: () => {
      this.emitParticles(targetX, targetY + 24, 28 + Math.round(combo * 2 * this.quality.particleScale), PALETTE.gold);
      this.spawnVfxSprite(targetX, targetY + 20, combo >= 5 ? 'import-vfx-06' : combo >= 4 ? 'import-vfx-05' : 'import-vfx-02');
      if (combo >= 5) this.emitParticles(targetX, targetY + 24, 38 + Math.round(combo * 2 * this.quality.particleScale), PALETTE.sky);
      this.flashBossHit();
      missile.destroy();
    }});
  }

  private flashBossHit() {
    const core = document.querySelector<HTMLElement>('#boss-core');
    if (!core) return;
    core.classList.remove('boss-hit');
    void core.offsetWidth;
    core.classList.add('boss-hit');
  }

  private emitSelectionWave(x: number, y: number, color: number) {
    const radius = Math.max(10, this.tileSize * SELECTION_WAVE_RATIO);
    const ring = new Graphics()
      .circle(0, 0, radius)
      .stroke({ color, width: Math.max(1.2, this.tileSize * 0.026), alpha: 0.58 });
    ring.x = x;
    ring.y = y;
    ring.blendMode = 'add';
    this.boardLayers.particles.addChild(ring);
    gsap.fromTo(ring, { alpha: 0.46, rotation: 0 }, { alpha: 0, rotation: Math.PI * 0.08, duration: 0.22 * this.quality.motionScale, ease: 'sine.out', onComplete: () => ring.destroy() });
  }

  private emitBoardPulse(combo: number) {
    const app = this.boardApp!;
    const center = this.screenToWorld(app.renderer.width / 2, app.renderer.height / 2 + 18);
    const farZoom = this.tileSize * this.camera.scale < 34;
    const budget = this.getRenderBudgetProfile();
    const pulse = new Graphics().circle(center.x, center.y, Math.min(app.renderer.width, app.renderer.height) * (farZoom ? 0.16 : 0.2) / Math.max(0.6, this.camera.scale)).stroke({ color: combo >= 4 ? PALETTE.gold : PALETTE.sky, width: (farZoom ? 2.6 : 4) * budget.burstScale, alpha: (farZoom ? 0.36 : 0.52) * budget.warningAlphaScale });
    this.boardLayers.particles.addChild(pulse);
    gsap.to(pulse.scale, { x: 2.5, y: 2.5, duration: 0.46 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(pulse, { alpha: 0, duration: 0.46 * this.quality.motionScale, onComplete: () => pulse.destroy() });
  }

  private spawnVfxSprite(x: number, y: number, name: string) {
    const budget = this.getRenderBudgetProfile();
    this.renderBudgetFrame += 1;
    if (budget.spriteStride > 1 && this.renderBudgetFrame % budget.spriteStride !== 0) return;
    const sprite = new Sprite(this.resolveAssetTexture(effectAsset(name)));
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    const scale = (0.36 + Math.random() * 0.16) * this.quality.motionScale * budget.burstScale;
    sprite.scale.set(scale);
    sprite.alpha = 0.88 * budget.warningAlphaScale;
    this.boardLayers.particles.addChild(sprite);
    gsap.to(sprite.scale, { x: scale * 1.8, y: scale * 1.8, duration: 0.38 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(sprite, { alpha: 0, rotation: Math.random() * 0.5 - 0.25, duration: 0.42 * this.quality.motionScale, ease: 'power2.out', onComplete: () => sprite.destroy() });
  }


  playClearRewardFlow(stars = 1, score = 0) {
    if (!this.boardApp || !this.boardLayers.particles || !this.boardLayers.ui) return;
    const app = this.boardApp;
    const center = this.screenToWorld(app.renderer.width / 2, app.renderer.height / 2);
    const rewardColor = stars >= 3 ? PALETTE.goldLight : stars >= 2 ? PALETTE.sky : PALETTE.emerald;
    const baseRadius = Math.max(this.tileSize * 1.24, Math.min(this.camera.worldWidth, this.camera.worldHeight) * 0.16);
    const ring = new Graphics()
      .circle(center.x, center.y, baseRadius)
      .stroke({ color: rewardColor, width: Math.max(2, this.tileSize * 0.045), alpha: 0.68 })
      .circle(center.x, center.y, baseRadius * 0.58)
      .stroke({ color: PALETTE.gold, width: Math.max(1.4, this.tileSize * 0.024), alpha: 0.52 });
    ring.label = `clear-reward-flow-${stars}-${score}`;
    ring.blendMode = 'add';
    this.boardLayers.particles.addChild(ring);
    const budget = this.getRenderBudgetProfile();
    const sparkleCount = Math.max(8, Math.min(budget.particleCap, Math.round((stars * 5 + Math.round(score / 9000)) * budget.particleScale)));
    for (let i = 0; i < sparkleCount; i += 1) {
      const angle = (Math.PI * 2 * i) / sparkleCount;
      const sparkle = new Graphics()
        .circle(0, 0, Math.max(2, this.tileSize * 0.04))
        .fill({ color: i % 2 ? PALETTE.sky : rewardColor, alpha: 0.88 });
      sparkle.x = center.x + Math.cos(angle) * baseRadius * 0.38;
      sparkle.y = center.y + Math.sin(angle) * baseRadius * 0.38;
      sparkle.blendMode = 'add';
      this.boardLayers.particles.addChild(sparkle);
      gsap.to(sparkle, {
        x: center.x + Math.cos(angle) * baseRadius * (0.92 + Math.random() * 0.18),
        y: center.y + Math.sin(angle) * baseRadius * (0.92 + Math.random() * 0.18),
        alpha: 0,
        duration: (0.48 + Math.random() * 0.16) * this.quality.motionScale,
        ease: 'power2.out',
        onComplete: () => sparkle.destroy()
      });
    }
    this.emitParticles(center.x, center.y, 18 + stars * 8, rewardColor);
    this.cameraShake(3 + stars * 1.6);
    document.querySelector<HTMLElement>('.battle-stage')?.setAttribute('data-clear-reward-flow', CLEAR_REWARD_FLOW_PATCH);
    gsap.to(ring.scale, { x: 1.86, y: 1.86, duration: 0.58 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.58 * this.quality.motionScale, ease: 'sine.out', onComplete: () => ring.destroy() });
  }

  private emitTileFragments(x: number, y: number, combo: number) {
    const budget = this.getRenderBudgetProfile();
    const count = Math.max(3, Math.min(9, Math.round((4 + combo) * this.quality.particleScale * budget.particleScale)));
    for (let i = 0; i < count; i += 1) {
      const index = ((i + combo * 3) % 24) + 1;
      const sprite = new Sprite(this.resolveAssetTexture(effectAsset(`v2-fragments/v2-fragment-${String(index).padStart(2, '0')}`)));
      sprite.anchor.set(0.5);
      sprite.x = x;
      sprite.y = y;
      const scale = (0.28 + Math.random() * 0.2) * this.quality.motionScale;
      sprite.scale.set(scale);
      sprite.alpha = 0.86;
      this.boardLayers.particles.addChild(sprite);
      gsap.to(sprite, {
        x: x + (Math.random() - 0.5) * 128,
        y: y + (Math.random() - 0.55) * 118,
        rotation: (Math.random() - 0.5) * 3.2,
        alpha: 0,
        duration: (0.42 + Math.random() * 0.22) * this.quality.motionScale,
        ease: 'power2.out',
        onComplete: () => sprite.destroy()
      });
    }
  }

  private emitParticles(x: number, y: number, count: number, color: number) {
    const budget = this.getRenderBudgetProfile();
    const finalCount = Math.max(3, Math.min(budget.particleCap, Math.round(count * this.quality.particleScale * budget.particleScale)));
    for (let i = 0; i < finalCount; i += 1) {
      const p = new Graphics().circle(0, 0, Math.random() * 3 + 2).fill({ color, alpha: 0.9 });
      p.x = x;
      p.y = y;
      this.boardLayers.particles.addChild(p);
      gsap.to(p, { x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 100, alpha: 0, duration: (0.45 + Math.random() * 0.28) * this.quality.motionScale, ease: 'power2.out', onComplete: () => p.destroy() });
    }
  }

  private cameraShake(power: number) {
    if (!this.boardViewport) return;
    const viewport = this.boardViewport;
    const amount = power * this.quality.motionScale * this.getRenderBudgetProfile().burstScale;
    const baseX = this.camera.x;
    const baseY = this.camera.y;
    gsap.killTweensOf(viewport);
    gsap.fromTo(viewport, { x: baseX - amount / 2, y: baseY + amount / 3 }, { x: baseX, y: baseY, duration: 0.28 * this.quality.motionScale, ease: 'elastic.out(1,0.35)', onComplete: () => this.applyCameraTransform() });
  }

  private paddedToCanvas(point: PaddedPathPoint) {
    return {
      x: this.layout.startX + (point.col - 1) * this.layout.step,
      y: this.layout.startY + (point.row - 1) * this.layout.step
    };
  }

  private tickAmbient() {
    const app = this.ambientApp;
    if (!app) return;
    for (const child of this.ambientLayers.particles.children as any[]) {
      child.y -= child.speed;
      child.x += Math.sin(performance.now() / 900 + child.y * 0.01) * 0.12 * this.quality.motionScale;
      if (child.y < -8) {
        child.y = app.renderer.height + 8;
        child.x = Math.random() * app.renderer.width;
      }
    }
  }

  private tickBoard(delta: number) {
    const runes = this.boardLayers.runes;
    if (runes) runes.alpha = 0.82 + Math.sin(performance.now() / 1600) * 0.1;
    if (runes) runes.rotation += 0.00055 * delta * this.quality.motionScale;
    for (const view of this.tileViews.values()) {
      if (view.removing) continue;
      this.assertTileBodyGeometry(view);
      if (!view.settling) this.enforceTileBodyGeometry(view);
      if (this.selectedKey === keyOf({ row: view.row, col: view.col })) this.verifySelectionGeometrySnapshot(view);
      if (view.settling) continue;
      view.root.y = view.baseY + Math.sin(performance.now() / 850 + view.phase + view.row * 0.8 + view.col * 0.3) * 1.4 * this.quality.motionScale;
      view.sprite.rotation = Math.sin(performance.now() / 1300 + view.phase) * 0.018 * this.quality.motionScale;
    }
  }
}

function createLayers(names: string[]) {
  return Object.fromEntries(names.map((name) => [name, new Container()])) as Record<string, Container>;
}

function keyOf(point: BoardPoint) {
  return `${point.row}:${point.col}`;
}

function comboVfxName(seed: number) {
  return `import-vfx-${String((seed % 6) + 1).padStart(2, '0')}`;
}
