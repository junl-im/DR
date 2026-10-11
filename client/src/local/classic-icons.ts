const paths: Record<string,string> = {
  sword:'<path d="M12 26 27 11 30 3 22 6 7 21Z" fill="#c9d3d0" stroke="#6c838b"/><path d="m7 19 7 7-3 3-7-7Z" fill="#b59a58"/><path d="m7 25-4 4 2 2 4-4" stroke="#967044" stroke-width="3"/>',
  strike:'<path d="m17 2 2 10 10-5-6 10 8 4-11 1-3 10-3-11-11 2 9-7-5-8 8 5Z" fill="#8fc5df" stroke="#477eb6"/><path d="m16 8 3 10-6 8 3-11Z" fill="#f6f4d8"/>',
  potion:'<path d="M12 3h9v4l-2 1v7c12 11 9 16-3 16S1 26 13 15V8l-1-1Z" fill="#d3dbcf" stroke="#828f7f"/><path d="M10 20h14c7 8 1 10-7 10S3 28 10 20" fill="#b74a38"/><path d="M11 3h11v4H11Z" fill="#a88c55"/><path d="m11 23-2 3" stroke="#ecb2a1" stroke-width="2"/>',
  armor:'<path d="m11 5 6 4 5-4 8 6-5 7-4-3v15H11V15l-4 3-5-7Z" fill="#899caa" stroke="#c4c7b9"/><path d="M13 10h6v15h-6Z" fill="#4d626d"/><path d="M11 26h10" stroke="#bca16a" stroke-width="3"/>',
};
export function classicIcon(kind: keyof typeof paths): string {
 return `<svg viewBox="0 0 34 34" aria-hidden="true" focusable="false">${paths[kind]}</svg>`;
}
