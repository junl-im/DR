/** Support runtime-created root GLB paths; the Vite project also rewrites
 * manifest string literals to /DR/ at build time. Already-prefixed URLs must
 * remain untouched to prevent /DR/DR/ double-prefixing on GitHub Pages.
 */
export function resolveModelAssetUrl(url: string, base = import.meta.env.BASE_URL || '/'): string {
  const modelsRoot = '/' + 'models' + '/'; // resist Vite's source public-path rewrite
  if (!url.startsWith(modelsRoot) || !base.startsWith('/')) return url;
  const normalizedBase = base.replace(/\/+$/, '') + '/';
  return normalizedBase === '/' ? url : normalizedBase + url.slice(1);
}
