import { arrayOfDeferred } from '@redux-saga/deferred'

import { runSagaWithActions } from '../test'
import { takeLatestBy } from './takeLatestBy'

describe('takeLatestBy', () => {
  it('takes latest separately per key', async () => {
    const TYPE = 'TEST_TYPE'
    const args = ['foo', 'bar']
    const action = (id, data) => ({ type: TYPE, payload: { id, data } })
    const defs = arrayOfDeferred(3)
    let workerIdx = 0
    const finished = []
    function* worker(arg1, arg2, { payload: { id, data } }) {
      const def = defs[workerIdx++]
      const result = yield def.promise
      finished.push({ id, data, args: [arg1, arg2], result })
    }
    await runSagaWithActions(
      function*() {
        yield takeLatestBy([TYPE], ({ payload: { id } }) => id, worker, ...args)
      },
      undefined,
      action(1, 'A'),
      action(2, 'B'),
      { type: 'OTHER_TYPE', payload: { foo: 'bar' } },
      action(1, 'C')
    )

    await defs.forEach(({ resolve }, idx) => resolve(`result-${idx + 1}`))

    expect(finished).toEqual([
      { id: 2, data: 'B', args, result: 'result-2' },
      { id: 1, data: 'C', args, result: 'result-3' }
    ])
  })
})
