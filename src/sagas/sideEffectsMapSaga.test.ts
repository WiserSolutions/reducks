import { sideEffectsMapSaga } from './sideEffectsMapSaga'
import { message, runSagaWithActions } from '../test'

describe('asyncActionSaga', () => {
  const FIRST_TYPE = 'FIRST_TYPE'
  const SECOND_TYPE = 'SECOND_TYPE'
  const effect = jest.fn()
  const saga = sideEffectsMapSaga({
    [FIRST_TYPE]: () => effect('first'),
    [SECOND_TYPE]: (payload, action, state) => effect('second', payload, action, state)
  })
  const state = { dummy: 'state' }

  beforeEach(() => {
    effect.mockReset()
  })

  it('maps actions to side-effect calls', async () => {
    const action = { type: SECOND_TYPE, payload: 'test payload' }
    await runSagaWithActions(saga, () => state, message(FIRST_TYPE), message('IGNORED'), action)
    expect(effect.mock.calls).toEqual([['first'], ['second', action.payload, action, state]])
  })
})
