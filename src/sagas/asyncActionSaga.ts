import { put, call, select } from 'redux-saga/effects'
import { Saga, SagaIterator } from 'redux-saga'

import { AsyncActionMeta, AsyncActionType, Message } from '../types'

export const asyncActionSaga = <M extends Message, Result = unknown>(
  { PENDING, SUCCESS, FAILURE }: AsyncActionType,
  effect: (...args: unknown[]) => Promise<Result>,
  {
    getArgs = (message, state): [unknown | undefined, unknown, M] => [message && message.payload, state, message],
    getMeta = (message): AsyncActionMeta<M> => ({ trigger: message })
  }: {
    getArgs?: (message: M, state?: unknown) => unknown[]
    getMeta?: (message: M, state?: unknown) => AsyncActionMeta<M>
  } = {}
): Saga =>
  function*(message: M): SagaIterator {
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
