import { arrayOfDeferred } from '@redux-saga/deferred'
import { setIn } from '@hon2a/icepick-fp'
import flowRight from 'lodash.flowright'

import { runSagaWithActions } from '../test'
import { splitAsyncActionDuck } from './splitAsyncActionDuck'
import { createDuckFactory } from '../core'
import { testReducerChanges } from '../test/testReducer'
import { ASYNC_ACTION_ID_KEY } from '../sagas'

describe('splitAsyncActionDuck', () => {
  const factory = createDuckFactory('test.duck')
  const TRIGGER_TYPE = 'TRIGGER_ACTION'
  const trigger = (key, payload) => ({
    type: TRIGGER_TYPE,
    payload,
    meta: { key }
  })

  it('performs effect and stores status & results separately for each path', async () => {
    const data = { some: 'data' }
    const error = 'test error'
    const defs = arrayOfDeferred(3)
    let effectCallIdx = 0
    const effect = jest.fn().mockImplementation(() => defs[effectCallIdx++].promise)
    const { TYPE, saga, reducer, getResults, getStatuses, getResult, getStatus } = splitAsyncActionDuck(
      TRIGGER_TYPE,
      ({ meta: { key } }) => key,
      effect
    )(factory)

    expect(TYPE).toBeDefined()

    const initialState = reducer(undefined, { type: 'TEST_INIT' })
    expect(initialState).toEqual({ test: { duck: {} } })
    expect(getResults(initialState)).toEqual({})
    expect(getStatuses(initialState)).toEqual({})
    expect(getResult('some.path')(initialState)).toBeUndefined()
    expect(getStatus('some.path')(initialState)).toEqual({ isPending: false, error: undefined })

    const triggers = [trigger('a', 'first.payload'), trigger('b', 'second.payload'), trigger('a', 'third.payload')]
    const state = { dummy: 'state' }
    const dispatched = await runSagaWithActions(saga, () => state, ...triggers)
    // note that `effect` is called even for all triggers…
    expect(effect).toHaveBeenCalledWith(triggers[0].payload, state, triggers[0])
    expect(effect).toHaveBeenCalledWith(triggers[1].payload, state, triggers[1])
    expect(effect).toHaveBeenCalledWith(triggers[2].payload, state, triggers[2])
    // …but only the latest result is reported when multiple triggers go off before the effect is finished
    await defs[0].resolve({ obsolete: 'data' })
    await defs[2].resolve(data)
    await defs[1].reject(error)
    const expectedActions = [
      { type: TYPE.PENDING, meta: { trigger: triggers[0], [ASYNC_ACTION_ID_KEY]: expect.any(String) } },
      { type: TYPE.PENDING, meta: { trigger: triggers[1], [ASYNC_ACTION_ID_KEY]: expect.any(String) } },
      { type: TYPE.PENDING, meta: { trigger: triggers[2], [ASYNC_ACTION_ID_KEY]: expect.any(String) } },
      { type: TYPE.SUCCESS, payload: data, meta: { trigger: triggers[2], [ASYNC_ACTION_ID_KEY]: expect.any(String) } },
      {
        type: TYPE.FAILURE,
        payload: error,
        meta: { trigger: triggers[1], [ASYNC_ACTION_ID_KEY]: expect.any(String) },
        error: true
      }
    ]
    expect(dispatched).toEqual(expectedActions)

    const step = testReducerChanges(reducer, initialState)
    const expectedChanges = [
      setIn('test.duck.a', { result: undefined, isPending: true, error: undefined }),
      setIn('test.duck.b', { result: undefined, isPending: true, error: undefined }),
      s => s,
      setIn('test.duck.a', { result: data, isPending: false, error: undefined }),
      setIn('test.duck.b', { result: undefined, isPending: false, error })
    ]
    expectedChanges.forEach((expectedChange, idx) => step(expectedActions[idx], expectedChange))

    const finalState = flowRight(...expectedChanges.slice().reverse())(initialState)
    expect(getResults(finalState)).toEqual({ a: data, b: undefined })
    expect(getStatuses(finalState)).toEqual({
      a: { isPending: false, error: undefined },
      b: { isPending: false, error }
    })
    expect(getResult('a')(finalState)).toEqual(data)
    expect(getStatus('b')(finalState)).toEqual({ isPending: false, error })
  })
})
