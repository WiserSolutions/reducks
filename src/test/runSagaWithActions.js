import EventEmitter from 'events'
import { runSaga, stdChannel } from 'redux-saga'

export async function runSagaWithActions(saga, getState = () => {}, ...actions) {
  const dispatched = []

  const emitter = new EventEmitter()
  const channel = stdChannel()
  emitter.on('action', channel.put)

  const testIO = {
    channel,
    dispatch: action => emitter.emit('action', action) && dispatched.push(action),
    getState
  }

  await runSaga(testIO, saga)

  actions.forEach(action => testIO.dispatch(action))

  return dispatched
}
