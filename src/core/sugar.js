import toPath from 'lodash.topath'
import flowRight from 'lodash.flowright'
import { getIn, updateIn } from '@hon2a/icepick-fp'

import { defineAsyncType, defineType } from './types'
import { createAction } from './actions'
import { createSelector } from './selectors'

export function createDuckFactory(path) {
  const normalizedPath = toPath(path)
  const normalizedPathString = normalizedPath.join('.')
  const prefixType = type => `${normalizedPathString}.${type}`
  const selector = getIn(normalizedPath)
  const getPath = subPath => [...normalizedPath, ...toPath(subPath)]
  const duckFactory = {
    defineType: flowRight(
      defineType,
      prefixType
    ),
    defineAsyncType: flowRight(
      defineAsyncType,
      prefixType
    ),
    createAction,
    createSelector: subSelector =>
      subSelector
        ? flowRight(
            createSelector(subSelector),
            selector
          )
        : selector,
    createReducer: reducer => (state = {}, action) =>
      updateIn(normalizedPath, subState => reducer(subState, action))(state),
    getPath,
    createDuck: genericDuck => genericDuck(duckFactory),
    createNestedFactory: subPath => createDuckFactory(getPath(subPath))
  }
  // add terse API
  Object.assign(duckFactory, {
    type: duckFactory.defineType,
    asyncType: duckFactory.defineAsyncType,
    action: duckFactory.createAction,
    reducer: duckFactory.createReducer,
    selector: duckFactory.createSelector,
    path: duckFactory.getPath,
    duck: duckFactory.createDuck,
    nest: duckFactory.createNestedFactory
  })
  return duckFactory
}
