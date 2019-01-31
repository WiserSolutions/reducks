import isEqual from 'lodash.isequal'
import isArray from 'lodash.isarray'
import isObject from 'lodash.isobject'
import icepick from 'icepick'
import { merge, assign } from '@hon2a/icepick-fp'
import { select, put, all, takeLatest } from 'redux-saga/effects'

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
 *  {String|Array<String>>} options.CLEAR action type(s)
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
    applyChanges = mergeFormState,
    CLEAR = []
  } = {}
) => ({ defineType, defineAsyncType, createAction, createReducer, createSelector }) => {
  const LOAD = defineAsyncType('LOAD')
  const EDIT = defineType('EDIT')
  const CHANGE = defineType('CHANGE')
  const SUBMIT = defineType('SUBMIT')
  const SAVE = defineAsyncType('SAVE')

  const edit = createAction(EDIT, identity, (payload, { replace = false } = {}) => ({ replace }))
  const submit = createAction(SUBMIT)

  const CLEAR_TRIGGERS = isArray(CLEAR) ? CLEAR : [CLEAR]
  const pureAssignReducer = (types, getUpdate) => (state, action) =>
    types.includes(action.type) ? assign(getUpdate(action))(state) : state
  const reducer = createReducer(
    composeReducers(
      pureAssignReducer([LOAD.SUCCESS], ({ payload: model }) => ({ model, formState: toFormState(model) })),
      pureAssignReducer([LOAD.FAILURE, ...CLEAR_TRIGGERS], () => ({ model: undefined, formState: undefined })),
      singleActionReducer(EDIT, (state, { payload, meta: { replace } }) => {
        const formState = replace ? payload : applyChanges(state.formState, transformChanges(payload, state.formState))
        return assign({ model: toModel(formState, state.model), formState })(state)
      }),
      combineReducers({
        load: asyncActionStatusReducer(LOAD),
        save: asyncActionStatusReducer(SAVE)
      })
    )
  )

  const getFormState = createSelector('formState')
  const getModel = createSelector('model')
  const getLoadStatus = createSelector('load')
  const getSaveStatus = createSelector('save')

  let prevModel
  function* reportModelChanges({ type }) {
    const model = yield select(getModel)
    const isChange = type === EDIT && !isEqual(model, prevModel)

    prevModel = model
    if (isChange) yield put({ type: CHANGE, payload: model })
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
