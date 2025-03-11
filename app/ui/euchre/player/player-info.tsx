import { EuchreGameInstance, EuchrePlayer } from '@/app/lib/euchre/definitions';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
};

export default function PlayerInfo({ player, game }: Props) {
  const isDealer = player === game.dealer;
  const isMaker = player === game.maker;
  const suit = game.trump?.suit;
  const tricksCount = game.currentTricks.filter((t) => t.taker === player).length;
  const points = game.gameResults
    .filter((t) => t.teamWon === player.team)
    .map((t) => t.points)
    .reduce((acc, curr) => acc + curr, 0);

  let content = '';

  if (isDealer && isMaker) content = `Dealer | Maker (${suit})`;
  else if (isDealer) content = 'Dealer';
  else if (isMaker) content = `Maker (${suit})`;

  return (
    <>
      <div className="rounded border rounded-xl dark:border-white p-2 m-2 text-sm">
        <div>
          {player.name} - Team: {player.team}
        </div>
        <div>Tricks {tricksCount}/5</div>
        <div>Points {points}/10</div>
        <div className={`text-yellow-500 ${!content ? 'invisible' : ''}`}>
          {content ? content : 'X'}
        </div>
      </div>
    </>
  );
}
