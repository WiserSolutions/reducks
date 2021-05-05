import { put, call, select } from 'redux-saga/effects'
import uniqueId from 'lodash.uniqueid'
import { setIn } from '@hon2a/icepick-fp'

export const ASYNC_ACTION_ID_KEY = '__asyncActionId'

export const asyncActionSaga = (
  { PENDING, SUCCESS, FAILURE },
  effect,
  { getArgs = (action, state) => [action?.payload, state, action], getMeta = action => ({ trigger: action }) } = {}
) =>
  function* (action) {
    const state = yield select()
    const meta = setIn(ASYNC_ACTION_ID_KEY, uniqueId('asyncActionId-'))(getMeta(action, state) ?? {})
    yield put({ type: PENDING, meta })
    try {
      const data = yield call(effect, ...getArgs(action, state))
      yield put({ type: SUCCESS, payload: data, meta })
    } catch (error) {
      yield put({ type: FAILURE, payload: error, meta, error: true })
    }
  }
