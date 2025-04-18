import { RefObject, useCallback, useEffect, useRef, useState } from 'react';
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
import { EuchreAnimateType, EuchreAnimationState } from './euchre/reducers/gameAnimationFlowReducer';

const useCardState = (
  game: EuchreGameInstance,
  gameFlow: EuchreGameFlowState,
  gameSettings: EuchreSettings,
  gameAnimation: EuchreAnimationState,
  player: EuchrePlayer,
  onBeginComplete: () => void
) => {
  //#region Hooks/Variables
  // reference to the card elements, used to calc spacing between cards when the screen is resized.
  const cardRefs = useRef<Map<number, RefObject<HTMLDivElement> | undefined>>(
    new Map<number, RefObject<HTMLDivElement> | undefined>([
      [0, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [1, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [2, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [3, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)],
      [4, useRef<HTMLDivElement>(null as unknown as HTMLDivElement)]
    ])
  );
  const cardsDealtRef = useRef(false);
  const cardsPlayedRef = useRef<Card[]>([]);
  const cardsRefSet = useRef(false);
  const cardsRefBeginSet = useRef(false);
  const cardsInitReorder = useRef(false);
  const cardsInitSittingOut = useRef(false);

  const [cardStates, setCardStates] = useState<CardState[]>([]);
  const [handState, setHandState] = useState<PlayerHandState | undefined>(undefined);
  const initSortOrder = useRef<CardPosition[]>([]);
  const initCalculatedWidth = useRef(0);

  const {
    groupHand,
    getSpringsForCardPlayed,
    getRandomDamping,
    getRandomStiffness,
    getRandomRotation,
    getSpringsForCardInit,
    getCalculatedWidthOffset
  } = useCardTransform();
  const { getDisplayWidth, getDisplayHeight, cardEqual } = useCardData();
  const { playerLocation, playerEqual, availableCardsToPlay, sortCardsIndices } = usePlayerData();
  const { getCardsAvailableToPlay, isHandFinished, playerSittingOut, gameDelay } = useGameData();
  const { getCardFullName, getEncodedCardSvg } = useCardSvgData();
  const sittingOutPlayer = playerSittingOut(game);
  const playerIsSittingOut = sittingOutPlayer && playerEqual(player, sittingOutPlayer);
  //#endregion

  //#region Functions/Methods

  /** Returns the current card state for cards that are available to be played.
   *
   */
  const getAvailableCardsAndState = useCallback(
    (useInitSortOrder: boolean) => {
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
            state.springValue ??
            (state.initSprungValue ? { ...state.initSprungValue } : { ...DEFAULT_SPRING_VAL })
        });
      }

      return currentProps;
    },
    [availableCardsToPlay, cardStates, game.maker, game.trump, player, sortCardsIndices]
  );

  /** Create and set the initial hand state for the player's hand. */
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
      location: location,
      shouldEnableShadow: true,
      gameSpeedMs: gameSettings.gameSpeed,
      shouldShowCardValue: showCardValue,
      shouldShowCardImage: showCardImage,
      player: player,
      responsive: true
    };

    setHandState(state);
  };

  /** Set initial card state used when animation of cards being played. */
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

  /** Set the sort order for the player's hand. Used to display the suits grouped together and trump first. */
  const initializeSortOrder = () => {
    const availableCards: Card[] = availableCardsToPlay(player);
    const orderedIndices: CardPosition[] = sortCardsIndices(availableCards, game.maker ? game.trump : null);
    initSortOrder.current = orderedIndices;
  };

  /** Re-adjusts the player's hand that are displayed. Used after a player plays a card and to group the cards together. */
  const regroupCards = useCallback(
    (
      useInitSortOrder: boolean,
      showCardValues: boolean,
      cardRef: HTMLDivElement,
      location: 'center' | 'side'
    ) => {
      const newCardStates: CardState[] = [...cardStates];
      const currentProps: CardSprungProps[] = getAvailableCardsAndState(useInitSortOrder);

      if (initCalculatedWidth.current === 0) {
        initCalculatedWidth.current = getCalculatedWidthOffset(cardRef);
      }

      const newProps: CardSprungProps[] = groupHand(player, initCalculatedWidth.current, currentProps);

      for (const state of newCardStates) {
        const tempVal = newProps.find((p) => p.cardIndex === state.cardIndex)?.sprungValue;

        if (!tempVal) throw new Error('Logic error in regroup cards. New card state not found.');

        state.springValue = tempVal;

        if (showCardValues) {
          state.cardFullName = getCardFullName(player.hand[state.cardIndex]);
          state.src = getEncodedCardSvg(player.hand[state.cardIndex], location);
        }
      }

      setCardStates(newCardStates);
    },
    [
      cardStates,
      getAvailableCardsAndState,
      getCalculatedWidthOffset,
      getCardFullName,
      getEncodedCardSvg,
      groupHand,
      player
    ]
  );

  /** Gets the cards that are available to be played for the current trick. If enforce follow suit setting is enabled, then only
   * return those cards.
   */
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

  /** Returns the cards should be displayed on the game table. Ensures the played cards stays center table until the trick is finished. */
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

  /** Updates the card state to animate the card being played to the center of the table. Regroups the remaining cards together in the player's hand. */
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
    const cardWidthOffset = initCalculatedWidth.current;

    const newSprungValues = getSpringsForCardPlayed(
      cardIndex,
      player,
      cardRef,
      tableRef,
      rotation,
      currentProps,
      cardWidthOffset
    );

    for (const val of newSprungValues) {
      const cardState = newCardStates.find((c) => c.cardIndex === val.cardIndex);

      if (!cardState) throw new Error('Invalid card state');

      cardState.springValue = val.sprungValue;

      if (val.cardIndex === cardIndex) {
        cardState.cardFullName = getCardFullName(card);
        cardState.src = getEncodedCardSvg(card, location);
      }
    }

    cardsPlayedRef.current.push(card);
    setCardStates(newCardStates);
  };

  /** Animates flipping a player's hand so the card values are visible. */
  const flipPlayerHand = useCallback(() => {
    const newCardStates: CardState[] = [...cardStates];
    const location = playerLocation(player);
    for (const cardState of newCardStates) {
      const card = player.hand[cardState.cardIndex];

      cardState.cardFullName = getCardFullName(card);
      cardState.src = getEncodedCardSvg(card, location);

      if (cardState.springValue) {
        cardState.springValue = {
          ...cardState.springValue,
          rotateX: 0,
          rotateY: 0,
          transition: { rotateY: { duration: 0.3 }, rotateX: { duration: 0.3 } }
        };
      }
    }

    setCardStates(newCardStates);
  }, [cardStates, getCardFullName, getEncodedCardSvg, player, playerLocation]);

  //#endregion

  //#region  UseEffect hooks

  /** Set initial hand state after cards have been dealt. */
  useEffect(() => {
    const shouldCreateHandState =
      handState === undefined &&
      gameFlow.gameFlow === EuchreGameFlow.BEGIN_DEAL_CARDS &&
      gameAnimation.animationType === EuchreAnimateType.ANIMATE;

    if (shouldCreateHandState) {
      setInitialPlayerHandState();
    }
  });

  /** Re-order player's hand once trump has been set. */
  useEffect(() => {
    const shouldReorderHand =
      !cardsInitReorder.current &&
      gameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP &&
      gameAnimation.animationType === EuchreAnimateType.ANIMATE;

    if (shouldReorderHand) {
      const cardRef = cardRefs.current.values().find((c) => c?.current)?.current;

      if (!cardRef) throw new Error('Invalid card ref when reorder hand after trump named.');

      cardsInitReorder.current = true;

      initializeSortOrder();
      if (handState?.shouldShowCardValue) {
        regroupCards(true, true, cardRef, handState.location);
      }
    }
  });

  /** create initial card state once cards have been dealt */
  useEffect(() => {
    const shouldCreateCardState =
      handState !== undefined &&
      !cardsDealtRef.current &&
      player.hand.length === 5 &&
      player.playedCards.length === 0 &&
      cardStates.length === 0;

    if (shouldCreateCardState) {
      setInitialCardStates();
      cardsDealtRef.current = true;
    }
  }, [
    cardStates.length,
    handState,
    handState?.shouldShowCardValue,
    player.hand.length,
    player.playedCards.length,
    setInitialCardStates
  ]);

  /** Re-groups/adjusts the player's hand so it displayed fanned as if the player was holding them. Once the
   * animation completes, executes the function to proceed to the next game state.
   */
  useEffect(() => {
    const beginRegroupCards = async () => {
      if (handState && !cardsRefBeginSet.current && cardStates.length == 5) {
        cardsRefBeginSet.current = true;
        const cardRef = cardRefs.current.values().find((c) => c?.current)?.current;

        if (!cardRef) throw new Error('Invalid card ref when setting initial animation.');

        const delay = gameSettings.gameSpeed * player.team;
        await new Promise((resolve) => setTimeout(resolve, delay));
        cardsRefSet.current = true;

        regroupCards(false, false, cardRef, handState.location);
        beginShowCards();
        onBeginComplete();
      }
    };

    const beginShowCards = async () => {
      // flip cards over to see their values if enabled for the current player.
      if (handState?.shouldShowCardValue) {
        await new Promise((resolve) => setTimeout(resolve, gameSettings.gameSpeed));
        flipPlayerHand();
      }
    };

    beginRegroupCards();
  }, [
    cardsRefSet,
    cardStates.length,
    gameSettings.gameSpeed,
    player.team,
    regroupCards,
    flipPlayerHand,
    game.trump,
    onBeginComplete,
    handState?.shouldShowCardValue,
    handState
  ]);

  /** If the player is sitting out, set the animation to set the cards back to their initial state, then fade out. */
  useEffect(() => {
    const beginSittingOut = async () => {
      if (!cardsInitSittingOut.current && playerIsSittingOut) {
        cardsInitSittingOut.current = true;

        cardStates.forEach((s) => (s.springValue = { ...DEFAULT_SPRING_VAL }));
        await gameDelay(gameSettings);
        cardStates.forEach(
          (s) => (s.springValue = { ...getSpringsForCardInit(player), opacity: 0, rotateX: 0, rotateY: 0 })
        );
      }
    };
    beginSittingOut();
  }, [cardStates, gameDelay, gameSettings, getSpringsForCardInit, player, playerIsSittingOut]);
  //#endregion

  return {
    cardsDealtRef,
    cardsPlayedRef,
    cardRefs,
    handState,
    cardStates,
    getCardsAvailableIfFollowSuit,
    getCardsToDisplay,
    playCard,
    cardEqual,
    playerEqual,
    playerLocation,
    getDisplayWidth,
    getDisplayHeight
  };
};

export default useCardState;
