import React from 'react';
import clsx from 'clsx';
import Image from 'next/image';
import { getCardShadowSrcByRotation } from '../../util/game/cardDataUtil';
import { TableLocation } from '../../definitions/definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  location: TableLocation;
  rotate?: boolean;
}

const PlayingCardShadow = ({ className, rotate, location, style }: Props) => {
  //#region Handlers

  /** Handle card click event. */

  //#endregion

  return (
    <Image
      className={clsx(`relative`, className, getShadowOffsetForPlayer(location))}
      quality={50}
      width={107}
      height={150}
      src={getCardShadowSrcByRotation(!!rotate)}
      alt={'Card Shadow'}
      style={style}
      draggable={false}
    />
  );
};

const getShadowOffsetForPlayer = (sideLocation: TableLocation): string => {
  switch (sideLocation) {
    case 'bottom':
      return 'top-2 left-2';
    case 'top':
      return '-top-2 left-2';
    case 'left':
      return 'top-2 -left-2';
    case 'right':
      return 'top-2 -right-2';
  }
};

export default PlayingCardShadow;
