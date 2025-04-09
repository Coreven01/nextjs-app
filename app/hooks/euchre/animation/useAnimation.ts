import { CardTransformation, FadeOutOptions } from '@/app/hooks/euchre/useMoveCard';
import {
  Card,
  EuchreGameInstance,
  EuchrePlayer,
  EuchreSettings,
  GameSpeed
} from '../../../lib/euchre/definitions';

import useOtherAnimation from './useOtherAnimation';
import usePlayer1Animation from './usePlayer1Animation';
import usePlayer2Animation from './usePlayer2Animation';
import usePlayer3Animation from './usePlayer3Animation';
import usePlayer4Animation from './usePlayer4Animation';
import { useCallback } from 'react';
import useGameStateLogic from '../logic/useGameStateLogic';
import usePlayerData from '../data/usePlayerData';

export default function useAnimation(settings: EuchreSettings) {
  const { generateElementId } = useGameStateLogic();
  const { getPlayerRotation } = usePlayerData();

  const { setCardsToMovePlayer1, setElementsForTransformationPlayer1, setElementForFadeOutPlayer1 } =
    usePlayer1Animation();
  const { setCardsToMovePlayer2, setElementsForTransformationPlayer2, setElementForFadeOutPlayer2 } =
    usePlayer2Animation();
  const { setCardsToMovePlayer3, setElementsForTransformationPlayer3, setElementForFadeOutPlayer3 } =
    usePlayer3Animation();
  const { setCardsToMovePlayer4, setElementsForTransformationPlayer4, setElementForFadeOutPlayer4 } =
    usePlayer4Animation();
  const { setCardsToMoveOther, setElementsForTransformationOther, setElementForFadeOutOther } =
    useOtherAnimation();

  interface TransformationValues {
    location: number | 'o';
    transformations: CardTransformation[];
  }

  const getTransformationsForDealCards = (
    game: EuchreGameInstance,
    settings: EuchreSettings
  ): TransformationValues[] => {
    if (!game) throw Error('Game not found.');

    if (!game?.dealer) throw Error('Game dealer not found for card animation.');

    if (!settings.shouldAnimate) return [];

    const rotation = getPlayerRotation(game.gamePlayers, game.dealer);
    const retval: TransformationValues[] = [];
    const trumpCard = game.kitty[0];
    const dealerNumber = game.dealer?.playerNumber ?? 1;

    //#region Animation deal cards to users.
    for (let i = 0; i < 8; i++) {
      const player = rotation[i % 4];
      const playerNumber = player.playerNumber;
      const destinationId = ''; //player.innerPlayerBaseId;
      const firstRound = i < 4;
      const transformations: CardTransformation[] = [];

      let cardCount: number = 0;
      cardCount = firstRound ? game.cardDealCount[i % 2] : game.cardDealCount[(i + 1) % 2];

      for (let cardIndex = 0; cardIndex < cardCount; cardIndex++) {
        const card = player.hand[firstRound ? cardIndex : 5 - cardCount + cardIndex];
        const cardSrcId = generateElementId();

        transformations.push({
          sourceId: cardSrcId,
          destinationId: destinationId,
          sourcePlayerNumber: dealerNumber,
          destinationPlayerNumber: playerNumber,
          location: 'inner',
          options: {
            msDelay: settings.gameSpeed,
            displayCardValue: false,
            card: card,
            cardOffsetHorizontal: 0,
            cardOffsetVertical: 0
          }
        });
      }

      retval.push({ location: playerNumber, transformations: transformations });
    }

    retval.push({
      location: 'o',
      transformations: [
        {
          sourceId: generateElementId(),
          destinationId: 'game-center',
          sourcePlayerNumber: dealerNumber,
          destinationPlayerNumber: 0,
          location: 'outer',
          options: {
            card: trumpCard,
            displayCardValue: false,
            msDelay: settings.gameSpeed,
            cardOffsetVertical: 0,
            cardOffsetHorizontal: 0
          }
        }
      ]
    });

    return retval;
  };

  const getFadeOutFunc = useCallback(
    (location: number | 'o'): ((id: string, delay: GameSpeed, duration: GameSpeed) => void) => {
      switch (location) {
        case 1:
          return setElementForFadeOutPlayer1;
        case 2:
          return setElementForFadeOutPlayer2;
        case 3:
          return setElementForFadeOutPlayer3;
        case 4:
          return setElementForFadeOutPlayer4;
        case 'o':
          return setElementForFadeOutOther;
      }

      throw new Error('Invalid location for fade out.');
    },
    [
      setElementForFadeOutOther,
      setElementForFadeOutPlayer1,
      setElementForFadeOutPlayer2,
      setElementForFadeOutPlayer3,
      setElementForFadeOutPlayer4
    ]
  );

  const getMoveCardFunc = useCallback(
    (location: number | 'o') => {
      switch (location) {
        case 1:
          return setCardsToMovePlayer1;
        case 2:
          return setCardsToMovePlayer2;
        case 3:
          return setCardsToMovePlayer3;
        case 4:
          return setCardsToMovePlayer4;
        case 'o':
          return setCardsToMoveOther;
      }

      throw new Error('Invalid location for fade out.');
    },
    [
      setCardsToMoveOther,
      setCardsToMovePlayer1,
      setCardsToMovePlayer2,
      setCardsToMovePlayer3,
      setCardsToMovePlayer4
    ]
  );

  /** */
  const animateForInitialDeal = async (
    transformations: CardTransformation[][],
    game: EuchreGameInstance,
    originalDealer: EuchrePlayer
  ) => {
    console.log('Begin animation for initial deal.');

    // if (transformations.length === 0) {
    //   await new Promise((resolve) => setTimeout(resolve, settings.gameSpeed));
    //   return;
    // }

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
  };

  /** After cards have been dealt to users, removes the transformation to animate returning the cards back to the dealer */
  const animateCardsReturnToDealer = async (cardIds: string[]) => {
    //setElementsForTransformation(cardIds);
    await new Promise((resolve) => setTimeout(resolve, settings.gameSpeed));
  };

  /** */
  const animatePassCardsToPlayer = async (
    gameDeck: Card[],
    sourcePlayer: EuchrePlayer,
    destinationPlayer: EuchrePlayer
  ) => {
    const dealDestId = ''; //destinationPlayer.playerBase;
    const cardsToMove = new Map<string, Card | undefined>(
      gameDeck.map((card) => [generateElementId(), card])
    );
    cardsToMove.set('deal-dummy', undefined); // add the dummy card, which isn't really a card in the deck.
    const sourcePlayerNumber = sourcePlayer.playerNumber;
    const destinationPlayerNumber = destinationPlayer.playerNumber;

    // animation to pass cards to the new dealer.
    const transformValues: CardTransformation[] = [
      ...cardsToMove.entries().map<CardTransformation>((e) => {
        return {
          sourceId: e[0],
          destinationId: dealDestId,
          sourcePlayerNumber: sourcePlayerNumber,
          destinationPlayerNumber: destinationPlayerNumber,
          location: 'outer',
          options: {
            card: e[1],
            displayCardValue: false,
            msDelay: 25 * settings.gameSpeed,
            cardOffsetVertical: 0,
            cardOffsetHorizontal: 0
          }
        };
      })
    ];

    //await setCardsToMove(transformValues);
  };

  const animateDealCardsForHand = async (game: EuchreGameInstance) => {
    if (!game) throw Error('Game not found.');

    const transfomations = getTransformationsForDealCards(game, settings);

    if (transfomations.length === 0) await new Promise((resolve) => setTimeout(resolve, settings.gameSpeed));
    else {
      for (const t of transfomations) {
        await getMoveCardFunc(t.location)(t.transformations);
      }
    }
  };

  const animateForPlayCard = async (game: EuchreGameInstance) => {
    console.log('begin animation for play card.');
    await new Promise((resolve) => setTimeout(resolve, settings.gameSpeed));
  };

  const setFadeOutForPlayers = useCallback(
    (elements: FadeOutOptions[]) => {
      console.log('begin animation for fade out.');

      for (const ele of elements) {
        const func = getFadeOutFunc(ele.playerNumber);
        func(ele.fadeOutId, ele.fadeOutDelay, ele.fadeOutDuration);
      }
    },
    [getFadeOutFunc]
  );

  return {
    animateForInitialDeal,
    animateDealCardsForHand,
    animateForPlayCard,
    setFadeOutForPlayers
  };
}
