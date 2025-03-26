'use client';

import clsx from 'clsx';
import Image from 'next/image';

interface DivProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  children?: React.ReactNode;
  innerClass?: string;
}

const height = 8;
const width = 300;

const boardVals = [
  [2, 5, 3, 1, 4, 2, 5],
  [3, 4, 5, 2, 1, 3, 4],
  [1, 3, 2, 4, 5, 1, 3],
  [4, 2, 1, 5, 3, 4, 2]
];

export default function GameBorder({ children, className, innerClass, ...rest }: DivProps) {
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
          width: '100%',
          height: 'auto'
        }}
      />
    </div>
  );

  return (
    <div
      {...rest}
      className={clsx(
        'grid grid-rows-[12px,auto,12px] grid-cols-[12px,auto,12px] m-auto relative',
        className
      )}
    >
      {cornerImg}
      <div className="relative">
        <BorderHorizontal location={1} values={boardVals[0]} />
      </div>
      {cornerImg}
      <div className="relative overflow-hidden">
        <BorderVertical location={1} values={boardVals[1]} />
      </div>
      <div className={clsx('', innerClass, { 'bg-stone-800': innerClass === undefined })}>{children}</div>
      <div className="relative overflow-hidden">
        <BorderVertical location={2} values={boardVals[2]} />
      </div>
      {cornerImg}
      <div className="relative">
        <BorderHorizontal location={2} values={boardVals[3]} />
      </div>
      {cornerImg}
    </div>
  );
}
interface Props {
  location: 1 | 2;
  values: number[];
}

function BorderHorizontal({ location, values }: Props) {
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
              height: '100%'
            }}
          />
        );
      })}
    </div>
  );

  return <>{boardRow}</>;
}

function BorderVertical({ location, values }: Props) {
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
              width: '100%',
              height: '100%'
            }}
          />
        );
      })}
    </div>
  );

  return <>{boardRow}</>;
}
