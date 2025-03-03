import { TIMEOUT_MODIFIER } from "../constants";
import { Card, EuchreGameInstance, EuchrePlayer } from "../data";
import { getPlayerRotation } from "../game";
import { PlayerInfoAction } from "../playerInfoReducer";
import { CardTransformation, FadeOutOptions } from "../useMoveCard";
import useOtherAnimation from "./useOtherAnimation";
import usePlayer1Animation from "./usePlayer1Animation";
import usePlayer2Animation from "./usePlayer2Animation";
import usePlayer3Animation from "./usePlayer3Animation";
import usePlayer4Animation from "./usePlayer4Animation";



export default function useAnimation() {
    const { setCardsToMovePlayer1, setElementsForTransformationPlayer1, setElementForFadeOutPlayer1 } = usePlayer1Animation();
    const { setCardsToMovePlayer2, setElementsForTransformationPlayer2, setElementForFadeOutPlayer2 } = usePlayer2Animation();
    const { setCardsToMovePlayer3, setElementsForTransformationPlayer3, setElementForFadeOutPlayer3 } = usePlayer3Animation();
    const { setCardsToMovePlayer4, setElementsForTransformationPlayer4, setElementForFadeOutPlayer4 } = usePlayer4Animation();
    const { setCardsToMoveOther, setElementsForTransformationOther, setElementForFadeOutOther } = useOtherAnimation();

    function getFadeOutFunc(location: number | "o"): (id: string, delay: 0 | 1 | 2 | 3 | 4 | 5, duration: 0 | 1 | 2 | 3 | 4 | 5) => void {

        switch(location)
        {
            case 1: return setElementForFadeOutPlayer1;
            case 2: return setElementForFadeOutPlayer2;
            case 3: return setElementForFadeOutPlayer3;
            case 4: return setElementForFadeOutPlayer4;
            case "o": return setElementForFadeOutOther;
        }

        throw new Error("Invalid location for fade out.");
    }

    /** */
    const animateForInitialDeal = async (transformations: CardTransformation[][], game: EuchreGameInstance, originalDealer: EuchrePlayer) => {
        console.log("begin animation for deal.");
        //#region Animation to return cards to dealer, then pass cards to new dealer.
        // await new Promise((resolve) => setTimeout(resolve, 750 * TIMEOUT_MODIFIER));

        // // animate dealing cards to players.
        // for (const transform of transformations) {
        //     if (shouldCancelGame) return;
        //     await setCardsToMove(transform);
        // }

        // await new Promise((resolve) => setTimeout(resolve, 1500 * TIMEOUT_MODIFIER));

        // if (shouldCancelGame) return;

        // // animate returning cards to dealer
        // const cardIds: string[] = transformations.map(t => t.map(inner => inner.sourceId)).flat();
        // setElementsForTransformation(cardIds);
        // await new Promise((resolve) => setTimeout(resolve, 50 * TIMEOUT_MODIFIER));
        // const centerElementName = 'center-info-div'

        // // dispatchUpdatePlayerInfoState({
        // //     type: PlayerInfoActionType.UPDATE_CENTER,
        // //     payload: {
        // //         ...playerInfoState, centerInfo: <CenterInfo id={centerElementName} > {`Dealer: ${game.currentPlayer?.name}`}</CenterInfo>
        // //     }
        // // });

        // // setElementForFadeOut(centerElementName, 2, 2);
        // if (shouldCancelGame) return;

        // await new Promise((resolve) => setTimeout(resolve, 750 * TIMEOUT_MODIFIER));

        // // animate passing cards to new dealer.
        // if (originalDealer && game.dealer && originalDealer.playerNumber != game.dealer.playerNumber)
        //     await animatePassCardsToPlayer(game.deck, originalDealer, game.dealer);

        // if (shouldCancelGame) return;

        // await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
    }

    /** After cards have been dealt to users, removes the transformation to animate returning the cards back to the dealer */
    const animateCardsReturnToDealer = async (cardIds: string[]) => {

        //setElementsForTransformation(cardIds);
        await new Promise((resolve) => setTimeout(resolve, 50 * TIMEOUT_MODIFIER));
    }

    /** */
    const animatePassCardsToPlayer = async (gameDeck: Card[], sourcePlayer: EuchrePlayer, destinationPlayer: EuchrePlayer) => {

        const dealDestId = destinationPlayer.playerBase;
        const cardsToMove = new Map<string, Card | undefined>(gameDeck.map((card) => [card.generateElementId(), card]));
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

        //await setCardsToMove(transformValues);
    }

    const animateDealCardsForHand = async (game: EuchreGameInstance) => {

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
                const cardSrcId = card.generateElementId();

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
            sourceId: trumpCard.generateElementId(),
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

        //await animate.setCardsToMove(transformations);
    }

    const animateForPlayCard = async (game: EuchreGameInstance) => {
        console.log("begin animation for play card.");
        await new Promise((resolve) => setTimeout(resolve, 1000 * TIMEOUT_MODIFIER));
    }

    const setFadeOutForPlayers = (elements: FadeOutOptions[]) => {
        console.log("begin animation for fade out.");

        for( const ele of elements)
        {
            const func = getFadeOutFunc(ele.playerNumber);
            func(ele.fadeOutId, ele.fadeOutDelay, ele.fadeOutDuration);
        }
    }

    return { animateForInitialDeal, animateDealCardsForHand, animateForPlayCard, setFadeOutForPlayers };
}

