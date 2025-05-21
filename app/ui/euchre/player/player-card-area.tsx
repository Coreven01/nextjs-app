import clsx from 'clsx';
import React, { RefObject, useCallback, useEffect, useRef } from 'react';
import {
  EuchrePlayer,
  EuchreTrick,
  GamePlayContext
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card, TableLocation } from '../../../lib/euchre/definitions/definitions';
import useDeckAnimation from '../../../hooks/euchre/effects/deal/useDeckAnimation';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';
import PlayerHand from './player-hand';
import { getPlayerGridLayoutInfo, playerEqual } from '../../../lib/euchre/util/playerDataUtil';
import { playerSittingOut } from '../../../lib/euchre/util/gameDataUtil';
import { logConsole } from '../../../lib/euchre/util/util';
import { getCardClassForPlayerLocation } from '../../../lib/euchre/util/cardDataUtil';
import { InitDealResult } from '../../../lib/euchre/definitions/logic-definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  gameContext: GamePlayContext;
  playedCard: Card | null;
  initDealResult: InitDealResult | null;
  playerCenterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;
  className: string;
}

/** Area for card animation for dealing and player's cards. */
const PlayerCardArea = ({
  gameContext,
  playedCard,
  initDealResult,
  playerCenterTableRefs,
  playerOuterTableRefs,
  directCenterHRef,
  directCenterVRef,
  className,
  ...rest
}: DivProps) => {
  const {
    handleRefChange,
    gameHandVisible,
    gameDeckVisible,
    gameDeckRef,
    playerDeckRefs,
    playerInnerDeckRefs,
    deckCardRefs,
    deckState,
    deckAnimationControls,
    cardStates,
    animationControls
  } = useDeckAnimation(
    gameContext,
    initDealResult,
    playerOuterTableRefs,
    directCenterHRef.current,
    directCenterVRef.current
  );
  const { euchreGame, euchreSettings } = gameContext.state;
  const currentHandId = useRef(euchreGame.handId);
  const playerLayoutForGrid = getPlayerGridLayoutInfo();
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(euchreGame);

  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;
  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  const cardsPassedDeal = useRef<Set<string>>(new Set<string>());

  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  useEffect(() => {
    if (currentHandId.current !== euchreGame.handId) {
      playersInitDealFinished.current.clear();
      cardsPassedDeal.current.clear();
    }
  }, [euchreGame.handId]);

  const handleDealAnimationComplete = useCallback(
    (playerNumber: number) => {
      logConsole('*** [PLAYERCARDAREA] [handleDealAnimationComplete]');
      if (playersInitDealFinished.current.values().toArray().length === 4) return;

      playersInitDealFinished.current.add(playerNumber);

      if (playersInitDealFinished.current.values().toArray().length === 4) {
        gameContext.animationHandlers.onEndRegularDealComplete();
      }
    },
    [gameContext.animationHandlers]
  );

  const handlePassDealAnimationComplete = (card: Card) => {
    logConsole('*** [PLAYERCARDAREA] [handlePassDealAnimationComplete]');
    // if (cardsPassedDeal.current.values().toArray().length === 20) return;

    // cardsPassedDeal.current.add(`${card.value}${card.suit}`);

    // if (cardsPassedDeal.current.values().toArray().length === 20) {
    //   animationHandlers.onPassDealComplete();
    // }
  };

  const handleCardPlayed = (card: Card) => {
    // animationHandlers.onCardPlayed(card);
  };

  const handleTrickFinished = useCallback(
    (card: Card) => {
      logConsole('*** [PLAYERCARDAREA] [handleTrickFinished]');

      const trick: EuchreTrick | undefined = euchreGame.currentTrick;
      const trickFinished = tricksFinished.current.has(trick.trickId);

      if (trickFinished) return;

      const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

      cardVals.add(`${card.value}-${card.suit}`);
      cardsPlayedForTrick.current.set(trick.trickId, cardVals);

      if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
        tricksFinished.current.add(trick.trickId);
        gameContext.animationHandlers.onTrickFinished();
      }
    },
    [cardCountDuringPlay, euchreGame.currentTrick, gameContext.animationHandlers]
  );

  logConsole(
    '*** [PLAYERCARDAREA] [RENDER]',
    ' deck visible: ',
    gameDeckVisible,
    ' hand visible: ',
    gameHandVisible
  );

  return (
    <GameGrid className={className} {...rest}>
      {playerLayoutForGrid.map((info, index) => {
        const player = euchreGame.gamePlayers.find((p) => p.location === info.location);

        if (!player) {
          return (
            <div key={index} className={clsx('relative', info.locationClass)}>
              Player not found for location: {info.location}
            </div>
          );
        }

        const deckRef = playerDeckRefs.get(player.location);
        const innerDeckRef = playerInnerDeckRefs.get(player.location);
        const centerTableRef = playerCenterTableRefs.get(player.location);
        const gameCard = playerEqual(player, euchreGame.currentPlayer) ? playedCard : null;
        const hidePosition = { invisible: !euchreSettings.debugShowPositionElements };

        return (
          <div
            className={clsx('relative', info.locationClass)}
            key={`player${player.playerNumber}-game-deck`}
            id={`player${player.playerNumber}-game-deck`}
          >
            {!centerTableRef && <div>Invalid center table ref for player card area.</div>}
            {gameHandVisible && centerTableRef && (
              <PlayerHand
                gameContext={gameContext}
                player={player}
                playedCard={gameCard}
                playerCenterTableRef={centerTableRef}
                playerDeckRefs={playerDeckRefs}
                directCenterHRef={directCenterHRef}
                directCenterVRef={directCenterVRef}
                onCardPlayed={handleCardPlayed}
                onTrickComplete={handleTrickFinished}
                onPassDeal={handlePassDealAnimationComplete}
                onDealComplete={handleDealAnimationComplete}
              />
            )}
            <div
              ref={deckRef}
              id={`player-deck-${player.playerNumber}`}
              className={clsx('absolute', getCardClassForPlayerLocation(player.location), hidePosition)}
            >
              {`D-${player.playerNumber}`}
            </div>
            <div
              ref={innerDeckRef}
              id={`player-inner-deck-${player.playerNumber}`}
              className={clsx('absolute', info.playerInnerDeckOffsetClass, hidePosition)}
            >
              {`I-${player.playerNumber}`}
            </div>
          </div>
        );
      })}
      {deckState && gameDeckVisible && (
        <GameDeck
          ref={gameDeckRef}
          deck={deckState.deck}
          deckCardRefs={deckCardRefs}
          location={deckState.location}
          playerNumber={deckState.playerNumber}
          cardStates={cardStates}
          animationControls={animationControls}
          initDeckState={deckState.initSpringValue}
          controls={deckAnimationControls}
          width={deckState.width}
          height={deckState.height}
          handId={deckState.handId}
          showPosition={euchreSettings.debugShowPositionElements}
          onFirstRender={handleRefChange}
        />
      )}
    </GameGrid>
  );
};

export default PlayerCardArea;
