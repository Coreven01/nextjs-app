'use client';

import { useEffect, useReducer, useState } from "react";
import { BidResult, Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from "./data";
import { initialPlayerInfoState, PlayerInfoActionType, PlayerInfoState, playerInfoStateReducer } from "./playerInfoReducer";
import { GameActionType, gameStateReducer, initialGameState } from "./gameStateReducer";
import { CardTransformation, DealAnimation, useMoveCard } from "./useMoveCard";
import { useFadeOut, useRemoveTransformations } from "./actions";
import { createEuchreGame, createShuffledDeck, getPlayerRotation } from "./game";
import { TIMEOUT_MODIFIER } from "./constants";
import CenterInfo from "@/app/ui/euchre/center-info";

export function useEuchreGame() {

    const [shouldInitializeBoard, setShouldInitializeBoard] = useState(true);
    const [shouldDealForDealer, setShouldDealForDealer] = useState(false);
    const [shouldDealHand, setShouldDealHand] = useState(false);
    const [shouldBeginBid, setShouldBeginBid] = useState(false);
    const [shouldPromptBid, setShouldPromptBid] = useState(false);

    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [gameSettings, setSettings] = useState<EuchreSettings | undefined>(undefined);
    const [gameState, dispatchUpdateGame] = useReducer(gameStateReducer, initialGameState);
    const [playerInfoState, dispatchUpdatePlayerInfo] = useReducer(playerInfoStateReducer, initialPlayerInfoState);

    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    useEffect(() => {
        if (game) {
            initDeckForInitialDeal();
        }

    }, [shouldInitializeBoard]);

    useEffect(() => {
        if (game) {
            beginDealCardsForDealer();
        }

    }, [shouldDealForDealer]);

    useEffect(() => {
        if (game) {
            shuffleAndDealHand();
        }

    }, [shouldDealHand]);

    useEffect(() => {
        if (game) {
            bidForTrump();
        }

    }, [shouldBeginBid]);

    const resetGame = () => {
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: initialGameState });
        dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.RESET_ALL, payload: initialPlayerInfoState });
        setElementForFadeOut('');

        setGame(undefined);
    }

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
        setShouldInitializeBoard((prev) => !prev);
    }

    const initDeckForInitialDeal = () => {

        if (!game)
            throw Error("Invalid game - initial deal");

        const newGameState = { ...gameState, gameHasStarted: true, isDetermineDealer: true, shouldShowDeck: true };
        const newGame = game.shallowCopy();
        newGame.dealer = newGame.player1;
        newGame.currentPlayer = newGame.player1;
        newGame.deck = createShuffledDeck(3);

        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        setGame(newGame);

        setShouldDealForDealer((prev) => !prev);
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

        // deal the cards until first Jack is dealt.
        const newDealer = await new Promise((resolve) => setTimeout(resolve, 500))
            .then(() => dealCardsForNewDealer(newGame, { setCardsToMove }));

        if (!newDealer)
            throw Error("Unable to determine dealer");

        newGame.dealer = newDealer;
        newGame.currentPlayer = newDealer;

        //#region Animation to return cards to dealer, then pass cards to new dealer.
        await new Promise((resolve) => setTimeout(resolve, 1500 * TIMEOUT_MODIFIER))
            .then(() => {
                animateCardsReturnToDealer(gameDeck, newPlayerState, newDealer.name);
            });

        await new Promise((resolve) => setTimeout(resolve, 750 * TIMEOUT_MODIFIER))
            .then(async () => {
                if (originalDealer && originalDealer.playerNumber != newDealer.playerNumber)
                    animatePassCardsToPlayer(gameDeck, originalDealer, newDealer);
            }).then(async () => {
                await new Promise((resolve) => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));
            }).then(() => {
                setGame(newGame);
                dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState, isDetermineDealer: false, shouldShowDeck: false } });
                setShouldDealHand((prev) => !prev);
            });
        //#endregion
    }

    const shuffleAndDealHand = async () => {

        if (!game)
            throw Error("Game deck not found.");

        const newGameState = { ...gameState, shouldShowDeck: true };

        // reset variables to prevent user interaction.
        dispatchUpdateGame({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });

        const newGame = game.shallowCopy();
        const rotation = getPlayerRotation(newGame);
        newGame.deck = createShuffledDeck(3);
        newGame.dealCards();
        newGame.currentPlayer = rotation[0];
        newGame.trump = newGame.kitty[0];

        // pause for animation to finish.
        //await new Promise((resolve) => setTimeout(resolve, 1000));

        await animateDealCardsForHand(newGame, { setCardsToMove });

        // pause for animation to finish.
        await new Promise((resolve) => setTimeout(resolve, 500));

        dispatchUpdateGame(
            {
                type: GameActionType.UPDATE_ALL,
                payload: {
                    ...newGameState,
                    shouldShowDeck: false,
                    areCardsDealt: true,
                    isGameBidding: true,
                    hasFirstBiddingPassed: false,
                    hasSecondBiddingPassed: false
                }
            });

        setGame(newGame);
        setShouldBeginBid((prev) => !prev);
    }

    const bidForTrump = async () => {

        if (!game)
            throw Error("Game deck not found.");

        const newGame = game.shallowCopy();
        const newGameState = { ...gameState };

        if (!newGame?.trump)
            throw Error("Game deck not found.");

        const roundFinished = newGame.dealer === newGame.currentPlayer;

        if (roundFinished)
            return;

        if (newGame.currentPlayer?.human) {
            // prompt for choosing trump or passing
            setShouldPromptBid(true);
        } else {
            const computerChoice = newGame.currentPlayer?.determineCardToPlay(newGame.trump)

            if (!computerChoice) {
                await new Promise((resolve) => setTimeout(resolve, 2000));
                const rotation = getPlayerRotation(newGame);
                newGame.currentPlayer = rotation[0];
                setGame(newGame);
                setShouldBeginBid(prev => !prev);
            } else {
                console.log('todo: begin regular play through if trump was ordered up.')
            }
        }
    }

    const handleBidSubmit = (result: BidResult) => {
        console.log('todo: handle bid submit: ', result);

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Bid submission.");

        const newGameState = { ...gameState };
        const firstRound = !newGameState.hasFirstBiddingPassed;
        const secondRound = !newGameState.hasSecondBiddingPassed;

        if (firstRound && result.orderTrump) {

        } else if (secondRound) {

        }

        setShouldPromptBid(false);
    }

    /** After cards have been dealt to users, removes the transformation to animate returning the cards back to the dealer */
    const animateCardsReturnToDealer = async (gameDeck: Card[], playerInfoState: PlayerInfoState, dealerName: string) => {

        const centerElementName = 'center-info-div'

        setElementsForTransformation(gameDeck.map((card) => card.dealId));
        dispatchUpdatePlayerInfo({
            type: PlayerInfoActionType.UPDATE_CENTER,
            payload: {
                ...playerInfoState, centerInfo: <CenterInfo id={centerElementName} > {`Dealer: ${dealerName}`}</CenterInfo>
            }
        });

        await new Promise((resolve) => setTimeout(resolve, 50 * TIMEOUT_MODIFIER));
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
                location: "outer",
                options: {
                    card: e[1],
                    displayCardValue: false,
                    msDelay: 25 * TIMEOUT_MODIFIER,
                    cardOffsetVertical: 0,
                    cardOffsetHorizontal: 0,
                }
            };
        }))];

        setCardsToMove(transformValues);
    }

    const handleSettingsChange = (settings: EuchreSettings) => {
        setSettings(settings);
    } 

    return { game, gameState, playerInfoState, shouldPromptBid, gameSettings, beginNewGame, handleBidSubmit, resetGame, handleSettingsChange  };

}

/** Deal cards to players until first Jack is dealt. The player that is dealt the Jack will be the initial dealer for the game.
 * Animates using a transform to show a card being dealt to the user.
*/
async function dealCardsForNewDealer(game: EuchreGameInstance, animate: DealAnimation): Promise<EuchrePlayer | undefined> {

    if (!game)
        throw Error("Game not found.");

    let counter = 0;
    let newDealerIndex = 0;
    const gameDeck = game.deck;
    const rotation = getPlayerRotation(game);
    const orgDealerNumber = game.dealer?.playerNumber ?? 0;

    // Deal until the first jack is dealt
    for (const card of gameDeck) {
        const player = rotation[counter % 4];
        const sourceId = card.dealId;
        const destinationId = player.innerPlayerBaseId;
        const cardToMove: CardTransformation[] = [{
            sourceId: sourceId,
            destinationId: destinationId,
            sourcePlayerNumber: orgDealerNumber,
            destinationPlayerNumber: player.playerNumber,
            location: "inner",
            options: {
                msDelay: 500 * TIMEOUT_MODIFIER,
                displayCardValue: true,
                card: card,
                cardOffsetHorizontal: 0,
                cardOffsetVertical: 0,
            }
        }];

        await animate.setCardsToMove(cardToMove);

        if (card.value === "J") {
            newDealerIndex = (counter % 4);
            return rotation[newDealerIndex];
        }

        counter++;
    }

    return undefined;
}

const animateDealCardsForHand = async (game: EuchreGameInstance, animate: DealAnimation) => {

    if (!game)
        throw Error("Game not found.");

    const rotation = getPlayerRotation(game);
    const transformations: CardTransformation[] = [];
    const trumpCard = game.kitty[0];
    const dealerNumber = game.dealer?.playerNumber ?? 1;

    //#region Animation deal cards to users.
    for (let i = 0; i < 8; i++) {

        const player = rotation[i % 4]
        const playerNumber = player.playerNumber;
        const destinationId = player.innerPlayerBaseId;
        const firstRound = i < 4;

        let cardCount: number = 0;
        cardCount = firstRound ? game.cardDealCount[i % 2] : game.cardDealCount[(i + 1) % 2];

        for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {

            const card = player.hand[firstRound ? cardIndex : (5 - cardCount) + cardIndex];
            const cardSrcId = card.dealId;

            transformations.push({
                sourceId: cardSrcId,
                destinationId: destinationId,
                sourcePlayerNumber: dealerNumber,
                destinationPlayerNumber: playerNumber,
                location: "inner",
                options: {
                    msDelay: 75 * TIMEOUT_MODIFIER,
                    displayCardValue: false,
                    card: card,
                    cardOffsetHorizontal: 0,
                    cardOffsetVertical: 0,
                }
            });
        }
    }

    transformations.push({
        sourceId: trumpCard.dealId,
        destinationId: 'game-center',
        sourcePlayerNumber: dealerNumber,
        destinationPlayerNumber: 0,
        location: "outer",
        options: {
            card: trumpCard,
            displayCardValue: false,
            msDelay: 75 * TIMEOUT_MODIFIER,
            cardOffsetVertical: 0,
            cardOffsetHorizontal: 0,
        }
    });

    await animate.setCardsToMove(transformations);
}

// const getFaceUpCard = (card: Card) => {
//     return (<Image
//         id={`trump-bid`}
//         className={`contain absolute left-auto`}
//         quality={100}
//         width={75}
//         height={112}
//         src={getEncodedCardSvg(card, "center")}
//         alt="Game Card" />);
// }