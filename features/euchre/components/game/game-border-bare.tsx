import clsx from 'clsx';
import React from 'react';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
}

const GameBorderBare = ({ children, className, innerClass, ...rest }: DivProps) => {
  const borderClass = 'h-full w-full bg-yellow-900 border border-stone-900';

  return (
    <div className={clsx('grid grid-rows-[5px,1fr,5px] grid-cols-[5px,1fr,5px] m-auto', className)} {...rest}>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={clsx(innerClass, { 'bg-white dark:bg-stone-900': innerClass === undefined })}>
        {children}
      </div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
      <div className={borderClass}></div>
    </div>
  );
};

export default GameBorderBare;
