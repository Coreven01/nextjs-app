'use client';

import React from "react";
import PlayerGameDeck from "./players-game-deck";
import GameSettings from "./game-settings";
import { EuchreSettings } from "@/app/lib/euchre/data";
import { SECTION_STYLE } from "../home/home-description";
import { GameInfo } from "./game-info";
import { OrderTrump } from "./order-trump";
import { useEuchreGame } from "@/app/lib/euchre/useEuchreGame";
import { DiscardPrompt } from "./discard-prompt";

export default function EuchreGame() {

    // #region Hooks
    const {
        game,
        gameState,
        playerInfoState,
        shouldPromptBid,
        shouldPromptDiscard,
        gameSettings,
        beginNewGame,
        handleBidSubmit,
        handleResetGame,
        handleSettingsChange,
        handlePlayCard,
        handleCancelGame,
        handleDiscardSubmit } = useEuchreGame();
    // #endregion

    // #region Event Handlers

    const changeSettings = (settings: EuchreSettings) => {
        handleSettingsChange(settings);
    }

    //#endregion
    return (
        <>
            {!game ?
                (<div className={`m-2 p-2 ${SECTION_STYLE} max-w-[980px] mx-auto`}>
                    <GameSettings settings={gameSettings} onNewGame={beginNewGame} onApplySettings={changeSettings} />
                </div>) : <></>}
            {game ?
                <>
                    <div className="flex relative">
                        <div className="bg-white w-32 absolute h-full"> Testing</div>
                        <div className={`m-2 p-2 ${SECTION_STYLE} max-w-[980px] mx-auto relative`}>
                            <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[150px,1fr,150px] gap-4 h-full">
                                <div className="row-span-4 min-w-32">
                                    <PlayerGameDeck
                                        player={game.player3}
                                        game={game}
                                        gameState={gameState}
                                        onCardClick={handlePlayCard}
                                        dealDeck={game.deck}
                                        location="side" />
                                </div>
                                <div className="col-span-1">
                                    <PlayerGameDeck
                                        player={game.player2}
                                        game={game}
                                        gameState={gameState}
                                        onCardClick={handlePlayCard}
                                        dealDeck={game.deck}
                                        location="center" />
                                </div>
                                <div className="col-span-1 row-span-2">
                                    <GameInfo playerInfoState={playerInfoState} />
                                </div>
                                <div className="col-span-1 ">
                                    <PlayerGameDeck
                                        player={game.player1}
                                        game={game}
                                        gameState={gameState}
                                        onCardClick={handlePlayCard}
                                        dealDeck={game.deck}
                                        location="center" />
                                </div>
                                <div className="row-span-4 min-w-32">
                                    <PlayerGameDeck
                                        player={game.player4}
                                        game={game}
                                        gameState={gameState}
                                        onCardClick={handlePlayCard}
                                        dealDeck={game.deck}
                                        location="side" />
                                </div>
                            </div>
                            {shouldPromptBid && game.trump ?
                                <OrderTrump firstRound={!gameState.hasFirstBiddingPassed} flipCard={game.trump} onBidSubmit={handleBidSubmit} /> :
                                <></>}
                            {shouldPromptDiscard && game.trump && game.dealer ?
                                <DiscardPrompt pickedUpCard={game.trump} playerHand={game.dealer.hand} onDiscardSubmit={handleDiscardSubmit} /> :
                                <></>}
                        </div>
                    </div>
                    <div className={`${SECTION_STYLE} m-2`}>
                        <div>
                            <button onClick={handleResetGame}>Go to Settings</button>
                        </div>
                        <div>
                            <button onClick={handleCancelGame}>Cancel</button>
                        </div>
                    </div>
                </> : <></>}
        </>
    );
}