import { Card, DEBUG_ENABLED, TableLocation } from '@/app/lib/euchre/definitions/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import clsx from 'clsx';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { RefObject } from 'react';
import { EuchreGameState, EuchrePlayer } from '../../../lib/euchre/definitions/game-state-definitions';
import GameDeck from '../game/game-deck';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { EuchreGameFlow } from '../../../hooks/euchre/reducers/gameFlowReducer';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  player: EuchrePlayer;
  state: EuchreGameState;
  cardStates: CardState[];
  playedCard: Card | null;
  playerTableRef: RefObject<HTMLDivElement | null> | undefined;
  playerDeckRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  onDealComplete: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: () => void;
}

export default function PlayerGameDeck({
  player,
  state,
  cardStates,
  playedCard,
  playerTableRef,
  playerDeckRefs,
  onCardPlayed,
  onDealComplete,
  onTrickComplete,
  onPassDeal,
  ...rest
}: Props) {
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const location = player.location;
  const position = location === 'top' || location === 'bottom' ? positionCenter : positionSide;

  let playerInfoOuterClass = '';
  let playerInfoInnerClass = '';
  let playerHandClass = '';

  switch (location) {
    case 'bottom':
      playerInfoOuterClass = 'lg:w-auto lg:right-8';
      playerInfoInnerClass = 'lg:relative lg:-right-4 lg:left-0 lg:bottom-0 lg:min-w-32 right-0 bottom-0 ';
      playerHandClass = 'grow flex relative justify-center h-full';
      break;
    case 'top':
      playerInfoOuterClass = 'lg:w-auto lg:right-16';
      playerInfoInnerClass =
        'lg:relative lg:-right-4 lg:left-0 lg:bottom-0 lg:top-auto lg:min-w-32 -right-16 top-0 ';
      playerHandClass = 'grow flex relative justify-center h-full';
      break;
    case 'left':
      playerInfoInnerClass = 'lg:top-[-50px] lg:left-0 lg:min-w-32 -top-16';
      playerHandClass = 'flex flex-col grow relative justify-center h-full';
      break;
    case 'right':
      playerInfoInnerClass = 'lg:top-[-50px] lg:right-0 lg:min-w-32 -top-16 right-0';
      playerHandClass = 'flex flex-col grow relative justify-center items-end h-full';
      break;
  }

  return (
    <>
      <div className={playerHandClass} {...rest}>
        <PlayerHand
          state={state}
          player={player}
          playedCard={playedCard}
          onCardPlayed={onCardPlayed}
          onTrickComplete={onTrickComplete}
          onPassDeal={onPassDeal}
          onDealComplete={() => null}
          playerCenterTableRef={playerTableRef}
          playerDeckRefs={playerDeckRefs}
        />
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': DEBUG_ENABLED })}
        >
          X
        </div>
        {/* <div
          ref={deckRef}
         
          className={clsx(positionInner, { 'text-transparent': !DEBUG_ENABLED })}
        >
          X
        </div> */}
      </div>
    </>
  );
}
