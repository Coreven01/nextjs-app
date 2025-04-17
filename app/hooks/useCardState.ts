import { useCallback, useRef, useState } from 'react';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '../lib/euchre/definitions';
import { CardState, PlayerHandState } from './euchre/reducers/cardStateReducer';
import { EuchreGameFlow, EuchreGameFlowState } from './euchre/reducers/gameFlowReducer';
import useCardData from './euchre/data/useCardData';
import useCardSvgData from './euchre/data/useCardSvgData';
import useCardTransform, { CardSprungProps, DEFAULT_SPRUNG_VAL } from './euchre/data/useCardTransform';
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
  const { playerLocation, playerEqual, availableCardsToPlay } = usePlayerData();
  const { getCardsAvailableToPlay, isHandFinished } = useGameData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [handState, setHandState] = useState<PlayerHandState | undefined>(undefined);

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

  const regroupCards = (cardRef: HTMLDivElement) => {
    const newCardStates: CardState[] = [...cardStates];
    const indices = newCardStates.map((s) => s.cardIndex);
    const currentProps: CardSprungProps[] = newCardStates.map((s) => ({
      cardIndex: s.cardIndex,
      sprungValue: s.sprungValue ?? (s.initSprungValue ? { ...s.initSprungValue } : { ...DEFAULT_SPRUNG_VAL })
    }));
    const sprungValues = groupHand(player, indices, cardRef, currentProps);

    for (const state of newCardStates) {
      state.sprungValue = sprungValues[state.cardIndex].sprungValue;
    }

    setCardStates(newCardStates);
  };

  const getCardsAvailableIfFollowSuit = () => {
    const playerCurrentHand: Card[] = availableCardsToPlay(player);
    const cardsAvailableForFollowSuit: Card[] = [];

    if (
      gameSettings.enforceFollowSuit &&
      player.human &&
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_PLAY_CARD &&
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
    const availableIndices = availableCardsToPlay(player)
      .map((c) => c.index)
      .filter((i) => i !== cardIndex);

    const newSprungValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardRef,
      tableRef,
      rotation,
      newCardStates.map((c) => ({
        cardIndex: c.cardIndex,
        sprungValue: c.sprungValue ?? { ...DEFAULT_SPRUNG_VAL }
      })),
      availableIndices
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

  return {
    handState,
    cardStates,
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
    getEncodedCardSvg
  };
};

export default useCardState;
