import { ActionType } from '../types'

export const createAction = <
  Type extends ActionType = ActionType,
  Input extends any[] = any[],
  Payload = unknown,
  Meta = unknown
>(
  type: Type,
  getPayload?: (...args: Input) => Payload,
  getMeta?: (...args: Input) => Meta
) => (...args: Input) => ({
  type,
  payload: getPayload ? getPayload(...args) : args[0],
  meta: getMeta ? getMeta(...args) : undefined
})
