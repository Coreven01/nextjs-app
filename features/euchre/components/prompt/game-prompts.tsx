import { PromptType } from '../../definitions/definitions';
import {
  EuchreError,
  EuchreGameInstance,
  EuchreGamePlayHandlers,
  EuchreGameSetters,
  EuchreGameValues,
  EuchreSettings,
  GameMenuValues,
  GamePlayContext
} from '../../definitions/game-state-definitions';
import GameScore from '../game/game-score';
import GameSettings from '../game/game-settings';
import BidPrompt from './bid-prompt';
import DiscardPrompt from './discard-prompt';
import GameErrorPrompt from './game-error-prompt';
import GameIntro from './game-intro';
import GamePrompt from './game-prompt';
import GameResult from './game-result';
import HandResults from './hand-results';

interface Props {
  gameContext: GamePlayContext;
  stateValues: EuchreGameValues;
  setters: EuchreGameSetters;
  gameHandlers: EuchreGamePlayHandlers;
  menuValues: GameMenuValues;
  onOpenDebugMenu: () => void;
  errorState: EuchreError | null;
  showSettings: boolean;
  showScore: boolean;
}
const GamePrompts = ({
  gameContext,
  stateValues,
  setters,
  gameHandlers,
  menuValues,
  errorState,
  onOpenDebugMenu
}: Props) => {
  const { onToggleSettings, showScore, showSettings } = menuValues;

  //#region Event Handlers

  const handleOpenDebugMenu = () => {
    onOpenDebugMenu();
  };

  const changeSettings = (settings: EuchreSettings) => {
    gameHandlers.onSettingsChange(settings);
  };

  const handleStartNewGame = () => {
    onToggleSettings(false);
    gameHandlers.onBeginNewGame();
  };

  const handleReturnFromSettings = () => {
    onToggleSettings(false);
  };

  const handleBeginReplayGame = (gameToReplay: EuchreGameInstance, autoPlay: boolean) => {
    onToggleSettings(false);
    gameHandlers.onReplayGame({ ...gameToReplay }, autoPlay);
  };

  const handleShowSettings = () => {
    onToggleSettings(true);
  };

  const handleCloseGameResults = () => {
    setters.clearPromptValues();
    gameHandlers.reset(true);
  };

  //#region Conditional prompt components to render.

  const renderErrorMessage = errorState && stateValues.euchreGame && (
    <GameErrorPrompt
      key={stateValues.euchreGame !== null ? 'modal' : 'init'}
      errorState={errorState}
      onAttemptToRecover={gameContext.errorHandlers.onResetError}
    />
  );

  const renderSettings = showSettings && (
    <GamePrompt zIndex={90}>
      <GameSettings
        key={stateValues.euchreGame !== null ? 'modal' : 'init'}
        settings={stateValues.euchreSettings}
        onReturn={handleReturnFromSettings}
        onApplySettings={changeSettings}
      />
    </GamePrompt>
  );

  const renderIntro = !showSettings && stateValues.promptValues.includes(PromptType.INTRO) && (
    <GamePrompt innerClass="bg-green-300 bg-opacity-10" className="mt-8" id="game-intro" zIndex={90}>
      <GameIntro
        enableDebug={stateValues.euchreSettings.debugEnableDebugMenu}
        onRunDebug={handleOpenDebugMenu}
        onBegin={handleStartNewGame}
        onSettings={handleShowSettings}
      />
    </GamePrompt>
  );

  const renderBidPrompt = stateValues.promptValues.includes(PromptType.BID) &&
    stateValues.euchreGame?.trump && (
      <BidPrompt
        game={stateValues.euchreGame}
        firstRound={!stateValues.euchreGameFlow.hasFirstBiddingPassed}
        onBidSubmit={gameHandlers.onBidSubmit}
        settings={stateValues.euchreSettings}
      />
    );

  const renderDiscardPrompt = stateValues.promptValues.includes(PromptType.DISCARD) &&
    stateValues.euchreGame?.trump &&
    stateValues.euchreGame.dealer && (
      <DiscardPrompt
        pickedUpCard={stateValues.euchreGame.trump}
        playerHand={stateValues.euchreGame.dealer.hand}
        onDiscardSubmit={gameHandlers.onDiscardSubmit}
      />
    );

  const renderHandResults = stateValues.promptValues.includes(PromptType.HAND_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <HandResults
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResult={stateValues.euchreGame.handResults.at(-1) ?? null}
        onClose={gameHandlers.onCloseHandResults}
        onReplayHand={gameHandlers.onReplayHand}
      />
    );

  const renderGameResults = stateValues.promptValues.includes(PromptType.GAME_RESULT) &&
    stateValues.euchreGame &&
    stateValues.euchreGame.handResults.length > 0 && (
      <GameResult
        game={stateValues.euchreGame}
        settings={stateValues.euchreSettings}
        handResults={stateValues.euchreGame.handResults}
        onClose={handleCloseGameResults}
        onNewGame={gameHandlers.onBeginNewGame}
        onReplayGame={(autoPlay: boolean) => handleBeginReplayGame(stateValues.euchreGame, autoPlay)}
      />
    );

  const renderGameScore = stateValues.euchreGameFlow.hasGameStarted && (
    <GameScore
      game={stateValues.euchreGame}
      settings={stateValues.euchreSettings}
      showScore={showScore}
      className="lg:min-h-16 lg:min-w-16 absolute top-2 lg:right-4 lg:left-auto left-8"
    />
  );

  //#endregion

  return (
    <>
      {renderSettings}
      {renderIntro}
      {renderBidPrompt}
      {renderDiscardPrompt}
      {renderHandResults}
      {renderGameResults}
      {renderErrorMessage}
      {renderGameScore}
    </>
  );
};

export default GamePrompts;
