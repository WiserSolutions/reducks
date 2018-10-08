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
