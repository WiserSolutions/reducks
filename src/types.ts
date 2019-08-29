import { Reducer, Action } from 'redux'
import { Saga } from 'redux-saga'

export type Path = string | string[]

export type ActionType = string
export interface AsyncActionType {
  PENDING: string,
  SUCCESS: string,
  FAILURE: string
}
export interface Message extends Action {
  type: ActionType,
  payload?: any,
  meta?: any
}

export type Selector<State = any, Selection = any> = (state: State) => Selection

export interface Duck<State> {
  reducer?: Reducer<State>,
  saga?: Saga
}