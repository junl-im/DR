/** Bundled GLB paths are root-relative, but GitHub Pages hosts under /DR/.
 * Keep external, already-relative, and unrelated URLs unchanged.
 */
export function resolveModelAssetUrl(url: string, base = import.meta.env.BASE_URL || '/'): string {
  if (!url.startsWith('/models/') || !base.startsWith('/')) return url;
  const normalizedBase = base.replace(/\/+$/, '') + '/';
  return normalizedBase === '/' ? url : normalizedBase + url.slice(1);
}
