import { readFileSync } from 'node:fs';

const renderer = readFileSync('src/rendering/DreamPixiRenderer.ts', 'utf8');
const selectionBlock = renderer.match(/setSelected\(point: BoardPoint \| null\) \{[\s\S]*?\n  \}\n\n  hint\(/)?.[0] || '';
const addTileBlock = renderer.match(/private addTile\([\s\S]*?\n  \}\n\n  private createSpecialBadge/)?.[0] || '';
const applyBlock = renderer.match(/private applyTileStateTexture\([\s\S]*?\n  \}\n\n  private addTile/)?.[0] || '';
const lockBlock = renderer.match(/private lockTileViewScale\([\s\S]*?\n  \}\n\n  private applyTileStateTexture/)?.[0] || '';
const errors = [];

if (!renderer.includes('private fitTileSprite(view: TileView)')) errors.push('Missing fitTileSprite helper for texture swap size normalization.');
if (!renderer.includes('TILE_GEOMETRY_GUARD_LABEL') || !renderer.includes('enforceTileBodyGeometry') || !renderer.includes('assertTileBodyGeometry')) errors.push('Missing v1.0.41 hard tile geometry guard helpers.');
if (!renderer.includes('const TILE_SPRITE_RATIO = 0.92')) errors.push('Tile sprite must use a fixed cell-bounded ratio.');
if (!renderer.includes('selectionFocusOverlay') || !renderer.includes('drawSelectionFocusOverlay')) errors.push('Active selection must use a separate fixed-size overlay instead of scaling the tile body.');
if (!selectionBlock.includes('this.lockTileViewScale(view)')) errors.push('Selected tile path must lock tile view size.');
if (!selectionBlock.includes('this.drawSelectionFocusOverlay(view)')) errors.push('setSelected must render the fixed overlay marker.');
if (/selectionRing\.scale|selectionCore\.scale|sprite\.scale|root\.scale/.test(selectionBlock.replace(/lockTileViewScale/g, ''))) {
  errors.push('setSelected must not animate or directly manipulate visible scale outside the scale lock helper.');
}
if (selectionBlock.includes("this.applyTileStateTexture(view, 'selected')") || selectionBlock.includes('emitSelectionWave(view.root.x, view.root.y, PALETTE.sky)')) {
  errors.push('setSelected must not swap selected texture or emit a large selection wave.');
}
if (renderer.includes('view.sprite.scale.set(1)')) errors.push('Never set tile sprite scale to 1 after texture swaps; that can render source PNG/atlas size and make selected tiles huge.');
if (!applyBlock.includes('this.fitTileSprite(view)')) errors.push('Texture state changes must refit sprite width/height immediately.');
if (!lockBlock.includes('this.fitTileSprite(view)') && !lockBlock.includes('this.enforceTileBodyGeometry(view)')) errors.push('Scale lock helper must normalize the tile sprite dimensions through fitTileSprite or enforceTileBodyGeometry.');
if (!renderer.includes("const textureState = state === 'selected' ? 'normal' : state")) errors.push('Selected state must keep the normal tile texture to prevent larger selected PNG frames.');
if (!renderer.includes('SELECTION_INSET_RATIO') || !renderer.includes('SELECTION_RING_RATIO') || !renderer.includes('SELECTION_WAVE_RATIO') || !renderer.includes('SELECTION_OVERLAY_INSET_RATIO')) {
  errors.push('Selection effect must use bounded constants for ring, inset, wave and overlay sizing.');
}
if (addTileBlock.includes('tileSize * 0.72') || addTileBlock.includes('tileSize * 0.84') || addTileBlock.includes('tileSize * 0.62')) {
  errors.push('Selection ring/glow must stay inside the tile cell instead of drawing oversized overlays.');
}
if (renderer.includes('tl.to([a.root.scale, b.root.scale], { x: 1.06') || renderer.includes('root.scale], { x: 1.06')) {
  errors.push('Match start must not grow selected tile roots above natural size.');
}
if (renderer.includes('circle(0, 0, 18).stroke') || renderer.includes('x: 2.6, y: 2.6')) errors.push('Old large selection wave is still present.');
if (!(addTileBlock.includes('root.scale.set(1)') || addTileBlock.includes('this.enforceTileBodyGeometry(view)')) || addTileBlock.includes('back.out') || addTileBlock.includes('root.scale, {')) {
  errors.push('Tile spawn must stay at natural scale and avoid overshoot that can look like selection growth.');
}
if (!(renderer.includes('if (!view.settling) view.root.scale.set(1)') || renderer.includes('if (!view.settling) this.enforceTileBodyGeometry(view)')) || !(renderer.includes('this.fitTileSprite(view);') || renderer.includes('this.assertTileBodyGeometry(view);'))) {
  errors.push('Board ticker must continuously preserve tile body geometry after async texture updates.');
}

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}
console.log('Selection stability check passed: selected tiles never change texture/scale and use a fixed overlay marker only.');
