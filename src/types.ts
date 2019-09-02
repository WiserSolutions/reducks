import { Reducer, Action, AnyAction } from 'redux'
import { Saga } from 'redux-saga'

import { createAction, defineAsyncType } from './core'

export type Path = string | string[]

export type ActionType = string
export enum AsyncActionTypeKey {
  Pending = 'PENDING',
  Success = 'SUCCESS',
  Failure = 'FAILURE'
}
export interface AsyncActionType {
  [AsyncActionTypeKey.Pending]: ActionType
  [AsyncActionTypeKey.Success]: ActionType
  [AsyncActionTypeKey.Failure]: ActionType
}

export interface Message<Type extends ActionType = ActionType, Payload = unknown, Meta = any> extends Action {
  type: Type
  payload: Payload
  meta?: Meta
}
export type AnyMessage = AnyAction
export interface AsyncActionMeta<TriggerMessage> {
  trigger: TriggerMessage
}
export type MessageCreator<
  Type extends ActionType = ActionType,
  Input extends any[] = any[],
  Payload = unknown,
  Meta = unknown
> = (...args: Input) => Message<Type, Payload, Meta>

export type Selector<State = any, Selection = any> = (state: State) => Selection

export interface Duck<GlobalState extends { [key: string]: any } = {}> {
  reducer?: Reducer<GlobalState>
  saga?: Saga
  [key: string]: any
}
export interface DuckFactoryVerbose<GlobalState extends object = any, LocalState = any> {
  defineType: (type: string) => string
  defineAsyncType: typeof defineAsyncType
  createAction: typeof createAction
  createReducer: (reducer: Reducer<LocalState>) => Reducer<GlobalState>
  createSelector: <Selection>(selector?: Selector<LocalState, Selection>) => Selector<GlobalState, Selection>
  getPath: (path: Path) => string[]
  createDuck: (factory: DuckFactory<GlobalState, LocalState>) => Duck<GlobalState>
  createSagaDuck: (saga: Saga) => Duck<GlobalState>
  createNestedFactory: <SubState>(subPath: Path) => DuckFactory<GlobalState, SubState>
  collectCreatedDucks: () => Duck<GlobalState>[]
  collectAndComposeCreatedDucks: () => Duck<GlobalState>
}
export interface DuckFactoryTerse<GlobalState extends object = any, LocalState = any> {
  type: (type: string) => string
  asyncType: typeof defineAsyncType
  action: typeof createAction
  reducer: (reducer: Reducer<LocalState>) => Reducer<GlobalState>
  selector: <Selection>(selector?: Selector<LocalState, Selection>) => Selector<GlobalState, Selection>
  path: (path: Path) => string[]
  duck: (factory: DuckFactory<GlobalState, LocalState>) => Duck<GlobalState>
  saga: (saga: Saga) => Duck<GlobalState>
  nest: <SubState>(subPath: Path) => DuckFactory<GlobalState, SubState>
  collect: () => Duck<GlobalState>
}
export type DuckFactory<GlobalState extends object = any, LocalState = any> = DuckFactoryVerbose<
  GlobalState,
  LocalState
> &
  DuckFactoryTerse<GlobalState, LocalState>
