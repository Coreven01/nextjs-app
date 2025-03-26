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
import GameResults from './game-results';
import GameEvents from './game-events';
import GameArea from './game-area';
import { verela } from '../../fonts';
import GamePrompt from './game-prompt';
import useMenuItems from '@/app/hooks/euchre/useMenuItems';
import useEuchreGameAuto from '@/app/hooks/euchre/useEuchreGameAuto';
import { INIT_GAME_SETTINGS } from '@/app/lib/euchre/game-setup-logic';

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
    clearEvents,
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed,
    handleReplayHand
  } = useEuchreGame();

  const { isFullScreen, showEvents, showSettings, toggleFullScreen, toggleEvents, toggleSettings } =
    useMenuItems();

  const gameSettings: EuchreSettings = { ...INIT_GAME_SETTINGS };
  const { runFullGame, runFullGameLoop } = useEuchreGameAuto(gameSettings);
  const [fullGameInstance, setFullGameInstance] = useState<EuchreGameInstance | null>(null);

  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    handleSettingsChange(settings);
    console.log('game settings: ', settings);
  };

  const handleNewGame = () => {
    toggleSettings(false);
    beginNewGame();
  };

  const handleRunFullGame = () => {
    const game = runFullGame();
    setFullGameInstance(game);
  };

  const handleRunFullGameLoop = () => {
    const game = runFullGameLoop(100);
    setFullGameInstance(game);
  };

  const handleCloseRunFullGame = () => {
    setFullGameInstance(null);
  };
  //#endregion

  //#region Conditional prompts to render.

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
      />
    );

  const renderFullGameResults = fullGameInstance && (
    <div className="relative text-white">
      <GameResults
        game={fullGameInstance}
        settings={gameSettings}
        gameResults={fullGameInstance.allGameResults}
        onClose={handleCloseRunFullGame}
        onNewGame={() => null}
      />
    </div>
  );

  //#endregion

  return (
    <>
      {isFullScreen && <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg !z-50" />}

      <div
        id="euchre-game"
        className={`flex md:p-1 ${isFullScreen ? 'fixed top-0 left-0 w-full h-full z-50' : 'relative'} ${verela.className}`}
      >
        <GameBorder className="w-full md:w-auto md:h-auto overflow-auto">
          {showSettings && !euchreGame ? (
            <>
              {renderSettings}
              {renderFullGameResults}
            </>
          ) : (
            <div
              className={`${SECTION_STYLE} md:m-2 md:h-auto flex-grow relative bg-[url(/felt1.png)] h-full`}
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
                      onToggleFullscreeen={toggleFullScreen}
                      onToggleEvents={toggleEvents}
                      onCardPlayed={handleCardPlayed}
                      onSettingsToggle={toggleSettings}
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
                {showEvents && (
                  <GameEvents
                    events={events}
                    onClear={clearEvents}
                    onClose={() => toggleEvents(false)}
                    className="-left-2 top-0"
                  />
                )}
                {euchreGame && (
                  <GameScore
                    game={euchreGame}
                    settings={euchreSettings}
                    className="md:min-h-16 md:min-w-16 absolute top-2 md:right-2 left-8"
                  />
                )}
              </div>
            </div>
          )}
        </GameBorder>
      </div>
    </>
  );
}
