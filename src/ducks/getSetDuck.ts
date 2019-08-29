import { singleActionReducer } from '../reducers'

export const getSetDuck = initialValue => ({ defineType, createAction, createReducer, createSelector }) => {
  const SET = defineType('SET')
  const action = createAction(SET)
  const reducer = createReducer(singleActionReducer(SET, undefined, initialValue))
  const selector = createSelector()
  return { TYPE: SET, action, reducer, selector }
}
