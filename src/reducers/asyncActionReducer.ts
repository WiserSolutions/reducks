import { updateIn } from '@hon2a/icepick-fp'

import { combineReducers, composeReducers } from '../core'
import { singleActionReducer } from './singleActionReducer'
import { flagReducer } from './flagReducer'
import { AsyncActionType, Message } from '../types'
import { Reducer } from 'redux'

export const asyncActionFlagReducer = ({ PENDING, SUCCESS, FAILURE }: AsyncActionType): Reducer<boolean> =>
  flagReducer([PENDING], [SUCCESS, FAILURE])

export type AsyncActionStatus<Error = any> = {
  isPending: boolean
  error: Error
}
const status = <Error = any>(type: AsyncActionType): { isPending: Reducer<boolean>; error: Reducer<Error> } => ({
  isPending: asyncActionFlagReducer(type),
  error: composeReducers(singleActionReducer(type.FAILURE), singleActionReducer(type.SUCCESS, () => undefined))
})
export const asyncActionStatusReducer = (type: AsyncActionType): Reducer<AsyncActionStatus> =>
  combineReducers(status(type))

export type AsyncActionState<Result = any, Error = any> = AsyncActionStatus<Error> & {
  result: Result
}
export const asyncActionReducer = <Type extends AsyncActionType = AsyncActionType, Result = any, Error = any>(
  type: Type,
  reduce?: Reducer<Result>,
  initialValue?: Result
): Reducer<AsyncActionState<Result, Error>> =>
  combineReducers({
    result: singleActionReducer(type.SUCCESS, reduce, initialValue),
    ...status(type)
  })

export const splitAsyncActionReducer = <Result = any>(
  type: AsyncActionType,
  getPath: (message: Message<typeof type[keyof typeof type]>) => string,
  reduce?: Reducer<Result>
): Reducer<Record<string, AsyncActionState<Result>>> => {
  const reducer = asyncActionReducer(type, reduce)
  return (state = {}, message): Record<string, AsyncActionState<Result>> =>
    [type.PENDING, type.SUCCESS, type.FAILURE].includes(message.type)
      ? updateIn(
          getPath(message as Message<typeof type[keyof typeof type]>),
          (subState: AsyncActionState<Result> | undefined) => reducer(subState, message)
        )(state)
      : state
}
