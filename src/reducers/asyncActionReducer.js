import { updateIn } from '@hon2a/icepick-fp'

import { combineReducers, composeReducers } from '../core'
import { singleActionReducer } from './singleActionReducer'
import { flagReducer } from './flagReducer'

export const asyncActionFlagReducer = ({ PENDING, SUCCESS, FAILURE }) => flagReducer([PENDING], [SUCCESS, FAILURE])

const status = type => ({
  isPending: asyncActionFlagReducer(type),
  error: composeReducers(singleActionReducer(type.FAILURE), singleActionReducer(type.SUCCESS, () => undefined))
})
export const asyncActionStatusReducer = type => combineReducers(status(type))

export const asyncActionReducer = (type, reduce, initialValue) =>
  combineReducers({
    result: singleActionReducer(type.SUCCESS, reduce, initialValue),
    ...status(type)
  })

export const splitAsyncActionReducer = (type, getPath, reduce) => {
  const reducer = asyncActionReducer(type, reduce)
  return (state = {}, action) =>
    [type.PENDING, type.SUCCESS, type.FAILURE].includes(action.type)
      ? updateIn(getPath(action), subState => reducer(subState, action))(state)
      : state
}
