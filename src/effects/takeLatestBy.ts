import { fork, take, cancel, Effect, ActionPattern } from 'redux-saga/effects'
import { Task } from 'redux-saga'
import { Message } from '../types'

export const takeLatestBy = <
  Pattern extends ActionPattern,
  Fn extends (message: Msg, ...args: Args) => any,
  Msg extends Message = any,
  Args extends any[] = any[]
>(
  patternOrChannel: Pattern,
  getKey: (message: Msg) => string,
  worker: Fn,
  ...args: Args
): Effect =>
  fork(function*() {
    const lastTasksPerKey: Record<string, Task> = {}
    while (true) {
      const message = yield take(patternOrChannel)
      const key = getKey(message)
      const lastTask = lastTasksPerKey[key]

      if (lastTask) yield cancel(lastTask)

      // Somehow `message, ...args` can't be reconciled with `Parameters<Fn>` and I'm not sure how to fix it.
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      lastTasksPerKey[key] = yield fork<Fn>(worker, message, ...args)
    }
  })
