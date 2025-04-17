import clsx from 'clsx';
import React, { RefObject, useEffect, useRef, useState } from 'react';
import PlayerGameDeck from './players-game-deck';
import { Card, EuchreGameInstance, EuchreSettings } from '../../../lib/euchre/definitions';
import { EuchreGameFlowState } from '../../../hooks/euchre/reducers/gameFlowReducer';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  gameAnimation: EuchreAnimationState;
  playedCard: Card | null;
  player1TableRef: RefObject<HTMLDivElement>;
  player2TableRef: RefObject<HTMLDivElement>;
  player3TableRef: RefObject<HTMLDivElement>;
  player4TableRef: RefObject<HTMLDivElement>;
  onCardPlayed: (card: Card) => void;
  onBeginComplete: () => void;
  className: string;
}

const PlayerArea = ({
  game,
  gameFlow,
  gameSettings,
  gameAnimation,
  playedCard,
  player1TableRef,
  player2TableRef,
  player3TableRef,
  player4TableRef,
  onCardPlayed,
  onBeginComplete,
  className,
  ...rest
}: DivProps) => {
  const beginComplete = useRef(false);
  const { playerEqual } = usePlayerData();
  const [playersFinished, setPlayersFinished] = useState<number[]>([]);

  const handleBeginComplete = (playerNumber: number) => {
    setPlayersFinished((prev) => [...prev, playerNumber]);
  };

  useEffect(() => {
    if (!beginComplete.current && [1, 2, 3, 4].filter((n) => playersFinished.includes(n)).length === 4) {
      beginComplete.current = true;
      onBeginComplete();
    }
  }, [onBeginComplete, playersFinished]);

  return (
    <div
      className={clsx(
        'w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr]',
        className
      )}
      {...rest}
    >
      <div className="relative row-start-3 col-start-1 col-span-3 row-span-1 flex items-end">
        <PlayerGameDeck
          playerTableRef={player1TableRef}
          player={game.player1}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardClick={onCardPlayed}
          onBeginComplete={() => handleBeginComplete(game.player1.playerNumber)}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player1) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-1 col-span-3 row-span-1 flex items-start">
        <PlayerGameDeck
          playerTableRef={player2TableRef}
          player={game.player2}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardClick={onCardPlayed}
          onBeginComplete={() => handleBeginComplete(game.player2.playerNumber)}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player2) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-1 row-span-3 col-span-1 flex items-center">
        <PlayerGameDeck
          playerTableRef={player3TableRef}
          player={game.player3}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardClick={onCardPlayed}
          onBeginComplete={() => handleBeginComplete(game.player3.playerNumber)}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player3) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-3 row-span-3 flex items-center">
        <PlayerGameDeck
          playerTableRef={player4TableRef}
          player={game.player4}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardClick={onCardPlayed}
          onBeginComplete={() => handleBeginComplete(game.player4.playerNumber)}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player4) ? playedCard : null}
        />
      </div>
    </div>
  );
};

export default PlayerArea;
