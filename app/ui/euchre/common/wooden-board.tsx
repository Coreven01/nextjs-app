import Image from 'next/image';
import { useMemo, useState } from 'react';
import { createRange } from '../../../lib/euchre/util/util';

const height = 25;
const width = 275;

const boardRowVals = [
  [2, 5, 7, 1, 3, 6],
  [3, 4, 8, 2, 5, 1],
  [5, 7, 9, 6, 3, 8],
  [7, 8, 2, 4, 1, 9],
  [1, 3, 5, 7, 8, 2],
  [9, 2, 1, 3, 7, 5],
  [3, 8, 5, 6, 9, 2]
];

const boardRowOffset = ['-left-64', '-left-16', '-left-32', '-left-24', '-left-4', '-left-20', '-left-8'];

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  rows: number;
}

const WoodenBoard = ({ rows, className }: Props) => {
  const rowValues = useMemo(() => createRange(0, rows - 1), [rows]);

  const savedBoardRows = useMemo(() => {
    const boardRows: React.ReactNode[] = [];

    rowValues.map((v) => {
      const valueOffset = v;
      const index = valueOffset % boardRowVals.length;
      const values = boardRowVals[index];
      const offset = boardRowOffset[index];

      boardRows.push(
        <div key={valueOffset} className="flex overflow-hidden">
          {values.map((i) => {
            return (
              <Image
                key={`${valueOffset}${i}`}
                src={`/wooden/wooden-${i}.jpg`}
                width={width}
                height={height}
                alt="wooden board"
                loading="eager"
                quality={100}
                unoptimized={true}
                placeholder="blur"
                blurDataURL="/wooden/wooden-0.jpg"
                priority={true}
                className={`contain border-r border-b border-black relative ${offset}`}
                style={{
                  width: '100%',
                  height: 'auto'
                }}
              />
            );
          })}
        </div>
      );
    });

    return boardRows;
  }, [rowValues]);

  return <div className={className}>{savedBoardRows}</div>;
};

export default WoodenBoard;
