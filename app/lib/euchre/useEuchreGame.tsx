'use client';

import CenterInfo from "@/app/ui/euchre/center-info";
import UserInfo from "@/app/ui/euchre/user-info";
import Image from 'next/image';
import { useCallback, useEffect, useReducer, useState } from "react";
import { BidResult, Card, EuchreGameInstance, EuchrePlayer, EuchreSettings, EuchreTrick, initialGameSettings, Suit } from "./data";
import { initialPlayerGameInfo, PlayerInfoAction, PlayerInfoActionType, PlayerGameInfoState, playerInfoStateReducer } from "./playerInfoReducer";
import { EuchreAnimateType, EuchreGameFlow, GameActionType, GameState, gameStateReducer, initialGameState } from "./gameStateReducer";
import { CardTransformation, FadeOutOptions } from "./useMoveCard";
import { getPlayerRotation } from "./game";
import { TIMEOUT_MODIFIER } from "./constants";
import { getEncodedCardSvg } from "./card-data";
import { CheckCircleIcon, XCircleIcon } from "@heroicons/react/16/solid";
import { dealCardsForDealer, getGameStateForInitialDeal, initDeckForInitialDeal, orderTrump, shuffleAndDealHand } from "./game-setup-logic";
import { logDebugEvent } from "./util";
import useAnimation from "./animation/useAnimation";
import { determineCurrentWinnerForTrick, getGameStateForNextHand, playGameCard } from "./game-play-logic";

const FLIPPED_CARD_ID = 'flipped-card';

export function useEuchreGame() {

    //#region Hooks to control game flow
    const [shouldPromptBid, setShouldPromptBid] = useState(false);
    const [shouldPromptDiscard, setShouldPromptDiscard] = useState(false);
    const [shouldCancelGame, setCancelGame] = useState(false);
    const [playerCard, setPlayerCard] = useState<Card | null>(null);

    const [gameInstance, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [gameSettings, setSettings] = useState<EuchreSettings>(initialGameSettings);
    const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>([]);
    const [fadeOutElements, setfadeOutElements] = useState<FadeOutOptions[]>([]);

    const [gameState, dispatchUpdateGameState] = useReducer(gameStateReducer, initialGameState);
    const [playerInfoState, dispatchUpdatePlayerInfoState] = useReducer(playerInfoStateReducer, initialPlayerGameInfo);
    const { animateForInitialDeal, animateDealCardsForHand, animateForPlayCard, setFadeOutForPlayers } = useAnimation();

    useEffect(() => {
        setFadeOutForPlayers(fadeOutElements);
    }, [fadeOutElements]);

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

        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerGameInfo });
        setShouldPromptBid(false);
        setShouldPromptDiscard(false);
        setPlayerCard(null);
    };

    const clearFadeOutElements = () => {
        setfadeOutElements([
            { playerNumber: 1, fadeOutId: "", fadeOutDelay: 1, fadeOutDuration: 1 },
            { playerNumber: 2, fadeOutId: "", fadeOutDelay: 1, fadeOutDuration: 1 },
            { playerNumber: 3, fadeOutId: "", fadeOutDelay: 1, fadeOutDuration: 1 },
            { playerNumber: 4, fadeOutId: "", fadeOutDelay: 1, fadeOutDuration: 1 },
            { playerNumber: "o", fadeOutId: "", fadeOutDelay: 1, fadeOutDuration: 1 },
        ]);
    }

    /** Reset state and begin cards being dealt to determine new dealer. */
    const beginNewGame = () => {
        reset(true);
        setCancelGame(false);
        createGame();
    };

    /** Update the state for a new game. */
    const createGame = () => {
        const newGame = initDeckForInitialDeal(shouldCancelGame);
        const newGameState: GameState = getGameStateForInitialDeal(gameState, gameSettings, newGame);
        newGameState.gameFlow = EuchreGameFlow.BEGIN_DEAL_FOR_DEALER;

        dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
        setGame(newGame);
    };

    /** Deal cards to determine who the initial dealer will be for the game. First jack dealt to a user will become the initial dealer. */
    const beginDealCardsForDealer = useCallback(() => {
        if (gameInstance && gameState.gameFlow === EuchreGameFlow.BEGIN_DEAL_FOR_DEALER && gameState.animationType === EuchreAnimateType.ANIMATE_NONE) {

            logDebugEvent("Begin deal Cards for Dealer");

            const dealResult = dealCardsForDealer(gameInstance, gameState, gameSettings, shouldCancelGame);

            if (!dealResult)
                throw Error("Unable to determine dealer");

            gameInstance.dealer = dealResult.newDealer;
            gameInstance.currentPlayer = dealResult.newDealer;

            dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_DEAL_FOR_JACK, payload: gameState });
            setGame(gameInstance);
            setAnimationTransformation([...animationTransformation, ...dealResult.transformations]);
        }
    }, [gameInstance, gameState, gameSettings, shouldCancelGame]);

    useEffect(() => {
        beginDealCardsForDealer();
    }, [beginDealCardsForDealer]);

    useEffect(() => {
        const beginAnimationForInitDeal = async () => {
            if (!shouldCancelGame && gameInstance && gameState.animationType === EuchreAnimateType.ANIMATE_DEAL_FOR_JACK) {
                await animateForInitialDeal(animationTransformation, gameInstance, gameInstance.player1);

                dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_NONE, payload: gameState });
                dispatchUpdateGameState({ type: GameActionType.SET_SHUFFLE_CARDS, payload: gameState });
            }
        }

        beginAnimationForInitDeal();
    }, [gameState, shouldCancelGame, gameInstance, animationTransformation, animateForInitialDeal]);

    //#endregion


    /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
     * or if a player will name suit. */
    const beginShuffleAndDealHand = useCallback(() => {

        if (gameInstance && gameState.gameFlow === EuchreGameFlow.SHUFFLE_CARDS && gameState.animationType === EuchreAnimateType.ANIMATE_NONE) {

            logDebugEvent("Begin Shuffle and Deal");

            const shuffleResult = shuffleAndDealHand(gameInstance, gameSettings, shouldCancelGame);
            const newGame = shuffleResult.game;

            if (!newGame.trump)
                throw Error("Trump not found after deal");

            // used for debugging 
            const showAllCards = newGame.gamePlayers.filter(p => !p.human).length === 4;
            const newGameState: GameState = {
                ...gameState,
                areCardsDealt: true,
                hasFirstBiddingPassed: false,
                hasSecondBiddingPassed: false,
                shouldShowHandValues: showAllCards ? newGame.gamePlayers.map(p => { return { player: p, value: true } }) : [],
            };

            dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerGameInfo });
            playerInfoState.centerGameInfo = getFaceUpCard(FLIPPED_CARD_ID, newGame.trump); // display trump card for bidding in the center of the table.
            dispatchUpdatePlayerInfoState({
                type: PlayerInfoActionType.UPDATE_CENTER,
                payload: { ...playerInfoState }
            });

            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
            dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY, payload: gameState });

            setGame(newGame);
            setAnimationTransformation([...animationTransformation, ...shuffleResult.transformations]);

        }
    }, [gameInstance, gameState, shouldCancelGame, playerInfoState]);

    useEffect(() => {
        beginShuffleAndDealHand();
    }, [beginShuffleAndDealHand]);

    useEffect(() => {
        const beginAnimationForBidForTrump = async () => {
            if (!shouldCancelGame && gameInstance && gameState.animationType === EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY) {
                await animateDealCardsForHand(gameInstance);

                dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_NONE, payload: gameState });
                dispatchUpdateGameState({ type: GameActionType.SET_BID_FOR_TRUMP, payload: gameState });
            }
        }

        beginAnimationForBidForTrump();
    }, [gameState, shouldCancelGame, gameInstance, animationTransformation, animateDealCardsForHand]);

    /** Shuffle and deal cards for regular game play. Starts the bidding process to determine if the dealer should pick up the flipped card
         * or if a player will name suit. */
    const beginBidForTrump = useCallback(async () => {

        if (gameInstance && gameState.gameFlow === EuchreGameFlow.BID_FOR_TRUMP && gameState.animationType === EuchreAnimateType.ANIMATE_NONE) {

            logDebugEvent("Begin Bid For Trump - Player: ", gameInstance?.currentPlayer?.name, gameInstance?.currentPlayer);

            if (shouldCancelGame)
                return;

            if (!gameInstance)
                throw Error("Game not found - Bid for Trump.");

            if (!gameInstance?.trump)
                throw Error("Trump not found.");

            if (!gameInstance?.currentPlayer)
                throw Error("Player not found.");

            if (gameState.hasSecondBiddingPassed) {
                // all users have passed. pass the deal to the next user and begin to re-deal.
                await handlePassDeal();
                return;
            }

            if (gameInstance.currentPlayer?.human) {
                setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
            } else {
                const computerChoice = gameInstance.currentPlayer.determineBid(gameInstance, gameInstance.trump, gameState.hasFirstBiddingPassed);
                // short delay to simulate that the computer is making a decision.
                if (!shouldCancelGame)
                    await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

                handleBidResult(computerChoice);
            }

        }
    }, [gameInstance, gameState, shouldCancelGame]);

    useEffect(() => {
        beginBidForTrump();
    }, [beginBidForTrump]);

    /** Submit the resulting bid from user input. */
    const handleBidSubmit = (result: BidResult) => {
        handleBidResult(result);
        setShouldPromptBid(false);
    }

    /** Modify the game state depending on if the user named trump or passed based on player bid choice. */
    const handleBidResult = (result: BidResult) => {

        logDebugEvent("Begin Handle Bid Result - Player: ", gameInstance?.currentPlayer, " State: ", gameState);

        const newGame = gameInstance?.shallowCopy();

        if (!newGame) {
            throw Error("Game not found - Bid submission.");
        }

        if (!newGame.currentPlayer) {
            throw Error("Current player not found - Bid submission.");
        }

        const newGameState = { ...gameState };
        const roundFinished = newGame.dealer === newGame.currentPlayer;
        const firstRound = !newGameState.hasFirstBiddingPassed;

        if (result.orderTrump || result.calledSuit) {
            // player called trump, either by suit or telling the dealer to pick up the card.
            beginOrderTrump(result);
        } else {
            // player passed
            if (roundFinished) {
                newGameState.hasFirstBiddingPassed = firstRound || newGameState.hasFirstBiddingPassed;
                newGameState.hasSecondBiddingPassed = !firstRound;
            }

            const playerElementId = newGame.currentPlayer.generateElementId();
            const newPlayerInfoState = getPlayerStateForBidding(playerElementId, newGame.currentPlayer, "p", playerInfoState, null)
            const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
            const newFadeOutElements: FadeOutOptions[] = [];
            newGame.currentPlayer = rotation[0];

            dispatchUpdatePlayerInfoState(newPlayerInfoState);
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });
            setGame(newGame);
            newFadeOutElements.push({
                playerNumber: newGame.currentPlayer.playerNumber,
                fadeOutId: playerElementId,
                fadeOutDelay: 1,
                fadeOutDuration: 1
            });

            if (roundFinished && !newGameState.hasSecondBiddingPassed) {
                newFadeOutElements.push({ playerNumber: "o", fadeOutId: FLIPPED_CARD_ID, fadeOutDelay: 1, fadeOutDuration: 1 });
            }

            setfadeOutElements(newFadeOutElements);
        }
    }

    /** Player has ordered trump either by naming suit or telling the dealer to pick up the flipped card. */
    const beginOrderTrump = async (result: BidResult) => {

        logDebugEvent("Trump ordered up. Player: ", gameInstance?.currentPlayer?.name);

        const newGame = orderTrump(gameInstance, result);

        if (!newGame)
            throw Error("Game not found - Order Trump.");

        if (!newGame.dealer)
            throw Error("Dealer not found - Order Trump.");

        if (!newGame.maker)
            throw Error("Maker not found - Order Trump.");

        const orderType = result.calledSuit ? "n" : "o";
        const playerElementId: string = newGame.maker.generateElementId();
        const newPlayerInfoState: PlayerInfoAction =
            getPlayerStateForBidding(playerElementId, newGame.maker, orderType, playerInfoState, result.calledSuit);
        logDebugEvent("new player state", newPlayerInfoState);

        dispatchUpdatePlayerInfoState(newPlayerInfoState);
        setfadeOutElements(
            [{
                playerNumber: newGame.maker.playerNumber,
                fadeOutId: playerElementId,
                fadeOutDelay: 1,
                fadeOutDuration: 1
            }]);

        await new Promise(resolve => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

        if (newGame.dealer.human) {
            setShouldPromptDiscard(true);
        } else {
            newGame.dealer.discard(newGame);
            dispatchUpdateGameState({ type: GameActionType.SET_PLAY_HAND, payload: gameState });
        }

        setGame(newGame);
        clearFadeOutElements();
    }

    /** All players passed during the bidding process. Re-initialize for deal for the next user in the rotation.  */
    const handlePassDeal = async () => {

        logDebugEvent("All players passed first and second round. Update state to pass the deal to the next user.");

        const newGame = gameInstance?.shallowCopy();

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
        dispatchUpdateGameState({ type: GameActionType.SET_SHUFFLE_CARDS, payload: gameState });
        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerGameInfo });

        // todo: notify all users have passed.
        await new Promise(resolve => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

        //clearFadeOutElements();
    }

    /** Proxy handler to animate playing the card for the player's choice before updating the state with the choice and result. */
    const handlePlayCardBeginAnimation = useCallback((card: Card) => {
        dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_PLAY_CARDS, payload: gameState });
        setPlayerCard(card);
    }, [gameState]);

    /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. If human player,
     * wait for user to select a card, otherwise select a card for AI player.
     */
    const beginPlayCard = useCallback(async () => {

        if (gameInstance && gameState.gameFlow === EuchreGameFlow.PLAY_HAND && gameState.animationType === EuchreAnimateType.ANIMATE_NONE) {
            logDebugEvent("Begin Play Card - Player: ", gameInstance?.currentPlayer);

            const newGame = gameInstance?.shallowCopy();

            if (shouldCancelGame)
                return;

            if (!newGame)
                throw Error("Game not found - Bid for Trump.");

            if (!newGame?.trump)
                throw Error("Trump not found.");

            if (!newGame?.currentPlayer)
                throw Error("Player not found.");

            if (!newGame?.currentTrick)
                throw Error("Game Trick not found");

            if (newGame.currentTrick.cardsPlayed.length === 4) {
                throw Error("Invalid trick");
            }

            if (newGame.currentTrick.cardsPlayed.length === 0) {
                await new Promise(resolve => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));
                dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerGameInfo });
            }

            if (newGame.currentPlayer?.human) {

            } else {
                const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
                handlePlayCardBeginAnimation(computerChoice);
            }
        }
    }, [gameInstance, gameState, shouldCancelGame, handlePlayCardBeginAnimation]);

    useEffect(() => {
        const beginPlayCardLocal = async () => {
            await beginPlayCard();
        }

        beginPlayCardLocal();
    }, [beginPlayCard]);

    const handlePlayCard = useCallback(async () => {

        if (!gameInstance?.currentPlayer)
            throw Error("Game not found - Play card.");

        if (!playerCard)
            throw Error("Played card not found");

        const newGame = playGameCard(gameInstance.currentPlayer, playerCard, gameInstance);

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        if (!newGame?.trump)
            throw Error("Trump card not found.");

        const rotation = getPlayerRotation(gameInstance.gamePlayers, newGame.currentPlayer, newGame.playerSittingOut);
        const currentRound = gameInstance.currentTrick?.round ?? 1;
        const newPlayerInfoState: PlayerInfoAction =
            getPlayerStateForPlayedCard(playerCard, newGame.currentPlayer, playerInfoState);
        dispatchUpdatePlayerInfoState(newPlayerInfoState);

        if (newGame.currentTrick && newGame.currentTrick.cardsPlayed.length === rotation.length) {
            const trickWinner = determineCurrentWinnerForTrick(newGame.trump, newGame.currentTrick);
            newGame.currentTrick.playerWon = trickWinner.card?.player;

            if (newGame.currentRoundTricks.length < 5) {
                newGame.currentRoundTricks.push(new EuchreTrick(currentRound));
                newGame.currentPlayer = trickWinner.card?.player;
            }
        } else {
            newGame.currentPlayer = rotation[0];
        }

        if (newGame.currentRoundTricks.length === 5 && newGame.currentRoundTricks.filter(t => t.playerWon !== undefined).length === 5) {
            // todo: display round winner.
            await new Promise(resolve => setTimeout(resolve, 2000 * TIMEOUT_MODIFIER));

            newGame.gameTricks.push(...newGame.currentRoundTricks);
            newGame.currentRoundTricks = [];
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: getGameStateForNextHand(gameState, gameSettings, gameInstance) });
            dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerGameInfo });
        } else {
            dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_NONE, payload: gameState });
        }

        setGame(newGame);
    }, [gameInstance, playerCard, playerInfoState, gameState, gameSettings]);

    useEffect(() => {
        const beginAnimationPlayCard = async () => {
            if (!shouldCancelGame && gameInstance && gameState.animationType === EuchreAnimateType.ANIMATE_PLAY_CARDS) {
                await animateForPlayCard(gameInstance);
                await handlePlayCard();
            }
        }

        beginAnimationPlayCard();
    }, [gameState, shouldCancelGame, gameInstance, handlePlayCard]);


    /** Used for debugging. Attempt to save the state again to restart effects. */
    const resaveGameState = () => {
        if (gameInstance)
            setGame(gameInstance.shallowCopy());
    }



































    /** Prompt each player if they choose to order trump/pick suit after initial deal. */
    const bidForTrump = async () => {

        logDebugEvent("Begin bidForTrump - Player: ", gameInstance?.currentPlayer);

        if (shouldCancelGame)
            return;

        if (!gameInstance)
            throw Error("Game not found - Bid for Trump.");

        if (!gameInstance?.trump)
            throw Error("Trump not found.");

        if (!gameInstance?.currentPlayer)
            throw Error("Player not found.");

        if (gameState.hasSecondBiddingPassed) {
            // all users have passed. pass the deal to the next user.
            handlePassDeal();
            return;
        }

        if (gameInstance.currentPlayer?.human) {
            setShouldPromptBid(true); // Show prompt window for choosing trump or passing for human player.
        } else {
            const computerChoice = gameInstance.currentPlayer.determineBid(gameInstance, gameInstance.trump, gameState.hasFirstBiddingPassed);
            //logBidResult(game, computerChoice);

            // short delay to simulate that the computer is making a decision.
            if (!shouldCancelGame)
                await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

            handleBidResult(computerChoice);
        }
    }


    /** Submit the resulting discard from user input. */
    const handleDiscardSubmit = (card: Card) => {
        //handleBidResult(result);
        //setShouldPromptBid(false);
        throw Error("not implemented");
    }

    /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. */
    const playCard = async () => {

        logDebugEvent("Begin playGame - Player: ", gameInstance?.currentPlayer);

        const newGame = gameInstance?.shallowCopy();

        if (shouldCancelGame)
            return;

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
            //handlePlayCard(newGame.currentPlayer, computerChoice);
            //await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
            //newGame.currentTrick.cardsPlayed
        }
    }

    //#region Animation - can be enabled/disabled by game settings.





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
        game: gameInstance, gameState, playerInfoState, shouldPromptBid, shouldPromptDiscard, gameSettings,
        beginNewGame, handleBidSubmit, handleResetGame, handleSettingsChange, handlePlayCardBeginAnimation, handleCancelGame, handleDiscardSubmit, resaveGameState
    };

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
const getPlayerStateForBidding = (id: string, player: EuchrePlayer, info: "p" | "o" | "n", playerInfoState: PlayerGameInfoState, namedSuit: Suit | null): PlayerInfoAction => {

    const newAction: PlayerInfoAction = { type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState } };
    const icon: React.ReactNode = info === "p" ? <XCircleIcon className="min-h-[18px] max-h-[20px]" /> : <CheckCircleIcon className="min-h-[18px] max-h-[20px]" />;
    let messageDetail: string;

    switch (info) {
        case "p": messageDetail = "Pass"; break;
        case "o": messageDetail = "Pick Up"; break;
        case "n": messageDetail = "Calling " + namedSuit; break;
    }

    const infoDetail = <UserInfo id={id}><div className="flex gap-2 items-center">{icon}{messageDetail}</div></UserInfo>;

    switch (player.playerNumber) {
        case 1:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER1;
            newAction.payload.player1GameInfo = infoDetail
            break;
        case 2:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER2;
            newAction.payload.player2GameInfo = infoDetail
            break;
        case 3:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER3;
            newAction.payload.player3GameInfo = infoDetail
            break;
        case 4:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER4;
            newAction.payload.player4GameInfo = infoDetail
            break;
    }

    return newAction;
}

const getPlayerStateForPlayedCard = (card: Card, player: EuchrePlayer, playerInfoState: PlayerGameInfoState) => {
    const newAction: PlayerInfoAction = { type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState } };
    const infoDetail =
        <UserInfo id={card.generateElementId()}>
            <div className="flex gap-2 items-center"><Image
                className={`contain`}
                quality={100}
                width={card.getDisplayWidth(player.location)}
                height={card.getDisplayHeight(player.location)}
                src={getEncodedCardSvg(card, player.location)}
                alt="Game Card" />
            </div>
        </UserInfo>;

    switch (player.playerNumber) {
        case 1:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER1;
            newAction.payload.player1GameInfo = infoDetail
            break;
        case 2:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER2;
            newAction.payload.player2GameInfo = infoDetail
            break;
        case 3:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER3;
            newAction.payload.player3GameInfo = infoDetail
            break;
        case 4:
            newAction.type = PlayerInfoActionType.UPDATE_PLAYER4;
            newAction.payload.player4GameInfo = infoDetail
            break;
    }

    return newAction;

}