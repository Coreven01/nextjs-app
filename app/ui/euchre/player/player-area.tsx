import clsx from 'clsx';
import React, { RefObject } from 'react';
import PlayerGameDeck from './players-game-deck';
import { Card, EuchreGameInstance, EuchreSettings } from '../../../lib/euchre/definitions';
import { EuchreGameFlowState } from '../../../hooks/euchre/gameFlowReducer';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  gameInstance: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  gameSettings: EuchreSettings;
  playedCard: Card | null;
  player1TableRef: RefObject<HTMLDivElement>;
  player2TableRef: RefObject<HTMLDivElement>;
  player3TableRef: RefObject<HTMLDivElement>;
  player4TableRef: RefObject<HTMLDivElement>;
  onCardPlayed: (card: Card) => void;
  className: string;
}

const PlayerArea = ({
  gameInstance,
  gameFlow,
  gameSettings,
  playedCard,
  player1TableRef,
  player2TableRef,
  player3TableRef,
  player4TableRef,
  onCardPlayed,
  className,
  ...rest
}: DivProps) => {
  const { playerEqual } = usePlayerData();

  return (
    <div
      className={clsx(
        'w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr]',
        className
      )}
      {...rest}
    >
      <div className="row-start-3 col-start-1 col-span-3 row-span-1 flex items-end">
        <PlayerGameDeck
          playerTableRef={player1TableRef}
          player={gameInstance.player1}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
          playedCard={
            playedCard && playerEqual(gameInstance.currentPlayer, gameInstance.player1) ? playedCard : null
          }
        />
      </div>
      {/* <div className="row-start-1 col-start-1 col-span-3 md:flex invisible">
        <PlayerGameDeck
          playerTableRef={player2TableRef}
          player={gameInstance.player2}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
          playedCard={
            playedCard && playerEqual(gameInstance.currentPlayer, gameInstance.player2) ? playedCard : null
          }
        />
      </div>
      <div className="row-start-1 col-start-1 row-span-3 relative invisible">
        <PlayerGameDeck
          playerTableRef={player3TableRef}
          player={gameInstance.player3}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
          playedCard={
            playedCard && playerEqual(gameInstance.currentPlayer, gameInstance.player3) ? playedCard : null
          }
        />
      </div>
      <div className="row-start-1 col-start-3 row-span-3 relative invisible">
        <PlayerGameDeck
          playerTableRef={player4TableRef}
          player={gameInstance.player4}
          game={gameInstance}
          gameFlow={gameFlow}
          settings={gameSettings}
          onCardClick={onCardPlayed}
          dealDeck={gameInstance.deck}
          playedCard={
            playedCard && playerEqual(gameInstance.currentPlayer, gameInstance.player4) ? playedCard : null
          }
        />
      </div> */}
    </div>
  );
};

export default PlayerArea;
