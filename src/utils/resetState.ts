import { getIn, setIn } from '@hon2a/icepick-fp'

export const STATE_RESET = '__reducks.STATE_RESET__'
export const resetState = (path, resetType) => ({ reducer, ...rest }) => ({
  reducer: (state, action) => {
    if (action.type !== resetType) return reducer(state, action)

    const defaults = reducer(undefined, { type: STATE_RESET })
    return reducer(setIn(path, getIn(path)(defaults))(state), action)
  },
  ...rest
})
