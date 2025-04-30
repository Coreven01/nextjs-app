'use client';

import React, { useCallback, useState } from 'react';
import { SECTION_STYLE } from '../../home/home-description';
import { inter } from '../../fonts';
import { EuchreGameInstance, EuchreSettings } from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, PromptType } from '../../../lib/euchre/definitions/definitions';
import GameSettings from './game-settings';
import useEuchreGame from '@/app/hooks/euchre/useEuchreGame';
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
import useEuchreGameAuto from '@/app/hooks/euchre/useEuchreGameAuto';
import clsx from 'clsx';
import GameErrorPrompt from '../prompt/game-error-prompt';
import GameIntro from '../prompt/game-intro';

export default function EuchreGame() {
  // #region Hooks
  const { stateValues, eventHandlers, errorHandlers, gameHandlers, events, errorState, animationHandlers } =
    useEuchreGame();

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
  const enableFullScreen = stateValues.euchreGame && isFullScreen;
  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    gameHandlers.handleSettingsChange(settings);
  };

  const handleStartNewGame = () => {
    setFullGameInstance(null);
    toggleSettings(false);
    gameHandlers.handleBeginNewGame();
  };

  const handleRunFullGame = () => {
    const game = runFullGame(stateValues.euchreSettings);
    setFullGameInstance(game);
  };

  const handleRunFullGameLoop = () => {
    const game = runFullGameLoop(100, stateValues.euchreSettings);
    setFullGameInstance(game);
  };

  const handleCloseRunFullGame = () => {
    setFullGameInstance(null);
  };

  const handleCancel = useCallback(() => {
    gameHandlers.handleCancelAndReset();
    toggleSettings(false);
  }, [gameHandlers, toggleSettings]);

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance) => {
    setFullGameInstance(null);
    toggleSettings(false);
    gameHandlers.handleReplayGame({ ...gameToReplay });
  };

  const handleShowSettings = () => {
    toggleSettings(true);
  };

  const handleGameCardPlayed = (card: Card) => {
    animationHandlers.handleCardPlayed(card);
  };

  const handleCloseGameResults = () => {
    gameHandlers.reset(true);
  };
  //#endregion

  //#region Conditional prompt components to render.

  const renderErrorMessage = errorState && stateValues.euchreGame && (
    <GameErrorPrompt
      key={stateValues.euchreGame !== null ? 'modal' : 'init'}
      errorState={errorState}
      onAttemptToRecover={gameHandlers.handleAttemptToRecover}
    />
  );

  const renderSettings = showSettings && (
    <GamePrompt zIndex={90}>
      <GameSettings
        key={stateValues.euchreGame !== null ? 'modal' : 'init'}
        settings={stateValues.euchreSettings}
        onReturn={handleStartNewGame}
        onApplySettings={changeSettings}
        onRunFullGame={handleRunFullGame}
        onRunFullGameLoop={handleRunFullGameLoop}
      />
    </GamePrompt>
  );

  const renderIntro = !showSettings && stateValues.promptValue.find((v) => v.type === PromptType.INTRO) && (
    <GamePrompt innerClass="bg-green-300 bg-opacity-10" id="euchre-game-intro" zIndex={90}>
      <GameIntro onBegin={handleStartNewGame} onSettings={handleShowSettings} />
    </GamePrompt>
  );

  const renderBidPrompt = stateValues.promptValue.find((v) => v.type === PromptType.BID) &&
    stateValues.euchreGame?.trump && (
      <BidPrompt
        game={stateValues.euchreGame}
        firstRound={!stateValues.euchreGameFlow.hasFirstBiddingPassed}
        onBidSubmit={gameHandlers.handleBidSubmit}
        settings={stateValues.euchreSettings}
      />
    );

  const renderDiscardPrompt = stateValues.promptValue.find((v) => v.type === PromptType.DISCARD) &&
    stateValues.euchreGame?.trump &&
    stateValues.euchreGame.dealer && (
      <DiscardPrompt
        pickedUpCard={stateValues.euchreGame.trump}
        playerHand={stateValues.euchreGame.dealer.hand}
        onDiscardSubmit={gameHandlers.handleDiscardSubmit}
      />
    );

  const renderHandResults = stateValues.promptValue.find((v) => v.type === PromptType.HAND_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <HandResults
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResult={stateValues.euchreGame.handResults.at(-1) ?? null}
        onClose={gameHandlers.handleCloseHandResults}
        onReplayHand={gameHandlers.handleReplayHand}
      />
    );

  const renderGameResults = stateValues.promptValue.find((v) => v.type === PromptType.GAME_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <GameResult
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResults={stateValues.euchreGame.handResults}
        onClose={handleCloseGameResults}
        onNewGame={gameHandlers.handleBeginNewGame}
        onReplayGame={() => handleBeginReplayGame(stateValues.euchreGame)}
      />
    );

  const renderFullGameResults = fullGameInstance && (
    <GamePrompt zIndex={90} className="m-auto">
      <GameResult
        game={fullGameInstance}
        settings={stateValues.euchreSettings}
        handResults={fullGameInstance.handResults}
        onClose={handleCloseRunFullGame}
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
              id="euchre-game-area"
              state={stateValues}
              className={clsx('transition-opacity opacity-10 duration-1000', {
                '!opacity-100': renderIntro === undefined
              })}
              isFullScreen={isFullScreen}
              showEvents={showEvents}
              showSettings={showSettings}
              showScore={showScore}
              playerNotification={stateValues.playerNotification}
              playedCard={stateValues.playedCard}
              onToggleFullscreen={toggleFullScreen}
              onToggleEvents={toggleEvents}
              onSettingsToggle={toggleSettings}
              onScoreToggle={toggleScore}
              onCancel={handleCancel}
              animationHandlers={animationHandlers}
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
        {showEvents && (
          <GameEvents
            events={events}
            onClear={eventHandlers.clearEvents}
            onClose={() => toggleEvents(false)}
            className="right-16 top-0 dark:text-white"
          />
        )}
      </div>

      {/* <RenderCards color="red" size="12" rotate={true} /> */}
    </>
  );
}
