import { Card, DEBUG_ENABLED } from '@/app/lib/euchre/definitions/definitions';
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
  showDealForDealerDeck: boolean;
  playedCard: Card | null;
  playerTableRef: RefObject<HTMLDivElement | null> | undefined;
  cardRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerDeckRefs: Map<number, RefObject<HTMLDivElement | null>>;
  onDealForDealer: () => void;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: (card: Card) => void;
  onPassDeal: () => void;
}

export default function PlayerGameDeck({
  player,
  state,
  cardStates,
  showDealForDealerDeck,
  playedCard,
  playerTableRef,
  cardRefs,
  playerDeckRefs,
  onCardPlayed,
  onDealForDealer,
  onRegularDeal,
  onTrickComplete,
  onPassDeal,
  ...rest
}: Props) {
  const { playerLocation } = usePlayerData();

  const deckRef = playerDeckRefs.get(player.playerNumber);
  const playerNumber = player.playerNumber;
  const positionCenter = `absolute ${playerNumber === 1 ? 'top-0' : 'bottom-0'}`;
  const positionSide = `absolute ${playerNumber === 3 ? 'right-0' : 'left-0'}`;
  const positionCenterInner = `absolute ${playerNumber === 1 ? 'bottom-0' : 'top-0'}`;
  const positionSideInner = `absolute ${playerNumber === 3 ? 'left-0' : 'right-0'}`;
  const location = playerLocation(player);
  const position = location === 'center' ? positionCenter : positionSide;
  const positionInner = location === 'center' ? positionCenterInner : positionSideInner;
  const duration = state.euchreSettings.gameSpeed / 1000;
  const initSpringValue = { opacity: 0, y: 100 };
  const initAnimateValue = {
    opacity: 1,
    y: 20,
    transition: {
      opacity: { duration: duration },
      y: { duration: duration }
    }
  };

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

  const playerInfo = state.euchreGameFlow.hasGameStarted && (
    <div className={clsx('relative lg:text-sm text-xs whitespace-nowrap z-40', playerInfoOuterClass)}>
      <div className={clsx('absolute', playerInfoInnerClass)}>
        <PlayerInfo
          id={`player-info-${player.playerNumber}`}
          game={state.euchreGame}
          player={player}
          settings={state.euchreSettings}
        />
      </div>
    </div>
  );

  return (
    <>
      <div className={playerHandClass} {...rest}>
        <PlayerHand
          state={state}
          player={player}
          playedCard={playedCard}
          onCardPlayed={onCardPlayed}
          onRegularDeal={onRegularDeal}
          onTrickComplete={onTrickComplete}
          onPassDeal={onPassDeal}
          playerCenterTableRef={playerTableRef}
          playersDeckRef={playerDeckRefs}
        />
        {showDealForDealerDeck && (
          <GameDeck
            deck={state.euchreGame.deck}
            cardRefs={cardRefs}
            location={location}
            playerNumber={player.playerNumber}
            cardStates={cardStates}
            onDealComplete={onDealForDealer}
            dealType={EuchreGameFlow.BEGIN_DEAL_FOR_DEALER}
            initDeckState={initSpringValue}
            initAnimationState={initAnimateValue}
          ></GameDeck>
        )}
        <div
          id={`player-base-${playerNumber}`}
          className={clsx(position, { 'text-transparent': !DEBUG_ENABLED })}
        >
          X
        </div>
        <div
          ref={deckRef}
          id={`player-deck-${playerNumber}`}
          className={clsx(positionInner, { 'text-transparent': !DEBUG_ENABLED })}
        >
          X
        </div>
        {playerInfo}
      </div>
    </>
  );
}
