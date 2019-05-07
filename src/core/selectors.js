import mapValues from 'lodash.mapvalues'
import isFunction from 'lodash.isfunction'
import isArray from 'lodash.isarray'
import isString from 'lodash.isstring'
import { getIn } from '@hon2a/icepick-fp'

export function createSelector(selector) {
  if (isFunction(selector)) {
    return selector
  }
  if (isString(selector) || isArray(selector)) {
    return getIn(selector)
  }
  throw new Error(`"${selector}" is not a valid selector!`)
}

export const combineSelectors = selectorMap => (state, ownProps) => mapValues(selectorMap, selector => selector(state, ownProps))
