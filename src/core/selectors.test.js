import { getIn } from '@hon2a/icepick-fp'

import { createSelector, combineSelectors } from './selectors'

describe('selectors', () => {
  describe('createSelector', () => {
    it('leaves a function untouched', () => {
      const selector = state => state.foobar
      expect(createSelector(selector)).toBe(selector)
    })

    it('turns path into a selector', () => {
      const state = { foo: { bar: 'BAR' } }
      expect(createSelector('foo.bar')(state)).toEqual('BAR')
      expect(createSelector(['foo', 'bar'])(state)).toEqual('BAR')
    })
  })

  describe('combineSelectors', () => {
    it('combines a map of selectors', () => {
      const selector = combineSelectors({
        a: getIn('fo.o'),
        b: getIn('bar')
      })
      expect(selector({ fo: { o: 'FOO' }, bar: 'BAR' })).toEqual({ a: 'FOO', b: 'BAR' })
    })
  })
})
