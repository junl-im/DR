/** Bundled GLB paths are root-relative, but GitHub Pages hosts under /DR/.
 * Keep external, already-relative, and unrelated URLs unchanged.
 */
export function resolveModelAssetUrl(url: string, base = import.meta.env.BASE_URL || '/'): string {
  const modelsRoot = '/' + 'models' + '/'; // resist Vite's source public-path rewrite
  if (!url.startsWith(modelsRoot) || !base.startsWith('/')) return url;
  const normalizedBase = base.replace(/\/+$/, '') + '/';
  return normalizedBase === '/' ? url : normalizedBase + url.slice(1);
}
