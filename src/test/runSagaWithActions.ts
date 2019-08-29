import { runSaga, stdChannel, Saga } from 'redux-saga'

import { Message } from '../types'

export async function runSagaWithActions(saga: Saga, getState = () => {}, ...messages: Message[]) {
  const dispatched: Message[] = []
  const channel = stdChannel()

  await runSaga(
    {
      channel,
      dispatch(message: Message) {
        dispatched.push(message)
        channel.put(message)
      },
      getState
    },
    saga
  )

  for (let i = 0, l = messages.length; i < l; ++i) {
    await Promise.resolve(channel.put(messages[i]))
  }

  return dispatched
}
