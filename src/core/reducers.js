import mapValues from 'lodash.mapvalues'
import isPlainObject from 'lodash.isplainobject'
import { assign } from '@hon2a/icepick-fp'

export function composeReducers(...reducers) {
  return (state, ...args) => reducers.reduceRight((acc, reducer) => reducer(acc, ...args), state)
}

export function combineReducers(reducers) {
  const resolvedReducers = mapValues(reducers, reducer => (isPlainObject(reducer) ? combineReducers(reducer) : reducer))
  return (state = {}, ...args) =>
    assign(mapValues(resolvedReducers, (reducer, key) => reducer(state[key], ...args)))(state)
}
