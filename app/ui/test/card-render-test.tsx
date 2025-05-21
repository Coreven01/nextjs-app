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
import { getEncodedCardSvg } from '../../lib/euchre/util/cardSvgDataUtil';
import {
  Card,
  RESPONSE_CARD_CENTER,
  RESPONSE_CARD_SIDE,
  TableLocation
} from '../../lib/euchre/definitions/definitions';
import { CardBaseState } from '../../lib/euchre/definitions/game-state-definitions';
import clsx from 'clsx';
import { getCardShadowSrc } from '../../lib/euchre/util/cardDataUtil';
import { CardAnimationControls } from '../../lib/euchre/definitions/transform-definitions';

const CardRenderTest = () => {
  const [toggleAnimation, setToggleAnimation] = useState(false);
  const runAnimationRef = useRef(false);

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
  const ctrl1: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 1,
      controls: animationControl1,
      flipControl: flipControl1,
      initSpringValue: { x: 0, y: 10 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl1, flipControl1]
  );

  const ctrl2: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 2,
      controls: animationControl2,
      flipControl: flipControl2,
      initSpringValue: { x: cardSpace * 1, y: 5 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl2, flipControl2]
  );

  const ctrl3: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 3,
      controls: animationControl3,
      flipControl: flipControl3,
      initSpringValue: { x: cardSpace * 2, y: 0 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl3, flipControl3]
  );

  const ctrl4: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 4,
      flipControl: flipControl4,
      controls: animationControl4,
      initSpringValue: { x: cardSpace * 3, y: 5 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl4, flipControl4]
  );

  const ctrl5: CardAnimationControls = useMemo(
    () => ({
      cardIndex: 5,
      controls: animationControl5,
      flipControl: flipControl5,
      initSpringValue: { x: cardSpace * 4, y: 10 },
      animateSprings: [],
      initFlipSpring: { rotateY: 180, rotateX: 0 }
    }),
    [animationControl5, flipControl5]
  );

  // const flipctrl1: CardAnimationControls = useMemo(
  //   () => ({
  //     cardIndex: 1,
  //     controls: flipControl1,
  //     initSpringValue: { x: 0, y: 0, rotateY: 180 },
  //     animateValues: []
  //   }),
  //   [flipControl1]
  // );

  // const flipctrl2: CardAnimationControls = {
  //   cardIndex: 2,
  //   controls: flipControl2,
  //   initSpringValue: { x: 0, y: 0, rotateY: 180 },
  //   animateValues: []
  // };

  // const flipctrl3: CardAnimationControls = {
  //   cardIndex: 3,
  //   controls: flipControl3,
  //   initSpringValue: { x: 0, y: 0, rotateY: 180 },
  //   animateValues: []
  // };
  // const flipctrl4: CardAnimationControls = {
  //   cardIndex: 4,
  //   controls: flipControl4,
  //   initSpringValue: { x: 0, y: 0, rotateY: 180 },
  //   animateValues: []
  // };
  // const flipctrl5: CardAnimationControls = {
  //   cardIndex: 5,
  //   controls: flipControl5,
  //   initSpringValue: { x: 0, y: 0, rotateY: 180 },
  //   animateValues: []
  // };

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
    src: getEncodedCardSvg(card1, 'bottom')
  };
  const state2: CardBaseState = {
    renderKey: '2',
    enabled: false,
    cardIndex: 2,
    cardFullName: 'card2',
    src: getEncodedCardSvg(card2, 'bottom')
  };
  const state3: CardBaseState = {
    renderKey: '3',
    enabled: false,
    cardIndex: 3,
    cardFullName: 'card3',
    src: getEncodedCardSvg(card3, 'bottom')
  };
  const state4: CardBaseState = {
    renderKey: '4',
    enabled: false,
    cardIndex: 4,
    cardFullName: 'card4',
    src: getEncodedCardSvg(card4, 'bottom')
  };
  const state5: CardBaseState = {
    renderKey: '5',
    enabled: false,
    cardIndex: 5,
    cardFullName: 'card5',
    src: getEncodedCardSvg(card5, 'bottom')
  };

  const cardkeys = [
    { key: 'card1', ref: cardRef1, control: ctrl1, card: card1, state: state1 },
    { key: 'card2', ref: cardRef2, control: ctrl2, card: card2, state: state2 },
    { key: 'card3', ref: cardRef3, control: ctrl3, card: card3, state: state3 },
    { key: 'card4', ref: cardRef4, control: ctrl4, card: card4, state: state4 },
    { key: 'card5', ref: cardRef5, control: ctrl5, card: card5, state: state5 }
  ];

  useEffect(() => {
    const runCardAnimation = async () => {
      while (runAnimationRef.current) {
        const animations: Promise<void>[] = [];
        animations.push(runAnimation(ctrl1));
        animations.push(runFlipAnimation(ctrl1));

        animations.push(runAnimation(ctrl2));
        animations.push(runFlipAnimation(ctrl2));

        animations.push(runAnimation(ctrl3));
        animations.push(runFlipAnimation(ctrl3));

        animations.push(runAnimation(ctrl4));
        animations.push(runFlipAnimation(ctrl4));

        animations.push(runAnimation(ctrl5));
        animations.push(runFlipAnimation(ctrl5));

        await Promise.all(animations);
      }
    };

    runCardAnimation();
  }, [ctrl1, ctrl2, ctrl3, ctrl4, ctrl5, toggleAnimation]);

  const runAnimation = async (control: CardAnimationControls) => {
    if (!control.controls) return;

    const duration: number = Math.random() * 2 + 1;
    const wait: number = Math.random() + 1;
    const val1: TargetAndTransition = {
      ...control.initSpring,
      opacity: 0,
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

  const runFlipAnimation = async (control: CardAnimationControls) => {
    if (!control.flipControl) return;

    const duration: number = Math.random() * 2 + 1;
    const wait: number = Math.random() + 1;
    const val1: TargetAndTransition = {
      ...control.initFlipSpring,
      rotateY: 0,
      transition: { duration: duration }
    };
    const endValue = { ...control.initFlipSpring, transition: { duration: duration } };

    await control.flipControl.start(val1);
    await new Promise((resolve) => setTimeout(resolve, wait));
    await control.flipControl.start(endValue);
    await new Promise((resolve) => setTimeout(resolve, wait));
  };

  const handleAnimate = () => {
    setToggleAnimation((prev) => !prev);
    runAnimationRef.current = !runAnimationRef.current;
  };

  const handleStop = () => {
    animationControl1.stop();
    animationControl2.stop();
    animationControl3.stop();
    animationControl4.stop();
    animationControl5.stop();
  };

  return (
    <div className="m-4 border p-4">
      <div className="flex m-4">
        <div className="grow"></div>
        <div ref={destRef} className="bg-slate-400 w-[100px] h-[150px]"></div>
        {cardkeys.map((v) => {
          return (
            <div key={v.key} className="absolute left-1/2">
              <TestGameCard
                animationControls={v.control}
                location="bottom"
                ref={v.ref}
                width={100}
                height={150}
                cardState={v.state}
              />
            </div>
          );
        })}
      </div>
      <div className="flex justify-center gap-2">
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
            animate={animationControls.flipControl}
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
              src={cardState.src ?? cardBackSrc}
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
