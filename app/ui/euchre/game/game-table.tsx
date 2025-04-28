import { PlayerNotificationState } from '@/app/hooks/euchre/reducers/playerNotificationReducer';
import GameBorder from './game-border';
import WoodenBoard from '../common/wooden-board';
import clsx from 'clsx';
import { RefObject } from 'react';
import GameFlippedCard from './game-flipped-card';
import { DEBUG_ENABLED } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '../../../hooks/euchre/reducers/gameFlowReducer';
import useCardSvgData from '../../../hooks/euchre/data/useCardSvgData';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { DEFAULT_SPRING_VAL } from '../../../hooks/euchre/data/useCardTransform';
import { EuchreGameInstance } from '../../../lib/euchre/definitions/game-state-definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  playerNotification: PlayerNotificationState;
  playerCenterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<number, RefObject<HTMLDivElement | null>>;
}

const GameTable = ({
  game,
  gameFlow,
  playerNotification,
  playerCenterTableRefs,
  playerOuterTableRefs,
  ...rest
}: Props) => {
  const { getEncodedCardSvg, getCardFullName } = useCardSvgData();
  const renderOrder = [
    playerNotification.player2GameInfo,
    playerNotification.player3GameInfo,
    playerNotification.centerGameInfo,
    playerNotification.player4GameInfo,
    playerNotification.player1GameInfo
  ];

  const gameBidding =
    game.maker === null &&
    (gameFlow.gameFlow === EuchreGameFlow.BEGIN_BID_FOR_TRUMP ||
      gameFlow.gameFlow === EuchreGameFlow.END_BID_FOR_TRUMP ||
      gameFlow.gameFlow === EuchreGameFlow.BEGIN_PASS_DEAL ||
      gameFlow.gameFlow === EuchreGameFlow.WAIT ||
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT);

  const cardState: CardState = {
    src: getEncodedCardSvg(game.trump, 'center'),
    cardFullName: gameBidding ? getCardFullName(game.trump) : 'Turned Down',
    cardIndex: 0,
    initSpringValue: {
      ...DEFAULT_SPRING_VAL,
      opacity: 1,
      rotateY: 180,
      transition: { rotateY: { duration: 0 } }
    },
    springValue:
      gameBidding && !gameFlow.hasFirstBiddingPassed
        ? { ...DEFAULT_SPRING_VAL, rotateY: 0, transition: { rotateY: { duration: 0.75 } } }
        : { ...DEFAULT_SPRING_VAL, rotateY: 180, transition: { rotateY: { duration: 0.75 } } },
    enabled: false
  };

  return (
    <GameBorder innerClass="bg-yellow-800 relative" className="h-full shadow-md shadow-black">
      <WoodenBoard className="absolute h-full w-full top-0 left-0 overflow-hidden" rows={25} />
      <div
        className="h-full grid grid-flow-col grid-rows-[minmax(25px,1fr)_50px_minmax(25px,1fr)] grid-cols-[33%,33%,33%] lg:grid-rows-[150px,150px,150px] lg:grid-cols-[1fr,175px,1fr] gap-1 text-black"
        {...rest}
      >
        <div id="player2-region" className="col-span-1 col-start-2 relative flex justify-center items-center">
          <div
            ref={playerOuterTableRefs.get(2)}
            id={`game-base-2`}
            className={clsx(`absolute top-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          <div
            ref={playerCenterTableRefs.get(2)}
            id={`game-base-2-center`}
            className={clsx(`absolute bottom-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          {renderOrder[0]}
        </div>
        <div
          id="player3-region"
          className="col-span-1 col-start-1 row-start-2 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get(3)}
            id={`game-base-3`}
            className={clsx(`absolute left-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          <div
            ref={playerCenterTableRefs.get(3)}
            id={`game-base-3-center`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          {renderOrder[1]}
        </div>
        <div
          id="game-info"
          className="col-span-1 col-start-2 row-start-2 relative flex justify-center items-center"
        >
          <div
            id={`game-center`}
            className={clsx(`absolute top-auto`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          <GameFlippedCard cardState={cardState} card={game.trump} key={game.handId} visible={gameBidding} />
          {renderOrder[2]}
        </div>
        <div
          id="player4-region"
          className="col-span-1 col-start-3 row-start-2 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get(4)}
            id={`game-base-4`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          <div
            ref={playerCenterTableRefs.get(4)}
            id={`game-base-4-center`}
            className={clsx(`absolute top-auto left-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          {renderOrder[3]}
        </div>
        <div
          id="player1-region"
          className="col-span-1 col-start-2 row-start-3 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get(1)}
            id={`game-base-1`}
            className={clsx(`absolute bottom-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          <div
            ref={playerCenterTableRefs.get(1)}
            id={`game-base-1-center`}
            className={clsx(`absolute top-0`, { 'text-transparent': !DEBUG_ENABLED })}
          >
            X
          </div>
          {renderOrder[4]}
        </div>
      </div>
    </GameBorder>
  );
};

export default GameTable;
