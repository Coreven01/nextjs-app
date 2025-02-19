'use client';

import CenterInfo from "@/app/ui/euchre/center-info";
import UserInfo from "@/app/ui/euchre/user-info";
import { useEffect, useReducer, useState } from "react";
import { BidResult, Card, EuchreGameInstance, EuchrePlayer, EuchreSettings, initialGameSettings } from "./data";
import { initialPlayerInfoState, PlayerInfoAction, PlayerInfoActionType, PlayerInfoState, playerInfoStateReducer } from "./playerInfoReducer";
import { GameActionType, GameState, gameStateReducer, initialGameState } from "./gameStateReducer";
import { CardTransformation, DealAnimation, useMoveCard } from "./useMoveCard";
import { createEuchreGame, createShuffledDeck, dealCardsForNewDealer, getPlayerAndCard, getPlayerRotation, playGameCard } from "./game";
import { TIMEOUT_MODIFIER } from "./constants";
import { useRemoveTransformations } from "./actions";
import { useFadeOut } from "./useFadeOut";
import { logBidResult } from "./game-logic";

export function useEuchreGame() {

    //#region Hooks to control game flow
    const [shouldInitializeBoard, setShouldInitializeBoard] = useState(true);
    const [shouldDealForDealer, setShouldDealForDealer] = useState(false);
    const [shouldDealHand, setShouldDealHand] = useState(false);
    const [shouldBeginBid, setShouldBeginBid] = useState(false);
    const [shouldPromptBid, setShouldPromptBid] = useState(false);
    const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
    const [shouldBeginPlay, setShouldBeginPlay] = useState(false);
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
            playGame();
        }

    }, [shouldBeginPlay]);
    //#endregion

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

        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.RESET_ALL, payload: initialPlayerInfoState });
        setElementForFadeOut('');
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

        console.info("Begin initDeckForInitialDeal");

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not created - Initial deal.");

        newGame.dealer = newGame.player1;
        newGame.currentPlayer = newGame.player1;
        newGame.deck = createShuffledDeck(5);

        const newGameState: GameState = { 
            ...gameState, 
            hasGameStarted: true, 
            shouldShowDeckImages: gameSettings.shouldAnimate ? [ {player: newGame.player1, value: true}] : [], 
            shouldShowHandImages: !gameSettings.shouldAnimate ? newGame.gamePlayers.map(p => { return {player: p, value: true }}) : [],
            shouldShowHandValues: []
        };

        dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        //setGame(newGame);

        //setShouldDealForDealer((prev) => !prev);
    }

    /**
     * Deal cards to determine who the initial dealer is for a new game.
     * First Jack dealt will be the dealer of the game.
     */
    const beginDealCardsForDealer = async () => {

        console.info("Begin beginDealCardsForDealer");

        if (!game?.deck)
            throw Error("Game deck not found.");

        const newGame = game.shallowCopy();
        const originalDealer = newGame.dealer;

        // short delay before animation.
        if (gameSettings.shouldAnimate)
            await new Promise((resolve) => setTimeout(resolve, 500 * TIMEOUT_MODIFIER));

        // deal the cards until first Jack is dealt.
        const newDealerResult = dealCardsForNewDealer(newGame);

        newGame.dealer = newDealerResult.newDealer;
        newGame.currentPlayer = newDealerResult.newDealer;

        if (gameSettings.shouldAnimate && originalDealer && !shouldCancelGame)
            await animateForInitialDeal(newDealerResult.transformations, newGame, originalDealer);

        // const newGameState: GameState = { ...gameState, hasGameStarted: true, shouldShowDeckImages: false };
        // newGame.gamePlayers.filter(p => p.human).length === 0 ?  newGame.gamePlayers.map(p => { return {player: p, value: true }}) : [],
        // setGame(newGame);
        // dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        // setShouldDealHand((prev) => !prev);
    }

    /** Shuffle and deal cards for regular game play. */
    const shuffleAndDealHand = async () => {

        console.info("Begin shuffleAndDealHand");

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found.");

        if (!newGame.dealer)
            throw Error("Game not found.");

        const newGameState = { ...gameState, shouldShowDeck: true };

        // reset variables to prevent user interaction.
        dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.deck = createShuffledDeck(3);
        newGame.dealCards();
        newGame.currentPlayer = rotation[0];
        newGame.trump = newGame.kitty[0];

        if (gameSettings.shouldAnimate) {
            await animateDealCardsForHand(newGame, { setCardsToMove });

            // pause for animation to finish.
            await new Promise((resolve) => setTimeout(resolve, 500 * TIMEOUT_MODIFIER));
        }

        // dispatchUpdateGameState(
        //     {
        //         type: GameActionType.UPDATE_ALL,
        //         payload: {
        //             ...newGameState,
        //             shouldShowDeckImages: false,
        //             areCardsDealt: true,
        //             hasFirstBiddingPassed: false,
        //             hasSecondBiddingPassed: false
        //         }
        //     });

        setGame(newGame);
        dispatchUpdatePlayerInfoState({
            type: PlayerInfoActionType.UPDATE_CENTER,
            payload: {
                ...playerInfoState, centerInfo: <CenterInfo id={'test'} > {`display face up jack.`}</CenterInfo>
            }
        });

        setShouldBeginBid((prev) => !prev);
    }

    /** Prompt each player if they choose to order trump/pick suit after initial deal. */
    const bidForTrump = async () => {

        //console.info("Begin bidForTrump - Player: ", game?.currentPlayer);

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Bid for Trump.");

        if (!newGame?.trump)
            throw Error("Trump not found.");

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        if (gameState.hasSecondBiddingPassed) {
            handlePassDeal();
            return;
        }

        if (newGame.currentPlayer?.human) {
            // Show prompt window for choosing trump or passing for human player.
            setShouldPromptBid(true);
        } else {
            const computerChoice = newGame.currentPlayer.determineBid(newGame, newGame.trump, gameState.hasFirstBiddingPassed);
            logBidResult(newGame, computerChoice);
            await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

            handleBidResult(computerChoice);
        }
    }

    /** */
    const handleBidSubmit = (result: BidResult) => {
        handleBidResult(result);
        setShouldPromptBid(false);
    }

    const handleBidResult = (result: BidResult) => {

        //console.info("Begin handleBidResult - Player: ", game?.currentPlayer, " State: ", gameState);

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Bid submission.");

        if (!newGame.currentPlayer)
            throw Error("Current player not found - Bid submission.");

        const newGameState = { ...gameState };
        const roundFinished = newGame.dealer === newGame.currentPlayer;
        const firstRound = !newGameState.hasFirstBiddingPassed;

        if (result.orderTrump && firstRound) {
            console.log('todo: ordered trump');
        } else if (result.calledSuit && !firstRound) {
            orderTrumpBySuit(newGame.currentPlayer, result);
        } else { // player passed
            if (roundFinished) {
                newGameState.hasFirstBiddingPassed = firstRound || newGameState.hasFirstBiddingPassed;
                newGameState.hasSecondBiddingPassed = !firstRound;
            }

            const newPlayerInfoState = getUserStateFromInfo("id-pass", newGame.currentPlayer, "Pass")
            const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
            newGame.currentPlayer = rotation[0];

            dispatchUpdatePlayerInfoState(newPlayerInfoState);
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });
            setGame(newGame);
            setShouldBeginBid(prev => !prev);
        }
    }

    const getUserStateFromInfo = (id: string, player: EuchrePlayer, info: string): PlayerInfoAction => {

        let actionType: PlayerInfoActionType = PlayerInfoActionType.UPDATE_CENTER;
        let payload: PlayerInfoState;

        switch (player.playerNumber) {
            case 1:
                actionType = PlayerInfoActionType.UPDATE_PLAYER1;
                payload = { ...playerInfoState, player1Info: <UserInfo id={id} >{info}</UserInfo> }
                break;
            case 2:
                actionType = PlayerInfoActionType.UPDATE_PLAYER2;
                payload = { ...playerInfoState, player2Info: <UserInfo id={id} >{info}</UserInfo> }
                break;
            case 3:
                actionType = PlayerInfoActionType.UPDATE_PLAYER3;
                payload = { ...playerInfoState, player3Info: <UserInfo id={id} >{info}</UserInfo> }
                break;
            case 4:
                actionType = PlayerInfoActionType.UPDATE_PLAYER4;
                payload = { ...playerInfoState, player4Info: <UserInfo id={id} >{info}</UserInfo> }
                break;
        }
        const newState = {
            type: actionType,
            payload: payload
        }

        return newState;
    }

    const handlePassDeal = () => {
        console.log("all passed. deal passed.");

        const newGame = game?.shallowCopy();

        if (!newGame?.dealer)
            throw Error("Game dealer not found - Pass deal.");

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);
        newGame.resetForNewDeal();
        newGame.dealer = rotation[0];

        reset(false);
        setGame(newGame);
        // dispatchUpdateGameState(
        //     {
        //         type: GameActionType.UPDATE_ALL,
        //         payload: {
        //             ...gameState,
        //             shouldShowDeckImages: false,
        //             hasFirstBiddingPassed: false,
        //             hasSecondBiddingPassed: false,
        //             areCardsDealt: false,
        //         }
        //     });

        setShouldDealHand((prev) => !prev);
    }

    const promptForDiscard = () => {

    }

    const orderTrumpBySuit = (maker: EuchrePlayer, result: BidResult) => {

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Order Trump.");

        if (!newGame.dealer)
            throw Error("Dealer not found - Order Trump.");

        if (!result.calledSuit)
            throw Error("Invalid suit - Order Trump.");

        newGame.maker = maker;
        newGame.trump = new Card(result.calledSuit, "2");

        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer);

        newGame.currentPlayer = rotation[0];
        setGame(newGame);
        setShouldBeginPlay(prev => !prev);
    }

    const displayFlippedCard = () => {

        // if (!game?.dealer)
        //     throw Error("Game not found.");

        // const info = <CenterInfo>Test</CenterInfo>;
        // const dealerPlayerNumber = game.dealer.playerNumber ?? 0;

        // dispatchUpdatePlayerInfo({ type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState, player1Info: info } });
    }

    const playGame = async () => {

        console.info("Begin playGame - Player: ", game?.currentPlayer);

        const newGame = game?.shallowCopy();

        if (!newGame)
            throw Error("Game not found - Bid for Trump.");

        if (!newGame?.trump)
            throw Error("Trump not found.");

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        if (newGame.currentTrick.cardsPlayed.length === 4) {
            return;
        }

        if (newGame.handTricks.length === 5) {
            return;
        }

        if (newGame.currentPlayer?.human) {
            // Show prompt window for choosing trump or passing for human player.
            //setShouldPromptBid(true);
            // wait for player selection
        } else {
            const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
            await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
            newGame.currentTrick.cardsPlayed
        }

    }

    const handlePlayCard = async (src: string, dest: string, player: number) => {

         if (!game)
            throw Error("Game not found - Play card.");

        // setPaused(true);
        // alert(src + dest);
        // //setPlayElements(src, dest, player);

         const { playerNumber, index } = getPlayerAndCard(src);

         const newGame = playGameCard(playerNumber, index, game);

         if (!newGame)
            alert('unable to play card.');
        // await new Promise((resolve) => setTimeout(resolve, 500));

        // setPaused(false);
    }

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

        dispatchUpdatePlayerInfoState({
            type: PlayerInfoActionType.UPDATE_CENTER,
            payload: {
                ...playerInfoState, centerInfo: <CenterInfo id={centerElementName} > {`Dealer: ${game.currentPlayer?.name}`}</CenterInfo>
            }
        });

        setElementForFadeOut(centerElementName);
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