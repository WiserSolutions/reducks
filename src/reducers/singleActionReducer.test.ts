import { singleActionReducer } from './singleActionReducer'
import { message } from '../test'

type State = Record<string, any>
const reduce = (key: string) => (state: State | undefined, { payload }: { payload: any }) => ({
  [key]: `${state ? state[key] : ''}+${payload}`
})
const type = 'TEST_ACTION'
const testMessage = (payload: any) => message(type, payload)

describe('singleActionReducer', () => {
  it('maps payload of the given single action type to state by default', () => {
    const reducer = singleActionReducer(type)
    expect(reducer('original', testMessage('data'))).toEqual('data')
  })

  it('combines state with actions of the given type if provided a reducer', () => {
    const reducer = singleActionReducer(type, reduce('prop'))
    expect(reducer({ prop: 'original' }, testMessage('data'))).toEqual({ prop: 'original+data' })
  })

  it('sets initial value when supplied', () => {
    const reducer = singleActionReducer(type, reduce('prop'), { prop: 'original' })
    expect(reducer(undefined, testMessage('data'))).toEqual({ prop: 'original+data' })
  })

  it('ignores other actions', () => {
    const reducer = singleActionReducer(type)
    const state = { prop: 'original' }
    expect(reducer(state, { type: 'OTHER_ACTION', payload: 'data' })).toBe(state)
  })
})
