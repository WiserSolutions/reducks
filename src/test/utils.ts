import { createAction } from '../core'
import { ActionType, Message } from '../types'

export const message = <Type extends ActionType = ActionType, Payload = any, Meta = any>(
  type: Type,
  payload?: Payload,
  meta?: Meta
): Message<Type, Payload, Meta> => createAction(type, () => payload, () => meta)()
