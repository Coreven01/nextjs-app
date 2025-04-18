import { useCallback, useRef, useState } from 'react';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '../lib/euchre/definitions';
import { CardState, PlayerHandState } from './euchre/reducers/cardStateReducer';
import { EuchreGameFlow, EuchreGameFlowState } from './euchre/reducers/gameFlowReducer';
import useCardData from './euchre/data/useCardData';
import useCardSvgData from './euchre/data/useCardSvgData';
import useCardTransform, {
  CardPosition,
  CardSprungProps,
  DEFAULT_SPRING_VAL
} from './euchre/data/useCardTransform';
import useGameData from './euchre/data/useGameData';
import usePlayerData from './euchre/data/usePlayerData';

const useCardState = (
  game: EuchreGameInstance,
  gameFlow: EuchreGameFlowState,
  gameSettings: EuchreSettings,
  player: EuchrePlayer
) => {
  const cardsPlayedRef = useRef<Card[]>([]);
  const {
    groupHand,
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomStiffness,
    getRandomRotation,
    getSpringsForCardInit
  } = useCardTransform();
  const { getDisplayWidth, getDisplayHeight, cardEqual } = useCardData();
  const { playerLocation, playerEqual, availableCardsToPlay, sortCardsIndices } = usePlayerData();
  const { getCardsAvailableToPlay, isHandFinished } = useGameData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [handState, setHandState] = useState<PlayerHandState | undefined>(undefined);
  const initSortOrder = useRef<CardPosition[]>([]);

  const setInitialPlayerHandState = () => {
    const location = playerLocation(player);
    const width: number = getDisplayWidth(location);
    const height: number = getDisplayHeight(location);
    const showCardImage = gameFlow.shouldShowCardImagesForHand.find((c) =>
      playerEqual(c.player, player)
    )?.value;

    const showCardValue = gameFlow.shouldShowCardValuesForHand.find((c) =>
      playerEqual(c.player, player)
    )?.value;

    const state: PlayerHandState = {
      width: width,
      height: height,
      shouldEnableShadow: true,
      gameSpeedMs: gameSettings.gameSpeed,
      shouldShowCardValue: showCardValue,
      shouldShowCardImage: showCardImage,
      player: player,
      responsive: true
    };

    setHandState(state);
  };

  const setInitialCardStates = useCallback((): void => {
    const retval: CardState[] = [];
    const location = playerLocation(player);
    const cardBackSvgSrc: string = location === 'center' ? '/card-back.svg' : '/card-back-side.svg';

    for (const card of player.hand) {
      retval.push({
        cardIndex: card.index,
        src: cardBackSvgSrc,
        cardFullName: `Player ${player.playerNumber} Card`,
        initSprungValue: getSpringsForCardInit(player),
        xDamping: getRandomDamping(),
        xStiffness: getRandomStiffness(),
        yDamping: getRandomDamping(),
        yStiffness: getRandomStiffness(),
        rotation: getRandomRotation()
      });
    }

    setCardStates(retval);
  }, [
    getRandomDamping,
    getRandomRotation,
    getRandomStiffness,
    getSpringsForCardInit,
    player,
    playerLocation
  ]);

  const initializeSortOrder = () => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const orderedIndices: CardPosition[] = sortCardsIndices(availableCards, game.maker ? game.trump : null);
    initSortOrder.current = orderedIndices;
  };

  const regroupCards = (
    useInitSortOrder: boolean,
    showCardValues: boolean,
    cardRef: HTMLDivElement,
    location: 'center' | 'side'
  ) => {
    const newCardStates: CardState[] = [...cardStates];
    const currentProps: CardSprungProps[] = getAvailableCardsAndState(useInitSortOrder);
    const newProps: CardSprungProps[] = groupHand(player, cardRef, currentProps);

    for (const state of newCardStates) {
      const tempVal = newProps.find((p) => p.cardIndex === state.cardIndex)?.sprungValue;

      if (!tempVal) throw new Error('Logic error in regroup cards. New card state not found.');

      state.sprungValue = tempVal;

      if (showCardValues) {
        state.cardFullName = getCardFullName(player.hand[state.cardIndex]);
        state.src = getEncodedCardSvg(player.hand[state.cardIndex], location);
      }
    }

    setCardStates(newCardStates);
  };

  const getCardsAvailableIfFollowSuit = () => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);
    const cardsAvailableForFollowSuit: Card[] = [];

    if (
      gameSettings.enforceFollowSuit &&
      player.human &&
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_AI_INPUT &&
      game.trump
    ) {
      // only enable cards that are available for follow suit, if enabled by settings.
      const leadCard = game.currentTrick.cardsPlayed.at(0)?.card ?? null;
      cardsAvailableForFollowSuit.push(
        ...getCardsAvailableToPlay(game.trump, leadCard, player.hand).map((c) => c.card)
      );
    } else {
      // enable all cards to be played that have yet to be played for the current hand.
      cardsAvailableForFollowSuit.push(...playerCurrentHand);
    }

    return cardsAvailableForFollowSuit;
  };

  const getCardsToDisplay = () => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);
    const lastCardPlayed = cardsPlayedRef.current.at(-1);
    if (lastCardPlayed && game.currentTrick.cardsPlayed.find((c) => cardEqual(c.card, lastCardPlayed))) {
      playerCurrentHand.push(lastCardPlayed); // make sure the card is still visible until trick finished.
    } else if (lastCardPlayed && isHandFinished(game)) {
      playerCurrentHand.push(lastCardPlayed);
    }
    return playerCurrentHand;
  };

  const playCard = (
    cardIndex: number,
    cardRef: HTMLDivElement,
    tableRef: HTMLDivElement | undefined,
    rotation: number
  ) => {
    const newCardStates: CardState[] = [...cardStates];
    const card = player.hand[cardIndex];
    const location = playerLocation(player);
    const currentProps: CardSprungProps[] = getAvailableCardsAndState(true);

    const newSprungValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardRef,
      tableRef,
      rotation,
      currentProps
    );

    for (const val of newSprungValues) {
      const cardState = newCardStates.find((c) => c.cardIndex === val.cardIndex);

      if (!cardState) throw new Error('Invalid card state');

      cardState.sprungValue = val.sprungValue;

      if (val.cardIndex === cardIndex) {
        cardState.cardFullName = getCardFullName(card);
        cardState.src = getEncodedCardSvg(card, location);
      }
    }

    cardsPlayedRef.current.push(card);
    setCardStates(newCardStates);
  };

  const flipPlayerHand = useCallback(() => {
    const newCardStates: CardState[] = [...cardStates];
    const location = playerLocation(player);
    for (const cardState of newCardStates) {
      const card = player.hand[cardState.cardIndex];

      cardState.cardFullName = getCardFullName(card);
      cardState.src = getEncodedCardSvg(card, location);

      if (cardState.sprungValue) {
        cardState.sprungValue = {
          ...cardState.sprungValue,
          rotateX: 0,
          rotateY: 0,
          transition: { rotateY: { duration: 0.3 }, rotateX: { duration: 0.3 } }
        };
      }
    }

    setCardStates(newCardStates);
  }, [cardStates, getCardFullName, getEncodedCardSvg, player, playerLocation]);

  /** Returns the current card state for cards that are available to be played. */
  const getAvailableCardsAndState = (useInitSortOrder: boolean) => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const availableCardIndices = availableCards.map((c) => c.index);
    const orderedIndices: CardPosition[] = !useInitSortOrder
      ? sortCardsIndices(availableCards, game.maker ? game.trump : null)
      : initSortOrder.current
          .filter((s) => availableCardIndices.includes(s.cardIndex))
          .map((card, index) => {
            return { cardIndex: card.cardIndex, ordinalIndex: index };
          });
    const currentProps: CardSprungProps[] = [];

    for (const indexPosition of orderedIndices) {
      const state = cardStates.find((s) => s.cardIndex === indexPosition.cardIndex);
      if (!state) throw new Error('Card state not found when getting available cards/state.');

      currentProps.push({
        ordinalIndex: indexPosition.ordinalIndex,
        cardIndex: indexPosition.cardIndex,
        sprungValue:
          state.sprungValue ??
          (state.initSprungValue ? { ...state.initSprungValue } : { ...DEFAULT_SPRING_VAL })
      });
    }

    return currentProps;
  };

  return {
    handState,
    cardStates,
    initializeSortOrder,
    regroupCards,
    setInitialPlayerHandState,
    setInitialCardStates,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    playCard,
    getDisplayWidth,
    getDisplayHeight,
    cardEqual,
    playerEqual,
    playerLocation,
    getCardFullName,
    getEncodedCardSvg,
    flipPlayerHand
  };
};

export default useCardState;
