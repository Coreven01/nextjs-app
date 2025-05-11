import clsx from 'clsx';
import GameBorder from './game-border';
import GameCard from './game-card';
import { Card } from '../../../lib/euchre/definitions/definitions';
import { motion, TargetAndTransition } from 'framer-motion';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';
import { getDisplayHeight, getDisplayWidth } from '../../../lib/euchre/util/cardDataUtil';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  card: Card;
  cardState: CardState;
  visible: boolean;
}

const GameFlippedCard = ({ card, cardState, visible }: Props) => {
  const initVal: TargetAndTransition = { opacity: 0, scale: 0.65 };
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
            renderKey={cardState.renderKey}
            cardState={cardState}
            card={card}
            responsive={true}
            width={getDisplayWidth('top')}
            height={getDisplayHeight('top')}
            location="top"
            title={cardState.cardFullName}
          ></GameCard>
        </div>
      </GameBorder>
    </motion.div>
  );
};

export default GameFlippedCard;
