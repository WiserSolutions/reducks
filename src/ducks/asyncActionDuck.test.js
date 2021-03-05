import { arrayOfDeferred } from '@redux-saga/deferred'

import { runSagaWithActions } from '../test'
import { asyncActionDuck } from './asyncActionDuck'
import { createDuckFactory } from '../core'
import { ASYNC_ACTION_ID_KEY } from '../sagas'

describe('asyncActionDuck', () => {
  const factory = createDuckFactory('test.duck')
  const TRIGGER_TYPE = 'TRIGGER_ACTION'
  const trigger = payload => ({
    type: TRIGGER_TYPE,
    payload
  })

  it("performs effect on latest trigger, stores both the result and the effect's async status", async () => {
    const data = { some: 'data' }
    const defs = arrayOfDeferred(2)
    let idx = 0
    const effect = jest.fn().mockImplementation(() => defs[idx++].promise)
    const { TYPE, saga, reducer, getResult, getStatus } = asyncActionDuck(TRIGGER_TYPE, effect)(factory)

    expect(TYPE).toBeDefined()

    const initialValue = reducer(undefined, { type: 'OTHER_ACTION' })
    expect(getResult(initialValue)).toBeUndefined()
    expect(getStatus(initialValue)).toEqual({ isPending: false, error: undefined })

    const triggers = [trigger('first.payload'), trigger('second.payload')]
    const state = { dummy: 'state' }
    const dispatched = await runSagaWithActions(saga, () => state, ...triggers)
    const meta = { trigger: triggers[1], [ASYNC_ACTION_ID_KEY]: expect.any(String) }
    // note that `effect` is called twice, because the first one goes off before the second trigger is consumed…
    expect(effect).toHaveBeenCalledWith(triggers[0].payload, state, triggers[0])
    expect(effect).toHaveBeenCalledWith(triggers[1].payload, state, triggers[1])
    // …but only the latest result is reported when multiple triggers go off before the effect is finished
    await defs[0].resolve({ obsolete: 'data' })
    await defs[1].resolve(data)
    expect(dispatched).toEqual([
      { type: TYPE.PENDING, meta: { trigger: triggers[0], [ASYNC_ACTION_ID_KEY]: expect.any(String) } },
      { type: TYPE.PENDING, meta },
      { type: TYPE.SUCCESS, payload: data, meta }
    ])

    const loadingValue = reducer(initialValue, { type: TYPE.PENDING })
    expect(getStatus(loadingValue)).toEqual({ isPending: true, error: undefined })

    const loadedValue = reducer(loadingValue, { type: TYPE.SUCCESS, payload: data })
    expect(getResult(loadedValue)).toEqual(data)
    expect(getStatus(loadedValue)).toEqual({ isPending: false, error: undefined })
  })
})
