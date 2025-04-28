import clsx from 'clsx';
import React, { RefObject, useCallback, useRef } from 'react';
import PlayerGameDeck from './players-game-deck';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import useGameData from '../../../hooks/euchre/data/useGameData';
import {
  EuchreGameValues,
  EuchrePlayer,
  EuchreTrick
} from '../../../lib/euchre/definitions/game-state-definitions';
import { Card } from '../../../lib/euchre/definitions/definitions';
import useHandState from '../../../hooks/euchre/useHandState';
import useTableRef from '../../../hooks/euchre/useTableRefs';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameValues;
  playedCard: Card | null;
  playerCenterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  onDealForDealer: () => void;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: () => void;
  onPassDeal: () => void;
  className: string;
}

const PlayerArea = ({
  state,
  playedCard,
  playerCenterTableRefs,
  playerOuterTableRefs,
  onDealForDealer,
  onRegularDeal,
  onCardPlayed,
  onTrickComplete,
  onPassDeal,
  className,
  ...rest
}: DivProps) => {
  /** Elements associated with a player's area, outside of the table. */
  const playerDeckRefs = useTableRef(4);

  const { cardRefs, showDealForDealerDeck, cardStates } = useHandState(
    state,
    playerDeckRefs,
    playerOuterTableRefs,
    onDealForDealer,
    onRegularDeal
  );
  const { playerEqual } = usePlayerData();
  const { playerSittingOut } = useGameData();
  const dealForDealerCardCount = useRef(0);

  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(state.euchreGame);
  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;

  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  /** Set of trick id's where the event handler was executed to finish the trick. */
  const tricksFinished = useRef<Set<string>>(new Set<string>());

  const handleDealForDealer = () => {
    dealForDealerCardCount.current += 1;
    console.log('deal for dealer card count ', dealForDealerCardCount.current);
  };

  const handleInitComplete = (playerNumber: number) => {
    console.log('[handleInitComplete] - player-area.tsx');
    if (playersInitDealFinished.current.values().toArray().length === 4) return;

    playersInitDealFinished.current.add(playerNumber);

    if (playersInitDealFinished.current.values().toArray().length === 4) {
      onDealForDealer();
    }
  };

  const handleTrickFinished = useCallback(
    (card: Card) => {
      console.log('[handleTrickFinished] - player-area.tsx');

      const trick: EuchreTrick | undefined = state.euchreGame.currentTrick;
      const trickFinished = tricksFinished.current.has(trick.trickId);

      if (trickFinished) return;

      const cardVals = cardsPlayedForTrick.current.get(trick.trickId) ?? new Set<string>();

      cardVals.add(`${card.value}-${card.suit}`);
      cardsPlayedForTrick.current.set(trick.trickId, cardVals);

      if (trick.playerRenege || cardVals.values().toArray().length === cardCountDuringPlay) {
        tricksFinished.current.add(trick.trickId);
        onTrickComplete();
      }
    },
    [cardCountDuringPlay, onTrickComplete, state.euchreGame.currentTrick]
  );

  // array of values for each player's deck area.
  const playerRenderInfo = [
    {
      id: 'player1-game-deck',
      className: 'relative row-start-3 col-start-1 col-span-3 row-span-1 flex items-end',
      tableRef: playerCenterTableRefs.get(1),
      player: state.euchreGame.player1
    },
    {
      id: 'player2-game-deck',
      className: 'row-start-1 col-start-1 col-span-3 row-span-1 flex items-start',
      tableRef: playerCenterTableRefs.get(2),
      player: state.euchreGame.player2
    },
    {
      id: 'player3-game-deck',
      className: 'row-start-1 col-start-1 row-span-3 col-span-1 flex items-center',
      tableRef: playerCenterTableRefs.get(3),
      player: state.euchreGame.player3
    },
    {
      id: 'player4-game-deck',
      className: 'row-start-1 col-start-3 row-span-3 flex items-center',
      tableRef: playerCenterTableRefs.get(4),
      player: state.euchreGame.player4
    }
  ];
  return (
    <div
      className={clsx(
        'w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr] grid-rows-[50px_minmax(50px,100%)_50px]',
        className
      )}
      {...rest}
    >
      {playerRenderInfo.map((info) => {
        return (
          <div className={info.className} key={info.id}>
            <PlayerGameDeck
              id={info.id}
              playerTableRef={info.tableRef}
              playerDeckRefs={playerDeckRefs}
              cardRefs={cardRefs}
              player={info.player}
              state={state}
              cardStates={cardStates}
              onDealForDealer={handleDealForDealer}
              onRegularDeal={onRegularDeal}
              onCardPlayed={onCardPlayed}
              onTrickComplete={handleTrickFinished}
              onPassDeal={onPassDeal}
              showDealForDealerDeck={
                showDealForDealerDeck && playerEqual(state.euchreGame.dealer, info.player)
              }
              playedCard={
                playedCard && playerEqual(state.euchreGame.currentPlayer, info.player) ? playedCard : null
              }
            />
          </div>
        );
      })}
    </div>
  );
};

export default PlayerArea;
