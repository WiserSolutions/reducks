import { getIn, setIn } from '@hon2a/icepick-fp'
import isArray from 'lodash.isarray'

export const STATE_RESET = '__reducks.STATE_RESET__'
export const resetState = (path, resetTypes) => ({ reducer, ...rest }) => {
  const resetTypesArray = isArray(resetTypes) ? resetTypes : [resetTypes]
  return {
    reducer: (state, action) => {
      if (!resetTypesArray.includes(action.type)) return reducer(state, action)

      const defaults = reducer(undefined, { type: STATE_RESET })
      return reducer(setIn(path, getIn(path)(defaults))(state), action)
    },
    ...rest
  }
}
