import { getIn, setIn } from '@hon2a/icepick-fp'

import { Path, ActionType, Duck, AnyMessage } from '../types'

export const STATE_RESET = '__reducks.STATE_RESET__'
export const resetState = <State>(path: Path, resetType: ActionType) => (duck: Duck<State>): Duck<State> => {
  if (!duck.reducer) return duck

  const { reducer } = duck
  return {
    ...duck,
    reducer: (state: State | undefined, message: AnyMessage): State => {
      if (message.type !== resetType) return reducer(state, message)

      const defaults: State = reducer(undefined, { type: STATE_RESET, payload: undefined })
      return reducer(setIn(path, getIn(path)(defaults))(state), message)
    }
  }
}
