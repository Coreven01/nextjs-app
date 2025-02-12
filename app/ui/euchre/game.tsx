'use client';

import { useState } from "react";
import PlayerGameDeck from "./players-game-deck";
import { EuchreGameInstance, EuchreSettings } from "@/app/lib/euchre/data";
import { sectionStyle } from "../home/home-description";
import { useDealCard, usePlayCard, useRemoveTransformations, useRemoveElement } from "@/app/lib/euchre/actions";
import { createEuchreGame, createShuffledDeck, getPlayerAndCard, getPlayerRotation, playGameCard } from "@/app/lib/euchre/game";
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
    const [settings, setSettings] = useState<EuchreSettings | undefined>(undefined);

    const { setPlayElements } = usePlayCard();
    const { setDealElements } = useDealCard();
    const { setElementToRemove } = useRemoveElement();
    const { setElementsForTransformation } = useRemoveTransformations();
    // #endregion

    // #region Event Handlers
    /**
     * Deal a shuffled deck to determine who the initial dealer is for a new game.
     * First Jack dealt will be the dealer.
     */
    const dealCardsForDealer = async () => {

        setDetermineDealer(false);
        setDealingCards(true);

        // notify user that dealing the first jack will be the new dealer.
        await new Promise((resolve) => setTimeout(resolve, 2000));

        let counter = 0;
        let newDealer = 0;
        const gameDeck = game?.deck;

        if (gameDeck) {
            game.dealer = game.player1;
            const rotation = getPlayerRotation(game);

            for (const card of gameDeck) {
                const playerNumber = rotation[counter % 4].playerNumber;
                const src = `deal-${counter}`;
                const dest = `player-base-${playerNumber}`;

                await setDealElements(src, dest, playerNumber, card);
                console.log("Moving card from: ", src, " to ", dest);
                //await new Promise((resolve) => setTimeout(resolve, 2000));

                if (card.value.value === "J") {
                    newDealer = (counter % 4) + 1;
                    //break;
                }
                counter++;
            }

        } else {
            throw Error("Game deck not found.");
        }


        displayNewDealer();

        setElementsForTransformation(gameDeck.map((_, index) => `deal-${index}`));

        counter = 0;
        for (const card of gameDeck) {
            const src = `deal-${counter}`;
            setElementToRemove(src);
            counter++;
        }


        //clear cards.
        //deal new hand.
        //begin bidding

        setBidding(true);
        setDealingCards(false);
    }

    const beginNewGame = () => {
        setBidding(false);
        setDetermineDealer(true);
        setGameStarted(true);
        setPlayGame(false);

        createGame();
    }

    const createGame = () => {
        setGame(createEuchreGame());
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
        alert("Dealer set");
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

    } else if (game && bidding) {
        console.log("begin bidding");

        if (game.currentPlayer?.human) {
            // prompt for user to select trump.
        } else {
            // ai chooses whether or not to order up trump.
        }
    } else if (game && playGame) {
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
    const displayCards = !determineDealer && !dealingCards;

    if (gameStarted && game) {
        retval = (
            <>
                <div className="grid grid-flow-col grid-rows-4 gap-4 h-full">
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player3}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            location="side"
                            displayCards={displayCards} />
                    </div>
                    <div className="col-span-1">
                        <PlayerGameDeck
                            player={game.player2}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            location="center"
                            displayCards={displayCards} />
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
                            location="center"
                            displayCards={displayCards} />
                    </div>
                    <div className="row-span-4 min-w-32">
                        <PlayerGameDeck
                            player={game.player4}
                            game={game}
                            onCardClick={playCard}
                            dealDeck={game.deck}
                            location="side"
                            displayCards={displayCards} />
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