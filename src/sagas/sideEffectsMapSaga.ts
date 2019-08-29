import { takeEvery, select, call } from 'redux-saga/effects'

import { Message, ActionType } from '../types'

export const sideEffectsMapSaga = (
  typeToSideEffectMap: Record<ActionType, (payload: any, message: Message, state: any) => any>
) =>
  function*() {
    yield takeEvery(Object.keys(typeToSideEffectMap), function* performSideEffect(message: Message) {
      const { type, payload } = message
      const sideEffect = typeToSideEffectMap[type]
      const stateIfNeeded = sideEffect.length > 2 ? yield select() : undefined
      yield call(sideEffect, payload, message, stateIfNeeded)
    })
  }
