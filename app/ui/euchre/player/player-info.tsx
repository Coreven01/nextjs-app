import { EuchreGameInstance, EuchrePlayer, EuchreSettings } from '@/app/lib/euchre/definitions';
import GameHighlight from '../game/game-highlight';
import PlayerColor from './player-team-color';
import GameBorderBare from '../game/game-border-bare';
import usePlayerData from '@/app/hooks/euchre/data/usePlayerData';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  player: EuchrePlayer;
  game: EuchreGameInstance;
  settings: EuchreSettings;
}

const PlayerInfo = ({ player, game, settings, ...rest }: Props) => {
  const { playerEqual } = usePlayerData();
  const isDealer = playerEqual(player, game.dealer);
  const isMaker = game.maker && playerEqual(player, game.maker);
  const isSittingOut = game.loner && game.maker?.team === player.team && game.maker !== player;
  const suit = game.trump?.suit;
  const tricksCount = game.currentTricks.filter((t) => t.taker === player).length;
  let infoToRender: React.ReactNode[] = [];
  const shortHandInfo: React.ReactNode[] = [];
  const infoClass = 'text-red-800 dark:text-yellow-400';
  let counter = 0;

  if (isSittingOut) {
    if (settings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={infoClass}>
          Sitting Out
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={infoClass} title="Sitting Out" key={counter++}>
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
        <div key={counter++} className={infoClass}>
          Dealer
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={infoClass} title="Dealer" key={counter++}>
          {'(D)'}
        </span>
      );
    }
  }

  if (isMaker && suit) {
    if (settings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={infoClass}>
          Maker ({suit})
        </div>
      );
    } else {
      shortHandInfo.push(
        <span className={infoClass} title="Maker" key={counter++}>
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
        game.currentPlayer === player ? 'shadow-xl shadow-amber-400' : 'shadow-md shadow-black'
      }
    >
      <GameBorderBare {...rest} className="">
        <PlayerColor player={player} settings={settings}>
          <div className="bg-white dark:bg-stone-800 p-1">{infoToRender}</div>
        </PlayerColor>
      </GameBorderBare>
    </GameHighlight>
  );
};

export default PlayerInfo;
