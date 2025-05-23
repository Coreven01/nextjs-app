import { useEffect, useState } from 'react';
import { motion, MotionProps, Target } from 'framer-motion';
import clsx from 'clsx';
import { GameSpeed } from '../../definitions/definitions';

interface Props extends MotionProps {
  children?: React.ReactNode;
  durationMs?: number;
  delayMs?: GameSpeed;
  fadeType: 'in' | 'out' | 'both';
  className?: string;
}

export default function EphemeralModal({
  children,
  durationMs,
  delayMs,
  fadeType,
  className,
  ...rest
}: Props) {
  const [initState] = useState<Target>(
    fadeType === 'in' || fadeType === 'both' ? { opacity: 0 } : { opacity: 1 }
  );
  const [animateState, setAnimateState] = useState<Target | undefined>(
    fadeType === 'in' || fadeType === 'both' ? { opacity: 1 } : { opacity: 0 }
  );

  useEffect(() => {
    const performFade = async () => {
      if (fadeType === 'both') {
        await new Promise((resovle) => setTimeout(resovle, delayMs ?? 1000));
        setAnimateState({ opacity: 0 });
      }
    };

    performFade();
  });

  return (
    <motion.div
      className={clsx(className)}
      initial={initState}
      animate={animateState}
      transition={{ duration: (durationMs ?? 1000) / 1000 }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}
