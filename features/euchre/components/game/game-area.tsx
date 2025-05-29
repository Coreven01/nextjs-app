import GameMenu from './game-menu';
import GameTable from './game-table';
import { NotificationState } from '@/features/euchre/state/reducers/playerNotificationReducer';
import PlayerArea from '../player/player-area';
import clsx from 'clsx';
import useTableRefs from '../../hooks/common/useTableRefs';
import PlayerCardArea from '../player/player-card-area';
import { useRef } from 'react';
import { GameMenuValues, GamePlayContext } from '../../definitions/game-state-definitions';
import { Card } from '../../definitions/definitions';
import { InitDealResult } from '../../definitions/logic-definitions';
import { GameTableElements } from '../../definitions/transform-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  gameContext: GamePlayContext;
  playerNotification: NotificationState;
  playedCard: Card | null;
  initDealer: InitDealResult | null;
  menuValues: GameMenuValues;
}

const GameArea = ({
  gameContext,
  playerNotification,
  playedCard,
  initDealer,
  className,
  menuValues,
  ...rest
}: Props) => {
  const { state } = gameContext;

  /** Elements associated with the player's center. Used when playing a card to the center of the table. */
  const centerTableRefs = useTableRefs();
  const centerHorizontalRef = useRef<HTMLDivElement>(null);
  const centerVerticalRef = useRef<HTMLDivElement>(null);
  const gameTableRef = useRef<HTMLDivElement>(null);

  /** Elements associated with the player's outer side. Used when dealing cards to a player. */
  const outerTableRefs = useTableRefs();

  const tableElements: GameTableElements = {
    centerTableRefs,
    outerTableRefs,
    centerHorizontalRef,
    centerVerticalRef,
    gameTableRef
  };

  return (
    <div
      className={clsx(
        `h-full grid grid-flow-col grid-rows-[minmax(40px,auto)_minmax(50px,1fr)_minmax(50px,65px)] grid-cols-[minmax(50px,auto)_minmax(60%,80%)_minmax(50px,auto)] lg:grid-rows-[120px,1fr,120px] lg:grid-cols-[120px_minmax(60%,600px)_120px]`,
        className
      )}
      {...rest}
    >
      <GameMenu menuValues={menuValues} />
      <div className="col-start-2 row-start-2 col-span-1 row-span-1">
        <GameTable
          id="game-table"
          ref={gameTableRef}
          state={state}
          playerNotification={playerNotification}
          tableElements={tableElements}
        />
      </div>
      <PlayerArea
        id="player-area"
        state={state}
        className="col-start-1 row-start-1 col-span-3 row-span-3 overflow-hidden"
      />
      <PlayerCardArea
        id="player-card-area"
        key={state.euchreGame.gameId}
        gameContext={gameContext}
        playedCard={playedCard}
        initDealResult={initDealer}
        tableElements={tableElements}
        className="relative col-start-1 row-start-1 col-span-3 row-span-3 overflow-hidden"
      />
    </div>
  );
};

export default GameArea;
