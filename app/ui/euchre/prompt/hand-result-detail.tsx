import useCardData from '@/app/hooks/euchre/data/useCardData';
import useCardSvgData from '@/app/hooks/euchre/data/useCardSvgData';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';
import { EuchreCard, EuchreHandResult, EuchrePlayer, ResultHighlight } from '@/app/lib/euchre/definitions';
import clsx from 'clsx';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  cardsPlayed: EuchreCard[];
  playerWon: EuchrePlayer;
  handResult: EuchreHandResult;
  highlight: ResultHighlight;
}

export default function HandResultDetail({
  cardsPlayed,
  handResult,
  playerWon,
  highlight,
  className,
  ...rest
}: Props) {
  const { playerEqual } = usePlayerData();
  const { cardIsLeftBower } = useCardData();
  const { getCardFullName } = useCardSvgData();

  return (
    <>
      {cardsPlayed.map((c) => {
        let shouldHighlight: boolean = false;
        const playerReneged = handResult.tricks.find((t) => t.playerRenege !== null) !== undefined;

        if (!playerReneged) {
          switch (highlight) {
            case 'player1':
              shouldHighlight = c.player.playerNumber === 1;
              break;
            case 'player2':
              shouldHighlight = c.player.playerNumber === 2;
              break;
            case 'player3':
              shouldHighlight = c.player.playerNumber === 3;
              break;
            case 'player4':
              shouldHighlight = c.player.playerNumber === 4;
              break;
            case 'winner':
              shouldHighlight = playerEqual(c.player, playerWon);
              break;
            case 'trump':
              shouldHighlight =
                c.card.suit === handResult.trump.suit || cardIsLeftBower(c.card, handResult.trump);
              break;
          }
        }

        return (
          <div
            {...rest}
            className={clsx(
              `flex flex-col md:min-w-16 min-w-12 text-black border mr-1`,
              className,
              { 'bg-amber-200 border-orange-300 shadow-lg': shouldHighlight },
              { 'bg-white': !shouldHighlight }
            )}
            title={`${c.player.name} played ${getCardFullName(c.card)}`}
            key={`${c.player.playerNumber}-${c.card.value}-${c.card.suit}`}
          >
            <CardDetail card={c} />
          </div>
        );
      })}
    </>
  );
}

interface DetailProps {
  card: EuchreCard;
}
function CardDetail({ card }: DetailProps) {
  const { getCardClassColorFromSuit } = useCardSvgData();

  return (
    <>
      <div>
        <span>{card.card.value}</span>-
        <span className={getCardClassColorFromSuit(card.card.suit)}>{card.card.suit}</span>
      </div>
      <div>{card.player.name}</div>
    </>
  );
}
