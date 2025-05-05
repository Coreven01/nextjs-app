import { PromptType } from '../../../lib/euchre/definitions/definitions';
import {
  EuchreGameSetters,
  EuchreGameValues,
  ErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGamePlayLogic from '../logic/useGamePlayLogic';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreFlowActionType, EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGamePlayState = (state: EuchreGameValues, setters: EuchreGameSetters, handlers: ErrorHandlers) => {
  const { isGameStateValidToContinue } = useGameStateLogic();
  const { getGameStateForNextHand } = useGamePlayLogic();

  const shouldBeginPlayCard = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_PLAY_CARD,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginPlayCard = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_PLAY_CARD,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndPlayCard = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_PLAY_CARD,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginPlayCardResult = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldEndPlayCardResult = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_PLAY_CARD_RESULT,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateEndPlayCardResult = isGameStateValidToContinue(
    state,
    EuchreGameFlow.END_PLAY_CARD_RESULT,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldBeginTrickFinished = isGameStateValidToContinue(
    state,
    EuchreGameFlow.TRICK_FINISHED,
    EuchreAnimateType.NONE,
    state.shouldCancel,
    handlers.onCancel
  );

  const shouldAnimateBeginTrickFinished = isGameStateValidToContinue(
    state,
    EuchreGameFlow.TRICK_FINISHED,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const pauseForPlayCard = (computerPlayer: boolean) => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PLAY_CARD,
      EuchreAnimationActionType.SET_NONE,
      computerPlayer ? EuchrePauseActionType.SET_AI_INPUT : EuchrePauseActionType.SET_USER_INPUT
    );
  };

  const pauseForPrompt = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_PLAY_CARD_RESULT,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_PROMPT
    );
  };

  const continueToAnimateBeginPlayCard = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PLAY_CARD,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToEndPlayCard = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_PLAY_CARD,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToAnimateBeginPlayCardResult = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PLAY_CARD_RESULT,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToEndPlayCardResult = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_PLAY_CARD_RESULT,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToAnimateEndPlayCardResult = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.END_PLAY_CARD_RESULT,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToBeginPlayCard = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_PLAY_CARD,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToTrickFinished = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.TRICK_FINISHED,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const continueToAnimateTrickFinished = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.TRICK_FINISHED,
      EuchreAnimationActionType.SET_ANIMATE,
      EuchrePauseActionType.SET_NONE
    );
  };

  const resetForNewHand = () => {
    setters.removePromptValue(PromptType.HAND_RESULT);
    setters.dispatchGameFlow({
      type: EuchreFlowActionType.SET_STATE,
      state: getGameStateForNextHand(state.euchreGameFlow, state.euchreSettings, state.euchreGame.gamePlayers)
    });

    setters.dispatchStateChange(
      undefined,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return {
    shouldBeginPlayCard,
    shouldAnimateBeginPlayCard,
    shouldEndPlayCard,
    shouldAnimateBeginPlayCardResult,
    shouldEndPlayCardResult,
    shouldAnimateEndPlayCardResult,
    shouldBeginTrickFinished,
    shouldAnimateBeginTrickFinished,
    pauseForPlayCard,
    continueToAnimateBeginPlayCard,
    continueToEndPlayCard,
    continueToAnimateBeginPlayCardResult,
    continueToEndPlayCardResult,
    continueToAnimateEndPlayCardResult,
    continueToBeginPlayCard,
    continueToTrickFinished,
    continueToAnimateTrickFinished,
    pauseForPrompt,
    resetForNewHand
  };
};

export default useGamePlayState;
