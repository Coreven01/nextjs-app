'use client';

import React from "react";
import PlayerGameDeck from "./players-game-deck";
import { EuchreSettings } from "@/app/lib/euchre/data";
import { sectionStyle } from "../home/home-description";
import GameSettings from "./game-settings";
import { GameInfo } from "./game-info";
import { OrderTrump } from "./order-trump";
import { useEuchreGame } from "@/app/lib/euchre/useEuchreGame";

export default function EuchreGame() {

    // #region Hooks
    const { 
        game, 
        gameState, 
        playerInfoState, 
        shouldPromptBid, 
        gameSettings, 
        beginNewGame, 
        handleBidSubmit, 
        resetGame,
        handleSettingsChange } = useEuchreGame();
    // #endregion

    // #region Event Handlers

    const orderFirstRoundTrump = () => {

    }

    const displayFlippedCard = () => {

        // if (!game?.dealer)
        //     throw Error("Game not found.");

        // const info = <CenterInfo>Test</CenterInfo>;
        // const dealerPlayerNumber = game.dealer.playerNumber ?? 0;

        // dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState, player1Info: info } });
    }

    const playCard = async (src: string, dest: string, player: number) => {

        // if (pause || !game)
        //     return;

        // setPaused(true);
        // alert(src + dest);
        // //setPlayElements(src, dest, player);

        // const { number, index } = getPlayerAndCard(src);

        // const newGame = playGameCard(number, index, game);
        // await new Promise((resolve) => setTimeout(resolve, 500));

        // setPaused(false);
    }

    const changeSettings = (settings: EuchreSettings) => {
        //setSettings(settings);
    }

    //#endregion

    //#region Prompt for user input or run logic if AI is the current player.
    if (game && gameState.hasGameStarted && gameState.isDetermineDealer) {

        console.log("Euchre Game - Begin determine dealer");
        //beginDealCardsForDealer();

    } else if (game && gameState.hasGameStarted && !gameState.areCardsDealt && !gameState.isDetermineDealer) {
        console.log("Euchre Game - Begin dealing hand");

        //shuffleAndDealHand();
    } else if (game && gameState.hasGameStarted && gameState.isGameBidding) {
        console.log("Euchre Game - Begin bidding");

        //displayFlippedCard();

        if (game.currentPlayer?.human) {
            // prompt for user to select trump.
        } else {
            // ai chooses whether or not to order up trump.
        }
    } else if (game && gameState.hasGameStarted) {
        console.log("Euchre Game - Begin play game");

        // check game won.

        if (game.currentPlayer?.human) {
            // wait for user to select a card to play
        } else {
            // ai chooses what card to play.
        }
    }
    //#endregion

    const displayCards = !gameState.isDetermineDealer && gameState.areCardsDealt;

    console.log("Euchre Game Render - Game state: ", gameState);

    return (
        <>
            {!game ?
                (<div className={`m-2 p-2 ${sectionStyle} max-w-[980px] mx-auto`}>
                    <GameSettings onNewGame={beginNewGame} onApplySettings={changeSettings} />
                </div>) : <></>}
            {game ?
                <div className={`m-2 p-2 ${sectionStyle} max-w-[980px] mx-auto relative`}>
                    <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[150px,1fr,150px] gap-4 h-full">
                        <div className="row-span-4 min-w-32">
                            <PlayerGameDeck
                                player={game.player3}
                                game={game}
                                onCardClick={playCard}
                                dealDeck={game.deck}
                                deckVisible={gameState.shouldShowDeck && game.player3.playerNumber === game.dealer?.playerNumber}
                                location="side"
                                cardsVisible={displayCards} />
                        </div>
                        <div className="col-span-1">
                            <PlayerGameDeck
                                player={game.player2}
                                game={game}
                                onCardClick={playCard}
                                dealDeck={game.deck}
                                deckVisible={gameState.shouldShowDeck && game.player2.playerNumber === game.dealer?.playerNumber}
                                location="center"
                                cardsVisible={displayCards} />
                        </div>
                        <div className="col-span-1 row-span-2">
                            <GameInfo playerInfoState={playerInfoState} />
                        </div>
                        <div className="col-span-1 ">
                            <PlayerGameDeck
                                player={game.player1}
                                game={game}
                                onCardClick={playCard}
                                dealDeck={game.deck}
                                deckVisible={gameState.shouldShowDeck && game.player1.playerNumber === game.dealer?.playerNumber}
                                location="center"
                                cardsVisible={displayCards} />
                        </div>
                        <div className="row-span-4 min-w-32">
                            <PlayerGameDeck
                                player={game.player4}
                                game={game}
                                onCardClick={playCard}
                                dealDeck={game.deck}
                                deckVisible={gameState.shouldShowDeck && game.player4.playerNumber === game.dealer?.playerNumber}
                                location="side"
                                cardsVisible={displayCards} />
                        </div>
                    </div>
                    <div>
                        <button onClick={resetGame}>Go to Settings</button>
                    </div>
                    {shouldPromptBid ? <OrderTrump firstRound={!gameState.hasFirstBiddingPassed} flipCard={game.trump} onBidSubmit={handleBidSubmit} /> : <></>}
                </div> : <></>}
        </>
    );
}