import { EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameHighlight from '../game/game-hightlight';
import PlayerColor from './player-team-color';
import GameBorderBare from '../game/game-border-bare';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
}

export default function PlayerInfo({ player, game, settings, ...rest }: Props) {
  const isDealer = game.dealer && player.equal(game.dealer);
  const isMaker = game.maker && player.equal(game.maker);
  const isSittingOut = game.loner && game.maker?.team === player.team && game.maker !== player;
  const suit = game.trump?.suit;
  const tricksCount = game.handTricks.filter((t) => t.taker === player).length;
  let infoToRender: React.ReactNode[] = [];
  const shortHandInfo: React.ReactNode[] = [];

  let counter = 0;

  if (isSittingOut) {
    if (settings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={`text-yellow-400`}>
          Sitting Out
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={`text-yellow-400`} title="Sitting Out" key={counter++}>
          {'(S)'}
        </span>
      );
    }
  } else if (settings.viewPlayerInfoDetail) {
    infoToRender.push(<div key={counter++}>Tricks {tricksCount} / 5</div>);
  }

  if (isDealer) {
    if (settings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={`text-yellow-400`}>
          Dealer
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={`text-yellow-400`} title="Dealer" key={counter++}>
          {'(D)'}
        </span>
      );
    }
  }

  if (isMaker && suit) {
    if (settings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={`text-yellow-400`}>
          Maker ({suit})
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={`text-yellow-400`} title="Maker" key={counter++}>
          {'(M)'}
        </span>
      );
    }
  }

  if (settings.viewPlayerInfoDetail) {
    const playerName = (
      <div key={counter++} className="inline">
        {player.name}
      </div>
    );

    infoToRender = [playerName, ...infoToRender];

    while (infoToRender.length < 4) {
      infoToRender.push(
        <div key={counter++} className="invisible">
          X
        </div>
      );
    }
  } else {
    infoToRender.push(
      <div key={counter++} className="inline">
        {player.name} {shortHandInfo}
      </div>
    );
  }

  return (
    <GameHighlight
      enableHighlight={true}
      enablePulse={game.currentPlayer === player ? true : false}
      highlightColorCss={
        game.currentPlayer === player ? 'shadow-xl shadow-yellow-300' : 'shadow-md shadow-black'
      }
    >
      <GameBorderBare {...rest} className="">
        <PlayerColor player={player} settings={settings}>
          <div className="bg-stone-800 p-1">{infoToRender}</div>
        </PlayerColor>
      </GameBorderBare>
    </GameHighlight>
  );
}
