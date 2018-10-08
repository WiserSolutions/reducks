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
  return duckFactory
}

export const terseApi = ({
  defineType: type,
  defineAsyncType: asyncType,
  createAction: action,
  createReducer: reducer,
  createSelector: selector,
  getPath: path,
  createDuck: duck,
  createNestedFactory
}) => ({
  type,
  asyncType,
  action,
  reducer,
  selector,
  path,
  duck,
  nest: flowRight(
    terseApi,
    createNestedFactory
  )
})

export function ducks(path) {
  return terseApi(createDuckFactory(path))
}
