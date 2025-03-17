'use client';

import { GameSpeed } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import { RefObject, useEffect, useRef } from 'react';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  durationMs?: GameSpeed;
  delayMs?: GameSpeed;
  fadeType: 'in' | 'out' | 'both';
}

export default function EphemeralModal({
  children,
  className,
  durationMs,
  delayMs,
  fadeType,
  ...rest
}: DivProps) {
  const element: RefObject<HTMLDivElement> = useRef(null) as unknown as React.RefObject<HTMLDivElement>;

  useEffect(() => {
    const performFade = async () => {
      const current = element.current;

      if (current && (fadeType === 'in' || fadeType === 'both'))
        setTimeout(() => current.classList.add('!opacity-100'), 25);
      if (current && fadeType === 'out') {
        setTimeout(() => {
          current.classList.remove('opacity-100');
          current.classList.add('!opacity-0');
        }, 25);
      }

      const duration = durationMs ?? 150;
      const delay = delayMs ?? 150;

      if (fadeType === 'both') {
        await new Promise((resolve) => setTimeout(resolve, delay + duration));

        if (current) setTimeout(() => current.classList.remove('!opacity-100'), 25);
      }
    };

    performFade();
  });

  return (
    <div
      ref={element}
      className={clsx(
        `transition-opacity ${getDurationClass(durationMs)} ease-in-out`,
        className,
        {
          'opacity-0': fadeType === 'in' || fadeType === 'both'
        },
        {
          'opacity-100': fadeType === 'out'
        }
      )}
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
