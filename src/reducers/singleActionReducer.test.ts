import { singleActionReducer } from './singleActionReducer'
import { messageOfType } from '../test'

type State = Record<string, any>
const reduce = (key: string) => (state: State | undefined, { payload }: { payload: any }) => ({
  [key]: `${state ? state[key] : ''}+${payload}`
})
const type = 'TEST_ACTION'
const message = messageOfType(type)

describe('singleActionReducer', () => {
  it('maps payload of the given single action type to state by default', () => {
    const reducer = singleActionReducer(type)
    expect(reducer('original', message('data'))).toEqual('data')
  })

  it('combines state with actions of the given type if provided a reducer', () => {
    const reducer = singleActionReducer(type, reduce('prop'))
    expect(reducer({ prop: 'original' }, message('data'))).toEqual({ prop: 'original+data' })
  })

  it('sets initial value when supplied', () => {
    const reducer = singleActionReducer(type, reduce('prop'), { prop: 'original' })
    expect(reducer(undefined, message('data'))).toEqual({ prop: 'original+data' })
  })

  it('ignores other actions', () => {
    const reducer = singleActionReducer(type)
    const state = { prop: 'original' }
    expect(reducer(state, { type: 'OTHER_ACTION', payload: 'data' })).toBe(state)
  })
})
