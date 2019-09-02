import toPath from 'lodash.topath'
import flowRight from 'lodash.flowright'
import flatten from 'lodash.flatten'
import { getIn, updateIn } from '@hon2a/icepick-fp'

import { defineAsyncType, defineType } from './types'
import { createAction } from './actions'
import { createSelector } from './selectors'
import { composeDucks } from './ducks'
import { ActionType, Duck, DuckFactory, DuckFactoryTerse, DuckFactoryVerbose, Path } from '../types'

const keepReference = <T, Args extends any[]>(dest: T[]) => (factory: (...args: Args) => T) => (...args: Args) => {
  const instance = factory(...args)
  dest.unshift(instance)
  return instance
}

export function createDuckFactory<GlobalState extends object, LocalState>(
  path: Path
): DuckFactory<GlobalState, LocalState> {
  const normalizedPath = toPath(path)
  const normalizedPathString = normalizedPath.join('.')
  const prefixType = (type: ActionType): ActionType => `${normalizedPathString}.${type}`
  const selector = getIn(normalizedPath)
  const getPath = (subPath: Path) => [...normalizedPath, ...(subPath ? toPath(subPath) : [])]

  const createdDucks: Duck<GlobalState>[] = []
  const createdChildren: DuckFactory<GlobalState, any>[] = []

  let duckFactory: DuckFactory<GlobalState, LocalState>
  const verboseApi: DuckFactoryVerbose<GlobalState, LocalState> = {
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
    createReducer: reducer => (state = {} as GlobalState, action) =>
      updateIn(normalizedPath, (subState: LocalState) => reducer(subState, action))(state),
    getPath,
    createDuck: keepReference(createdDucks)(genericDuck => genericDuck(duckFactory)),
    createSagaDuck: keepReference(createdDucks)(saga => ({ saga })),
    createNestedFactory: keepReference(createdChildren)(subPath => createDuckFactory(getPath(subPath))),
    collectCreatedDucks: () => flatten([createdDucks, ...createdChildren.map(child => child.collectCreatedDucks())]),
    collectAndComposeCreatedDucks: () => composeDucks(...duckFactory.collectCreatedDucks())
  }
  const terseApi: DuckFactoryTerse<GlobalState, LocalState> = {
    type: verboseApi.defineType,
    asyncType: verboseApi.defineAsyncType,
    action: verboseApi.createAction,
    reducer: verboseApi.createReducer,
    selector: verboseApi.createSelector,
    path: verboseApi.getPath,
    duck: verboseApi.createDuck,
    saga: verboseApi.createSagaDuck,
    nest: verboseApi.createNestedFactory,
    collect: verboseApi.collectAndComposeCreatedDucks
  }
  duckFactory = { ...verboseApi, ...terseApi }
  return duckFactory
}

export const ducks = createDuckFactory
