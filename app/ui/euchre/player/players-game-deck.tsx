import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import { EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import clsx from 'clsx';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { RefObject, useRef } from 'react';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
//import { env } from 'node:process';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  dealDeck: Card[];
  playedCard: Card | null;
  playerTableRef: RefObject<HTMLDivElement>;
  deckRef: RefObject<HTMLDivElement>;
  playersDeckRef: Map<number, RefObject<HTMLDivElement>>;
  onInitDeal: () => void;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: () => void;
}

export default function PlayerGameDeck({
  player,
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  dealDeck,
  playedCard,
  playerTableRef,
  deckRef,
  playersDeckRef,
  onCardPlayed,
  onInitDeal,
  onRegularDeal,
  onTrickComplete,
  onPassDeal,
  ...rest
}: Props) {
  const { playerLocation } = usePlayerData();
  const isDebugMode = true; //env.REACT_APP_DEBUG === 'true';
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const positionCenterInner = `absolute ${playerNumber === 1 ? 'bottom-0' : 'top-0'}`;
  const positionSideInner = `absolute ${playerNumber === 3 ? 'left-0' : 'right-0'}`;
  const location = playerLocation(player);
  const position = location === 'center' ? positionCenter : positionSide;
  const positionInner = location === 'center' ? positionCenterInner : positionSideInner;

  let playerInfoOuterClass = '';
  let playerInfoInnerClass = '';
  let playerHandClass = '';

  switch (player.playerNumber) {
    case 1:
      playerInfoOuterClass = 'lg:w-auto lg:right-8';
      playerInfoInnerClass = 'lg:relative lg:-right-4 lg:left-0 lg:bottom-0 lg:min-w-32 right-0 bottom-0 ';
      playerHandClass = 'grow flex relative justify-center';
      break;
    case 2:
      playerInfoOuterClass = 'lg:w-auto lg:right-16';
      playerInfoInnerClass =
        'lg:relative lg:-right-4 lg:left-0 lg:bottom-0 lg:top-auto lg:min-w-32 -right-16 top-0 ';
      playerHandClass = 'grow flex relative justify-center';
      break;
    case 3:
      playerInfoInnerClass = 'lg:top-[-50px] lg:left-0 lg:min-w-32 -top-16';
      playerHandClass = 'flex flex-col grow relative justify-center h-full';
      break;
    case 4:
      playerInfoInnerClass = 'lg:top-[-50px] lg:right-0 lg:min-w-32 -top-16 right-0';
      playerHandClass = 'flex flex-col grow relative justify-center items-end h-full';
      break;
  }

  const playerInfo = gameFlow.hasGameStarted && player.hand.length > 0 && (
    <div className={clsx('relative lg:text-sm text-xs whitespace-nowrap z-40', playerInfoOuterClass)}>
      <div className={clsx('absolute', playerInfoInnerClass)}>
        <PlayerInfo
          id={`player-info-${player.playerNumber}`}
          game={game}
          player={player}
          settings={gameSettings}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className={playerHandClass} {...rest}>
        <PlayerHand
          game={game}
          gameSettings={gameSettings}
          gameFlow={gameFlow}
          gameAnimation={gameAnimation}
          player={player}
          playedCard={playedCard}
          onCardPlayed={onCardPlayed}
          onInitDeal={onInitDeal}
          onRegularDeal={onRegularDeal}
          onTrickComplete={onTrickComplete}
          onPassDeal={onPassDeal}
          deckRef={deckRef}
          playerTableRef={playerTableRef}
          playersDeckRef={playersDeckRef}
        />
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': !isDebugMode })}
        >
          X
        </div>
        <div
          ref={deckRef}
          id={`player-deck-${playerNumber}`}
          className={clsx(positionInner, { 'text-transparent': !isDebugMode })}
        >
          X
        </div>
        {playerInfo}
      </div>
    </>
  );
}
