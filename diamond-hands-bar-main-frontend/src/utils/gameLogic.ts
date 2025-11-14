import { Card, CardType, CARD_VALUES, GameState } from '@/types/game';

export const createDeck = (): Card[] => {
  const deck: Card[] = [];
  const distribution: Record<CardType, number> = {
    iron: 8,
    gold: 6,
    diamond: 4,
    creeper: 4
  };

  Object.entries(distribution).forEach(([type, count]) => {
    for (let i = 0; i < count; i++) {
      deck.push({
        id: `${type}-${i}`,
        type: type as CardType,
        value: CARD_VALUES[type as CardType],
        isRevealed: false
      });
    }
  });

  return shuffleDeck(deck);
};

export const shuffleDeck = (deck: Card[]): Card[] => {
  const shuffled = [...deck];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

export const drawCard = (deck: Card[]): { card: Card | null; remainingDeck: Card[] } => {
  if (deck.length === 0) return { card: null, remainingDeck: [] };
  
  const [card, ...remainingDeck] = deck;
  return { 
    card: { ...card, isRevealed: true }, 
    remainingDeck 
  };
};

export const calculateRoundScore = (cards: Card[]): number => {
  return cards.reduce((sum, card) => sum + card.value, 0);
};

export const checkForBust = (cards: Card[]): boolean => {
  return cards.some(card => card.type === 'creeper');
};

export const switchActivePlayer = (state: GameState): GameState => {
  const [player1, player2] = state.players;
  return {
    ...state,
    players: [
      { ...player1, isActive: !player1.isActive },
      { ...player2, isActive: !player2.isActive }
    ]
  };
};