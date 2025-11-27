import { useEffect, useMemo, useState } from 'react';
import { useGameState } from '@/hooks/useGameState';
import type { GameState } from '@/types/game';
import { useMatchHistory } from '@/hooks/useMatchHistory';
import { GameTable } from '@/components/GameTable';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ActionButton } from '@/components/ActionButton';
import { RoundIndicator } from '@/components/RoundIndicator';
import { GameOverModal } from '@/components/GameOverModal';
import { CreeperEffect } from '@/components/CreeperEffect';
import { ParticleEffects } from '@/components/ParticleEffects';
import { WalletStatus } from '@/components/WalletStatus';
import { TavernLedger } from '@/components/TavernLedger';
import { BarGossipFeed } from '@/components/BarGossipFeed';
import { RoomManager } from '@/components/RoomManager';
import { OnChainProofCard } from '@/components/OnChainProofCard';
import { publishMatchResult } from '@/lib/somnia';
import { useWalletContext } from '@/context/WalletContext';
import { useRoom } from '@/hooks/useRoom';
import { useWatchRoom } from '@/hooks/useWatchRoom';
import barBackground from '@/assets/bar-background.jpg';

const generateMatchId = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `match-${Date.now()}`;
};

const Index = () => {
  const { walletClient, address, isOnSomnia } = useWalletContext();
  const { roomCode, isHost, hostAddress, createRoom, joinRoom, leaveRoom } = useRoom();
  
  console.log("[Index] Room hook state:", { roomCode, isHost, hostAddress, address });
  
  // Watch room if not hosting (use host's address as publisher)
  const watchRoomCode = !isHost ? roomCode : null;
  const watchPublisher = !isHost && hostAddress ? hostAddress : null;
  console.log("[Index] Watch config:", { watchRoomCode, watchPublisher, isHost });
  
  const { roomState: watchedState, isWatching } = useWatchRoom(watchRoomCode, watchPublisher);
  
  console.log("[Index] Room state:", { roomCode, isHost, hostAddress, watchedState, isWatching, address });

  const {
    gameState,
    activePlayer,
    handleHold,
    handleSecure,
    startNewGame,
    showCreeperEffect
  } = useGameState({
    // Only pass roomCode and walletClient if we're the host
    // Watchers should NOT publish state
    roomCode: isHost && roomCode ? roomCode : null,
    walletClient: isHost && walletClient ? walletClient : null,
  });
  
  console.log("[Index] useGameState config:", { 
    isHost, 
    hasRoomCode: !!roomCode, 
    hasWalletClient: !!walletClient,
    willPublish: isHost && !!roomCode && !!walletClient 
  });

  // Use watched state if watching, otherwise use local state
  const displayState = watchedState && !isHost
    ? {
        players: [
          {
            id: 1 as const,
            name: "Player 1",
            roundScore: watchedState.player1RoundScore,
            totalScore: watchedState.player1TotalScore,
            isActive: watchedState.activePlayerId === 1,
            hasSecured: false, // Not available in watched state
          },
          {
            id: 2 as const,
            name: "Player 2",
            roundScore: watchedState.player2RoundScore,
            totalScore: watchedState.player2TotalScore,
            isActive: watchedState.activePlayerId === 2,
            hasSecured: false,
          },
        ] as [typeof gameState.players[0], typeof gameState.players[1]],
        currentRound: watchedState.currentRound,
        totalRounds: watchedState.totalRounds,
        gameStatus: watchedState.gameStatus as GameState['gameStatus'],
        winner: null, // Not available in watched state
        revealedCards: [], // Not available in watched state
        deck: [],
        lastAction: null,
      }
    : gameState;
  const { data: matchHistory = [], isLoading: isHistoryLoading, refetch: refetchHistory } = useMatchHistory(address && isOnSomnia ? address : null);

  const [matchId, setMatchId] = useState(generateMatchId);
  const [publishStatus, setPublishStatus] = useState<'idle' | 'pending' | 'success' | 'error'>('idle');
  const [lastPublishedMatch, setLastPublishedMatch] = useState<string | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const [publishTxHash, setPublishTxHash] = useState<string | null>(null);

  const winnerLabel = useMemo(() => {
    if (!gameState.winner) return null;
    return `Player ${gameState.winner.id}`;
  }, [gameState.winner]);

  const playerOneScore = gameState.players[0].totalScore;
  const playerTwoScore = gameState.players[1].totalScore;
  const roundsPlayed = gameState.currentRound;

  useEffect(() => {
    const shouldPublish =
      gameState.gameStatus === 'gameOver' &&
      gameState.winner &&
      walletClient &&
      address &&
      isOnSomnia &&
      lastPublishedMatch !== matchId;

    if (!shouldPublish || !winnerLabel) return;

    const payload = {
      matchId,
      winnerLabel,
      playerOneScore,
      playerTwoScore,
      roundsPlayed,
      publisher: address,
    } as const;

    setPublishStatus('pending');
    setPublishError(null);
    setPublishTxHash(null);

    publishMatchResult(walletClient, payload)
      .then((txHash) => {
        setPublishStatus('success');
        setLastPublishedMatch(matchId);
        setPublishTxHash(txHash);
      })
      .catch((err) => {
        console.error('Somnia publish error', err);
        setPublishStatus('error');
        setPublishError(err instanceof Error ? err.message : 'Failed to publish match');
      });
  }, [
    address,
    gameState.gameStatus,
    gameState.winner,
    isOnSomnia,
    lastPublishedMatch,
    matchId,
    playerOneScore,
    playerTwoScore,
    roundsPlayed,
    walletClient,
    winnerLabel,
  ]);

  const handleNewGame = () => {
    startNewGame();
    setMatchId(generateMatchId());
    setPublishStatus('idle');
    setPublishError(null);
    setLastPublishedMatch(null);
    setPublishTxHash(null);
  };

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background Image */}
      <div 
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `url(${barBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          filter: 'brightness(0.7)'
        }}
      />
      
      {/* Ambient Particles */}
      <ParticleEffects />
      
      {/* Game Content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-between p-4">
        <WalletStatus />
        <RoomManager 
          roomCode={roomCode}
          isHost={isHost}
          hostAddress={hostAddress}
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          onLeaveRoom={leaveRoom}
        />
        
        {/* Top Section - Round Indicator */}
        <div className="w-full max-w-6xl flex justify-center pt-4">
          <RoundIndicator 
            currentRound={displayState.currentRound} 
            totalRounds={displayState.totalRounds} 
          />
        </div>
        
        {/* Middle Section - Game Area */}
        <div className="w-full max-w-6xl flex items-center justify-between gap-8">
          {/* Player 1 Score */}
          <ScoreDisplay player={displayState.players[0]} position="left" />
          
          {/* Game Table */}
          <div className="flex-1">
            <GameTable revealedCards={displayState.revealedCards} />
          </div>
          
          {/* Player 2 Score */}
          <ScoreDisplay player={displayState.players[1]} position="right" />
        </div>
        
        {/* Bottom Section - Action Buttons */}
        {!isHost && roomCode && hostAddress ? (
          <div className="w-full max-w-md flex flex-col items-center gap-3 pb-8">
            <div className="font-minecraft text-xs text-muted-foreground text-center px-4 py-2 rounded-pixel border border-wood-dark bg-background/50">
              👀 Watching {roomCode} - Updates every 3 seconds
            </div>
            {watchedState && (
              <div className="text-[10px] text-muted-foreground">
                Last update: {new Date(watchedState.timestamp).toLocaleTimeString()}
              </div>
            )}
            {!watchedState && (
              <div className="text-[10px] text-muted-foreground">
                Waiting for host to start playing...
              </div>
            )}
          </div>
        ) : (
          <div className="w-full max-w-md flex flex-col items-center gap-3 pb-8">
            <ActionButton
              variant="hold"
              icon="💎"
              onClick={handleHold}
              disabled={
                gameState.gameStatus !== 'playing' || 
                activePlayer.hasSecured
              }
            >
              HOLD
            </ActionButton>
            
            <ActionButton
              variant="secure"
              icon="💰"
              onClick={handleSecure}
              disabled={
                gameState.gameStatus !== 'playing' || 
                activePlayer.hasSecured ||
                activePlayer.roundScore === 0
              }
            >
              SECURE ({activePlayer.roundScore})
            </ActionButton>
            {!walletClient && (
              <span className="font-minecraft text-[10px] text-muted-foreground text-center">
                Connect your wallet to immortalize victories on Somnia ✍️
              </span>
            )}
          </div>
        )}
        <div className="w-full flex justify-center pb-8">
          <TavernLedger
            isConnected={Boolean(address && isOnSomnia)}
            isLoading={isHistoryLoading}
            entries={matchHistory}
            onRefresh={() => refetchHistory()}
          />
        </div>
      </div>
      
      {/* Effects */}
      <CreeperEffect isActive={showCreeperEffect} />
      <OnChainProofCard status={publishStatus} txHash={publishTxHash} errorMessage={publishError} />
      <BarGossipFeed />
      
      {/* Game Over Modal */}
      <GameOverModal
        winner={gameState.winner}
        onNewGame={handleNewGame}
        isVisible={gameState.gameStatus === 'gameOver'}
      />
    </div>
  );
};

export default Index;