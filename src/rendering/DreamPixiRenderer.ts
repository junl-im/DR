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
    tapSuppressedUntil: 0
  };
  lastPointerMove = 0;
  tileAtlasReady: Promise<void> | null = null;
  bossAtlasReady: Promise<void> | null = null;
  bossLayerSprite: Sprite | null = null;
  bossLayerAura: Graphics | null = null;
  pendingBossFrame: { frameKey: string; mood: string } | null = null;

  setQuality(profile: DeviceProfile) {
    this.quality = profile;
    document.body.dataset.quality = profile.tier;
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
    const targetSize = Math.max(66, Math.min(112, app.renderer.width * 0.22));
    const fit = targetSize / Math.max(texture.width || targetSize, texture.height || targetSize);
    const scale = mood === 'break' ? fit * 1.12 : mood === 'warn' ? fit * 1.06 : fit;
    this.bossLayerSprite.scale.set(scale);
    this.bossLayerSprite.x = app.renderer.width - targetSize * 0.64;
    this.bossLayerSprite.y = Math.max(34, targetSize * 0.58);
    this.bossLayerSprite.alpha = mood === 'idle' ? 0.72 : 0.96;
    this.bossLayerSprite.rotation = mood === 'hit' ? -0.025 : mood === 'warn' ? 0.018 : 0;
    this.bossLayerAura.x = this.bossLayerSprite.x;
    this.bossLayerAura.y = this.bossLayerSprite.y;
    this.bossLayerAura.alpha = mood === 'idle' ? 0.26 : 0.52;
    const host = document.querySelector<HTMLElement>('.battle-stage');
    if (host) {
      host.dataset.bossLayer = 'pixi';
      host.dataset.bossLayerMood = mood;
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
  }

  setSelected(point: BoardPoint | null) {
    if (this.selectedKey) {
      const previous = this.tileViews.get(this.selectedKey);
      if (previous && !previous.removing) {
        this.lockTileViewScale(previous);
        this.applyTileStateTexture(previous, previous.tile.special && !previous.tile.specialRevealed ? previous.tile.special === 'locked' ? 'locked' : 'disabled' : 'normal');
        gsap.to(previous.glow, { alpha: 0.16, duration: 0.18 * this.quality.motionScale });
        gsap.to([previous.selectionRing, previous.selectionCore], { alpha: 0, duration: 0.12 * this.quality.motionScale });
      }
    }
    this.selectedKey = point ? keyOf(point) : null;
    if (!point) return;
    const view = this.tileViews.get(keyOf(point));
    if (!view || view.removing) return;
    this.lockTileViewScale(view);
    this.applyTileStateTexture(view, 'selected');
    gsap.fromTo(view.glow, { alpha: 0.62 }, { alpha: 1, duration: 0.16 * this.quality.motionScale, ease: 'sine.out' });
    gsap.fromTo(view.selectionRing, { alpha: 0.82 }, { alpha: 1, rotation: view.selectionRing.rotation + Math.PI * 0.1, duration: 0.22 * this.quality.motionScale, ease: 'power2.out' });
    gsap.fromTo(view.selectionCore, { alpha: 0.62 }, { alpha: 0.96, duration: 0.14 * this.quality.motionScale, ease: 'sine.out' });
    this.emitSelectionWave(view.root.x, view.root.y, PALETTE.sky);
  }

  hint(points: BoardPoint[]) {
    points.forEach((point, index) => {
      const view = this.tileViews.get(keyOf(point));
      if (!view || view.removing) return;
      this.applyTileStateTexture(view, 'hint');
      window.setTimeout(() => this.applyTileStateTexture(view, 'normal'), 740);
      gsap.fromTo(view.selectionRing.scale, { x: 0.98, y: 0.98 }, { x: 1.05, y: 1.05, yoyo: true, repeat: 3, delay: index * 0.05, duration: 0.16 * this.quality.motionScale, ease: 'sine.inOut' });
      this.emitSelectionWave(view.root.x, view.root.y, PALETTE.emerald);
    });
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
    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to([a.root.scale, b.root.scale], { x: 1.06, y: 1.06, duration: 0.08 * this.quality.motionScale, ease: 'power2.out' })
        .to([a.glow, b.glow], { alpha: 1, duration: 0.08 * this.quality.motionScale }, '<')
        .add(() => this.drawConnectionBeamByPath(path, a.root.x, a.root.y, b.root.x, b.root.y), '>-0.01')
        .add(() => this.emitBoardPulse(combo), '>-0.01')
        .add(() => this.emitTileFragments(a.root.x, a.root.y, combo), '>-0.02')
        .add(() => this.emitTileFragments(b.root.x, b.root.y, combo), '<')
        .to([a.root, b.root], { alpha: 0.3, duration: 0.12 * this.quality.motionScale, ease: 'power2.out' })
        .add(() => this.fireAtBoss((a.root.x + b.root.x) / 2, (a.root.y + b.root.y) / 2, combo))
        .to([a.root.scale, b.root.scale], { x: 0.55, y: 0.55, duration: 0.15 * this.quality.motionScale, ease: 'back.in(2)' }, '<')
        .to([a.root, b.root], { alpha: 0, duration: 0.1 * this.quality.motionScale }, '<');
    });
    this.tileViews.delete(keyOf(first));
    this.tileViews.delete(keyOf(second));
    onRemove();
  }

  playMismatch(point: BoardPoint) {
    const view = this.tileViews.get(keyOf(point));
    if (!view || view.removing) return;
    gsap.killTweensOf(view.root);
    gsap.fromTo(view.root, { x: view.baseX - 5 }, { x: view.baseX + 5, duration: 0.055, repeat: 3, yoyo: true, ease: 'sine.inOut', onComplete: () => { view.root.x = view.baseX; } });
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

  playBossWarning(power = 7) {
    const core = document.querySelector<HTMLElement>('#boss-core');
    if (!core) return;
    core.classList.add('boss-warning');
    window.setTimeout(() => core.classList.remove('boss-warning'), 760);
    this.cameraShake(power);
    if (this.boardApp) this.spawnVfxSprite(this.boardApp.renderer.width / 2, 42, 'import-vfx-06');
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
    this.camera.minScale = panZoom ? Math.max(0.34, Math.min(0.82, fitScale * 0.98)) : Math.min(1, fitScale);
    this.camera.maxScale = panZoom ? 1.65 : 1.08;
    const nextScale = panZoom ? Math.max(this.camera.minScale, Math.min(0.92, this.camera.maxScale)) : Math.min(1, this.camera.maxScale);
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
    }
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
        if (this.camera.pinchDistance > 0 && currentDistance > 0) {
          const center = midpoint();
          this.zoomAt(center.x, center.y, this.camera.pinchScale * (currentDistance / this.camera.pinchDistance));
          this.camera.moved = true;
          this.camera.tapSuppressedUntil = performance.now() + 180;
        }
        return;
      }
      if (this.layout.cameraMode !== 'panZoom') return;
      const dx = event.clientX - previous.x;
      const dy = event.clientY - previous.y;
      if (Math.abs(event.clientX - this.camera.lastX) + Math.abs(event.clientY - this.camera.lastY) > 6) this.camera.moved = true;
      if (this.camera.moved) {
        this.camera.x += dx;
        this.camera.y += dy;
        this.applyCameraTransform();
        this.camera.tapSuppressedUntil = performance.now() + 160;
      }
    }, { passive: false });
    const release = (event: PointerEvent) => {
      if (this.camera.moved) this.camera.tapSuppressedUntil = performance.now() + 180;
      this.camera.pointers.delete(event.pointerId);
      if (this.camera.pointers.size < 2) this.camera.pinchDistance = 0;
      if (this.camera.pointers.size === 0) this.camera.dragging = false;
    };
    canvas.addEventListener('pointerup', release);
    canvas.addEventListener('pointercancel', release);
    canvas.addEventListener('wheel', (event) => {
      event.preventDefault();
      const factor = event.deltaY < 0 ? 1.08 : 0.92;
      this.zoomAt(event.clientX, event.clientY, this.camera.scale * factor);
    }, { passive: false });
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

  private lockTileViewScale(view: TileView) {
    gsap.killTweensOf([view.root.scale, view.sprite.scale, view.selectionRing.scale, view.selectionCore.scale]);
    view.root.scale.set(1);
    view.sprite.scale.set(1);
    view.selectionRing.scale.set(1);
    view.selectionCore.scale.set(1);
  }

  private applyTileStateTexture(view: TileView, state: 'normal' | 'selected' | 'hint' | 'locked' | 'disabled') {
    const textureState = state === 'selected' ? 'normal' : state;
    if (view.tile.stateAssets) view.sprite.texture = this.resolveTileTexture(view.tile, textureState);
    view.sprite.alpha = state === 'disabled' ? 0.52 : state === 'locked' ? 0.72 : 1;
    view.sprite.scale.set(1);
    view.selectionRing.scale.set(1);
    view.selectionCore.scale.set(1);
    view.selectionRing.alpha = state === 'selected' ? 1 : state === 'hint' ? 0.72 : 0;
    view.selectionCore.alpha = state === 'selected' ? 0.9 : 0;
  }

  private addTile(tile: BoardTile, row: number, col: number, x: number, y: number) {
    const root = new Container();
    root.x = x;
    root.y = y;
    root.eventMode = 'static';
    root.cursor = 'pointer';
    root.label = tile.label;

    const shadow = new Graphics().ellipse(0, this.tileSize * 0.34, this.tileSize * 0.38, this.tileSize * 0.12).fill({ color: PALETTE.navyDeep, alpha: 0.35 });
    const frame = new Graphics().roundRect(-this.tileSize / 2, -this.tileSize / 2, this.tileSize, this.tileSize, this.tileSize * 0.24).fill({ color: PALETTE.navySoft, alpha: 0.72 }).stroke({ color: PALETTE.gold, width: 1.5, alpha: 0.45 });
    const specialColor = tile.special === 'locked' ? PALETTE.gold : tile.special === 'timeSeal' ? PALETTE.violet : tile.special === 'fog' ? PALETTE.sky : PALETTE.sky;
    const hiddenSpecial = Boolean(tile.special && !tile.specialRevealed);
    const glow = new Graphics().circle(0, 0, this.tileSize * 0.62).fill({ color: specialColor, alpha: tile.special ? 0.28 : 0.2 });
    glow.alpha = 0.16;
    const startState = hiddenSpecial ? tile.special === 'locked' ? 'locked' : 'disabled' : 'normal';
    const texture = this.resolveTileTexture(tile, startState);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = this.tileSize * 0.98;
    sprite.height = this.tileSize * 0.98;
    sprite.alpha = hiddenSpecial && tile.special === 'fog' ? 0.16 : hiddenSpecial ? 0.46 : 1;
    const rim = new Graphics().roundRect(-this.tileSize / 2 + 4, -this.tileSize / 2 + 4, this.tileSize - 8, this.tileSize - 8, this.tileSize * 0.2).stroke({ color: specialColor, width: tile.special ? 2.2 : 1.4, alpha: tile.special ? 0.58 : 0.2 });
    const selectionCore = new Graphics()
      .roundRect(-this.tileSize / 2 - 3, -this.tileSize / 2 - 3, this.tileSize + 6, this.tileSize + 6, this.tileSize * 0.26)
      .stroke({ color: PALETTE.sky, width: Math.max(3, this.tileSize * 0.07), alpha: 0.95 })
      .stroke({ color: PALETTE.gold, width: Math.max(1.5, this.tileSize * 0.03), alpha: 0.98 });
    selectionCore.alpha = 0;
    const selectionRing = new Graphics()
      .circle(0, 0, this.tileSize * 0.72)
      .stroke({ color: PALETTE.gold, width: Math.max(2.5, this.tileSize * 0.055), alpha: 0.96 })
      .circle(0, 0, this.tileSize * 0.84)
      .stroke({ color: PALETTE.sky, width: Math.max(1.5, this.tileSize * 0.035), alpha: 0.72 });
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
    root.scale.set(0.88);
    gsap.fromTo(root, { y: y + 16, alpha: 0 }, { y, alpha: 1, delay: (row + col) * 0.01, duration: 0.32 * this.quality.motionScale, ease: 'power2.out', onComplete: () => { view.settling = false; root.y = view.baseY; } });
    gsap.to(root.scale, { x: 1, y: 1, delay: (row + col) * 0.01, duration: 0.26 * this.quality.motionScale, ease: 'power2.out' });
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

  private drawConnectionBeamByPath(path: PaddedPathPoint[] | null | undefined, x1: number, y1: number, x2: number, y2: number) {
    const points = path?.length ? path.map((point) => this.paddedToCanvas(point)) : [{ x: x1, y: y1 }, { x: x2, y: y2 }];
    if (!points.length) return;
    const beam = new Graphics();
    beam.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => beam.lineTo(point.x, point.y));
    beam.stroke({ color: PALETTE.sky, width: 8, alpha: 0.8 });
    beam.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((point) => beam.lineTo(point.x, point.y));
    beam.stroke({ color: PALETTE.goldLight, width: 3, alpha: 1 });
    this.boardLayers.paths.addChild(beam);
    this.emitParticles(x1, y1, 14, PALETTE.gold);
    this.emitParticles(x2, y2, 14, PALETTE.sky);
    this.spawnVfxSprite((x1 + x2) / 2, (y1 + y2) / 2, comboVfxName(Math.abs(Math.round(x1 + y1 + x2 + y2))));
    gsap.to(beam, { alpha: 0, duration: 0.28 * this.quality.motionScale, ease: 'power2.out', onComplete: () => beam.destroy() });
  }

  private fireAtBoss(x: number, y: number, combo: number) {
    const app = this.boardApp!;
    const targetX = app.renderer.width / 2;
    const targetY = 18;
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
    const ring = new Graphics().circle(0, 0, 18).stroke({ color, width: 3, alpha: 0.82 });
    ring.x = x;
    ring.y = y;
    this.boardLayers.particles.addChild(ring);
    gsap.to(ring.scale, { x: 2.6, y: 2.6, duration: 0.32 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.32 * this.quality.motionScale, onComplete: () => ring.destroy() });
  }

  private emitBoardPulse(combo: number) {
    const app = this.boardApp!;
    const pulse = new Graphics().circle(app.renderer.width / 2, app.renderer.height / 2 + 18, Math.min(app.renderer.width, app.renderer.height) * 0.2).stroke({ color: combo >= 4 ? PALETTE.gold : PALETTE.sky, width: 4, alpha: 0.52 });
    this.boardLayers.particles.addChild(pulse);
    gsap.to(pulse.scale, { x: 2.5, y: 2.5, duration: 0.46 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(pulse, { alpha: 0, duration: 0.46 * this.quality.motionScale, onComplete: () => pulse.destroy() });
  }

  private spawnVfxSprite(x: number, y: number, name: string) {
    const sprite = new Sprite(this.resolveAssetTexture(effectAsset(name)));
    sprite.anchor.set(0.5);
    sprite.x = x;
    sprite.y = y;
    const scale = (0.36 + Math.random() * 0.16) * this.quality.motionScale;
    sprite.scale.set(scale);
    sprite.alpha = 0.88;
    this.boardLayers.particles.addChild(sprite);
    gsap.to(sprite.scale, { x: scale * 1.8, y: scale * 1.8, duration: 0.38 * this.quality.motionScale, ease: 'power2.out' });
    gsap.to(sprite, { alpha: 0, rotation: Math.random() * 0.5 - 0.25, duration: 0.42 * this.quality.motionScale, ease: 'power2.out', onComplete: () => sprite.destroy() });
  }


  private emitTileFragments(x: number, y: number, combo: number) {
    const count = Math.max(3, Math.min(9, Math.round((4 + combo) * this.quality.particleScale)));
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
    const finalCount = Math.max(4, Math.round(count * this.quality.particleScale));
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
    const amount = power * this.quality.motionScale;
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
      if (view.settling || view.removing) continue;
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
