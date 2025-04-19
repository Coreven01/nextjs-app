import clsx from 'clsx';
import useCardData from '../../../hooks/euchre/data/useCardData';
import GameBorder from './game-border';
import GameCard from './game-card';
import { Card } from '../../../lib/euchre/definitions';
import { motion } from 'framer-motion';
import { CardState } from '../../../hooks/euchre/reducers/cardStateReducer';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  card: Card;
  cardState: CardState;
}

const GameFlippedCard = ({ card, cardState }: Props) => {
  const { getDisplayHeight, getDisplayWidth } = useCardData();

  return (
    <motion.div className={clsx('lg:relative lg:right-auto lg:top-auto absolute -right-16 -top-8')}>
      <GameBorder innerClass="bg-stone-800" className="shadow-md shadow-black" size="small">
        <div className="p-2 bg-green-950 flex items-center justify-center">
          <GameCard
            cardState={cardState}
            className="lg:h-[125px] md:h-[115px] h-[95px]"
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
