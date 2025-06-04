'use client';
import Image from 'next/image';
import { motion, TargetAndTransition, useAnimation } from 'framer-motion';
import {
  CSSProperties,
  forwardRef,
  memo,
  PropsWithoutRef,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import clsx from 'clsx';
import { getCardShadowSrc } from '../../../features/euchre/util/game/cardDataUtil';
import {
  Card,
  TableLocation,
  RESPONSE_CARD_SIDE,
  RESPONSE_CARD_CENTER
} from '../../../features/euchre/definitions/definitions';
import { CardBaseState } from '../../../features/euchre/definitions/game-state-definitions';
import {
  CardAnimationControls,
  CardAnimationState,
  SpringContext,
  ZTransition
} from '../../../features/euchre/definitions/transform-definitions';
import {
  createCardAnimationState,
  getSpringMoveElement,
  getSpringToMoveToPlayer
} from '../../../features/euchre/util/play/cardTransformUtil';
import GameCard from '../../../features/euchre/components/game/game-card';
import zIndex from '@mui/material/styles/zIndex';

const CardRenderTest = () => {
  const [toggleAnimation, setToggleAnimation] = useState(false);
  const [toggleDeal, setToggleDeal] = useState(false);

  const runAnimationRef = useRef(false);
  const runDealAnimationRef = useRef(false);

  const destRef = useRef<HTMLDivElement>(null);
  const cardRef1 = useRef<HTMLDivElement>(null);
  const cardRef2 = useRef<HTMLDivElement>(null);
  const cardRef3 = useRef<HTMLDivElement>(null);
  const cardRef4 = useRef<HTMLDivElement>(null);
  const cardRef5 = useRef<HTMLDivElement>(null);

  const animationControl1 = useAnimation();
  const animationControl2 = useAnimation();
  const animationControl3 = useAnimation();
  const animationControl4 = useAnimation();
  const animationControl5 = useAnimation();

  const flipControl1 = useAnimation();
  const flipControl2 = useAnimation();
  const flipControl3 = useAnimation();
  const flipControl4 = useAnimation();
  const flipControl5 = useAnimation();

  const cardSpace = 50;
  const ctrl1: CardAnimationControls = useMemo<CardAnimationControls>(
    () => ({
      cardIndex: 1,
      controls: animationControl1,
      flipControls: flipControl1,
      initSpring: { x: 0, y: 10 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl1, flipControl1]
  );

  const ctrl2: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 2,
      controls: animationControl2,
      flipControls: flipControl2,
      initSpring: { x: cardSpace * 1, y: 5 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl2, flipControl2]
  );

  const ctrl3: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 3,
      controls: animationControl3,
      flipControls: flipControl3,
      initSpring: { x: cardSpace * 2, y: 0 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl3, flipControl3]
  );

  const ctrl4: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 4,
      flipControls: flipControl4,
      controls: animationControl4,
      initSpring: { x: cardSpace * 3, y: 5 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl4, flipControl4]
  );

  const ctrl5: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 5,
      controls: animationControl5,
      flipControls: flipControl5,
      initSpring: { x: cardSpace * 4, y: 10 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl5, flipControl5]
  );

  const animationState1: CardAnimationState = useMemo(() => createCardAnimationState(0), []);
  const animationState2: CardAnimationState = useMemo(() => createCardAnimationState(0), []);
  const animationState3: CardAnimationState = useMemo(() => createCardAnimationState(0), []);
  const animationState4: CardAnimationState = useMemo(() => createCardAnimationState(0), []);
  const animationState5: CardAnimationState = useMemo(() => createCardAnimationState(0), []);

  const card1: Card = { value: '10', suit: '♠', index: 1 };
  const card2: Card = { value: 'J', suit: '♠', index: 2 };
  const card3: Card = { value: 'Q', suit: '♣', index: 3 };
  const card4: Card = { value: 'K', suit: '♦', index: 4 };
  const card5: Card = { value: 'A', suit: '♥', index: 5 };

  const state1: CardBaseState = {
    renderKey: '1',
    enabled: false,
    cardIndex: 1,
    cardFullName: 'card1',
    valueVisible: true
  };
  const state2: CardBaseState = {
    renderKey: '2',
    enabled: false,
    cardIndex: 2,
    cardFullName: 'card2',
    valueVisible: true
  };
  const state3: CardBaseState = {
    renderKey: '3',
    enabled: false,
    cardIndex: 3,
    cardFullName: 'card3',
    valueVisible: true
  };
  const state4: CardBaseState = {
    renderKey: '4',
    enabled: false,
    cardIndex: 4,
    cardFullName: 'card4',
    valueVisible: true
  };
  const state5: CardBaseState = {
    renderKey: '5',
    enabled: false,
    cardIndex: 5,
    cardFullName: 'card5',
    valueVisible: true
  };

  const cardkeys = [
    {
      key: 'card1',
      ref: cardRef1,
      control: ctrl1,
      card: card1,
      state: state1,
      zTransition: { startZ: 34, endZ: 30, delayMs: 0.5 }
    },
    {
      key: 'card2',
      ref: cardRef2,
      control: ctrl2,
      card: card2,
      state: state2,
      zTransition: { startZ: 33, endZ: 31, delayMs: 0.5 }
    },
    {
      key: 'card3',
      ref: cardRef3,
      control: ctrl3,
      card: card3,
      state: state3,
      zTransition: { startZ: 32, endZ: 32, delayMs: 0.5 }
    },
    {
      key: 'card4',
      ref: cardRef4,
      control: ctrl4,
      card: card4,
      state: state4,
      zTransition: { startZ: 31, endZ: 33, delayMs: 0.5 }
    },
    {
      key: 'card5',
      ref: cardRef5,
      control: ctrl5,
      card: card5,
      state: state5,
      zTransition: { startZ: 30, endZ: 34, delayMs: 0.5 }
    }
  ];

  useEffect(() => {
    const runCardAnimation = async () => {
      if (!destRef.current) return;
      if (!cardRef1.current) return;
      if (!cardRef2.current) return;
      if (!cardRef3.current) return;
      if (!cardRef4.current) return;
      if (!cardRef5.current) return;

      const springContext1: SpringContext = {
        sourceElement: cardRef1.current,
        destinationElement: destRef.current
      };
      const springContext2: SpringContext = {
        sourceElement: cardRef2.current,
        destinationElement: destRef.current
      };
      const springContext3: SpringContext = {
        sourceElement: cardRef3.current,
        destinationElement: destRef.current
      };
      const springContext4: SpringContext = {
        sourceElement: cardRef4.current,
        destinationElement: destRef.current
      };
      const springContext5: SpringContext = {
        sourceElement: cardRef5.current,
        destinationElement: destRef.current
      };

      while (runAnimationRef.current) {
        const animations: Promise<void>[] = [];
        animations.push(new Promise((resolve) => setTimeout(resolve, 25)));
        animations.push(runMoveTo(springContext1, ctrl1));
        animations.push(runAnimation(ctrl1));
        // animations.push(runFlipAnimation(ctrl1));

        animations.push(runMoveTo(springContext2, ctrl2));
        animations.push(runAnimation(ctrl2));
        // animations.push(runFlipAnimation(ctrl2));

        animations.push(runMoveTo(springContext3, ctrl3));
        animations.push(runAnimation(ctrl3));
        // animations.push(runFlipAnimation(ctrl3));

        animations.push(runMoveTo(springContext4, ctrl4));
        animations.push(runAnimation(ctrl4));
        // animations.push(runFlipAnimation(ctrl4));

        animations.push(runMoveTo(springContext5, ctrl5));
        animations.push(runAnimation(ctrl5));
        // animations.push(runFlipAnimation(ctrl5));

        await Promise.all(animations);
      }
    };

    runCardAnimation();
  }, [ctrl1, ctrl2, ctrl3, ctrl4, ctrl5, toggleAnimation]);

  useEffect(() => {
    const runDealCardAnimation = async () => {
      if (!destRef.current) return;
      if (!cardRef1.current) return;
      if (!cardRef2.current) return;
      if (!cardRef3.current) return;
      if (!cardRef4.current) return;
      if (!cardRef5.current) return;

      const springContext1: SpringContext = {
        sourceElement: cardRef1.current,
        destinationElement: destRef.current
      };
      const springContext2: SpringContext = {
        sourceElement: cardRef2.current,
        destinationElement: destRef.current
      };
      const springContext3: SpringContext = {
        sourceElement: cardRef3.current,
        destinationElement: destRef.current
      };
      const springContext4: SpringContext = {
        sourceElement: cardRef4.current,
        destinationElement: destRef.current
      };
      const springContext5: SpringContext = {
        sourceElement: cardRef5.current,
        destinationElement: destRef.current
      };

      while (runDealAnimationRef.current) {
        await runDealTo(springContext1, ctrl1, { endZ: 30, delayMs: 500 });
        await runDealTo(springContext2, ctrl2, { endZ: 31, delayMs: 500 });
        await runDealTo(springContext3, ctrl3, { endZ: 32, delayMs: 500 });
        await runDealTo(springContext4, ctrl4, { endZ: 33, delayMs: 500 });
        await runDealTo(springContext5, ctrl5, { endZ: 34, delayMs: 500 });

        await runReset(ctrl1);
        await runReset(ctrl2);
        await runReset(ctrl3);
        await runReset(ctrl4);
        await runReset(ctrl5);

        await new Promise((resolve) => setTimeout(resolve, 2000));
      }
    };

    runDealCardAnimation();
  }, [ctrl1, ctrl2, ctrl3, ctrl4, ctrl5, toggleDeal]);

  const runMoveTo = async (springContext: SpringContext, cardAnimation: CardAnimationControls) => {
    if (!cardAnimation.flipControls) return;
    if (!cardAnimation.controls) return;

    const moveFlipAnimation: Promise<void>[] = [];
    const duration: number = Math.random() * 2 + 1;
    const flipDuration: number = Math.random() * 2 + 1;
    const wait: number = Math.random() + 1;
    const moveSpring = getSpringMoveElement(springContext, false);
    const flipFaceDown = (Math.round(Math.random() * 2) - 1) % 2 === 0;

    if (moveSpring) {
      const val1: TargetAndTransition = {
        ...moveSpring,
        transition: { duration: duration + flipDuration }
      };

      moveFlipAnimation.push(cardAnimation.controls.start(val1));
      moveFlipAnimation.push(
        cardAnimation.flipControls.start({
          rotateY: flipFaceDown ? 180 : 0,
          transition: { delay: duration, duration: flipDuration }
        })
      );

      await Promise.all(moveFlipAnimation);

      await new Promise((resolve) => setTimeout(resolve, wait));
    }

    await new Promise((resolve) => setTimeout(resolve, wait));
    // await control.controls.start(endValue);
    // await new Promise((resolve) => setTimeout(resolve, wait));
  };

  const runDealTo = async (
    springContext: SpringContext,
    cardAnimation: CardAnimationControls,
    zTransition: ZTransition
  ) => {
    if (!cardAnimation.flipControls) return;
    if (!cardAnimation.controls) return;

    const moveFlipAnimation: Promise<void>[] = [];
    const duration: number = 1.5;
    const flipDuration: number = 0.5;
    const wait: number = Math.random() + 1;
    const moveSpring = getSpringMoveElement(springContext, false);

    if (moveSpring) {
      const val1: TargetAndTransition = {
        ...moveSpring,
        rotate: 180 + Math.round(Math.random() * 90),
        transition: { duration: duration + flipDuration }
      };

      moveFlipAnimation.push(cardAnimation.controls.start(val1));
      moveFlipAnimation.push(
        cardAnimation.flipControls.start({
          rotateY: 0,
          transition: { delay: duration, duration: flipDuration }
        })
      );

      const startZIndexDelay = async () => {
        await new Promise((resolve) => setTimeout(resolve, zTransition.delayMs));
        springContext.sourceElement.style.zIndex = String(zTransition.endZ);
      };
      moveFlipAnimation.push(startZIndexDelay());

      await Promise.all(moveFlipAnimation);
      await new Promise((resolve) => setTimeout(resolve, wait));
    }
    await new Promise((resolve) => setTimeout(resolve, wait));
  };

  const runAnimation = async (control: CardAnimationControls) => {
    if (!control.controls) return;

    const duration: number = Math.random() * 2 + 1;
    const wait: number = Math.random() + 1;
    const val1: TargetAndTransition = {
      ...control.initSpring,
      opacity: 0.25,
      rotate: 180,
      transition: { duration: duration }
    };
    const endValue = {
      ...control.initSpring,
      opacity: 1,
      rotate: 0,
      transition: { duration: duration }
    };

    await control.controls.start(val1);
    await new Promise((resolve) => setTimeout(resolve, wait));
    await control.controls.start(endValue);
    await new Promise((resolve) => setTimeout(resolve, wait));
  };

  const runReset = async (control: CardAnimationControls) => {
    if (!control.flipControls) return;
    if (!control.controls) return;
    if (!control.initSpring) return;

    await control.controls.start({ ...control.initSpring, rotate: 0, transition: { duration: 0.25 } });
    await control.flipControls.start({ rotateY: 180, transition: { duration: 0.25 } });
  };
  // const runFlipAnimation = async (control: CardAnimationControls) => {
  //   if (!control.flipControls) return;

  //   const duration: number = Math.random() * 2 + 1;
  //   const wait: number = Math.random() + 1;
  //   const val1: TargetAndTransition = {
  //     ...control.initFlipSpring,
  //     rotateY: 0,
  //     transition: { duration: duration }
  //   };
  //   const endValue = { ...control.initFlipSpring, transition: { duration: duration } };

  //   await control.flipControls.start(val1);
  //   await new Promise((resolve) => setTimeout(resolve, wait));
  //   await control.flipControls.start(endValue);
  //   await new Promise((resolve) => setTimeout(resolve, wait));
  // };

  const handleAnimate = () => {
    setToggleAnimation((prev) => !prev);
    runAnimationRef.current = !runAnimationRef.current;
  };

  const handleRunDeal = () => {
    setToggleDeal((prev) => !prev);
    runDealAnimationRef.current = !runDealAnimationRef.current;
  };

  const handleStop = () => {
    animationControl1.stop();
    animationControl2.stop();
    animationControl3.stop();
    animationControl4.stop();
    animationControl5.stop();
    runAnimationRef.current = false;
    runDealAnimationRef.current = false;
  };

  return (
    <div className="m-4 border p-4 max-w-5xl">
      <div className="flex m-4 relative">
        <div className="grow"></div>
        <div ref={destRef} className="bg-slate-400 w-[100px] h-[150px]">
          DESTINATION
        </div>
        {cardkeys.map((v) => {
          return (
            <GameCard
              key={v.key}
              className="absolute left-0"
              renderKey={v.key}
              animationControls={v.control}
              location="bottom"
              ref={v.ref}
              width={107}
              height={150}
              cardState={v.state}
              card={v.card}
              zTransition={v.zTransition}
              responsive
            />
          );
        })}
      </div>
      <div className="flex justify-center gap-2">
        <motion.button onClick={handleRunDeal} className="p-2 bg-white text-black">
          Run Deal
        </motion.button>
        <motion.button onClick={handleAnimate} className="p-2 bg-white text-black">
          Start
        </motion.button>
        <motion.button onClick={handleStop} className="p-2 bg-white text-black">
          Stop
        </motion.button>
      </div>
    </div>
  );
};

export default CardRenderTest;

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  cardState: CardBaseState;
  animationControls: CardAnimationControls;
  width: number;
  height: number;
  location: TableLocation;
  responsive?: boolean;
  hideBackFace?: boolean;
  /** */
  onCardClick?: (cardIndex: number) => void;
}

const TestGameCard = memo(
  forwardRef<HTMLDivElement, PropsWithoutRef<Props>>(
    (
      {
        id,
        cardState,
        animationControls,
        width,
        height,
        className,
        location,
        responsive,
        hideBackFace = true,
        onCardClick
      }: Props,
      ref
    ) => {
      /** Used to prevent the same animation event handler from running more than once for a particular action. */
      //const actionsRun = useRef<EuchreGameFlow[]>([]);
      const sideLocation = location === 'left' || location === 'right';
      const useHoverEffect: boolean = onCardClick !== undefined && cardState.enabled;
      const cssValues: CSSProperties = { backfaceVisibility: hideBackFace ? 'hidden' : 'visible' };
      const tempTarget: TargetAndTransition = {};
      const cardBackSrc = sideLocation ? '/card-back-side.svg' : '/card-back.svg';
      if (responsive) {
        cssValues.width = '100%';
        cssValues.height = '100%';
      } else {
        cssValues.width = width;
        cssValues.height = height;
        cssValues.maxHeight = height;
        cssValues.maxWidth = width;
      }

      return (
        <motion.div
          style={{ perspective: 1000 }}
          className={clsx(
            'pointer-events-none overflow-visible',
            sideLocation ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER,
            className
          )}
          title={cardState.cardFullName}
          id={id}
          ref={ref}
          initial={animationControls.initSpring}
          animate={animationControls.controls}
          draggable={false}
        >
          <motion.div
            initial={{ ...tempTarget, ...animationControls.initFlipSpring }}
            animate={animationControls.flipControls}
            style={{ transformStyle: 'preserve-3d' }}
          >
            <Image
              className={clsx(`relative`, getShadowOffsetForPlayer(location))}
              quality={50}
              width={width}
              height={height}
              src={getCardShadowSrc(location)}
              alt={'card shadow'}
              style={{ ...cssValues, backfaceVisibility: 'visible' }}
              draggable={false}
            />
            <Image
              className={clsx(
                'absolute top-0 left-0 pointer-events-auto',
                { 'cursor-not-allowed': !useHoverEffect },
                {
                  'cursor-pointer hover:scale-110 hover:-translate-y-2 transition duration-300':
                    useHoverEffect
                }
              )}
              quality={100}
              width={width}
              height={height}
              src={cardBackSrc}
              alt={cardState.cardFullName}
              unoptimized={true}
              style={{
                ...cssValues,
                backfaceVisibility: 'visible'
              }}
              draggable={false}
            />
            <Image
              className={clsx('absolute top-0 left-0')}
              quality={100}
              width={width}
              height={height}
              src={cardBackSrc}
              alt={'Card back'}
              unoptimized={true}
              style={{
                ...cssValues,
                transform: sideLocation ? 'rotateX(180deg)' : 'rotateY(180deg)'
              }}
              draggable={false}
            />
          </motion.div>
        </motion.div>
      );
    }
  ),
  (prevProps, nextProps) => {
    return prevProps.cardState.renderKey === nextProps.cardState.renderKey;
  }
);

const getShadowOffsetForPlayer = (sideLocation: TableLocation): string => {
  switch (sideLocation) {
    case 'bottom':
      return 'top-2 left-2';
    case 'top':
      return '-top-2 left-2';
    case 'left':
      return 'top-2 -left-2';
    case 'right':
      return 'top-2 -right-2';
  }
};

TestGameCard.displayName = 'TestGameCard';
