import { defineAsyncType } from '../core'
import { asyncActionFlagReducer, asyncActionReducer, asyncActionStatusReducer } from './asyncActionReducer'

const type = 'TEST_ACTION'
const action = payload => ({ type, payload })
const asyncType = defineAsyncType('TEST_ACTION')
const error = 'test error'

describe('asyncActionFlagReducer', () => {
  const reducer = asyncActionFlagReducer(asyncType)

  it('turns on when the action starts', () => {
    expect(reducer(false, { type: asyncType.PENDING })).toBe(true)
  })

  it('turns off when the action ends', () => {
    expect(reducer(true, { type: asyncType.SUCCESS })).toBe(false)
    expect(reducer(true, { type: asyncType.FAILURE })).toBe(false)
  })
})

describe('asyncActionStatusReducer', () => {
  const reducer = asyncActionStatusReducer(asyncType)

  it('inits correctly', () => {
    expect(reducer(undefined, action)).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ isPending: false, error }, { type: asyncType.PENDING })).toEqual({ isPending: true, error })
  })

  it('cleans up on action success', () => {
    expect(reducer({ isPending: true, error }, { type: asyncType.SUCCESS })).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ isPending: true, error }, { type: asyncType.FAILURE, payload: newError })).toEqual({
      isPending: false,
      error: newError
    })
  })
})

describe('asyncActionReducer', () => {
  const reducer = asyncActionReducer(asyncType, (state, { payload }) => `${state}+${payload.data}`)
  const result = 'previous data'

  it('inits correctly', () => {
    expect(reducer(undefined, action)).toEqual({
      result: undefined,
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ result, isPending: false, error }, { type: asyncType.PENDING })).toEqual({
      result,
      isPending: true,
      error
    })
  })

  it('cleans up on action success', () => {
    expect(
      reducer({ result, isPending: true, error }, { type: asyncType.SUCCESS, payload: { data: 'new data' } })
    ).toEqual({
      result: `${result}+new data`,
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ result, isPending: true, error }, { type: asyncType.FAILURE, payload: newError })).toEqual({
      result,
      isPending: false,
      error: newError
    })
  })
})
