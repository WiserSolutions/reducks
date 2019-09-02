import { Reducer, Action, AnyAction } from 'redux'
import { Saga } from 'redux-saga'

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

export type Selector<State = unknown, Selection = unknown> = (state: State) => Selection

export interface Duck<State = unknown> {
  reducer?: Reducer<State>
  saga?: Saga
}
