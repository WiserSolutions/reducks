import { resolve } from './helpers'

describe('helpers', () => {
  describe('resolve', () => {
    it('resolves a getter', () => {
      expect(resolve((a, b) => ({ a, b }))('foo', 123)).toEqual({ a: 'foo', b: 123 })
    })

    it('returns a constant unchanged', () => {
      const constant = { constant: 'value' }
      expect(resolve(constant)()).toBe(constant)
    })
  })
})
