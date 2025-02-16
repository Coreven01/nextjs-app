'use client';

import React, { useReducer, useState } from "react";
import PlayerGameDeck from "./players-game-deck";
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from "@/app/lib/euchre/data";
import { sectionStyle } from "../home/home-description";
import { useRemoveTransformations, useFadeOut } from "@/app/lib/euchre/actions";
import { createEuchreGame, createShuffledDeck, getPlayerRotation } from "@/app/lib/euchre/game";
import GameSettings from "./game-settings";
import { GameInfo } from "./game-info";
import CenterInfo from "./center-info";
import { GameActionType, gameStateReducer, initialGameState } from "@/app/lib/euchre/gameStateReducer";
import { initialPlayerInfoState, PlayerInfoActionType, PlayerInfoState, playerInfoStateReducer } from "@/app/lib/euchre/playerInfoReducer";
import { CardTransformation, DealAnimation, useMoveCard } from "@/app/lib/euchre/useMoveCard";


export default function EuchreGame() {

    // #region Hooks
    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [settings, setSettings] = useState<EuchreSettings | undefined>(undefined);
    const [gameState, dispatchUpdateGame] = useReducer(gameStateReducer, initialGameState)
    const [playerInfoState, dispatchUpdatePlayerInfo] = useReducer(playerInfoStateReducer, initialPlayerInfoState)

    //const { setPlayElements } = usePlayCard();
    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    // #endregion

    // #region Event Handlers

    /** Reset state and begin cards being dealt to determine new dealer. */
    const beginNewGame = () => {
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: initialGameState });
        dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.RESET_ALL, payload: initialPlayerInfoState });
        setElementForFadeOut('');

        createGame();
    }

    /** Update the state for a new game. */
    const createGame = () => {
        setGame(createEuchreGame());
    }

    /**
     * Shuffle the deck and deal to determine who the initial dealer is for a new game.
     * First Jack dealt will be the dealer.
     */
    const beginDealCardsForDealer = async () => {

        if (!game?.deck)
            throw Error("Game deck not found.");

        const newGameState = { ...gameState, isDetermineDealer: false, isAwaitingAnimation: true, hasGameStarted: true, shouldShowDeck: true };
        const newPlayerState = { ...playerInfoState };
        const newGame = game.shallowCopy();
        const originalDealer = newGame.dealer;
        const gameDeck = newGame.deck;

        dispatchUpdateGame({
            type: GameActionType.UPDATE_ALL,
            payload: { ...newGameState }
        });

        // deal the cards until first Jack is dealt.
        const newDealer = await new Promise((resolve) => setTimeout(resolve, 500))
            .then(() => dealCardsForNewDealer(newGame, { setCardsToMove }));

        if (!newDealer)
            throw Error("Unable to determine dealer");

        newGame.dealer = newDealer;

        //#region Animation to return cards to dealer, then pass cards to new dealer.
        await new Promise((resolve) => setTimeout(resolve, 2000))
            .then(() => {
                animateCardsReturnToDealer(gameDeck, newPlayerState, newDealer.name);
            });

        await new Promise((resolve) => setTimeout(resolve, 2000))
            .then(async () => {
                if (originalDealer)
                    animatePassCardsToPlayer(gameDeck, originalDealer, newDealer);
            }).then(async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000));
            }).then(() => {
                setGame(newGame);
                dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState, shouldShowDeck: false, isAwaitingAnimation: false } });
            });
        // #endregion
    }

    const shuffleAndDealHand = async () => {

        if (!game)
            throw Error("Game deck not found.");

        const newGameState = { ...gameState, shouldShowDeck: true, isAwaitingAnimation: true };

        // reset variables to prevent user interaction.
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });

        const newGame = game.shallowCopy();
        newGame.deck = createShuffledDeck(3);
        newGame.dealCards();

        // pause for animation to finish.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let counter = 0;
        const dealerNumber = newGame.dealer?.playerNumber ?? 0;

        //#region Animation deal cards to users.
        // for (let i = 0; i < 8; i++) {
        //     const rotation = getPlayerRotation(newGame);
        //     const player = rotation[i % 4]
        //     const playerNumber = player.playerNumber;
        //     const dest = `game-base-${playerNumber}`;
        //     const firstRound = i < 4;
        //     let cardCount: number = 0;
        //     cardCount = firstRound ? newGame.cardDealCount[i % 2] : newGame.cardDealCount[(i + 1) % 2];

        //     for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
        //         const src = `deal-${counter}`;
        //         const card = player.hand[firstRound ? cardIndex : (5 - cardCount) + cardIndex];
        //         await setDealElements({
        //             sourceId: src,
        //             destinationId: dest,
        //             sourcePlayerNumber: dealerNumber,
        //             destinationPlayerNumber: playerNumber
        //         },
        //             {
        //                 msDelay: 50,
        //                 displayCardValue: false,
        //                 card: card,
        //                 cardOffsetHorizontal: 0,
        //                 cardOffsetVertical: 0,
        //             });

        //         counter++;
        //     }
        // }

        // pause for animation to finish.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        dispatchUpdateGame(
            {
                type: GameActionType.UPDATE_ALL,
                payload: { ...newGameState, shouldShowDeck: false, isAwaitingAnimation: false, areCardsDealt: true, isGameBidding: true }
            });

        setGame(newGame);
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

    /** After cards have been dealt to users, removes the transformation to animate returning the cards back to the dealer */
    const animateCardsReturnToDealer = async (gameDeck: Card[], playerInfoState: PlayerInfoState, dealerName: string) => {

        const centerElementName = 'center-info-div'

        setElementsForTransformation(gameDeck.map((card) => card.dealId));
        dispatchUpdatePlayerInfo({
            type: PlayerInfoActionType.UPDATE_CENTER,
            payload: { ...playerInfoState, centerInfo: <CenterInfo id={centerElementName}>{`Dealer: ${dealerName}`}</CenterInfo> }
        });

        await new Promise((resolve) => setTimeout(resolve, 50));
        setElementForFadeOut(centerElementName);
    }

    /** */
    const animatePassCardsToPlayer = async (gameDeck: Card[], sourcePlayer: EuchrePlayer, destinationPlayer: EuchrePlayer) => {

        const dealDestId = destinationPlayer.playerBase;
        const cardsToMove = new Map<string, Card | undefined>(gameDeck.map((card) => [card.dealId, card]));
        cardsToMove.set('deal-dummy', undefined); // add the dummy card, which isn't really a card in the deck.
        const sourcePlayerNumber = sourcePlayer.playerNumber;
        const destinationPlayerNumber = destinationPlayer.playerNumber;

        // animation to pass cards to the new dealer.
        const transformValues: CardTransformation[] = [...(cardsToMove.entries().map<CardTransformation>((e) => {
            return {
                sourceId: e[0],
                destinationId: dealDestId,
                sourcePlayerNumber: sourcePlayerNumber,
                destinationPlayerNumber: destinationPlayerNumber,
                options: {
                    card: e[1],
                    displayCardValue: false,
                    msDelay: 25,
                    cardOffsetVertical: 0,
                    cardOffsetHorizontal: 0,
                }
            };
        }))];

        setCardsToMove(transformValues);
    }
    //#endregion

    //#region Prompt for user input or run logic if AI is the current player.
    if (game && gameState.isDetermineDealer) {

        console.log("Begin determine dealer");
        beginDealCardsForDealer();

    } else if (game && !gameState.isAwaitingAnimation && !gameState.areCardsDealt) {
        console.log("Begin dealing hand");

        shuffleAndDealHand();
    } else if (game && !gameState.isAwaitingAnimation && gameState.isGameBidding) {
        console.log("Begin bidding");

        if (game.currentPlayer?.human) {
            // prompt for user to select trump.
        } else {
            // ai chooses whether or not to order up trump.
        }
    } else if (game && !gameState.isAwaitingAnimation && gameState.isGamePlaying) {
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
    const displayCards = !gameState.isDetermineDealer && !gameState.isAwaitingAnimation && gameState.areCardsDealt;

    console.log("game state on render: ", gameState);

    if (gameState.hasGameStarted && game) {
        retval = (
            <>
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

async function dealCardsForNewDealer(game: EuchreGameInstance, animate: DealAnimation): Promise<EuchrePlayer | undefined> {

    let counter = 0;
    let newDealerIndex = 0;
    const gameDeck = game.deck;
    const rotation = getPlayerRotation(game);
    const orgDealerNumber = game.dealer?.playerNumber ?? 0;

    //#region Deal until the first jack is dealt
    for (const card of gameDeck) {
        const playerNumber = rotation[counter % 4].playerNumber;
        const src = `deal-${counter}`;
        const dest = `game-base-${playerNumber}`;
        const cardToMove: CardTransformation[] = [{
            sourceId: src,
            destinationId: dest,
            sourcePlayerNumber: orgDealerNumber,
            destinationPlayerNumber: playerNumber,
            options: {
                msDelay: 500,
                displayCardValue: true,
                card: card,
                cardOffsetHorizontal: 0,
                cardOffsetVertical: 0,
            }
        }];

        await animate.setCardsToMove(cardToMove);

        if (card.value.value === "J") {
            newDealerIndex = (counter % 4);
            return rotation[newDealerIndex];
        }

        counter++;
    }

    return undefined;
}

