import { createDuckFactory } from '../core'
import { asyncActionStatusSelector } from './asyncActionStatusSelector'

describe('asyncActionStatusSelector', () => {
  it('select async action status', () => {
    const duckFactory = createDuckFactory('test.path')
    const selector = asyncActionStatusSelector(duckFactory)
    const error = { some: 'error' }
    expect(selector({ test: { path: { foo: 'bar', isPending: true, error, a: 1234 } }, b: 789 })).toEqual({
      isPending: true,
      error
    })
  })
})
