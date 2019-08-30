import { createAction } from '../core'
import { ActionType, Message } from '../types'

export const messageOfType = <Type extends ActionType = ActionType>(type: Type) => <Payload = any, Meta = any>(
  payload?: Payload,
  meta?: Meta
): Message<Type, Payload, Meta> => createAction(type, () => payload, () => meta)()

export const message = <Type extends ActionType = ActionType, Payload = any, Meta = any>(
  type: Type,
  payload?: Payload,
  meta?: Meta
): Message<Type, Payload, Meta> => messageOfType(type)(payload, meta)
