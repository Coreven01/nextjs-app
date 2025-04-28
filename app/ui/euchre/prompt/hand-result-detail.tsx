import useCardData from '@/app/hooks/euchre/data/useCardData';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { EuchreCard, EuchrePlayer, EuchreTrick } from '@/app/lib/euchre/definitions/game-state-definitions';
import clsx from 'clsx';
import { EuchreHandResult, ResultHighlight, Suit } from '../../../lib/euchre/definitions/definitions';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  trick: EuchreTrick;
  playerWon: EuchrePlayer;
  handResult: EuchreHandResult;
  highlight: ResultHighlight;
  playerReneged: boolean;
}

const HandResultDetail = ({
  trick,
  handResult,
  playerWon,
  highlight,
  playerReneged,
  className,
  ...rest
}: Props) => {
  const { playerEqual } = usePlayerData();
  const { cardIsLeftBower } = useCardData();
  const { getCardFullName, getCardClassColorFromSuit } = useCardSvgData();

  return (
    <>
      {trick.cardsPlayed.map((c) => {
        let shouldHighlightYellow: boolean = false;
        const shouldHighlightRed: boolean =
          (trick.playerRenege && playerEqual(trick.playerRenege, c.player)) ?? false;

        switch (highlight) {
          case 'player1':
            shouldHighlightYellow = !playerReneged && c.player.playerNumber === 1;
            break;
          case 'player2':
            shouldHighlightYellow = !playerReneged && c.player.playerNumber === 2;
            break;
          case 'player3':
            shouldHighlightYellow = !playerReneged && c.player.playerNumber === 3;
            break;
          case 'player4':
            shouldHighlightYellow = !playerReneged && c.player.playerNumber === 4;
            break;
          case 'winner':
            shouldHighlightYellow = !playerReneged && playerEqual(c.player, playerWon);
            break;
          case 'trump':
            shouldHighlightYellow =
              !playerReneged &&
              (c.card.suit === handResult.trump.suit || cardIsLeftBower(c.card, handResult.trump));
            break;
        }

        return (
          <div
            className={clsx(
              `flex flex-col lg:min-w-16 min-w-12 text-black border mr-1`,
              className,
              { 'bg-amber-200 border-orange-300 shadow-lg': shouldHighlightYellow },
              { 'bg-red-200 border-red-500 shadow-lg': shouldHighlightRed },
              { 'bg-gray-50': !shouldHighlightYellow && !shouldHighlightRed }
            )}
            title={`${c.player.name} played ${getCardFullName(c.card)}${shouldHighlightRed ? ' - Did not follow suit!' : ''}`}
            key={`${c.player.playerNumber}-${c.card.value}-${c.card.suit}`}
            {...rest}
          >
            <CardDetail card={c} getCardClassColorFromSuit={getCardClassColorFromSuit} />
          </div>
        );
      })}
    </>
  );
};

interface DetailProps {
  card: EuchreCard;
  getCardClassColorFromSuit: (suit: Suit) => string;
}

const CardDetail = ({ card, getCardClassColorFromSuit }: DetailProps) => {
  return (
    <>
      <div>
        <span>{card.card.value}</span>-
        <span className={getCardClassColorFromSuit(card.card.suit)}>{card.card.suit}</span>
      </div>
      <div>{card.player.name}</div>
    </>
  );
};

export default HandResultDetail;
