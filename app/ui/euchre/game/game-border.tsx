import clsx from 'clsx';
import Image from 'next/image';
import React from 'react';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
  size?: 'small' | 'medium' | 'large';
}

const smHeight = 8;
const mdHeight = 10;
const lgHeight = 12;

const width = 300;
const height = 8;

const boardVals = [
  [2, 5, 3, 1, 4, 2, 5],
  [3, 4, 5, 2, 1, 3, 4],
  [1, 3, 2, 4, 5, 1, 3],
  [4, 2, 1, 5, 3, 4, 2]
];

const GameBorder = ({ children, className, innerClass, size = 'medium', ...rest }: DivProps) => {
  let sizeVal = 0;
  switch (size) {
    case 'large':
      sizeVal = lgHeight;
      break;
    case 'medium':
      sizeVal = mdHeight;
      break;
    case 'small':
      sizeVal = smHeight;
      break;
  }

  const cornerImg = (
    <div>
      <Image
        src={`/wooden/square-2.jpg`}
        width={8}
        height={8}
        alt="border"
        loading="eager"
        quality={100}
        unoptimized={true}
        priority={true}
        className={`contain border border-black`}
        style={{
          width: sizeVal,
          height: sizeVal,
          maxHeight: sizeVal,
          maxWidth: sizeVal
        }}
      />
    </div>
  );

  return (
    <div
      className={clsx(
        'grid grid-rows-[minmax(8px,max-content)_auto_minmax(8px,max-content)] grid-cols-[minmax(8px,max-content)_1fr_minmax(8px,max-content)] relative',
        className
      )}
      {...rest}
    >
      {cornerImg}
      <div className="relative">
        <BorderHorizontal location={1} values={boardVals[0]} size={sizeVal} />
      </div>
      {cornerImg}
      <div className="relative overflow-hidden">
        <BorderVertical location={1} values={boardVals[1]} size={sizeVal} />
      </div>
      <div className={clsx(innerClass, { 'bg-white dark:bg-stone-800': innerClass === undefined })}>
        {children}
      </div>
      <div className="relative overflow-hidden">
        <BorderVertical location={2} values={boardVals[2]} size={sizeVal} />
      </div>
      {cornerImg}
      <div className="relative">
        <BorderHorizontal location={2} values={boardVals[3]} size={sizeVal} />
      </div>
      {cornerImg}
    </div>
  );
};

interface Props {
  location: 1 | 2;
  values: number[];
  size: number;
}

function BorderHorizontal({ location, values, size }: Props) {
  const boardRow: React.ReactNode[] = [];

  boardRow.push(
    <div key={location} className={`flex overflow-hidden absolute h-full z-10`}>
      {values.map((v, i) => {
        return (
          <Image
            key={`${location}-${i}-${v}`}
            src={`/wooden/bar-${v}.jpg`}
            width={width}
            height={height}
            alt="border"
            loading="eager"
            quality={75}
            priority={true}
            className={`border-r border-t border-b border-black relative ${location === 1 ? '-left-32' : '-left-8'}`}
            style={{
              width: '100%',
              height: 'auto',
              maxWidth: '100%',
              maxHeight: size
            }}
          />
        );
      })}
    </div>
  );

  return <>{boardRow}</>;
}

function BorderVertical({ location, values, size }: Props) {
  const boardRow: React.ReactNode[] = [];

  boardRow.push(
    <div key={location} className={`flex flex-col absolute w-full z-10`}>
      {values.map((v, i) => {
        return (
          <Image
            key={`${location}${i}${v}`}
            src={`/wooden/bar-v-${v}.jpg`}
            width={height}
            height={width}
            alt="border"
            loading="eager"
            quality={75}
            priority={true}
            className={`border-r border-l border-b border-black relative ${location === 1 ? '-top-32' : '-top-8'}`}
            style={{
              width: 'auto',
              height: '100%',
              maxWidth: size,
              maxHeight: '100%'
            }}
          />
        );
      })}
    </div>
  );

  return <>{boardRow}</>;
}

export default GameBorder;
