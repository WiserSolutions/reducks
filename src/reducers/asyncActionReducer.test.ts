import { setIn, updateIn } from '@hon2a/icepick-fp'

import { defineAsyncType } from '../core'
import {
  asyncActionFlagReducer,
  asyncActionReducer,
  AsyncActionState,
  asyncActionStatusReducer,
  splitAsyncActionReducer
} from './asyncActionReducer'
import { testReducerChanges } from '../test/testReducer'
import { ActionType } from '../types'

const TYPE = 'SYNC_TYPE'
const ASYNC_TYPE = defineAsyncType('ASYNC_TYPE')
const { PENDING, SUCCESS, FAILURE } = ASYNC_TYPE
const error = 'test error'

describe('asyncActionFlagReducer', () => {
  const reducer = asyncActionFlagReducer(ASYNC_TYPE)

  it('turns on when the action starts', () => {
    expect(reducer(false, { type: PENDING })).toBe(true)
  })

  it('turns off when the action ends', () => {
    expect(reducer(true, { type: SUCCESS })).toBe(false)
    expect(reducer(true, { type: FAILURE })).toBe(false)
  })
})

describe('asyncActionStatusReducer', () => {
  const reducer = asyncActionStatusReducer(ASYNC_TYPE)

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ isPending: false, error }, { type: PENDING })).toEqual({ isPending: true, error })
  })

  it('cleans up on action success', () => {
    expect(reducer({ isPending: true, error }, { type: SUCCESS })).toEqual({
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ isPending: true, error }, { type: FAILURE, payload: newError })).toEqual({
      isPending: false,
      error: newError
    })
  })
})

describe('asyncActionReducer', () => {
  const reducer = asyncActionReducer(ASYNC_TYPE, (state, { payload }) => `${state}+${payload.data}`)
  const result = 'previous data'

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({
      result: undefined,
      isPending: false,
      error: undefined
    })
  })

  it('starts progress but keeps old error on action start', () => {
    expect(reducer({ result, isPending: false, error }, { type: PENDING })).toEqual({
      result,
      isPending: true,
      error
    })
  })

  it('cleans up on action success', () => {
    expect(reducer({ result, isPending: true, error }, { type: SUCCESS, payload: { data: 'new data' } })).toEqual({
      result: `${result}+new data`,
      isPending: false,
      error: undefined
    })
  })

  it('updates error on action failure', () => {
    const newError = 'new error'
    expect(reducer({ result, isPending: true, error }, { type: FAILURE, payload: newError })).toEqual({
      result,
      isPending: false,
      error: newError
    })
  })
})

describe('splitAsyncActionReducer', () => {
  const reducer = splitAsyncActionReducer(ASYNC_TYPE, ({ meta: { path } = { path: 'default.path' } }) => path)
  const message = (type: ActionType, path: string, payload?: any) => ({ type, payload, meta: { path } })
  const result = 'previous data'

  it('inits correctly', () => {
    expect(reducer(undefined, { type: TYPE })).toEqual({})
  })

  it('stores async action state separately for each path', () => {
    const step = testReducerChanges(reducer, {
      first: { result: 'old result', isPending: false, error: undefined }
    })
    step(message(PENDING, 'first'), setIn('first.isPending', true))
    step(message(PENDING, 'maybe.second'), setIn('maybe.second.isPending', true))
    step(
      message(FAILURE, 'maybe.second', error),
      updateIn('maybe.second', (sub: AsyncActionState) => ({ ...sub, isPending: false, error }))
    )
    step(message(TYPE, 'ignored'), s => s)
    step(
      message(SUCCESS, 'first', result),
      updateIn('first', (sub: AsyncActionState) => ({ ...sub, isPending: false, result }))
    )
  })
})
