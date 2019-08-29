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

  for (let i = 0, l = actions.length; i < l; ++i) {
    await Promise.resolve(channel.put(actions[i]))
  }

  return dispatched
}
