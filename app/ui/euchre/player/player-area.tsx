import clsx from 'clsx';
import React, { RefObject, useRef } from 'react';
import PlayerGameDeck from './players-game-deck';
import { Card, EuchreGameInstance, EuchrePlayer, EuchreSettings } from '../../../lib/euchre/definitions';
import { EuchreGameFlowState } from '../../../hooks/euchre/reducers/gameFlowReducer';
import usePlayerData from '../../../hooks/euchre/data/usePlayerData';
import { EuchreAnimationState } from '../../../hooks/euchre/reducers/gameAnimationFlowReducer';
import useGameData from '../../../hooks/euchre/data/useGameData';

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
  onInitDeal: () => void;
  onRegularDeal: () => void;
  onCardPlayed: (card: Card) => void;
  onTrickComplete: () => void;
  onPassDeal: () => void;
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
  onInitDeal,
  onRegularDeal,
  onCardPlayed,
  onTrickComplete,
  onPassDeal,
  className,
  ...rest
}: DivProps) => {
  const player1DeckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player2DeckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player3DeckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const player4DeckRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const playersDeckRef = new Map<number, RefObject<HTMLDivElement>>([
    [1, player1DeckRef],
    [2, player2DeckRef],
    [3, player3DeckRef],
    [4, player4DeckRef]
  ]);

  const { playerEqual } = usePlayerData();
  const { playerSittingOut } = useGameData();
  const sittingOutPlayer: EuchrePlayer | null = playerSittingOut(game);
  const cardCountDuringPlay: number = sittingOutPlayer ? 3 : 4;

  const playersInitDealFinished = useRef<Set<number>>(new Set<number>());
  /** Map of trick id to the card values that were played for that trick. */
  const cardsPlayedForTrick = useRef<Map<string, Set<string>>>(new Map<string, Set<string>>());

  const handleInitComplete = (playerNumber: number) => {
    console.log('[handleInitComplete]');
    if (playersInitDealFinished.current.values().toArray().length === 4) return;

    playersInitDealFinished.current.add(playerNumber);

    if (playersInitDealFinished.current.values().toArray().length === 4) {
      onInitDeal();
    }
  };

  const handleTrickFinished = (card: Card) => {
    console.log('[handleTrickFinished]');

    const trickId = game.currentTrick.trickId;
    const cardVals = cardsPlayedForTrick.current.get(trickId) ?? new Set<string>();

    if (cardVals.values.length === cardCountDuringPlay) {
      return;
    }

    cardVals.add(`${card.value}-${card.suit}`);
    cardsPlayedForTrick.current.set(trickId, cardVals);

    if (game.currentTrick.playerRenege) {
      let counter = 0;
      // end the hand if player reneged. add values to the collection, to trigger the trick complete event.
      while (cardVals.values().toArray().length < cardCountDuringPlay) {
        cardVals.add(`${counter++}-R`);
      }
    }

    if (cardVals.values().toArray().length === cardCountDuringPlay) {
      onTrickComplete();
    }
  };

  return (
    <div
      className={clsx(
        'w-full h-full overflow-hidden grid lg:grid-rows-[1fr,150px,1fr] lg:grid-cols-[1fr,150px,1fr] grid-rows-[50px_minmax(50px,100%)_50px]',
        className
      )}
      {...rest}
    >
      <div className="relative row-start-3 col-start-1 col-span-3 row-span-1 flex items-end">
        <PlayerGameDeck
          id="player1-game-deck"
          playerTableRef={player1TableRef}
          playersDeckRef={playersDeckRef}
          deckRef={player1DeckRef}
          player={game.player1}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardPlayed={onCardPlayed}
          onInitDeal={() => handleInitComplete(game.player1.playerNumber)}
          onRegularDeal={onRegularDeal}
          onTrickComplete={handleTrickFinished}
          onPassDeal={onPassDeal}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player1) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-1 col-span-3 row-span-1 flex items-start">
        <PlayerGameDeck
          id="player2-game-deck"
          playerTableRef={player2TableRef}
          playersDeckRef={playersDeckRef}
          deckRef={player2DeckRef}
          player={game.player2}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardPlayed={onCardPlayed}
          onInitDeal={() => handleInitComplete(game.player2.playerNumber)}
          onRegularDeal={onRegularDeal}
          onTrickComplete={handleTrickFinished}
          onPassDeal={onPassDeal}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player2) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-1 row-span-3 col-span-1 flex items-center">
        <PlayerGameDeck
          id="player3-game-deck"
          playerTableRef={player3TableRef}
          playersDeckRef={playersDeckRef}
          deckRef={player3DeckRef}
          player={game.player3}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardPlayed={onCardPlayed}
          onInitDeal={() => handleInitComplete(game.player3.playerNumber)}
          onRegularDeal={onRegularDeal}
          onTrickComplete={handleTrickFinished}
          onPassDeal={onPassDeal}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player3) ? playedCard : null}
        />
      </div>
      <div className="row-start-1 col-start-3 row-span-3 flex items-center">
        <PlayerGameDeck
          id="player4-game-deck"
          playerTableRef={player4TableRef}
          playersDeckRef={playersDeckRef}
          deckRef={player4DeckRef}
          player={game.player4}
          game={game}
          gameFlow={gameFlow}
          gameSettings={gameSettings}
          gameAnimation={gameAnimation}
          onCardPlayed={onCardPlayed}
          onInitDeal={() => handleInitComplete(game.player4.playerNumber)}
          onRegularDeal={onRegularDeal}
          onTrickComplete={handleTrickFinished}
          onPassDeal={onPassDeal}
          dealDeck={game.deck}
          playedCard={playedCard && playerEqual(game.currentPlayer, game.player4) ? playedCard : null}
        />
      </div>
    </div>
  );
};

export default PlayerArea;
