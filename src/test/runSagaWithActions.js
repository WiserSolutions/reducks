import EventEmitter from 'events'
import { runSaga, stdChannel } from 'redux-saga'

export async function runSagaWithActions(saga, getState = () => {}, ...actions) {
  const dispatched = []

  const emitter = new EventEmitter()
  const channel = stdChannel()
  emitter.on('action', channel.put)

  const emitAction = (action) => emitter.emit('action', action)

  const testIO = {
    channel,
    dispatch: action => emitAction(action) && dispatched.push(action),
    getState
  }

  await runSaga(testIO, saga)

  actions.forEach(emitAction)

  return dispatched
}
