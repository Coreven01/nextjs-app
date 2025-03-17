'use client';

import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
}

export default function GameBorder({ children, className, innerClass, ...rest }: DivProps) {
  const borderClass = 'h-full w-full bg-amber-900 border border-black';

  return (
    <div
      {...rest}
      className={clsx(
        'grid grid-rows-[10px,1fr,10px] grid-cols-[10px,1fr,10px] min-h-32 min-w-32 m-auto',
        className
      )}
    >
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={clsx('', innerClass, { 'bg-stone-800': innerClass === undefined })}>{children}</div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
    </div>
  );
}
