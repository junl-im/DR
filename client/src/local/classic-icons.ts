export type GameIcon='wood'|'sword'|'strike'|'potion'|'armor'|'recall'|'estate'|'settings';
/** Original painted atlas; never fetch proprietary client icons at runtime. */
export function classicIcon(kind:GameIcon):string{return '<span class="game-icon icon-'+kind+'" aria-hidden="true"></span>';}
