import { select, call, takeEvery } from 'redux-saga/effects'
import { setIn } from '@hon2a/icepick-fp'

/**
 * Creates a duck that initializes part of the state from external storage and saves updates of that part to the same.
 * @param {{get: Function, set: Function}} storage
 * @param {String|Array<String>} path
 * @param {'*'|Array<String>} triggers (optional)
 * @returns {Function} pass in a duck factory to create the duck
 */
export const persistenceDuck = (storage, path, triggers = '*') => ({ createReducer, createSelector, getPath }) => {
  const selector = createSelector(path)
  const storageKey = getPath(path).join('.')

  let isInitialized = false
  const reducer = createReducer(state => {
    if (isInitialized) return state
    isInitialized = true
    const initialValue = storage.get(storageKey)
    return initialValue === null ? state : setIn(path, initialValue)(state || {})
  })

  function* saveToStorage() {
    const value = yield select(selector)
    yield call(storage.set, storageKey, value)
  }
  function* saga() {
    yield takeEvery(triggers, saveToStorage)
  }

  return { reducer, saga }
}
