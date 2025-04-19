'use client';

import React, { useCallback, useState } from 'react';
import { Card, EuchreGameInstance, EuchreSettings, PromptType } from '@/app/lib/euchre/definitions';
import { SECTION_STYLE } from '../../home/home-description';
import { inter } from '../../fonts';
import GameSettings from './game-settings';
import useEuchreGame from '@/app/hooks/euchre/useEuchreGame';
import GameScore from './game-score';
import GameBorder from './game-border';
import BidPrompt from '../prompt/bid-prompt';
import DiscardPrompt from '../prompt/discard-prompt';
import HandResults from '../prompt/hand-results';
import GameResults from '../prompt/game-results';
import GameEvents from './game-events';
import GameArea from './game-area';
import GamePrompt from '../prompt/game-prompt';
import useMenuItems from '@/app/hooks/euchre/useMenuItems';
import useEuchreGameAuto from '@/app/hooks/euchre/useEuchreGameAuto';
import clsx from 'clsx';
import GameErrorPrompt from '../prompt/game-error-prompt';
import GameIntro from '../prompt/game-intro';

export default function EuchreGame() {
  // #region Hooks
  const {
    euchreGame,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    promptValue,
    euchreSettings,
    events,
    errorState,
    playedCard,
    reset,
    clearEvents,
    handleStartGame,
    handleBeginNewGame,
    handleBidSubmit,
    handleSettingsChange,
    handleDiscardSubmit,
    handleCloseHandResults,
    handleCardPlayed,
    handleReplayHand,
    handleCancelAndReset,
    handleReplayGame,
    handleAttemptToRecover,
    handleShuffleAndDealComplete
  } = useEuchreGame();

  const {
    isFullScreen,
    showEvents,
    showSettings,
    showScore,
    toggleFullScreen,
    toggleEvents,
    toggleSettings,
    toggleScore
  } = useMenuItems();

  const { runFullGame, runFullGameLoop } = useEuchreGameAuto();
  const [fullGameInstance, setFullGameInstance] = useState<EuchreGameInstance | null>(null);
  const enableFullScreen = euchreGame && isFullScreen;
  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    handleSettingsChange(settings);
  };

  const handleStartNewGame = () => {
    setFullGameInstance(null);
    toggleSettings(false);
    handleStartGame();
  };

  const handleRunFullGame = () => {
    const game = runFullGame(euchreSettings);
    setFullGameInstance(game);
  };

  const handleRunFullGameAnimation = () => {
    const game = runFullGame(euchreSettings);
    setFullGameInstance(game);
  };

  const handleRunFullGameLoop = () => {
    const game = runFullGameLoop(100, euchreSettings);
    setFullGameInstance(game);
  };

  const handleCloseRunFullGame = () => {
    setFullGameInstance(null);
  };

  const handleCancel = useCallback(() => {
    handleCancelAndReset();
    toggleSettings(false);
  }, [handleCancelAndReset, toggleSettings]);

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance) => {
    setFullGameInstance(null);
    toggleSettings(false);
    handleReplayGame(gameToReplay);
  };

  const handleShowSettings = () => {
    toggleSettings(true);
  };

  const handleGameCardPlayed = (card: Card) => {
    handleCardPlayed(card);
  };

  const handleCloseGameResults = () => {
    reset(true);
  };
  //#endregion

  //#region Conditional prompt components to render.

  const renderErrorMessage = errorState && euchreGame && (
    <GameErrorPrompt
      key={euchreGame !== null ? 'modal' : 'init'}
      errorState={errorState}
      onAttemptToRecover={handleAttemptToRecover}
    />
  );

  const renderSettings = showSettings && (
    <GameSettings
      key={euchreGame !== null ? 'modal' : 'init'}
      settings={euchreSettings}
      onReturn={handleStartNewGame}
      onApplySettings={changeSettings}
      onRunFullGame={handleRunFullGame}
      onRunFullGameLoop={handleRunFullGameLoop}
    />
  );

  const renderIntro = !showSettings && promptValue.find((v) => v.type === PromptType.INTRO) && (
    <GamePrompt zIndex={90}>
      <GameIntro onBegin={handleBeginNewGame} onSettings={handleShowSettings} />
    </GamePrompt>
  );

  const renderBidPrompt = promptValue.find((v) => v.type === PromptType.BID) && euchreGame?.trump && (
    <BidPrompt
      game={euchreGame}
      firstRound={!gameFlow.hasFirstBiddingPassed}
      onBidSubmit={handleBidSubmit}
      settings={euchreSettings}
    />
  );

  const renderDiscardPrompt = promptValue.find((v) => v.type === PromptType.DISCARD) &&
    euchreGame?.trump &&
    euchreGame.dealer && (
      <DiscardPrompt
        pickedUpCard={euchreGame.trump}
        playerHand={euchreGame.dealer.hand}
        onDiscardSubmit={handleDiscardSubmit}
      />
    );

  const renderHandResults = promptValue.find((v) => v.type === PromptType.HAND_RESULT) &&
    euchreGame &&
    euchreGame.gameResults.length > 0 && (
      <HandResults
        game={euchreGame}
        settings={euchreSettings}
        handResult={euchreGame.gameResults.at(-1) ?? null}
        onClose={handleCloseHandResults}
        onReplayHand={handleReplayHand}
      />
    );

  const renderGameResults = promptValue.find((v) => v.type === PromptType.GAME_RESULT) &&
    euchreGame &&
    euchreGame.gameResults.length > 0 && (
      <GameResults
        game={euchreGame}
        settings={euchreSettings}
        gameResults={euchreGame.gameResults}
        onClose={handleCloseGameResults}
        onNewGame={handleStartGame}
        onReplayGame={() => handleBeginReplayGame(euchreGame)}
      />
    );

  const renderFullGameResults = fullGameInstance && (
    <div className="relative text-white">
      <GameResults
        game={fullGameInstance}
        settings={euchreSettings}
        gameResults={fullGameInstance.gameResults}
        onClose={handleCloseRunFullGame}
        onNewGame={() => null}
        onReplayGame={() => handleBeginReplayGame(fullGameInstance)}
      />
    </div>
  );

  //#endregion

  return (
    <>
      {enableFullScreen && <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg !z-50" />}

      <div
        id="euchre-game"
        className={clsx(
          `flex lg:p-1 overflow-auto`,
          { 'fixed top-0 left-0 w-full h-full z-50': enableFullScreen },
          { relative: !enableFullScreen },
          inter.className
        )}
      >
        <GameBorder className={clsx('w-full lg:w-auto lg:h-auto overflow-auto', { 'm-auto': !showEvents })}>
          {showSettings && !euchreGame ? (
            <>{renderSettings}</>
          ) : (
            <div className={`${SECTION_STYLE} lg:m-1 lg:h-auto grow relative bg-[url(/felt1.png)] h-full`}>
              {euchreGame && (
                <>
                  <GameArea
                    game={euchreGame}
                    gameAnimation={gameAnimationFlow}
                    gameFlow={gameFlow}
                    gameSettings={euchreSettings}
                    className={clsx('transition-opacity opacity-10 duration-1000', {
                      '!opacity-100': renderIntro === undefined
                    })}
                    isFullScreen={isFullScreen}
                    showEvents={showEvents}
                    showSettings={showSettings}
                    showScore={showScore}
                    playerNotification={playerNotification}
                    playedCard={playedCard}
                    onToggleFullscreen={toggleFullScreen}
                    onToggleEvents={toggleEvents}
                    onCardPlayed={handleGameCardPlayed}
                    onSettingsToggle={toggleSettings}
                    onScoreToggle={toggleScore}
                    onCancel={handleCancel}
                    onBeginComplete={handleShuffleAndDealComplete}
                  />
                  {showSettings && <GamePrompt zIndex={90}>{renderSettings}</GamePrompt>}
                  {renderIntro}
                </>
              )}
              {renderBidPrompt}
              {renderDiscardPrompt}
              {renderHandResults}
              {renderGameResults}
              {renderErrorMessage}
              {euchreGame && gameFlow.hasGameStarted && (
                <GameScore
                  game={euchreGame}
                  settings={euchreSettings}
                  showScore={showScore}
                  className="lg:min-h-16 lg:min-w-16 absolute top-2 lg:right-4 lg:left-auto left-8"
                />
              )}
            </div>
          )}
        </GameBorder>
        {showEvents && (
          <GameEvents
            events={events}
            onClear={clearEvents}
            onClose={() => toggleEvents(false)}
            className="right-16 top-0 dark:text-white"
          />
        )}
      </div>
      {showSettings && !euchreGame && renderFullGameResults}
      {/* <RenderCards color="red" size="12" rotate={true} /> */}
    </>
  );
}
