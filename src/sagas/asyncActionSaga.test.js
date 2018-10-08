import { put, call } from 'redux-saga/effects'

import { defineAsyncType } from '../core'
import { asyncActionSaga } from './asyncActionSaga'
import { runIteratorToEnd } from '../test'

describe('asyncActionSaga', () => {
  const asyncType = defineAsyncType('TEST')
  const effect = jest.fn()
  const saga = asyncActionSaga(asyncType, effect)
  const trigger = { payload: 'payload' }

  beforeEach(() => {
    effect.mockReset()
  })

  it('yields `PENDING` action, effect call, and `SUCCESS` action on success', () => {
    const result = 'result'
    expect(runIteratorToEnd(saga(trigger), [undefined, undefined, result])).toEqual([
      put({ type: asyncType.PENDING, meta: { trigger } }),
      call(effect, trigger.payload),
      put({ type: asyncType.SUCCESS, payload: result, meta: { trigger } })
    ])
  })

  it('yields `PENDING` action, effect call, and `FAILURE` action on error', () => {
    const error = new Error()
    expect(runIteratorToEnd(saga(trigger), [undefined, undefined, error])).toEqual([
      put({ type: asyncType.PENDING, meta: { trigger } }),
      call(effect, trigger.payload),
      put({ type: asyncType.FAILURE, payload: error, meta: { trigger } })
    ])
  })
})
