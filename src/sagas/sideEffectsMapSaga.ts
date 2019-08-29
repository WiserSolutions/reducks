import { takeEvery, select, call } from 'redux-saga/effects'

export const sideEffectsMapSaga = typeToSideEffectMap =>
  function*() {
    yield takeEvery(Object.keys(typeToSideEffectMap), function* performSideEffect(action) {
      const { type, payload } = action
      const sideEffect = typeToSideEffectMap[type]
      const stateIfNeeded = sideEffect.length > 2 ? yield select() : undefined
      yield call(sideEffect, payload, action, stateIfNeeded)
    })
  }
