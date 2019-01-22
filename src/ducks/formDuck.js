import isEqual from 'lodash.isequal'
import isArray from 'lodash.isarray'
import isObject from 'lodash.isobject'
import icepick from 'icepick'
import { freeze, merge } from '@hon2a/icepick-fp'
import { select, call, put, all, takeLatest } from 'redux-saga/effects'

import { combineReducers, composeReducers } from '../core'
import { asyncActionStatusReducer, singleActionReducer } from '../reducers'
import { asyncActionSaga } from '../sagas'

const identity = a => a

export const mergeFormState = (state, changes) =>
  merge(changes, function mergeFormStateArray(targetVal, sourceVal) {
    if (!isArray(sourceVal) || !isArray(targetVal)) return sourceVal
    return icepick.map((val, idx) => {
      const oldVal = targetVal[idx]
      if (val === undefined) return oldVal
      if (!isObject(val) || !isObject(oldVal)) return val
      return merge(val, mergeFormStateArray)(oldVal)
    }, sourceVal)
  })(state)

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
 *  {Function} options.applyChanges
 * @returns {Function} pass in a duck factory to create the duck
 */
export const formDuck = (
  RESET,
  {
    load,
    save = () => {},
    toFormState = identity,
    toModel = identity,
    transformChanges = identity,
    applyChanges = mergeFormState
  } = {}
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
        singleActionReducer(EDIT, (state, { payload, meta: { replace } }) =>
          freeze(replace ? payload : applyChanges(state, transformChanges(payload, state)))
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
