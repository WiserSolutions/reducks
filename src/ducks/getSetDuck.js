import { singleActionReducer } from '../reducers'

export const getSetDuck = initialValue => ({ defineType, createAction, createReducer, createSelector }) => {
  const type = defineType('SET')
  const action = createAction(type)
  const reducer = createReducer(singleActionReducer(type, undefined, initialValue))
  const selector = createSelector()
  return { type, action, reducer, selector }
}
