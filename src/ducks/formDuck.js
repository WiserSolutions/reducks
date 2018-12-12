import isEqual from 'lodash.isequal'
import merge from 'lodash.merge'
import { freeze } from '@hon2a/icepick-fp'
import { select, call, put, all, takeLatest } from 'redux-saga/effects'

import { combineReducers, composeReducers } from '../core'
import { asyncActionStatusReducer, singleActionReducer } from '../reducers'
import { asyncActionSaga } from '../sagas'

const identity = a => a

/**
 * Creates a duck managing local form state.
 * @param {Object} schema
 * @param {String} RESET action type to trigger form reset (reload of model)
 * @param {Object} options
 *  {Function} options.load load model
 *  {Function} options.save save model
 *  {Function} options.toFormState create form state from loaded model
 *  {Function} options.toModel get model from form state
 *  {Function} options.transformChanges
 * @returns {Function} pass in a duck factory to create the duck
 */
export const formDuck = (
  RESET,
  { load, save = () => {}, toFormState = identity, toModel = identity, transformChanges = identity } = {}
) => ({ defineType, defineAsyncType, createAction, createReducer, createSelector }) => {
  const LOAD = defineAsyncType('LOAD')
  const EDIT = defineType('EDIT')
  const CHANGE = defineType('CHANGE')
  const SUBMIT = defineType('SUBMIT')
  const SAVE = defineAsyncType('SAVE')

  const edit = createAction(EDIT, identity, (payload, { replace = false } = {}) => ({ replace }))
  const submit = createAction(SUBMIT)

  const reducer = createReducer(
    combineReducers({
      formState: composeReducers(
        singleActionReducer(LOAD.SUCCESS, (state, { payload }) => toFormState(payload)),
        singleActionReducer(LOAD.FAILURE, () => toFormState()),
        singleActionReducer(
          EDIT,
          (state, { payload, meta: { replace } }) =>
            replace ? payload : freeze(merge({}, state, transformChanges(payload)))
        )
      ),
      load: asyncActionStatusReducer(LOAD),
      save: asyncActionStatusReducer(SAVE)
    })
  )

  const getFormState = createSelector('formState')
  const getModel = state => toModel(getFormState(state))
  const getLoadStatus = createSelector('load')
  const getSaveStatus = createSelector('save')

  let prevModel
  function* reportModelChanges({ type }) {
    const formState = yield select(getFormState)
    const model = toModel(formState)

    const isChanged = type === EDIT && !isEqual(model, prevModel)
    yield call(() => {
      prevModel = model
    })
    if (!isChanged) return

    yield put({ type: CHANGE, payload: model })
  }

  function* saga() {
    yield all([
      takeLatest(RESET, asyncActionSaga(LOAD, load)),
      takeLatest(SUBMIT, asyncActionSaga(SAVE, save)),
      takeLatest([LOAD.SUCCESS, EDIT], reportModelChanges)
    ])
  }

  return {
    LOAD,
    EDIT,
    CHANGE,
    SUBMIT,
    SAVE,
    edit,
    submit,
    reducer,
    getFormState,
    getModel,
    getLoadStatus,
    getSaveStatus,
    saga
  }
}
