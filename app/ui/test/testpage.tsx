'use client';

import { motion, TargetAndTransition } from 'framer-motion';
import Image from 'next/image';
import { useRef, useState } from 'react';
import { getEncodedCardSvg } from '../../lib/euchre/util/cardSvgDataUtil';
import CardRenderTest from './card-render-test';

const TestPage = () => {
  const destRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const [animateVal, setAnimateVal] = useState<TargetAndTransition>();

  const handleAnimate = () => {
    if (!cardRef?.current || !destRef?.current) return;

    const cardRect = cardRef.current.getBoundingClientRect();
    const destRect = destRef.current.getBoundingClientRect();
    const xVal = destRect?.right - cardRect?.right;
    setAnimateVal({
      type: 'spring',
      x: [0, xVal],
      rotate: [0, 180],
      rotateY: [180, 90, 0],
      transition: {
        x: {
          duration: 2,
          ease: 'easeOut',
          repeat: Infinity,
          repeatDelay: 2,
          stiffness: 1000,
          damping: 15
        },
        rotate: {
          duration: 2,
          times: [0, 0.75],
          ease: 'linear',
          repeat: Infinity,
          repeatDelay: 2,
          stiffness: 1000,
          damping: 15
        },
        rotateY: {
          duration: 2,
          times: [0.75, 0.88, 1],
          ease: 'easeInOut',
          repeat: Infinity,
          repeatDelay: 2,
          stiffness: 1000,
          damping: 15
        }
      }
    });
  };

  const handleReset = () => {
    setAnimateVal(undefined);
  };

  return (
    <div>
      <div className="m-4 border p-4">
        <div className="flex m-4">
          <motion.div
            className="relative"
            initial={{ x: 50, y: 50, rotate: 5 }}
            animate={animateVal}
            ref={cardRef}
            style={{ perspective: 1000, transformStyle: 'preserve-3d' }}
          >
            <Image
              src={getEncodedCardSvg({ suit: '♠', value: '2', index: 0 }, 'top')}
              alt=""
              width={100}
              height={150}
              style={{ backfaceVisibility: 'hidden' }}
            ></Image>
            <Image
              className="absolute top-0 left-0"
              src="/card-back.svg"
              alt=""
              width={100}
              height={150}
              style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
            ></Image>
          </motion.div>
          <div className="grow"></div>
          <div ref={destRef} className="bg-slate-400 w-[100px] h-[150px]"></div>
        </div>
        <div className="flex justify-center gap-2">
          <motion.button onClick={handleAnimate} className="p-2 bg-white text-black">
            Start
          </motion.button>
          <motion.button onClick={handleReset} className="p-2 bg-white text-black">
            Reset
          </motion.button>
        </div>
      </div>
      <CardRenderTest />
    </div>
  );
};

export default TestPage;
