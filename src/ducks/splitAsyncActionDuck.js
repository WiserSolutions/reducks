import mapValues from 'lodash.mapvalues'
import flowRight from 'lodash.flowright'
import { getIn } from '@hon2a/icepick-fp'

import { asyncActionSaga } from '../sagas'
import { takeLatestBy } from '../effects'
import { splitAsyncActionReducer } from '../reducers'

export const splitAsyncActionDuck = (TRIGGER, getKey, effect, reduce) => duckFactory => {
  const TYPE = duckFactory.defineAsyncType('EFFECT')

  const reducer = duckFactory.createReducer(
    splitAsyncActionReducer(TYPE, action => getKey(action.meta.trigger), reduce)
  )

  const selector = duckFactory.createSelector()
  const resultSelector = getIn('result')
  const statusSelector = ({ isPending = false, error } = {}) => ({ isPending, error })
  const getResults = state => mapValues(selector(state), resultSelector)
  const getStatuses = state => mapValues(selector(state), statusSelector)
  const getResult = path => flowRight(resultSelector, getIn(path), selector)
  const getStatus = path => flowRight(statusSelector, getIn(path), selector)

  function* saga() {
    yield takeLatestBy(TRIGGER, getKey, asyncActionSaga(TYPE, effect))
  }

  return { TYPE, saga, reducer, getResults, getStatuses, getResult, getStatus }
}
