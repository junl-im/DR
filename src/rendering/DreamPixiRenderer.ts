import { Application, Assets, Container, Graphics, Sprite, Texture, Text } from 'pixi.js';
import { gsap } from 'gsap';
import { PALETTE } from '../config/design';

export type BoardTile = {
  id: string;
  type: string;
  label: string;
  asset: string;
  theme?: string;
};

export type BoardCell = BoardTile | null;
export type BoardPoint = { row: number; col: number };
export type TileTapHandler = (point: BoardPoint) => void;

type TileView = {
  root: Container;
  sprite: Sprite;
  glow: Graphics;
  row: number;
  col: number;
  tile: BoardTile;
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
  gap = 8;
  selectedKey: string | null = null;
  onTileTap?: TileTapHandler;

  async initAmbient(host: HTMLElement) {
    this.ambientApp = new Application();
    await this.ambientApp.init({ backgroundAlpha: 0, resizeTo: window, antialias: true, preference: 'webgl' });
    host.appendChild(this.ambientApp.canvas);
    this.ambientLayers = createLayers(['sky', 'far', 'bookshelf', 'pillars', 'particles', 'ui']);
    Object.values(this.ambientLayers).forEach((layer) => this.ambientApp!.stage.addChild(layer));
    this.paintAmbient();
    this.ambientApp.ticker.add(() => this.tickAmbient());
    window.addEventListener('pointermove', (event) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      this.ambientApp!.stage.x = x * -5;
      this.ambientApp!.stage.y = y * -4;
      document.body.style.setProperty('--parallax-y', String(y));
    }, { passive: true });
  }

  async initBoard(host: HTMLElement, onTileTap: TileTapHandler) {
    this.host = host;
    this.onTileTap = onTileTap;
    this.boardApp = new Application();
    await this.boardApp.init({ backgroundAlpha: 0, resizeTo: host, antialias: true, preference: 'webgl' });
    host.innerHTML = '';
    host.appendChild(this.boardApp.canvas);
    this.boardLayers = createLayers(['runes', 'board', 'paths', 'particles', 'ui']);
    Object.values(this.boardLayers).forEach((layer) => this.boardApp!.stage.addChild(layer));
    this.boardApp.ticker.add((ticker: any) => this.tickBoard(ticker.deltaTime || 1));
  }

  async renderBoard(board: BoardCell[][]) {
    if (!this.boardApp) return;
    this.board = board;
    this.tileViews.clear();
    Object.values(this.boardLayers).forEach((layer) => layer.removeChildren());
    this.paintMagicCircle();
    const rows = board.length;
    const cols = board[0]?.length ?? 0;
    const width = this.boardApp.renderer.width;
    const height = this.boardApp.renderer.height;
    const maxTileW = (width - 38 - (cols - 1) * this.gap) / Math.max(cols, 1);
    const maxTileH = (height - 92 - (rows - 1) * this.gap) / Math.max(rows, 1);
    this.tileSize = Math.max(30, Math.min(72, maxTileW, maxTileH));
    const boardW = cols * this.tileSize + (cols - 1) * this.gap;
    const boardH = rows * this.tileSize + (rows - 1) * this.gap;
    const startX = (width - boardW) / 2 + this.tileSize / 2;
    const startY = Math.max(48, (height - boardH) / 2 + this.tileSize / 2 + 12);
    const uniqueAssets = [...new Set(board.flat().filter(Boolean).map((tile: any) => tile.asset))];
    await Promise.all(uniqueAssets.map((asset) => Assets.load(asset).catch(() => null)));

    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const tile = board[row][col];
        if (!tile) continue;
        const x = startX + col * (this.tileSize + this.gap);
        const y = startY + row * (this.tileSize + this.gap);
        this.addTile(tile, row, col, x, y);
      }
    }
  }

  setSelected(point: BoardPoint | null) {
    if (this.selectedKey) {
      const previous = this.tileViews.get(this.selectedKey);
      if (previous) {
        gsap.to(previous.root.scale, { x: 1, y: 1, duration: 0.16, ease: 'power2.out' });
        gsap.to(previous.glow, { alpha: 0.16, duration: 0.18 });
      }
    }
    this.selectedKey = point ? keyOf(point) : null;
    if (!point) return;
    const view = this.tileViews.get(keyOf(point));
    if (!view) return;
    gsap.to(view.root.scale, { x: 1.1, y: 1.1, duration: 0.1, ease: 'back.out(3)' });
    gsap.to(view.glow, { alpha: 0.92, duration: 0.12 });
    this.emitSelectionWave(view.root.x, view.root.y, PALETTE.sky);
  }

  hint(points: BoardPoint[]) {
    points.forEach((point, index) => {
      const view = this.tileViews.get(keyOf(point));
      if (!view) return;
      gsap.fromTo(view.root.scale, { x: 1, y: 1 }, { x: 1.14, y: 1.14, yoyo: true, repeat: 3, delay: index * 0.05, duration: 0.16, ease: 'sine.inOut' });
      this.emitSelectionWave(view.root.x, view.root.y, PALETTE.emerald);
    });
  }

  async playMatchSequence(first: BoardPoint, second: BoardPoint, combo: number, onRemove: () => void) {
    const a = this.tileViews.get(keyOf(first));
    const b = this.tileViews.get(keyOf(second));
    if (!a || !b) {
      onRemove();
      return;
    }
    this.cameraShake(Math.min(14, 4 + combo));
    await new Promise<void>((resolve) => {
      const tl = gsap.timeline({ onComplete: resolve });
      tl.to([a.root.scale, b.root.scale], { x: 1.18, y: 1.18, duration: 0.08, ease: 'power2.out' })
        .to([a.glow, b.glow], { alpha: 1, duration: 0.08 }, '<')
        .add(() => this.drawConnectionBeam(a.root.x, a.root.y, b.root.x, b.root.y), '>-0.01')
        .to([a.root, b.root], { alpha: 0.28, duration: 0.12, ease: 'power2.out' })
        .add(() => this.fireAtBoss((a.root.x + b.root.x) / 2, (a.root.y + b.root.y) / 2, combo))
        .to([a.root.scale, b.root.scale], { x: 0.55, y: 0.55, duration: 0.15, ease: 'back.in(2)' }, '<')
        .to([a.root, b.root], { alpha: 0, duration: 0.1 }, '<');
    });
    this.tileViews.delete(keyOf(first));
    this.tileViews.delete(keyOf(second));
    onRemove();
  }

  playMismatch(point: BoardPoint) {
    const view = this.tileViews.get(keyOf(point));
    if (!view) return;
    gsap.fromTo(view.root, { x: view.root.x - 4 }, { x: view.root.x + 4, duration: 0.05, repeat: 3, yoyo: true, ease: 'sine.inOut', onComplete: () => { view.root.x -= 4; } });
  }

  setBossHp(percent: number) {
    const core = document.querySelector<HTMLElement>('#boss-core');
    const label = document.querySelector<HTMLElement>('#boss-hp-label');
    if (core) core.style.transform = `scale(${1 + (100 - percent) / 460})`;
    if (label) label.textContent = `HP ${Math.max(0, Math.round(percent))}%`;
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
    const glow = new Graphics().circle(0, 0, this.tileSize * 0.62).fill({ color: PALETTE.sky, alpha: 0.2 });
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
    this.tileViews.set(keyOf({ row, col }), { root, sprite, glow, row, col, tile });
    root.scale.set(0.76);
    gsap.fromTo(root, { y: y + 16, alpha: 0 }, { y, alpha: 1, delay: (row + col) * 0.012, duration: 0.35, ease: 'back.out(1.8)' });
    gsap.to(root.scale, { x: 1, y: 1, delay: (row + col) * 0.012, duration: 0.35, ease: 'back.out(1.8)' });
  }

  private paintAmbient() {
    const app = this.ambientApp!;
    const { width, height } = app.renderer;
    this.ambientLayers.sky.removeChildren();
    this.ambientLayers.far.removeChildren();
    this.ambientLayers.bookshelf.removeChildren();
    this.ambientLayers.pillars.removeChildren();
    this.ambientLayers.particles.removeChildren();

    this.ambientLayers.sky.addChild(new Graphics().rect(0, 0, width, height).fill({ color: PALETTE.navy, alpha: 0.16 }));
    const moon = new Graphics().circle(width * 0.76, height * 0.13, Math.min(width, height) * 0.11).fill({ color: PALETTE.goldLight, alpha: 0.11 });
    this.ambientLayers.sky.addChild(moon);
    for (let i = 0; i < 28; i += 1) {
      const dust = new Graphics().circle(0, 0, Math.random() * 2 + 1).fill({ color: i % 3 === 0 ? PALETTE.gold : PALETTE.sky, alpha: 0.45 });
      dust.x = Math.random() * width;
      dust.y = Math.random() * height;
      (dust as any).speed = 0.15 + Math.random() * 0.45;
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

  private drawConnectionBeam(x1: number, y1: number, x2: number, y2: number) {
    const beam = new Graphics();
    beam.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: PALETTE.sky, width: 7, alpha: 0.88 });
    beam.moveTo(x1, y1).lineTo(x2, y2).stroke({ color: PALETTE.goldLight, width: 3, alpha: 1 });
    this.boardLayers.paths.addChild(beam);
    this.emitParticles(x1, y1, 14, PALETTE.gold);
    this.emitParticles(x2, y2, 14, PALETTE.sky);
    gsap.to(beam, { alpha: 0, duration: 0.24, ease: 'power2.out', onComplete: () => beam.destroy() });
  }

  private fireAtBoss(x: number, y: number, combo: number) {
    const app = this.boardApp!;
    const targetX = app.renderer.width / 2;
    const targetY = 18;
    const missile = new Graphics().circle(0, 0, 8 + Math.min(combo, 8)).fill({ color: PALETTE.goldLight, alpha: 1 });
    missile.x = x;
    missile.y = y;
    this.boardLayers.particles.addChild(missile);
    gsap.to(missile, { x: targetX, y: targetY, duration: 0.22, ease: 'power2.in', onComplete: () => {
      this.emitParticles(targetX, targetY + 24, 28 + combo * 2, PALETTE.gold);
      missile.destroy();
    }});
  }

  private emitSelectionWave(x: number, y: number, color: number) {
    const ring = new Graphics().circle(0, 0, 18).stroke({ color, width: 3, alpha: 0.82 });
    ring.x = x;
    ring.y = y;
    this.boardLayers.particles.addChild(ring);
    gsap.to(ring.scale, { x: 2.6, y: 2.6, duration: 0.32, ease: 'power2.out' });
    gsap.to(ring, { alpha: 0, duration: 0.32, onComplete: () => ring.destroy() });
  }

  private emitParticles(x: number, y: number, count: number, color: number) {
    for (let i = 0; i < count; i += 1) {
      const p = new Graphics().circle(0, 0, Math.random() * 3 + 2).fill({ color, alpha: 0.9 });
      p.x = x;
      p.y = y;
      this.boardLayers.particles.addChild(p);
      gsap.to(p, { x: x + (Math.random() - 0.5) * 120, y: y + (Math.random() - 0.5) * 100, alpha: 0, duration: 0.45 + Math.random() * 0.28, ease: 'power2.out', onComplete: () => p.destroy() });
    }
  }

  private cameraShake(power: number) {
    if (!this.boardApp) return;
    const stage = this.boardApp.stage;
    gsap.killTweensOf(stage);
    gsap.fromTo(stage, { x: -power / 2, y: power / 3 }, { x: 0, y: 0, duration: 0.28, ease: 'elastic.out(1,0.35)' });
  }

  private tickAmbient() {
    const app = this.ambientApp;
    if (!app) return;
    for (const child of this.ambientLayers.particles.children as any[]) {
      child.y -= child.speed;
      child.x += Math.sin(performance.now() / 900 + child.y * 0.01) * 0.12;
      if (child.y < -8) {
        child.y = app.renderer.height + 8;
        child.x = Math.random() * app.renderer.width;
      }
    }
  }

  private tickBoard(delta: number) {
    const runes = this.boardLayers.runes;
    if (runes) runes.alpha = 0.82 + Math.sin(performance.now() / 1600) * 0.1;
    for (const view of this.tileViews.values()) {
      view.root.y += Math.sin(performance.now() / 900 + view.row * 0.8 + view.col * 0.3) * 0.018;
    }
  }
}

function createLayers(names: string[]) {
  return Object.fromEntries(names.map((name) => [name, new Container()])) as Record<string, Container>;
}

function keyOf(point: BoardPoint) {
  return `${point.row}:${point.col}`;
}
