import { TILE_SET } from './difficulty.js';

export function createBoard(difficulty, modifiers = []) {
  return createPlayableBoard(difficulty, modifiers);
}

export function createPlayableBoard(difficulty, modifiers = [], attempts = 40) {
  let board = null;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    board = applySpecialTiles(buildRandomBoard(difficulty), modifiers);
    if (findHint(board)) return board;
  }
  return board ?? applySpecialTiles(buildRandomBoard(difficulty), modifiers);
}

function buildRandomBoard(difficulty) {
  const totalCells = difficulty.rows * difficulty.cols;
  const pairCount = totalCells / 2;
  const icons = TILE_SET.slice(0, difficulty.iconTypes);
  const deck = [];

  for (let i = 0; i < pairCount; i += 1) {
    const tile = icons[i % icons.length];
    deck.push(makeTile(tile, i, 'a'));
    deck.push(makeTile(tile, i, 'b'));
  }

  shuffle(deck);

  const board = [];
  for (let row = 0; row < difficulty.rows; row += 1) {
    board[row] = [];
    for (let col = 0; col < difficulty.cols; col += 1) {
      board[row][col] = deck[row * difficulty.cols + col];
    }
  }

  return board;
}

function makeTile(tile, pairIndex, side) {
  return {
    id: `${tile.type}-${pairIndex}-${side}-${crypto.randomUUID()}`,
    type: tile.type,
    icon: tile.icon,
    asset: tile.asset,
    label: tile.label,
    theme: tile.theme
  };
}


function applySpecialTiles(board, modifiers = []) {
  const next = cloneBoard(board);
  const positions = [];
  next.forEach((row, rowIndex) => row.forEach((tile, colIndex) => {
    if (tile) positions.push({ row: rowIndex, col: colIndex });
  }));
  shuffle(positions);
  const pairsByType = new Map();
  next.flat().filter(Boolean).forEach((tile) => {
    if (!pairsByType.has(tile.type)) pairsByType.set(tile.type, []);
    pairsByType.get(tile.type).push(tile.id);
  });

  if (modifiers.includes('fog')) markPositions(next, positions.splice(0, 8), 'fog');
  if (modifiers.includes('locked')) markMatchingPair(next, pairsByType, 'locked');
  if (modifiers.includes('timeSeal')) markPositions(next, positions.splice(0, 4), 'timeSeal');
  return next;
}

function markPositions(board, positions, special) {
  positions.forEach((position) => {
    const tile = board[position.row]?.[position.col];
    if (tile) tile.special = special;
  });
}

function markMatchingPair(board, pairsByType, special) {
  const candidate = [...pairsByType.values()].find((ids) => ids.length >= 2);
  if (!candidate) return;
  let marked = 0;
  board.forEach((row) => row.forEach((tile) => {
    if (tile && candidate.includes(tile.id) && marked < 2) {
      tile.special = special;
      marked += 1;
    }
  }));
}

export function revealPairSpecials(board, first, second) {
  const next = cloneBoard(board);
  [first, second].forEach((point) => {
    const tile = next[point.row]?.[point.col];
    if (tile?.special) tile.specialRevealed = true;
  });
  return next;
}

export function cloneBoard(board) {
  return board.map((row) => row.slice());
}

export function countRemaining(board) {
  return board.flat().filter(Boolean).length;
}

export function isCleared(board) {
  return countRemaining(board) === 0;
}

export function canConnect(board, first, second) {
  return Boolean(findConnectionPath(board, first, second));
}

export function findConnectionPath(board, first, second) {
  if (!first || !second) return null;
  if (first.row === second.row && first.col === second.col) return null;

  const firstTile = board[first.row]?.[first.col];
  const secondTile = board[second.row]?.[second.col];
  if (!firstTile || !secondTile || firstTile.type !== secondTile.type) return null;

  const rows = board.length;
  const cols = board[0].length;
  const start = { row: first.row + 1, col: first.col + 1 };
  const target = { row: second.row + 1, col: second.col + 1 };
  const directions = [
    { row: -1, col: 0 },
    { row: 0, col: 1 },
    { row: 1, col: 0 },
    { row: 0, col: -1 }
  ];

  const bestTurns = Array.from({ length: rows + 2 }, () =>
    Array.from({ length: cols + 2 }, () => Array(4).fill(Number.POSITIVE_INFINITY))
  );
  const previous = new Map();
  const queue = [];

  directions.forEach((_, directionIndex) => {
    bestTurns[start.row][start.col][directionIndex] = 0;
    queue.push({ row: start.row, col: start.col, directionIndex, turns: 0 });
  });

  while (queue.length > 0) {
    const current = queue.shift();

    for (let nextDirectionIndex = 0; nextDirectionIndex < directions.length; nextDirectionIndex += 1) {
      const direction = directions[nextDirectionIndex];
      const nextTurns = current.turns + (nextDirectionIndex === current.directionIndex ? 0 : 1);
      if (nextTurns > 2) continue;

      const next = {
        row: current.row + direction.row,
        col: current.col + direction.col,
        directionIndex: nextDirectionIndex,
        turns: nextTurns
      };

      if (next.row < 0 || next.row > rows + 1 || next.col < 0 || next.col > cols + 1) continue;
      if (isBlocked(board, next, start, target)) continue;
      if (bestTurns[next.row][next.col][nextDirectionIndex] <= nextTurns) continue;

      bestTurns[next.row][next.col][nextDirectionIndex] = nextTurns;
      previous.set(stateKey(next), current);

      if (next.row === target.row && next.col === target.col) {
        return compressPath(reconstructPath(next, previous));
      }

      queue.push(next);
    }
  }

  return null;
}

function reconstructPath(end, previous) {
  const path = [];
  let current = end;
  while (current) {
    path.push({ row: current.row, col: current.col });
    const prev = previous.get(stateKey(current));
    if (!prev) break;
    current = prev;
  }
  return path.reverse();
}

function compressPath(path) {
  if (path.length <= 2) return path;
  const compressed = [path[0]];
  for (let i = 1; i < path.length - 1; i += 1) {
    const prev = path[i - 1];
    const current = path[i];
    const next = path[i + 1];
    const sameRow = prev.row === current.row && current.row === next.row;
    const sameCol = prev.col === current.col && current.col === next.col;
    if (!sameRow && !sameCol) compressed.push(current);
  }
  compressed.push(path[path.length - 1]);
  return compressed;
}

function stateKey(point) {
  return `${point.row}:${point.col}:${point.directionIndex}`;
}

function isBlocked(board, point, start, target) {
  if (point.row === start.row && point.col === start.col) return false;
  if (point.row === target.row && point.col === target.col) return false;

  const rows = board.length;
  const cols = board[0].length;
  if (point.row === 0 || point.row === rows + 1 || point.col === 0 || point.col === cols + 1) {
    return false;
  }

  return Boolean(board[point.row - 1][point.col - 1]);
}

export function removePair(board, first, second) {
  const nextBoard = cloneBoard(board);
  nextBoard[first.row][first.col] = null;
  nextBoard[second.row][second.col] = null;
  return nextBoard;
}

export function findHint(board) {
  const tiles = [];
  board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) tiles.push({ row: rowIndex, col: colIndex, tile });
    });
  });

  for (let i = 0; i < tiles.length; i += 1) {
    for (let j = i + 1; j < tiles.length; j += 1) {
      if (tiles[i].tile.type === tiles[j].tile.type && canConnect(board, tiles[i], tiles[j])) {
        return [tiles[i], tiles[j]];
      }
    }
  }

  return null;
}

export function shuffleRemaining(board) {
  const positions = [];
  const tiles = [];

  board.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) {
        positions.push({ row: rowIndex, col: colIndex });
        tiles.push(tile);
      }
    });
  });

  let candidate = cloneBoard(board);
  for (let attempt = 0; attempt < 30; attempt += 1) {
    const shuffledTiles = shuffle(tiles.slice());
    candidate = cloneBoard(board);
    positions.forEach((position, index) => {
      candidate[position.row][position.col] = shuffledTiles[index];
    });
    if (findHint(candidate)) return candidate;
  }

  return candidate;
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
