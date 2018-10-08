import { put, call } from 'redux-saga/effects'

export const asyncActionSaga = (
  { PENDING, SUCCESS, FAILURE },
  effect,
  { getArgs = ({ payload } = {}) => [payload], getMeta = action => ({ trigger: action }) } = {}
) =>
  function*(action) {
    const meta = getMeta(action)
    yield put({ type: PENDING, meta })
    try {
      const data = yield call(effect, ...getArgs(action))
      yield put({ type: SUCCESS, payload: data, meta })
    } catch (error) {
      yield put({ type: FAILURE, payload: error, meta })
    }
  }
