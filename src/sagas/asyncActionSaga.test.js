import { put, call, select } from 'redux-saga/effects'

import { defineAsyncType } from '../core'
import { asyncActionSaga } from './asyncActionSaga'
import { runIteratorToEnd } from '../test'

describe('asyncActionSaga', () => {
  const asyncType = defineAsyncType('TEST')
  const effect = jest.fn()
  const saga = asyncActionSaga(asyncType, effect)
  const trigger = { payload: 'payload' }
  const state = { dummy: 'state' }

  beforeEach(() => {
    effect.mockReset()
  })

  it('yields `PENDING` action, effect call, and `SUCCESS` action on success', () => {
    const result = 'result'
    expect(runIteratorToEnd(saga(trigger), [undefined, state, undefined, result])).toEqual([
      select(),
      put({ type: asyncType.PENDING, meta: { trigger } }),
      call(effect, trigger.payload, state, trigger),
      put({ type: asyncType.SUCCESS, payload: result, meta: { trigger } })
    ])
  })

  it('yields `PENDING` action, effect call, and `FAILURE` action on error', () => {
    const error = new Error()
    expect(runIteratorToEnd(saga(trigger), [undefined, state, undefined, error])).toEqual([
      select(),
      put({ type: asyncType.PENDING, meta: { trigger } }),
      call(effect, trigger.payload, state, trigger),
      put({ type: asyncType.FAILURE, payload: error, meta: { trigger }, error: true })
    ])
  })
})
