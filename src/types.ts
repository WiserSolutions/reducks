import { Reducer, Action, AnyAction } from 'redux'
import { Saga } from 'redux-saga'

export type Path = string | string[]

export type ActionType = string
export interface AsyncActionType {
  PENDING: string
  SUCCESS: string
  FAILURE: string
}
export interface Message<Type extends ActionType = ActionType, Payload = unknown, Meta = undefined> extends Action {
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
