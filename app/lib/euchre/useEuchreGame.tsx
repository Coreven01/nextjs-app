'use client';

import CenterInfo from "@/app/ui/euchre/center-info";
import UserInfo from "@/app/ui/euchre/user-info";
import Image from 'next/image';
import { useCallback, useEffect, useReducer, useState } from "react";
import { BidResult, Card, EuchreGameInstance, EuchrePlayer, EuchreSettings, EuchreTrick, initialGameSettings, Suit } from "./data";
import { initialPlayerInfoState, PlayerInfoAction, PlayerInfoActionType, PlayerInfoState, PlayerInfoStateDetail, playerInfoStateReducer } from "./playerInfoReducer";
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

    const [gameInstance, setGame] = useState<EuchreGameInstance | undefined>(undefined);
    const [gameSettings, setSettings] = useState<EuchreSettings>(initialGameSettings);
    const [animationTransformation, setAnimationTransformation] = useState<CardTransformation[][]>([]);
    const [fadeOutElements, setfadeOutElements] = useState<FadeOutOptions[]>([]);

    const [gameState, dispatchUpdateGameState] = useReducer(gameStateReducer, initialGameState);
    const [playerInfoState, dispatchUpdatePlayerInfoState] = useReducer(playerInfoStateReducer, initialPlayerInfoState);
    const { animateForInitialDeal, animateDealCardsForHand, setFadeOutForPlayers } = useAnimation();

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

        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerInfoState });
        setShouldPromptBid(false);
        setShouldPromptDiscard(false);
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
            setAnimationTransformation(dealResult.transformations);
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

            playerInfoState.centerInfo.detail = getFaceUpCard(FLIPPED_CARD_ID, newGame.trump); // display trump card for bidding in the center of the table.
            dispatchUpdatePlayerInfoState({
                type: PlayerInfoActionType.UPDATE_CENTER,
                payload: { ...playerInfoState }
            });

            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: newGameState });
            dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY, payload: gameState });

            setGame(newGame);
            setAnimationTransformation(shuffleResult.transformations);

        }
    }, [gameInstance, gameState, shouldCancelGame, playerInfoState]);

    useEffect(() => {
        beginShuffleAndDealHand();
    }, [beginShuffleAndDealHand]);

    useEffect(() => {
        const beginAnimationForRegularPlay = async () => {
            if (!shouldCancelGame && gameInstance && gameState.animationType === EuchreAnimateType.ANIMATE_DEAL_CARDS_FOR_REGULAR_PLAY) {
                await animateDealCardsForHand(gameInstance);

                dispatchUpdateGameState({ type: GameActionType.SET_ANIMATE_NONE, payload: gameState });
                dispatchUpdateGameState({ type: GameActionType.SET_BID_FOR_TRUMP, payload: gameState });
            }
        }

        beginAnimationForRegularPlay();
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

            const playerElementId = newGame.currentPlayer.playerBidId(firstRound ? 1 : 2);
            const newPlayerInfoState = getPlayerStateForBidding(playerElementId, newGame.currentPlayer, "p", playerInfoState, null)
            const rotation = getPlayerRotation(newGame.gamePlayers, newGame.currentPlayer);
            newGame.currentPlayer = rotation[0];

            dispatchUpdatePlayerInfoState(newPlayerInfoState);
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: { ...newGameState } });
            setGame(newGame);
            setfadeOutElements([{
                playerNumber: newGame.currentPlayer.playerNumber,
                fadeOutId: playerElementId,
                fadeOutDelay: 1,
                fadeOutDuration: 1
            }]);

            if (roundFinished) {
                setfadeOutElements([{ playerNumber: "o", fadeOutId: FLIPPED_CARD_ID, fadeOutDelay: 1, fadeOutDuration: 1 }]);
            }
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
        const rotation = getPlayerRotation(newGame.gamePlayers, newGame.dealer, newGame.playerSittingOut);
        const playerElementId = `player-${newGame.maker.playerNumber}-bid-${3}`;
        const newPlayerInfoState = getPlayerStateForBidding(playerElementId, newGame.maker, orderType, playerInfoState, result.calledSuit);
        dispatchUpdatePlayerInfoState(newPlayerInfoState);

        await new Promise(resolve => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));

        newPlayerInfoState.type = PlayerInfoActionType.UPDATE_CENTER;
        newPlayerInfoState.payload.centerInfo.detail = undefined;
        dispatchUpdatePlayerInfoState(newPlayerInfoState);

        newGame.currentPlayer = rotation[0];

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
    const handlePassDeal = () => {

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
        dispatchUpdatePlayerInfoState({ type: PlayerInfoActionType.SET_ALL, payload: initialPlayerInfoState });
        clearFadeOutElements();
    }

    /** Regualr play for the game for winning tricks. Each player will play a card to determine the winner of the trick. */
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

            if (newGame.currentPlayer?.human) {

            } else {
                const computerChoice = newGame.currentPlayer.determineCardToPlay(newGame);
                handlePlayCard(newGame.currentPlayer, computerChoice);
                await new Promise((resolve) => setTimeout(resolve, 500 * TIMEOUT_MODIFIER));
            }
        }
    }, [gameInstance, gameState, shouldCancelGame]);

    useEffect(() => {
        beginPlayCard();
    }, [beginPlayCard]);


    const handlePlayCard = async (player: EuchrePlayer, card: Card) => {

        if (!gameInstance)
            throw Error("Game not found - Play card.");

        const newGame = playGameCard(player, card, gameInstance);

        if (!newGame?.currentPlayer)
            throw Error("Player not found.");

        if (!newGame?.trump)
            throw Error("Trump card not found.");

        await new Promise(resolve => setTimeout(resolve, 500));

        const rotation = getPlayerRotation(gameInstance.gamePlayers, newGame.currentPlayer, newGame.playerSittingOut);
        const currentRound = gameInstance.currentTrick?.round ?? 1;

        if (newGame.currentTrick && newGame.currentTrick.cardsPlayed.length === rotation.length) {
            const trickWinner = determineCurrentWinnerForTrick(newGame.trump, newGame.currentTrick);
            newGame.currentTrick.playerWon = trickWinner.card?.player;

            if (newGame.currentRoundTricks.length < 5){
                newGame.currentRoundTricks.push(new EuchreTrick(currentRound));
                newGame.currentPlayer = trickWinner.card?.player;
            }
        } else {
            newGame.currentPlayer = rotation[0];
        }

        if (newGame.currentRoundTricks.length === 5 && newGame.currentRoundTricks.filter(t => t.playerWon !== undefined).length === 5) {
            // todo: display round winner.
            //alert("done");
            newGame.gameTricks.push(...newGame.currentRoundTricks);
            newGame.currentRoundTricks = [];
            dispatchUpdateGameState({ type: GameActionType.UPDATE_ALL, payload: getGameStateForNextHand(gameState, gameSettings, gameInstance)});
        }

        setGame(newGame);
    }

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
            handlePlayCard(newGame.currentPlayer, computerChoice);
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
        beginNewGame, handleBidSubmit, handleResetGame, handleSettingsChange, handlePlayCard, handleCancelGame, handleDiscardSubmit, resaveGameState
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
const getPlayerStateForBidding = (id: string, player: EuchrePlayer, info: "p" | "o" | "n", playerInfoState: PlayerInfoState, namedSuit: Suit | null): PlayerInfoAction => {

    let detail: PlayerInfoStateDetail;
    const newAction: PlayerInfoAction = { type: PlayerInfoActionType.UPDATE_PLAYER1, payload: { ...playerInfoState } };
    const icon: React.ReactNode = info === "p" ? <XCircleIcon className="min-h-[18px] max-h-[20px]" /> : <CheckCircleIcon className="min-h-[18px] max-h-[20px]" />;
    let messageDetail: string;

    switch (info) {
        case "p": messageDetail = "Pass"; break;
        case "o": messageDetail = "Pick Up"; break;
        case "n": messageDetail = "Calling " + namedSuit; break;
    }

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
        return newAction;
    }

    throw Error("Unable to update player info state");
}