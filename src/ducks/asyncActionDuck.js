import { takeLatest } from 'redux-saga/effects'

import { asyncActionReducer } from '../reducers'
import { asyncActionSaga } from '../sagas'
import { asyncActionStatusSelector } from '../selectors'
import { combineSelectors } from '../core'

/**
 * Creates a duck managing fetching data on given trigger storing both the data and the loading state.
 * @param {String|Array<String>} TRIGGER trigger action type(s)
 * @param {Function} effect
 * @returns {Function} pass in a duck factory to create the duck
 */
export const asyncActionDuck = (TRIGGER, effect) => duckFactory => {
  const { defineAsyncType, createReducer, createSelector } = duckFactory

  const TYPE = defineAsyncType('EFFECT')

  const reducer = createReducer(asyncActionReducer(TYPE))

  const getResult = createSelector('result')
  const getStatus = combineSelectors({
    isPending: createSelector('isPending'),
    error: createSelector('error')
  })

  function* saga() {
    yield takeLatest(TRIGGER, asyncActionSaga(TYPE, effect))
  }

  return { TYPE, saga, reducer, getResult, getStatus }
}
