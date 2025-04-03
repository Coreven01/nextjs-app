'use client';

import React, { useState } from 'react';
import { EuchreGameInstance, EuchreSettings, PromptType } from '@/app/lib/euchre/definitions';
import { SECTION_STYLE } from '../../home/home-description';
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
import { inter } from '../../fonts';
import GamePrompt from '../prompt/game-prompt';
import useMenuItems from '@/app/hooks/euchre/useMenuItems';
import useEuchreGameAuto from '@/app/hooks/euchre/useEuchreGameAuto';
import clsx from 'clsx';
import RenderCards from '../render-cards';
import GameErrorPrompt from '../prompt/game-error-prompt';

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
    clearEvents,
    beginNewGame,
    handleBidSubmit,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed,
    handleReplayHand,
    handleCancelAndReset,
    handleReplayGame,
    handleAttemptToRecover
  } = useEuchreGame();

  const { isFullScreen, showEvents, showSettings, toggleFullScreen, toggleEvents, toggleSettings } =
    useMenuItems();

  const { runFullGame, runFullGameLoop } = useEuchreGameAuto();
  const [fullGameInstance, setFullGameInstance] = useState<EuchreGameInstance | null>(null);
  const enableFullScreen = euchreGame && isFullScreen;

  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    handleSettingsChange(settings);
  };

  const handleNewGame = () => {
    setFullGameInstance(null);
    toggleSettings(false);
    beginNewGame();
  };

  const handleRunFullGame = () => {
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

  const handleCancel = () => {
    handleCancelAndReset();
    toggleSettings(true);
  };

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance) => {
    setFullGameInstance(null);
    toggleSettings(false);
    handleReplayGame(gameToReplay);
  };

  //#endregion

  //#region Conditional prompts to render.

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
      onNewGame={handleNewGame}
      onApplySettings={changeSettings}
      onRunFullGame={handleRunFullGame}
      onRunFullGameLoop={handleRunFullGameLoop}
    />
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
        playerHand={euchreGame.dealer.availableCards}
        onDiscardSubmit={handleDiscardSubmit}
      />
    );

  const renderHandResults = promptValue.find((v) => v.type === PromptType.HAND_RESULT) &&
    euchreGame &&
    euchreGame.allGameResults.length > 0 && (
      <HandResults
        game={euchreGame}
        settings={euchreSettings}
        handResult={euchreGame.allGameResults.at(-1) ?? null}
        onClose={handleCloseHandResults}
        onReplayHand={handleReplayHand}
      />
    );

  const renderGameResults = promptValue.find((v) => v.type === PromptType.GAME_RESULT) &&
    euchreGame &&
    euchreGame.allGameResults.length > 0 && (
      <GameResults
        game={euchreGame}
        settings={euchreSettings}
        gameResults={euchreGame.allGameResults}
        onClose={handleCloseGameResults}
        onNewGame={handleNewGame}
        onReplayGame={() => handleBeginReplayGame(euchreGame)}
      />
    );

  const renderFullGameResults = fullGameInstance && (
    <div className="relative text-white">
      <GameResults
        game={fullGameInstance}
        settings={euchreSettings}
        gameResults={fullGameInstance.allGameResults}
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
          `flex md:p-1 overflow-auto`,
          { 'fixed top-0 left-0 w-full h-full z-50': enableFullScreen },
          { relative: !enableFullScreen },
          inter.className
        )}
      >
        <GameBorder className={clsx('w-full md:w-auto md:h-auto overflow-auto', { 'm-auto': !showEvents })}>
          {showSettings && !euchreGame ? (
            <>{renderSettings}</>
          ) : (
            <div
              className={`${SECTION_STYLE} md:m-1 md:h-auto flex-grow relative bg-[url(/felt1.png)] h-full`}
            >
              <div className="md:m-2">
                {euchreGame ? (
                  <>
                    <GameArea
                      gameInstance={euchreGame}
                      gameFlow={gameFlow}
                      gameSettings={euchreSettings}
                      isFullScreen={isFullScreen}
                      showEvents={showEvents}
                      showSettings={showSettings}
                      playerNotification={playerNotification}
                      onToggleFullscreen={toggleFullScreen}
                      onToggleEvents={toggleEvents}
                      onCardPlayed={handleCardPlayed}
                      onSettingsToggle={toggleSettings}
                      onCancel={handleCancel}
                    />
                    {showSettings && <GamePrompt zIndex={90}>{renderSettings}</GamePrompt>}
                  </>
                ) : (
                  <></>
                )}
                {renderBidPrompt}
                {renderDiscardPrompt}
                {renderHandResults}
                {renderGameResults}
                {renderErrorMessage}
                {euchreGame && (
                  <GameScore
                    game={euchreGame}
                    settings={euchreSettings}
                    className="md:min-h-16 md:min-w-16 absolute top-2 md:right-4 md:left-auto left-8"
                  />
                )}
              </div>
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
