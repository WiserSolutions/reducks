import { runSagaWithActions } from '../test'
import { takeOne, composeSagas } from './sagas'

const mockGenerator = (...values) =>
  jest.fn().mockImplementation(() => ({ next: () => ({ done: !values.length, value: values.shift() }) }))

describe('sagas', () => {
  describe('takeOne', () => {
    it('takes just the first action of a type', async () => {
      const action = { type: 'TEST_ACTION', payload: ['foobar', 123] }
      const fn = mockGenerator()

      await runSagaWithActions(
        function*() {
          yield takeOne(action.type, fn)
        },
        () => {},
        { type: 'OTHER_ACTION' },
        action,
        { ...action, payload: 'other payload' }
      )

      expect(fn).toHaveBeenCalledTimes(1)
      expect(fn).toHaveBeenCalledWith(action)
    })
  })

  describe('composeSagas', () => {
    it('composes sagas', async () => {
      // include a saga yielding unresolved promise to check that it's not blocking
      const sagas = [mockGenerator(new Promise(() => {})), ...[0, 1].map(mockGenerator)]

      await runSagaWithActions(composeSagas(...sagas))

      sagas.forEach(saga => expect(saga).toHaveBeenCalledTimes(1))
    })
  })
})
