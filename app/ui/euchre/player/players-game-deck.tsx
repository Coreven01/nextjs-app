import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import PlayerHand from './player-hand';
import PlayerInfo from './player-info';
import { EuchreGameFlowState } from '@/app/hooks/euchre/reducers/gameFlowReducer';
import clsx from 'clsx';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { RefObject, useRef } from 'react';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
//import { env } from 'node:process';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  dealDeck: Card[];
  playedCard: Card | null;
  playerTableRef: RefObject<HTMLDivElement>;
  onCardClick: (card: Card) => void;
  onBeginComplete: () => void;
};

export default function PlayerGameDeck({
  player,
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  dealDeck,
  playedCard,
  playerTableRef,
  onCardClick,
  onBeginComplete
}: Props) {
  const deckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const { playerLocation } = usePlayerData();
  const isDebugMode = false; //env.REACT_APP_DEBUG === 'true';
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const location = playerLocation(player);
  const position = location === 'center' ? positionCenter : positionSide;

  let playerInfoOuterClass = '';
  let playerInfoInnerClass = '';
  let playerHandClass = '';

  switch (player.playerNumber) {
    case 1:
      playerInfoOuterClass = 'md:w-auto md:right-8';
      playerInfoInnerClass = 'md:relative md:-right-4 md:left-0 md:bottom-0 right-16 bottom-4 md:min-w-32';
      playerHandClass = 'grow flex relative justify-center';
      break;
    case 2:
      playerInfoOuterClass = 'md:w-auto md:right-16';
      playerInfoInnerClass = 'md:relative md:-right-4 md:left-0 md:bottom-0 right-16 -bottom-8 md:min-w-32';
      playerHandClass = 'grow flex relative justify-center';
      break;
    case 3:
      playerInfoInnerClass = 'md:top-[-100px] md:left-0 md:min-w-32';
      playerHandClass = 'flex flex-col grow relative justify-center h-full';
      break;
    case 4:
      playerInfoInnerClass = 'md:top-[-100px] md:right-0 md:min-w-32';
      playerHandClass = 'flex flex-col grow relative justify-center items-end h-full';
      break;
  }

  const playerInfo = gameFlow.hasGameStarted && player.hand.length > 0 && (
    <div className={clsx('relative md:text-sm text-xs whitespace-nowrap z-20', playerInfoOuterClass)}>
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
      <div id={`player-hand-${player.playerNumber}`} className={playerHandClass}>
        <PlayerHand
          game={game}
          gameSettings={gameSettings}
          gameFlow={gameFlow}
          gameAnimation={gameAnimation}
          player={player}
          playedCard={playedCard}
          onCardClick={onCardClick}
          onBeginComplete={onBeginComplete}
          deckRef={deckRef}
          playerTableRef={playerTableRef}
        />
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': !isDebugMode })}
        >
          X
        </div>
        {playerInfo}
      </div>
    </>
  );
}
