import { select, call, takeEvery } from 'redux-saga/effects'
import isNil from 'lodash.isnil'

import { STATE_RESET } from '../utils'

/**
 * Creates a duck that initializes part of the state from external storage and saves updates of that part to the same.
 * @param {{get: Function, set: Function}} storage
 * @param {'*'|Array<String>} triggers (optional)
 * @param {Array<String>} resetTriggers (optional)
 * @returns {Function} pass in a duck factory to create the duck
 */
export const persistenceDuck = (storage, triggers = '*', resetTriggers = [STATE_RESET]) => ({
  createReducer,
  createSelector,
  getPath
}) => {
  const selector = createSelector()
  const storageKey = getPath().join('.')

  let isInitialized = false
  const reducer = (state, action) => {
    if (isInitialized && !resetTriggers.includes(action?.type)) return state
    isInitialized = true
    const initialValue = storage.get(storageKey)
    // only touch state if there's something to change (touch creates path and might prevent default initialization)
    return isNil(initialValue) ? state : createReducer(() => initialValue)(state)
  }

  function* saveToStorage() {
    const value = yield select(selector)
    yield call(storage.set, storageKey, value)
  }
  function* saga() {
    yield takeEvery(triggers, saveToStorage)
  }

  return { reducer, saga }
}
