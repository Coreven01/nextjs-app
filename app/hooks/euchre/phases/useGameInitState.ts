import {
  EuchreGameSetters,
  EuchreGameValues,
  GameErrorHandlers
} from '../../../lib/euchre/definitions/game-state-definitions';
import useGameStateLogic from '../logic/useGameStateLogic';
import { EuchreAnimateType, EuchreAnimationActionType } from '../reducers/gameAnimationFlowReducer';
import { EuchreGameFlow } from '../reducers/gameFlowReducer';
import { EuchrePauseActionType } from '../reducers/gamePauseReducer';

const useGameInitState = (
  state: EuchreGameValues,
  setters: EuchreGameSetters,
  handlers: GameErrorHandlers
) => {
  const { isGameStateValidToContinue } = useGameStateLogic();

  const shouldBeginIntro = isGameStateValidToContinue(
    state,
    EuchreGameFlow.BEGIN_INTRO,
    EuchreAnimateType.ANIMATE,
    state.shouldCancel,
    handlers.onCancel
  );

  const continueToBeginDealCardsForDealer = () => {
    setters.dispatchStateChange(
      EuchreGameFlow.BEGIN_DEAL_FOR_DEALER,
      EuchreAnimationActionType.SET_NONE,
      EuchrePauseActionType.SET_NONE
    );
  };

  return { shouldBeginIntro, continueToBeginDealCardsForDealer };
};

export default useGameInitState;
