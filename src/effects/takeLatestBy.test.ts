import { arrayOfDeferred } from '@redux-saga/deferred'

import { messageOfType, runSagaWithActions } from '../test'
import { takeLatestBy } from './takeLatestBy'
import { ActionType, Message } from '../types'

describe('takeLatestBy', () => {
  it('takes latest separately per key', async () => {
    const TYPE = 'TEST_TYPE'
    type TestMessage = Message<typeof TYPE, { id: number; data: string }>
    const args = ['foo', 'bar']
    const message = messageOfType(TYPE)
    const defs = arrayOfDeferred(3)
    let workerIdx = 0
    const finished: { id: number; data: string; args: any[]; result: string }[] = []
    function* worker({ payload: { id, data } }: TestMessage, arg1: string, arg2: string) {
      const def = defs[workerIdx++]
      const result = yield def.promise
      finished.push({ id, data, args: [arg1, arg2], result })
    }
    await runSagaWithActions(
      function*() {
        yield takeLatestBy<ActionType, (message: TestMessage, ...args: string[]) => any>(
          TYPE,
          ({ payload: { id } }) => id,
          worker,
          ...args
        )
      },
      undefined,
      message({ id: 1, data: 'A' }),
      message({ id: 2, data: 'B' }),
      { type: 'OTHER_TYPE', payload: { foo: 'bar' } },
      message({ id: 1, data: 'C' })
    )

    await defs.forEach(({ resolve }, idx) => resolve(`result-${idx + 1}`))

    expect(finished).toEqual([
      { id: 2, data: 'B', args, result: 'result-2' },
      { id: 1, data: 'C', args, result: 'result-3' }
    ])
  })
})
