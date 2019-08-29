import { Reducer, Action } from 'redux'
import { Saga } from 'redux-saga'

export type Path = string | string[]

export type ActionType = string
export interface AsyncActionType {
  PENDING: string
  SUCCESS: string
  FAILURE: string
}
export interface Message<Payload = unknown, Meta = undefined> extends Action {
  type: ActionType
  payload?: Payload
  meta?: Meta
}

export type Selector<State = unknown, Selection = unknown> = (state: State) => Selection

export interface Duck<State = unknown> {
  reducer?: Reducer<State>
  saga?: Saga
}
