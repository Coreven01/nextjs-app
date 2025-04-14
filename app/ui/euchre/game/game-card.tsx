import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import { Card, EuchrePlayer, GameSpeed } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';
import Image from 'next/image';
import React, { CSSProperties, RefObject, useEffect, useRef, useState } from 'react';
import { motion, Target, VariantLabels } from 'framer-motion';
import useCardTransform from '../../../hooks/euchre/data/useCardTransform';

interface Props extends React.HtmlHTMLAttributes<HTMLImageElement> {
  card: Card;
  src: string;
  width: number;
  height: number;
  enableShadow: boolean;
  index: number;
  availableCardIndices: number[];
  playCard: boolean;
  gameSpeedMs: GameSpeed;
  player?: EuchrePlayer;
  deckRef?: RefObject<HTMLDivElement>;
  playerTableRef?: RefObject<HTMLDivElement>;
  responsive?: boolean;
  onCardClick?: (index: number, player: EuchrePlayer) => void;
}
const GameCard = ({
  id,
  card,
  src,
  width,
  height,
  className,
  enableShadow,
  player,
  index,
  availableCardIndices,
  playCard,
  gameSpeedMs,
  deckRef,
  playerTableRef,
  responsive,
  onCardClick,
  ...rest
}: Props) => {
  const cardClicked = useRef(false);
  const cardRef = useRef<HTMLDivElement>(null as unknown as HTMLDivElement);
  const {
    getSpringsForCardPlayed,
    getPlayerStartForCard,
    getRandomDamping,
    getRandomRotation,
    getRandomStiffness,
    getPlayerAnimateCardForStart
  } = useCardTransform();

  const [initCardState] = useState(() => getPlayerStartForCard(player));
  const [cardRotation] = useState(() => getRandomRotation());
  const [xDamping] = useState(() => getRandomDamping());
  const [xStiffness] = useState(() => getRandomStiffness());
  const [yDamping] = useState(() => getRandomDamping());
  const [yStiffness] = useState(() => getRandomStiffness());

  const { getCardFullName } = useCardSvgData();
  const [sprungValue, setSprungRange] = useState<boolean | Target | VariantLabels>(
    getPlayerAnimateCardForStart(player, card.index)
  );

  const sidePlayer = player && player.team === 2;
  const cssValues: CSSProperties = {};
  const duration: number = gameSpeedMs / 1000;

  if (responsive) {
    cssValues.width = '100%';
    cssValues.height = '100%';
  } else {
    cssValues.width = width;
    cssValues.height = height;
    cssValues.maxHeight = height;
    cssValues.maxWidth = width;
  }

  const getOffsetForPlayer = (playerNumber: number): string => {
    switch (playerNumber) {
      case 1:
        return 'top-3 left-3';
      case 2:
        return '-top-3 left-3';
      case 3:
        return 'top-2 -left-3';
      case 4:
        return 'top-2 -right-3';
    }

    return 'top-3 left-2';
  };

  const handleCardClick = async (index: number, player: EuchrePlayer) => {
    if (!cardClicked.current) {
      cardClicked.current = true;
      setSprungRange(getSpringsForCardPlayed(player, cardRef, playerTableRef, cardRotation));
    }
  };

  useEffect(() => {
    if (player && playCard && !cardClicked.current) {
      handleCardClick(index, player);
    }
  });

  return (
    <motion.div
      ref={cardRef}
      initial={initCardState}
      animate={sprungValue}
      transition={{
        opacity: { duration: 1 },
        x: { duration: duration, stiffness: xStiffness, damping: xDamping },
        y: { duration: duration, stiffness: yStiffness, damping: yDamping },
        rotate: { duration: duration }
      }}
      onAnimationComplete={() => {
        if (player && cardClicked.current && onCardClick) {
          onCardClick(index, player);
        }
      }}
    >
      <div className={clsx('relative pointer-events-auto', className)} id={id}>
        <Image
          className={clsx(`absolute ${getOffsetForPlayer(player?.playerNumber ?? 1)}`)}
          quality={50}
          width={width}
          height={height}
          src={sidePlayer ? '/card-shadow-side.png' : '/card-shadow.png'}
          alt={'card shadow'}
          style={cssValues}
        />
        <Image
          {...rest}
          className={clsx('relative top-0 left-0')}
          quality={100}
          width={width}
          height={height}
          src={src}
          alt={player && player.human ? getCardFullName(card) : 'Player Card'}
          unoptimized={true}
          onClick={player && player.human ? () => handleCardClick(card.index, player) : undefined}
          style={cssValues}
        ></Image>
      </div>
    </motion.div>
  );
};

export default GameCard;
