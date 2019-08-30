import { takeEvery, select, call, Effect } from 'redux-saga/effects'
import { Saga, SagaIterator } from 'redux-saga'

import { Message, ActionType } from '../types'

export const sideEffectsMapSaga = (
  typeToSideEffectMap: Record<ActionType, (payload: unknown, message: Message, state: unknown) => Effect>
): Saga =>
  function*(): SagaIterator {
    yield takeEvery(Object.keys(typeToSideEffectMap), function* performSideEffect(message: Message) {
      const { type, payload } = message
      const sideEffect = typeToSideEffectMap[type]
      const stateIfNeeded = sideEffect.length > 2 ? yield select() : undefined
      yield call(sideEffect, payload, message, stateIfNeeded)
    })
  }
