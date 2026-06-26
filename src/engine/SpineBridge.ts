export async function prepareSpineRuntime() {
  try {
    return await import('@esotericsoftware/spine-pixi-v8');
  } catch {
    return null;
  }
}

export const spineSlots = {
  librarian: 'spine/librarian-momo',
  boss: 'spine/forgotten-keeper'
};
