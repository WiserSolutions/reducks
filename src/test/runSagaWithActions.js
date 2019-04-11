import { runSaga, stdChannel } from 'redux-saga'

export async function runSagaWithActions(saga, getState = () => {}, ...actions) {
  const dispatched = []

  const channel = stdChannel()

  const testIO = {
    channel,
    dispatch: action => dispatched.push(action) && channel.put(action),
    getState
  }

  await runSaga(testIO, saga)

  actions.forEach(channel.put)

  return dispatched
}
