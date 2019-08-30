import { Reducer } from 'redux'

import { ActionType, Message } from '../types'

export function singleActionReducer<State = unknown, Type extends ActionType = ActionType>(
  type: Type,
  reduce?: (state: State | undefined, message: Message<Type>) => State,
  initialValue?: State
): Reducer<State, Message> {
  return (state = initialValue, message): State => {
    if (message.type === type) {
      return reduce ? reduce(state, message as Message<Type>) : (message.payload as State)
    }
    return state as State
  }
}
