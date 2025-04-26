import clsx from 'clsx';
import useCardData from '../../../hooks/euchre/data/useCardData';
import GameBorder from './game-border';
import GameCard from './game-card';
import { Card } from '../../../lib/euchre/definitions';
import { motion, TargetAndTransition } from 'framer-motion';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  card: Card;
  cardState: CardState;
  visible: boolean;
}

const GameFlippedCard = ({ card, cardState, visible }: Props) => {
  const { getDisplayHeight, getDisplayWidth } = useCardData();
  const initVal: TargetAndTransition = { opacity: 0, scale: 0.75 };
  const animateVal: TargetAndTransition = visible ? { opacity: 1, scale: 1 } : initVal;

  return (
    <motion.div
      className={clsx('lg:relative lg:right-auto lg:top-auto absolute -right-16 -top-8')}
      initial={initVal}
      animate={animateVal}
    >
      <GameBorder innerClass="bg-stone-800" className="shadow-md shadow-black" size="small">
        <div className="lg:p-2 p-1 bg-green-950 flex items-center justify-center">
          <GameCard
            cardState={cardState}
            card={card}
            responsive={true}
            width={getDisplayWidth('center')}
            height={getDisplayHeight('center')}
            title={cardState.cardFullName}
          ></GameCard>
        </div>
      </GameBorder>
    </motion.div>
  );
};

export default GameFlippedCard;
