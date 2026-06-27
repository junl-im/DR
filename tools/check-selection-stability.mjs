import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const selectionBlock = renderer.match(/setSelected\(point: BoardPoint \| null\) \{[\s\S]*?\n  \}\n\n  hint\(/)?.[0] || '';
const addTileBlock = renderer.match(/private addTile\([\s\S]*?\n  \}\n\n  private createSpecialBadge/)?.[0] || '';
const errors = [];

if (!renderer.includes('private lockTileViewScale(view: TileView)')) errors.push('Missing tile scale lock helper.');
if (!selectionBlock.includes('this.lockTileViewScale(view)')) errors.push('Selected tile path must lock root/sprite/ring scale.');
if (/selectionRing\.scale|selectionCore\.scale|sprite\.scale|root\.scale/.test(selectionBlock.replace(/lockTileViewScale/g, ''))) {
  errors.push('setSelected must not animate or directly manipulate visible scale outside the scale lock helper.');
}
if (selectionBlock.includes('gsap.fromTo(view.selectionRing.scale') || selectionBlock.includes('gsap.to(view.root.scale')) {
  errors.push('Selection feedback must use glow/ring alpha or rotation, not scale animation.');
}
if (!renderer.includes("const textureState = state === 'selected' ? 'normal' : state")) errors.push('Selected state must keep the normal tile texture to prevent larger selected PNG frames.');

if (!renderer.includes('SELECTION_INSET_RATIO') || !renderer.includes('SELECTION_RING_RATIO') || !renderer.includes('SELECTION_WAVE_RATIO')) {
  errors.push('Selection effect must use bounded constants for ring, inset and wave sizing.');
}
if (addTileBlock.includes('tileSize * 0.72') || addTileBlock.includes('tileSize * 0.84') || addTileBlock.includes('tileSize * 0.62')) {
  errors.push('Selection ring/glow must stay inside the tile cell instead of drawing oversized overlays.');
}
if (renderer.includes('tl.to([a.root.scale, b.root.scale], { x: 1.06') || renderer.includes('root.scale], { x: 1.06')) {
  errors.push('Match start must not grow selected tile roots above natural size.');
}
if (renderer.includes('circle(0, 0, 18).stroke') || renderer.includes('x: 2.6, y: 2.6')) {
  errors.push('Old large selection wave is still present.');
}
if (!addTileBlock.includes("root.scale.set(0.88)") || addTileBlock.includes("back.out(1.8)")) errors.push('Tile spawn must avoid overshoot that can look like selection growth.');

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Selection stability check passed: selected tiles keep fixed size and use glow/rings only.');
