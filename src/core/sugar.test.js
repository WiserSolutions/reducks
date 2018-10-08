import { assocIn } from '@hon2a/icepick-fp'

import { createDuckFactory, terseApi } from './sugar'

const path = 'test.path'
const subPath = 'sub.path'
const state = { test: { path: { foo: 'bar' } } }
const TEST_TYPE = 'TEST_TYPE'
const action = { type: TEST_TYPE }

describe('sugar', () => {
  describe('createDuckFactory', () => {
    it('provides prefixed action creators', () => {
      const { defineType, defineAsyncType } = createDuckFactory(path)
      expect(defineType(TEST_TYPE)).toEqual(`${path}.${TEST_TYPE}`)
      expect(defineAsyncType(TEST_TYPE)).toEqual({
        PENDING: `${path}.${TEST_TYPE}.PENDING`,
        SUCCESS: `${path}.${TEST_TYPE}.SUCCESS`,
        FAILURE: `${path}.${TEST_TYPE}.FAILURE`
      })
    })

    it('provides nested selector creator', () => {
      const { createSelector } = createDuckFactory(path)
      expect(createSelector(({ foo }) => foo)(state)).toEqual('bar')
      // support string selector shorthand
      expect(createSelector('foo')(state)).toEqual('bar')
    })

    it('provides nested reducer creator', () => {
      const { createReducer } = createDuckFactory(path)
      expect(createReducer((prev, act) => ({ foo: { ...prev, action: act } }))(state, action)).toEqual({
        test: { path: { foo: { foo: 'bar', action } } }
      })
    })

    it('provides nested path getter', () => {
      const { getPath } = createDuckFactory(path)
      expect(getPath(subPath)).toEqual(['test', 'path', 'sub', 'path'])
    })

    it('provides generic duck resolver', () => {
      const duckFactory = createDuckFactory(path)
      const duck = {}
      const genericDuck = jest.fn(() => duck)
      expect(duckFactory.createDuck(genericDuck)).toBe(duck)
      expect(genericDuck).toHaveBeenCalledWith(duckFactory)
    })

    it('provides nested duck factory creator', () => {
      const { createNestedFactory } = createDuckFactory(path)
      const { defineType, createSelector, createReducer, getPath } = createNestedFactory(subPath)
      expect(defineType('TEST_TYPE')).toEqual(`${path}.${subPath}.TEST_TYPE`)
      const deepState = { test: { path: { sub: { path: { baz: 'BAZ' } } } } }
      const selector = createSelector('baz')
      expect(selector(deepState)).toEqual('BAZ')
      expect(createReducer((prev, act) => ({ prev, action: act }))(deepState, action)).toEqual(
        assocIn(`${path}.${subPath}`, { prev: { baz: 'BAZ' }, action })(deepState)
      )
      expect(getPath('baz')).toEqual(['test', 'path', 'sub', 'path', 'baz'])
    })
  })

  describe('terseApi', () => {
    it('wraps `createDuckFactory` output in a less verbose API', () => {
      const duckFactory = createDuckFactory(path)
      const { type, asyncType, reducer, selector, path: getPath, duck, nest } = terseApi(duckFactory)
      expect(type).toBe(duckFactory.defineType)
      expect(asyncType).toBe(duckFactory.defineAsyncType)
      expect(reducer).toBe(duckFactory.createReducer)
      expect(selector).toBe(duckFactory.createSelector)
      expect(getPath).toBe(duckFactory.getPath)
      expect(duck).toBe(duckFactory.createDuck)
      // try to check that the nested factory is also wrapped
      const nestedDuckFactory = nest(subPath)
      expect(nestedDuckFactory.type).toBeDefined()
      expect(nestedDuckFactory.defineType).not.toBeDefined()
      expect(nest(subPath).path('baz')).toEqual(['test', 'path', 'sub', 'path', 'baz'])
    })
  })
})
