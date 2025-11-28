import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Player, WINNING_SCORE } from '@/types/game';
import { 
  createDeck, 
  drawCard, 
  switchActivePlayer 
} from '@/utils/gameLogic';
import { publishGameStateUpdate } from '@/lib/somnia';
import { gameStateToPayload } from '@/lib/lobbySchema';
import type { WalletClient } from 'viem';

const initialPlayer = (id: 1 | 2): Player => ({
  id,
  name: `Player ${id}`,
  roundScore: 0,
  totalScore: 0,
  isActive: id === 1,
  hasSecured: false
});

const initialState: GameState = {
  players: [initialPlayer(1), initialPlayer(2)],
  currentRound: 1,
  totalRounds: 5,
  deck: createDeck(),
  revealedCards: [],
  gameStatus: 'waiting',
  winner: null,
  lastAction: null
};

interface UseGameStateOptions {
  roomCode?: string | null;
  walletClient?: WalletClient | null;
}

const stateFingerprint = (state: GameState) =>
  [
    state.currentRound,
    state.gameStatus,
    state.players[0].roundScore,
    state.players[0].totalScore,
    state.players[1].roundScore,
    state.players[1].totalScore,
    state.winner?.id ?? 'none',
  ].join('-');

export const useGameState = (options: UseGameStateOptions = {}) => {
  const { roomCode, walletClient } = options;
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [showCreeperEffect, setShowCreeperEffect] = useState(false);

  const activePlayer = gameState.players.find(p => p.isActive)!;
  const inactivePlayer = gameState.players.find(p => !p.isActive)!;

  // Track last published state to avoid duplicate publishes
  const lastPublishedStateRef = useRef<string>("");

  const publishState = useCallback(
    async (state: GameState) => {
      if (!roomCode || !walletClient) {
        return;
      }

      if (state.gameStatus === 'waiting') {
        return;
      }

      const fingerprint = stateFingerprint(state);
      if (lastPublishedStateRef.current === fingerprint) {
        return;
      }

      try {
        console.log("[GameState] Publishing state update for room:", roomCode);
        const payload = gameStateToPayload(state, roomCode);
        const txHash = await publishGameStateUpdate(walletClient, payload);
        if (txHash) {
          lastPublishedStateRef.current = fingerprint;
          console.log("[GameState] Published successfully, tx:", txHash);
        }
      } catch (error) {
        console.error("[GameState] Failed to publish state update:", error);
      }
    },
    [roomCode, walletClient]
  );
  
  // const handleHold = useCallback(() => {
  //   if (gameState.gameStatus !== 'playing' || !activePlayer || activePlayer.hasSecured) return;

  //   const { card, remainingDeck } = drawCard(gameState.deck);
  //   if (!card) return;

  //   // The card is always revealed when drawn. Set this explicitly.
  //   const newRevealedCards = [...gameState.revealedCards, { ...card, isRevealed: true }];
  //   const newRoundScore = activePlayer.roundScore + card.value;

  //   // --- Creeper / Bust Logic ---
  //   if (card.type === 'creeper') {
      
  //     // STEP 1: Immediately update the UI to show the creeper card that was drawn.
  //     setGameState(prev => ({
  //       ...prev,
  //       deck: remainingDeck,
  //       revealedCards: newRevealedCards,
  //       lastAction: 'hold', // THE FIX: Use a valid, type-safe action.
  //     }));
      
  //     // Trigger the visual "BOOM" effect.
  //     setShowCreeperEffect(true);
  //     setTimeout(() => setShowCreeperEffect(false), 1000);

  //     // STEP 2: After a delay for the animation, apply the bust consequences.
  //     setTimeout(() => {
  //       setGameState(prev => {
  //         const newState = switchActivePlayer({
  //           ...prev,
  //           revealedCards: [], // Clear the table for the next player.
  //           players: prev.players.map(p =>
  //             p.isActive
  //               ? { ...p, roundScore: 0, hasSecured: true } // Player busts: score resets, turn ends.
  //               : p
  //           ) as [Player, Player]
  //         });

  //         // After switching, check if the round should end.
  //         if (newState.players.every(p => p.hasSecured)) {
  //           return handleRoundEnd(newState);
  //         }
  //         return newState;
  //       });
  //     }, 1500); // Delay matches the animation duration.

  //   } else {
  //     // --- Normal Card Draw Logic ---
  //     setGameState(prev => ({
  //       ...prev,
  //       deck: remainingDeck,
  //       revealedCards: newRevealedCards,
  //       lastAction: 'hold',
  //       players: prev.players.map(p =>
  //         p.isActive
  //           ? { ...p, roundScore: newRoundScore }
  //           : p
  //       ) as [Player, Player]
  //     }));
  //   }
  // }, [gameState, activePlayer]);

  const handleHold = useCallback(() => {
  if (gameState.gameStatus !== 'playing' || !activePlayer || activePlayer.hasSecured) return;

  const { card, remainingDeck } = drawCard(gameState.deck);
  if (!card) return;

  const newRevealedCards = [...gameState.revealedCards, { ...card, isRevealed: true }];
  const newRoundScore = activePlayer.roundScore + card.value;

  if (card.type === 'creeper') {
    setGameState(prev => ({
      ...prev,
      deck: remainingDeck,
      revealedCards: newRevealedCards,
      lastAction: 'hold',
    }));
    
    setTimeout(() => {
      setShowCreeperEffect(true);
      setTimeout(() => setShowCreeperEffect(false), 1000);
    }, 600);

    setTimeout(() => {
      setGameState(prev => {
        const newState = switchActivePlayer({
          ...prev,
          revealedCards: [],
          players: prev.players.map(p =>
            p.isActive
              ? { ...p, roundScore: 0, hasSecured: true }
              : p
          ) as [Player, Player]
        });

        if (newState.players.every(p => p.hasSecured)) {
          return handleRoundEnd(newState);
        }
        return newState;
      });
    }, 1600);

  } else {
    setGameState(prev => ({
      ...prev,
      deck: remainingDeck,
      revealedCards: newRevealedCards,
      lastAction: 'hold',
      players: prev.players.map(p =>
        p.isActive
          ? { ...p, roundScore: newRoundScore }
          : p
      ) as [Player, Player]
    }));
  }
}, [gameState, activePlayer]);

  const handleSecure = useCallback(() => {
    if (gameState.gameStatus !== 'playing' || activePlayer.hasSecured) return;

    setGameState(prev => {
      const newTotalScore = activePlayer.totalScore + activePlayer.roundScore;
      
      const newState = switchActivePlayer({
        ...prev,
        revealedCards: [],
        lastAction: 'secure',
        players: prev.players.map(p => 
          p.isActive 
            ? { ...p, totalScore: newTotalScore, hasSecured: true }
            : p
        ) as [Player, Player]
      });

      // Check if both players have secured
      if (newState.players.every(p => p.hasSecured)) {
        return handleRoundEnd(newState);
      }

      return newState;
    });
  }, [gameState, activePlayer]);

  const handleRoundEnd = useCallback((state: GameState): GameState => {
    // Check for game winner
    const winner = state.players.find(p => p.totalScore >= WINNING_SCORE);
    
    if (winner || state.currentRound >= state.totalRounds) {
      // Game over
      const finalWinner = winner || 
        (state.players[0].totalScore > state.players[1].totalScore ? state.players[0] : state.players[1]);
      
      const newState = {
        ...state,
        gameStatus: 'gameOver',
        winner: finalWinner
      };
      
      publishState(newState);
      
      return newState;
    }

    // Start new round
    const newState = {
      ...state,
      currentRound: state.currentRound + 1,
      deck: createDeck(),
      revealedCards: [],
      players: state.players.map(p => ({
        ...p,
        roundScore: 0,
        hasSecured: false,
        isActive: p.id === 1
      })) as [Player, Player],
      gameStatus: 'playing'
    };
    
    publishState(newState);
    
    return newState;
  }, [publishState]);

  const startNewGame = useCallback(() => {
    lastPublishedStateRef.current = "";
    setGameState(() => {
      const newState: GameState = {
      ...initialState,
      deck: createDeck(),
      gameStatus: 'playing'
      };

      publishState(newState);
      return newState;
    });
  }, [publishState]);

  // Auto-start the game
  useEffect(() => {
    if (gameState.gameStatus === 'waiting') {
      startNewGame();
    }
  }, [gameState.gameStatus, startNewGame]);

  useEffect(() => {
    if (!roomCode) {
      lastPublishedStateRef.current = "";
    }
  }, [roomCode]);

  return {
    gameState,
    activePlayer,
    inactivePlayer,
    handleHold,
    handleSecure,
    startNewGame,
    showCreeperEffect
  };
};