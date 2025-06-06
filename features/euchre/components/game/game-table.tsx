import { NotificationState } from '@/features/euchre/state/reducers/playerNotificationReducer';
import GameBorder from './game-border';
import WoodenBoard from '../common/wooden-board';
import clsx from 'clsx';
import { forwardRef, PropsWithoutRef, useEffect, useMemo, useRef } from 'react';
import GameFlippedCard from './game-flipped-card';
import GameTrumpIndicator from './game-trump-indicator';
import { getCardFullName } from '../../util/game/cardSvgDataUtil';
import { GAME_STATES_FOR_BID, GAME_STATES_INIT_GAMEPLAY } from '../../util/game/gameStateLogicUtil';
import { v4 as uuidv4 } from 'uuid';
import { useAnimation } from 'framer-motion';
import {
  createCardAnimationState,
  getDurationSeconds,
  getSpringToMoveToPlayer
} from '../../util/play/cardTransformUtil';
import { EuchreGameFlow } from '../../state/reducers/gameFlowReducer';
import { EuchrePauseType } from '../../state/reducers/gamePauseReducer';
import { EuchreGameState, CardBaseState } from '../../definitions/game-state-definitions';
import { GameTableElements, CardAnimationControls } from '../../definitions/transform-definitions';
import { playerSittingOut } from '../../util/game/gameDataUtil';
import { playerEqual } from '../../util/game/playerDataUtil';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  state: EuchreGameState;
  playerNotification: NotificationState;
  tableElements: GameTableElements;
}

const GameTable = forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
  ({ state, playerNotification, tableElements, ...rest }: Props, ref) => {
    const flippedCardRef = useRef<HTMLDivElement | null>(null);
    const cardControl = useAnimation();
    const flipControl = useAnimation();
    const duration = getDurationSeconds(state.euchreSettings.gameSpeed);

    const {
      euchreGame: game,
      euchreGameFlow: gameFlow,
      euchrePauseState: pauseState,
      euchreSettings
    } = { ...state };

    const animationControl: CardAnimationControls = {
      cardIndex: 0,
      controls: cardControl,
      flipControls: flipControl,
      initSpring: { x: 0, y: 0 },
      initFlipSpring: { rotateY: 180, rotateX: 0 },
      animateSprings: [],
      animateFlipSprings: []
    };

    const renderOrder = [
      playerNotification.topGameInfo,
      playerNotification.leftGameInfo,
      playerNotification.centerGameInfo,
      playerNotification.rightGameInfo,
      playerNotification.bottomGameInfo
    ];

    const getGameTableState = () => {
      const firstRound = !gameFlow.hasFirstBiddingPassed;
      const gameBidding = !game.maker && GAME_STATES_FOR_BID.includes(gameFlow.gameFlow);
      const trumpOrdered =
        gameFlow.gameFlow === EuchreGameFlow.BEGIN_ORDER_TRUMP ||
        gameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP;
      const animatePickUp =
        firstRound &&
        gameFlow.gameFlow === EuchreGameFlow.END_ORDER_TRUMP &&
        pauseState.pauseType === EuchrePauseType.ANIMATE;
      const dealPassed =
        gameFlow.gameFlow === EuchreGameFlow.BEGIN_PASS_DEAL ||
        gameFlow.gameFlow === EuchreGameFlow.END_PASS_DEAL;
      const handFinished =
        game.handResults.find((h) => h.roundNumber === game.currentRound)?.teamWon !== undefined;
      const sittingOut = playerSittingOut(game);
      const dealerSittingOut = sittingOut && playerEqual(game.dealer, sittingOut);
      const initGamplay = GAME_STATES_INIT_GAMEPLAY.includes(gameFlow.gameFlow);
      return {
        hidePosition: !state.euchreSettings.debugShowPositionElements,
        animatePickUp: animatePickUp,
        trumpOrdered: trumpOrdered,
        gameBidding: gameBidding,
        showFaceUp: ((gameBidding || trumpOrdered) && firstRound) || animatePickUp,
        showTrumpIndicator: game.maker && !initGamplay && !handFinished && !trumpOrdered,
        flippedCardVisible: !dealPassed && (gameBidding || trumpOrdered),
        dealerSittingOut
      };
    };

    const {
      showFaceUp,
      animatePickUp,
      trumpOrdered,
      hidePosition,
      showTrumpIndicator,
      flippedCardVisible,
      gameBidding,
      dealerSittingOut
    } = getGameTableState();

    useEffect(() => {
      const flipCardAnimation = async () => {
        if (showFaceUp) {
          await flipControl.start({
            rotateY: 0,
            transition: { rotateY: { delay: duration, duration: duration } }
          });
        } else {
          await flipControl.start({
            rotateY: 180,
            transition: { rotateY: { duration: duration } }
          });
        }
      };

      flipCardAnimation();
    });

    useEffect(() => {
      const handleAnimatePickup = async () => {
        if (animatePickUp && trumpOrdered && !dealerSittingOut) {
          const dealerLocation = game.dealer.location;
          const destinationElement = tableElements.outerTableRefs.get(dealerLocation)?.current;
          const sourceElement = flippedCardRef.current;

          if (!destinationElement) throw new Error();
          if (!sourceElement) throw new Error();

          const moveSpring = getSpringToMoveToPlayer(
            { sourceElement, destinationElement, gameSpeed: euchreSettings.gameSpeed },
            0,
            createCardAnimationState(0),
            { cardIndex: 0, animateSprings: [], controls: cardControl, flipControls: undefined },
            true,
            'none'
          );

          await cardControl.start(moveSpring.animateSprings[0]);
        }
      };

      handleAnimatePickup();
    }, [
      animatePickUp,
      cardControl,
      dealerSittingOut,
      euchreSettings.gameSpeed,
      game.dealer.location,
      tableElements.outerTableRefs,
      trumpOrdered
    ]);

    const cardState: CardBaseState = useMemo(
      () => ({
        valueVisible: true,
        cardFullName: gameBidding ? getCardFullName(game.trump) : 'Turned Down',
        cardIndex: 0,
        enabled: false,
        renderKey: uuidv4()
      }),
      [game.trump, gameBidding]
    );

    // logConsole('set variable animate pickup: ', animatePickUp);
    return (
      <GameBorder innerClass="bg-yellow-800 relative" className="h-full shadow-md shadow-black">
        <WoodenBoard className="absolute h-full w-full top-0 left-0 overflow-hidden" rows={25} />
        <div
          ref={ref}
          className="h-full grid grid-flow-col grid-rows-[minmax(25px,1fr)_50px_minmax(25px,1fr)] grid-cols-[33%,33%,33%] lg:grid-rows-[150px,150px,150px] lg:grid-cols-[1fr,175px,1fr] gap-1 text-white overflow-hidden"
          {...rest}
        >
          <div
            id="player2-region"
            className="col-span-1 col-start-2 relative flex justify-center items-center"
          >
            <div
              ref={tableElements.outerTableRefs.get('top')}
              id={`game-base-2`}
              className={clsx(`absolute top-0`, { 'text-transparent': hidePosition })}
            >
              T-2
            </div>
            <div
              ref={tableElements.centerTableRefs.get('top')}
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
              ref={tableElements.outerTableRefs.get('left')}
              id={`game-base-3`}
              className={clsx(`absolute left-0`, { 'text-transparent': hidePosition })}
            >
              T-3
            </div>
            <div
              ref={tableElements.centerTableRefs.get('left')}
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
            <GameFlippedCard
              ref={flippedCardRef}
              animationControl={animationControl}
              cardState={cardState}
              card={game.trump}
              key={game.handId}
              visible={flippedCardVisible}
            />
            {showTrumpIndicator && (
              <GameTrumpIndicator
                notificationSpeed={state.euchreSettings.notificationSpeed}
                trumpSuit={game.trump.suit}
              />
            )}
            {renderOrder[2]}
          </div>
          <div
            id={`game-center-horizontal`}
            ref={tableElements.centerHorizontalRef}
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
            ref={tableElements.centerVerticalRef}
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
              ref={tableElements.outerTableRefs.get('right')}
              id={`game-base-4`}
              className={clsx(`absolute top-auto right-0`, { 'text-transparent': hidePosition })}
            >
              T-4
            </div>
            <div
              ref={tableElements.centerTableRefs.get('right')}
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
              ref={tableElements.outerTableRefs.get('bottom')}
              id={`game-base-1`}
              className={clsx(`absolute bottom-0`, { 'text-transparent': hidePosition })}
            >
              T-1
            </div>
            <div
              ref={tableElements.centerTableRefs.get('bottom')}
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
  }
);

GameTable.displayName = 'GameTable';

export default GameTable;
