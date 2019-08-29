import { getIn, setIn } from '@hon2a/icepick-fp'

import { Path, ActionType, Duck, Message } from '../types'

export const STATE_RESET = '__reducks.STATE_RESET__'
export const resetState = <State>(path: Path, resetType: ActionType) => ({ reducer, ...rest }: Duck<State>) => ({
  reducer: reducer && ((state: State, message: Message) => {
    if (message.type !== resetType) return reducer(state, message)

    const defaults = reducer(undefined, { type: STATE_RESET })
    return reducer(setIn(path, getIn(path)(defaults))(state), message)
  }),
  ...rest
})
