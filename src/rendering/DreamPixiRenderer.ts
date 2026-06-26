import { Application, Assets, Container, Graphics, Sprite, Texture } from 'pixi.js';
import { gsap } from 'gsap';
import { PALETTE } from '../config/design';
import type { DeviceProfile } from '../systems/performance';

export type BoardTile = {
  id: string;
  type: string;
  label: string;
  asset: string;
  theme?: string;
  special?: 'fog' | 'locked' | 'timeSeal';
  specialRevealed?: boolean;
};

export type BoardCell = BoardTile | null;
export type BoardPoint = { row: number; col: number };
export type PaddedPathPoint = { row: number; col: number };
export type TileTapHandler = (point: BoardPoint) => void;

type TileView = {
  root: Container;
  sprite: Sprite;
  glow: Graphics;
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
};

export class DreamPixiRenderer {
  ambientApp?: Application;
  boardApp?: Application;
  ambientLayers: Record<string, Container> = {};
  boardLayers: Record<string, Container> = {};
  tileViews = new Map<string, TileView>();
  board: BoardCell[][] = [];
  host?: HTMLElement;
  tileSize = 64;
  gap = 7;
  selectedKey: string | null = null;
  onTileTap?: TileTapHandler;
  assetCache = new Set<string>();
  quality: DeviceProfile = { tier: 'high', pixelRatio: 1.5, particleScale: 1, motionScale: 1, maxBoardTile: 72, reason: '기본값' };
  layout: BoardLayout = { startX: 0, startY: 0, step: 72, rows: 0, cols: 0 };
  lastPointerMove = 0;

  setQuality(profile: DeviceProfile) {
    this.quality = profile;
    document.body.dataset.quality = profile.tier;
  }

  async preloadAssets(assets: string[]) {
    const targets = assets.filter((asset) => !this.assetCache.has(asset));
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
    this.boardLayers = createLayers(['runes', 'board', 'paths', 'particles', 'ui']);
    Object.values(this.boardLayers).forEach((layer) => this.boardApp!.stage.addChild(layer));
    this.boardApp.ticker.add((ticker: any) => this.tickBoard(ticker.deltaTime || 1));
  }

  async renderBoard(board: BoardCell[][]) {
    if (!this.boardApp) return;
    this.board = board;
    this.selectedKey = null;
    this.tileViews.clear();
    Object.values(this.boardLayers).forEach((layer) => layer.removeChildren());
    this.paintMagicCircle();
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    this.layout = this.calculateLayout(rows, cols);
    const uniqueAssets = [...new Set(board.flat().filter(Boolean).map((tile: any) => tile.asset))];
    await this.preloadAssets(uniqueAssets);

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tile = board[row][col];
        if (!tile) continue;
        const x = this.layout.startX + col * this.layout.step;
        const y = this.layout.startY + row * this.layout.step;
        this.addTile(tile, row, col, x, y);
      }
    }
  }

  setSelected(point: BoardPoint | null) {
    if (this.selectedKey) {
      const previous = this.tileViews.get(this.selectedKey);
      if (previous && !previous.removing) {
        gsap.to(previous.root.scale, { x: 1, y: 1, duration: 0.16 * this.quality.motionScale, ease: 'power2.out' });
        gsap.to(previous.glow, { alpha: 0.16, duration: 0.18 * this.quality.motionScale });
      }
    }
    this.selectedKey = point ? keyOf(point) : null;
    if (!point) return;
    const view = this.tileViews.get(keyOf(point));
    if (!view || view.removing) return;
    gsap.to(view.root.scale, { x: 1.1, y: 1.1, duration: 0.1 * this.quality.motionScale, ease: 'back.out(3)' });
    gsap.to(view.glow, { alpha: 0.92, duration: 0.12 * this.quality.motionScale });
    this.emitSelectionWave(view.root.x, view.root.y, PALETTE.sky);
  }

  hint(points: BoardPoint[]) {
    points.forEach((point, index) => {
      const view = this.tileViews.get(keyOf(point));
      if (!view || view.removing) return;
      gsap.fromTo(view.root.scale, { x: 1, y: 1 }, { x: 1.14, y: 1.14, yoyo: true, repeat: 3, delay: index * 0.05, duration: 0.16 * this.quality.motionScale, ease: 'sine.inOut' });
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
      tl.to([a.root.scale, b.root.scale], { x: 1.2, y: 1.2, duration: 0.08 * this.quality.motionScale, ease: 'power2.out' })
        .to([a.glow, b.glow], { alpha: 1, duration: 0.08 * this.quality.motionScale }, '<')
        .add(() => this.drawConnectionBeamByPath(path, a.root.x, a.root.y, b.root.x, b.root.y), '>-0.01')
        .add(() => this.emitBoardPulse(combo), '>-0.01')
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

  setBossHp(percent: number) {
    const hp = Math.max(0, Math.round(percent));
    const core = document.querySelector<HTMLElement>('#boss-core');
    const label = document.querySelector<HTMLElement>('#boss-hp-label');
    const fill = document.querySelector<HTMLElement>('#boss-hp-fill');
    if (core) {
      core.dataset.phase = hp <= 25 ? 'danger' : hp <= 55 ? 'wounded' : 'stable';
      core.style.setProperty('--boss-hit-scale', String(1 + (100 - hp) / 520));
    }
    if (label) label.textContent = `HP ${hp}%`;
    if (fill) fill.style.transform = `scaleX(${hp / 100})`;
  }

  playBossWarning() {
    const core = document.querySelector<HTMLElement>('#boss-core');
    if (!core) return;
    core.classList.add('boss-warning');
    window.setTimeout(() => core.classList.remove('boss-warning'), 760);
    this.cameraShake(7);
  }

  private calculateLayout(rows: number, cols: number): BoardLayout {
    const app = this.boardApp!;
    const width = app.renderer.width;
    const height = app.renderer.height;
    const minSide = Math.min(width, height);
    this.gap = Math.max(4, Math.min(8, Math.round(minSide / 98)));
    const sidePadding = width <= 380 ? 22 : 34;
    const topReserve = height <= 420 ? 48 : 68;
    const bottomReserve = height <= 420 ? 22 : 34;
    const maxTileW = (width - sidePadding - (cols - 1) * this.gap) / Math.max(cols, 1);
    const maxTileH = (height - topReserve - bottomReserve - (rows - 1) * this.gap) / Math.max(rows, 1);
    this.tileSize = Math.max(26, Math.min(this.quality.maxBoardTile, maxTileW, maxTileH));
    const boardW = cols * this.tileSize + (cols - 1) * this.gap;
    const boardH = rows * this.tileSize + (rows - 1) * this.gap;
    const startX = (width - boardW) / 2 + this.tileSize / 2;
    const startY = Math.max(topReserve / 2 + this.tileSize / 2, (height - boardH) / 2 + this.tileSize / 2 + 10);
    return { startX, startY, step: this.tileSize + this.gap, rows, cols };
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
    const glow = new Graphics().circle(0, 0, this.tileSize * 0.62).fill({ color: specialColor, alpha: tile.special ? 0.28 : 0.2 });
    glow.alpha = 0.16;
    const texture = Texture.from(tile.asset);
    const sprite = new Sprite(texture);
    sprite.anchor.set(0.5);
    sprite.width = this.tileSize * 0.92;
    sprite.height = this.tileSize * 0.92;
    const rim = new Graphics().roundRect(-this.tileSize / 2 + 4, -this.tileSize / 2 + 4, this.tileSize - 8, this.tileSize - 8, this.tileSize * 0.2).stroke({ color: PALETTE.sky, width: 1.4, alpha: 0.2 });

    root.addChild(shadow, glow, frame, sprite, rim);
    root.on('pointertap', () => this.onTileTap?.({ row, col }));
    this.boardLayers.board.addChild(root);
    const view: TileView = { root, sprite, glow, row, col, baseX: x, baseY: y, phase: Math.random() * Math.PI * 2, settling: true, removing: false, tile };
    this.tileViews.set(keyOf({ row, col }), view);
    root.scale.set(0.76);
    gsap.fromTo(root, { y: y + 16, alpha: 0 }, { y, alpha: 1, delay: (row + col) * 0.01, duration: 0.32 * this.quality.motionScale, ease: 'back.out(1.8)', onComplete: () => { view.settling = false; root.y = view.baseY; } });
    gsap.to(root.scale, { x: 1, y: 1, delay: (row + col) * 0.01, duration: 0.32 * this.quality.motionScale, ease: 'back.out(1.8)' });
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
    const { width, height } = app.renderer;
    const centerX = width / 2;
    const centerY = height / 2 + 18;
    const radius = Math.min(width, height) * 0.42;
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
    if (!this.boardApp) return;
    const stage = this.boardApp.stage;
    gsap.killTweensOf(stage);
    const amount = power * this.quality.motionScale;
    gsap.fromTo(stage, { x: -amount / 2, y: amount / 3 }, { x: 0, y: 0, duration: 0.28 * this.quality.motionScale, ease: 'elastic.out(1,0.35)' });
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
