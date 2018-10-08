import { createAction } from './actions'

const TEST_TYPE = 'TEST_TYPE'

describe('actions', () => {
  describe('createAction', () => {
    it('creates a simple (empty) action creator', () => {
      const actionCreator = createAction(TEST_TYPE)
      expect(actionCreator()).toEqual({ type: TEST_TYPE })
    })

    it('creates an action creator with payload', () => {
      const actionCreator = createAction(TEST_TYPE, arg => `foo${arg}`)
      expect(actionCreator('bar')).toEqual({ type: TEST_TYPE, payload: 'foobar' })
    })

    it('creates an action creator with payload and meta', () => {
      const actionCreator = createAction(TEST_TYPE, arg => `foo${arg}`, arg => `${arg}baz`)
      expect(actionCreator('bar')).toEqual({ type: TEST_TYPE, payload: 'foobar', meta: 'barbaz' })
    })
  })
})
