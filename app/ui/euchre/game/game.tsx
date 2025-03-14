'use client';

import React, { useState } from 'react';
import PlayerGameDeck from '../player/players-game-deck';
import GameSettings from './game-settings';
import { EuchreSettings } from '@/app/lib/euchre/definitions';
import { SECTION_STYLE } from '../../home/home-description';
import { GameInfo } from './game-info';
import { useEuchreGame } from '@/app/hooks/euchre/useEuchreGame';
import GameScore from './game-score';
import GameBorder from './game-border';
import BidPrompt from '../prompt/bid-prompt';
import DiscardPrompt from '../prompt/discard-prompt';
import HandResults from '../prompt/hand-results';
import GameResults from './game-results';
import GameEvents from './game-events';

export default function EuchreGame() {
  // #region Hooks
  const {
    gameInstance,
    gameFlow,
    gameAnimationFlow,
    playerNotification,
    shouldPromptBid,
    shouldPromptDiscard,
    shouldShowHandResults,
    shouldShowGameResults,
    gameSettings,
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
  const [isFullScreen, setIsFullScreen] = useState(false);
  const arrowUpSvg = `checked:bg-[url('/arrowup.svg')] bg-[url('/arrowup.svg')]`;
  const arrowDownSvg = `checked:bg-[url('/arrowdown.svg')] bg-[url('/arrowdown.svg')]`;
  const menuSvg =
    (isFullScreen ? arrowDownSvg : arrowUpSvg) +
    ` bg-no-repeat bg-center bg-[length:1.75rem] bg-[rgba(25,115,25,0.9)] 
  dark:bg-[rgba(25,115,25,0.9)] border border-black appearance-none cursor-pointer border rounded w-8 h-8 checked:dark:bg-stone-500`;
  // #endregion

  //#region Event Handlers
  const changeSettings = (settings: EuchreSettings) => {
    handleSettingsChange(settings);
  };

  const toggleFullScreen = (value: boolean) => {
    setIsFullScreen(value);
  };
  //#endregion

  //#region Conditional prompts to render.

  const renderBidPrompt =
    shouldPromptBid && gameInstance.current?.trump ? (
      <BidPrompt
        game={gameInstance.current}
        firstRound={!gameFlow.hasFirstBiddingPassed}
        onBidSubmit={handleBidSubmit}
        settings={gameSettings.current}
      />
    ) : (
      <></>
    );

  const renderDiscardPrompt =
    shouldPromptDiscard && gameInstance.current?.trump && gameInstance.current.dealer ? (
      <DiscardPrompt
        pickedUpCard={gameInstance.current.trump}
        playerHand={gameInstance.current.dealer.availableCards}
        onDiscardSubmit={handleDiscardSubmit}
      />
    ) : (
      <></>
    );

  const renderHandResults =
    shouldShowHandResults &&
    gameSettings.current &&
    gameInstance.current &&
    gameInstance.current.gameResults.length > 0 ? (
      <HandResults
        game={gameInstance.current}
        settings={gameSettings.current}
        handResult={gameInstance.current.gameResults.at(-1) ?? null}
        onClose={handleCloseHandResults}
        onReplayHand={handleReplayHand}
      />
    ) : (
      <></>
    );

  const renderGameResults =
    shouldShowGameResults && gameInstance.current && gameInstance.current.gameResults.length > 0 ? (
      <GameResults
        gameResults={gameInstance.current.gameResults}
        onClose={handleCloseGameResults}
        onReplayHand={handleReplayHand}
      />
    ) : (
      <></>
    );

  //#endregion

  console.log('Render Euchre Game Component');

  return (
    <>
      {!gameInstance.current ? (
        <div className={`m-2 p-2 ${SECTION_STYLE} mx-2`}>
          <GameSettings
            settings={gameSettings.current}
            onNewGame={beginNewGame}
            onApplySettings={changeSettings}
          />
        </div>
      ) : (
        <></>
      )}
      {gameInstance.current ? (
        <>
          {isFullScreen && <div className="fixed top-0 left-0 h-full w-full pl-bg dark:dk-bg !z-20" />}
          <div
            id="euchre-game"
            className={`flex p-1 ${isFullScreen ? 'fixed top-0 left-0 w-full h-full z-30' : 'relative'}`}
          >
            <GameBorder>
              <div
                className={`m-2 p-2 ${SECTION_STYLE} mx-2 flex-grow relative bg-[url(/feltgreen5.png)] bg-auto`}
              >
                <div className="absolute z-50 bg-black" onClick={() => setIsFullScreen(!isFullScreen)}>
                  <input
                    checked={isFullScreen}
                    type="checkbox"
                    title="Toggle Fullscreen"
                    className={`${menuSvg}`}
                    onChange={(e) => toggleFullScreen(e.target.checked)}
                  />
                </div>
                <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[1fr,600px,1fr] gap-4 h-full">
                  <div className="row-span-4 min-w-[175px]">
                    <PlayerGameDeck
                      player={gameInstance.current.player3}
                      game={gameInstance.current}
                      gameFlow={gameFlow}
                      settings={gameSettings.current}
                      onCardClick={handleCardPlayed}
                      dealDeck={gameInstance.current.deck}
                    />
                  </div>
                  <div className="col-span-1">
                    <PlayerGameDeck
                      player={gameInstance.current.player2}
                      game={gameInstance.current}
                      gameFlow={gameFlow}
                      settings={gameSettings.current}
                      onCardClick={handleCardPlayed}
                      dealDeck={gameInstance.current.deck}
                    />
                  </div>
                  <div className="col-span-1 row-span-2">
                    <GameInfo playerInfoState={playerNotification} />
                  </div>
                  <div className="col-span-1 ">
                    <PlayerGameDeck
                      player={gameInstance.current.player1}
                      game={gameInstance.current}
                      gameFlow={gameFlow}
                      settings={gameSettings.current}
                      onCardClick={handleCardPlayed}
                      dealDeck={gameInstance.current.deck}
                    />
                  </div>
                  <div className="row-span-4 min-w-[175px]">
                    <PlayerGameDeck
                      player={gameInstance.current.player4}
                      game={gameInstance.current}
                      gameFlow={gameFlow}
                      settings={gameSettings.current}
                      onCardClick={handleCardPlayed}
                      dealDeck={gameInstance.current.deck}
                    />
                  </div>
                </div>
                {renderBidPrompt}
                {renderDiscardPrompt}
                {renderHandResults}
                {renderGameResults}
                <GameEvents events={events} onClear={clearEvents} className="-left-2 top-0"></GameEvents>
                <GameScore
                  game={gameInstance.current}
                  className="min-h-16 min-w-16 absolute top-2 right-2"
                ></GameScore>
              </div>
            </GameBorder>
          </div>
          <div className={`${SECTION_STYLE} m-2`}>
            <div>
              <button onClick={handleResetGame}>Go to Settings</button>
            </div>
            <div>
              <button onClick={handleCancelGame}>Cancel</button>
            </div>
            <div>
              <button onClick={resaveGameState}>Re-save Game State</button>
            </div>
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}
