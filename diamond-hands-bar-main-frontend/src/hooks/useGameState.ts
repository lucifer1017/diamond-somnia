import { useState, useCallback, useEffect, useRef } from 'react';
import { GameState, Player, WINNING_SCORE } from '@/types/game';
import { 
  createDeck, 
  drawCard, 
  checkForBust, 
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
  onStatePublish?: () => void;
}

export const useGameState = (options: UseGameStateOptions = {}) => {
  const { roomCode, walletClient, onStatePublish } = options;
  const [gameState, setGameState] = useState<GameState>(initialState);
  const [showCreeperEffect, setShowCreeperEffect] = useState(false);
  const publishTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activePlayer = gameState.players.find(p => p.isActive)!;
  const inactivePlayer = gameState.players.find(p => !p.isActive)!;

  // Track last published state to avoid duplicate publishes
  const lastPublishedStateRef = useRef<string>("");
  const isPublishingRef = useRef(false);

  // Publish game state update (debounced to avoid spam)
  const publishStateUpdate = useCallback(async () => {
    if (!roomCode || !walletClient) {
      return;
    }
    
    if (gameState.gameStatus === 'waiting') {
      return;
    }

    // Prevent concurrent publishes
    if (isPublishingRef.current) {
      console.log("[GameState] Already publishing, skipping");
      return;
    }

    // Create a state fingerprint to avoid duplicate publishes
    const stateFingerprint = `${gameState.currentRound}-${gameState.players[0].roundScore}-${gameState.players[0].totalScore}-${gameState.players[1].roundScore}-${gameState.players[1].totalScore}-${gameState.gameStatus}-${gameState.players.find(p => p.isActive)?.id}`;
    
    if (lastPublishedStateRef.current === stateFingerprint) {
      console.log("[GameState] State unchanged, skipping publish");
      return;
    }

    // Clear any pending publish
    if (publishTimeoutRef.current) {
      clearTimeout(publishTimeoutRef.current);
    }

    // Debounce: wait 1500ms before publishing (longer to reduce spam)
    publishTimeoutRef.current = setTimeout(async () => {
      // Check again if state changed during debounce
      const currentFingerprint = `${gameState.currentRound}-${gameState.players[0].roundScore}-${gameState.players[0].totalScore}-${gameState.players[1].roundScore}-${gameState.players[1].totalScore}-${gameState.gameStatus}-${gameState.players.find(p => p.isActive)?.id}`;
      if (lastPublishedStateRef.current === currentFingerprint) {
        console.log("[GameState] State changed during debounce, skipping");
        return;
      }

      if (isPublishingRef.current) {
        return;
      }

      isPublishingRef.current = true;
      try {
        console.log("[GameState] Publishing state update for room:", roomCode);
        const payload = gameStateToPayload(gameState, roomCode);
        const txHash = await publishGameStateUpdate(walletClient, payload);
        
        if (txHash) {
          lastPublishedStateRef.current = currentFingerprint;
          console.log("[GameState] Published successfully, tx:", txHash);
        }
        onStatePublish?.();
      } catch (error) {
        console.error("[GameState] Failed to publish state update:", error);
      } finally {
        isPublishingRef.current = false;
      }
    }, 1500);
  }, [gameState, roomCode, walletClient, onStatePublish]);
  
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

  // Publish state after hold (only if in a room)
  useEffect(() => {
    if (gameState.lastAction === 'hold' && roomCode && walletClient) {
      publishStateUpdate();
    }
  }, [gameState.lastAction, roomCode, walletClient, publishStateUpdate]);

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

  // Publish state after secure (only if in a room)
  useEffect(() => {
    if (gameState.lastAction === 'secure' && roomCode && walletClient) {
      publishStateUpdate();
    }
  }, [gameState.lastAction, roomCode, walletClient, publishStateUpdate]);

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
      
      // Publish final state
      if (roomCode && walletClient) {
        setTimeout(() => {
          const payload = gameStateToPayload(newState, roomCode);
          publishGameStateUpdate(walletClient, payload).catch(console.warn);
        }, 100);
      }
      
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
    
    // Publish round start
    if (roomCode && walletClient) {
      setTimeout(() => {
        const payload = gameStateToPayload(newState, roomCode);
        publishGameStateUpdate(walletClient, payload).catch(console.warn);
      }, 100);
    }
    
    return newState;
  }, [roomCode, walletClient]);

  const startNewGame = useCallback(() => {
    setGameState({
      ...initialState,
      deck: createDeck(),
      gameStatus: 'playing'
    });
  }, []);

  // Auto-start the game
  useEffect(() => {
    if (gameState.gameStatus === 'waiting') {
      startNewGame();
    }
  }, []);

  // Publish initial state when game starts (if in a room) - only once
  const hasPublishedInitialRef = useRef(false);
  useEffect(() => {
    if (gameState.gameStatus === 'playing' && roomCode && walletClient && !hasPublishedInitialRef.current) {
      hasPublishedInitialRef.current = true;
      // Small delay to ensure state is fully initialized
      const timer = setTimeout(() => {
        publishStateUpdate();
      }, 2000);
      return () => clearTimeout(timer);
    }
    
    // Reset when game ends or room changes
    if (gameState.gameStatus === 'gameOver' || !roomCode) {
      hasPublishedInitialRef.current = false;
      lastPublishedStateRef.current = "";
    }
  }, [gameState.gameStatus, roomCode, walletClient, publishStateUpdate]);

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