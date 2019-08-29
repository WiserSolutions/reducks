import { all, fork, take } from 'redux-saga/effects'

function* takeOneHelper(patternOrChannel, worker, ...args) {
  const action = yield take(patternOrChannel)
  yield fork(worker, ...args, action)
}
export const takeOne = (...args) => fork(takeOneHelper, ...args)

export function composeSagas(...sagas) {
  return function*() {
    yield all(
      sagas
        .slice()
        .reverse()
        .map(fork)
    )
  }
}
