import { runSaga, stdChannel } from 'redux-saga'

export async function runSagaWithActions(saga, getState = () => {}, ...actions) {
  const dispatched = []
  const channel = stdChannel()

  await runSaga(
    {
      channel,
      dispatch(action) {
        dispatched.push(action)
        channel.put(action)
      },
      getState
    },
    saga
  )

  actions.forEach(channel.put)

  return dispatched
}
