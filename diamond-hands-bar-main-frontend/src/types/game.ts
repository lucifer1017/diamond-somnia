export type CardType = 'iron' | 'gold' | 'diamond' | 'creeper';

export interface Card {
  id: string;
  type: CardType;
  value: number;
  isRevealed: boolean;
}

export interface Player {
  id: 1 | 2;
  name: string;
  roundScore: number;
  totalScore: number;
  isActive: boolean;
  hasSecured: boolean;
}

export interface GameState {
  players: [Player, Player];
  currentRound: number;
  totalRounds: number;
  deck: Card[];
  revealedCards: Card[];
  gameStatus: 'waiting' | 'playing' | 'roundEnd' | 'gameOver';
  winner: Player | null;
  lastAction: 'hold' | 'secure' | null;
}

export const CARD_VALUES: Record<CardType, number> = {
  iron: 5,
  gold: 10,
  diamond: 15,
  creeper: 0 // Bust card
};

export const WINNING_SCORE = 100;