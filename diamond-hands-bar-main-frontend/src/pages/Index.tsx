import { useGameState } from '@/hooks/useGameState';
import { GameTable } from '@/components/GameTable';
import { ScoreDisplay } from '@/components/ScoreDisplay';
import { ActionButton } from '@/components/ActionButton';
import { RoundIndicator } from '@/components/RoundIndicator';
import { GameOverModal } from '@/components/GameOverModal';
import { CreeperEffect } from '@/components/CreeperEffect';
import { ParticleEffects } from '@/components/ParticleEffects';
import barBackground from '@/assets/bar-background.jpg';

const Index = () => {
  const {
    gameState,
    activePlayer,
    handleHold,
    handleSecure,
    startNewGame,
    showCreeperEffect
  } = useGameState();

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
        {/* Top Section - Round Indicator */}
        <div className="w-full max-w-6xl flex justify-center pt-4">
          <RoundIndicator 
            currentRound={gameState.currentRound} 
            totalRounds={gameState.totalRounds} 
          />
        </div>
        
        {/* Middle Section - Game Area */}
        <div className="w-full max-w-6xl flex items-center justify-between gap-8">
          {/* Player 1 Score */}
          <ScoreDisplay player={gameState.players[0]} position="left" />
          
          {/* Game Table */}
          <div className="flex-1">
            <GameTable revealedCards={gameState.revealedCards} />
          </div>
          
          {/* Player 2 Score */}
          <ScoreDisplay player={gameState.players[1]} position="right" />
        </div>
        
        {/* Bottom Section - Action Buttons */}
        <div className="w-full max-w-md flex gap-4 justify-center pb-8">
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
        </div>
      </div>
      
      {/* Effects */}
      <CreeperEffect isActive={showCreeperEffect} />
      
      {/* Game Over Modal */}
      <GameOverModal
        winner={gameState.winner}
        onNewGame={startNewGame}
        isVisible={gameState.gameStatus === 'gameOver'}
      />
    </div>
  );
};

export default Index;