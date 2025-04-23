import React, { CSSProperties } from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { RESPONSE_CARD_CENTER, RESPONSE_CARD_SIDE } from '../../../lib/euchre/definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  width: number;
  height: number;
  team: number;
  responsive?: boolean;
}
const DummyCard = ({ width, height, team, responsive, className, ...rest }: Props) => {
  const sidePlayer = team && team === 2;
  const cssValues: CSSProperties = {};

  if (responsive) {
    cssValues.width = '100%';
    cssValues.height = '100%';
  } else {
    cssValues.width = width;
    cssValues.height = height;
    cssValues.maxHeight = height;
    cssValues.maxWidth = width;
  }

  return (
    <div
      className={clsx(
        'pointer-events-none invisible',
        sidePlayer ? RESPONSE_CARD_SIDE : RESPONSE_CARD_CENTER,
        className
      )}
      {...rest}
    >
      <Image
        quality={25}
        width={width}
        height={height}
        src={sidePlayer ? '/card-shadow-side.png' : '/card-shadow.png'}
        alt={'positional card'}
        style={cssValues}
        aria-hidden
      />
    </div>
  );
};

export default DummyCard;
