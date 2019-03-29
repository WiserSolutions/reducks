import toPath from 'lodash.topath'
import flowRight from 'lodash.flowright'
import flatten from 'lodash.flatten'
import { getIn, updateIn } from '@hon2a/icepick-fp'

import { defineAsyncType, defineType } from './types'
import { createAction } from './actions'
import { createSelector } from './selectors'
import { composeDucks } from './ducks'

const keepReference = dest => factory => (...args) => {
  const instance = factory(...args)
  dest.push(instance)
  return instance
}

export function createDuckFactory(path) {
  const normalizedPath = toPath(path)
  const normalizedPathString = normalizedPath.join('.')
  const prefixType = type => `${normalizedPathString}.${type}`
  const selector = getIn(normalizedPath)
  const getPath = subPath => [...normalizedPath, ...(subPath ? toPath(subPath) : [])]

  const createdDucks = []
  const createdChildren = []

  // verbose API
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
    createDuck: keepReference(createdDucks)(genericDuck => genericDuck(duckFactory)),
    createSagaDuck: keepReference(createdDucks)(saga => ({ saga })),
    createNestedFactory: keepReference(createdChildren)(subPath => createDuckFactory(getPath(subPath))),
    collectCreatedDucks: () => flatten([createdDucks, ...createdChildren.map(child => child.collectCreatedDucks())]),
    collectAndComposeCreatedDucks: () => composeDucks(...duckFactory.collectCreatedDucks())
  }

  // terse API
  Object.assign(duckFactory, {
    type: duckFactory.defineType,
    asyncType: duckFactory.defineAsyncType,
    action: duckFactory.createAction,
    reducer: duckFactory.createReducer,
    selector: duckFactory.createSelector,
    path: duckFactory.getPath,
    duck: duckFactory.createDuck,
    saga: duckFactory.createSagaDuck,
    nest: duckFactory.createNestedFactory,
    collect: duckFactory.collectAndComposeCreatedDucks
  })

  return duckFactory
}

export const ducks = createDuckFactory
