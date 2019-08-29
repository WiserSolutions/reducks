import { defineType, defineAsyncType } from './types'

describe('redux action helpers', () => {
  describe('defineType', () => {
    it('returns the passed type unchanged', () => {
      const type = 'TEST_TYPE'
      expect(defineType(type)).toBe(type)
    })

    it('throws when trying to register the same type twice', () => {
      // use different constant than in the previous test, the registry is a singleton
      const type = 'ANOTHER_TYPE'
      defineType(type)
      expect(() => defineType(type)).toThrow()
    })
  })

  describe('defineAsyncType', () => {
    it('returns the expanded async type object', () => {
      const type = 'ASYNC_TYPE'
      expect(defineAsyncType(type)).toEqual({
        PENDING: `${type}.PENDING`,
        SUCCESS: `${type}.SUCCESS`,
        FAILURE: `${type}.FAILURE`
      })
    })

    it('throws when trying to register the same type twice', () => {
      // use different constant than in the previous test, the registry is a singleton
      const type = 'ANOTHER_ASYNC_TYPE'
      defineType(type)
      expect(() => defineType(type)).toThrow()
    })
  })
})
