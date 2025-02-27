import { TIMEOUT_MODIFIER } from "../constants";
import { EuchreGameInstance, EuchrePlayer } from "../data";
import { CardTransformation } from "../useMoveCard";

/** */
const animateForInitialDeal = async (transformations: CardTransformation[][], game: EuchreGameInstance, originalDealer: EuchrePlayer) => {
    
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