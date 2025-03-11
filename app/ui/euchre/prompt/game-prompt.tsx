'use client';

import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export function GamePrompt({ children, className, ...rest }: DivProps) {
  const borderClass = 'h-full w-full bg-amber-900 border border-black';

  return (
    <div className="absolute left-0 top-0 h-full w-full bg-neutral-800 bg-opacity-20 flex items-center justify-center">
      <div className="grid grid-rows-[12px,1fr,12px] grid-cols-[12px,1fr,12px] min-h-32 min-w-32">
        <div className={borderClass}></div>
        <div className={borderClass}></div>
        <div className={borderClass}></div>
        <div className={borderClass}></div>
        <div {...rest} className={clsx('bg-stone-800', className)}>
          {children}
        </div>
        <div className={borderClass}></div>
        <div className={borderClass}></div>
        <div className={borderClass}></div>
        <div className={borderClass}></div>
      </div>
    </div>
  );
}
