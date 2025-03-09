'use client';

import React, { RefObject, useRef } from 'react';
import ReactDOM from 'react-dom';
import PlayerGameDeck from './players-game-deck';
import GameSettings from './game-settings';
import { Card, EuchreSettings } from '@/app/lib/euchre/definitions';
import { SECTION_STYLE } from '../home/home-description';
import { GameInfo } from './game-info';
import { BidPrompt } from './bid-prompt';
import { DiscardPrompt } from './discard-prompt';
import Draggable, { DraggableEvent } from 'react-draggable';
import { DraggableCore } from 'react-draggable';
import { useEuchreGame } from '@/app/hooks/euchre/useEuchreGame';
import { HandResults } from './hand-results';
import { GameResults } from './game-results';

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
    beginNewGame,
    handleBidSubmit,
    handleResetGame,
    handleSettingsChange,
    handleCancelGame,
    handleDiscardSubmit,
    resaveGameState,
    handleCloseHandResults,
    handleCloseGameResults,
    handleCardPlayed
  } = useEuchreGame();

  // #endregion

  // #region Event Handlers

  const changeSettings = (settings: EuchreSettings) => {
    handleSettingsChange(settings);
  };

  console.log('Render Euchre Game Component');

  //#endregion
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
          <div className="flex relative">
            <div className={`m-2 p-2 ${SECTION_STYLE} mx-2 flex-grow relative`}>
              <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[150px,1fr,150px] gap-4 h-full">
                <div className="row-span-4 min-w-32">
                  <PlayerGameDeck
                    player={gameInstance.current.player3}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                    location="side"
                  />
                </div>
                <div className="col-span-1">
                  <PlayerGameDeck
                    player={gameInstance.current.player2}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                    location="center"
                  />
                </div>
                <div className="col-span-1 row-span-2">
                  <GameInfo playerInfoState={playerNotification} />
                </div>
                <div className="col-span-1 ">
                  <PlayerGameDeck
                    player={gameInstance.current.player1}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                    location="center"
                  />
                </div>
                <div className="row-span-4 min-w-32">
                  <PlayerGameDeck
                    player={gameInstance.current.player4}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                    location="side"
                  />
                </div>
              </div>
              {shouldPromptBid && gameInstance.current.trump ? (
                <BidPrompt
                  firstRound={!gameFlow.hasFirstBiddingPassed}
                  flipCard={gameInstance.current.trump}
                  onBidSubmit={handleBidSubmit}
                />
              ) : (
                <></>
              )}
              {shouldPromptDiscard && gameInstance.current.trump && gameInstance.current.dealer ? (
                <DiscardPrompt
                  pickedUpCard={gameInstance.current.trump}
                  playerHand={gameInstance.current.dealer.hand}
                  onDiscardSubmit={handleDiscardSubmit}
                />
              ) : (
                <></>
              )}
              {shouldShowHandResults && gameInstance.current.gameResults.length > 0 ? (
                <HandResults
                  handResult={gameInstance.current.gameResults.at(-1) ?? null}
                  onClose={handleCloseHandResults}
                />
              ) : (
                <></>
              )}
              {shouldShowGameResults && gameInstance.current.gameResults.length > 0 ? (
                <GameResults
                  gameResults={gameInstance.current.gameResults}
                  onClose={handleCloseGameResults}
                />
              ) : (
                <></>
              )}
            </div>
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
