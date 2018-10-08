import { runSaga } from 'redux-saga'

export async function runSagaWithActions(saga, getState = () => {}, ...actions) {
  const dispatched = []
  let handleAction
  await runSaga(
    {
      subscribe: callback => {
        handleAction = callback
        actions.forEach(handleAction)
        return () => {}
      },
      dispatch: action => {
        dispatched.push(action)
        handleAction(action)
      },
      getState
    },
    saga
  )
  return dispatched
}
