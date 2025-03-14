'use client';

import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  durationMs?: 150 | 300 | 700 | 1000 | 1500 | 3000;
}

const durationValues = ['duration-300', 'duration-700', 'duration-1000', 'duration-1500', 'duration-3000'];
export default function GameModal({ children, className, durationMs, ...rest }: DivProps) {
  const element: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    setTimeout(() => element.current.classList.add('opacity-100'), 25);
  });

  return (
    <div
      ref={element}
      className={clsx(`transition-opacity ${getDurationClass(durationMs)} ease-in-out`, className)}
      {...rest}
    >
      {children}
    </div>
  );
}

function getDurationClass(duration?: number): string {
  if (duration) return `duration-${duration}`;

  return 'duration-150';
}
