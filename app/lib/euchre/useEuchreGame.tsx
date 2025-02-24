'use client';

import CenterInfo from "@/app/ui/euchre/center-info";
import UserInfo from "@/app/ui/euchre/user-info";
import Image from 'next/image';
import { useEffect, useReducer, useState } from "react";
import { BidResult, Card, EuchreGameInstance, EuchrePlayer, EuchreSettings, EuchreTrick, initialGameSettings, Suit } from "./data";
import { initialPlayerInfoState, PlayerInfoAction, PlayerInfoActionType, PlayerInfoState, PlayerInfoStateDetail, playerInfoStateReducer } from "./playerInfoReducer";
import { GameActionType, GameState, gameStateReducer, initialGameState } from "./gameStateReducer";
import { CardTransformation, DealAnimation, useMoveCard } from "./useMoveCard";
import { createEuchreGame, createShuffledDeck, dealCardsForNewDealer, getPlayerAndCard, getPlayerRotation, playGameCard } from "./game";
import { TIMEOUT_MODIFIER } from "./constants";
import { useRemoveTransformations } from "./actions";
import { getEncodedCardSvg } from "./card-data";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid";
import { useFadeOut } from "./useFadeOut";
import { logBidResult, logConsole as logDebugEvent } from "./util";

const FLIPPED_CARD_ID = 'flipped-card';

export function useEuchreGame() {

    //#region Hooks to control game flow
    const [shouldInitializeBoard, setShouldInitializeBoard] = useState(true);
    const [shouldDealForDealer, setShouldDealForDealer] = useState(false);
    const [shouldDealHand, setShouldDealHand] = useState(false);
    const [shouldBeginBid, setShouldBeginBid] = useState(false);
    const [shouldPromptBid, setShouldPromptBid] = useState(false);
    const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
    const [shouldPlayCard, setShouldPlayCard] = useState(false);
    const [shouldCancelGame, setCancelGame] = useState(false);

    const [game, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [gameSettings, setSettings] = useState<EuchreSettings>(initialGameSettings);
    const [gameState, dispatchUpdateGameState] = useReducer(gameStateReducer, initialGameState);
    const [playerInfoState, dispatchUpdatePlayerInfoState] = useReducer(playerInfoStateReducer, initialPlayerInfoState);

    const { setCardsToMove } = useMoveCard();
    const { setElementsForTransformation } = useRemoveTransformations();
    const { setElementForFadeOut } = useFadeOut();

    useEffect(() => {
        if (!shouldCancelGame && game) {
            initDeckForInitialDeal();
        }

    }, [shouldInitializeBoard]);

    useEffect(() => {
        if (!shouldCancelGame && game) {
            beginDealCardsForDealer();
        }

    }, [shouldDealForDealer]);

    useEffect(() => {
        if (!shouldCancelGame && game) {
            shuffleAndDealHand();
        }

    }, [shouldDealHand]);

    useEffect(() => {
        if (!shouldCancelGame && game) {
            bidForTrump();
        }

    }, [shouldBeginBid]);

    useEffect(() => {
        if (!shouldCancelGame && game) {
            playCard();
        }

    }, [shouldPlayCard]);
    //#endregion

    //#region Game Initiallization

    /** Reset game and state to defaults. */
    const reset = (resetGameState: boolean) => {

        if (resetGameState) {
            dispatchUpdateGameState(
                {
                    type: GameActionType.UPDATE_ALL,
                    payload: {
                        ...initialGameState,
                        shouldShowDeckImages: [],
                        shouldShowHandImages: [],
                        shouldShowHandValues: [],
                    }
                });
        }

        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerInfoState });
        setShouldPromptBid(false);
        setShouldPromptDiscard(false);
    }

    /** Reset state and begin cards being dealt to determine new dealer. */
    const beginNewGame = () => {
        reset(true);
        createGame();
        setCancelGame(false);
    }

    /** Update the state for a new game. */
    const createGame = () => {
        setGame(createEuchreGame());
        setShouldInitializeBoard((prev) => !prev);
    }

    /** Initialize the game with shuffled deck and set player 1 for deal. */
    const initDeckForInitialDeal = () => {

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not created - Initial deal.");

        newGame.dealer = newGame.player1;
        newGame.currentPlayer = newGame.player1;
        newGame.deck = createShuffledDeck(5);

        const newGameState: GameState = getGameStateForInitialDeal(gameState, gameSettings, newGame);

        dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        setGame(newGame);

        // begin dealing cards to user to determine initial dealer.
        setShouldDealForDealer((prev) => !prev);
    }

    //#endregion

    /**
     * Deal cards to determine who the initial dealer is for a new game.
     * First Jack dealt will be the dealer of the game.
     */
    const beginDealCardsForDealer = async () => {

        const newGame = game?.shallowCopy();

        if (!newGame?.deck)
            throw Error("Game deck not found.");

        const originalDealer = newGame.dealer;

        // short delay before when animating cards.
        if (gameSettings.shouldAnimate && !shouldCancelGame)
            await new Promise((resolve) => setTimeout(resolve, 500 * TIMEOUT_MODIFIER));

        // deal the cards until first Jack is dealt.
        const newDealerResult = dealCardsForNewDealer(newGame);

        newGame.dealer = newDealerResult.newDealer;
        newGame.currentPlayer = newDealerResult.newDealer;

        // animate cards being dealt to users.
        if (gameSettings.shouldAnimate && originalDealer && !shouldCancelGame)
            await animateForInitialDeal(newDealerResult.transformations, newGame, originalDealer);

        setGame(newGame);
        setShouldDealHand((prev) => !prev);
    }

    /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
     * or if a player will name suit. */
    const shuffleAndDealHand = async () => {

        logDebugEvent("Begin shuffleAndDealHand");

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found.");

        if (!newGame.dealer)
            throw Error("Dealer not found.");

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.deck = createShuffledDeck(5);
        newGame.dealCards();
        newGame.verifyDealtCards();
        newGame.currentPlayer = rotation[0];
        newGame.trump = newGame.kitty[0];

        if (gameSettings.shouldAnimate && !shouldCancelGame) {
            await animateDealCardsForHand(newGame, { setCardsToMove });
            await new Promise((resolve) => setTimeout(resolve, 500));     // pause for animation to finish.
        }

        // used for debugging 
        const showAllCards = newGame.gamePlayers.filter(p => !p.human).length === 4;
        const newGameState: GameState = {
            ...gameState,
            areCardsDealt: true,
            hasFirstBiddingPassed: false,
            hasSecondBiddingPassed: false,
            shouldShowHandValues: showAllCards ? newGame.gamePlayers.map(p => { return { player: p, value: true } }) : [],
        };

        playerInfoState.centerInfo.detail = getFaceUpCard(FLIPPED_CARD_ID, newGame.trump); // display trump card for bidding in the center of the table.
        dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        setGame(newGame);
        dispatchUpdatePlayerInfoState({
            type: PlayerInfoActionType.UPDATE_CENTER,
            payload: { ...playerInfoState }
        });

        // after dealing cards to player, begin the bidding process. 
        setShouldBeginBid((prev) => !prev);
    }

    /** Prompt each player if they choose to order trump/pick suit after initial deal. */
    const bidForTrump = async () => {

        logDebugEvent("Begin bidForTrump - Player: ", game?.currentPlayer);

        if (!game)
            throw Error("Game not found - Bid for Trump.");

        if (!game?.trump)
            throw Error("Trump not found.");

        if (!game?.currentPlayer)
            throw Error("Player not found.");

        if (gameState.hasSecondBiddingPassed) {
            // all users have passed. pass the deal to the next user.
            handlePassDeal();
            return;
        }

        if (game.currentPlayer?.human) {
            setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
        } else {
            const computerChoice = game.currentPlayer.determineBid(game, game.trump, gameState.hasFirstBiddingPassed);
            //logBidResult(game, computerChoice);

            // short delay to simulate that the computer is making a decision.
            if (!shouldCancelGame)
                await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

            handleBidResult(computerChoice);
        }
    }

    /** Submit the resulting bid from user input. */
    const handleBidSubmit = (result: BidResult) => {
        handleBidResult(result);
        setShouldPromptBid(false);
    }

    /** Modify the game state depending on if the user named trump or passed. */
    const handleBidResult = (result: BidResult) => {

        logDebugEvent("Begin handleBidResult - Player: ", game?.currentPlayer, " State: ", gameState);

        const newGame = game?.shallowCopy();

        if (!newGame) {
            throw Error("Game not found - Bid submission.");
        }

        if (!newGame.currentPlayer) {
            throw Error("Current player not found - Bid submission.");
        }

        const newGameState = { ...gameState };
        const roundFinished = newGame.dealer === newGame.currentPlayer;
        const firstRound = !newGameState.hasFirstBiddingPassed;

        if (result.orderTrump && firstRound) {
            // player indicated that the dealer should pick up the flipped card for trump.
            orderTrump(newGame.currentPlayer, result.loner, undefined);
        } else if (result.calledSuit && !firstRound) {
            // player named trump by suit.
            orderTrump(newGame.currentPlayer, result.loner, result.calledSuit);
        } else {
            // player passed
            if (roundFinished) {
                newGameState.hasFirstBiddingPassed = firstRound || newGameState.hasFirstBiddingPassed;
                newGameState.hasSecondBiddingPassed = !firstRound;
            }

            const playerElementId = `player-${newGame.currentPlayer.playerNumber}-bid-${firstRound ? 1 : 2}`;
            const newPlayerInfoState = getPlayerStateForBidding(playerElementId, newGame.currentPlayer, "p", playerInfoState)
            const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
            newGame.currentPlayer = rotation[0];

            dispatchUpdatePlayerInfoState(newPlayerInfoState);
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });
            setGame(newGame);
            setShouldBeginBid(prev => !prev); // begin the bidding process again for the next user in the rotation.

            if (roundFinished) {
                setElementForFadeOut(FLIPPED_CARD_ID, 1, 2); // hide the flipped card if all users passed the first round.
            }
        }
    }

    /** All players passed during the bidding process. Re-initialize for deal for the next user in the rotation.  */
    const handlePassDeal = () => {

        logDebugEvent("All players passed first and second round. Update state to pass the deal to the next user.");

        const newGame = game?.shallowCopy();

        if (!newGame?.dealer)
            throw Error("Game dealer not found - Pass deal.");

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.resetForNewDeal();
        newGame.dealer = rotation[0];

        reset(false);
        setGame(newGame);
        dispatchUpdateGameState(
            {
                type: GameActionType.UPDATE_ALL,
                payload: getGameStateForInitialDeal(gameState, gameSettings, newGame)
            });

        setShouldDealHand((prev) => !prev);
    }

    /** Submit the resulting discard from user input. */
    const handleDiscardSubmit = (result: BidResult) => {
        handleBidResult(result);
        setShouldPromptBid(false);
    }

    /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card. */
    const orderTrump = (maker: EuchrePlayer, loner: boolean, namedBySuit: Suit | undefined) => {

        logDebugEvent("Trump ordered up.");

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Order Trump.");

        if (!newGame.dealer)
            throw Error("Dealer not found - Order Trump.");

        newGame.maker = maker;
        newGame.loner = loner;
        let round = 1;
        newGame.currentRoundTricks.map(curr => round = curr.round > round ? curr.round : round);
        const newTrick = new EuchreTrick();
        newTrick.round = round;
        newGame.currentRoundTricks.push(newTrick);

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, newGame.playerSittingOut);
        const playerElementId = `player-${maker.playerNumber}-bid-${3}`;
        const newPlayerInfoState = getPlayerStateForBidding(playerElementId, maker, "o", playerInfoState);
        newPlayerInfoState.type = PlayerInfoActionType.UPDATE_CENTER;
        newPlayerInfoState.payload.centerInfo.detail = undefined;
        dispatchUpdatePlayerInfoState(newPlayerInfoState);

        newGame.currentPlayer = rotation[0];

        if (namedBySuit) {
            newGame.trump = new Card(namedBySuit, "2"); // card value doesn't matter. only the suit is needed during regular play.
            setShouldPlayCard(prev => !prev);
        } else if (newGame.dealer.human) {
            setShouldPromptDiscard(true);
        } else {
            newGame.dealer.discard(newGame);
            setShouldPlayCard(prev => !prev);
        }

        setGame(newGame);
    }

    /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. */
    const playCard = async () => {

        logDebugEvent("Begin playGame - Player: ", game?.currentPlayer);

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Bid for Trump.");

        if (!newGame?.trump)
            throw Error("Trump not found.");

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        if (!newGame?.currentTrick)
            throw Error("Game Trick not found");

        if (newGame.currentTrick.cardsPlayed.length === 4) {
            return;
        }

        if (newGame.currentRoundTricks.length === 5) {
            return;
        }

        if (newGame.currentPlayer?.human) {

        } else {
            const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
            handlePlayCard("", "", newGame.currentPlayer, computerChoice);
            //await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
            //newGame.currentTrick.cardsPlayed
        }
    }

    const handlePlayCard = async (srcElementId: string, destElementId: string, player: EuchrePlayer, card: Card) => {

        if (!game)
            throw Error("Game not found - Play card.");

        const newGame = playGameCard(player, card, game);

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        const rotation = getPlayerRotation(game.gamePlayers, newGame.currentPlayer, newGame.playerSittingOut);
        if (newGame.currentTrick && newGame.currentTrick.cardsPlayed.length === rotation.length) {
            // determine who wins the trick.
        }

        newGame.currentPlayer = rotation[0];

        if (newGame.currentRoundTricks.length === 5) {
            // determine who won the round.

            setShouldDealHand(prev => !prev);
        } else {
            setShouldPlayCard(prev => !prev);
        }

        setGame(newGame);
    }

    //#region Animation - can be enabled/disabled by game settings.

    /** */
    const animateForInitialDeal = async (transformations: CardTransformation[][], game: EuchreGameInstance, originalDealer: EuchrePlayer) => {

        //#region Animation to return cards to dealer, then pass cards to new dealer.
        await new Promise((resolve) => setTimeout(resolve, 750 * TIMEOUT_MODIFIER));

        // animate dealing cards to players.
        for (const transform of transformations) {
            if (shouldCancelGame) return;
            await setCardsToMove(transform);
        }

        await new Promise((resolve) => setTimeout(resolve, 1500 * TIMEOUT_MODIFIER));

        if (shouldCancelGame) return;

        // animate returning cards to dealer
        const cardIds: string[] = transformations.map(t => t.map(inner => inner.sourceId)).flat();
        setElementsForTransformation(cardIds);
        await new Promise((resolve) => setTimeout(resolve, 50 * TIMEOUT_MODIFIER));
        const centerElementName = 'center-info-div'

        // dispatchUpdatePlayerInfoState({
        //     type: PlayerInfoActionType.UPDATE_CENTER,
        //     payload: {
        //         ...playerInfoState, centerInfo: <CenterInfo id={centerElementName} > {`Dealer: ${game.currentPlayer?.name}`}</CenterInfo>
        //     }
        // });

        // setElementForFadeOut(centerElementName, 2, 2);
        if (shouldCancelGame) return;

        await new Promise((resolve) => setTimeout(resolve, 750 * TIMEOUT_MODIFIER));

        // animate passing cards to new dealer.
        if (originalDealer && game.dealer && originalDealer.playerNumber != game.dealer.playerNumber)
            await animatePassCardsToPlayer(game.deck, originalDealer, game.dealer);

        if (shouldCancelGame) return;

        await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
    }

    /** After cards have been dealt to users, removes the transformation to animate returning the cards back to the dealer */
    const animateCardsReturnToDealer = async (cardIds: string[]) => {

        setElementsForTransformation(cardIds);
        await new Promise((resolve) => setTimeout(resolve, 50 * TIMEOUT_MODIFIER));
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

        await setCardsToMove(transformValues);
    }

    //#endregion


    const handleSettingsChange = (settings: EuchreSettings) => {
        setSettings(settings);
    }

    const handleCancelGame = () => {
        setCancelGame(true);
    }

    /** Reset to view settings */
    const handleResetGame = () => {
        setCancelGame(true);
        reset(true);
        setGame(undefined);
    }

    return {
        game, gameState, playerInfoState, shouldPromptBid, shouldPromptDiscard, gameSettings,
        beginNewGame, handleBidSubmit, handleResetGame, handleSettingsChange, handlePlayCard, handleCancelGame,
    };

}

const animateDealCardsForHand = async (game: EuchreGameInstance, animate: DealAnimation) => {

    if (!game)
        throw Error("Game not found.");

    if (!game?.dealer)
        throw Error("Game dealer not found for card animation.");

    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
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

const getFaceUpCard = (id: string, card: Card) => {
    return (
        <CenterInfo id={id} className="flex items-center justify-center" >
            <Image
                className={`contain`}
                quality={100}
                width={75}
                height={112.5}
                src={getEncodedCardSvg(card, "center")}
                alt="Game Card" />
        </CenterInfo>);
}

/** Return a new state to provide a visual element that the user either passed or ordered trump. */
const getPlayerStateForBidding = (id: string, player: EuchrePlayer, info: "p" | "o", playerInfoState: PlayerInfoState): PlayerInfoAction => {

    let detail: PlayerInfoStateDetail;
    const newAction: PlayerInfoAction = { type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState } };
    const icon: React.ReactNode = info === "p" ? <XCircleIcon className="max-w-8 max-h-8 min-h-6" /> : <CheckCircleIcon className="max-w-8 max-h-8 min-h-6" />;
    const messageDetail = info === "p" ? "Pass" : "Pick Up";
    const infoDetail = <UserInfo><div className="flex gap-2 items-center">{icon}{messageDetail}</div></UserInfo>;

    switch (player.playerNumber) {
        case 1:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER1;
            detail = newAction.payload.player1Info
            break;
        case 2:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER2;
            detail = newAction.payload.player2Info
            break;
        case 3:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER3;
            detail = newAction.payload.player3Info
            break;
        case 4:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER4;
            detail = newAction.payload.player4Info
            break;
    }

    if (detail) {
        detail.id = id;
        detail.detail = infoDetail;
        detail.fadeOutId = id;
        detail.fadeOutDelay = 1;
        detail.fadeOutDuration = 1;

        return newAction;
    }

    throw Error("Unable to update player info state");
}

const getGameStateForInitialDeal = (gameState: GameState, settings: EuchreSettings, game: EuchreGameInstance) => {

    const newGameState: GameState = {
        ...gameState,
        hasGameStarted: true,
        shouldShowDeckImages: settings.shouldAnimate ? [{ player: game.player1, value: true }] : [],
        shouldShowHandImages: !settings.shouldAnimate ? game.gamePlayers.map(p => { return { player: p, value: true } }) : [],
        shouldShowHandValues: [],
        hasFirstBiddingPassed: false,
        hasSecondBiddingPassed: false,
        areCardsDealt: false,
    };

    return newGameState;
}