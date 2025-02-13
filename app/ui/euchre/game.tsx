'use client';

import React, { useState } from "react";
import PlayerGameDeck from "./players-game-deck";
import { EuchreGameInstance, EuchreSettings } from "@/app/lib/euchre/data";
import { sectionStyle } from "../home/home-description";
import { useDealCard, usePlayCard, useRemoveTransformations, useRemoveElement } from "@/app/lib/euchre/actions";
import { createEuchreGame, createShuffledDeck, getPlayerAndCard, getPlayerRotation, playGameCard, shuffleDeck } from "@/app/lib/euchre/game";
import GameSettings from "./game-settings";
import { GameInfo } from "./game-info";


export default function EuchreGame() {

    // #region Hooks
    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [gameStarted, setGameStarted] = useState(false);
    const [pause, setPaused] = useState(false);
    const [bidding, setBidding] = useState(false);
    const [passedFirstRound, setPassedFirstRound] = useState(false);
    const [playGame, setPlayGame] = useState(false);
    const [determineDealer, setDetermineDealer] = useState(true);
    const [dealingCards, setDealingCards] = useState(false);
    const [showDeck, setShowDeck] = useState(false);
    const [cardsDealt, setCardsDealt] = useState(false);
    const [settings, setSettings] = useState<EuchreSettings | undefined>(undefined);

    const [player1Info, setPlayer1Info] = useState<React.ReactNode>(undefined)
    const [player2Info, setPlayer2Info] = useState<React.ReactNode>(undefined)
    const [player3Info, setPlayer31Info] = useState<React.ReactNode>(undefined)
    const [player4Info, setPlayer4Info] = useState<React.ReactNode>(undefined)
    const [gameCenterInfo, setGameCenterInfo] = useState<React.ReactNode>(undefined)

    const { setPlayElements } = usePlayCard();
    const { setDealElements } = useDealCard();
    const { setElementToRemove } = useRemoveElement();
    const { setElementsForTransformation } = useRemoveTransformations();
    // #endregion

    // #region Event Handlers

    const beginNewGame = () => {
        setBidding(false);
        setDetermineDealer(true);
        setGameStarted(true);
        setPlayGame(false);
        setCardsDealt(false);
        setDealingCards(false);

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

        // reset variables to prevent user interaction.
        setDetermineDealer(false);
        setDealingCards(true);
        setBidding(false);
        setCardsDealt(false);
        setShowDeck(true);

        // notify user that dealing the first jack dealt will be the new dealer.
        await new Promise((resolve) => setTimeout(resolve, 1000));

        let counter = 0;
        let newDealerIndex = 0;
        const newGame = game.shallowCopy();
        const gameDeck = newGame.deck;
        const rotation = getPlayerRotation(newGame);

        for (const card of gameDeck) {
            const playerNumber = rotation[counter % 4].playerNumber;
            const src = `deal-${counter}`;
            const dest = `game-base-${playerNumber}`;

            await setDealElements(500, src, dest, playerNumber, card);

            if (card.value.value === "J") {
                newDealerIndex = (counter % 4);
                newGame.dealer = rotation[newDealerIndex];
                break;
            }

            counter++;
        }

        if (!newGame.dealer)
            throw Error("Unable to determine dealer");

        // notify user that dealing the first jack will be the new dealer.
        await new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
            setElementsForTransformation(gameDeck.map((_, index) => `deal-${index}`));
            setGameCenterInfo(<div>New Dealer: </div>);
        });

        counter = 0;
        const dealDest = `player-base-${newGame.dealer?.playerNumber}`;

        await new Promise((resolve) => setTimeout(resolve, 2000)).then(async () => {
        for (const card of gameDeck) {
            const src = `deal-${counter}`;
            await setDealElements(10, src, dealDest, newGame.dealer?.playerNumber ?? 1, card);
            counter++;
        }
    })

        // notify user that dealing the first jack will be the new dealer.
        // await new Promise((resolve) => setTimeout(resolve, 2000)).then(() => {
        //     setGame(newGame);
        //     setDealingCards(false);
        //     setShowDeck(false);
        // });
    }

    const shuffleAndDealHand = () => {

    }

    const playCard = async (src: string, dest: string, player: number) => {

        if (pause || !game)
            return;

        setPaused(true);
        alert(src + dest);
        setPlayElements(src, dest, player);

        const { number, index } = getPlayerAndCard(src);

        const newGame = playGameCard(number, index, game);
        await new Promise((resolve) => setTimeout(resolve, 500));

        setPaused(false);
    }

    const displayNewDealer = async () => {
        alert("Dealer set: " + game?.dealer?.name);
    }

    const changeSettings = (settings: EuchreSettings) => {
        setSettings(settings);
    }
    //#endregion

    //#region Prompt for user input or run logic if AI is the current player.
    if (game && determineDealer) {

        console.log("begin determine dealer");

        const deck = createShuffledDeck(3);
        game.dealer = game.player1;
        game.deck = deck;

        dealCardsForDealer();

    } else if (game && !dealingCards && !cardsDealt) {
        console.log("begin dealing hand");

        shuffleAndDealHand();
    } else if (game && !dealingCards && bidding) {
        console.log("begin bidding");

        if (game.currentPlayer?.human) {
            // prompt for user to select trump.
        } else {
            // ai chooses whether or not to order up trump.
        }
    } else if (game && !dealingCards && playGame) {
        console.log("begin play game");

        // check game won.

        if (game.currentPlayer?.human) {
            // wait for user to select a card to play
        } else {
            // ai chooses what card to play.
        }
    }
    //#endregion

    let retval: React.ReactNode;
    const displayCards = !determineDealer && !dealingCards && cardsDealt;

    if (gameStarted && game) {
        retval = (
            <>
                <div className="grid grid-flow-col grid-rows-[150px,1fr,1fr,150px] grid-cols-[150px,1fr,150px] gap-4 h-full">
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player3}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={showDeck && game.player3.playerNumber === game.dealer?.playerNumber}
                            location="side"
                            cardsVisible={displayCards} />
                    </div>
                    <div className="col-span-1">
                        <PlayerGameDeck
                            player={game.player2}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={showDeck && game.player2.playerNumber === game.dealer?.playerNumber}
                            location="center"
                            cardsVisible={displayCards} />
                        <div>
                            <button onClick={beginNewGame}>Create Deck</button>
                        </div>
                    </div>
                    <div className="col-span-1 row-span-2">
                        <GameInfo
                            centerInfo={undefined}
                            player1Info={undefined}
                            player2Info={undefined}
                            player3Info={undefined}
                            player4Info={undefined} />
                    </div>
                    <div className="col-span-1 ">
                        <PlayerGameDeck
                            player={game.player1}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={showDeck && game.player1.playerNumber === game.dealer?.playerNumber}
                            location="center"
                            cardsVisible={displayCards} />
                    </div>
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player4}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            deckVisible={showDeck && game.player4.playerNumber === game.dealer?.playerNumber}
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