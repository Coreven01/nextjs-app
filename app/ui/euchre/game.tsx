'use client';

import React, { useReducer, useState } from "react";
import PlayerGameDeck from "./players-game-deck";
import { EuchreGameInstance, EuchreSettings } from "@/app/lib/euchre/data";
import { sectionStyle } from "../home/home-description";
import { useDealCard, usePlayCard, useRemoveTransformations, useRemoveElement, useFadeOut } from "@/app/lib/euchre/actions";
import { createEuchreGame, createShuffledDeck, dealCards, getPlayerAndCard, getPlayerRotation, playGameCard, shuffleDeck } from "@/app/lib/euchre/game";
import GameSettings from "./game-settings";
import { GameInfo } from "./game-info";
import CenterInfo from "./center-info";
import { GameActionType, gameStateReducer, initialGameState } from "@/app/lib/euchre/gameStateReducer";
import { initialPlayerInfoState, PlayerInfoActionType, playerInfoStateReducer } from "@/app/lib/euchre/playerInfoReducer";


export default function EuchreGame() {

    // #region Hooks
    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [settings, setSettings] = useState<EuchreSettings | undefined>(undefined);
    const [gameState, dispatchUpdateGame] = useReducer(gameStateReducer, initialGameState)
    const [playerInfoState, dispatchUpdatePlayerInfo] = useReducer(playerInfoStateReducer, initialPlayerInfoState)

    const { setPlayElements } = usePlayCard();
    const { setDealElements } = useDealCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    // #endregion

    // #region Event Handlers

    const beginNewGame = () => {
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: initialGameState });
        dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.RESET_ALL, payload: initialPlayerInfoState });
        setElementForFadeOut('');

        createGame();
    }

    const createGame = () => {
        setGame(createEuchreGame());
    }

    /**
     * Deal a shuffled deck to determine who the initial dealer is for a new game.
     * First Jack dealt will be the dealer.
     */
    const dealCardsForDealer = async () => {

        if (!game)
            throw Error("Game deck not found.");

        dispatchUpdateGame({
            type: GameActionType.UPDATE_ALL,
            payload: { ...gameState, determineDealer: false, awaitingAnimation: true, gameStarted: true, showDeck: true }
        });

        // notify user that dealing the first jack dealt will be the new dealer.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let counter = 0;
        let newDealerIndex = 0;

        const newGame = game.shallowCopy();
        const gameDeck = newGame.deck;
        const rotation = getPlayerRotation(newGame);
        const orgDealerNumber = newGame.dealer?.playerNumber ?? 0;
        let newDealerNumber = 0;

        //#region Deal until the first jack is dealt
        for (const card of gameDeck) {
            const playerNumber = rotation[counter % 4].playerNumber;
            const src = `deal-${counter}`;
            const dest = `game-base-${playerNumber}`;

            await setDealElements(
                {
                    sourceId: src,
                    destinationId: dest,
                    sourcePlayerNumber: orgDealerNumber,
                    destinationPlayerNumber: playerNumber
                },
                {
                    msDelay: 500,
                    displayCardValue: true,
                    card: card,
                    cardOffsetHorizontal: 0,
                    cardOffsetVertical: 0,
                });

            if (card.value.value === "J") {
                newDealerIndex = (counter % 4);
                newGame.dealer = rotation[newDealerIndex];
                newDealerNumber = newGame.dealer.playerNumber;
                break;
            }

            counter++;
        }
        //#endregion

        if (!newGame.dealer)
            throw Error("Unable to determine dealer");

        //#region Animation to return cards to dealer, then pass cards to new dealer.
        // notify user that dealing the first jack will be the new dealer.
        // animation to return the cards to the deck.
        await new Promise((resolve) => setTimeout(resolve, 2000))
            .then(() => {
                setElementsForTransformation(gameDeck.map((_, index) => `deal-${index}`));
                dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.UPDATE_CENTER,
                     payload: { ...playerInfoState, centerInfo: <div id="center-1" className="">Dealer:</div> } });
            }).then(async () => {
                await new Promise((resolve) => setTimeout(resolve, 50));
                setElementForFadeOut('center-1');
            });

        // counter = 0;
        // const dealDest = `player-base-${newGame.dealer?.playerNumber}`;

        // await new Promise((resolve) => setTimeout(resolve, 2000))
        //     .then(async () => {
        //         // animation to pass cards to the new dealer.
        //         for (const card of gameDeck) {
        //             const src = `deal-${counter}`;
        //             await setDealElements({
        //                 sourceId: src,
        //                 destinationId: dealDest,
        //                 sourcePlayerNumber: orgDealerNumber,
        //                 destinationPlayerNumber: newDealerNumber
        //             },
        //                 {
        //                     msDelay: 15,
        //                     displayCardValue: true,
        //                     card: card
        //                 });
        //             counter++;
        //         }
        //         await setDealElements({
        //             sourceId: 'deal-dummy',
        //             destinationId: dealDest,
        //             sourcePlayerNumber: orgDealerNumber,
        //             destinationPlayerNumber: newDealerNumber
        //         },
        //             {
        //                 msDelay: 500,
        //                 displayCardValue: true,
        //                 card: undefined
        //             });
        //     }).then(async () => {
        //         await new Promise((resolve) => setTimeout(resolve, 500));
        //     }).then(() => {
        //         setGame(newGame);
        //         dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...gameState, showDeck: false, awaitingAnimation: false } });
        //     });
        //#endregion
    }

    const shuffleAndDealHand = async () => {

        if (!game)
            throw Error("Game deck not found.");

        // reset variables to prevent user interaction.
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...gameState, showDeck: true, awaitingAnimation: true } });

        let newGame = game.shallowCopy();
        newGame = dealCards(newGame);
        setGame(newGame);

        // pause for animation to finish.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let counter = 0;
        const dealerNumber = newGame.dealer?.playerNumber ?? 0;

        //#region Animation deal cards to users.
        for (let i = 0; i < 8; i++) {
            const rotation = getPlayerRotation(newGame);
            const player = rotation[i % 4]
            const playerNumber = player.playerNumber;
            const dest = `game-base-${playerNumber}`;
            const firstRound = i < 4;
            let cardCount: number = 0;
            cardCount = firstRound ? newGame.cardDealCount[i % 2] : newGame.cardDealCount[(i + 1) % 2];

            for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
                const src = `deal-${counter}`;
                const card = player.hand[firstRound ? cardIndex : (5 - cardCount) + cardIndex];
                await setDealElements({
                    sourceId: src,
                    destinationId: dest,
                    sourcePlayerNumber: dealerNumber,
                    destinationPlayerNumber: playerNumber
                },
                    {
                        msDelay: 50,
                        displayCardValue: false,
                        card: card,
                        cardOffsetHorizontal: 0,
                        cardOffsetVertical: 0,
                    });

                counter++;
            }
        }

        // pause for animation to finish.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        dispatchUpdateGame(
            {
                type: GameActionType.UPDATE_ALL,
                payload: { ...gameState, showDeck: false, awaitingAnimation: false, cardsDealt: true, gameBidding: true }
            });
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

    const displayNewDealer = async () => {
        alert("Dealer set: " + game?.dealer?.name);
    }

    const changeSettings = (settings: EuchreSettings) => {
        setSettings(settings);
    }
    //#endregion

    //#region Prompt for user input or run logic if AI is the current player.
    if (game && gameState.determineDealer) {

        console.log("Begin determine dealer");

        const deck = createShuffledDeck(3);
        game.dealer = game.player1;
        game.deck = deck;

        dealCardsForDealer();

    } else if (game && !gameState.awaitingAnimation && !gameState.cardsDealt) {
        console.log("Begin dealing hand");

        shuffleAndDealHand();
    } else if (game && !gameState.awaitingAnimation && gameState.gameBidding) {
        console.log("Begin bidding");

        if (game.currentPlayer?.human) {
            // prompt for user to select trump.
        } else {
            // ai chooses whether or not to order up trump.
        }
    } else if (game && !gameState.awaitingAnimation && gameState.gamePlaying) {
        console.log("Begin play game");

        // check game won.

        if (game.currentPlayer?.human) {
            // wait for user to select a card to play
        } else {
            // ai chooses what card to play.
        }
    }
    //#endregion

    let retval: React.ReactNode;
    const displayCards = !gameState.determineDealer && !gameState.awaitingAnimation && gameState.cardsDealt;

    if (gameState.gameStarted && game) {
        retval = (
            <>
                <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[150px,1fr,150px] gap-4 h-full">
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player3}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={gameState.showDeck && game.player3.playerNumber === game.dealer?.playerNumber}
                            location="side"
                            cardsVisible={displayCards} />
                    </div>
                    <div className="col-span-1">
                        <PlayerGameDeck
                            player={game.player2}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={gameState.showDeck && game.player2.playerNumber === game.dealer?.playerNumber}
                            location="center"
                            cardsVisible={displayCards} />
                        <div>
                            <button onClick={beginNewGame}>Create Deck</button>
                        </div>
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
                            deckVisible={gameState.showDeck && game.player1.playerNumber === game.dealer?.playerNumber}
                            location="center"
                            cardsVisible={displayCards} />
                    </div>
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player4}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={gameState.showDeck && game.player4.playerNumber === game.dealer?.playerNumber}
                            location="side"
                            cardsVisible={displayCards} />
                    </div>
                </div>
                <div><button onClick={beginNewGame}>Restart</button></div>
            </>);
    } else
        retval = (<GameSettings
            onNewGame={beginNewGame}
            onApplySettings={changeSettings} />
        );

    return (
        <>
            <div className={`m-2 p-2 ${sectionStyle}`}>
                {retval}
            </div>
        </>
    )
}