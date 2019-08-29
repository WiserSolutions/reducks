import { fork, take, cancel } from 'redux-saga/effects'

export const takeLatestBy = (patternOrChannel, getKey, worker, ...args) =>
  fork(function*() {
    const lastTasksPerKey = {}
    while (true) {
      const action = yield take(patternOrChannel)
      const key = getKey(action)
      const lastTask = lastTasksPerKey[key]

      if (lastTask) yield cancel(lastTask)

      lastTasksPerKey[key] = yield fork(worker, ...args.concat(action))
    }
  })
