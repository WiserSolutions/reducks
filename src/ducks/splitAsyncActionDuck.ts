import mapValues from 'lodash.mapvalues'
import flowRight from 'lodash.flowright'
import { getIn } from '@hon2a/icepick-fp'
import { ActionPattern, Effect, Saga } from '@redux-saga/types'
import { Reducer } from 'redux'

import { asyncActionSaga } from '../sagas'
import { takeLatestBy } from '../effects'
import { AsyncActionState, AsyncActionStatus, splitAsyncActionReducer } from '../reducers'
import { AsyncActionType, DuckFactory, Message, Path, Selector } from '../types'

export const splitAsyncActionDuck = <GlobalState extends object = any, StateBit = any, Key extends string = string>(
  TRIGGER: ActionPattern,
  getKey: (trigger: Message) => Key,
  effect: (...args: unknown[]) => Promise<StateBit>
) => (
  duckFactory: DuckFactory<GlobalState, Record<Key, AsyncActionState<StateBit>>>
): {
  TYPE: AsyncActionType
  saga: Saga
  reducer: Reducer<GlobalState>
  getResults: (state: GlobalState) => Record<Key, StateBit>
  getStatuses: (state: GlobalState) => Record<Key, AsyncActionStatus>
  getResult: (path: Path) => Selector<GlobalState, StateBit>
  getStatus: (path: Path) => Selector<GlobalState, AsyncActionStatus>
} => {
  const TYPE = duckFactory.defineAsyncType('EFFECT')

  const reducer = duckFactory.createReducer(splitAsyncActionReducer(TYPE, action => getKey(action.meta.trigger)))

  const selector = duckFactory.createSelector<Record<Key, AsyncActionState<StateBit>>>()
  const resultSelector = getIn('result')
  const statusSelector = ({ isPending = false, error = undefined } = {}): AsyncActionStatus => ({ isPending, error })
  const getResults = (state: GlobalState): Record<Key, StateBit> => mapValues(selector(state), resultSelector)
  const getStatuses = (state: GlobalState): Record<Key, AsyncActionStatus> =>
    mapValues<Record<Key, AsyncActionState<StateBit>>, AsyncActionStatus>(selector(state), statusSelector)
  const getResult = (path: Path): Selector<GlobalState, StateBit> =>
    flowRight(
      resultSelector,
      getIn(path),
      selector
    )
  const getStatus = (path: Path): Selector<GlobalState, AsyncActionStatus> =>
    flowRight(
      statusSelector,
      getIn(path),
      selector
    )

  function* saga(): IterableIterator<Effect> {
    yield takeLatestBy(TRIGGER, getKey, asyncActionSaga(TYPE, effect))
  }

  return { TYPE, saga, reducer, getResults, getStatuses, getResult, getStatus }
}
