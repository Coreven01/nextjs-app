'use client';

import React from 'react';
import PlayerGameDeck from './player/players-game-deck';
import GameSettings from './game-settings';
import { EuchreSettings } from '@/app/lib/euchre/definitions';
import { SECTION_STYLE } from '../home/home-description';
import { GameInfo } from './game-info';
import { BidPrompt } from './prompt/bid-prompt';
import { DiscardPrompt } from './prompt/discard-prompt';
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
    handleCardPlayed,
    handleReplayHand
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
              <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[1fr,600px,1fr] gap-4 h-full">
                <div className="row-span-4 min-w-32">
                  <PlayerGameDeck
                    player={gameInstance.current.player3}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                  />
                </div>
                <div className="col-span-1">
                  <PlayerGameDeck
                    player={gameInstance.current.player2}
                    game={gameInstance.current}
                    gameState={gameFlow}
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
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                  />
                </div>
                <div className="row-span-4 min-w-32">
                  <PlayerGameDeck
                    player={gameInstance.current.player4}
                    game={gameInstance.current}
                    gameState={gameFlow}
                    onCardClick={handleCardPlayed}
                    dealDeck={gameInstance.current.deck}
                  />
                </div>
              </div>
              {shouldPromptBid && gameInstance.current.trump ? (
                <BidPrompt
                  game={gameInstance.current}
                  firstRound={!gameFlow.hasFirstBiddingPassed}
                  onBidSubmit={handleBidSubmit}
                />
              ) : (
                <></>
              )}
              {shouldPromptDiscard && gameInstance.current.trump && gameInstance.current.dealer ? (
                <DiscardPrompt
                  pickedUpCard={gameInstance.current.trump}
                  playerHand={gameInstance.current.dealer.availableCards}
                  onDiscardSubmit={handleDiscardSubmit}
                />
              ) : (
                <></>
              )}
              {shouldShowHandResults && gameInstance.current.gameResults.length > 0 ? (
                <HandResults
                  handResult={gameInstance.current.gameResults.at(-1) ?? null}
                  onClose={handleCloseHandResults}
                  onReplayHand={handleReplayHand}
                />
              ) : (
                <></>
              )}
              {shouldShowGameResults && gameInstance.current.gameResults.length > 0 ? (
                <GameResults
                  gameResults={gameInstance.current.gameResults}
                  onClose={handleCloseGameResults}
                  onReplayHand={handleReplayHand}
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
