import { PlayerNotificationState } from '@/app/hooks/euchre/reducers/playerNotificationReducer';
import GameBorder from './game-border';
import WoodenBoard from '../common/wooden-board';
import clsx from 'clsx';
import { RefObject, useEffect, useMemo, useRef } from 'react';
import GameFlippedCard from './game-flipped-card';
import { TableLocation } from '../../../lib/euchre/definitions/definitions';
import { EuchreGameState } from '../../../lib/euchre/definitions/game-state-definitions';
import GameTrumpIndicator from './game-trump-indicator';
import { getCardFullName, getEncodedCardSvg } from '../../../lib/euchre/util/cardSvgDataUtil';
import { GAME_STATES_FOR_BID } from '../../../lib/euchre/util/gameStateLogicUtil';
import { DEFAULT_SPRING_VAL } from '../../../lib/euchre/definitions/transform-definitions';
import { v4 as uuidv4 } from 'uuid';
import { useAnimation } from 'framer-motion';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameState;
  playerNotification: PlayerNotificationState;
  playerCenterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  playerOuterTableRefs: Map<TableLocation, RefObject<HTMLDivElement | null>>;
  directCenterHRef: RefObject<HTMLDivElement | null>;
  directCenterVRef: RefObject<HTMLDivElement | null>;
}

const GameTable = ({
  state,
  playerNotification,
  playerCenterTableRefs,
  playerOuterTableRefs,
  directCenterHRef,
  directCenterVRef,
  ...rest
}: Props) => {
  const flippedUp = useRef(false);
  const controls = useAnimation();
  const { euchreGame: game, euchreGameFlow: gameFlow } = { ...state };
  const hidePosition = !state.euchreSettings.debugShowPositionElements;
  const renderOrder = [
    playerNotification.topGameInfo,
    playerNotification.leftGameInfo,
    playerNotification.centerGameInfo,
    playerNotification.rightGameInfo,
    playerNotification.bottomGameInfo
  ];

  const gameBidding = game.maker === null && GAME_STATES_FOR_BID.includes(gameFlow.gameFlow);
  const gamePlay = game.maker !== null;

  useEffect(() => {
    const flipCardAnimation = async () => {
      if (!flippedUp && gameBidding && !gameFlow.hasFirstBiddingPassed) {
        await controls.start({
          ...DEFAULT_SPRING_VAL,
          rotateY: 0,
          transition: { rotateY: { duration: 0.75 } }
        });
      } else {
        await controls.start({
          ...DEFAULT_SPRING_VAL,
          rotateY: 180,
          transition: { rotateY: { duration: 0.75 } }
        });
      }
    };

    flipCardAnimation();
  });

  // const cardState: CardState = useMemo(
  //   () => ({
  //     src: getEncodedCardSvg(game.trump, 'top'),
  //     cardFullName: gameBidding ? getCardFullName(game.trump) : 'Turned Down',
  //     cardIndex: 0,
  //     controls: controls,
  //     initSpringValue: {
  //       ...DEFAULT_SPRING_VAL,
  //       opacity: 1,
  //       rotateY: 180,
  //       transition: { rotateY: { duration: 0 } }
  //     },
  //     animateValues: [],
  //     enabled: false,
  //     renderKey: uuidv4()
  //   }),
  //   [controls, game.trump, gameBidding]
  // );

  return (
    <GameBorder innerClass="bg-yellow-800 relative" className="h-full shadow-md shadow-black">
      <WoodenBoard className="absolute h-full w-full top-0 left-0 overflow-hidden" rows={25} />
      <div
        className="h-full grid grid-flow-col grid-rows-[minmax(25px,1fr)_50px_minmax(25px,1fr)] grid-cols-[33%,33%,33%] lg:grid-rows-[150px,150px,150px] lg:grid-cols-[1fr,175px,1fr] gap-1 text-white"
        {...rest}
      >
        <div id="player2-region" className="col-span-1 col-start-2 relative flex justify-center items-center">
          <div
            ref={playerOuterTableRefs.get('top')}
            id={`game-base-2`}
            className={clsx(`absolute top-0`, { 'text-transparent': hidePosition })}
          >
            T-2
          </div>
          <div
            ref={playerCenterTableRefs.get('top')}
            id={`game-base-2-center`}
            className={clsx(`absolute bottom-0`, { 'text-transparent': hidePosition })}
          >
            C-2
          </div>
          {renderOrder[0]}
        </div>
        <div
          id="player3-region"
          className="col-span-1 col-start-1 row-start-2 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get('left')}
            id={`game-base-3`}
            className={clsx(`absolute left-0`, { 'text-transparent': hidePosition })}
          >
            T-3
          </div>
          <div
            ref={playerCenterTableRefs.get('left')}
            id={`game-base-3-center`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': hidePosition })}
          >
            C-3
          </div>
          {renderOrder[1]}
        </div>
        <div
          id="game-info"
          className="col-span-1 col-start-2 row-start-2 relative flex justify-center items-center"
        >
          {/* <GameFlippedCard cardState={cardState} card={game.trump} key={game.handId} visible={gameBidding} /> */}
          {gamePlay && (
            <GameTrumpIndicator
              notificationSpeed={state.euchreSettings.notificationSpeed}
              trumpSuit={game.trump.suit}
            />
          )}
          {renderOrder[2]}
        </div>
        <div
          id={`game-center-horizontal`}
          ref={directCenterHRef}
          className={clsx(
            `absolute top-1/2 w-full text-center col-start-1 col-span-3 row-start-2 row-span-1`,
            {
              'text-transparent': hidePosition
            }
          )}
        >
          C-H
        </div>
        <div
          id={`game-center-vertical`}
          ref={directCenterVRef}
          className={clsx(
            `absolute left-1/2 h-full text-center col-start-2 col-span-1 row-start-2 row-span-3`,
            {
              'text-transparent': hidePosition
            }
          )}
        >
          C-V
        </div>
        <div
          id="player4-region"
          className="col-span-1 col-start-3 row-start-2 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get('right')}
            id={`game-base-4`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': hidePosition })}
          >
            T-4
          </div>
          <div
            ref={playerCenterTableRefs.get('right')}
            id={`game-base-4-center`}
            className={clsx(`absolute top-auto left-0`, { 'text-transparent': hidePosition })}
          >
            C-4
          </div>
          {renderOrder[3]}
        </div>
        <div
          id="player1-region"
          className="col-span-1 col-start-2 row-start-3 relative flex justify-center items-center"
        >
          <div
            ref={playerOuterTableRefs.get('bottom')}
            id={`game-base-1`}
            className={clsx(`absolute bottom-0`, { 'text-transparent': hidePosition })}
          >
            T-1
          </div>
          <div
            ref={playerCenterTableRefs.get('bottom')}
            id={`game-base-1-center`}
            className={clsx(`absolute top-0`, { 'text-transparent': hidePosition })}
          >
            C-1
          </div>
          {renderOrder[4]}
        </div>
      </div>
    </GameBorder>
  );
};

export default GameTable;
