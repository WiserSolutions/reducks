import { put, call, select } from 'redux-saga/effects'

import { AsyncActionMeta, AsyncActionType, Message } from '../types'

export const asyncActionSaga = <M extends Message>(
  { PENDING, SUCCESS, FAILURE }: AsyncActionType,
  effect: (...args: any[]) => Promise<any>,
  {
    getArgs = (message, state) => [message && message.payload, state, message],
    getMeta = message => ({ trigger: message })
  }: {
    getArgs?: (message: M, state?: unknown) => unknown[]
    getMeta?: (message: M, state?: unknown) => AsyncActionMeta<M>
  } = {}
) =>
  function*(message: M) {
    const state = yield select()
    const meta = getMeta(message, state)
    yield put({ type: PENDING, meta })
    try {
      const data = yield call(effect, ...getArgs(message, state))
      yield put({ type: SUCCESS, payload: data, meta })
    } catch (error) {
      yield put({ type: FAILURE, payload: error, meta, error: true })
    }
  }
