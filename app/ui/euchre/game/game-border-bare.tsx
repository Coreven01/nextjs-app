'use client';

import clsx from 'clsx';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
}

export default function GameBorderBare({ children, className, innerClass, ...rest }: DivProps) {
  const borderClass = 'h-full w-full bg-amber-800 border border-stone-800';

  return (
    <div
      {...rest}
      className={clsx(
        'grid grid-rows-[5px,1fr,5px] grid-cols-[5px,1fr,5px] min-h-32 min-w-32 m-auto',
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
