import { PlayerNotificationState } from '@/app/hooks/euchre/reducers/playerNotificationReducer';
import GameBorder from './game-border';
import WoodenBoard from '../common/wooden-board';
import clsx from 'clsx';
import { RefObject } from 'react';
import GameFlippedCard from './game-flipped-card';
import { EuchreGameInstance } from '../../../lib/euchre/definitions';
import { EuchreGameFlow, EuchreGameFlowState } from '../../../hooks/euchre/reducers/gameFlowReducer';
import useCardSvgData from '../../../hooks/euchre/data/useCardSvgData';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { DEFAULT_SPRING_VAL } from '../../../hooks/euchre/data/useCardTransform';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  game: EuchreGameInstance;
  gameFlow: EuchreGameFlowState;
  playerNotification: PlayerNotificationState;
  player1TableRef: RefObject<HTMLDivElement>;
  player2TableRef: RefObject<HTMLDivElement>;
  player3TableRef: RefObject<HTMLDivElement>;
  player4TableRef: RefObject<HTMLDivElement>;
}

const GameTable = ({
  game,
  gameFlow,
  playerNotification,
  player1TableRef,
  player2TableRef,
  player3TableRef,
  player4TableRef,
  ...rest
}: Props) => {
  const { getEncodedCardSvg, getCardFullName } = useCardSvgData();
  const isDebugMode = true; // env.REACT_APP_DEBUG === 'true';
  const renderOrder = [
    playerNotification.player2GameInfo,
    playerNotification.player3GameInfo,
    playerNotification.centerGameInfo,
    playerNotification.player4GameInfo,
    playerNotification.player1GameInfo
  ];
  const keyval = `${game.dealPassedCount}-${game.currentRound}`;
  const gameBidding =
    game.maker === null &&
    (gameFlow.gameFlow === EuchreGameFlow.BEGIN_BID_FOR_TRUMP ||
      gameFlow.gameFlow === EuchreGameFlow.END_BID_FOR_TRUMP ||
      gameFlow.gameFlow === EuchreGameFlow.WAIT ||
      gameFlow.gameFlow === EuchreGameFlow.AWAIT_PROMPT);

  const cardState: CardState = {
    src:
      gameBidding && !gameFlow.hasFirstBiddingPassed
        ? getEncodedCardSvg(game.trump, 'center')
        : '/card-back.svg',
    cardFullName: gameBidding ? getCardFullName(game.trump) : 'Turned Down',
    cardIndex: 0,
    initSprungValue: { ...DEFAULT_SPRING_VAL, opacity: 0, rotateY: 180 },
    springValue:
      gameBidding && !gameFlow.hasFirstBiddingPassed
        ? { ...DEFAULT_SPRING_VAL, opacity: 1, rotateY: 0, transition: { rotateY: { duration: 0.5 } } }
        : { ...DEFAULT_SPRING_VAL, opacity: 1, rotateY: 180, transition: { rotateY: { duration: 0.5 } } },
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
          <div id={`game-base-2`} className={clsx(`absolute top-0`, { 'text-transparent': !isDebugMode })}>
            X
          </div>
          <div
            ref={player2TableRef}
            id={`game-base-2-inner`}
            className={clsx(`absolute bottom-0`, { 'text-transparent': !isDebugMode })}
          >
            X
          </div>
          {renderOrder[0]}
        </div>
        <div
          id="player3-region"
          className="col-span-1 col-start-1 row-start-2 relative flex justify-center items-center"
        >
          <div id={`game-base-3`} className={clsx(`absolute left-0`, { 'text-transparent': !isDebugMode })}>
            X
          </div>
          <div
            ref={player3TableRef}
            id={`game-base-3-inner`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': !isDebugMode })}
          >
            X
          </div>
          {renderOrder[1]}
        </div>
        <div
          id="game-info"
          className="col-span-1 col-start-2 row-start-2 relative flex justify-center items-center"
        >
          <div id={`game-center`} className={clsx(`absolute top-auto`, { 'text-transparent': !isDebugMode })}>
            X
          </div>
          {gameFlow.hasGameStarted && gameBidding && (
            <GameFlippedCard cardState={cardState} card={game.trump} key={keyval} />
          )}
          {renderOrder[2]}
        </div>
        <div
          id="player4-region"
          className="col-span-1 col-start-3 row-start-2 relative flex justify-center items-center"
        >
          <div
            id={`game-base-4`}
            className={clsx(`absolute top-auto right-0`, { 'text-transparent': !isDebugMode })}
          >
            X
          </div>
          <div
            ref={player4TableRef}
            id={`game-base-4-inner`}
            className={clsx(`absolute top-auto left-0`, { 'text-transparent': !isDebugMode })}
          >
            X
          </div>
          {renderOrder[3]}
        </div>
        <div
          id="player1-region"
          className="col-span-1 col-start-2 row-start-3 relative flex justify-center items-center"
        >
          <div id={`game-base-1`} className={clsx(`absolute bottom-0`, { 'text-transparent': !isDebugMode })}>
            X
          </div>
          <div
            ref={player1TableRef}
            id={`game-base-1-inner`}
            className={clsx(`absolute top-0`, { 'text-transparent': !isDebugMode })}
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
