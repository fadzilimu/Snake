export const BOARD_SIZE = 10;
export const TOTAL_CELLS = BOARD_SIZE * BOARD_SIZE;

export const LADDERS: Record<number, number> = {
  1: 38,
  4: 14,
  9: 31,
  21: 42,
  28: 84,
  36: 44,
  51: 67,
  71: 91,
  80: 100,
};

export const SNAKES: Record<number, number> = {
  16: 6,
  47: 26,
  49: 11,
  56: 53,
  62: 19,
  64: 60,
  87: 24,
  93: 73,
  95: 75,
  98: 78,
};

export const PLAYER_COLORS = [
  "#ef4444", // red
  "#3b82f6", // blue
  "#10b981", // green
  "#f59e0b", // yellow
  "#8b5cf6", // purple
  "#ec4899", // pink
];

export interface Player {
  uid: string;
  name: string;
  color: string;
  position: number;
  type: 'human' | 'ai';
}

export interface GameState {
  id: string;
  status: 'waiting' | 'playing' | 'finished';
  players: Player[];
  turnIndex: number;
  lastRoll?: number;
  winner?: string;
  hostId: string;
  createdAt: any;
  updatedAt: any;
}
