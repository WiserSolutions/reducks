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

    it('passes additional arguments to sub-reducers if any are supplied', () => {
      const first = jest.fn().mockImplementation(plus('prop'))
      const second = jest.fn().mockImplementation(minus('prop'))
      const reducer = composeReducers(first, second)
      const anotherArg = { some: 'otherData' }
      const initialState = { prop: 'init' }
      const msg = action('data')
      reducer(initialState, msg, anotherArg)
      expect(second).toHaveBeenCalledWith(initialState, msg, anotherArg)
      expect(first).toHaveBeenCalledWith(minus('prop')(initialState, msg), msg, anotherArg)
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

    it('passes additional arguments to sub-selectors', () => {
      const a = jest.fn().mockImplementation(plus('a'))
      const b = jest.fn().mockImplementation(minus('b'))
      const reducer = combineReducers({
        simple: a,
        parent: {
          child: b
        }
      })
      const initialState = { simple: { a: 'A' }, parent: { child: { b: 'B' } } }
      const msg = action('data')
      reducer(initialState, msg, initialState)
      expect(a).toHaveBeenCalledWith(initialState.simple, msg, initialState)
      expect(b).toHaveBeenCalledWith(initialState.parent.child, msg, initialState)
    })
  })
})
