import { EuchreGameState, EuchrePlayer } from '@/app/lib/euchre/definitions/game-state-definitions';
import GameHighlight from '../game/game-highlight';
import PlayerColor from './player-team-color';
import GameBorderBare from '../game/game-border-bare';
import GameTurnIndicator from '../game/game-turn-indicator';
import { getTeamColor, playerEqual } from '../../../lib/euchre/util/playerDataUtil';
import { GAME_STATES_FOR_PLAYER_TURN } from '../../../lib/euchre/util/gameStateLogicUtil';

interface Props extends React.HtmlHTMLAttributes<HTMLDivElement> {
  player: EuchrePlayer;
  state: EuchreGameState;
}

const PlayerInfo = ({ player, state, ...rest }: Props) => {
  const { euchreGame, euchreSettings, euchreGameFlow } = state;
  const isDealer = playerEqual(player, euchreGame.dealer);
  const isMaker = euchreGame.maker && playerEqual(player, euchreGame.maker);
  const showTurnIndicator =
    playerEqual(player, euchreGame.currentPlayer) &&
    GAME_STATES_FOR_PLAYER_TURN.includes(euchreGameFlow.gameFlow);
  const isSittingOut =
    euchreGame.loner && euchreGame.maker?.team === player.team && euchreGame.maker !== player;
  const suit = euchreGame.trump?.suit;
  const tricksCount = euchreGame.currentTricks.filter((t) => t.taker && playerEqual(t.taker, player)).length;

  let infoToRender: React.ReactNode[] = [];
  const shortHandInfo: React.ReactNode[] = [];
  const infoClass = 'text-red-800 dark:text-yellow-400';
  let counter = 0;

  if (isSittingOut) {
    if (euchreSettings.viewPlayerInfoDetail) {
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
  } else if (euchreSettings.viewPlayerInfoDetail) {
    infoToRender.push(<div key={counter++}>Tricks {tricksCount} / 5</div>);
  }

  if (isDealer) {
    if (euchreSettings.viewPlayerInfoDetail) {
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
    if (euchreSettings.viewPlayerInfoDetail) {
      infoToRender.push(
        <div key={counter++} className={infoClass}>
          Maker
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

  if (euchreSettings.viewPlayerInfoDetail) {
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
      enablePulse={showTurnIndicator ? true : false}
      highlightColorCss={showTurnIndicator ? 'shadow-xl shadow-amber-400' : 'shadow-md shadow-black'}
    >
      <GameBorderBare className="" {...rest}>
        <PlayerColor teamColor={getTeamColor(player, euchreSettings)}>
          <div className="bg-white dark:bg-stone-800 p-1">{infoToRender}</div>
        </PlayerColor>
      </GameBorderBare>
      {showTurnIndicator && <GameTurnIndicator location={player.location} title={`${player.name} Turn`} />}
    </GameHighlight>
  );
};

export default PlayerInfo;
