import { delay, takeLatest } from 'redux-saga/effects'

import { combineReducers, composeReducers } from '../core'
import { asyncActionStatusReducer, singleActionReducer } from '../reducers'
import { asyncActionSaga } from '../sagas'
import { nullishCoalescing } from '../utils/syntax'

const identity = a => a

/**
 * Creates a duck managing remote validation of local form state.
 * @param {Object} form duck (or something else containing `RESET`, `CHANGE` & `SAVE` action types and `getFormState`
 *  selector)
 * @param {Function} validate
 * @param {Object} options
 *  {Number} options.debounceDelay (optional) defaults to 500, use 0 for no debounce
 *  {Function} options.getErrors (optional) unwrap validation error from validation failure action
 *  {Function} options.getSaveErrors (optional) unwrap validation error from save failure action
 * @returns {Function} pass in a duck factory to create the duck
 */
export const formValidationDuck = (
  { LOAD, CHANGE, SAVE },
  validate,
  { debounceDelay = 500, getErrors: getValidationErrors = identity, getSaveErrors = getValidationErrors } = {}
) => ({ defineAsyncType, createReducer, createSelector }) => {
  const VALIDATE = defineAsyncType('VALIDATE')

  const reducer = createReducer(
    combineReducers({
      errors: composeReducers(
        singleActionReducer(LOAD.SUCCESS, () => []),
        singleActionReducer(VALIDATE.SUCCESS, () => []),
        singleActionReducer(VALIDATE.FAILURE, (state, { payload }) => nullishCoalescing(getValidationErrors(payload), state)),
        singleActionReducer(SAVE.FAILURE, (state, { payload }) => nullishCoalescing(getSaveErrors(payload), state))
      ),
      status: asyncActionStatusReducer(VALIDATE)
    })
  )

  const getErrors = createSelector('errors')
  const getStatus = createSelector('status')

  const validateSaga = asyncActionSaga(VALIDATE, validate)
  function* saga() {
    yield takeLatest(CHANGE, function* validateDebounced(...args) {
      if (debounceDelay) {
        yield delay(debounceDelay)
      }
      yield* validateSaga(...args)
    })
  }

  return { reducer, getErrors, getStatus, saga }
}
