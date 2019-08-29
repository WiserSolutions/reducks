import { singleActionReducer } from './singleActionReducer'

const reduce = key => (state, { payload }) => ({ [key]: `${state[key]}+${payload}` })
const type = 'TEST_ACTION'
const action = payload => ({ type, payload })

describe('singleActionReducer', () => {
  it('maps payload of the given single action type to state by default', () => {
    const reducer = singleActionReducer(type)
    expect(reducer('original', action('data'))).toEqual('data')
  })

  it('combines state with actions of the given type if provided a reducer', () => {
    const reducer = singleActionReducer(type, reduce('prop'))
    expect(reducer({ prop: 'original' }, action('data'))).toEqual({ prop: 'original+data' })
  })

  it('sets initial value when supplied', () => {
    const reducer = singleActionReducer(type, reduce('prop'), { prop: 'original' })
    expect(reducer(undefined, action('data'))).toEqual({ prop: 'original+data' })
  })

  it('ignores other actions', () => {
    const reducer = singleActionReducer(type)
    const state = { prop: 'original' }
    expect(reducer(state, { type: 'OTHER_ACTION', payload: 'data' })).toBe(state)
  })
})
