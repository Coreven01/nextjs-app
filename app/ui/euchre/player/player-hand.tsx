import { RefObject, useEffect, useRef } from 'react';
import GameCard from '../game/game-card';
import clsx from 'clsx';
import { EuchrePlayer, GamePlayContext } from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import { getCardClassForPlayerLocation } from '../../../lib/euchre/util/cardDataUtil';
import { logConsole, logError } from '../../../lib/euchre/util/util';
import { incrementSpeed } from '../../../lib/euchre/util/gameDataUtil';
import useCardAnimation from '../../../hooks/euchre/effects/play/useCardAnimation';

type Props = {
  gameContext: GamePlayContext;
  player: EuchrePlayer;

  /** Card to played without user interaction. Used for auto play. */
  playedCard: Card | null;
  playerCenterTableRef: RefObject<HTMLDivElement | null> | undefined;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;

  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: (card: Card) => void;
  onDealComplete: (playerNumber: number) => void;
};

const PlayerHand = ({
  gameContext,
  player,
  playedCard,
  playerCenterTableRef,
  playerDeckRefs,
  directCenterHRef,
  directCenterVRef,
  onCardPlayed,
  onTrickComplete,
  onPassDeal,
  onDealComplete
}: Props) => {
  //#region Hooks

  const {
    playerCardsVisible,
    cardRefs,
    handState,
    cardStates,
    cardsAnimationControls,
    getCardsToDisplay,
    handlePlayCardAnimation,
    updateCardStateForTurn,
    setRefsReady
  } = useCardAnimation(
    gameContext,
    player,
    directCenterHRef,
    directCenterVRef,
    playerDeckRefs,
    onTrickComplete,
    onPassDeal,
    onCardPlayed,
    onDealComplete
  );
  const { euchreGame, euchreSettings } = gameContext.state;

  /** Map of trick ID to the associated card (index) that was played for that trick.*/
  const cardIndicesPlayed = useRef<Map<string, number>>(new Map<string, number>());
  /** Used to prevent clicking cards in rapid succession */
  const isCardClickHandled = useRef(false);

  /** Notify card animation hook that cards have been rendered and refs should be set. */
  useEffect(() => {
    const localSetRefsReady = setRefsReady;

    if (playerCardsVisible && localSetRefsReady) localSetRefsReady(true);

    return () => {
      if (localSetRefsReady) localSetRefsReady(false);
    };
  }, [playerCardsVisible, setRefsReady]);

  /** Animate the card being played. Once animation for the card is complete, the state should be updated that the player
   * played a card.
   */
  useEffect(() => {
    if (playedCard && !cardIndicesPlayed.current.has(euchreGame.currentTrick.trickId)) {
      cardIndicesPlayed.current.set(euchreGame.currentTrick.trickId, playedCard.index);
      logConsole('[PLAYERHAND] [useEffect] [handlePlayCardAnimation], auto played card: ', playedCard);

      const tableRef = playerCenterTableRef?.current;

      if (!tableRef)
        logError(
          '[PLAYERHAND] [useEffect] [handlePlayCardAnimation] - Invalid table ref. Card animation was not handled.'
        );
      else {
        handlePlayCardAnimation(playedCard.index, tableRef);
      }
    }
  }, [handlePlayCardAnimation, playedCard, playerCenterTableRef, euchreGame.currentTrick.trickId]);
  //#endregion

  const playerCurrentHand: Card[] = getCardsToDisplay();
  const location = player.location;

  const handleCardClick = (cardIndex: number) => {
    logConsole(
      '[PLAYERHAND] [handleCardClick] - player: ',
      player.name,
      ' trick ids played: ',
      cardIndicesPlayed.current
    );

    if (!isCardClickHandled.current && !cardIndicesPlayed.current.has(euchreGame.currentTrick.trickId)) {
      isCardClickHandled.current = true;
      cardIndicesPlayed.current.set(euchreGame.currentTrick.trickId, cardIndex);

      const delay = incrementSpeed(euchreSettings.gameSpeed, 1);
      const tableRef = playerCenterTableRef?.current;

      updateCardStateForTurn(false);

      if (!tableRef) {
        logError(
          '[PLAYERHAND] [useEffect] [handleCardClick] - Invalid table ref. Card animation was not handled.'
        );
        return;
      }

      // release lock so the next card can be handled.
      setTimeout(() => {
        isCardClickHandled.current = false;
      }, delay);

      handlePlayCardAnimation(cardIndex, tableRef);
    }
  };

  logConsole(
    '*** [PLAYERHAND] [RENDER] player: ',
    player.name,
    ' player hand: ',
    playerCurrentHand
    // ' card states',
    // cardStates,
    // ' card refs: ',
    // cardRefs,
    // ' animation controls: ',
    // animationControls
  );

  return (
    <>
      {playerCardsVisible &&
        handState &&
        playerCurrentHand.map((card) => {
          const keyval = `${player.playerNumber}-${card.index}`;
          const cardState = cardStates.find((s) => s.cardIndex === card.index);
          const animationControl = cardsAnimationControls[card.index];
          const cardRef = cardRefs.get(card.index);

          return cardState && cardRef ? (
            <GameCard
              key={keyval}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location))}
              location={location}
              card={card}
              cardState={cardState}
              animationControls={animationControl}
              ref={cardRef}
              width={handState.width}
              height={handState.height}
              responsive={true}
              onCardClick={cardState.enabled ? handleCardClick : undefined}
            />
          ) : (
            <div>Invalid card state or card ref.</div>
          );
        })}
    </>
  );
};

export default PlayerHand;
