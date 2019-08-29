import { composeReducers, combineReducers } from './reducers'

describe('reducers', () => {
  const plus = key => (state, { payload }) => ({ [key]: `${state[key]}+${payload}` })
  const minus = key => (state, { payload }) => ({ [key]: `${state[key]}-${payload}` })
  const type = 'TEST_ACTION'
  const action = payload => ({ type, payload })

  describe('composeReducers', () => {
    it('functionally composes reducers, passing both state and action through the chain', () => {
      const reducer = composeReducers(plus('prop'), minus('prop'))
      expect(reducer({ prop: 'init' }, action('data'))).toEqual({
        prop: 'init-data+data'
      })
    })
  })

  describe('combineReducers', () => {
    it('creates object reducer from a set of individual property reducers', () => {
      const reducer = combineReducers({
        plus: plus('a'),
        minus: minus('b')
      })
      expect(reducer({ plus: { a: 'A' }, minus: { b: 'B' } }, action('data'))).toEqual({
        plus: { a: 'A+data' },
        minus: { b: 'B-data' }
      })
    })

    it('recursively applies to inner objects', () => {
      const reducer = combineReducers({
        simple: plus('a'),
        parent: {
          child: minus('b')
        }
      })
      expect(reducer({ simple: { a: 'A' }, parent: { child: { b: 'B' } } }, action('data'))).toEqual({
        simple: { a: 'A+data' },
        parent: { child: { b: 'B-data' } }
      })
    })
  })
})
