import { EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameBorder from '../game/game-border';
import GameHighlight from '../game/game-hightlight';
import PlayerColor from './player-team-color';
import { getSuitName } from '@/app/lib/euchre/card-data';

type Props = {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
};

export default function PlayerInfo({ player, game, settings }: Props) {
  const isDealer = game.dealer && player.equal(game.dealer);
  const isMaker = game.maker && player.equal(game.maker);
  const isSittingOut = game.loner && game.maker?.team === player.team && game.maker !== player;
  const suit = game.trump?.suit;
  const tricksCount = game.handTricks.filter((t) => t.taker === player).length;
  const infoToRender: React.ReactNode[] = [];
  let counter = 0;
  infoToRender.push(<div key={counter++}>{player.name}</div>);

  if (isSittingOut)
    infoToRender.push(
      <div key={counter++} className={`text-yellow-400`}>
        Sitting Out
      </div>
    );
  else infoToRender.push(<div key={counter++}>Tricks {tricksCount} / 5</div>);

  if (isDealer)
    infoToRender.push(
      <div key={counter++} className={`text-yellow-400`}>
        Dealer
      </div>
    );

  if (isMaker && suit)
    infoToRender.push(
      <div key={counter++} className={`text-yellow-400`} title={`Trump: ${getSuitName(suit)}s`}>
        Maker ({suit})
      </div>
    );

  while (infoToRender.length < 4)
    infoToRender.push(
      <div key={counter++} className="invisible">
        X
      </div>
    );

  return (
    <GameHighlight
      enableHighlight={true}
      enablePulse={game.currentPlayer === player ? true : false}
      highlightColorCss={
        game.currentPlayer === player ? 'shadow-xl shadow-yellow-300' : 'shadow-md shadow-black'
      }
    >
      <GameBorder className="relative">
        <PlayerColor player={player} settings={settings}>
          <div className="bg-stone-800 p-1 h-full w-full text-md">{infoToRender}</div>
        </PlayerColor>
      </GameBorder>
    </GameHighlight>
  );
}
