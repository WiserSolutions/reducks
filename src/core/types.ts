import { ActionType, AsyncActionType } from '../types'

const typeRegistry: ActionType[] = []

export function defineType<T extends ActionType>(type: T): T {
  if (typeRegistry.includes(type)) {
    throw new Error(`Action type "${type}" is already registered!`)
  }
  typeRegistry.push(type)
  return type
}

export const defineAsyncType = (base: string): AsyncActionType => ({
  PENDING: defineType(`${base}.PENDING`),
  SUCCESS: defineType(`${base}.SUCCESS`),
  FAILURE: defineType(`${base}.FAILURE`)
})
