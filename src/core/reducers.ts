import mapValues from 'lodash.mapvalues'
import isPlainObject from 'lodash.isplainobject'
import { assign } from '@hon2a/icepick-fp'

export function composeReducers(...reducers) {
  return (state, action) => reducers.reduceRight((acc, reducer) => reducer(acc, action), state)
}

export function combineReducers(reducers) {
  const resolvedReducers = mapValues(reducers, reducer => (isPlainObject(reducer) ? combineReducers(reducer) : reducer))
  return (state = {}, action) =>
    assign(mapValues(resolvedReducers, (reducer, key) => reducer(state[key], action)))(state)
}
