import clsx from 'clsx';
import React, { useEffect, useRef } from 'react';
import useDeckAnimation from '../../hooks/deal/useDeckAnimation';
import GameGrid from '../game/game-grid';
import GameDeck from '../game/game-deck';
import PlayerHand from './player-hand';
import { getPlayerGridLayoutInfo, playerEqual } from '../../util/game/playerDataUtil';
import { getCardClassForPlayerLocation } from '../../util/game/cardDataUtil';
import usePlayerActionState from '../../state/usePlayerActionsState';
import { Card } from '../../definitions/definitions';
import { GamePlayContext } from '../../definitions/game-state-definitions';
import { InitDealResult } from '../../definitions/logic-definitions';
import { GameTableElements } from '../../definitions/transform-definitions';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  gameContext: GamePlayContext;
  playedCard: Card | null;
  initDealResult: InitDealResult | null;
  tableElements: GameTableElements;
}

/** Area for card animation for dealing and player's cards. */
const PlayerCardArea = ({
  gameContext,
  playedCard,
  initDealResult,
  tableElements,
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
    tableElements.outerTableRefs,
    tableElements.centerHorizontalRef.current,
    tableElements.centerVerticalRef.current
  );
  const { euchreGame, euchreSettings } = gameContext.state;
  const currentHandId = useRef(euchreGame.handId);
  const {
    resetStateForNewHand,
    handleDealAnimationComplete,
    handleTrickFinished,
    handleTrumpOrderedComplete,
    handlePassDealAnimationComplete
  } = usePlayerActionState(gameContext);

  const playerLayoutForGrid = getPlayerGridLayoutInfo();

  useEffect(() => {
    if (currentHandId.current !== euchreGame.handId) {
      currentHandId.current = euchreGame.handId;
      resetStateForNewHand();
    }
  }, [euchreGame.handId, resetStateForNewHand]);

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
        const centerTableRef = tableElements.centerTableRefs.get(player.location);
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
                centerHorizontalRef={tableElements.centerHorizontalRef}
                centerVerticalRef={tableElements.centerVerticalRef}
                onTrickComplete={handleTrickFinished}
                onDealPassed={handlePassDealAnimationComplete}
                onDealComplete={handleDealAnimationComplete}
                onTrumpOrderedComplete={handleTrumpOrderedComplete}
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
          deckState={deckState}
          deckCardRefs={deckCardRefs}
          cardStates={cardStates}
          animationControls={animationControls}
          controls={deckAnimationControls}
          showPosition={false}
          onFirstRender={handleRefChange}
        />
      )}
    </GameGrid>
  );
};

export default PlayerCardArea;
