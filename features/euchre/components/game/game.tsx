'use client';

import React from 'react';
import { SECTION_STYLE } from '../../../../app/ui/home/home-description';
import { inter } from '../../../../app/ui/fonts';
import useEuchreGame from '@/features/euchre/hooks/game/useEuchreGame';
import GameBorder from './game-border';
import GameResult from '../prompt/game-result';
import GameEvents from './game-events';
import GameArea from './game-area';
import GamePrompt from '../prompt/game-prompt';
import useMenuItems from '@/features/euchre/hooks/common/useMenuItems';
import clsx from 'clsx';
import GameDebugMenu from './game-debug-menu';
import useEuchreDebug from '../../hooks/common/useEuchreDebug';
import { PromptType } from '../../definitions/definitions';
import { EuchreGameInstance } from '../../definitions/game-state-definitions';
import GamePrompts from '../prompt/game-prompts';

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

  const menuValues = useMenuItems(gameHandlers.onCancelAndReset, gameHandlers.onSettingsChange);
  const { isFullScreen, onToggleEvents, onToggleSettings, showEvents, showSettings } = menuValues;

  const enableFullScreen = stateValues.euchreGame && isFullScreen;
  // #endregion

  //#region Event Handlers

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance, autoPlay: boolean) => {
    onToggleSettings(false);
    gameHandlers.onReplayGame({ ...gameToReplay }, autoPlay);
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
      onClose={() => onToggleEvents(false)}
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

  const renderFullGameResults = showSettings && fullGameInstance && (
    <GamePrompt zIndex={90} className="m-auto">
      <GameResult
        game={fullGameInstance}
        settings={stateValues.euchreSettings}
        handResults={fullGameInstance.handResults}
        onClose={debugHandlers.onClearDebugGame}
        onNewGame={() => null}
        onReplayGame={(autoPlay: boolean) => handleBeginReplayGame(fullGameInstance, autoPlay)}
      />
    </GamePrompt>
  );

  const renderIntro = !showSettings && stateValues.promptValues.includes(PromptType.INTRO);

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
              playerNotification={stateValues.playerNotification}
              playedCard={stateValues.playedCard}
              initDealer={stateValues.initDealer}
              menuValues={menuValues}
            />
            <GamePrompts
              gameContext={gameContext}
              stateValues={stateValues}
              setters={setters}
              gameHandlers={gameHandlers}
              menuValues={menuValues}
              onOpenDebugMenu={handleStartGameForDebug}
              errorState={errorState}
              showSettings={showSettings}
              showScore={stateValues.euchreGameFlow.hasGameStarted}
            />
            {renderFullGameResults}
          </div>
        </GameBorder>
        {renderDebugMenu}
        {renderGameEvents}
      </div>
    </>
  );
}
