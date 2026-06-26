import { TILE_SET } from './difficulty.js';

export function createBoard(difficulty) {
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
  if (!first || !second) return false;
  if (first.row === second.row && first.col === second.col) return false;

  const firstTile = board[first.row]?.[first.col];
  const secondTile = board[second.row]?.[second.col];
  if (!firstTile || !secondTile || firstTile.type !== secondTile.type) return false;

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
        col: current.col + direction.col
      };

      if (next.row < 0 || next.row > rows + 1 || next.col < 0 || next.col > cols + 1) continue;
      if (isBlocked(board, next, start, target)) continue;
      if (bestTurns[next.row][next.col][nextDirectionIndex] <= nextTurns) continue;

      if (next.row === target.row && next.col === target.col) {
        return true;
      }

      bestTurns[next.row][next.col][nextDirectionIndex] = nextTurns;
      queue.push({ ...next, directionIndex: nextDirectionIndex, turns: nextTurns });
    }
  }

  return false;
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
  const nextBoard = cloneBoard(board);
  const positions = [];
  const tiles = [];

  nextBoard.forEach((row, rowIndex) => {
    row.forEach((tile, colIndex) => {
      if (tile) {
        positions.push({ row: rowIndex, col: colIndex });
        tiles.push(tile);
      }
    });
  });

  shuffle(tiles);
  positions.forEach((position, index) => {
    nextBoard[position.row][position.col] = tiles[index];
  });

  return nextBoard;
}

export function shuffle(array) {
  for (let i = array.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
  return array;
}
