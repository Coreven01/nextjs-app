'use client';

import React, { useCallback } from 'react';
import { SECTION_STYLE } from '../../../../app/ui/home/home-description';
import { inter } from '../../../../app/ui/fonts';
import GameSettings from './game-settings';
import useEuchreGame from '@/app/hooks/euchre/gameplay/useEuchreGame';
import GameScore from './game-score';
import GameBorder from './game-border';
import BidPrompt from '../prompt/bid-prompt';
import DiscardPrompt from '../prompt/discard-prompt';
import HandResults from '../prompt/hand-results';
import GameResult from '../prompt/game-result';
import GameEvents from './game-events';
import GameArea from './game-area';
import GamePrompt from '../prompt/game-prompt';
import useMenuItems from '@/app/hooks/euchre/useMenuItems';
import clsx from 'clsx';
import GameErrorPrompt from '../prompt/game-error-prompt';
import GameIntro from '../prompt/game-intro';
import GameDebugMenu from './game-debug-menu';
import useEuchreDebug from '../../../../app/hooks/euchre/useEuchreDebug';
import { PromptType } from '../../definitions/definitions';
import { EuchreSettings, EuchreGameInstance } from '../../definitions/game-state-definitions';

export default function EuchreGame() {
  //#region Hooks
  const { gameContext, stateValues, setters, gameHandlers, events, errorState } = useEuchreGame();

  const { fullGameInstance, handleStartGameForDebug, handleCloseDebugGame, debugHandlers } = useEuchreDebug(
    stateValues,
    gameHandlers,
    setters,
    gameContext.eventHandlers,
    gameContext.errorHandlers
  );

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

  const enableFullScreen = stateValues.euchreGame && isFullScreen;
  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    gameHandlers.onSettingsChange(settings);
  };

  const handleStartNewGame = () => {
    toggleSettings(false);
    gameHandlers.onBeginNewGame();
  };

  const handleReturnFromSettings = () => {
    toggleSettings(false);
  };

  const handleCancel = useCallback(() => {
    gameHandlers.onCancelAndReset();
    toggleSettings(false);
  }, [gameHandlers, toggleSettings]);

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance) => {
    toggleSettings(false);
    gameHandlers.onReplayGame({ ...gameToReplay });
  };

  const handleShowSettings = () => {
    toggleSettings(true);
  };

  const handleCloseGameResults = () => {
    setters.clearPromptValues();
    gameHandlers.reset(true);
  };

  const handleOpenDebugMenu = () => {
    handleStartGameForDebug();
  };

  const handleCloseDebugMenu = () => {
    handleCloseDebugGame();
  };

  //#endregion

  //#region Conditional prompt components to render.

  const renderGameEvents = showEvents && (
    <GameEvents
      events={events}
      onClear={gameContext.eventHandlers.clearEvents}
      onClose={() => toggleEvents(false)}
      className="right-16 top-0 dark:text-white"
    />
  );

  const renderDebugMenu = !showSettings && stateValues.promptValues.includes(PromptType.DEBUG) && (
    <GameDebugMenu
      handlers={debugHandlers}
      onClose={handleCloseDebugMenu}
      className="right-16 top-0 dark:text-white"
    />
  );

  const renderErrorMessage = errorState && stateValues.euchreGame && (
    <GameErrorPrompt
      key={stateValues.euchreGame !== null ? 'modal' : 'init'}
      errorState={errorState}
      onAttemptToRecover={gameContext.errorHandlers.onResetError}
    />
  );

  const renderSettings = showSettings && (
    <GamePrompt zIndex={90}>
      <GameSettings
        key={stateValues.euchreGame !== null ? 'modal' : 'init'}
        settings={stateValues.euchreSettings}
        onReturn={handleReturnFromSettings}
        onApplySettings={changeSettings}
      />
    </GamePrompt>
  );

  const renderIntro = !showSettings && stateValues.promptValues.includes(PromptType.INTRO) && (
    <GamePrompt innerClass="bg-green-300 bg-opacity-10" className="mt-8" id="game-intro" zIndex={90}>
      <GameIntro
        enableDebug={stateValues.euchreSettings.debugEnableDebugMenu}
        onRunDebug={handleOpenDebugMenu}
        onBegin={handleStartNewGame}
        onSettings={handleShowSettings}
      />
    </GamePrompt>
  );

  const renderBidPrompt = stateValues.promptValues.includes(PromptType.BID) &&
    stateValues.euchreGame?.trump && (
      <BidPrompt
        game={stateValues.euchreGame}
        firstRound={!stateValues.euchreGameFlow.hasFirstBiddingPassed}
        onBidSubmit={gameHandlers.onBidSubmit}
        settings={stateValues.euchreSettings}
      />
    );

  const renderDiscardPrompt = stateValues.promptValues.includes(PromptType.DISCARD) &&
    stateValues.euchreGame?.trump &&
    stateValues.euchreGame.dealer && (
      <DiscardPrompt
        pickedUpCard={stateValues.euchreGame.trump}
        playerHand={stateValues.euchreGame.dealer.hand}
        onDiscardSubmit={gameHandlers.onDiscardSubmit}
      />
    );

  const renderHandResults = stateValues.promptValues.includes(PromptType.HAND_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <HandResults
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResult={stateValues.euchreGame.handResults.at(-1) ?? null}
        onClose={gameHandlers.onCloseHandResults}
        onReplayHand={gameHandlers.onReplayHand}
      />
    );

  const renderGameResults = stateValues.promptValues.includes(PromptType.GAME_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <GameResult
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResults={stateValues.euchreGame.handResults}
        onClose={handleCloseGameResults}
        onNewGame={gameHandlers.onBeginNewGame}
        onReplayGame={() => handleBeginReplayGame(stateValues.euchreGame)}
      />
    );

  const renderFullGameResults = fullGameInstance && (
    <GamePrompt zIndex={90} className="m-auto">
      <GameResult
        game={fullGameInstance}
        settings={stateValues.euchreSettings}
        handResults={fullGameInstance.handResults}
        onClose={debugHandlers.onClearDebugGame}
        onNewGame={() => null}
        onReplayGame={() => handleBeginReplayGame(fullGameInstance)}
      />
    </GamePrompt>
  );

  //#endregion

  return (
    <>
      {enableFullScreen && <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg !z-50" />}

      <div
        id="euchre-game"
        className={clsx(
          `flex lg:p-1 overflow-auto select-none`,
          { 'fixed top-0 left-0 w-full h-full z-50': enableFullScreen },
          { relative: !enableFullScreen },
          inter.className
        )}
      >
        <GameBorder
          className={clsx('w-full lg:w-auto lg:h-auto lg:max-h-full overflow-auto h-screen max-h-[800px]', {
            'm-auto': !showEvents
          })}
        >
          <div
            className={`${SECTION_STYLE} lg:m-1 lg:h-auto lg:max-h-full grow relative bg-[url(/felt1.png)] h-full max-h-[800px]`}
          >
            <GameArea
              id="game-area"
              gameContext={gameContext}
              className={clsx('transition-opacity opacity-10 duration-1000', {
                '!opacity-100': !renderIntro
              })}
              isFullScreen={isFullScreen}
              showEvents={showEvents}
              showSettings={showSettings}
              showScore={showScore}
              playerNotification={stateValues.playerNotification}
              playedCard={stateValues.playedCard}
              initDealer={stateValues.initDealer}
              onToggleFullscreen={toggleFullScreen}
              onToggleEvents={toggleEvents}
              onSettingsToggle={toggleSettings}
              onScoreToggle={toggleScore}
              onCancel={handleCancel}
            />
            {renderSettings}
            {renderIntro}
            {renderBidPrompt}
            {renderDiscardPrompt}
            {renderHandResults}
            {renderGameResults}
            {renderErrorMessage}
            {showSettings && renderFullGameResults}
            {stateValues.euchreGameFlow.hasGameStarted && (
              <GameScore
                game={stateValues.euchreGame}
                settings={stateValues.euchreSettings}
                showScore={showScore}
                className="lg:min-h-16 lg:min-w-16 absolute top-2 lg:right-4 lg:left-auto left-8"
              />
            )}
          </div>
        </GameBorder>
        {renderDebugMenu}
        {renderGameEvents}
      </div>
    </>
  );
}
